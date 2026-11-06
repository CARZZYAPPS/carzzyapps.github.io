#!/bin/bash
# Mirror CARZZYAPPS/carzzyapps.github.io main -> EWieds/EWieds.github.io main as a snapshot commit.
# Drops CNAME (custom domain belongs to carzzyapps.com) and the backend workflow (runs only on the main site).
set -e
REPO=${1:-/home/claude/carzzyapps.github.io}
cd "$REPO"
git fetch -q origin main
git fetch -q https://github.com/EWieds/EWieds.github.io main:refs/mirror/ewieds 2>/dev/null || true
IDX=$(mktemp); export GIT_INDEX_FILE=$IDX
git read-tree origin/main
git update-index --force-remove CNAME .github/workflows/lazer-arcade.yml
TREE=$(git write-tree); unset GIT_INDEX_FILE; rm -f $IDX
MSG="Mirror of CARZZYAPPS/carzzyapps.github.io@$(git rev-parse --short origin/main): $(git log -1 --format=%s origin/main)"
if git rev-parse -q --verify refs/mirror/ewieds >/dev/null; then
  [ "$(git rev-parse refs/mirror/ewieds^{tree})" = "$TREE" ] && { echo "mirror up to date"; exit 0; }
  C=$(git -c user.name=EWieds -c user.email=evanwieds@gmail.com commit-tree $TREE -p refs/mirror/ewieds -m "$MSG")
else
  C=$(git -c user.name=EWieds -c user.email=evanwieds@gmail.com commit-tree $TREE -m "$MSG")
fi
git push -q https://github.com/EWieds/EWieds.github.io $C:refs/heads/main
echo "mirrored $(git rev-parse --short origin/main) -> EWieds.github.io $(git rev-parse --short $C)"
