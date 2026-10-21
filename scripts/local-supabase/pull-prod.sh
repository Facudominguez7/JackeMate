#!/usr/bin/env bash
# Copies production into the local Supabase stack: every database row (auth users included) and
# the files of the public `reportes` bucket. The copy holds real user data, so it lives in
# `supabase/.local/`, which git ignores. See supabase/README.md.
#
#   npm run db:pull                 copy production, then reset the local database with the copy
#   npm run db:reset                reset the local database with the copy already saved
#   npm run db:pull -- --schema     regenerate the schema baseline migration instead
#
# The production connection string is read from SUPABASE_DB_URL or asked for; it is never saved.
set -euo pipefail
cd "$(dirname "$0")/../.."

PROD_API_URL="https://uxwtxuoipvfuezpmfdcm.supabase.co"
BUCKET="reportes"
LOCAL_DIR="supabase/.local"
DATA_FILE="$LOCAL_DIR/prod-data.sql"
BASELINE="supabase/migrations/20261020120050_remote_schema.sql"
DB_CONTAINER="supabase_db_JackeMate"
# Live credentials and session state: a copied refresh token or one-time code would still work
# against production Auth, so they never leave production. Users keep their password hashes.
EXCLUDED_TABLES="auth.sessions,auth.refresh_tokens,auth.mfa_amr_claims,auth.one_time_tokens,auth.flow_state,auth.mfa_challenges,auth.webauthn_challenges,auth.saml_relay_states,auth.oauth_authorizations,auth.oauth_client_states,auth.scim_tokens,auth.audit_log_entries"
TMP_FILE="$(mktemp)"
trap 'rm -f "$TMP_FILE"' EXIT

read_db_url() {
  if [[ -z "${SUPABASE_DB_URL:-}" ]]; then
    echo "Production connection string (Supabase Dashboard → Connect → Direct → Session pooler)."
    echo "It is used for this run only and never saved."
    read -rsp "SUPABASE_DB_URL: " SUPABASE_DB_URL
    echo
  fi
  if [[ "$SUPABASE_DB_URL" != postgres* ]]; then
    echo "That does not look like a Postgres connection string." >&2
    exit 1
  fi
}

ensure_stack() {
  if ! npx supabase status >/dev/null 2>&1; then
    npx supabase start
  fi
}

# Runs SQL in the local database as the admin role, which owns the storage tables.
local_sql() {
  docker exec -i "$DB_CONTAINER" psql -U supabase_admin -d postgres -v ON_ERROR_STOP=1 -q "$@"
}

# The dump uses COPY ... FROM stdin, which only psql can read (the CLI seeder cannot). It starts
# with `SET session_replication_role = replica`, so triggers stay off while rows load.
load_data() {
  docker exec -i "$DB_CONTAINER" psql -U supabase_admin -d postgres -v ON_ERROR_STOP=1 -q --single-transaction <"$DATA_FILE" >/dev/null
}

reset_with_copy() {
  ensure_stack
  npx supabase db reset
  load_data
  sync_storage
}

sync_storage() {
  local api_url service_key
  eval "$(npx supabase status -o env 2>/dev/null)"
  api_url="$API_URL"
  service_key="$SERVICE_ROLE_KEY"

  # Uploading through the Storage API rewrites owner and timestamps; keep them to restore later.
  local_sql -At -c "copy (select name, owner, owner_id, created_at, updated_at from storage.objects where bucket_id = '$BUCKET') to stdout with csv" >"$LOCAL_DIR/objects.csv"

  local_sql -At -c "copy (select name, coalesce(metadata->>'mimetype', 'application/octet-stream') from storage.objects where bucket_id = '$BUCKET') to stdout" >"$LOCAL_DIR/objects.tsv"

  local count=0 name encoded mime
  # The list comes on fd 3: `docker exec -i` inside the loop would swallow it from stdin.
  while IFS=$'\t' read -r name mime <&3; do
    encoded="$(python3 -c 'import sys, urllib.parse; print(urllib.parse.quote(sys.argv[1]))' "$name")"
    curl -fsS "$PROD_API_URL/storage/v1/object/public/$BUCKET/$encoded" -o "$TMP_FILE"
    curl -fsS -o /dev/null -X POST "$api_url/storage/v1/object/$BUCKET/$encoded" \
      -H "Authorization: Bearer $service_key" -H "x-upsert: true" -H "Content-Type: $mime" \
      --data-binary "@$TMP_FILE"
    count=$((count + 1))
  done 3<"$LOCAL_DIR/objects.tsv"

  local_sql <<SQL
create temp table original_objects (name text, owner uuid, owner_id text, created_at timestamptz, updated_at timestamptz);
\copy original_objects from stdin with csv
$(cat "$LOCAL_DIR/objects.csv")
\.
update storage.objects o
set owner = r.owner, owner_id = r.owner_id, created_at = r.created_at, updated_at = r.updated_at
from original_objects r
where o.bucket_id = '$BUCKET' and o.name = r.name;
SQL
  rm -f "$LOCAL_DIR/objects.csv" "$LOCAL_DIR/objects.tsv"
  echo "Copied $count files from the $BUCKET bucket."
}

if [[ "${1:-}" == "--schema" ]]; then
  read_db_url
  npx supabase db dump --db-url "$SUPABASE_DB_URL" -f "$BASELINE"
  echo "Schema written to $BASELINE. Review the diff before committing it."
  exit 0
fi

if [[ "${1:-}" == "--load" ]]; then
  if [[ ! -f "$DATA_FILE" ]]; then
    echo "No saved copy in $DATA_FILE. Run \`npm run db:pull\` first." >&2
    exit 1
  fi
  reset_with_copy
  echo "Local database reset with the copy saved on $(date -r "$DATA_FILE" '+%Y-%m-%d %H:%M')."
  exit 0
fi

read_db_url
mkdir -p "$LOCAL_DIR"
# Written aside first, so a failed dump keeps the previous copy.
npx supabase db dump --db-url "$SUPABASE_DB_URL" --data-only --use-copy -x "$EXCLUDED_TABLES" -f "$DATA_FILE.partial"
mv "$DATA_FILE.partial" "$DATA_FILE"
reset_with_copy
echo "Local database is a copy of production as of $(date '+%Y-%m-%d %H:%M')."
