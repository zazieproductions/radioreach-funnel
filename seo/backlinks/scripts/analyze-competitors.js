#!/usr/bin/env node

/**
 * RadioReach Backlink Pipeline — Competitor Backlink-Gap Analysis
 *
 * Analyzes publicly visible backlinks pointing to comparable music-promotion
 * tools, directories, radio resources, and artist platforms.
 *
 * For each source, the link is classified as:
 *   directory | editorial recommendation | resource page | review |
 *   data citation | guest contribution | partnership | tool listing |
 *   broken-link replacement | paid or sponsored | spam or irrelevant
 *
 * Only opportunities where RadioReach can legitimately earn the same type
 * of mention are pursued.
 *
 * Usage:
 *   node analyze-competitors.js --domains "example.com,example2.com" [--output gap-analysis.csv]
 *
 * NOTE: In production, this script consumes data from an SEO backlink API
 * (e.g., Ahrefs, Semrush, Moz) or an exported backlink CSV. The script
 * provides the classification engine and gap-priority output. Place raw
 * export CSVs in seo/backlinks/reports/ for processing with --import.
 */

import { existsSync, readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import {
  readCSV, writeCSV, generateId, printHeader, printStats,
} from './lib.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const SEO_DIR = join(__dirname, '..');

// ─── Link classification ────────────────────────────────────────────────────

const CLASSIFY_RULES = [
  {
    type: 'spam_or_irrelevant',
    check: (link) => {
      const t = (link.title || '' + ' ' + link.anchor || '' + ' ' + link.source_url || '').toLowerCase();
      return t.includes('casino') || t.includes('poker') || t.includes('pills') ||
             t.includes('viagra') || t.includes('cryptocurrency') || t.includes('adult');
    },
  },
  {
    type: 'paid_or_sponsored',
    check: (link) => {
      const t = (link.title || '' + ' ' + link.anchor || '').toLowerCase();
      return t.includes('sponsored') || t.includes('advertisement') ||
             t.includes('advertorial') || t.includes('paid post') || t.includes('sponsor');
    },
  },
  {
    type: 'directory',
    check: (link) => {
      const t = (link.title || '' + ' ' + link.anchor || '').toLowerCase();
      return t.includes('directory') || t.includes('listing') || t.includes('listings') ||
             t.includes('resource list');
    },
  },
  {
    type: 'review',
    check: (link) => {
      const t = (link.title || '' + ' ' + link.anchor || '').toLowerCase();
      return t.includes('review') || t.includes('rating') || t.includes('testimonial');
    },
  },
  {
    type: 'resource_page',
    check: (link) => {
      const t = (link.title || '' + ' ' + link.anchor || '').toLowerCase();
      return t.includes('resources') || t.includes('helpful links') ||
             t.includes('useful tools') || t.includes('recommended');
    },
  },
  {
    type: 'editorial_recommendation',
    check: (link) => {
      const t = (link.title || '' + ' ' + link.anchor || '').toLowerCase();
      return t.includes('best') || t.includes('top') || t.includes('alternative') ||
             t.includes('guide') || t.includes('how to');
    },
  },
  {
    type: 'data_citation',
    check: (link) => {
      const t = (link.title || '' + ' ' + link.anchor || '').toLowerCase();
      return t.includes('data') || t.includes('statistics') || t.includes('study') ||
             t.includes('research') || t.includes('survey');
    },
  },
  {
    type: 'tool_listing',
    check: (link) => {
      const t = (link.title || '' + ' ' + link.anchor || '').toLowerCase();
      return t.includes('tool') || t.includes('software') || t.includes('app') ||
             t.includes('platform');
    },
  },
  {
    type: 'guest_contribution',
    check: (link) => {
      const t = (link.title || '' + ' ' + link.anchor || '').toLowerCase();
      return t.includes('guest post') || t.includes('guest article') ||
             t.includes('contributed');
    },
  },
];

const CLASSIFY_DEFAULT = 'unclassified';

function classifyLink(link) {
  for (const rule of CLASSIFY_RULES) {
    if (rule.check(link)) return rule.type;
  }
  return CLASSIFY_DEFAULT;
}

// ─── Gap priority scoring ───────────────────────────────────────────────────

function gapPriority(link) {
  // Higher = more worth pursuing for RadioReach
  const typeWeights = {
    'editorial_recommendation': 10,
    'resource_page': 9,
    'directory': 7,
    'data_citation': 8,
    'tool_listing': 7,
    'review': 5,
    'guest_contribution': 6,
    'partnership': 5,
    'broken_link_replacement': 4,
    'paid_or_sponsored': -10,
    'spam_or_irrelevant': -20,
    'unclassified': 3,
  };
  
  let score = typeWeights[link.classified_type] || 3;
  
  // Boost for .edu, .org domains (higher editorial trust)
  try {
    const domain = new URL(link.source_url).hostname;
    if (domain.endsWith('.edu')) score += 5;
    if (domain.endsWith('.org')) score += 2;
    if (domain.endsWith('.gov')) score += 4;
  } catch (e) { /* ignore */ }
  
  // Boost for higher DR/authority if provided
  if (link.domain_rating && parseInt(link.domain_rating) > 30) score += 2;
  
  return Math.max(0, score);
}

// ─── Main ────────────────────────────────────────────────────────────────────

async function main() {
  printHeader('RadioReach Competitor Backlink-Gap Analysis');
  
  const args = process.argv.slice(2);
  let domains = '';
  let importFile = '';
  let outputFile = join(SEO_DIR, 'reports', 'competitor-gap-analysis.csv');
  
  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case '--domains':
        domains = args[++i];
        break;
      case '--import':
        importFile = args[++i];
        break;
      case '--output':
        outputFile = args[++i];
        break;
    }
  }
  
  if (!domains && !importFile) {
    console.error('Usage: node analyze-competitors.js --domains "domain1.com,domain2.com" [--output file.csv]');
    console.error('       node analyze-competitors.js --import backlink-export.csv [--output file.csv]');
    process.exit(1);
  }
  
  const competitorList = domains ? domains.split(',').map(d => d.trim()) : [];
  console.log(`  Competitors: ${competitorList.join(', ') || '(from import file)'}`);
  
  // Phase 1: Import raw data (from API export or CSV)
  let rawLinks = [];
  if (importFile && existsSync(importFile)) {
    const { rows } = readCSV(importFile);
    rawLinks = rows;
    console.log(`  Imported ${rawLinks.length} raw backlink records from ${importFile}`);
  } else if (domains) {
    // No import file — create placeholder records for each competitor
    // In production, replace this block with an API call to an SEO backlink index.
    for (const domain of competitorList) {
      rawLinks.push({
        source_url: `https://example-resource-site.com/resources/`, // placeholder
        title: `Resource page linking to ${domain}`,
        anchor: 'music promotion tools',
        domain_rating: '35',
        competitor: domain,
      });
      rawLinks.push({
        source_url: `https://example-university.edu/student-resources/`,
        title: `Student musician resources`,
        anchor: 'radio resources',
        domain_rating: '60',
        competitor: domain,
      });
    }
    console.log(`  ⚠ No backlink export imported. Generated ${rawLinks.length} placeholder records.`);
    console.log('  For real analysis, export backlinks from an SEO tool (Ahrefs/Semrush/Moz)');
    console.log('  and pass --import path/to/export.csv');
  }
  
  // Phase 2: Classify each link
  const classified = rawLinks.map(link => {
    const type = classifyLink(link);
    return {
      ...link,
      classified_type: type,
      gap_priority: gapPriority({ ...link, classified_type: type }),
    };
  });
  
  // Phase 3: Sort by priority and write output
  classified.sort((a, b) => b.gap_priority - a.gap_priority);
  
  const headers = [
    'source_url', 'title', 'anchor', 'domain_rating',
    'competitor', 'classified_type', 'gap_priority',
  ];
  writeCSV(outputFile, headers, classified);
  
  // Stats
  const typeCounts = {};
  for (const link of classified) {
    typeCounts[link.classified_type] = (typeCounts[link.classified_type] || 0) + 1;
  }
  
  printStats({
    'Links analyzed': classified.length,
    'Pursuable opportunities': classified.filter(l => l.gap_priority >= 7).length,
    'Paid/spam (do not pursue)': classified.filter(l => ['paid_or_sponsored', 'spam_or_irrelevant'].includes(l.classified_type)).length,
  });
  
  console.log('\n  Classification breakdown:');
  for (const [type, count] of Object.entries(typeCounts)) {
    console.log(`    ${type}: ${count}`);
  }
  
  console.log(`\n  ✓ Full gap analysis → ${outputFile}`);
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});