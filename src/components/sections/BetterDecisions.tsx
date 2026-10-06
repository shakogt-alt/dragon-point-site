import type { Messages } from '@/lib/i18n/messages';
import { ActionLink } from '@/components/ui/ActionLink';

export function BetterDecisions({
  copy,
}: {
  copy: Messages['landing']['decisions'];
}) {
  const fields = [
    [copy.price, copy.priceValue],
    [copy.range, copy.rangeValue],
    [copy.target, copy.targetValue],
    [copy.liquidity, copy.liquidityValue],
  ];
  return (
    <section
      id="decisions"
      tabIndex={-1}
      className="dp-section dp-comparison-section"
      aria-labelledby="decisions-heading"
    >
      <div className="dp-container dp-comparison-grid">
        <div>
          <p className="dp-eyebrow">{copy.eyebrow}</p>
          <h2 id="decisions-heading">
            {copy.lines.map((line) => (
              <span key={line}>{line}</span>
            ))}
          </h2>
          <p className="dp-section-description">{copy.description}</p>
          <ActionLink href="#standard" secondary>
            {copy.cta}
          </ActionLink>
        </div>
        <div className="dp-comparison">
          <p className="dp-sample">{copy.sample}</p>
          <div className="dp-comparison-columns">
            {[false, true].map((dragon) => (
              <article
                className={dragon ? 'dp-view' : 'dp-listing'}
                key={String(dragon)}
              >
                <h3>{dragon ? copy.dragon : copy.typical}</h3>
                <dl>
                  {fields.map(([field, value], index) => (
                    <div key={field}>
                      <dt>{field}</dt>
                      <dd>{dragon || index === 0 ? value : copy.absent}</dd>
                    </div>
                  ))}
                </dl>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
