import { z } from 'zod';

export const createChallanSchema = z.object({
  customerId: z.string().uuid('Invalid customer ID'),
  status: z.enum(['DRAFT', 'CONFIRMED']).default('DRAFT'),
  items: z.array(
    z.object({
      productId: z.string().uuid('Invalid product ID'),
      quantity: z.number().int().positive('Quantity must be a positive integer'),
    })
  ).min(1, 'At least one product item is required'),
});

export const updateChallanSchema = z.object({
  customerId: z.string().uuid('Invalid customer ID').optional(),
  items: z.array(
    z.object({
      productId: z.string().uuid('Invalid product ID'),
      quantity: z.number().int().positive('Quantity must be a positive integer'),
    })
  ).min(1, 'At least one product item is required').optional(),
});
