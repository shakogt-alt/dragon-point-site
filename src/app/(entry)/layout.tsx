import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { firago } from '@/lib/fonts';
import '@/styles/globals.css';

export const metadata: Metadata = { title: 'Dragon Point — Foundation' };

export default function EntryLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={firago.variable}>
      <body>{children}</body>
    </html>
  );
}
