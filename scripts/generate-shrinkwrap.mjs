import { readFileSync, writeFileSync } from 'node:fs';

const pkg = JSON.parse(readFileSync('package.json', 'utf8'));
const shrinkwrap = {
	name: pkg.name,
	version: pkg.version,
	lockfileVersion: 3,
	requires: true,
	packages: {
		'': {
			name: pkg.name,
			version: pkg.version,
			license: pkg.license,
			engines: pkg.engines,
			peerDependencies: pkg.peerDependencies,
		},
	},
};

writeFileSync('npm-shrinkwrap.json', `${JSON.stringify(shrinkwrap, null, 2)}\n`);
