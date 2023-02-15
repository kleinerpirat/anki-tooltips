#!/usr/bin/env bash
declare DIR="$(cd "$(dirname "$0")/.." && pwd -P)"
set -e

"$DIR/tools/build.sh"

# Watch for changes in Add-on TypeScript code
yarn --cwd "$DIR/src/ts" dev
