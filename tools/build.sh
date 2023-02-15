#!/usr/bin/env bash
declare DIR="$(cd "$(dirname "$0")/.." && pwd -P)"
set -e

git clean -fdx "$DIR/dist"

# Python
rsync -rai "$DIR/src/python/" "$DIR/dist" --filter=":- $DIR/.gitignore" --delete-after

# Qt5 GUI compatibility
mkdir -p "$DIR/dist/gui/forms/qt5" "$DIR/dist/gui/forms/qt6"
for filename in "$DIR/designer/"*'.ui'; do
  python -m PyQt5.uic.pyuic "$filename" > "$DIR/dist/gui/forms/qt5/$(basename ${filename%.*})_ui.py"
  python -m PyQt6.uic.pyuic "$filename" > "$DIR/dist/gui/forms/qt6/$(basename ${filename%.*})_ui.py"
done

# Typescript
mkdir -p "$DIR/dist/web"
yarn --cwd "$DIR/src/ts" && yarn --cwd "$DIR/src/ts" build

echo 'Build successful!'
