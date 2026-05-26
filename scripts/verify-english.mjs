#!/usr/bin/env node
import { readFile, readdir } from 'node:fs/promises';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(fileURLToPath(import.meta.url), '..', '..');

const UNICODE_PUNCTUATION = /[\u2013\u2014\u2026\u201c\u201d\u2018\u2019\u00ab\u00bb]/;

const TARGETS = [
	'README.md',
	'package.json',
	'credentials',
	'nodes',
];

async function walk(dir) {
	const entries = await readdir(dir, { withFileTypes: true });
	const files = [];
	for (const entry of entries) {
		const fullPath = join(dir, entry.name);
		if (entry.isDirectory()) {
			files.push(...(await walk(fullPath)));
			continue;
		}
		if (entry.isFile() && (entry.name.endsWith('.ts') || entry.name.endsWith('.md'))) {
			files.push(fullPath);
		}
	}
	return files;
}

async function collectFiles() {
	const files = new Set();
	for (const target of TARGETS) {
		const fullPath = join(root, target);
		try {
			const stat = await readdir(fullPath).catch(() => null);
			if (Array.isArray(stat)) {
				for (const file of await walk(fullPath)) {
					files.add(file);
				}
				continue;
			}
		} catch {
			// single file target
		}
		files.add(fullPath);
	}
	return [...files];
}

const violations = [];
for (const file of await collectFiles()) {
	let text;
	try {
		text = await readFile(file, 'utf8');
	} catch {
		continue;
	}
	const lines = text.split('\n');
	for (let index = 0; index < lines.length; index += 1) {
		const line = lines[index];
		if (UNICODE_PUNCTUATION.test(line)) {
			violations.push({
				file: relative(root, file),
				line: index + 1,
				text: line.trim(),
			});
		}
	}
}

if (violations.length > 0) {
	process.stderr.write(
		'English-only verification failed. Use plain ASCII in node UI, errors, and docs:\n' +
			'https://docs.n8n.io/integrations/creating-nodes/build/reference/verification-guidelines/#use-english-language-only\n\n',
	);
	for (const violation of violations) {
		process.stderr.write(`${violation.file}:${violation.line}: ${violation.text}\n`);
	}
	process.exit(1);
}

process.stdout.write('English-only verification passed\n');
