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
  return firstTouch;
}
