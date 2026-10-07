import {
  string,
  pipe,
  transform,
  trim,
  maxLength,
  regex,
  refine,
  optional,
  strictObject,
  type infer as Infer,
} from 'zod/mini';
import {
  attributionTextLimit,
  attributionClickIdLimit,
  attributionUrlLimit,
  noControls,
} from './attribution-rules';
export { noControls } from './attribution-rules';

// Kept separate from the form/resolver so synchronous first-touch capture does
// not load form validation. Rules and transforms are identical to Phase 6.
export const validatedText = (max: number) =>
  pipe(
    string().check(trim(), maxLength(max), regex(noControls)),
    transform((value) => value.normalize('NFC')),
  );
export const safeUrl = string().check(
  maxLength(attributionUrlLimit),
  refine((value) => {
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
  }),
);
export const attributionShape = {
  utm_source: optional(validatedText(attributionTextLimit)),
  utm_medium: optional(validatedText(attributionTextLimit)),
  utm_campaign: optional(validatedText(attributionTextLimit)),
  utm_content: optional(validatedText(attributionTextLimit)),
  utm_term: optional(validatedText(attributionTextLimit)),
  gclid: optional(validatedText(attributionClickIdLimit)),
  fbclid: optional(validatedText(attributionClickIdLimit)),
  referrer: optional(safeUrl),
  landingUrl: optional(safeUrl),
};
export const attributionSchema = strictObject(attributionShape);
export type Attribution = Infer<typeof attributionSchema>;
