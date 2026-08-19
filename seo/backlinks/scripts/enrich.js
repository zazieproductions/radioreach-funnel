#!/usr/bin/env node

/**
 * RadioReach Backlink Pipeline — Prospect Enrichment
 *
 * Crawls each prospect's page to fill in publicly listed contact
 * information (name, email, role) and page metadata. Only public,
 * non-login content is processed — never private data.
 *
 * Usage:
 *   node enrich.js --input prospects.csv --output prospects-enriched.csv
 *   node enrich.js --input qualified.csv --output qualified-enriched.csv
 */

import { existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import {
  readCSV, writeCSV, fetchPage, printHeader, printStats, sleep,
} from './lib.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const SEO_DIR = join(__dirname, '..');

// ─── Contact extraction (public pages only) ─────────────────────────────────

function extractEmails(html) {
  const found = new Set();
  const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)+\.[a-zA-Z]{2,}/g;
  const matches = html.match(emailRegex) || [];
  for (const m of matches) {
    const lower = m.toLowerCase();
    // Filter obvious non-personal/technical addresses
    if (lower.includes('example') || lower.includes('.png') || lower.includes('.jpg') ||
        lower.includes('.gif') || lower.includes('.svg') || lower.includes('sentry') ||
        lower.includes('wixpress') || lower.includes('cloudflare') || lower.includes('sentry.io')) {
      continue;
    }
    found.add(lower);
  }
  return [...found].slice(0, 5);
}

function extractMailtoEmails(html) {
  const found = [];
  const mailtoRegex = /href=["']mailto:([^"']+)["']/gi;
  let m;
  while ((m = mailtoRegex.exec(html)) !== null) {
    const email = m[1].split('?')[0].trim();
    if (email && !email.toLowerCase().includes('example')) found.push(email.toLowerCase());
  }
  return [...new Set(found)].slice(0, 5);
}

function extractNames(html, title) {
  // Very conservative: only extract names that appear in visible contact
  // contexts. Never fabricate — if nothing is found, leave blank.
  const names = new Set();
  
  // Pattern: "Contact: Jane Smith" or "Jane Smith, Music Director"
  const contactPatterns = [
    /(?:contact|contact us|email|reach|editor|founder|owner|manager|director|admin|webmaster)[:\s]*<[^>]*>?([A-Z][a-z]+(?:\s+[A-Z][a-z]+){1,3})/g,
    /([A-Z][a-z]+(?:\s+[A-Z][a-z]+){1,2}),\s*(?:music director|editor|founder|owner|manager|administrator|webmaster|publisher|curator)/g,
  ];
  
  for (const re of contactPatterns) {
    let m;
    while ((m = re.exec(html)) !== null) {
      const name = m[1].trim();
      // Skip if it looks like a sentence fragment
      if (name.length > 2 && name.length < 40 && !/^(the|our|your|we|this|that|contact|hello|support|info|admin|team)$/i.test(name)) {
        names.add(name);
      }
    }
  }
  
  return [...names].slice(0, 3);
}

// ─── Main ────────────────────────────────────────────────────────────────────

async function main() {
  printHeader('RadioReach Prospect Enrichment');
  
  const args = process.argv.slice(2);
  let inputFile = '';
  let outputFile = '';
  
  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case '--input':
        inputFile = args[++i];
        break;
      case '--output':
        outputFile = args[++i];
        break;
    }
  }
  
  if (!inputFile) {
    console.error('Usage: node enrich.js --input prospects.csv [--output prospects-enriched.csv]');
    process.exit(1);
  }
  
  if (!existsSync(inputFile)) {
    console.error(`  ✗ Input file not found: ${inputFile}`);
    process.exit(1);
  }
  
  const { headers, rows } = readCSV(inputFile);
  outputFile = outputFile || inputFile.replace(/\.csv$/, '-enriched.csv');
  
  console.log(`  Input:  ${inputFile} (${rows.length} rows)`);
  console.log(`  Output: ${outputFile}`);
  console.log('  (Rate-limited: 2s between requests)');
  
  let enriched = 0;
  let alreadyHasEmail = 0;
  
  for (const row of rows) {
    const url = row.source_url || '';
    if (!url) {
      row.notes = (row.notes || '') + ' | No URL to enrich';
      continue;
    }
    
    // Skip rows that already have a contact email
    if (row.contact_email && row.contact_email.includes('@')) {
      alreadyHasEmail++;
      continue;
    }
    
    process.stdout.write(`  ${url} ... `);
    const page = await fetchPage(url);
    
    if (!page.ok) {
      row.notes = (row.notes || '') + ` | Enrichment fetch failed (HTTP ${page.status})`;
      console.log('✗');
      await sleep(1500);
      continue;
    }
    
    const emails = [...extractEmails(page.text), ...extractMailtoEmails(page.text)];
    const names = extractNames(page.text, page.title);
    
    if (emails.length > 0) {
      row.contact_email = emails[0];
      enriched++;
    }
    if (names.length > 0 && !row.contact_name) {
      row.contact_name = names[0];
    }
    if (!row.page_title) {
      const t = page.text.match(/<title[^>]*>([^<]+)<\/title>/i);
      if (t) row.page_title = t[1].trim();
    }
    if (!row.page_description) {
      const d = page.text.match(/<meta\s+name="description"\s+content="([^"]+)"/i);
      if (d) row.page_description = d[1].trim();
    }
    
    console.log(emails.length > 0 ? `✓ (${emails[0]})` : '− (no public email)');
    await sleep(1500);
  }
  
  writeCSV(outputFile, headers, rows);
  
  printStats({
    'Rows processed': rows.length,
    'Rows already had email': alreadyHasEmail,
    'Emails newly found (public pages only)': enriched,
  });
  
  console.log(`\n  ✓ Enriched → ${outputFile}`);
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});