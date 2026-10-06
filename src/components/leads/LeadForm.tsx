'use client';

import { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import type { Locale } from '@/lib/i18n/locales';
import type { Messages } from '@/lib/i18n/messages';
import {
  intents,
  leadLocales,
  leadFormSchema,
  type LeadFormValues,
  type Attribution,
} from '@/lib/validation/lead';
import { captureFirstTouch } from '@/lib/leads/attribution';
import { buildLeadPayload } from '@/lib/leads/payload';
import { Arrow } from '@/components/ui/Arrow';

const subscribe = () => () => {};
const hydrated = () => true;
const server = () => false;

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
  const {
    register,
    handleSubmit,
    setValue,
    setFocus,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<LeadFormValues>({
    resolver: zodResolver(leadFormSchema),
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
  });

  useEffect(() => {
    let storage: Storage | undefined;
    try {
      storage = window.sessionStorage;
    } catch {
      /* Private browsing can block storage. */
    }
    attribution.current = captureFirstTouch(
      storage,
      location.href,
      document.referrer,
    );
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
      const intent = action.getAttribute('data-intent');
      if (intents.includes(intent as (typeof intents)[number]))
        setValue('intent', intent as LeadFormValues['intent'], {
          shouldValidate: true,
        });
      if (!(action instanceof HTMLAnchorElement)) location.hash = 'advisor';
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

  const submit = async (values: LeadFormValues) => {
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
      } else setStatus(response.status === 429 ? 'rate' : 'error');
    } catch {
      setStatus('error');
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
        void handleSubmit(submit)(event);
      }}
      action="/api/leads"
      method="post"
      noValidate
      aria-busy={isSubmitting}
    >
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
