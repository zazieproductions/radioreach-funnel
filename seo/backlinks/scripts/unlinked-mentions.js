#!/usr/bin/env node

/**
 * RadioReach Backlink Pipeline — Unlinked Brand Mention Finder
 *
 * Searches for mentions of RadioReach / Radio Reach / radioreach.us that
 * don't link to the site, and prepares a polite request to link the mention.
 *
 * Usage:
 *   node unlinked-mentions.js [--output unlinked-mentions.csv]
 *
 * NOTE: In production, use a mention-monitoring API or search-export CSV via
 * --import. The script prepares the outreach records; it never sends
 * automatically.
 */

import { existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import {
  readCSV, writeCSV, generateId, printHeader, printStats,
} from './lib.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const SEO_DIR = join(__dirname, '..');

const MENTION_HEADERS = [
  'id', 'mention_page', 'mention_text', 'mention_context',
  'suggested_url', 'contact_name', 'contact_email',
  'request_status', 'discovery_date', 'notes',
];

const BRAND_TERMS = ['radioreach', 'radio reach', 'radioreach.us'];

async function main() {
  printHeader('RadioReach Unlinked Brand Mentions');
  
  const args = process.argv.slice(2);
  let outputFile = join(SEO_DIR, 'unlinked-mentions.csv');
  let importFile = '';
  
  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case '--output':
        outputFile = args[++i];
        break;
      case '--import':
        importFile = args[++i];
        break;
    }
  }
  
  let mentions = [];
  
  if (importFile && existsSync(importFile)) {
    const { rows } = readCSV(importFile);
    for (const row of rows) {
      const text = ((row.content || '') + ' ' + (row.title || '')).toLowerCase();
      if (BRAND_TERMS.some(t => text.includes(t))) {
        mentions.push({
          id: generateId('M'),
          mention_page: row.url || row.source_url || '',
          mention_text: row.title || 'RadioReach',
          mention_context: (row.content || '').slice(0, 300),
          suggested_url: 'https://radioreach.us/resources/',
          contact_name: '',
          contact_email: '',
          request_status: 'not_requested',
          discovery_date: new Date().toISOString().split('T')[0],
          notes: 'Unlinked mention — request link via templates/unlinked-mention.txt',
        });
      }
    }
  } else {
    console.log('  No mention export provided. Usage:');
    console.log('  node unlinked-mentions.js --import mentions-export.csv');
    console.log('');
    console.log('  Export format: CSV with columns url, title, content');
    console.log('  (e.g., from Google Alerts, Brand24, or a search-API export)');
    
    // Create empty file for structure
    writeCSV(outputFile, MENTION_HEADERS, []);
    printStats({ 'Mentions found': 0 });
    return;
  }
  
  writeCSV(outputFile, MENTION_HEADERS, mentions);
  
  printStats({
    'Mentions found': mentions.length,
    'Requests prepared': mentions.length,
    'Status': 'all queued for human review (no auto-send)',
  });
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});