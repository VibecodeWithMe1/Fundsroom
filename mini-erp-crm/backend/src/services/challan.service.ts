import prisma from '../config/db';
import { BadRequestError, NotFoundError } from '../utils/errors';
import { z } from 'zod';
import { createChallanSchema, updateChallanSchema } from '../validators/challan.validator';

export class ChallanService {
  private static async getNextChallanNumber(tx: any): Promise<string> {
    const latest = await tx.challan.findFirst({
      orderBy: { challanNumber: 'desc' },
      select: { challanNumber: true },
    });

    let nextSeq = 1;
    if (latest && latest.challanNumber) {
      const match = latest.challanNumber.match(/^CH-(\d+)$/);
      if (match) {
        nextSeq = parseInt(match[1], 10) + 1;
      }
    }

    return `CH-${String(nextSeq).padStart(6, '0')}`;
  }

  static async createChallan(data: z.infer<typeof createChallanSchema>, userId: string) {
    return prisma.$transaction(async (tx) => {
      // 1. Verify customer
      const customer = await tx.customer.findUnique({
        where: { id: data.customerId },
      });
      if (!customer) {
        throw new NotFoundError('Customer not found');
      }

      // 2. Generate unique challan number
      const challanNumber = await this.getNextChallanNumber(tx);

      // 3. Process items and calculate totals
      const challanItemsData = [];
      let totalQuantity = 0;
      let totalAmount = 0;

      for (const item of data.items) {
        const product = await tx.product.findUnique({
          where: { id: item.productId },
        });

        if (!product) {
          throw new NotFoundError(`Product not found with ID ${item.productId}`);
        }

        // Validate stock if confirming immediately
        if (data.status === 'CONFIRMED') {
          if (product.currentStock < item.quantity) {
            throw new BadRequestError(`Insufficient stock for product ${product.name}`);
          }
        }

        const totalPrice = product.unitPrice * item.quantity;
        totalQuantity += item.quantity;
        totalAmount += totalPrice;

        challanItemsData.push({
          productId: product.id,
          productNameSnapshot: product.name,
          skuSnapshot: product.sku,
          unitPriceSnapshot: product.unitPrice,
          quantity: item.quantity,
          totalPrice,
        });
      }

      // 4. Create challan
      const challan = await tx.challan.create({
        data: {
          challanNumber,
          customerId: data.customerId,
          status: data.status,
          totalQuantity,
          totalAmount,
          createdBy: userId,
        },
      });

      // 5. Create challan items
      await tx.challanItem.createMany({
        data: challanItemsData.map((item) => ({
          ...item,
          challanId: challan.id,
        })),
      });

      // 6. Reduce stock and create movements if confirmed
      if (data.status === 'CONFIRMED') {
        for (const item of data.items) {
          const product = await tx.product.findUnique({
            where: { id: item.productId },
          });

          await tx.product.update({
            where: { id: item.productId },
            data: {
              currentStock: {
                decrement: item.quantity,
              },
            },
          });

          await tx.stockMovement.create({
            data: {
              productId: item.productId,
              quantityChanged: item.quantity,
              movementType: 'OUT',
              reason: `Sales Challan ${challanNumber}`,
              createdBy: userId,
            },
          });
        }
      }

      return tx.challan.findUnique({
        where: { id: challan.id },
        include: {
          challanItems: true,
          customer: true,
        },
      });
    });
  }

  static async confirmChallan(id: string, userId: string) {
    return prisma.$transaction(async (tx) => {
      const challan = await tx.challan.findUnique({
        where: { id },
        include: { challanItems: true },
      });

      if (!challan) {
        throw new NotFoundError('Challan not found');
      }

      if (challan.status === 'CONFIRMED') {
        throw new BadRequestError('Challan is already confirmed');
      }

      if (challan.status === 'CANCELLED') {
        throw new BadRequestError('Cannot confirm a cancelled challan');
      }

      // Validate stock for all items
      for (const item of challan.challanItems) {
        const product = await tx.product.findUnique({
          where: { id: item.productId },
        });

        if (!product) {
          throw new NotFoundError(`Product not found: ${item.skuSnapshot}`);
        }

        if (product.currentStock < item.quantity) {
          throw new BadRequestError(`Insufficient stock for product ${product.name}`);
        }
      }

      // Deduct stock and log movements
      for (const item of challan.challanItems) {
        await tx.product.update({
          where: { id: item.productId },
          data: {
            currentStock: {
              decrement: item.quantity,
            },
          },
        });

        await tx.stockMovement.create({
          data: {
            productId: item.productId,
            quantityChanged: item.quantity,
            movementType: 'OUT',
            reason: `Sales Challan ${challan.challanNumber}`,
            createdBy: userId,
          },
        });
      }

      // Update status
      return tx.challan.update({
        where: { id },
        data: { status: 'CONFIRMED' },
        include: {
          challanItems: true,
          customer: true,
        },
      });
    });
  }

  static async cancelChallan(id: string, userId: string) {
    return prisma.$transaction(async (tx) => {
      const challan = await tx.challan.findUnique({
        where: { id },
        include: { challanItems: true },
      });

      if (!challan) {
        throw new NotFoundError('Challan not found');
      }

      if (challan.status === 'CANCELLED') {
        throw new BadRequestError('Challan is already cancelled');
      }

      // If challan was confirmed, restore stock and write movement records
      if (challan.status === 'CONFIRMED') {
        for (const item of challan.challanItems) {
          await tx.product.update({
            where: { id: item.productId },
            data: {
              currentStock: {
                increment: item.quantity,
              },
            },
          });

          await tx.stockMovement.create({
            data: {
              productId: item.productId,
              quantityChanged: item.quantity,
              movementType: 'IN',
              reason: `Cancelled Challan ${challan.challanNumber}`,
              createdBy: userId,
            },
          });
        }
      }

      // Update status to CANCELLED
      return tx.challan.update({
        where: { id },
        data: { status: 'CANCELLED' },
        include: {
          challanItems: true,
          customer: true,
        },
      });
    });
  }

  static async updateChallan(id: string, data: z.infer<typeof updateChallanSchema>, userId: string) {
    return prisma.$transaction(async (tx) => {
      const challan = await tx.challan.findUnique({
        where: { id },
        include: { challanItems: true },
      });

      if (!challan) {
        throw new NotFoundError('Challan not found');
      }

      if (challan.status !== 'DRAFT') {
        throw new BadRequestError('Only draft challans can be modified');
      }

      const updateData: any = {};

      if (data.customerId) {
        const customer = await tx.customer.findUnique({
          where: { id: data.customerId },
        });
        if (!customer) {
          throw new NotFoundError('Customer not found');
        }
        updateData.customerId = data.customerId;
      }

      if (data.items) {
        // Delete existing items
        await tx.challanItem.deleteMany({
          where: { challanId: id },
        });

        // Compute new items
        const challanItemsData = [];
        let totalQuantity = 0;
        let totalAmount = 0;

        for (const item of data.items) {
          const product = await tx.product.findUnique({
            where: { id: item.productId },
          });

          if (!product) {
            throw new NotFoundError(`Product not found with ID ${item.productId}`);
          }

          const totalPrice = product.unitPrice * item.quantity;
          totalQuantity += item.quantity;
          totalAmount += totalPrice;

          challanItemsData.push({
            challanId: id,
            productId: product.id,
            productNameSnapshot: product.name,
            skuSnapshot: product.sku,
            unitPriceSnapshot: product.unitPrice,
            quantity: item.quantity,
            totalPrice,
          });
        }

        await tx.challanItem.createMany({
          data: challanItemsData,
        });

        updateData.totalQuantity = totalQuantity;
        updateData.totalAmount = totalAmount;
      }

      return tx.challan.update({
        where: { id },
        data: updateData,
        include: {
          challanItems: true,
          customer: true,
        },
      });
    });
  }

  static async getChallans(params: {
    page?: number;
    limit?: number;
    search?: string;
    customerId?: string;
    status?: 'DRAFT' | 'CONFIRMED' | 'CANCELLED';
    startDate?: string;
    endDate?: string;
  }) {
    const page = params.page || 1;
    const limit = params.limit || 10;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (params.search) {
      where.challanNumber = { contains: params.search, mode: 'insensitive' };
    }

    if (params.customerId) {
      where.customerId = params.customerId;
    }

    if (params.status) {
      where.status = params.status;
    }

    if (params.startDate || params.endDate) {
      where.createdAt = {};
      if (params.startDate) {
        where.createdAt.gte = new Date(params.startDate);
      }
      if (params.endDate) {
        const end = new Date(params.endDate);
        end.setHours(23, 59, 59, 999);
        where.createdAt.lte = end;
      }
    }

    const [total, challans] = await Promise.all([
      prisma.challan.count({ where }),
      prisma.challan.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          customer: {
            select: {
              customerName: true,
              businessName: true,
            },
          },
          creator: {
            select: {
              name: true,
              role: true,
            },
          },
        },
      }),
    ]);

    return {
      challans,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  static async getChallanById(id: string) {
    const challan = await prisma.challan.findUnique({
      where: { id },
      include: {
        challanItems: {
          include: {
            product: {
              select: {
                currentStock: true,
                warehouseLocation: true,
              },
            },
          },
        },
        customer: true,
        creator: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
      },
    });

    if (!challan) {
      throw new NotFoundError('Challan not found');
    }

    return challan;
  }
}
