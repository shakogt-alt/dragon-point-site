import localFont from 'next/font/local';

export const firago = localFont({
  src: [
    {
      path: '../assets/fonts/FiraGO-Regular.woff2',
      weight: '400',
      style: 'normal',
    },
    {
      path: '../assets/fonts/FiraGO-Medium.woff2',
      weight: '500',
      style: 'normal',
    },
    {
      path: '../assets/fonts/FiraGO-SemiBold.woff2',
      weight: '600',
      style: 'normal',
    },
    {
      path: '../assets/fonts/FiraGO-Bold.woff2',
      weight: '700',
      style: 'normal',
    },
  ],
  variable: '--font-firago',
  display: 'swap',
  // Avoid preloading unused weights; optimize font usage with the final UI in Phase 7.
  preload: false,
  fallback: ['Arial', 'sans-serif'],
});
