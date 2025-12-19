#!/bin/bash
set -e

DIST="dist"

# Start from a clean output directory
rm -rf "$DIST"
mkdir -p "$DIST"

declare -A versions

for FILE in schedule.md schedule_en.md; do
  BASE_NAME="${FILE%.md}"
  versions[$BASE_NAME]=""

  # Get LATEST 30 commits that touched this file
  git log --follow --format="%ad|||%h|||%s" \
    --date=format:%Y%m%d-%H%M --max-count=30 "$FILE" 2>/dev/null | \
  while IFS='|||' read -r date commit subject; do
    [ -z "$date" ] && continue

    # Checkout this version of the file
    git checkout "$commit" -- "$FILE"

    VERSION_NAME="${BASE_NAME}-v${date}-${commit:0:7}.md"

    # Copy raw markdown as-is
    cp "$FILE" "$DIST/$VERSION_NAME"

    # Append to versions list (in shell variable file, not subshell)
    echo "$VERSION_NAME" >> "$DIST/.tmp_versions_${BASE_NAME}"

    echo "Created: $VERSION_NAME"
  done
done

# Build JSON files from temp lists
for BASE_NAME in schedule schedule_en; do
  TMP_FILE="$DIST/.tmp_versions_${BASE_NAME}"
  if [ -f "$TMP_FILE" ]; then
    # Newest first already because git log outputs newest → oldest
    VERSIONS_LIST=$(paste -sd',' "$TMP_FILE")
    echo "[\"${VERSIONS_LIST//,/\",\"}\"]" > "$DIST/versions_${BASE_NAME}.json"
    rm "$TMP_FILE"
    echo "Created: versions_${BASE_NAME}.json"
  else
    echo "[]">"$DIST/versions_${BASE_NAME}.json"
    echo "Created empty: versions_${BASE_NAME}.json"
  fi
done

echo "Done. Latest versions written to: $DIST/"
