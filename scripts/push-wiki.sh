#!/bin/bash
# Push design documentation to GitHub Wiki
# Usage: bash scripts/push-wiki.sh

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

WIKI_REPO="https://github.com/Human-CentricComputingGroupB46/Human-CentricComputingGroupB46.github.io.wiki.git"
DOC_FILE="$REPO_ROOT/docs/DESIGN.md"
WIKI_PAGE="Design-Document.md"
TMP_DIR="/tmp/wiki-push-$$"

trap 'rm -rf "$TMP_DIR"' EXIT

echo "==> Cloning wiki repository..."
git clone "$WIKI_REPO" "$TMP_DIR" --depth 1

echo "==> Copying documentation..."
cp "$DOC_FILE" "$TMP_DIR/$WIKI_PAGE"

echo "==> Committing..."
cd "$TMP_DIR"
git add "$WIKI_PAGE"
git commit -m "Add CampusCompass design documentation" || echo "(no changes)"

echo "==> Pushing..."
git push origin main

echo "==> Done! View at: https://github.com/Human-CentricComputingGroupB46/Human-CentricComputingGroupB46.github.io/wiki/Design-Document"
