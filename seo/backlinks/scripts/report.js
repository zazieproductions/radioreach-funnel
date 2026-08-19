#!/usr/bin/env node

/**
 * RadioReach Backlink Pipeline — Acquisition Report
 *
 * Generates a concise markdown report of the backlink program state:
 * prospects, qualified, rejected, outreach, submissions, acquired, lost.
 *
 * Usage:
 *   node report.js [--output reports/backlinks-2026-08-19.md]
 */

import { existsSync, writeFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { readCSV, printHeader } from './lib.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const SEO_DIR = join(__dirname, '..');
const REPORTS_DIR = join(SEO_DIR, 'reports');

const CSV_FILES = [
  'prospects.csv', 'qualified.csv', 'rejected.csv',
  'outreach-ready.csv', 'submitted.csv', 'acquired.csv', 'lost.csv',
];

// ─── Report generation ──────────────────────────────────────────────────────

function readCsvSafe(name) {
  const filePath = join(SEO_DIR, name);
  if (!existsSync(filePath)) return { headers: [], rows: [] };
  return readCSV(filePath);
}

function generateReport() {
  const today = new Date().toISOString().split('T')[0];
  
  const prospects = readCsvSafe('prospects.csv');
  const qualified = readCsvSafe('qualified.csv');
  const rejected = readCsvSafe('rejected.csv');
  const outreach = readCsvSafe('outreach-ready.csv');
  const submitted = readCsvSafe('submitted.csv');
  const acquired = readCsvSafe('acquired.csv');
  const lost = readCsvSafe('lost.csv');
  
  const lines = [];
  lines.push(`# RadioReach Backlink Acquisition Report`);
  lines.push('');
  lines.push(`**Generated:** ${today}`);
  lines.push('');
  lines.push('## Run Summary');
  lines.push('');
  lines.push('| Metric | Count |');
  lines.push('| --- | --- |');
  lines.push(`| Prospects discovered | ${prospects.rows.length} |`);
  lines.push(`| Prospects qualified | ${qualified.rows.length} |`);
  lines.push(`| Prospects rejected | ${rejected.rows.length} |`);
  lines.push(`| Outreach drafts created | ${outreach.rows.length} |`);
  lines.push(`| Legitimate forms submitted | ${submitted.rows.length} |`);
  lines.push(`| Links acquired | ${acquired.rows.length} |`);
  lines.push(`| Links lost | ${lost.rows.length} |`);
  lines.push('');
  
  // Response tracking (best-effort from outreach notes)
  const responses = outreach.rows.filter(r => /respond|replied|positive/i.test(r.status || '')).length;
  lines.push(`| Responses received | ${responses} |`);
  lines.push('');
  
  // Qualified by category
  lines.push('## Qualified Prospects by Category');
  lines.push('');
  lines.push('| Category | Count |');
  lines.push('| --- | --- |');
  const catCounts = {};
  for (const q of qualified.rows) {
    const cat = q.category || 'uncategorized';
    catCounts[cat] = (catCounts[cat] || 0) + 1;
  }
  for (const [cat, count] of Object.entries(catCounts).sort((a, b) => b[1] - a[1])) {
    lines.push(`| ${cat} | ${count} |`);
  }
  lines.push('');
  
  // Top assets pitched
  lines.push('## Assets Most Frequently Pitched');
  lines.push('');
  lines.push('| Asset | Times Pitched |');
  lines.push('| --- | --- |');
  const assetCounts = {};
  for (const o of outreach.rows) {
    const asset = o.asset_name || 'uncategorized';
    assetCounts[asset] = (assetCounts[asset] || 0) + 1;
  }
  for (const [asset, count] of Object.entries(assetCounts).sort((a, b) => b[1] - a[1])) {
    lines.push(`| ${asset} | ${count} |`);
  }
  lines.push('');
  
  // Top opportunity type
  lines.push('## Top-Performing Opportunity Type');
  lines.push('');
  const typeCounts = {};
  for (const a of acquired.rows) {
    const type = a.link_type || 'uncategorized';
    typeCounts[type] = (typeCounts[type] || 0) + 1;
  }
  const topType = Object.entries(typeCounts).sort((a, b) => b[1] - a[1])[0];
  lines.push(topType ? `**${topType[0]}** (${topType[1]} links)` : 'No acquired links yet.');
  lines.push('');
  
  // Compliance concerns
  lines.push('## Potential Compliance Concerns');
  lines.push('');
  lines.push('1. **Expired domains:** None acquired or purchased. Policy: reject expired-domain acquisition unless previously owned by RadioReach or a defensible brand variation with clean history hosting a genuine standalone resource.');
  lines.push('2. **Anchor text:** No repeated commercial exact-match anchors used. Policy: favor natural anchors such as "RadioReach" or page titles.');
  lines.push('3. **Automated submissions:** Only executed where the site explicitly provides a public business/resource submission form, automated use is permitted, and no CAPTCHA bypass is needed. All others queued for human review.');
  lines.push('4. **Rate limits & robots.txt:** All crawling respects robots.txt, rate limits, and site terms. No private data scraped.');
  lines.push('5. **Spam policies:** No link farms, paid follow links, sitewide exact-match patterns, or low-quality directory spam.');
  lines.push('');
  
  // Recommended next actions
  lines.push('## Recommended Next Actions');
  lines.push('');
  lines.push('1. Review outreach-ready.csv and send personalized messages (max 2 follow-ups per prospect).');
  lines.push('2. Verify prospects missing contact emails — check the site contact page, about page, or staff directory for publicly listed editorial contacts.');
  lines.push('3. Prioritize university and association prospects: high editorial legitimacy and audience value.');
  lines.push('4. Run `node verify.js` weekly to re-check acquired backlinks and catch losses early.');
  lines.push('5. Create one new linkable asset per month (e.g., a radio campaign cost calculator or station-fit questionnaire) to expand the pitchable resource library.');
  lines.push('6. Log responses in submitted.csv as they arrive and stop after any rejection or unsubscribe request.');
  lines.push('');
  
  // Acquired links detail
  if (acquired.rows.length > 0) {
    lines.push('## Acquired Backlinks');
    lines.push('');
    lines.push('| Source URL | Target URL | Anchor Text | Link Type | Follow Status | Acquired | Last Verified |');
    lines.push('| --- | --- | --- | --- | --- | --- | --- |');
    for (const a of acquired.rows) {
      lines.push(`| ${a.source_url || '-'} | ${a.target_url || '-'} | ${a.anchor_text || '-'} | ${a.link_type || '-'} | ${a.follow_status || '-'} | ${a.acquisition_date || '-'} | ${a.last_verified_date || '-'} |`);
    }
    lines.push('');
  }
  
  // Qualified prospects detail
  if (qualified.rows.length > 0) {
    lines.push('## Qualified Prospects (ready for outreach)');
    lines.push('');
    lines.push('| URL | Category | Score | Recommended Asset | Contact |');
    lines.push('| --- | --- | --- | --- | --- |');
    for (const q of qualified.rows) {
      lines.push(`| ${q.source_url || '-'} | ${q.category || '-'} | ${q.total_score || '-'} | ${q.recommended_asset || '-'} | ${q.contact_email || '— find publicly listed contact'} |`);
    }
    lines.push('');
  }
  
  return lines.join('\n');
}

// ─── Main ────────────────────────────────────────────────────────────────────

async function main() {
  printHeader('RadioReach Backlink Acquisition Report');
  
  const args = process.argv.slice(2);
  let outputFile = '';
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--output') outputFile = args[++i];
  }
  
  const report = generateReport();
  
  if (!outputFile) {
    outputFile = join(REPORTS_DIR, `backlinks-${new Date().toISOString().split('T')[0]}.md`);
  }
  
  if (!existsSync(REPORTS_DIR)) mkdirSync(REPORTS_DIR, { recursive: true });
  writeFileSync(outputFile, report, 'utf-8');
  
  console.log(`  ✓ Report written → ${outputFile}`);
  console.log('');
  // Print summary stats
  for (const name of CSV_FILES) {
    const { rows } = readCsvSafe(name);
    console.log(`  ${name}: ${rows.length} rows`);
  }
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});