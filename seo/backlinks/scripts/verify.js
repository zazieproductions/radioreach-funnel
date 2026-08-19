#!/usr/bin/env node

/**
 * RadioReach Backlink Pipeline — Backlink Verification
 *
 * Checks that acquired backlinks are still live and correct.
 * Re-checks all links in acquired.csv weekly.
 * Moves lost links to lost.csv.
 *
 * Usage:
 *   node verify.js                               Full check of acquired.csv
 *   node verify.js --check-acquired              Same as above
 *   node verify.js --url https://example.com     Check a single URL
 *   node verify.js --verify-outreach             Verify submitted links were placed
 */

import { existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import {
  readCSV, writeCSV, appendCSV, generateId,
  fetchPage, printHeader, printStats,
} from './lib.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const SEO_DIR = join(__dirname, '..');

const ACQUIRED_HEADERS = [
  'id', 'source_url', 'target_url', 'anchor_text',
  'link_type', 'follow_status', 'acquisition_date',
  'last_verified_date', 'acquisition_method', 'contact_history', 'notes',
];

const LOST_HEADERS = [
  'id', 'source_url', 'target_url', 'anchor_text',
  'link_type', 'acquisition_date', 'loss_date', 'loss_reason', 'notes',
];

// ─── Link verification ──────────────────────────────────────────────────────

async function verifyBacklink(record) {
  const sourceUrl = record.source_url;
  if (!sourceUrl) return { verified: false, reason: 'No source URL', linkFound: false };
  
  try {
    const result = await fetchPage(sourceUrl);
    
    if (!result.ok) {
      return {
        verified: false,
        reason: `Page returned HTTP ${result.status}`,
        linkFound: false,
        pageStatus: result.status,
      };
    }
    
    // Check if our target URL appears in the page
    const targetUrl = record.target_url || '';
    const anchorText = record.anchor_text || 'RadioReach';
    
    // Look for the link in the page content
    const linkFound = targetUrl && result.text.includes(targetUrl);
    const anchorFound = result.text.includes(anchorText);
    
    return {
      verified: linkFound && anchorFound,
      reason: linkFound ? (anchorFound ? 'Link and anchor text found' : 'Link found, anchor text mismatch') : 'Link not found on page',
      linkFound,
      anchorFound,
      pageStatus: result.status,
      contentLength: result.text.length,
    };
  } catch (err) {
    return {
      verified: false,
      reason: `Fetch error: ${err.message}`,
      linkFound: false,
      error: err.message,
    };
  }
}

// ─── Main ────────────────────────────────────────────────────────────────────

async function main() {
  printHeader('RadioReach Backlink Verification');
  
  const args = process.argv.slice(2);
  const checkAcquired = args.includes('--check-acquired') || args.length === 0;
  const singleUrl = args.find((a, i) => a === '--url' ? args[i + 1] : null);
  const verifyOutreach = args.includes('--verify-outreach');
  
  const acquiredFile = join(SEO_DIR, 'acquired.csv');
  const lostFile = join(SEO_DIR, 'lost.csv');
  
  if (singleUrl) {
    // Verify a single URL
    console.log(`\n  Checking single URL: ${singleUrl}`);
    const result = await fetchPage(singleUrl);
    console.log(`  Status: ${result.status} ${result.ok ? '✓' : '✗'}`);
    console.log(`  Content length: ${result.text.length} bytes`);
    return;
  }
  
  if (!existsSync(acquiredFile)) {
    console.log('  No acquired.csv found. Nothing to verify.');
    console.log('  Run discover → score → outreach pipeline first.');
    return;
  }
  
  const { rows: acquiredLinks } = readCSV(acquiredFile);
  console.log(`  Acquired links to check: ${acquiredLinks.length}`);
  
  if (acquiredLinks.length === 0) {
    console.log('  No links in acquired.csv to verify.');
    return;
  }
  
  const verifiedLinks = [];
  const lostLinks = [];
  let verified = 0;
  let broken = 0;
  let errors = 0;
  
  for (const link of acquiredLinks) {
    process.stdout.write(`  Checking ${link.source_url}... `);
    const result = await verifyBacklink(link);
    
    if (result.verified) {
      verified++;
      link.last_verified_date = new Date().toISOString().split('T')[0];
      link.notes = (link.notes || '') + ` | Verified: ${result.reason}`;
      verifiedLinks.push(link);
      console.log('✓');
    } else if (result.linkFound === false && result.pageStatus) {
      // Link is lost — move to lost.csv
      broken++;
      lostLinks.push({
        id: generateId('L'),
        source_url: link.source_url || '',
        target_url: link.target_url || '',
        anchor_text: link.anchor_text || '',
        link_type: link.link_type || '',
        acquisition_date: link.acquisition_date || '',
        loss_date: new Date().toISOString().split('T')[0],
        loss_reason: result.reason || 'Link removed or page changed',
        notes: `Previous verified date: ${link.last_verified_date || 'unknown'}`,
      });
      console.log(`✗ (lost: ${result.reason})`);
    } else {
      errors++;
      link.last_verified_date = new Date().toISOString().split('T')[0];
      link.notes = (link.notes || '') + ` | Error: ${result.reason}`;
      verifiedLinks.push(link);
      console.log(`? (${result.reason})`);
    }
    
    // Rate limiting
    await new Promise(r => setTimeout(r, 1500));
  }
  
  // Write updated acquired.csv (only verified/errored links)
  writeCSV(acquiredFile, ACQUIRED_HEADERS, verifiedLinks);
  
  // Append lost links
  if (lostLinks.length > 0) {
    const existingLost = existsSync(lostFile) ? readCSV(lostFile) : { rows: [] };
    const allLost = [...existingLost.rows, ...lostLinks];
    writeCSV(lostFile, LOST_HEADERS, allLost);
  }
  
  printStats({
    'Total checked': acquiredLinks.length,
    'Still live': verified,
    'Lost/moved': broken,
    'Errors': errors,
  });
  
  if (broken > 0) {
    console.log(`\n  ${broken} link(s) moved to lost.csv`);
  }
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});