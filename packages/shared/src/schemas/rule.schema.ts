import { z } from 'zod';

/**
 * Schema for json-rules-engine condition format.
 */
const ruleConditionSchema: z.ZodType = z.lazy(() =>
  z.object({
    any: z.array(ruleConditionSchema).optional(),
    all: z.array(ruleConditionSchema).optional(),
    fact: z.string().optional(),
    operator: z.string().optional(),
    value: z.unknown().optional(),
    path: z.string().optional(),
  }),
);

const ruleEventSchema = z.object({
  type: z.string().min(1),
  params: z
    .object({
      message: z.string(),
      severity: z.enum(['ERROR', 'WARNING', 'INFO']),
      code: z.string().optional(),
      field: z.string().optional(),
    })
    .passthrough(),
});

export const jurisdictionRuleSchema = z.object({
  jurisdiction: z.string().length(2, 'Jurisdiction must be an ISO 3166-1 alpha-2 code').toUpperCase(),
  ruleName: z.string().min(1, 'Rule name is required').max(255),
  ruleDefinition: z.object({
    conditions: ruleConditionSchema,
    event: ruleEventSchema,
    priority: z.number().int().min(1).max(1000).optional(),
  }),
  effectiveFrom: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD'),
  effectiveTo: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD')
    .optional()
    .nullable(),
});

export type JurisdictionRuleInput = z.infer<typeof jurisdictionRuleSchema>;
