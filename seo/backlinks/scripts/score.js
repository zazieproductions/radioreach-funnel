#!/usr/bin/env node

/**
 * RadioReach Backlink Pipeline — Prospect Scoring & Qualification
 *
 * Rates every prospect using the 0–100 scoring rubric and separates
 * qualified opportunities (≥65) from rejected ones.
 *
 * Usage:
 *   node score.js --input prospects.csv --output-qualified qualified.csv --output-rejected rejected.csv
 *   node score.js --recalc              Re-score all prospects in place
 */

import { existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import {
  readCSV, writeCSV, generateId, printHeader, printStats,
  scoreProspect, loadAssets, getBestAssetForCategory,
} from './lib.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const SEO_DIR = join(__dirname, '..');

const MIN_QUALIFIED_SCORE = 65;

const QUALIFIED_HEADERS = [
  'id', 'source_url', 'page_title', 'domain', 'category',
  'relevance_score', 'editorial_score', 'audience_score',
  'acceptance_likelihood', 'page_quality', 'traffic_potential',
  'ease_score', 'total_score', 'qualified_date',
  'recommended_asset', 'contact_name', 'contact_email', 'notes',
];

const REJECTED_HEADERS = [
  'id', 'source_url', 'page_title', 'domain', 'category',
  'rejection_reason', 'score_before_rejection',
  'discovery_date', 'rejection_date', 'notes',
];

// ─── Category-based deduction mappings ───────────────────────────────────────

const CATEGORY_REJECTION_RULES = {
  'spam': {
    check: (p) => {
      const text = ((p.page_description || '') + ' ' + (p.notes || '')).toLowerCase();
      return text.includes('buy backlink') || text.includes('link farm') ||
             text.includes('cheap backlinks') || text.includes('link exchange');
    },
    reason: 'Obvious link spam indicators',
    penalty: -50,
  },
  'unrelated_content': {
    check: (p) => {
      const text = ((p.page_description || '') + ' ' + (p.page_title || '') + ' ' + (p.notes || '')).toLowerCase();
      return text.includes('gambling') || text.includes('casino') ||
             text.includes('cryptocurrency') || text.includes('adult') ||
             text.includes('payday loans');
    },
    reason: 'Unrelated or prohibited content category',
    penalty: -30,
  },
  'low_quality': {
    check: (p) => {
      const notes = (p.notes || '').toLowerCase();
      return notes.includes('auto approve') || notes.includes('no moderation') ||
             notes.includes('unmoderated');
    },
    reason: 'No visible editorial standards',
    penalty: -20,
  },
};

// ─── Scoring Engine ──────────────────────────────────────────────────────────

function qualifyProspect(prospect) {
  const scored = scoreProspect(prospect);
  const prospectId = prospect.id || generateId('P');
  const today = new Date().toISOString().split('T')[0];

  // Reject-level signals (e.g., abandoned/compromised domain)
  if (scored.rejected) {
    return {
      status: 'rejected',
      rejection: {
        id: generateId('R'),
        source_url: prospect.source_url || '',
        page_title: prospect.page_title || '',
        domain: prospect.domain || '',
        category: prospect.category || '',
        rejection_reason: 'Abandoned, compromised, or prohibited domain/resource',
        score_before_rejection: '0',
        discovery_date: prospect.discovery_date || today,
        rejection_date: today,
        notes: `Rejected by hard rule. Penalties: ${(scored.penalties || []).join(', ')}`,
      },
      qualified: null,
    };
  }

  // Check rejection rules
  for (const [ruleName, rule] of Object.entries(CATEGORY_REJECTION_RULES)) {
    if (rule.check(prospect)) {
      return {
        status: 'rejected',
        rejection: {
          id: generateId('R'),
          source_url: prospect.source_url || '',
          page_title: prospect.page_title || '',
          domain: prospect.domain || '',
          category: prospect.category || '',
          rejection_reason: rule.reason,
          score_before_rejection: String(scored.total),
          discovery_date: prospect.discovery_date || today,
          rejection_date: today,
          notes: `Rejected by rule: ${ruleName} (penalty: ${rule.penalty})`,
        },
        qualified: null,
      };
    }
  }

  // Check minimum score
  if (scored.total < MIN_QUALIFIED_SCORE) {
    return {
      status: 'rejected',
      rejection: {
        id: generateId('R'),
        source_url: prospect.source_url || '',
        page_title: prospect.page_title || '',
        domain: prospect.domain || '',
        category: prospect.category || '',
        rejection_reason: `Score ${scored.total} below minimum ${MIN_QUALIFIED_SCORE}`,
        score_before_rejection: String(scored.total),
        discovery_date: prospect.discovery_date || today,
        rejection_date: today,
        notes: `Scored components: rel=${scored.relevance} ed=${scored.editorial} aud=${scored.audience} acc=${scored.acceptance} qual=${scored.quality} tr=${scored.traffic} ease=${scored.ease}`,
      },
      qualified: null,
    };
  }

  return {
    status: 'qualified',
    rejection: null,
    qualified: {
      id: generateId('Q'),
      source_url: prospect.source_url || '',
      page_title: prospect.page_title || '',
      domain: prospect.domain || '',
      category: prospect.category || '',
      relevance_score: String(scored.relevance),
      editorial_score: String(scored.editorial),
      audience_score: String(scored.audience),
      acceptance_likelihood: String(scored.acceptance),
      page_quality: String(scored.quality),
      traffic_potential: String(scored.traffic),
      ease_score: String(scored.ease),
      total_score: String(scored.total),
      qualified_date: today,
      recommended_asset: recommendAsset(prospect).name || '',
      contact_name: prospect.contact_name || '',
      contact_email: prospect.contact_email || '',
      notes: prospect.notes || '',
    },
  };
}

// Cache assets so each scoring run loads them once
let _assetCache = null;
function recommendAsset(prospect) {
  if (!_assetCache) _assetCache = loadAssets();
  const context = [
    prospect.page_title,
    prospect.page_description,
    prospect.subcategory,
    prospect.notes,
  ].join(' ').trim();
  const asset = getBestAssetForCategory(prospect.category, _assetCache, context);
  return asset || { name: '' };
}

// ─── Main ────────────────────────────────────────────────────────────────────

async function main() {
  printHeader('RadioReach Prospect Scoring');

  const args = process.argv.slice(2);
  let inputFile = '';
  let outputQualified = join(SEO_DIR, 'qualified.csv');
  let outputRejected = join(SEO_DIR, 'rejected.csv');
  let recalc = false;

  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case '--input':
        inputFile = args[++i];
        break;
      case '--output-qualified':
        outputQualified = args[++i];
        break;
      case '--output-rejected':
        outputRejected = args[++i];
        break;
      case '--recalc':
        recalc = true;
        break;
    }
  }

  if (!inputFile && !recalc) {
    console.error('Usage: node score.js --input prospects.csv [--output-qualified qualified.csv] [--output-rejected rejected.csv]');
    console.error('       node score.js --recalc');
    process.exit(1);
  }

  if (recalc) {
    // Re-score existing qualified list
    inputFile = outputQualified;
  }

  if (!existsSync(inputFile)) {
    console.error(`  ✗ Input file not found: ${inputFile}`);
    console.error('  Run discover.js first to generate prospects.');
    process.exit(1);
  }

  const { headers, rows: prospects } = readCSV(inputFile);
  console.log(`  Input:  ${inputFile} (${prospects.length} prospects)`);

  const qualified = [];
  const rejected = [];
  let totalScoreSum = 0;

  for (const prospect of prospects) {
    const result = qualifyProspect(prospect);
    
    if (result.status === 'qualified' && result.qualified) {
      qualified.push(result.qualified);
      totalScoreSum += parseInt(result.qualified.total_score || '0');
    } else if (result.rejection) {
      rejected.push(result.rejection);
    }
  }

  // Write outputs
  writeCSV(outputQualified, QUALIFIED_HEADERS, qualified);
  writeCSV(outputRejected, REJECTED_HEADERS, rejected);

  const avgScore = qualified.length > 0 ? (totalScoreSum / qualified.length).toFixed(1) : 'N/A';

  printStats({
    'Prospects processed': prospects.length,
    'Qualified (≥65)': qualified.length,
    'Rejected': rejected.length,
    'Average qualified score': avgScore,
    'Qualified output': outputQualified,
    'Rejected output': outputRejected,
  });

  if (qualified.length === 0) {
    console.log('\n  ⚠ No prospects met the minimum score of 65.');
    console.log('  Try broader keywords or manually review rejected.csv.');
  }
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});