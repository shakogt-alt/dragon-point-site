'use client';

import { useEffect, useState } from 'react';
import { Arrow } from '@/components/ui/Arrow';

export function MobileLeadCTA({ label }: { label: string }) {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const update = () => {
      // Avoid forcing below-fold section layout while the sticky CTA cannot
      // appear. This is especially important with native offscreen rendering.
      if (window.innerWidth >= 768) {
        setVisible(false);
        return;
      }
      const hero = document.getElementById('hero')?.getBoundingClientRect();
      if (!hero || hero.bottom > 0) {
        setVisible(false);
        return;
      }
      const lead = document.getElementById('advisor')?.getBoundingClientRect();
      const editing = document.activeElement?.matches(
        'input, textarea, select',
      );
      const keyboard =
        !!window.visualViewport &&
        window.visualViewport.height < window.innerHeight * 0.75;
      const consent =
        document.documentElement.getAttribute('data-consent-ui') === 'open' ||
        Array.from(
          document.querySelectorAll<HTMLElement>('[data-consent-overlay]'),
        ).some((el) => el.getClientRects().length > 0);
      const menu = !!document.querySelector('header details[open]');
      const show =
        window.innerWidth < 768 &&
        !!hero &&
        hero.bottom <= 0 &&
        !!lead &&
        !(lead.top < window.innerHeight && lead.bottom > 0) &&
        !editing &&
        !keyboard &&
        !consent &&
        !menu;
      setVisible(show);
    };
    // Multiple hydration/consent mutations can otherwise force the same
    // geometry repeatedly within one frame. Keep one pending read/update.
    let frame = 0;
    const schedule = () => {
      if (frame) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        update();
      });
    };
    schedule();
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule);
    window.visualViewport?.addEventListener('resize', schedule);
    document.addEventListener('focusin', schedule);
    document.addEventListener('focusout', schedule);
    const observer = new MutationObserver(schedule);
    observer.observe(document.documentElement, {
      subtree: true,
      childList: true,
      attributes: true,
      attributeFilter: [
        'open',
        'hidden',
        'style',
        'class',
        'data-consent-ui',
        'data-consent-overlay',
      ],
    });
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', schedule);
      window.visualViewport?.removeEventListener('resize', schedule);
      document.removeEventListener('focusin', schedule);
      document.removeEventListener('focusout', schedule);
      observer.disconnect();
    };
  }, []);
  return (
    <div className="dp-mobile-lead-cta" hidden={!visible}>
      <div className="dp-container">
        <a className="dp-action" href="#advisor">
          <span>{label}</span>
          <Arrow />
        </a>
      </div>
    </div>
  );
}
