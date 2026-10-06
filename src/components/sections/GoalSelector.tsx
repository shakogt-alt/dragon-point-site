import type { Messages } from '@/lib/i18n/messages';
import { ActionLink } from '@/components/ui/ActionLink';

export function GoalSelector({ copy }: { copy: Messages['landing']['goals'] }) {
  const intents = ['buy', 'invest', 'sell'];
  return (
    <section
      id="goals"
      tabIndex={-1}
      className="dp-section"
      aria-labelledby="goals-heading"
    >
      <div className="dp-container">
        <div className="dp-section-heading">
          <div>
            <p className="dp-eyebrow">{copy.eyebrow}</p>
            <h2 id="goals-heading">{copy.title}</h2>
          </div>
          <p>{copy.description}</p>
        </div>
        <div className="dp-goal-grid">
          {copy.items.map((item, index) => (
            <article
              className="dp-goal-card"
              id={intents[index]}
              key={item.number}
              tabIndex={-1}
              data-intent={intents[index]}
            >
              <span className="dp-index" dir="ltr">
                {item.number}
              </span>
              <h3>{item.title}</h3>
              <p>{item.description}</p>
              <ActionLink href="#advisor" secondary intent={intents[index]}>
                {item.cta}
              </ActionLink>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
