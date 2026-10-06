'use client';

import { useEffect, useState } from 'react';
import { Arrow } from '@/components/ui/Arrow';

export function MobileLeadCTA({ label }: { label: string }) {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const update = () => {
      const hero = document.getElementById('hero')?.getBoundingClientRect();
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
    update();
    window.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
    window.visualViewport?.addEventListener('resize', update);
    document.addEventListener('focusin', update);
    document.addEventListener('focusout', update);
    const observer = new MutationObserver(update);
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
      window.removeEventListener('scroll', update);
      window.removeEventListener('resize', update);
      window.visualViewport?.removeEventListener('resize', update);
      document.removeEventListener('focusin', update);
      document.removeEventListener('focusout', update);
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
