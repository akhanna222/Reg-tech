import { z } from 'zod';

export const fiRegistrationSchema = z.object({
  organizationName: z.string().min(2, 'Organization name is required').max(255),
  jurisdiction: z
    .string()
    .length(2, 'Jurisdiction must be an ISO 3166-1 alpha-2 code')
    .toUpperCase(),
  giin: z
    .string()
    .regex(/^[A-Z0-9]{6}\.[A-Z0-9]{5}\.[A-Z]{2}\.\d{3}$/, 'Invalid GIIN format')
    .optional()
    .or(z.literal('')),
  contactEmail: z.string().email('Invalid contact email'),
  contactName: z.string().min(1, 'Contact name is required').max(200),
  contactPhone: z
    .string()
    .regex(/^\+?[0-9\s\-()]{7,20}$/, 'Invalid phone number format')
    .optional()
    .or(z.literal('')),
  registrationNumber: z.string().max(100).optional(),
  address: z
    .object({
      line1: z.string().min(1).max(255),
      line2: z.string().max(255).optional(),
      city: z.string().min(1).max(100),
      postalCode: z.string().min(1).max(20),
      country: z.string().length(2).toUpperCase(),
    })
    .optional(),
});

export type FiRegistrationInput = z.infer<typeof fiRegistrationSchema>;
