import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';

// Inventario de solo lectura. No transforma ni elimina recursos.
// Uso: node scripts/audit-assets.mjs [directorio-de-salida]
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const output = path.resolve(root, process.argv[2] ?? 'docs/auditoria/2026-11-10');
const slash = (value) => value.split(path.sep).join('/');
async function walk(directory) {
  const entries = await fs.readdir(directory, { withFileTypes: true });
  const files = await Promise.all(entries.map((entry) => {
    const fullPath = path.join(directory, entry.name);
    return entry.isDirectory() ? walk(fullPath) : [fullPath];
  }));
  return files.flat().sort();
}

const sourceFiles = (await walk(path.join(root, 'src')))
  .filter((file) => /\.(tsx?|jsx?|css|json)$/.test(file));
const sources = await Promise.all(sourceFiles.map(async (file) => ({
  file: slash(path.relative(root, file)),
  lines: (await fs.readFile(file, 'utf8')).split(/\r?\n/),
})));
let sharp;
try { sharp = (await import('sharp')).default; } catch { /* Dimensiones opcionales. */ }
const assets = [];
for (const file of await walk(path.join(root, 'public'))) {
  const buffer = await fs.readFile(file);
  const url = slash(path.relative(path.join(root, 'public'), file));
  const references = [];
  for (const source of sources) {
    source.lines.forEach((line, index) => {
      if (line.includes(url)) references.push(`${source.file}:${index + 1}`);
    });
  }
  let dimensions = '';
  if (sharp && /\.(png|jpe?g|webp|avif|gif)$/i.test(file)) {
    try {
      const metadata = await sharp(buffer).metadata();
      dimensions = `${metadata.width}x${metadata.height}`;
    } catch { dimensions = 'no_disponible'; }
  }
  assets.push({
    path: `public/${url}`,
    bytes: buffer.length,
    mib: Number((buffer.length / 1048576).toFixed(4)),
    dimensions,
    sha256: createHash('sha256').update(buffer).digest('hex'),
    referenceStatus: references.length ? 'referencia_textual' : 'sin_referencia_textual',
    references: references.join(';'),
  });
}
assets.sort((a, b) => b.bytes - a.bytes || a.path.localeCompare(b.path));
const headers = ['path', 'bytes', 'mib', 'dimensions', 'sha256', 'referenceStatus', 'references'];
const csv = (value) => `"${String(value).replaceAll('"', '""')}"`;
await fs.mkdir(output, { recursive: true });
await fs.writeFile(path.join(output, 'recursos.csv'), [headers.map(csv).join(','),
  ...assets.map((asset) => headers.map((header) => csv(asset[header])).join(',')),
].join('\n') + '\n');
const grouped = new Map();
for (const asset of assets) {
  const group = grouped.get(asset.sha256) ?? [];
  group.push(asset);
  grouped.set(asset.sha256, group);
}
const summary = {
  scope: 'public; coincidencias textuales de rutas relativas a public dentro de src',
  caveat: 'Una coincidencia puede estar en código inactivo o comentarios. La ausencia no prueba desuso: puede haber URLs dinámicas o clientes externos. Bytes de disco, no transferencia de una página.',
  dimensionsAvailable: Boolean(sharp),
  files: assets.length,
  totalBytes: assets.reduce((sum, asset) => sum + asset.bytes, 0),
  over1MiB: assets.filter((asset) => asset.bytes > 1048576).length,
  withoutTextReferenceBytes: assets.filter((asset) => asset.referenceStatus === 'sin_referencia_textual').reduce((sum, asset) => sum + asset.bytes, 0),
  duplicates: [...grouped.values()].filter((group) => group.length > 1).map((group) => ({
    paths: group.map((asset) => asset.path), bytesPerCopy: group[0].bytes,
  })),
  largest: assets.slice(0, 20),
};
await fs.writeFile(path.join(output, 'recursos-resumen.json'), JSON.stringify(summary, null, 2) + '\n');
console.log(JSON.stringify({ files: summary.files, totalBytes: summary.totalBytes,
  over1MiB: summary.over1MiB, dimensionsAvailable: summary.dimensionsAvailable,
  output: slash(output) }, null, 2));
