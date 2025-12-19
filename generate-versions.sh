#!/bin/bash
set -e

DIST="dist"

rm -rf "$DIST"
mkdir -p "$DIST"

# Temp files to accumulate JSON objects
SCHED_JSON_TMP="$DIST/.tmp_versions_schedule.jsonl"
SCHED_EN_JSON_TMP="$DIST/.tmp_versions_schedule_en.jsonl"
: > "$SCHED_JSON_TMP"
: > "$SCHED_EN_JSON_TMP"

for FILE in schedule.md schedule_en.md; do
  BASE_NAME="${FILE%.md}"

  # Latest 30 commits touching this file
  git log --follow --format="%ad|||%h|||%s" \
    --date=format:%Y-%m-%dT%H:%M:%S --max-count=30 "$FILE" 2>/dev/null | \
  while IFS='|||' read -r date commit subject; do
    [ -z "$date" ] && continue

    git checkout "$commit" -- "$FILE"

    SHORT_SHA="${commit:0:7}"
    VERSION_NAME="${BASE_NAME}-v${date//[:T-]/}${SHORT_SHA}.md"

    cp "$FILE" "$DIST/$VERSION_NAME"

    # Escape quotes in commit message
    ESC_SUBJECT=${subject//\"/\\\"}

    JSON_OBJ="{\"filename\":\"$VERSION_NAME\",\"date\":\"$date\",\"commit\":\"$SHORT_SHA\",\"message\":\"$ESC_SUBJECT\"}"

    if [ "$BASE_NAME" = "schedule" ]; then
      echo "$JSON_OBJ" >> "$SCHED_JSON_TMP"
    else
      echo "$JSON_OBJ" >> "$SCHED_EN_JSON_TMP"
    fi

    echo "Created: $VERSION_NAME"
  done
done

# Helper: convert JSONL → JSON array
jsonl_to_array() {
  local file="$1"
  if [ -s "$file" ]; then
    {
      echo "["
      paste -sd',' "$file"
      echo "]"
    }
  else
    echo "[]"
  fi
}

# Build final JSONs
jsonl_to_array "$SCHED_JSON_TMP"    > "$DIST/versions_schedule.json"
jsonl_to_array "$SCHED_EN_JSON_TMP" > "$DIST/versions_schedule_en.json"

rm -f "$SCHED_JSON_TMP" "$SCHED_EN_JSON_TMP"

echo "Done. Latest versions written to: $DIST/"
