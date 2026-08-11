import { z } from 'zod';

export const createProductSchema = z.object({
  name: z.string().min(2, 'Product name must be at least 2 characters'),
  sku: z.string().min(3, 'SKU must be at least 3 characters'),
  category: z.string().min(2, 'Category name must be at least 2 characters'),
  unitPrice: z.number().nonnegative('Unit price cannot be negative'),
  currentStock: z.number().int().nonnegative('Stock cannot be negative').default(0),
  minimumStock: z.number().int().nonnegative('Minimum stock level cannot be negative').default(0),
  warehouseLocation: z.string().min(2, 'Warehouse location must be at least 2 characters'),
});

export const updateProductSchema = createProductSchema.partial();

export const adjustStockSchema = z.object({
  quantityChanged: z.number().int().refine((val) => val !== 0, {
    message: 'Stock adjustment quantity cannot be zero',
  }),
  reason: z.string().min(2, 'Adjustment reason is required'),
});
