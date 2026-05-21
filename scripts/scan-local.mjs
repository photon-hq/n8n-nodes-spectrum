import path from 'path';
import { fileURLToPath } from 'url';

import { analyzePackage } from '@n8n/scan-community-package/scanner/scanner.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const result = await analyzePackage(root);

if (!result.passed) {
	if (result.details) {
		process.stderr.write(String(result.details));
	}
	process.stderr.write(`\nCommunity package scan failed: ${result.message ?? 'unknown error'}\n`);
	process.exit(1);
}

process.stdout.write('Community package scan passed\n');
