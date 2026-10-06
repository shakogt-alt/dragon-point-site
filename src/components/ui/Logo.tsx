import type { Messages } from '@/lib/i18n/messages';

// Replace this typographic lockup with approved assets without changing its callers.
export function Logo({ brand }: { brand: Messages['brand'] }) {
  return (
    <span className="dp-logo" dir="ltr">
      <span>{brand.name}</span>
      <span className="dp-logo-descriptor">{brand.descriptor}</span>
    </span>
  );
}
