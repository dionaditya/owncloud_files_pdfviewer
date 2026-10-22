#!/usr/bin/env node
/**
 * Sync the vendored viewer bundle from @dionaditya/wasm-pdf-reader.
 *
 * ownCloud apps ship static assets — there is no npm step at install time — so
 * the built bundle is checked in under js/vendor/wasm-pdf-reader/. This script
 * is what refreshes it, and it records exactly where the bytes came from.
 *
 *   npm run sync-viewer                          # from the pinned devDependency
 *   npm run sync-viewer -- --from ../wasm-pdf-reader
 *   npm run sync-viewer -- --check               # verify, write nothing
 *
 * Source resolution order: --from, $VIEWER_SRC, node_modules.
 */
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { copyFile, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const target = join(root, 'js', 'vendor', 'wasm-pdf-reader');

// Everything the mount page needs, and nothing else: the React build, the demo
// pages and the type declarations stay out of the PHP app.
const FILES = [
  'index.js',
  'document.js',
  'loader.js',
  'mount.js',
  'text.js',
  'styles.css',
  'index.d.ts',
  'wasm/pdf-reader.mjs',
  'wasm/pdf-reader.wasm',
];

const args = process.argv.slice(2);
const flag = (name) => {
  const i = args.indexOf(name);
  return i >= 0 ? (args[i + 1] && !args[i + 1].startsWith('--') ? args[i + 1] : true) : null;
};
const checkOnly = args.includes('--check');

function resolveSource() {
  const from = flag('--from');
  const candidates = [];
  if (typeof from === 'string') candidates.push(from);
  if (process.env.VIEWER_SRC) candidates.push(process.env.VIEWER_SRC);
  candidates.push(join(root, 'node_modules', '@dionaditya', 'wasm-pdf-reader'));
  for (const c of candidates) {
    const dir = resolve(root, c);
    if (existsSync(join(dir, 'dist', 'index.js'))) return dir;
  }
  console.error(
    'cannot find the viewer bundle.\n' +
    '  install it:  npm install\n' +
    '  or point at a checkout of dionaditya/wasm-pdf-reader:\n' +
    '               npm run sync-viewer -- --from ../wasm-pdf-reader',
  );
  process.exit(2);
}

function sha256(buf) {
  return createHash('sha256').update(buf).digest('hex');
}

function gitInfo(dir) {
  try {
    const commit = execFileSync('git', ['-C', dir, 'rev-parse', 'HEAD'], { encoding: 'utf8' }).trim();
    const dirty = execFileSync('git', ['-C', dir, 'status', '--porcelain'], { encoding: 'utf8' }).trim();
    return { commit, dirty: dirty.length > 0 };
  } catch {
    return { commit: null, dirty: false };
  }
}

const source = resolveSource();
const pkg = JSON.parse(await readFile(join(source, 'package.json'), 'utf8'));
const dist = join(source, 'dist');
const git = gitInfo(source);

if (git.dirty && !checkOnly) {
  console.warn('warning: the engine checkout has uncommitted changes; the recorded commit will not match the bytes.');
}

const copied = {};
let mismatch = 0;
for (const rel of FILES) {
  const from = join(dist, rel);
  if (!existsSync(from)) {
    console.error(`missing in the source bundle: dist/${rel}`);
    process.exit(1);
  }
  const bytes = await readFile(from);
  const digest = sha256(bytes);
  copied[rel] = { bytes: bytes.length, sha256: digest };
  if (checkOnly) {
    const dest = join(target, rel);
    const have = existsSync(dest) ? sha256(await readFile(dest)) : null;
    const state = have === digest ? 'ok' : have ? 'DIFFERS' : 'MISSING';
    if (state !== 'ok') mismatch++;
    console.log(`${state.padEnd(8)} ${rel}`);
    continue;
  }
  await mkdir(dirname(join(target, rel)), { recursive: true });
  await copyFile(from, join(target, rel));
  console.log(`copied   ${rel}  ${(bytes.length / 1024).toFixed(0)} KB`);
}

if (checkOnly) {
  console.log(mismatch ? `\n${mismatch} file(s) differ from ${source}` : `\nall ${FILES.length} files match ${source}`);
  process.exit(mismatch ? 1 : 0);
}

const version = {
  package: pkg.name,
  version: pkg.version,
  upstream: 'https://github.com/dionaditya/wasm-pdf-reader',
  commit: git.commit,
  dirty: git.dirty,
  syncedAt: new Date().toISOString(),
  source: source.startsWith(root) ? source.slice(root.length + 1) : 'checkout',
  files: copied,
};
await writeFile(join(target, 'VERSION.json'), `${JSON.stringify(version, null, 2)}\n`);

const wasm = copied['wasm/pdf-reader.wasm'];
console.log(
  `\nsynced ${pkg.name}@${pkg.version}` +
  `${git.commit ? ` (${git.commit.slice(0, 7)}${git.dirty ? ' + local changes' : ''})` : ''}\n` +
  `pdf-reader.wasm ${(wasm.bytes / 1048576).toFixed(2)} MB  sha256 ${wasm.sha256}`,
);

// A stale README is the usual reason a vendored bundle grows a second, wrong
// version number; keep the one place it is stated honest.
const vendorReadme = join(target, 'README.md');
if (existsSync(vendorReadme)) {
  const text = await readFile(vendorReadme, 'utf8');
  const updated = text.replace(/^Bundle version:.*$/m,
    `Bundle version: \`${pkg.name}@${pkg.version}\`${git.commit ? ` (${git.commit.slice(0, 7)})` : ''}`);
  if (updated !== text) await writeFile(vendorReadme, updated);
}

// A git dependency pinned to a full commit is immutable; a floating range is not.
const dep = JSON.parse(await readFile(join(root, 'package.json'), 'utf8')).devDependencies?.['@dionaditya/wasm-pdf-reader'] || '';
if (!/[0-9a-f]{40}/.test(dep) && !existsSync(join(root, 'package-lock.json'))) {
  console.log('\nhint: pin the engine to a full commit sha (or commit a package-lock.json) for a reproducible bundle.');
}
