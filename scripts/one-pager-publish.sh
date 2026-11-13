#!/bin/bash
# usage: publish.sh <packed out folder> <message>
set -e
cd ~/bb-websites/hop-hero/site
OUT="$1"; T="$(dirname "$0")/ghp-$$"
git fetch -q origin gh-pages
git worktree add -q --detach "$T" origin/gh-pages
cp "$OUT/House of Priyantha one pager.html" "$T/index.html"
cp "$OUT/House of Priyantha one pager.html" "$T/one-pager.html"
rsync -rc --exclude products "$OUT/assets/" "$T/assets/"
mkdir -p "$T/assets/one-pager/products"
cp ~/Downloads/HOUSE-OF-PRIYANTHA-HERO/products/*.jpg "$T/assets/one-pager/products/"
cd "$T"; git add -A; git commit -q -m "$2

Co-Authored-By: Claude <noreply@anthropic.com>"; git push -q origin HEAD:gh-pages; git log --oneline -1; git show --stat --oneline HEAD | tail -4
cd ~/bb-websites/hop-hero/site; git worktree remove "$T"
