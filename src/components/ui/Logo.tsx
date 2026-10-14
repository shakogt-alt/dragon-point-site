import Image from 'next/image';
import type { Messages } from '@/lib/i18n/messages';

export function Logo({
  brand,
  variant = 'header',
}: {
  brand: Messages['brand'];
  variant?: 'header' | 'footer';
}) {
  const footer = variant === 'footer';
  return (
    <span className={`dp-logo dp-logo-${variant}`} dir="ltr">
      <picture>
        {!footer && (
          <source media="(max-width: 767px)" srcSet="/brand/logo-symbol.webp" />
        )}
        <Image
          className="dp-logo-image"
          src={
            footer ? '/brand/logo-lockup-full.webp' : '/brand/logo-lockup.webp'
          }
          width={footer ? 720 : 640}
          height={footer ? 214 : 164}
          alt=""
          aria-hidden="true"
          unoptimized
          loading={footer ? 'lazy' : 'eager'}
          fetchPriority={footer ? 'auto' : 'low'}
        />
      </picture>
      <span className="dp-logo-text">
        <span>{brand.name}</span>
        <span className="dp-logo-descriptor">{brand.descriptor}</span>
      </span>
    </span>
  );
}
