#!/usr/bin/env bash
#
# Replace the Radio Reach Vault deliverable in private R2.
#
# The vault used to ship as a ZIP wrapper (vault/radio-reach-vault.zip). It now
# ships as the PDF itself (vault/radio-reach-vault.pdf). This script uploads a
# new PDF over the current one and, optionally, removes the retired ZIP.
#
# The object key intentionally has NO version/year in it, so future refreshes
# are just a re-run of this script -- no code change, no redeploy, and links
# already in customers' inboxes keep resolving to the newest file.
#
# Usage:
#   ./scripts/replace-vault-file.sh "path/to/18,000 Radio Station Contacts (2026 Version).pdf"
#   ./scripts/replace-vault-file.sh --delete-legacy-zip "path/to/new.pdf"
#
# Requires: wrangler, already authenticated (`npx wrangler login`) against the
# Cloudflare account that owns the bucket.

set -euo pipefail

BUCKET="radioreach-downloads"
KEY="vault/radio-reach-vault.pdf"
LEGACY_KEY="vault/radio-reach-vault.zip"
DELETE_LEGACY=0

usage() {
  sed -n '2,18p' "$0" | sed 's/^# \{0,1\}//'
  exit 1
}

args=()
for arg in "$@"; do
  case "$arg" in
    --delete-legacy-zip) DELETE_LEGACY=1 ;;
    -h|--help) usage ;;
    *) args+=("$arg") ;;
  esac
done

if [ "${#args[@]}" -ne 1 ]; then
  echo "error: expected exactly one PDF path" >&2
  usage
fi

PDF="${args[0]}"

if [ ! -f "$PDF" ]; then
  echo "error: file not found: $PDF" >&2
  exit 1
fi

# Guard against uploading a mislabelled/corrupt file to a paid product.
if [ "$(head -c 4 "$PDF")" != "%PDF" ]; then
  echo "error: $PDF does not start with a %PDF header -- refusing to upload" >&2
  exit 1
fi

SIZE=$(wc -c < "$PDF" | tr -d ' ')
if [ "$SIZE" -lt 100000 ]; then
  echo "warning: $PDF is only ${SIZE} bytes, which seems small for the vault." >&2
  read -r -p "Upload anyway? [y/N] " reply
  [[ "$reply" =~ ^[Yy]$ ]] || exit 1
fi

echo "==> Uploading $(basename "$PDF") (${SIZE} bytes)"
echo "    to r2://${BUCKET}/${KEY}"
npx wrangler r2 object put "${BUCKET}/${KEY}" \
  --file="$PDF" \
  --content-type="application/pdf" \
  --remote

echo "==> Verifying the object is readable"
npx wrangler r2 object get "${BUCKET}/${KEY}" --remote --pipe > /dev/null
echo "    ok"

if [ "$DELETE_LEGACY" -eq 1 ]; then
  echo "==> Deleting retired ZIP r2://${BUCKET}/${LEGACY_KEY}"
  npx wrangler r2 object delete "${BUCKET}/${LEGACY_KEY}" --remote || \
    echo "    (already gone -- nothing to delete)"
else
  echo
  echo "Left the old ZIP in place at ${LEGACY_KEY}."
  echo "Past orders are remapped to the new PDF in code, so it is safe to remove:"
  echo "  ./scripts/replace-vault-file.sh --delete-legacy-zip \"$PDF\""
fi

echo
echo "Done. Buyers now receive: RadioReach Vault - 18,000+ Radio Station Contacts.pdf"
