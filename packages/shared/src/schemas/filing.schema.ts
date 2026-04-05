import { z } from 'zod';

export const createFilingSchema = z.object({
  reportingPeriod: z.string().regex(/^\d{4}$/, 'Reporting period must be a 4-digit year'),
  filingType: z.enum(['CRS', 'FATCA'], {
    errorMap: () => ({ message: 'Filing type must be CRS or FATCA' }),
  }),
});

export const manualEntryAccountSchema = z.object({
  accountNumber: z.string().min(1, 'Account number is required').max(100),
  accountHolderName: z.string().min(1, 'Account holder name is required').max(255),
  accountHolderTIN: z.string().min(1, 'TIN is required').max(50),
  tinJurisdiction: z.string().length(2, 'TIN jurisdiction must be an ISO country code'),
  accountBalance: z.number().nonnegative('Balance must be non-negative'),
  currency: z.string().length(3, 'Currency must be an ISO 4217 code').toUpperCase(),
  accountType: z.enum(['DEPOSITORY', 'CUSTODIAL', 'EQUITY', 'DEBT', 'INSURANCE', 'ANNUITY', 'OTHER']),
  addressCountry: z.string().length(2).toUpperCase(),
  dateOfBirth: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format')
    .optional(),
  paymentAmounts: z
    .object({
      dividends: z.number().nonnegative().optional(),
      interest: z.number().nonnegative().optional(),
      grossProceeds: z.number().nonnegative().optional(),
      other: z.number().nonnegative().optional(),
    })
    .optional(),
});

export const manualEntrySchema = z.object({
  reportingPeriod: z.string().regex(/^\d{4}$/),
  filingType: z.enum(['CRS', 'FATCA']),
  reportingFI: z.object({
    name: z.string().min(1).max(255),
    tin: z.string().min(1).max(50),
    jurisdiction: z.string().length(2).toUpperCase(),
  }),
  accounts: z.array(manualEntryAccountSchema).min(1, 'At least one account is required'),
});

export type CreateFilingInput = z.infer<typeof createFilingSchema>;
export type ManualEntryInput = z.infer<typeof manualEntrySchema>;
export type ManualEntryAccountInput = z.infer<typeof manualEntryAccountSchema>;
