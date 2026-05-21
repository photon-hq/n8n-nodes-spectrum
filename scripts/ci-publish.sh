#!/usr/bin/env bash
set -euo pipefail

node scripts/generate-shrinkwrap.mjs
RELEASE_MODE=true npm publish --access public
