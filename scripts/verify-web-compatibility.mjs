import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import assert from 'node:assert/strict';

// Prueba de preservación contra la base de la auditoría, no contra un commit móvil.
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const base = process.argv[2] ?? '2fbef506167a6fb82efe4bc0accb0ba5b45216bf';
const git = (...args) => execFileSync('git', args, { cwd: root, encoding: 'utf8', maxBuffer: 20_000_000 });
const json = async (file) => JSON.parse(await fs.readFile(path.join(root, file), 'utf8'));
const beforeLock = JSON.parse(git('show', `${base}:package-lock.json`));
const afterLock = await json('package-lock.json');
const beforePackage = JSON.parse(git('show', `${base}:package.json`));
const afterPackage = await json('package.json');

for (const [name, version] of Object.entries(beforePackage.dependencies)) {
  if (name !== 'next') assert.equal(afterPackage.dependencies[name], version, `Dependencia fuera de alcance: ${name}`);
}
const protectedPaths = [
  'src/app/api/', 'src/lib/', 'src/shared/lib/', 'src/shared/types/',
  'src/shared/hooks/', 'src/services/', 'src/features/', 'src/stores/',
  'src/models/', 'src/hooks/', 'src/proxy.ts', 'firestore.rules', 'database.rules.json',
];
const changed = git('diff', '--name-only', base, '--').trim().split(/\r?\n/).filter(Boolean);
const added = git('ls-files', '--others', '--exclude-standard').trim().split(/\r?\n/).filter(Boolean);
const protectedChanges = [...new Set([...changed, ...added])]
  .filter((file) => protectedPaths.some((prefix) => prefix.endsWith('/') ? file.startsWith(prefix) : file === prefix));
assert.deepEqual(protectedChanges, [], 'Hay cambios en los límites de datos/autenticación protegidos');

function resolveDependency(lock, from, name) {
  let current = from;
  while (current) {
    const candidate = `${current}/node_modules/${name}`;
    if (lock.packages[candidate]) return candidate;
    const parent = current.lastIndexOf('/node_modules/');
    current = parent < 0 ? '' : current.slice(0, parent);
  }
  const candidate = `node_modules/${name}`;
  return lock.packages[candidate] ? candidate : null;
}
const queue = ['firebase', 'firebase-admin'].map((name) => [`node_modules/${name}`, `node_modules/${name}`]);
const visited = new Set();
while (queue.length) {
  const [beforePath, afterPath] = queue.pop();
  const key = `${beforePath}|${afterPath}`;
  if (visited.has(key)) continue;
  visited.add(key);
  const before = beforeLock.packages[beforePath];
  const after = afterLock.packages[afterPath];
  assert.ok(after, `Dependencia ausente: ${afterPath}`);
  assert.equal(after.version, before.version, `Cambió la cadena Firebase: ${beforePath}`);
  assert.equal(after.integrity, before.integrity, `Cambió el contenido de ${beforePath}`);
  for (const name of Object.keys({ ...before.dependencies, ...before.optionalDependencies })) {
    const previous = resolveDependency(beforeLock, beforePath, name);
    if (!previous) continue;
    const current = resolveDependency(afterLock, afterPath, name);
    assert.ok(current, `Dependencia ausente: ${name}`);
    queue.push([previous, current]);
  }
}

// Conserva los archivos públicos antiguos: pueden ser consumidos por móvil/enlaces.
const csv = await fs.readFile(path.join(root, 'docs/auditoria/2026-11-10/recursos.csv'), 'utf8');
const originals = csv.trim().split(/\r?\n/).slice(1);
for (const row of originals) {
  const columns = [...row.matchAll(/"((?:[^"]|"")*)"(?:,|$)/g)].map((match) => match[1].replaceAll('""', '"'));
  const buffer = await fs.readFile(path.join(root, columns[0]));
  assert.equal(createHash('sha256').update(buffer).digest('hex'), columns[4], `Original modificado: ${columns[0]}`);
}
const result = {
  base,
  protectedChanges,
  firebasePackagesPreserved: visited.size,
  originalPublicFilesPreserved: originals.length,
  note: 'Verifica código y dependencias compartidas. No sustituye pruebas de la app móvil o del despliegue.',
};
const output = path.join(root, 'docs/auditoria/2026-11-11/compatibilidad.json');
await fs.mkdir(path.dirname(output), { recursive: true });
await fs.writeFile(output, JSON.stringify(result, null, 2) + '\n');
console.log(JSON.stringify(result, null, 2));
