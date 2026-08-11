import request from 'supertest';
import app from '../app';
import prisma from '../config/db';
import bcrypt from 'bcryptjs';

describe('Mini ERP + CRM Integration Tests', () => {
  let adminToken: string;
  let salesToken: string;
  let testCustomerId: string;
  let testProductId: string;

  beforeAll(async () => {
    // Clean database before tests
    await prisma.challanItem.deleteMany({});
    await prisma.stockMovement.deleteMany({});
    await prisma.challan.deleteMany({});
    await prisma.followUp.deleteMany({});
    await prisma.customer.deleteMany({});
    await prisma.product.deleteMany({});
    await prisma.user.deleteMany({});

    // Create test admin and sales users
    const passwordHash = await bcrypt.hash('password', 10);
    await prisma.user.createMany({
      data: [
        {
          name: 'Admin Test',
          email: 'admintest@example.com',
          passwordHash,
          role: 'ADMIN',
        },
        {
          name: 'Sales Test',
          email: 'salestest@example.com',
          passwordHash,
          role: 'SALES',
        },
      ],
    });

    // Acquire Admin Token
    const adminLoginRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admintest@example.com', password: 'password' });
    adminToken = adminLoginRes.body.data.token;

    // Acquire Sales Token
    const salesLoginRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'salestest@example.com', password: 'password' });
    salesToken = salesLoginRes.body.data.token;
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe('1. Authentication Tests', () => {
    it('should successfully log in with valid credentials', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'admintest@example.com', password: 'password' });
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('token');
      expect(res.body.data.user.role).toBe('ADMIN');
    });

    it('should fail to log in with invalid credentials', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'admintest@example.com', password: 'wrongpassword' });
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('should block access to protected route without token', async () => {
      const res = await request(app).get('/api/auth/me');
      expect(res.status).toBe(401);
    });
  });

  describe('2. Customer CRM Tests', () => {
    it('should allow sales/admin to create customer', async () => {
      const res = await request(app)
        .post('/api/customers')
        .set('Authorization', `Bearer ${salesToken}`)
        .send({
          customerName: 'Acme Corp',
          mobileNumber: '9999999999',
          email: 'contact@acme.com',
          businessName: 'Acme Industries',
          customerType: 'WHOLESALE',
          address: '123 Industrial St',
          status: 'ACTIVE',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('id');
      testCustomerId = res.body.data.id;
    });

    it('should fetch list of customers with search and filters', async () => {
      const res = await request(app)
        .get('/api/customers?search=Acme&status=ACTIVE')
        .set('Authorization', `Bearer ${salesToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.customers.length).toBeGreaterThan(0);
      expect(res.body.data.customers[0].customerName).toBe('Acme Corp');
    });

    it('should allow updating customer lead stage and sync status with history log', async () => {
      // 1. Update stage to PROPOSAL
      const updateRes = await request(app)
        .put(`/api/customers/${testCustomerId}`)
        .set('Authorization', `Bearer ${salesToken}`)
        .send({
          leadStage: 'PROPOSAL',
        });
      expect(updateRes.status).toBe(200);
      expect(updateRes.body.data.leadStage).toBe('PROPOSAL');
      expect(updateRes.body.data.status).toBe('LEAD');

      // 2. Update stage to WON
      const updateWonRes = await request(app)
        .put(`/api/customers/${testCustomerId}`)
        .set('Authorization', `Bearer ${salesToken}`)
        .send({
          leadStage: 'WON',
        });
      expect(updateWonRes.status).toBe(200);
      expect(updateWonRes.body.data.leadStage).toBe('WON');
      expect(updateWonRes.body.data.status).toBe('ACTIVE');

      // 3. Verify stage history logs
      const historyRes = await request(app)
        .get(`/api/customers/${testCustomerId}/stage-history`)
        .set('Authorization', `Bearer ${salesToken}`);
      expect(historyRes.status).toBe(200);
      expect(historyRes.body.data.length).toBeGreaterThan(2); // NONE -> LEAD -> PROPOSAL -> WON
      expect(historyRes.body.data[0].newStage).toBe('WON');
      expect(historyRes.body.data[0].oldStage).toBe('PROPOSAL');
    });

    it('should allow logging follow-up call with contact method', async () => {
      const res = await request(app)
        .post(`/api/customers/${testCustomerId}/follow-ups`)
        .set('Authorization', `Bearer ${salesToken}`)
        .send({
          followUpDate: new Date(Date.now() + 1000 * 60 * 60).toISOString(),
          notes: 'Customer agreed on bulk pricing terms',
          contactMethod: 'MEETING',
        });
      expect(res.status).toBe(201);
      expect(res.body.data.contactMethod).toBe('MEETING');
    });

    it('should prevent SALES from deactivating/deleting customer', async () => {
      const res = await request(app)
        .delete(`/api/customers/${testCustomerId}`)
        .set('Authorization', `Bearer ${salesToken}`);

      expect(res.status).toBe(403);
    });

    it('should allow ADMIN to deactivate/deleting customer and log LOST stage', async () => {
      const res = await request(app)
        .delete(`/api/customers/${testCustomerId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe('INACTIVE');
      expect(res.body.data.leadStage).toBe('LOST');

      const historyRes = await request(app)
        .get(`/api/customers/${testCustomerId}/stage-history`)
        .set('Authorization', `Bearer ${adminToken}`);
      expect(historyRes.body.data[0].newStage).toBe('LOST');
    });
  });

  describe('3. Product Module Tests', () => {
    it('should allow ADMIN to create product', async () => {
      const res = await request(app)
        .post('/api/products')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Gaming Mouse',
          sku: 'MSE-GAM-RGB',
          category: 'Electronics',
          unitPrice: 1200,
          currentStock: 5,
          minimumStock: 10, // LOW STOCK
          warehouseLocation: 'Shelf Z-9',
        });

      expect(res.status).toBe(201);
      expect(res.body.data.sku).toBe('MSE-GAM-RGB');
      testProductId = res.body.data.id;
    });

    it('should throw conflict error for duplicate SKU', async () => {
      const res = await request(app)
        .post('/api/products')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Gaming Mouse 2',
          sku: 'MSE-GAM-RGB', // Duplicate SKU
          category: 'Electronics',
          unitPrice: 1500,
          currentStock: 10,
          minimumStock: 5,
          warehouseLocation: 'Shelf Z-9',
        });

      expect(res.status).toBe(409);
      expect(res.body.success).toBe(false);
    });

    it('should show product as LOW STOCK if stock is below minimum', async () => {
      const res = await request(app)
        .get(`/api/products/${testProductId}`)
        .set('Authorization', `Bearer ${salesToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe('LOW STOCK');
      expect(res.body.data.isLowStock).toBe(true);
    });
  });

  describe('4. Sales Challan Workflow & Transactional Logic', () => {
    it('should create draft challan and NOT decrease stock', async () => {
      // Current stock is 5
      const res = await request(app)
        .post('/api/challans')
        .set('Authorization', `Bearer ${salesToken}`)
        .send({
          customerId: testCustomerId,
          status: 'DRAFT',
          items: [
            {
              productId: testProductId,
              quantity: 10, // Exceeds stock (5), but draft is fine!
            },
          ],
        });

      expect(res.status).toBe(201);
      expect(res.body.data.status).toBe('DRAFT');

      // Verify stock is still 5
      const productRes = await prisma.product.findUnique({ where: { id: testProductId } });
      expect(productRes?.currentStock).toBe(5);
    });

    it('should fail to confirm a challan if requested quantity exceeds current stock and rollback transaction', async () => {
      // 1. Create a draft challan requesting 10 items (stock is only 5)
      const createRes = await request(app)
        .post('/api/challans')
        .set('Authorization', `Bearer ${salesToken}`)
        .send({
          customerId: testCustomerId,
          status: 'DRAFT',
          items: [
            {
              productId: testProductId,
              quantity: 10, // Stock is 5
            },
          ],
        });
      const draftChallanId = createRes.body.data.id;

      // 2. Confirming this draft must FAIL
      const confirmRes = await request(app)
        .post(`/api/challans/${draftChallanId}/confirm`)
        .set('Authorization', `Bearer ${salesToken}`);

      expect(confirmRes.status).toBe(400);
      expect(confirmRes.body.success).toBe(false);
      expect(confirmRes.body.message).toContain('Insufficient stock');

      // 3. CRITICAL VERIFICATION: Stock MUST remain unchanged (5)
      const productRes = await prisma.product.findUnique({ where: { id: testProductId } });
      expect(productRes?.currentStock).toBe(5);

      // Verify challan status is still DRAFT
      const challanRes = await prisma.challan.findUnique({ where: { id: draftChallanId } });
      expect(challanRes?.status).toBe('DRAFT');
    });

    it('should successfully confirm challan when stock is sufficient, reduce stock, and record stock movement', async () => {
      // 1. Create a draft challan requesting 2 items (stock is 5)
      const createRes = await request(app)
        .post('/api/challans')
        .set('Authorization', `Bearer ${salesToken}`)
        .send({
          customerId: testCustomerId,
          status: 'DRAFT',
          items: [
            {
              productId: testProductId,
              quantity: 2,
            },
          ],
        });
      const draftChallanId = createRes.body.data.id;

      // 2. Confirm the challan
      const confirmRes = await request(app)
        .post(`/api/challans/${draftChallanId}/confirm`)
        .set('Authorization', `Bearer ${salesToken}`);

      expect(confirmRes.status).toBe(200);
      expect(confirmRes.body.data.status).toBe('CONFIRMED');

      // 3. Verify stock has reduced to 3 (5 - 2)
      const productRes = await prisma.product.findUnique({ where: { id: testProductId } });
      expect(productRes?.currentStock).toBe(3);

      // 4. Verify stock movement of type OUT was logged
      const movement = await prisma.stockMovement.findFirst({
        where: {
          productId: testProductId,
          movementType: 'OUT',
          reason: { contains: confirmRes.body.data.challanNumber },
        },
      });
      expect(movement).toBeDefined();
      expect(movement?.quantityChanged).toBe(2);
    });

    it('should restore stock and create IN stock movement when confirmed challan is cancelled', async () => {
      // Current stock is 3, confirmed challan had 2 items
      const activeChallan = await prisma.challan.findFirst({
        where: { status: 'CONFIRMED', customerId: testCustomerId },
        orderBy: { createdAt: 'desc' },
      });
      expect(activeChallan).toBeDefined();

      const cancelRes = await request(app)
        .post(`/api/challans/${activeChallan!.id}/cancel`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(cancelRes.status).toBe(200);
      expect(cancelRes.body.data.status).toBe('CANCELLED');

      // Stock must be restored to 5 (3 + 2)
      const productRes = await prisma.product.findUnique({ where: { id: testProductId } });
      expect(productRes?.currentStock).toBe(5);

      // Verify stock movement of type IN was logged for cancellation
      const movement = await prisma.stockMovement.findFirst({
        where: {
          productId: testProductId,
          movementType: 'IN',
          reason: { contains: 'Cancelled Challan' },
        },
      });
      expect(movement).toBeDefined();
      expect(movement?.quantityChanged).toBe(2);
    });
  });
});
