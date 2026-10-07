'use client';

import { useSyncExternalStore } from 'react';
import type { Messages } from '@/lib/i18n/messages';
import {
  consentServerSnapshot,
  consentSnapshot,
  openConsentSettings,
  subscribeConsent,
} from '@/lib/analytics/client';

export function ConsentSettings({ copy }: { copy: Messages['consent'] }) {
  const state = useSyncExternalStore(
    subscribeConsent,
    consentSnapshot,
    consentServerSnapshot,
  );
  return (
    <div>
      <button
        type="button"
        className="dp-consent-settings"
        data-consent-settings=""
        disabled={!state.initialized}
        onClick={(event) => openConsentSettings(event.currentTarget)}
      >
        {copy.settings}
      </button>
      {state.sessionOnly && (
        <p className="dp-consent-note" role="status">
          {copy.sessionOnly}
        </p>
      )}
    </div>
  );
}
