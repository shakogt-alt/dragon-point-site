'use client';

import { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { useForm, type Resolver } from 'react-hook-form';
import type { Locale } from '@/lib/i18n/locales';
import type { Messages } from '@/lib/i18n/messages';
import type { LeadFormValues, Attribution } from '@/lib/validation/lead';
import { intents, leadLocales } from '@/lib/leads/constants';
import { getFirstTouchAttribution } from '@/lib/leads/browser-attribution';
import { buildLeadPayload } from '@/lib/leads/payload';
import { Arrow } from '@/components/ui/Arrow';
import { trackAnalytics } from '@/lib/analytics/client';

const subscribe = () => () => {};
const hydrated = () => true;
const server = () => false;
const focusOrder = [
  'intent',
  'name',
  'phone',
  'email',
  'budget',
  'message',
  'preferredLanguage',
] as const;

let validation: Promise<Resolver<LeadFormValues>> | undefined;
function loadValidation() {
  validation ??= Promise.all([
    import('@hookform/resolvers/zod'),
    import('@/lib/validation/lead'),
  ])
    .then(([{ zodResolver }, { leadFormSchema }]) =>
      zodResolver(leadFormSchema),
    )
    .catch((error) => {
      validation = undefined;
      throw error;
    });
  return validation;
}

export function LeadForm({
  locale,
  copy,
}: {
  locale: Locale;
  copy: Messages['landing']['lead'];
}) {
  const ready = useSyncExternalStore(subscribe, hydrated, server);
  const [status, setStatus] = useState<'idle' | 'error' | 'rate' | 'success'>(
    'idle',
  );
  const feedback = useRef<HTMLDivElement>(null);
  const attribution = useRef<Attribution>({});
  const pendingInvalidFocus = useRef<(typeof focusOrder)[number] | undefined>(
    undefined,
  );
  const {
    register,
    handleSubmit,
    setValue,
    setFocus,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<LeadFormValues>({
    resolver: async (values, context, options) => {
      try {
        return await (
          await loadValidation()
        )(values, context, options);
      } catch {
        // Download failure stays fail-closed, retains the enquiry and permits retry.
        setStatus('error');
        return { values: {}, errors: { root: { type: 'delivery' } } };
      }
    },
    defaultValues: {
      intent: 'buy',
      name: '',
      phone: '',
      email: '',
      budget: '',
      message: '',
      preferredLanguage: locale,
      website: '',
    },
    mode: 'onSubmit',
    // RHF's timer can run while the submitting fieldset is still disabled.
    shouldFocusError: false,
  });

  useEffect(() => {
    if (isSubmitting || !pendingInvalidFocus.current) return;
    // Effects run after the enabled fieldset and error descriptions commit.
    const field = pendingInvalidFocus.current;
    pendingInvalidFocus.current = undefined;
    setFocus(field);
  }, [errors, isSubmitting, setFocus]);

  useEffect(() => {
    attribution.current = getFirstTouchAttribution();
    const activate = (event: MouseEvent) => {
      if (
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.altKey ||
        event.shiftKey
      )
        return;
      const target = event.target instanceof Element ? event.target : null;
      const action = target?.closest(
        'a[href="#advisor"], .dp-goal-card[data-intent]',
      );
      if (!action) return;
      // Native fragment navigation can take focus back from the field in Firefox.
      event.preventDefault();
      if (location.hash !== '#advisor')
        history.pushState(history.state, '', '#advisor');
      const intent = action.getAttribute('data-intent');
      if (intents.includes(intent as (typeof intents)[number]))
        setValue('intent', intent as LeadFormValues['intent'], {
          shouldValidate: true,
        });
      requestAnimationFrame(() => {
        // Setting an already-current fragment does not scroll a card activation.
        document
          .getElementById('advisor')
          ?.scrollIntoView({ block: 'start', behavior: 'auto' });
        const field =
          document.querySelector<HTMLElement>('.dp-lead-success') ??
          document.getElementById('lead-name');
        if (!field) return;
        field.focus({ preventScroll: true });
        const bounds = field.getBoundingClientRect();
        const headerBottom =
          document.querySelector('header')?.getBoundingClientRect().bottom ?? 0;
        const viewportBottom =
          window.visualViewport?.height ?? window.innerHeight;
        if (bounds.top < headerBottom || bounds.bottom > viewportBottom)
          field.scrollIntoView({ block: 'center', behavior: 'auto' });
      });
    };
    document.addEventListener('click', activate);
    return () => document.removeEventListener('click', activate);
  }, [setValue]);

  useEffect(() => {
    if (status !== 'idle') feedback.current?.focus({ preventScroll: false });
  }, [status]);

  useEffect(() => {
    let frame = 0;
    const reveal = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const field = document.activeElement;
        if (
          !(field instanceof HTMLElement) ||
          !field.matches(
            '#lead-form input, #lead-form textarea, #lead-form select',
          )
        )
          return;
        const viewport = window.visualViewport;
        const top =
          Math.max(
            viewport?.offsetTop ?? 0,
            document.querySelector('header')?.getBoundingClientRect().bottom ??
              0,
          ) + 8;
        const banner = document.querySelector('.dp-consent-banner');
        const bottom =
          Math.min(
            (viewport?.offsetTop ?? 0) +
              (viewport?.height ?? window.innerHeight),
            banner?.getBoundingClientRect().top ?? Infinity,
          ) - 8;
        const bounds = field.getBoundingClientRect();
        const delta =
          bounds.top < top || bounds.height > bottom - top
            ? bounds.top - top
            : bounds.bottom > bottom
              ? bounds.bottom - bottom
              : 0;
        if (delta) window.scrollBy({ top: delta, behavior: 'instant' });
      });
    };
    document.addEventListener('focusin', reveal);
    window.addEventListener('resize', reveal);
    window.visualViewport?.addEventListener('resize', reveal);
    return () => {
      cancelAnimationFrame(frame);
      document.removeEventListener('focusin', reveal);
      window.removeEventListener('resize', reveal);
      window.visualViewport?.removeEventListener('resize', reveal);
    };
  }, []);

  const submit = async (values: LeadFormValues) => {
    const measurement = { locale, intent: values.intent, surface: 'lead' };
    trackAnalytics('lead_form_submit', measurement);
    setStatus('idle');
    try {
      const response = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          ...buildLeadPayload(values, locale, attribution.current),
          website: values.website,
        }),
        signal: AbortSignal.timeout(12000),
      });
      const result: unknown = await response.json();
      if (
        response.ok &&
        result &&
        typeof result === 'object' &&
        'ok' in result &&
        result.ok === true
      ) {
        reset();
        setStatus('success');
        trackAnalytics('lead_form_success', measurement);
      } else {
        setStatus(response.status === 429 ? 'rate' : 'error');
        trackAnalytics('lead_form_error', {
          ...measurement,
          errorKind: response.status === 429 ? 'rate' : 'delivery',
        });
      }
    } catch {
      setStatus('error');
      trackAnalytics('lead_form_error', {
        ...measurement,
        errorKind: 'delivery',
      });
    }
  };
  const errorFor = (key: keyof LeadFormValues) =>
    errors[key] ? copy.errors[key] : undefined;
  const fieldError = (key: keyof LeadFormValues) =>
    errorFor(key) ? (
      <p id={`lead-${key}-error`} className="dp-field-error">
        {errorFor(key)}
      </p>
    ) : null;
  const invalid = (key: keyof LeadFormValues) => ({
    'aria-invalid': !!errors[key],
    'aria-describedby': errors[key]
      ? `lead-${key}-error${key === 'phone' ? ' lead-phone-hint' : ''}`
      : key === 'phone'
        ? 'lead-phone-hint'
        : undefined,
  });

  if (status === 'success')
    return (
      <div
        ref={feedback}
        className="dp-lead-success"
        role="status"
        tabIndex={-1}
      >
        <p>{copy.success}</p>
        <button
          className="dp-action dp-action-secondary"
          type="button"
          onClick={() => {
            setStatus('idle');
            requestAnimationFrame(() => setFocus('name'));
          }}
        >
          {copy.another}
          <Arrow />
        </button>
      </div>
    );
  return (
    <form
      id="lead-form"
      onSubmit={(event) => {
        void handleSubmit(submit, (errors) => {
          pendingInvalidFocus.current = focusOrder.find(
            (field) => errors[field],
          );
          trackAnalytics('lead_form_error', {
            locale,
            surface: 'lead',
            errorKind:
              errors.root?.type === 'delivery' ? 'delivery' : 'validation',
          });
        })(event);
      }}
      onFocusCapture={() => {
        void loadValidation().catch(() => {});
      }}
      action="/api/leads"
      method="post"
      noValidate
      aria-busy={isSubmitting}
    >
      <div className="dp-visually-hidden" role="alert" aria-atomic="true">
        {Object.keys(errors)
          .map((key) => copy.errors[key as keyof LeadFormValues])
          .join(' ')}
      </div>
      {(status === 'error' || status === 'rate') && (
        <div
          className="dp-lead-feedback"
          role="alert"
          tabIndex={-1}
          ref={feedback}
        >
          {status === 'rate' ? copy.rateError : copy.error}
        </div>
      )}
      <fieldset className="dp-form-fields" disabled={!ready || isSubmitting}>
        <legend className="dp-visually-hidden">{copy.title}</legend>
        <fieldset
          className="dp-intents"
          aria-describedby={errors.intent ? 'lead-intent-error' : undefined}
        >
          <legend>{copy.intent}</legend>
          <div>
            {intents.map((intent) => (
              <label key={intent}>
                <input type="radio" value={intent} {...register('intent')} />
                <span>{copy.intents[intent]}</span>
              </label>
            ))}
          </div>
          {fieldError('intent')}
        </fieldset>
        <div className="dp-field-grid">
          {(['name', 'phone', 'email', 'budget'] as const).map((key) => (
            <div className="dp-field" key={key}>
              <label htmlFor={`lead-${key}`}>
                {copy.labels[key]}
                {(key === 'name' || key === 'phone') && (
                  <span aria-hidden="true"> {copy.requiredMark}</span>
                )}
              </label>
              <input
                id={`lead-${key}`}
                // Blank CSS hook defers the complete input font until focus/value.
                placeholder=" "
                type={
                  key === 'phone' ? 'tel' : key === 'email' ? 'email' : 'text'
                }
                dir={key === 'phone' || key === 'email' ? 'ltr' : 'auto'}
                autoComplete={
                  key === 'phone'
                    ? 'tel'
                    : key === 'email'
                      ? 'email'
                      : key === 'name'
                        ? 'name'
                        : 'off'
                }
                required={key === 'name' || key === 'phone'}
                maxLength={key === 'phone' ? 60 : key === 'email' ? 254 : 120}
                {...register(key)}
                {...invalid(key)}
              />
              {key === 'phone' && (
                <p id="lead-phone-hint" className="dp-field-hint">
                  {copy.phoneHint}
                </p>
              )}
              {fieldError(key)}
            </div>
          ))}
          <div className="dp-field dp-field-wide">
            <label htmlFor="lead-message">{copy.labels.message}</label>
            <textarea
              id="lead-message"
              placeholder=" "
              dir="auto"
              rows={4}
              maxLength={2000}
              {...register('message')}
              {...invalid('message')}
            />
            {fieldError('message')}
          </div>
          <div className="dp-field dp-field-wide">
            <label htmlFor="lead-preferredLanguage">
              {copy.labels.preferredLanguage}
            </label>
            <select
              id="lead-preferredLanguage"
              {...register('preferredLanguage')}
              {...invalid('preferredLanguage')}
            >
              {leadLocales.map((language) => (
                <option key={language} value={language} dir="auto">
                  {copy.languages[language]}
                </option>
              ))}
            </select>
            {fieldError('preferredLanguage')}
          </div>
        </div>
        <div className="dp-honeypot" aria-hidden="true">
          <label htmlFor="lead-website">{copy.labels.website}</label>
          <input
            id="lead-website"
            type="text"
            autoComplete="off"
            tabIndex={-1}
            {...register('website')}
          />
        </div>
      </fieldset>
      <button
        className="dp-action dp-lead-submit"
        type="submit"
        disabled={!ready || isSubmitting}
      >
        {isSubmitting ? copy.sending : copy.submit}
        <Arrow />
      </button>
    </form>
  );
}
