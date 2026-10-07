// Shared browser/server field allowlist and limits. No validation library is
// needed for synchronous first-touch capture before analytics initialization.
export const attributionKeys = [
  'utm_source',
  'utm_medium',
  'utm_campaign',
  'utm_content',
  'utm_term',
  'gclid',
  'fbclid',
  'referrer',
  'landingUrl',
] as const;
export const attributionTextLimit = 160;
export const attributionClickIdLimit = 256;
export const attributionUrlLimit = 2048;
export const noControls =
  /^[^\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f\u202a-\u202e]*$/;
