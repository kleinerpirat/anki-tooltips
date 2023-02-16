#!/usr/bin/env bash
declare DIR="$(cd "$(dirname "$0")/.." && pwd -P)"
set -e

mkdir -p "$DIR/zipped"

"$DIR/tools/build.sh"

cd "$DIR/dist"

zip -r "$DIR/zipped/anki-tooltips.ankiaddon" *
