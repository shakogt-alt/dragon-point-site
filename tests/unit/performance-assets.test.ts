import { createHash } from 'node:crypto';
import { readFileSync, readdirSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import manifest from '@/assets/fonts/web-manifest.json';
import { getFontPreloads } from '@/lib/fonts';

const hash = (file: string) =>
  createHash('sha256').update(readFileSync(file)).digest('hex');

describe('performance asset invariants', () => {
  it('keeps the approved Hero source below 300KB', () => {
    expect(
      readFileSync('public/images/architecture/illustrative-building.webp')
        .length,
    ).toBeLessThanOrEqual(300000);
  });
  it('publishes only complete, content-addressed WOFF2 assets with retained originals', () => {
    const css = readFileSync('src/styles/fonts.css', 'utf8');
    for (const asset of manifest.assets) {
      const file = `public${asset.url}`;
      expect(hash(file)).toBe(asset.sha256);
      expect(asset.url).toContain(asset.sha256.slice(0, 12));
      expect(readFileSync(file).length).toBe(asset.bytes);
      expect(css).toContain(asset.url);
      expect(readFileSync(file).subarray(0, 4).toString()).toBe('wOF2');
    }
    expect(readdirSync('public/fonts').sort()).toEqual(
      manifest.assets.map((asset) => asset.url.split('/').at(-1)).sort(),
    );
    for (const source of manifest.sources)
      expect(hash(source.file)).toBe(source.sha256);
    for (const proof of manifest.coverage) {
      expect(proof.deliveredCharacters).toBe(proof.sourceCharacters);
      expect(proof.outlinesAndAdvancesIdentical).toBe(true);
    }
  });
  it('preloads only the active script and above-fold weights', () => {
    for (const locale of ['en', 'ka', 'ru', 'he'] as const) {
      const preloads = getFontPreloads(locale);
      expect(preloads.length).toBeGreaterThan(0);
      expect(
        preloads.every((url) =>
          manifest.assets.some((asset) => asset.url === url),
        ),
      ).toBe(true);
      expect(preloads.some((url) => /-(600|700)\./.test(url))).toBe(false);
      if (locale === 'he')
        expect(preloads.every((url) => url.includes('noto'))).toBe(true);
      else expect(preloads.some((url) => url.includes('noto'))).toBe(false);
      expect(
        preloads.some((url) =>
          /latin-extended|firago-extended|firago-hebrew/.test(url),
        ),
      ).toBe(false);
    }
  });
});
