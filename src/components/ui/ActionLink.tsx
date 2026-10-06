import type { ReactNode } from 'react';
import { Arrow } from './Arrow';

export function ActionLink({
  href,
  children,
  secondary = false,
  intent,
}: {
  href: string;
  children: ReactNode;
  secondary?: boolean;
  intent?: string;
}) {
  return (
    <a
      className={`dp-action${secondary ? ' dp-action-secondary' : ''}`}
      href={href}
      data-intent={intent}
    >
      <span>{children}</span>
      <Arrow />
    </a>
  );
}
