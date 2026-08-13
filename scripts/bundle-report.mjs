import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';

const assets = path.resolve('dist/assets');
if (!fs.existsSync(assets)) throw new Error('dist/assets is missing; run npm run build first');
const rows = fs.readdirSync(assets)
  .filter((name) => name.endsWith('.js'))
  .map((name) => {
    const bytes = fs.readFileSync(path.join(assets, name));
    return { name, raw: bytes.length, gzip: zlib.gzipSync(bytes).length, brotli: zlib.brotliCompressSync(bytes).length };
  })
  .sort((a, b) => b.raw - a.raw);

const find = (prefix) => rows.find((row) => row.name.startsWith(prefix));
const common = ['index-', 'react-vendor-', 'framer-'].map(find).filter(Boolean);
const commonRaw = common.reduce((total, row) => total + row.raw, 0);
const baselineCommonRaw = 365_360;
const failures = [];
if (commonRaw > Math.floor(baselineCommonRaw * 1.05)) failures.push(`Common JS ${commonRaw} exceeds 5% budget`);
if (rows.some((row) => /^ai-|google|genai/i.test(row.name))) failures.push('AI provider chunk exists in client build');
const neural = find('NeuralInterface-');
if (neural && neural.raw > 50_000) failures.push(`Neural Interface ${neural.raw} exceeds 50 kB raw`);

const manifestPath = path.resolve('dist/.vite/manifest.json');
const firstLoadGraphs = {};
if (fs.existsSync(manifestPath)) {
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  const byFile = new Map(rows.map((row) => [row.name, row]));
  const collect = (key, visited = new Set()) => {
    if (!key || visited.has(key) || !manifest[key]) return visited;
    visited.add(key);
    for (const imported of manifest[key].imports || []) collect(imported, visited);
    return visited;
  };
  for (const [key, entry] of Object.entries(manifest)) {
    if (!entry.isEntry && !/pages\/(Home|Work)\.tsx$/.test(entry.src || '')) continue;
    const files = [...collect(key)]
      .map((manifestKey) => manifest[manifestKey]?.file)
      .filter((file) => typeof file === 'string' && file.endsWith('.js'));
    const graphRows = files.map((file) => byFile.get(path.basename(file))).filter(Boolean);
    firstLoadGraphs[entry.isEntry ? 'entry' : entry.src] = {
      files,
      raw: graphRows.reduce((total, row) => total + row.raw, 0),
      gzip: graphRows.reduce((total, row) => total + row.gzip, 0),
      brotli: graphRows.reduce((total, row) => total + row.brotli, 0),
    };
  }
}

const report = { generatedAt: new Date().toISOString(), baselineCommonRaw, commonRaw, firstLoadGraphs, rows, failures };
fs.mkdirSync('artifacts/bundle', { recursive: true });
fs.writeFileSync('artifacts/bundle/report.json', `${JSON.stringify(report, null, 2)}\n`);
console.table(rows.slice(0, 20));
console.log(`Common JS: ${commonRaw} raw bytes (${((commonRaw / baselineCommonRaw - 1) * 100).toFixed(2)}% vs PR0 baseline)`);
console.log('First-load request graphs:', firstLoadGraphs);
if (failures.length) {
  console.error(failures.join('\n'));
  process.exit(1);
}
