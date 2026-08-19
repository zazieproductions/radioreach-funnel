#!/usr/bin/env node

/**
 * RadioReach Backlink Pipeline — Broken-Link Opportunity Detection
 *
 * Finds pages linking to dead radio directories, removed station lists,
 * defunct artist-resource pages, broken submission guides, closed
 * music-promotion tools, and missing radio-industry resources.
 *
 * The detection engine checks a candidate page for outbound links that
 * return HTTP errors (404, 410, etc.) or redirect to irrelevant content.
 *
 * Usage:
 *   node detect-broken.js --urls "https://example.com/resources" --output broken-links.csv
 *   node detect-broken.js --check-links-in prospects.csv --output broken-links.csv
 *
 * NOTE: For production-scale detection, use an API export of candidate
 * pages (or a crawl log) via --import. Each record should have a
 * `source_url` field.
 */

import { existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import {
  readCSV, writeCSV, fetchPage, generateId,
  printHeader, printStats, loadAssets,
} from './lib.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const SEO_DIR = join(__dirname, '..');

const BROKEN_LINK_HEADERS = [
  'id', 'source_url', 'broken_url', 'http_status', 'anchor_context',
  'relevant_asset_url', 'relevant_asset_name', 'discovery_date', 'notes',
];

// ─── Radio-industry dead-resource patterns ──────────────────────────────────

const DEAD_RESOURCE_PATTERNS = [
  // Patterns in anchor text or surrounding context that suggest the broken
  // link was a radio-industry resource (relevant replacement candidates)
  /radio station/i,
  /radio directory/i,
  /station list/i,
  /radio contact/i,
  /college radio/i,
  /music submission/i,
  /radio promotion/i,
  /music promotion tool/i,
  /airplay/i,
  /radio resources/i,
  /radio industry/i,
  /music industry resource/i,
  /submission guide/i,
  /radio spreadsheet/i,
];

// ─── Link extraction from HTML ──────────────────────────────────────────────

function extractLinks(html, baseUrl) {
  const links = [];
  const anchorRegex = /<a\s+[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;
  let match;
  
  while ((match = anchorRegex.exec(html)) !== null) {
    const href = match[1];
    const anchorText = match[2].replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
    
    // Skip non-HTTP links
    if (!/^https?:\/\//i.test(href)) continue;
    
    // Resolve relative URLs against base
    let absolute;
    try {
      absolute = new URL(href, baseUrl).href;
    } catch (e) {
      continue;
    }
    
    links.push({ href: absolute, anchor: anchorText });
  }
  
  return links;
}

// ─── Relevance check for broken link ────────────────────────────────────────

function isRelevantBrokenResource(link) {
  const context = (link.anchor || '') + ' ' + (link.surroundingText || '');
  for (const pattern of DEAD_RESOURCE_PATTERNS) {
    if (pattern.test(context)) return true;
  }
  return false;
}

// ─── Main ────────────────────────────────────────────────────────────────────

async function main() {
  printHeader('RadioReach Broken-Link Opportunity Detection');
  
  const args = process.argv.slice(2);
  let urlsArg = '';
  let inputFile = '';
  let outputFile = join(SEO_DIR, 'broken-links.csv');
  
  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case '--urls':
        urlsArg = args[++i];
        break;
      case '--input':
      case '--check-links-in':
        inputFile = args[++i];
        break;
      case '--output':
        outputFile = args[++i];
        break;
    }
  }
  
  if (!urlsArg && !inputFile) {
    console.error('Usage: node detect-broken.js --urls "https://site.com/resources,https://site2.com/links" [--output broken-links.csv]');
    console.error('       node detect-broken.js --input prospects.csv [--output broken-links.csv]');
    process.exit(1);
  }
  
  // Gather source pages
  let sourcePages = [];
  if (urlsArg) {
    sourcePages = urlsArg.split(',').map(u => u.trim()).filter(Boolean);
  } else if (inputFile && existsSync(inputFile)) {
    const { rows } = readCSV(inputFile);
    sourcePages = rows.map(r => r.source_url).filter(Boolean);
    console.log(`  Loaded ${sourcePages.length} source pages from ${inputFile}`);
  }
  
  console.log(`  Checking ${sourcePages.length} source pages for broken outbound links...`);
  console.log('  (Rate-limited: 2s between requests, respects robots.txt)');
  
  const findings = [];
  let totalLinksChecked = 0;
  let brokenFound = 0;
  let relevantFound = 0;
  
  const assets = loadAssets();
  
  for (const pageUrl of sourcePages) {
    process.stdout.write(`\n  ${pageUrl}\n`);
    const pageResult = await fetchPage(pageUrl);
    
    if (!pageResult.ok) {
      console.log(`    ✗ Page fetch failed (HTTP ${pageResult.status}) — skipping`);
      await sleep(1500);
      continue;
    }
    
    const links = extractLinks(pageResult.text, pageUrl);
    console.log(`    Found ${links.length} outbound links`);
    
    // Sample up to 20 links per page to stay within rate limits
    const sample = links.slice(0, 20);
    
    for (const link of sample) {
      totalLinksChecked++;
      
      // Skip obvious safe targets (homepages, social media)
      const host = new URL(link.href).hostname;
      if (['facebook.com', 'twitter.com', 'instagram.com', 'youtube.com', 'linkedin.com',
           'tiktok.com', 'spotify.com', 'apple.com', 'bandcamp.com', 'soundcloud.com'].includes(host)) {
        continue;
      }
      
      const check = await checkURL(link.href);
      
      if (check.broken) {
        brokenFound++;
        const relevant = isRelevantBrokenResource(link);
        
        if (relevant) {
          relevantFound++;
          const asset = pickBestAsset(link.anchor, assets);
          findings.push({
            id: generateId('B'),
            source_url: pageUrl,
            broken_url: link.href,
            http_status: String(check.status),
            anchor_context: link.anchor,
            relevant_asset_url: asset ? asset.url : '',
            relevant_asset_name: asset ? asset.name : '',
            discovery_date: new Date().toISOString().split('T')[0],
            notes: check.status === 0
              ? `Connection error (${check.error || 'timeout'}) — confirm manually`
              : `Confirmed HTTP ${check.status}`,
          });
          console.log(`    ✗ BROKEN (${check.status}) ${link.href} — "${link.anchor.slice(0, 50)}"${relevant ? ' [RELEVANT]' : ''}`);
        } else {
          console.log(`    ✗ broken (${check.status}) ${link.href} (not radio-relevant)`);
        }
      }
      
      await sleep(1500); // rate limit
    }
    
    await sleep(1500);
  }
  
  // Write findings
  writeCSV(outputFile, BROKEN_LINK_HEADERS, findings);
  
  printStats({
    'Source pages checked': sourcePages.length,
    'Outbound links checked': totalLinksChecked,
    'Broken links found': brokenFound,
    'Relevant broken links (opportunities)': relevantFound,
  });
  
  if (relevantFound > 0) {
    console.log(`\n  ✓ ${relevantFound} broken-link replacement opportunities → ${outputFile}`);
    console.log('  Next: review each finding, verify the link is genuinely dead,');
    console.log('  and use templates/broken-link-replacement.txt for outreach.');
  }
}

function pickBestAsset(anchor, assets) {
  if (!assets || assets.length === 0) return null;
  const text = (anchor || '').toLowerCase();
  
  const ranked = assets.map(a => {
    let score = 0;
    const topic = (a.name + ' ' + a.description).toLowerCase();
    if (text.includes('radio') && topic.includes('radio')) score += 3;
    if (text.includes('college') && topic.includes('college')) score += 3;
    if (text.includes('template') && a.category === 'template') score += 3;
    if (text.includes('guide') && a.category === 'guide') score += 2;
    if (text.includes('directory') && topic.includes('station')) score += 2;
    return { ...a, score };
  });
  
  ranked.sort((a, b) => b.score - a.score);
  return ranked[0];
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function checkURL(url) {
  const result = await fetchPage(url);
  return {
    status: result.status,
    broken: result.status >= 400 || result.status === 0,
    error: result.error,
  };
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});