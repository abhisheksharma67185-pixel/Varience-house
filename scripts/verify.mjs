import { access, readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const html = await readFile(resolve(root, 'index.html'), 'utf8');
const css = await readFile(resolve(root, 'styles.css'), 'utf8');
const script = await readFile(resolve(root, 'script.js'), 'utf8');

const failures = [];
const ids = [...html.matchAll(/\sid="([^"]+)"/g)].map((match) => match[1]);
const duplicates = ids.filter((id, index) => ids.indexOf(id) !== index);
if (duplicates.length) failures.push(`Duplicate IDs: ${[...new Set(duplicates)].join(', ')}`);

const anchors = [...html.matchAll(/href="#([^"]+)"/g)].map((match) => match[1]);
for (const anchor of anchors) {
  if (anchor !== 'top' && !ids.includes(anchor)) failures.push(`Missing anchor target: #${anchor}`);
}

const localAssets = [...html.matchAll(/(?:src|href)="((?!https?:|mailto:|#)[^"]+)"/g)].map((match) => match[1]);
for (const asset of localAssets) {
  try {
    await access(resolve(root, asset));
  } catch {
    failures.push(`Missing local asset: ${asset}`);
  }
}

const cssAssets = [...css.matchAll(/url\(["']?((?:assets\/|\.\.?\/)[^)"']+)["']?\)/g)].map((match) => match[1]);
for (const asset of cssAssets) {
  try {
    await access(resolve(root, asset));
  } catch {
    failures.push(`Missing CSS asset: ${asset}`);
  }
}

const count = (source, token) => source.split(token).length - 1;
if (count(css, '{') !== count(css, '}')) failures.push('Unbalanced CSS braces');
if (script.includes('console.log(')) failures.push('Debug console logging found in script.js');

const requiredSections = ['about', 'research-tracks', 'residency', 'life', 'applicants', 'bangalore', 'apply'];
for (const id of requiredSections) {
  if (!ids.includes(id)) failures.push(`Required section missing: #${id}`);
}

if (failures.length) {
  process.stderr.write(`${failures.join('\n')}\n`);
  process.exit(1);
}

process.stdout.write(`Verified ${ids.length} IDs, ${anchors.length} internal links, and ${localAssets.length + cssAssets.length} local asset references.\n`);
