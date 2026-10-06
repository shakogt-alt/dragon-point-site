import type { Messages } from '@/lib/i18n/messages';
import { Arrow } from '@/components/ui/Arrow';

export function DragonPointStandard({
  copy,
}: {
  copy: Messages['landing']['standard'];
}) {
  return (
    <section
      id="standard"
      tabIndex={-1}
      className="dp-section dp-standard"
      aria-labelledby="standard-heading"
    >
      <div className="dp-container">
        <div className="dp-section-heading">
          <div>
            <p className="dp-eyebrow">{copy.eyebrow}</p>
            <h2 id="standard-heading">{copy.title}</h2>
          </div>
          <p>{copy.description}</p>
        </div>
        <ol className="dp-process">
          {copy.items.map((item, index) => (
            <li key={item.number}>
              <span className="dp-index" dir="ltr">
                {item.number}
              </span>
              <h3>{item.title}</h3>
              <p>{item.description}</p>
              {index < copy.items.length - 1 && (
                <Arrow className="dp-process-arrow" />
              )}
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
