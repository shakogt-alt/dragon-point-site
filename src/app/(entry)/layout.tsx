import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { getFontPreloads } from '@/lib/fonts';
import '@/styles/globals.css';

export const metadata: Metadata = {
  title: 'Dragon Point',
  robots: { index: false, follow: true },
};

export default function EntryLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        {getFontPreloads('en').map((href) => (
          <link
            key={href}
            rel="preload"
            href={href}
            as="font"
            type="font/woff2"
            crossOrigin="anonymous"
          />
        ))}
      </head>
      <body>{children}</body>
    </html>
  );
}
