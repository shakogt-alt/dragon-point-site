import { z } from 'zod';
import { intents, leadLocales } from '../leads/constants';
import { attributionShape, noControls } from './attribution';

const text = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .regex(noControls)
    .transform((value) => value.normalize('NFC'));

export { intents, leadLocales } from '../leads/constants';
export {
  safeUrl,
  attributionShape,
  attributionSchema,
  type Attribution,
} from './attribution';

export const leadFormSchema = z.object({
  intent: z.enum(intents),
  name: text(120).refine(
    (value) => value.length >= 2 && !/[\r\n\t]/.test(value),
  ),
  phone: z
    .string()
    .trim()
    .max(60)
    .refine((value) => {
      const allDigits = value.replace(/\D/g, '');
      const digits = value.startsWith('00') ? allDigits.slice(2) : allDigits;
      return (
        /^\+?[\d\s().-]+$/.test(value) &&
        digits.length >= 7 &&
        digits.length <= 15
      );
    }),
  email: text(254).refine(
    (value) => value === '' || z.email().safeParse(value).success,
  ),
  budget: text(120),
  message: text(2000),
  preferredLanguage: z.enum(leadLocales),
  website: z.string().max(200),
});

export const leadRequestSchema = leadFormSchema
  .extend({
    email: leadFormSchema.shape.email.default(''),
    budget: leadFormSchema.shape.budget.default(''),
    message: leadFormSchema.shape.message.default(''),
    website: leadFormSchema.shape.website.default(''),
    locale: z.enum(leadLocales),
    source: z.literal('dragon-point-landing'),
    ...attributionShape,
  })
  .strict();
export type LeadFormValues = z.infer<typeof leadFormSchema>;
export type LeadRequest = z.infer<typeof leadRequestSchema>;
