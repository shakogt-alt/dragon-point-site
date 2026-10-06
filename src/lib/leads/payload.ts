import type {
  Attribution,
  LeadFormValues,
  LeadRequest,
} from '../validation/lead';
import { attributionShape } from '../validation/lead';

export type LeadPayload = Omit<
  LeadRequest,
  'website' | 'email' | 'budget' | 'message'
> & {
  email?: string;
  budget?: string;
  message?: string;
};

export function buildLeadPayload(
  values: LeadFormValues,
  locale: LeadRequest['locale'],
  attribution: Attribution,
): LeadPayload {
  const tracking: Attribution = {};
  for (const key of Object.keys(attributionShape) as (keyof Attribution)[])
    if (attribution[key] !== undefined) tracking[key] = attribution[key];
  const digits = values.phone.replace(/\D/g, '');
  const phone = values.phone.startsWith('00')
    ? `+${digits.slice(2)}`
    : `${values.phone.startsWith('+') ? '+' : ''}${digits}`;
  return {
    ...tracking,
    intent: values.intent,
    name: values.name,
    phone,
    ...(values.email ? { email: values.email } : {}),
    ...(values.budget ? { budget: values.budget } : {}),
    ...(values.message ? { message: values.message } : {}),
    preferredLanguage: values.preferredLanguage,
    locale,
    source: 'dragon-point-landing',
  };
}
