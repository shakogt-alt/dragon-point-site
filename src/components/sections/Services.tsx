import type { Messages } from '@/lib/i18n/messages';

export function Services({ copy }: { copy: Messages['landing']['services'] }) {
  return (
    <section
      id="services"
      tabIndex={-1}
      className="dp-section dp-services"
      aria-labelledby="services-heading"
    >
      <div className="dp-container">
        <div className="dp-section-heading">
          <div>
            <p className="dp-eyebrow">{copy.eyebrow}</p>
            <h2 id="services-heading">{copy.title}</h2>
          </div>
          <p>{copy.description}</p>
        </div>
        <div className="dp-services-grid">
          {copy.items.map((item) => (
            <article key={item.number}>
              <span className="dp-index" dir="ltr">
                {item.number}
              </span>
              <h3>{item.title}</h3>
              <ul>
                {item.details.map((detail) => (
                  <li key={detail}>{detail}</li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
