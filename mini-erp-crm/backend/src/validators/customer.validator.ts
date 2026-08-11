import { z } from 'zod';

export const createCustomerSchema = z.object({
  customerName: z.string().min(2, 'Name must be at least 2 characters'),
  mobileNumber: z.string().min(10, 'Mobile number must be at least 10 characters').max(15, 'Mobile number too long'),
  email: z.string().email('Invalid email address'),
  businessName: z.string().min(2, 'Business name must be at least 2 characters'),
  gstNumber: z.string().optional().nullable().or(z.literal('')),
  customerType: z.enum(['RETAIL', 'WHOLESALE', 'DISTRIBUTOR']),
  address: z.string().min(5, 'Address must be at least 5 characters'),
  status: z.enum(['LEAD', 'ACTIVE', 'INACTIVE']).default('LEAD'),
  leadStage: z.enum(['LEAD', 'CONTACTED', 'PROPOSAL', 'NEGOTIATION', 'WON', 'LOST']).optional(),
  followUpDate: z.string().datetime().optional().nullable().or(z.string().date().optional().nullable()).or(z.date().optional().nullable()),
});

export const updateCustomerSchema = createCustomerSchema.partial();

export const createFollowUpSchema = z.object({
  followUpDate: z.string().transform((val) => new Date(val)).or(z.date()),
  notes: z.string().min(1, 'Notes are required'),
  contactMethod: z.enum(['CALL', 'EMAIL', 'MEETING', 'SMS']).default('CALL'),
});
