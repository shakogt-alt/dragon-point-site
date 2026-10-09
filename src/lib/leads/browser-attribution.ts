'use client';

import { captureFirstTouch } from './attribution';
import type { Attribution } from '../validation/lead';

let firstTouch: Attribution | undefined;

// Both analytics boot and LeadForm use the same original document snapshot.
// Memory retention matters when storage is blocked and the visible URL is cleaned.
export function getFirstTouchAttribution(): Attribution {
  if (!firstTouch) {
    let storage: Storage | undefined;
    try {
      storage = window.sessionStorage;
    } catch {
      /* Storage can be blocked. */
    }
    firstTouch = captureFirstTouch(storage, location.href, document.referrer);
  }
  // Capture/persistence completes first, regardless of consent or provider IDs.
  // A later campaign URL is still cleaned even when the first touch is cached.
  try {
    const url = new URL(location.href);
    if (
      /^https?:$/.test(url.protocol) &&
      !url.username &&
      !url.password &&
      /^\/(en|ka|ru|he)$/.test(url.pathname)
    ) {
      let changed = false;
      for (const key of [
        'utm_source',
        'utm_medium',
        'utm_campaign',
        'utm_content',
        'utm_term',
        'gclid',
        'fbclid',
      ]) {
        if (url.searchParams.has(key)) {
          url.searchParams.delete(key);
          changed = true;
        }
      }
      if (changed) history.replaceState(history.state, '', url.href);
    }
  } catch {
    /* A failed replacement never grants tracking; the vendor guard stays strict. */
  }
  return firstTouch;
}
