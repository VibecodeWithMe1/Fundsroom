import prisma from '../config/db';
import { BadRequestError, NotFoundError } from '../utils/errors';
import { z } from 'zod';
import { createProductSchema, updateProductSchema, adjustStockSchema } from '../validators/product.validator';

export class ProductService {
  static async createProduct(data: z.infer<typeof createProductSchema>, userId: string) {
    return prisma.$transaction(async (tx) => {
      const product = await tx.product.create({
        data: {
          name: data.name,
          sku: data.sku,
          category: data.category,
          unitPrice: data.unitPrice,
          currentStock: data.currentStock,
          minimumStock: data.minimumStock,
          warehouseLocation: data.warehouseLocation,
        },
      });

      // If initial stock is greater than 0, record a stock movement
      if (data.currentStock > 0) {
        await tx.stockMovement.create({
          data: {
            productId: product.id,
            quantityChanged: data.currentStock,
            movementType: 'IN',
            reason: 'Initial stock setup',
            createdBy: userId,
          },
        });
      }

      return product;
    });
  }

  static async getProducts(params: {
    page?: number;
    limit?: number;
    search?: string;
    category?: string;
    lowStockOnly?: boolean;
  }) {
    const page = params.page || 1;
    const limit = params.limit || 10;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (params.search) {
      where.OR = [
        { name: { contains: params.search } },
        { sku: { contains: params.search } },
      ];
    }

    if (params.category) {
      where.category = params.category;
    }

    if (params.lowStockOnly) {
      // Products where currentStock is less than or equal to minimumStock
      where.AND = [
        {
          currentStock: {
            lte: prisma.product.fields.minimumStock,
          },
        },
      ];
    }

    // Prisma doesn't natively support comparing two fields directly in 'lte' (like currentStock <= minimumStock) easily without raw SQL or a query extension.
    // Wait, let's write a safe where condition. If prisma.product.fields is not supported or creates issues in older prisma versions, we can write a raw query or load it.
    // Actually, another way to do low stock check is to query all or use a prisma feature. Wait! In Prisma client, raw SQL or loading and filtering in JS works, but pagination gets messed up.
    // Let's implement low-stock query using Prisma's `lte` relation or raw SQL, or since we have a small dataset, we can fetch IDs from a raw SQL query and query by IDs.
    // Let's check: in Prisma, we can do raw query to get low stock product IDs, then fetch them. This is very clean and preserves pagination!
    // Query: `SELECT id FROM "Product" WHERE "currentStock" <= "minimumStock"`
    let productIds: string[] | null = null;
    if (params.lowStockOnly) {
      const rawResult = await prisma.$queryRawUnsafe<{ id: string }[]>(
        `SELECT id FROM "Product" WHERE "currentStock" <= "minimumStock"`
      );
      productIds = rawResult.map(r => r.id);
      where.id = { in: productIds };
    }

    const [total, products] = await Promise.all([
      prisma.product.count({ where }),
      prisma.product.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    // Map status for UI convenience
    const productsWithStatus = products.map(p => ({
      ...p,
      isLowStock: p.currentStock <= p.minimumStock,
      status: p.currentStock <= p.minimumStock ? 'LOW STOCK' : 'NORMAL'
    }));

    return {
      products: productsWithStatus,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  static async getProductById(id: string) {
    const product = await prisma.product.findUnique({
      where: { id },
    });

    if (!product) {
      throw new NotFoundError('Product not found');
    }

    return {
      ...product,
      isLowStock: product.currentStock <= product.minimumStock,
      status: product.currentStock <= product.minimumStock ? 'LOW STOCK' : 'NORMAL'
    };
  }

  static async updateProduct(id: string, data: z.infer<typeof updateProductSchema>, userId: string) {
    const product = await prisma.product.findUnique({
      where: { id },
    });

    if (!product) {
      throw new NotFoundError('Product not found');
    }

    return prisma.$transaction(async (tx) => {
      // Check if stock changes
      if (data.currentStock !== undefined && data.currentStock !== product.currentStock) {
        const diff = data.currentStock - product.currentStock;
        if (data.currentStock < 0) {
          throw new BadRequestError('Product stock cannot be negative');
        }

        await tx.stockMovement.create({
          data: {
            productId: id,
            quantityChanged: Math.abs(diff),
            movementType: diff > 0 ? 'IN' : 'OUT',
            reason: `Direct stock edit (from ${product.currentStock} to ${data.currentStock})`,
            createdBy: userId,
          },
        });
      }

      const updated = await tx.product.update({
        where: { id },
        data,
      });

      return updated;
    });
  }

  static async adjustStock(
    productId: string,
    data: z.infer<typeof adjustStockSchema>,
    userId: string
  ) {
    const product = await prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      throw new NotFoundError('Product not found');
    }

    const newStock = product.currentStock + data.quantityChanged;
    if (newStock < 0) {
      throw new BadRequestError(`Adjustment failed. Stock cannot become negative. Current: ${product.currentStock}, Requested: ${data.quantityChanged}`);
    }

    return prisma.$transaction(async (tx) => {
      const updatedProduct = await tx.product.update({
        where: { id: productId },
        data: {
          currentStock: newStock,
        },
      });

      await tx.stockMovement.create({
        data: {
          productId,
          quantityChanged: Math.abs(data.quantityChanged),
          movementType: data.quantityChanged > 0 ? 'IN' : 'OUT',
          reason: data.reason,
          createdBy: userId,
        },
      });

      return updatedProduct;
    });
  }

  static async getStockMovements(params: {
    page?: number;
    limit?: number;
    productId?: string;
  }) {
    const page = params.page || 1;
    const limit = params.limit || 20;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (params.productId) {
      where.productId = params.productId;
    }

    const [total, movements] = await Promise.all([
      prisma.stockMovement.count({ where }),
      prisma.stockMovement.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          product: {
            select: {
              name: true,
              sku: true,
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
      movements,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}
