#!/usr/bin/env bash
set -euo pipefail

node scripts/generate-shrinkwrap.mjs
npm publish --provenance "$@"
