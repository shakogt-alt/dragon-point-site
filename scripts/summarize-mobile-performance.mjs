import { readFile, writeFile } from 'node:fs/promises';
const out = 'docs/performance/phase-7b';
const read = async (path) => JSON.parse(await readFile(path, 'utf8'));
const previous = await read('docs/performance/phase-7/final-summary.json');
const control = await read(`${out}/baseline-summary.json`);
const final = await read(`${out}/final-summary.json`);
await writeFile(
  `${out}/comparison.json`,
  JSON.stringify(
    {
      note: 'Independent metric medians; Phase 7: three samples; Phase 7B: five mobile, one desktop. Encoded asset probes exclude headers and are separate from Lighthouse total network weight.',
      cases: final.summaries.map((row) => ({
        locale: row.locale,
        device: row.device,
        phase7: previous.summaries.find(
          (r) => r.locale === row.locale && r.device === row.device,
        ),
        control: control.summaries.find(
          (r) => r.locale === row.locale && r.device === row.device,
        ),
        final: row,
      })),
      initialAssets: await Promise.all(
        ['baseline', 'final'].map(async (stage) => ({
          stage,
          probes: (await read(`${out}/${stage}-assets.json`)).probes.map(
            (probe) => ({
              locale: probe.locale,
              device: probe.device,
              jsBody: probe.resources
                .filter((r) => /\.js($|\?)/.test(r.url))
                .reduce((n, r) => n + r.encodedBytes, 0),
              fontBody: probe.resources
                .filter((r) => /\.(woff2|ttf)($|\?)/.test(r.url))
                .reduce((n, r) => n + r.encodedBytes, 0),
            }),
          ),
        })),
      ),
    },
    null,
    2,
  ) + '\n',
);
