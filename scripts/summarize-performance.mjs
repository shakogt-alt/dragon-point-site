import { readFile, writeFile } from 'node:fs/promises';

const dir = 'docs/performance/phase-7';
const read = async (name) =>
  JSON.parse(await readFile(`${dir}/${name}.json`, 'utf8'));
const baseline = await read('baseline-summary');
const final = await read('final-summary');
const before = await read('baseline-assets');
const after = await read('final-assets');
const fonts = JSON.parse(
  await readFile('src/assets/fonts/web-manifest.json', 'utf8'),
);
const bodyBytes = (probe, pattern) =>
  probe.resources
    .filter((r) => pattern.test(r.url))
    .reduce((sum, r) => sum + r.encodedBytes, 0);
const comparisons = baseline.summaries.map((base) => {
  const find = (rows) =>
    rows.find(
      (row) => row.locale === base.locale && row.device === base.device,
    );
  const a = find(before.probes),
    b = find(after.probes);
  const assetBytes = (probe) => ({
    scripts: bodyBytes(probe, /\.js(\?|$)/),
    fonts: bodyBytes(probe, /\.(woff2|ttf)(\?|$)/),
    images: bodyBytes(probe, /\/_next\/image\?/),
  });
  if (a.textGeometry.length !== b.textGeometry.length)
    throw new Error('Visible text structure changed');
  let maxGeometryDeltaPx = 0;
  for (let i = 0; i < a.textGeometry.length; i++) {
    if (a.textGeometry[i].text !== b.textGeometry[i].text)
      throw new Error('Visible copy changed');
    for (const key of ['x', 'y', 'width', 'height'])
      maxGeometryDeltaPx = Math.max(
        maxGeometryDeltaPx,
        Math.abs(a.textGeometry[i][key] - b.textGeometry[i][key]),
      );
  }
  return {
    locale: base.locale,
    device: base.device,
    width: base.width,
    dpr: base.dpr,
    baseline: {
      scores: base.scores,
      metrics: base.metrics,
      assetEncodedBodyBytes: assetBytes(a),
    },
    final: {
      scores: find(final.summaries).scores,
      metrics: find(final.summaries).metrics,
      assetEncodedBodyBytes: assetBytes(b),
    },
    visibleTextNodesCompared: a.textGeometry.length,
    maxSettledTextGeometryDeltaPx: maxGeometryDeltaPx,
    imageBefore: a.image,
    imageAfter: b.image,
  };
});
const result = {
  note: 'Lighthouse metrics are independent three-run medians; asset bodies are one unthrottled cold-context CDP/resource probe per case. Timings are lab only. Geometry is a settled before/after diagnostic, not a CI timing gate.',
  fontDelivery: {
    publicFiles: fonts.assets.length,
    publicBytes: fonts.assets.reduce((sum, asset) => sum + asset.bytes, 0),
    originalInputBytes: fonts.assets.find(
      (asset) => asset.name === 'firago-input-complete-400',
    ).bytes,
    coverageProof: fonts.coverage,
  },
  comparisons,
};
await writeFile(
  `${dir}/comparison.json`,
  JSON.stringify(result, null, 2) + '\n',
);
for (const c of comparisons) console.log(JSON.stringify(c));
