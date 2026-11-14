import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import sharp from 'sharp';

// Derivados exclusivos de la web. Conserva originales y URLs existentes.
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const output = path.join(root, 'public/assets/optimized');
const generated = path.join(root, 'src/generated');
const jobs = [
  { name: 'contacto', source: 'assets/images/SICAP/webp/contacto.webp', widths: [480, 768, 1280, 1600] },
  { name: 'software', source: 'assets/images/SICAP/webp/software_sicap.webp', widths: [480, 768, 1280, 1600] },
  { name: 'login', source: 'assets/images/login.png', widths: [1000] },
];
await fs.mkdir(output, { recursive: true });
await fs.mkdir(generated, { recursive: true });
const manifest = {};
const measurements = [];
for (const job of jobs) {
  const input = await fs.readFile(path.join(root, 'public', job.source));
  const variants = [];
  for (const width of job.widths) {
    const { data, info } = await sharp(input)
      .rotate()
      .resize({ width, withoutEnlargement: true })
      .webp({ quality: 82, effort: 6 })
      .toBuffer({ resolveWithObject: true });
    const hash = createHash('sha256').update(data).digest('hex').slice(0, 12);
    const filename = `${job.name}-${info.width}.${hash}.webp`;
    // Cada nombre inmutable identifica exactamente el contenido codificado.
    await fs.writeFile(path.join(output, filename), data);
    variants.push({ src: `/assets/optimized/${filename}`, width: info.width, height: info.height, bytes: data.length });
  }
  const largest = variants.at(-1);
  manifest[job.name] = {
    src: largest.src,
    srcSet: variants.map((variant) => `${variant.src} ${variant.width}w`).join(', '),
    width: largest.width,
    height: largest.height,
  };
  measurements.push({ name: job.name, source: `public/${job.source}`, originalBytes: input.length, variants });
}
await fs.writeFile(path.join(generated, 'web-assets.ts'),
  '// Generado por npm run assets:optimize. No editar manualmente.\n'
  + `export const webAssets = ${JSON.stringify(manifest, null, 2)} as const;\n`);
const reportDir = path.join(root, 'docs/auditoria/2026-11-11');
await fs.mkdir(reportDir, { recursive: true });
await fs.writeFile(path.join(reportDir, 'imagenes.json'), JSON.stringify(measurements, null, 2) + '\n');
for (const item of measurements) {
  const largest = item.variants.at(-1);
  console.log(`${item.name}: ${item.originalBytes} -> ${largest.bytes} bytes (${largest.width}x${largest.height}); ${item.variants.length} variantes`);
}
