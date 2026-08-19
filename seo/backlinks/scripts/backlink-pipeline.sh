#!/usr/bin/env bash
set -euo pipefail

# =============================================================================
# RadioReach Backlink Pipeline — CLI entry point
# =============================================================================
# Usage:
#   ./seo/backlinks/scripts/backlink-pipeline.sh discover --keywords "independent music radio resources" --output prospects.csv
#   ./seo/backlinks/scripts/backlink-pipeline.sh score --input prospects.csv --output qualified.csv
#   ./seo/backlinks/scripts/backlink-pipeline.sh generate-outreach --input qualified.csv --output outreach-ready.csv
#   ./seo/backlinks/scripts/backlink-pipeline.sh verify --check-acquired
#   ./seo/backlinks/scripts/backlink-pipeline.sh report
#   ./seo/backlinks/scripts/backlink-pipeline.sh all --keywords "..." --competitors "..."
# =============================================================================

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SEO_DIR="$(cd "$SCRIPT_DIR/../.." && pwd)"
BACKLINKS_DIR="$SEO_DIR/backlinks"
ASSETS_DIR="$BACKLINKS_DIR/assets"
REPORTS_DIR="$BACKLINKS_DIR/reports"
TEMPLATES_DIR="$BACKLINKS_DIR/templates"

COMMAND="${1:-help}"
shift || true

run_discover() {
  echo "🔍 Running prospect discovery..."
  node "$SCRIPT_DIR/discover.js" "$@"
}

run_score() {
  echo "📊 Scoring prospects..."
  node "$SCRIPT_DIR/score.js" "$@"
}

run_outreach() {
  echo "✉️  Generating outreach drafts..."
  node "$SCRIPT_DIR/outreach.js" "$@"
}

run_verify() {
  echo "✅ Verifying backlinks..."
  node "$SCRIPT_DIR/verify.js" "$@"
}

run_report() {
  echo "📈 Generating acquisition report..."
  node "$SCRIPT_DIR/report.js" "$@"
}

run_competitors() {
  echo "🔎 Analyzing competitor backlinks..."
  node "$SCRIPT_DIR/analyze-competitors.js" "$@"
}

run_broken() {
  echo "🔗 Detecting broken link opportunities..."
  node "$SCRIPT_DIR/detect-broken.js" "$@"
}

run_enrich() {
  echo "🧬 Enriching prospects with public contact info..."
  node "$SCRIPT_DIR/enrich.js" "$@"
}

run_all() {
  echo "🚀 Running full backlink pipeline..."
  local keywords=""
  local competitors=""
  local output_dir="$BACKLINKS_DIR"
  local demo=""
  
  while [[ $# -gt 0 ]]; do
    case "$1" in
      --keywords) keywords="$2"; shift 2;;
      --competitors) competitors="$2"; shift 2;;
      --output-dir) output_dir="$2"; shift 2;;
      --demo) demo="--demo"; shift;;
      *) shift;;
    esac
  done

  echo "Keywords: $keywords"
  echo "Competitors: $competitors"
  echo "Output: $output_dir"
  if [[ -n "$demo" ]]; then echo "Mode: DEMO (no network)"; fi
  
  # Step 1: Discover prospects
  node "$SCRIPT_DIR/discover.js" $demo --keywords "$keywords" --output "$output_dir/prospects.csv"
  
  # Step 2: Score prospects
  node "$SCRIPT_DIR/score.js" --input "$output_dir/prospects.csv" --output-qualified "$output_dir/qualified.csv" --output-rejected "$output_dir/rejected.csv"
  
  # Step 3: Analyze competitors if provided (classification engine)
  if [[ -n "$competitors" ]]; then
    node "$SCRIPT_DIR/analyze-competitors.js" --domains "$competitors" --output "$output_dir/reports/competitor-gap-analysis.csv"
  fi
  
  # Step 4: Generate outreach (human review queue)
  node "$SCRIPT_DIR/outreach.js" --input "$output_dir/qualified.csv" --output "$output_dir/outreach-ready.csv"
  
  # Step 5: Report
  node "$SCRIPT_DIR/report.js"
  
  echo "✅ Pipeline complete! Review $output_dir/outreach-ready.csv before sending anything."
}

case "$COMMAND" in
  discover)
    run_discover "$@"
    ;;
  score)
    run_score "$@"
    ;;
  generate-outreach)
    run_outreach "$@"
    ;;
  verify)
    run_verify "$@"
    ;;
  report)
    run_report "$@"
    ;;
  analyze-competitors)
    run_competitors "$@"
    ;;
  detect-broken)
    run_broken "$@"
    ;;
  enrich)
    run_enrich "$@"
    ;;
  all)
    run_all "$@"
    ;;
  help|--help|-h)
    echo "RadioReach Backlink Pipeline"
    echo ""
    echo "Commands:"
    echo "  discover              Discover backlink prospects"
    echo "    --keywords '...'      Target keywords (comma-separated)"
    echo "    --output <file>       Output CSV file"
    echo "    --demo                Generate sample prospects (no network needed)"
    echo ""
    echo "  score                 Score and qualify prospects"
    echo "    --input <file>        Input prospects CSV"
    echo "    --output-qualified    Output qualified CSV"
    echo "    --output-rejected     Output rejected CSV"
    echo ""
    echo "  generate-outreach     Generate outreach drafts"
    echo "    --input <file>        Input qualified prospects CSV"
    echo "    --output <file>       Output outreach-ready CSV"
    echo ""
    echo "  verify                Verify acquired backlinks"
    echo "    --check-acquired      Re-check all acquired links"
    echo ""
    echo "  report                Generate acquisition report"
    echo ""
    echo "  analyze-competitors   Analyze competitor backlinks"
    echo "    --domains '...'       Competitor domains (comma-separated)"
    echo "    --output <file>       Output CSV"
    echo ""
    echo "  detect-broken         Detect broken link opportunities"
    echo "    --input <file>        Input CSV with URLs to check"
    echo "    --output <file>       Output CSV with findings"
    echo ""
    echo "  enrich                Fill public contact info for prospects"
    echo "    --input <file>        Input CSV with source_url column"
    echo "    --output <file>       Output enriched CSV"
    echo ""
    echo "  all                   Run full pipeline"
    echo "    --keywords '...'      Target keywords"
    echo "    --competitors '...'   Competitor domains"
    echo "    --output-dir <dir>    Output directory"
    echo "    --demo                Sample data, no network needed"
    echo ""
    echo "Examples:"
    echo "  ./seo/backlinks/scripts/backlink-pipeline.sh discover --keywords \"independent music resources,radio promotion tools\" --output prospects.csv"
    echo "  ./seo/backlinks/scripts/backlink-pipeline.sh all --keywords \"college radio resources\" --competitors \"example.com\""
    ;;
  *)
    echo "Unknown command: $COMMAND"
    echo "Run './seo/backlinks/scripts/backlink-pipeline.sh help' for usage."
    exit 1
    ;;
esac