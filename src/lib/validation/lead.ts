import { z } from 'zod';
import { locales } from '../i18n/locales';

export const intents = ['buy', 'invest', 'sell'] as const;
export const leadLocales = locales;
const noControls =
  /^[^\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f\u202a-\u202e]*$/;
const text = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .regex(noControls)
    .transform((value) => value.normalize('NFC'));

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

export const safeUrl = z
  .string()
  .max(2048)
  .refine((value) => {
    try {
      const url = new URL(value);
      return (
        ['http:', 'https:'].includes(url.protocol) &&
        !url.username &&
        !url.password &&
        noControls.test(value)
      );
    } catch {
      return false;
    }
  });
export const attributionShape = {
  utm_source: text(160).optional(),
  utm_medium: text(160).optional(),
  utm_campaign: text(160).optional(),
  utm_content: text(160).optional(),
  utm_term: text(160).optional(),
  gclid: text(256).optional(),
  fbclid: text(256).optional(),
  referrer: safeUrl.optional(),
  landingUrl: safeUrl.optional(),
};
export const attributionSchema = z.object(attributionShape).strict();
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
export type Attribution = z.infer<typeof attributionSchema>;
