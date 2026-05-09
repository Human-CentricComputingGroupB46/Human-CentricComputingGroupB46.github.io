#!/bin/bash
# Push design documentation to GitHub Wiki
# Usage: bash scripts/push-wiki.sh

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

WIKI_REPO="https://github.com/Human-CentricComputingGroupB46/Human-CentricComputingGroupB46.github.io.wiki.git"
TMP_DIR="/tmp/wiki-push-$$"

DOC_MAPPINGS=(
	"$REPO_ROOT/docs/Wiki-Home.md:Home.md"
	"$REPO_ROOT/docs/DESIGN.md:Design-Document.md"
	"$REPO_ROOT/docs/Syntax-and-Compilation-Strategy.md:Syntax-and-Compilation-Strategy.md"
)

cleanup() {
	cd / >/dev/null 2>&1 || true
	rm -rf "$TMP_DIR"
}

trap cleanup EXIT INT TERM HUP

echo "==> Cloning wiki repository..."
git clone "$WIKI_REPO" "$TMP_DIR" --depth 1

echo "==> Copying documentation..."
for mapping in "${DOC_MAPPINGS[@]}"; do
	DOC_FILE="${mapping%%:*}"
	WIKI_PAGE="${mapping##*:}"
	cp "$DOC_FILE" "$TMP_DIR/$WIKI_PAGE"
	git -C "$TMP_DIR" add "$WIKI_PAGE"
done

echo "==> Committing..."
cd "$TMP_DIR"
git commit -m "Update CampusCompass wiki documentation" || echo "(no changes)"

CURRENT_BRANCH="$(git branch --show-current)"

if [ -z "$CURRENT_BRANCH" ]; then
	echo "Unable to determine wiki branch." >&2
	exit 1
fi

echo "==> Pushing..."
git push origin "HEAD:$CURRENT_BRANCH"

echo "==> Done! View at:"
echo "    https://github.com/Human-CentricComputingGroupB46/Human-CentricComputingGroupB46.github.io/wiki"
echo "    https://github.com/Human-CentricComputingGroupB46/Human-CentricComputingGroupB46.github.io/wiki/Design-Document"
echo "    https://github.com/Human-CentricComputingGroupB46/Human-CentricComputingGroupB46.github.io/wiki/Syntax-and-Compilation-Strategy"
