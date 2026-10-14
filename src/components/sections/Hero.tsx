import Image from 'next/image';
import type { Messages } from '@/lib/i18n/messages';
import { ArchitectureVisual } from '@/components/ui/ArchitectureVisual';
import { ActionLink } from '@/components/ui/ActionLink';

export function Hero({ messages }: { messages: Messages }) {
  const copy = messages.landing.hero;
  return (
    <section
      id="hero"
      tabIndex={-1}
      className="dp-hero dp-dark"
      aria-labelledby="hero-heading"
    >
      <div className="dp-container dp-hero-grid">
        <div className="dp-hero-copy">
          <div className="dp-hero-brand" dir="ltr">
            <Image
              className="dp-hero-symbol"
              src="/brand/logo-symbol.webp"
              width={88}
              height={128}
              alt=""
              aria-hidden="true"
              unoptimized
              loading="eager"
              fetchPriority="low"
            />
            <p className="dp-eyebrow">
              {messages.brand.name} <span>{messages.brand.descriptor}</span>
            </p>
          </div>
          <h1 id="hero-heading" className="dp-hero-context">
            {messages.foundation.heading}
          </h1>
          <p className="dp-hero-title">
            {copy.lines.map((line) => (
              <span key={line}>{line}</span>
            ))}
          </p>
          <p className="dp-hero-description">{copy.description}</p>
          <div className="dp-actions">
            <ActionLink href="#advisor" intent="buy">
              {copy.primary}
            </ActionLink>
            <ActionLink href="#advisor" secondary>
              {copy.secondary}
            </ActionLink>
          </div>
          <p className="dp-geo">{copy.geo}</p>
        </div>
        <div className="dp-hero-visual">
          <p className="dp-visual-label">{copy.visual}</p>
          <ArchitectureVisual alt={copy.imageAlt} />
          <div className="dp-visual-caption">
            <span>{copy.formula}</span>
            <span>{copy.visualNote}</span>
          </div>
        </div>
      </div>
    </section>
  );
}
