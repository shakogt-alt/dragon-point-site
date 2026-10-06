import type { Locale } from '@/lib/i18n/locales';
import type { Messages } from '@/lib/i18n/messages';
import { LeadForm } from '@/components/leads/LeadForm';

export function LeadSection({
  locale,
  copy,
}: {
  locale: Locale;
  copy: Messages['landing']['lead'];
}) {
  return (
    <section
      id="advisor"
      tabIndex={-1}
      className="dp-section dp-lead-section"
      aria-labelledby="lead-heading"
    >
      <div className="dp-container dp-lead-grid">
        <div className="dp-lead-intro">
          <p className="dp-eyebrow">{copy.eyebrow}</p>
          <h2 id="lead-heading">{copy.title}</h2>
          <p className="dp-section-description">{copy.description}</p>
          <p className="dp-form-note">{copy.required}</p>
          <a href="#contact">{copy.privacyLink}</a>
        </div>
        <div>
          <noscript>
            <p className="dp-lead-feedback">{copy.noScript}</p>
          </noscript>
          <LeadForm locale={locale} copy={copy} />
        </div>
      </div>
    </section>
  );
}
