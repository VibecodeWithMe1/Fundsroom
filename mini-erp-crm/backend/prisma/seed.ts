import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Start seeding...');

  // 1. Clean existing records (be careful in production, but fine for fresh seeds)
  await prisma.challanItem.deleteMany({});
  await prisma.stockMovement.deleteMany({});
  await prisma.challan.deleteMany({});
  await prisma.followUp.deleteMany({});
  await prisma.customer.deleteMany({});
  await prisma.product.deleteMany({});
  await prisma.user.deleteMany({});

  const adminPasswordHash = await bcrypt.hash('Kamlakant@9584', 10);
  const salesPasswordHash = await bcrypt.hash('Jitendra@9584', 10);
  const warehousePasswordHash = await bcrypt.hash('Keshav@9584', 10);
  const accountsPasswordHash = await bcrypt.hash('Chandan@9584', 10);

  // 2. Create operational users for each role
  const admin = await prisma.user.create({
    data: {
      name: 'System Administrator',
      email: 'kumarkamlakant46@gmail.com',
      passwordHash: adminPasswordHash,
      role: 'ADMIN',
    },
  });

  const sales = await prisma.user.create({
    data: {
      name: 'Jitendra sharma',
      email: 'jitendrasharma19@gmail.com',
      passwordHash: salesPasswordHash,
      role: 'SALES',
    },
  });

  const warehouse = await prisma.user.create({
    data: {
      name: 'Keshav samdarshi',
      email: 'keshavsamdarshi98@gmail.com',
      passwordHash: warehousePasswordHash,
      role: 'WAREHOUSE',
    },
  });

  const accounts = await prisma.user.create({
    data: {
      name: 'Chandan suryavanshi',
      email: 'chandansuryavanshi80@gmail.com',
      passwordHash: accountsPasswordHash,
      role: 'ACCOUNTS',
    },
  });

  console.log('Users seeded successfully:', {
    admin: admin.email,
    sales: sales.email,
    warehouse: warehouse.email,
    accounts: accounts.email,
  });

  // 3. Create customers (leads, active, inactive)
  const customer1 = await prisma.customer.create({
    data: {
      customerName: 'Rahul Sharma',
      email: 'rahul@sharmatraders.com',
      mobileNumber: '9876543210',
      businessName: 'Sharma Traders & Co.',
      gstNumber: '07AAAAA1111A1Z1',
      customerType: 'DISTRIBUTOR',
      address: 'Plot 42, Sector 18, Gurugram, Haryana',
      status: 'ACTIVE',
      leadStage: 'WON',
      followUpDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // In 2 days
    },
  });

  const customer2 = await prisma.customer.create({
    data: {
      customerName: 'Priya Patel',
      email: 'priya@patelretail.com',
      mobileNumber: '9812345678',
      businessName: 'Patel Supermart',
      gstNumber: '24BBBBB2222B2Z2',
      customerType: 'RETAIL',
      address: '12 GIDC Estate, Kalol, Gandhinagar, Gujarat',
      status: 'ACTIVE',
      leadStage: 'WON',
      followUpDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // In 5 days
    },
  });

  const customer3 = await prisma.customer.create({
    data: {
      customerName: 'Amit Verma',
      email: 'amit@vermadistributors.com',
      mobileNumber: '9988776655',
      businessName: 'Verma Wholesale House',
      gstNumber: '',
      customerType: 'WHOLESALE',
      address: 'Chawri Bazar, Old Delhi, Delhi',
      status: 'LEAD',
      leadStage: 'LEAD',
      followUpDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // Yesterday (Upcoming or overdue)
    },
  });

  const customer4 = await prisma.customer.create({
    data: {
      customerName: 'John Doe',
      email: 'john@doe.com',
      mobileNumber: '8887776665',
      businessName: 'Doe Enterprise LLC',
      gstNumber: null,
      customerType: 'RETAIL',
      address: '22 Baker St, London, UK',
      status: 'INACTIVE',
      leadStage: 'LOST',
    },
  });

  console.log('Customers seeded successfully.');

  // 4. Create follow-up records
  await prisma.followUp.create({
    data: {
      customerId: customer1.id,
      notes: 'Spoke with Rahul about the bulk order. He requested a distributors discount of 15%. Will call him back on Thursday.',
      followUpDate: customer1.followUpDate!,
      createdBy: sales.id,
    },
  });

  await prisma.followUp.create({
    data: {
      customerId: customer3.id,
      notes: 'Initial introduction. Sent catalog and pricing index. Customer was highly interested in computer peripherals.',
      followUpDate: customer3.followUpDate!,
      createdBy: sales.id,
    },
  });

  console.log('Follow-ups seeded successfully.');

  // 5. Create products
  const keyboard = await prisma.product.create({
    data: {
      name: 'Mechanical Gaming Keyboard',
      sku: 'MECH-KBD-RGB',
      category: 'Electronics',
      unitPrice: 2450.0,
      currentStock: 45,
      minimumStock: 10,
      warehouseLocation: 'Shelf A-3',
    },
  });

  const mouse = await prisma.product.create({
    data: {
      name: 'Wireless Ergonomic Mouse',
      sku: 'WRLS-MSE-99',
      category: 'Electronics',
      unitPrice: 950.0,
      currentStock: 5,
      minimumStock: 15, // LOW STOCK (5 <= 15)
      warehouseLocation: 'Shelf A-4',
    },
  });

  const laptopBag = await prisma.product.create({
    data: {
      name: 'Waterproof Laptop Backpack',
      sku: 'LTP-BAG-BLK',
      category: 'Office Supplies',
      unitPrice: 1800.0,
      currentStock: 8,
      minimumStock: 10, // LOW STOCK (8 <= 10)
      warehouseLocation: 'Shelf B-1',
    },
  });

  const monitor = await prisma.product.create({
    data: {
      name: '27-inch 4K IPS Monitor',
      sku: 'MON-27-4K',
      category: 'Electronics',
      unitPrice: 22000.0,
      currentStock: 15,
      minimumStock: 5,
      warehouseLocation: 'Palette C-12',
    },
  });

  console.log('Products seeded successfully.');

  // 6. Create initial stock movement logs
  await prisma.stockMovement.createMany({
    data: [
      {
        productId: keyboard.id,
        quantityChanged: 50,
        movementType: 'IN',
        reason: 'Initial stock intake',
        createdBy: admin.id,
      },
      {
        productId: mouse.id,
        quantityChanged: 15,
        movementType: 'IN',
        reason: 'Initial stock intake',
        createdBy: admin.id,
      },
      {
        productId: mouse.id,
        quantityChanged: 10,
        movementType: 'OUT',
        reason: 'Sales order dispatch CH-000000',
        createdBy: warehouse.id,
      },
      {
        productId: laptopBag.id,
        quantityChanged: 8,
        movementType: 'IN',
        reason: 'Initial stock setup',
        createdBy: admin.id,
      },
      {
        productId: monitor.id,
        quantityChanged: 15,
        movementType: 'IN',
        reason: 'Vendor shipment purchase',
        createdBy: warehouse.id,
      },
    ],
  });

  console.log('Stock movements seeded successfully.');

  // 7. Create sample challans
  // A Confirmed Challan (reduces stock, already accounted in stock or needs confirmation)
  // Let's create a Confirmed Challan that had 5 keyboards
  const confirmedChallan = await prisma.challan.create({
    data: {
      challanNumber: 'CH-000001',
      customerId: customer1.id,
      status: 'CONFIRMED',
      totalQuantity: 5,
      totalAmount: 12250.0,
      createdBy: sales.id,
      challanItems: {
        create: [
          {
            productId: keyboard.id,
            productNameSnapshot: keyboard.name,
            skuSnapshot: keyboard.sku,
            unitPriceSnapshot: keyboard.unitPrice,
            quantity: 5,
            totalPrice: 12250.0,
          },
        ],
      },
    },
  });

  // Create StockMovement for that Confirmed Challan
  await prisma.stockMovement.create({
    data: {
      productId: keyboard.id,
      quantityChanged: 5,
      movementType: 'OUT',
      reason: `Sales Challan CH-000001`,
      createdBy: sales.id,
    },
  });

  // A Draft Challan (no stock movement, keyboard stock remains same)
  await prisma.challan.create({
    data: {
      challanNumber: 'CH-000002',
      customerId: customer2.id,
      status: 'DRAFT',
      totalQuantity: 3,
      totalAmount: 4700.0,
      createdBy: sales.id,
      challanItems: {
        create: [
          {
            productId: mouse.id,
            productNameSnapshot: mouse.name,
            skuSnapshot: mouse.sku,
            unitPriceSnapshot: mouse.unitPrice,
            quantity: 1,
            totalPrice: 950.0,
          },
          {
            productId: laptopBag.id,
            productNameSnapshot: laptopBag.name,
            skuSnapshot: laptopBag.sku,
            unitPriceSnapshot: laptopBag.unitPrice,
            quantity: 2,
            totalPrice: 3600.0,
          },
        ],
      },
    },
  });

  console.log('Challans seeded successfully.');
  console.log('Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
