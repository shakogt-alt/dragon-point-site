'use client';

import { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import type { Messages } from '@/lib/i18n/messages';
import { DENIED, type Consent } from '@/lib/analytics/consent';
import {
  chooseConsent,
  closeConsentSettings,
  consentServerSnapshot,
  consentSnapshot,
  initializeAnalytics,
  openConsentSettings,
  restoreConsentFocus,
  subscribeConsent,
} from '@/lib/analytics/client';

type Copy = Messages['consent'];
const ALL: Consent = { necessary: true, analytics: true, marketing: true };

function ConsentDialog({
  copy,
  initial,
  sessionOnly,
}: {
  copy: Copy;
  initial: Consent;
  sessionOnly: boolean;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const heading = useRef<HTMLHeadingElement>(null);
  const [draft, setDraft] = useState(initial);
  useEffect(() => {
    const dialog = ref.current!;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    dialog.showModal();
    heading.current?.focus();
    return () => {
      dialog.close();
      document.body.style.overflow = overflow;
      restoreConsentFocus();
    };
  }, []);
  return (
    <dialog
      ref={ref}
      className="dp-consent-dialog"
      aria-labelledby="consent-title"
      aria-describedby="consent-description"
      data-consent-overlay=""
      onKeyDown={(event) => {
        if (
          event.key !== 'Tab' ||
          event.ctrlKey ||
          event.metaKey ||
          event.altKey
        )
          return;
        const controls = Array.from(
          event.currentTarget.querySelectorAll<HTMLElement>(
            'button:not(:disabled), input:not(:disabled)',
          ),
        );
        const first = controls[0];
        const last = controls.at(-1);
        if (
          event.shiftKey &&
          (document.activeElement === first ||
            !controls.includes(document.activeElement as HTMLElement))
        ) {
          event.preventDefault();
          last?.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first?.focus();
        }
      }}
      onCancel={(event) => {
        event.preventDefault();
        closeConsentSettings();
      }}
    >
      <div className="dp-consent-dialog-content">
        <div className="dp-consent-heading">
          <h2 id="consent-title" tabIndex={-1} ref={heading}>
            {copy.title}
          </h2>
          <button
            type="button"
            className="dp-consent-close"
            onClick={closeConsentSettings}
          >
            {copy.close}
          </button>
        </div>
        <p id="consent-description">{copy.description}</p>
        <fieldset className="dp-consent-options">
          <legend className="dp-visually-hidden">{copy.categories}</legend>
          {(['necessary', 'analytics', 'marketing'] as const).map(
            (category) => (
              <div className="dp-consent-option" key={category}>
                <label htmlFor={`consent-${category}`}>
                  <input
                    id={`consent-${category}`}
                    type="checkbox"
                    checked={draft[category]}
                    disabled={category === 'necessary'}
                    onChange={(event) =>
                      setDraft({ ...draft, [category]: event.target.checked })
                    }
                    aria-describedby={`consent-${category}-description`}
                  />
                  <span>
                    {copy[category].title}
                    {category === 'necessary' && <small>{copy.alwaysOn}</small>}
                  </span>
                </label>
                <p id={`consent-${category}-description`}>
                  {copy[category].description}
                </p>
              </div>
            ),
          )}
        </fieldset>
        <p className="dp-consent-note">{copy.persistence}</p>
        {sessionOnly && (
          <p role="status" className="dp-consent-note">
            {copy.sessionOnly}
          </p>
        )}
        <div className="dp-consent-actions">
          <button
            type="button"
            data-consent-action="necessary"
            onClick={() => chooseConsent(DENIED)}
          >
            {copy.reject}
          </button>
          <button
            type="button"
            data-consent-action="all"
            onClick={() => chooseConsent(ALL)}
          >
            {copy.accept}
          </button>
          <button
            type="button"
            data-consent-action="save"
            onClick={() => chooseConsent(draft)}
          >
            {copy.save}
          </button>
        </div>
      </div>
    </dialog>
  );
}

export function ConsentManager({ copy }: { copy: Copy }) {
  const state = useSyncExternalStore(
    subscribeConsent,
    consentSnapshot,
    consentServerSnapshot,
  );
  useEffect(() => initializeAnalytics(), []);
  useEffect(() => {
    document.documentElement.dataset.consentUi =
      state.ui === 'closed' ? 'closed' : 'open';
    return () => {
      delete document.documentElement.dataset.consentUi;
    };
  }, [state.ui]);
  return (
    <>
      {state.ui === 'banner' && (
        <section
          className="dp-consent-banner"
          aria-labelledby="consent-banner-title"
          data-consent-overlay=""
        >
          <div className="dp-consent-banner-copy">
            <h2 id="consent-banner-title">{copy.title}</h2>
            <p>{copy.description}</p>
          </div>
          <div className="dp-consent-actions">
            <button
              type="button"
              data-consent-action="necessary"
              onClick={() => chooseConsent(DENIED)}
            >
              {copy.reject}
            </button>
            <button
              type="button"
              data-consent-action="all"
              onClick={() => chooseConsent(ALL)}
            >
              {copy.accept}
            </button>
            <button
              type="button"
              data-consent-action="customize"
              onClick={openConsentSettings}
            >
              {copy.customize}
            </button>
          </div>
        </section>
      )}
      {state.ui === 'dialog' && (
        <ConsentDialog
          key={`${state.choice?.analytics}:${state.choice?.marketing}`}
          copy={copy}
          initial={state.choice ?? DENIED}
          sessionOnly={state.sessionOnly}
        />
      )}
    </>
  );
}
