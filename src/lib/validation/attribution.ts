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

// Kept separate from the form/resolver so synchronous first-touch capture does
// not load form validation. Rules and transforms are identical to Phase 6.
export const noControls =
  /^[^\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f\u202a-\u202e]*$/;
export const validatedText = (max: number) =>
  pipe(
    string().check(trim(), maxLength(max), regex(noControls)),
    transform((value) => value.normalize('NFC')),
  );
export const safeUrl = string().check(
  maxLength(2048),
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
  utm_source: optional(validatedText(160)),
  utm_medium: optional(validatedText(160)),
  utm_campaign: optional(validatedText(160)),
  utm_content: optional(validatedText(160)),
  utm_term: optional(validatedText(160)),
  gclid: optional(validatedText(256)),
  fbclid: optional(validatedText(256)),
  referrer: optional(safeUrl),
  landingUrl: optional(safeUrl),
};
export const attributionSchema = strictObject(attributionShape);
export type Attribution = Infer<typeof attributionSchema>;
