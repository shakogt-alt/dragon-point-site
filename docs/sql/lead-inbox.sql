-- Version 1: apply manually as ONE transaction to the explicitly selected Preview.
-- No Production execution or automatic migration on application startup.
-- HTTP fields are camelCase; bind them to the snake_case columns below.
CREATE TABLE lead_inbox (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  submission_id UUID NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  intent TEXT NOT NULL CHECK (intent IN ('buy', 'invest', 'sell')),
  name TEXT NOT NULL CHECK (char_length(name) BETWEEN 2 AND 120),
  phone TEXT NOT NULL CHECK (phone ~ '^\+?[0-9]{7,15}$'),
  email TEXT,
  budget TEXT,
  message TEXT,
  preferred_language TEXT NOT NULL
    CHECK (preferred_language IN ('en', 'ka', 'ru', 'he')),
  locale TEXT NOT NULL CHECK (locale IN ('en', 'ka', 'ru', 'he')),
  source TEXT NOT NULL CHECK (source = 'dragon-point-landing'),

  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  utm_content TEXT,
  utm_term TEXT,
  gclid TEXT,
  fbclid TEXT,
  referrer TEXT,
  landing_url TEXT,

  forwarding_status TEXT NOT NULL DEFAULT 'pending'
    CHECK (forwarding_status IN ('pending', 'processing', 'delivered', 'failed')),
  forwarded_at TIMESTAMPTZ
);

CREATE INDEX lead_inbox_created_at_idx ON lead_inbox (created_at DESC);
CREATE INDEX lead_inbox_forwarding_pending_idx ON lead_inbox (created_at)
  WHERE forwarding_status = 'pending';

-- Repository transaction pattern (parameterized, never string-interpolated):
-- BEGIN;
-- INSERT INTO lead_inbox (
--   submission_id, intent, name, phone, email, budget, message,
--   preferred_language, locale, source, utm_source, utm_medium, utm_campaign,
--   utm_content, utm_term, gclid, fbclid, referrer, landing_url
-- ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10,
--           $11, $12, $13, $14, $15, $16, $17, $18, $19)
-- ON CONFLICT (submission_id) DO NOTHING
-- RETURNING id;
-- If no row was returned, confirm the existing record by submission_id in this
-- transaction before reporting duplicate. Never overwrite it on conflict.
-- COMMIT;
-- Only after COMMIT resolves: return inserted/duplicate from repository.persist.
-- On any write/commit/confirmation error: rollback as applicable and throw;
-- the reference receiver returns non-2xx. A lost commit acknowledgement is
-- ambiguous: retry the same UUID to confirm the committed record.
--
-- Validate the full strict application contract before binding. SQL checks are
-- additional guards, not a replacement for UUID/text/URL/allowlist validation.
-- forwarding_status/forwarded_at are future metadata only: no forwarding worker,
-- cron, KleekTo delivery or delivery-status transition is implemented here.
