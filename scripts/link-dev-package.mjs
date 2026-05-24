#!/usr/bin/env node

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const PACKAGE_NAME = 'n8n-nodes-spectrum';
const TRIGGER_DIST = path.join(
	ROOT,
	'dist',
	'nodes',
	'PhotonSpectrumTrigger',
	'PhotonSpectrumTrigger.node.js',
);

/**
 * Register this package the same way n8n loads published community nodes
 * (`n8n-nodes-spectrum.*`), not only via the CUSTOM loader used for raw files
 * under ~/.n8n/custom.
 */
export function linkDevPackage(options = {}) {
	const n8nUserFolder =
		options.n8nUserFolder ??
		process.env.N8N_USER_FOLDER ??
		path.join(os.homedir(), '.n8n-node-cli');
	const n8nFolder = path.join(n8nUserFolder, '.n8n');
	const communityModulesDir = path.join(n8nFolder, 'nodes', 'node_modules');
	const customModulesDir = path.join(n8nFolder, 'custom', 'node_modules');
	const communityLink = path.join(communityModulesDir, PACKAGE_NAME);
	const customLink = path.join(customModulesDir, PACKAGE_NAME);

	if (!fs.existsSync(TRIGGER_DIST)) {
		throw new Error(
			`Missing build output at ${TRIGGER_DIST}. Run \`npm run build\` before starting dev.`,
		);
	}

	fs.mkdirSync(communityModulesDir, { recursive: true });

	if (fs.existsSync(communityLink)) {
		const stat = fs.lstatSync(communityLink);
		if (stat.isSymbolicLink()) {
			const target = fs.realpathSync(communityLink);
			if (target === fs.realpathSync(ROOT)) {
				return { n8nUserFolder, communityLink, reused: true };
			}
			fs.unlinkSync(communityLink);
		} else {
			throw new Error(
				`${communityLink} exists and is not a symlink. Move it aside, then retry.`,
			);
		}
	}

	fs.symlinkSync(ROOT, communityLink, 'dir');

	// n8n-node dev also symlinks here, which registers duplicate CUSTOM.* types.
	// Drop our package from the CUSTOM loader so dev matches production node types.
	if (fs.existsSync(customLink)) {
		try {
			if (fs.realpathSync(customLink) === fs.realpathSync(ROOT)) {
				fs.unlinkSync(customLink);
			}
		} catch {
			// ignore broken symlinks
		}
	}

	return { n8nUserFolder, communityLink, reused: false };
}

function isMain() {
	const entry = process.argv[1];
	return entry ? path.resolve(entry) === fileURLToPath(import.meta.url) : false;
}

if (isMain()) {
	try {
		const result = linkDevPackage();
		const verb = result.reused ? 'Reusing' : 'Linked';
		process.stdout.write(
			`${verb} ${PACKAGE_NAME} → ${result.communityLink}\n` +
				`Node types: ${PACKAGE_NAME}.photonSpectrumTrigger (same as production installs)\n`,
		);
	} catch (error) {
		const message = error instanceof Error ? error.message : String(error);
		process.stderr.write(`${message}\n`);
		process.exit(1);
	}
}
