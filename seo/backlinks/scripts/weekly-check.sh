#!/usr/bin/env bash
set -euo pipefail

# =============================================================================
# RadioReach Backlink Pipeline — Weekly Maintenance
# =============================================================================
# Runs the recurring verification + reporting cycle. Intended to be scheduled
# (e.g., cron weekly on Sunday):
#
#   0 9 * * 0  /home/user/radioreach-funnel/seo/backlinks/scripts/weekly-check.sh
#
# Steps:
#   1. Re-verify all acquired backlinks (moves losses to lost.csv)
#   2. Re-check prospects for new opportunities
#   3. Regenerate the acquisition report
# =============================================================================

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SEO_DIR="$(cd "$SCRIPT_DIR/../.." && pwd)"
BACKLINKS_DIR="$SEO_DIR/backlinks"
REPORTS_DIR="$BACKLINKS_DIR/reports"
LOG_FILE="$REPORTS_DIR/weekly-$(date +%F).log"

mkdir -p "$REPORTS_DIR"

echo "=== RadioReach Backlink Weekly Check — $(date -u +%F\ %H:%MZ) ===" | tee "$LOG_FILE"
echo "" | tee -a "$LOG_FILE"

echo "--- Step 1: Verifying acquired backlinks ---" | tee -a "$LOG_FILE"
node "$SCRIPT_DIR/verify.js" 2>&1 | tee -a "$LOG_FILE"

echo "" | tee -a "$LOG_FILE"
echo "--- Step 2: Regenerating acquisition report ---" | tee -a "$LOG_FILE"
node "$SCRIPT_DIR/report.js" --output "$REPORTS_DIR/backlinks-$(date +%F).md" 2>&1 | tee -a "$LOG_FILE"

echo "" | tee -a "$LOG_FILE"
echo "=== Weekly check complete — $(date -u +%F\ %H:%MZ) ===" | tee -a "$LOG_FILE"

echo ""
echo "Log saved: $LOG_FILE"