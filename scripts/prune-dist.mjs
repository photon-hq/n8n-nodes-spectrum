#!/usr/bin/env node
import { readdir, readFile, unlink } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const dist = join(root, 'dist');
const pkg = JSON.parse(await readFile(join(root, 'package.json'), 'utf8'));

const keep = new Set(
	[...(pkg.n8n?.nodes ?? []), ...(pkg.n8n?.credentials ?? [])].map((entry) =>
		resolve(root, entry),
	),
);

async function walk(dir) {
	const entries = await readdir(dir, { withFileTypes: true });
	const files = [];
	for (const entry of entries) {
		const fullPath = join(dir, entry.name);
		if (entry.isDirectory()) {
			files.push(...(await walk(fullPath)));
			continue;
		}
		if (entry.isFile() && (entry.name.endsWith('.js') || entry.name.endsWith('.js.map'))) {
			files.push(fullPath);
		}
	}
	return files;
}

let removed = 0;
for (const file of await walk(dist)) {
	if (keep.has(file) || keep.has(file.replace(/\.map$/, ''))) {
		continue;
	}
	await unlink(file);
	removed += 1;
}

console.log(`pruned ${removed} compiled file(s) from dist/`);
