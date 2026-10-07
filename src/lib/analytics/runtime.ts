import { DENIED, type Consent } from './consent';
import { makeAnalyticsEvent, type AnalyticsEvent } from './events';

export type AnalyticsAdapter = {
  purpose: 'analytics' | 'marketing' | 'both';
  start: (allowed: () => boolean) => Promise<void>;
  stop: () => void;
  track: (event: AnalyticsEvent) => void;
};
export function createAnalyticsRuntime(
  load: () => Promise<AnalyticsAdapter[]>,
  emit: (event: AnalyticsEvent) => void,
) {
  let consent: Consent = DENIED;
  let generation = 0;
  let loading: Promise<AnalyticsAdapter[]> | undefined;
  let adapters: AnalyticsAdapter[] = [];
  const active = new Set<AnalyticsAdapter>();
  const pending = new Map<AnalyticsAdapter, Promise<void>>();
  const eligible = (adapter: AnalyticsAdapter) =>
    adapter.purpose === 'both'
      ? consent.analytics && consent.marketing
      : consent[adapter.purpose];
  return {
    async setConsent(next: Consent) {
      consent = {
        necessary: true,
        analytics: next.analytics === true,
        marketing: next.marketing === true,
      };
      const revision = ++generation;
      // Stop first, synchronously; a loading provider receives a live permission check.
      for (const adapter of adapters) {
        if (!eligible(adapter)) {
          active.delete(adapter);
          try {
            adapter.stop();
          } catch {}
        }
      }
      if (!consent.analytics && !consent.marketing) return;
      try {
        loading ??= load();
        adapters = await loading;
        if (revision !== generation) return;
        await Promise.all(
          adapters.map(async (adapter) => {
            if (!eligible(adapter) || active.has(adapter)) return;
            const allowed = () => eligible(adapter);
            try {
              let start = pending.get(adapter);
              if (!start) {
                start = adapter.start(allowed);
                pending.set(adapter, start);
                void start
                  .finally(() => pending.delete(adapter))
                  .catch(() => {});
              }
              await start;
              if (allowed()) active.add(adapter);
              else adapter.stop();
            } catch {
              active.delete(adapter);
            }
          }),
        );
      } catch {
        loading = undefined; /* Tracking cannot break a lead journey. */
      }
    },
    track(name: string, properties: unknown) {
      if (!consent.analytics && !consent.marketing) return false;
      const event = makeAnalyticsEvent(name, properties);
      if (!event) return false;
      try {
        emit(event);
      } catch {}
      for (const adapter of active) {
        if (eligible(adapter)) {
          try {
            adapter.track(event);
          } catch {}
        }
      }
      return true;
    },
  };
}
