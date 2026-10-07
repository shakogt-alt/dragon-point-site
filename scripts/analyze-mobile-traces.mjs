import { readFile, readdir, writeFile } from 'node:fs/promises';
import { gzipSync } from 'node:zlib';
import { parse } from 'acorn';

const stage = process.argv[2];
if (!['baseline', 'final', 'offscreen', 'unbalanced', 'ttf'].includes(stage))
  throw new Error('Choose an audit stage or controlled experiment');
const scratch = '.superpowers/phase-7b';
const out = 'docs/performance/phase-7b';
const read = async (path) => JSON.parse(await readFile(path, 'utf8'));
const manifestText = await readFile(
  '.next/server/app/[locale]/page_client-reference-manifest.js',
  'utf8',
);
const manifest = JSON.parse(
  manifestText
    .slice(manifestText.lastIndexOf(' = ') + 3)
    .trim()
    .replace(/;$/, ''),
);
const sourceIds = new Map(
  Object.entries(manifest.clientModules).map(([path, value]) => [
    value.id,
    path.replace('[project]/', ''),
  ]),
);
const modules = new Map();
const chunks = [];
const walk = (node, visit) => {
  if (!node || typeof node !== 'object') return;
  if (node.type) visit(node);
  for (const [key, value] of Object.entries(node)) {
    if (key === 'loc') continue;
    if (Array.isArray(value)) value.forEach((child) => walk(child, visit));
    else if (value && typeof value === 'object') walk(value, visit);
  }
};
function label(code, ids, file) {
  for (const id of ids) if (sourceIds.has(id)) return sourceIds.get(id);
  const exports = [
    ...code.matchAll(/"([A-Za-z][A-Za-z0-9]*)"\s*,\s*\(\)=>/g),
  ].map((m) => m[1]);
  if (exports.includes('useForm') && exports.includes('useFieldArray'))
    return 'react-hook-form';
  if (/hydrateRoot/.test(code) && /createRoot/.test(code))
    return 'React DOM client';
  if (/unstable_scheduleCallback/.test(code)) return 'React scheduler';
  if (/createFromReadableStream/.test(code))
    return 'React Server Components client';
  if (
    /useSyncExternalStore/.test(code) &&
    /useEffect/.test(code) &&
    /version:/.test(code)
  )
    return 'React core';
  if (/Zod|\$Zod/.test(code)) return 'Zod Mini/core';
  if (exports.includes('initializeAnalytics'))
    return 'src/lib/analytics/client.ts';
  if (exports.includes('createAnalyticsRuntime'))
    return 'src/lib/analytics/runtime.ts';
  if (exports.includes('makeAnalyticsEvent'))
    return 'src/lib/analytics/events.ts';
  if (exports.includes('readConsent')) return 'src/lib/analytics/consent.ts';
  if (exports.includes('buildLeadPayload')) return 'src/lib/leads/payload.ts';
  if (exports.includes('getFirstTouchAttribution'))
    return 'src/lib/leads/browser-attribution.ts';
  if (exports.includes('captureAttribution'))
    return 'src/lib/leads/attribution.ts';
  if (exports.includes('attributionSchema'))
    return 'src/lib/validation/attribution.ts';
  if (exports.includes('LanguageSwitcher'))
    return 'src/components/ui/LanguageSwitcher.tsx';
  if (exports.includes('Arrow')) return 'src/components/ui/Arrow.tsx';
  if (exports.includes('Logo')) return 'src/components/ui/Logo.tsx';
  return file.startsWith('turbopack-')
    ? 'Turbopack runtime'
    : `Next/shared module ${ids.join(',')}`;
}
for (const file of await readdir('.next/static/chunks')) {
  if (!file.endsWith('.js')) continue;
  const code = await readFile(`.next/static/chunks/${file}`, 'utf8');
  const ranges = [];
  walk(parse(code, { ecmaVersion: 'latest', locations: true }), (node) => {
    if (
      node.type !== 'CallExpression' ||
      node.callee.type !== 'MemberExpression' ||
      node.callee.property.name !== 'push' ||
      !code.slice(node.callee.start, node.callee.end).includes('TURBOPACK')
    )
      return;
    const elements = node.arguments[0]?.elements ?? [];
    let ids = [];
    for (const element of elements) {
      if (element?.type === 'Literal' && typeof element.value === 'number')
        ids.push(element.value);
      if (
        element &&
        ['ArrowFunctionExpression', 'FunctionExpression'].includes(element.type)
      ) {
        const body = code.slice(element.start, element.end);
        ranges.push({
          ids,
          source: label(body, ids, file),
          start: element.start,
          end: element.end,
          rawBytes: Buffer.byteLength(body),
          isolatedGzipBytes: gzipSync(body).length,
        });
        ids = [];
      }
    }
  });
  const offsets = [0];
  for (let i = 0; i < code.length; i++)
    if (code[i] === '\n') offsets.push(i + 1);
  modules.set(file, { ranges, offsets });
  chunks.push({
    file,
    rawBytes: Buffer.byteLength(code),
    gzipBytes: gzipSync(code).length,
    modules: ranges.map((range) =>
      Object.fromEntries(
        Object.entries(range).filter(
          ([key]) => key !== 'start' && key !== 'end',
        ),
      ),
    ),
  });
}
const locate = (frame, oneBased = false) => {
  if (!frame?.url) return frame?.functionName || 'native/browser';
  const file = frame.url.split('/').at(-1);
  const map = modules.get(file);
  if (!map)
    return frame.url.startsWith('http') ? 'document/inline script' : frame.url;
  const line = frame.lineNumber - (oneBased ? 1 : 0);
  const position =
    (map.offsets[line] ?? 0) + frame.columnNumber - (oneBased ? 1 : 0);
  return (
    map.ranges.find((r) => r.start <= position && position < r.end)?.source ??
    (file.startsWith('turbopack-') ? 'Turbopack runtime' : `chunk ${file}`)
  );
};
const round = (n) => Math.round(n * 1000) / 1000;
const observations = [];
for (const locale of ['en', 'he']) {
  for (let repetition = 1; repetition <= 3; repetition++) {
    const prefix = `${scratch}/${stage}-${locale}-cpu-${repetition}`;
    const trace = (await read(`${prefix}-trace.json`)).traceEvents;
    const profile = await read(`${prefix}-profile.json`);
    const state = await read(`${prefix}-state.json`);
    const main = trace
      .filter((e) => e.name === 'Layout' && e.ph === 'X')
      .sort((a, b) => b.dur - a.dur)[0];
    const events = trace
      .filter(
        (e) =>
          e.pid === main.pid && e.tid === main.tid && e.ph === 'X' && e.dur > 0,
      )
      .sort((a, b) => a.ts - b.ts || b.dur - a.dur);
    const stack = [],
      byEvent = new Map(),
      nodes = [];
    for (const event of events) {
      while (
        stack.length &&
        event.ts + event.dur > stack.at(-1).event.ts + stack.at(-1).event.dur
      )
        stack.pop();
      const node = { event, self: event.dur, parent: stack.at(-1) };
      if (node.parent) node.parent.self -= event.dur;
      stack.push(node);
      nodes.push(node);
    }
    for (const node of nodes)
      byEvent.set(
        node.event.name,
        (byEvent.get(node.event.name) ?? 0) + Math.max(0, node.self) / 1000,
      );
    const longTasks = events
      .filter((e) => e.name === 'RunTask' && e.dur > 50000)
      .map((task) => {
        const children = nodes.filter(
          (n) =>
            n.event.ts >= task.ts &&
            n.event.ts + n.event.dur <= task.ts + task.dur,
        );
        const self = new Map();
        for (const child of children)
          self.set(
            child.event.name,
            (self.get(child.event.name) ?? 0) + Math.max(0, child.self) / 1000,
          );
        return {
          durationMs: round(task.dur / 1000),
          selfWork: [...self]
            .sort((a, b) => b[1] - a[1])
            .slice(0, 8)
            .map(([event, ms]) => ({ event, ms: round(ms) })),
          calls: children
            .filter((n) => n.event.name === 'FunctionCall')
            .map((n) => ({
              source: locate(n.event.args?.data, true),
              function: n.event.args?.data?.functionName,
              inclusiveMs: round(n.event.dur / 1000),
            })),
        };
      })
      .sort((a, b) => b.durationMs - a.durationMs);
    const profileNodes = new Map(profile.nodes.map((n) => [n.id, n]));
    const parents = new Map();
    for (const n of profile.nodes)
      for (const id of n.children ?? []) parents.set(id, n.id);
    const selfSamples = new Map(),
      inclusive = new Map();
    for (let i = 0; i < profile.samples.length; i++) {
      let id = profile.samples[i];
      const ms = profile.timeDeltas[i] / 1000;
      const leaf = locate(profileNodes.get(id).callFrame);
      selfSamples.set(leaf, (selfSamples.get(leaf) ?? 0) + ms);
      const seen = new Set();
      while (id) {
        const node = profileNodes.get(id);
        if (!node) break;
        const source = locate(node.callFrame);
        if (node.callFrame.url && !seen.has(source)) {
          inclusive.set(source, (inclusive.get(source) ?? 0) + ms);
          seen.add(source);
        }
        id = parents.get(id);
      }
    }
    const rows = (m) =>
      [...m]
        .sort((a, b) => b[1] - a[1])
        .map(([source, ms]) => ({ source, ms: round(ms) }));
    const paintEvents = trace.filter(
      (e) => /Font|Decode|Paint/.test(e.name) && e.ph === 'X' && e.dur > 0,
    );
    observations.push({
      locale,
      repetition,
      setup:
        '4x actual CPU throttle; unthrottled network; cold browser; separate from Lighthouse simulated metrics',
      lcp: state.state.lcp.at(-1),
      loadedFonts: state.state.fonts,
      resources: state.state.resources.map((r) => ({
        url: r.name.replace('http://127.0.0.1:3306', ''),
        startMs: r.startTime,
        responseEndMs: r.responseEnd,
        encodedBytes: r.encodedBodySize,
      })),
      mainThreadSelfWork: [...byEvent]
        .sort((a, b) => b[1] - a[1])
        .map(([event, ms]) => ({ event, ms: round(ms) })),
      longTasks,
      longTaskTotalMs: round(longTasks.reduce((n, t) => n + t.durationMs, 0)),
      blockingOver50Ms: round(
        longTasks.reduce((n, t) => n + Math.max(0, t.durationMs - 50), 0),
      ),
      sampledSelfMs: rows(selfSamples),
      sampledInclusiveMs: rows(inclusive),
      nativePaintDecodeEvents: paintEvents.map((e) => ({
        name: e.name,
        ms: round(e.dur / 1000),
        mainThread: e.pid === main.pid && e.tid === main.tid,
      })),
      externalRequests: state.external,
      errors: state.errors,
    });
  }
}
await writeFile(
  `${out}/${stage}-trace-analysis.json`,
  JSON.stringify(
    {
      note: 'Exclusive trace-event work subtracts nested X events; inclusive CPU sample ancestry overlaps and must not be summed. Native font shaping is included in layout/program work and cannot be uniquely isolated by JS sampling. No sampled time means not observed, not zero cost.',
      observations,
    },
    null,
    2,
  ) + '\n',
);
const assets = await read(
  `${out}/${['baseline', 'final'].includes(stage) ? stage : 'baseline'}-assets.json`,
);
await writeFile(
  `${out}/${stage}-bundle.json`,
  JSON.stringify(
    {
      note: 'Module function spans are measured from actual minified production chunks using Acorn AST; source entry IDs come from the production client-reference manifest; recognizable dependency exports identify RHF/React/Zod. Isolated module gzip sizes are not additive; network body lengths are measured separately. Unknown Next/shared IDs are retained explicitly.',
      initialScripts: assets.probes
        .filter((p) => p.device === 'mobile')
        .map((p) => ({
          locale: p.locale,
          resources: p.resources.filter((r) => /\.js(\?|$)/.test(r.url)),
        })),
      chunks,
    },
    null,
    2,
  ) + '\n',
);
for (const row of observations)
  console.log(
    JSON.stringify({
      locale: row.locale,
      repetition: row.repetition,
      blockingOver50Ms: row.blockingOver50Ms,
      work: row.mainThreadSelfWork.slice(0, 7),
      sampledSelf: row.sampledSelfMs.slice(0, 9),
    }),
  );
