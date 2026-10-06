import type { Messages } from '@/lib/i18n/messages';

export function Technology({ messages }: { messages: Messages }) {
  const copy = messages.landing.technology;
  return (
    <section
      id="technology"
      tabIndex={-1}
      className="dp-section dp-technology dp-dark"
      aria-labelledby="technology-heading"
    >
      <div className="dp-container dp-technology-grid">
        <div>
          <p className="dp-eyebrow">{copy.eyebrow}</p>
          <h2 id="technology-heading">
            {copy.lines.map((line) => (
              <span key={line}>{line}</span>
            ))}
          </h2>
          <p className="dp-section-description">{copy.description}</p>
          <p className="dp-powered">
            {messages.brand.powered}{' '}
            <bdi dir="ltr">{messages.brand.technology}</bdi>
          </p>
          <p className="dp-technology-note">{copy.note}</p>
        </div>
        <div>
          <div className="dp-data-diagram" aria-hidden="true">
            <span />
            <span />
            <span />
            <i />
            <i />
            <i />
          </div>
          <p className="dp-diagram-label">{copy.diagram}</p>
          <ul className="dp-trust-points">
            {copy.points.map((point) => (
              <li key={point}>
                <svg
                  className="dp-check-icon"
                  viewBox="0 0 16 16"
                  fill="none"
                  aria-hidden="true"
                >
                  <path
                    d="m3 8 3 3 7-7"
                    stroke="currentColor"
                    strokeWidth="1.5"
                  />
                </svg>
                <span>{point}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
