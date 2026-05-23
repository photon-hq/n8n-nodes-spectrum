#!/usr/bin/env node
import { build } from 'esbuild';
import { readFile, writeFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');
const dist = join(root, 'dist');

const entryPoints = [
	{
		src: join(root, 'nodes', 'PhotonSpectrum', 'PhotonSpectrum.node.ts'),
		out: join(dist, 'nodes', 'PhotonSpectrum', 'PhotonSpectrum.node.js'),
	},
];

const spectrumImportPlugin = {
	name: 'spectrum-import-rewrite',
	setup(buildApi) {
		buildApi.onLoad({ filter: /spectrumClient\.ts$/ }, async (args) => {
			const original = await readFile(args.path, 'utf8');
			let rewroteRoot = false;
			let rewroteImessage = false;
			const rewritten = original
				.replace(/\(0,\s*eval\)\('import\("spectrum-ts"\)'\)/, () => {
					rewroteRoot = true;
					return 'import("spectrum-ts")';
				})
				.replace(
					/\(0,\s*eval\)\(\s*'import\("spectrum-ts\/providers\/imessage"\)',?\s*\)/,
					() => {
						rewroteImessage = true;
						return 'import("spectrum-ts/providers/imessage")';
					},
				);
			if (!rewroteRoot || !rewroteImessage) {
				throw new Error(
					`bundle-spectrum: partial rewrite of spectrumClient.ts (root=${rewroteRoot}, imessage=${rewroteImessage}).`,
				);
			}
			return { contents: rewritten, loader: 'ts' };
		});
	},
};

async function bundle({ src, out }) {
	await build({
		entryPoints: [src],
		bundle: true,
		platform: 'node',
		target: 'node20',
		format: 'cjs',
		outfile: out,
		external: ['n8n-workflow', 'n8n-core'],
		mainFields: ['module', 'main'],
		conditions: ['import', 'node', 'default'],
		sourcemap: false,
		logLevel: 'warning',
		legalComments: 'eof',
		banner: {
			js: 'var __photonImportMetaUrl = require("url").pathToFileURL(__filename).href;',
		},
		plugins: [spectrumImportPlugin],
	});
	await patchImportMetaUrl(out);
}

async function patchImportMetaUrl(outfile) {
	const broken = 'import_meta = {}';
	const fixed = 'import_meta = { url: __photonImportMetaUrl }';
	let code = await readFile(outfile, 'utf8');
	if (!code.includes(broken)) {
		if (code.includes('createRequire)(import_meta.url)')) {
			throw new Error(
				`bundle-spectrum: ${outfile} uses import_meta.url but has no "${broken}" — update patchImportMetaUrl`,
			);
		}
		return;
	}
	code = code.replaceAll(broken, fixed);
	await writeFile(outfile, code);
}

for (const ep of entryPoints) {
	await bundle(ep);
	console.log(`bundled ${ep.out.replace(root + '/', '')}`);
}
console.log('spectrum-ts inlined into action node.');
