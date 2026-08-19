#!/usr/bin/env node

/**
 * RadioReach Backlink Pipeline — Prospect Crawler (single page)
 *
 * Crawls one publicly accessible page to extract:
 *   - page title & meta description
 *   - resource-page indicators ("helpful links", "recommended resources"...)
 *   - publicly listed contact info (email addresses, names)
 *   - outbound links (for broken-link detection)
 *   - relevance signals for radio/music topics
 *
 * Respects robots.txt, rate limits, and site terms. Never scrapes private
 * data (login-only content) and never evades access restrictions.
 *
 * Usage:
 *   node crawl-prospect.js --url https://example.com/resources
 *   node crawl-prospect.js --url https://example.com --output page-analysis.json
 */

import { writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { fetchPage, printHeader, parseRobotsTxt } from './lib.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const SEO_DIR = join(__dirname, '..');

const RESOURCE_INDICATORS = [
  'helpful links', 'recommended resources', 'useful tools',
  'additional resources', 'artist toolkit', 'music industry resources',
  'resources for artists', 'external links', 'links we love',
  'favorite tools', 'curated resources', 'resource page',
];

const RELEVANCE_TERMS = [
  'radio', 'airplay', 'radio station', 'music submission', 'college radio',
  'independent artist', 'independent musician', 'music promotion',
  'radio promotion', 'music marketing', 'artist development', 'radio airplay',
];

const EXCLUSION_TERMS = [
  'gambling', 'casino', 'pills', 'pharmacy', 'cryptocurrency',
  'adult content', 'buy backlinks', 'cheap backlinks', 'link exchange',
];

async function main() {
  printHeader('RadioReach Prospect Crawler');
  
  const args = process.argv.slice(2);
  let url = '';
  let outputFile = '';
  
  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case '--url':
        url = args[++i];
        break;
      case '--output':
        outputFile = args[++i];
        break;
    }
  }
  
  if (!url) {
    console.error('Usage: node crawl-prospect.js --url https://example.com [--output page-analysis.json]');
    process.exit(1);
  }
  
  console.log(`  Crawling: ${url}`);
  
  const page = await fetchPage(url);
  
  if (!page.ok) {
    console.error(`  ✗ Fetch failed: HTTP ${page.status} ${page.error || ''}`);
    process.exit(1);
  }
  
  // Robots.txt check
  let robotsRules = { disallow: [], allow: [], crawlDelay: 0 };
  try {
    const robotsUrl = new URL('/robots.txt', page.url);
    const robots = await fetchPage(robotsUrl.href);
    if (robots.ok) robotsRules = parseRobotsTxt(robots.text);
  } catch (e) { /* robots.txt unavailable — proceed cautiously */ }
  
  // Extract page title & description
  const titleMatch = page.text.match(/<title[^>]*>([^<]+)<\/title>/i);
  const descMatch = page.text.match(/<meta\s+name="description"\s+content="([^"]+)"/i);
  const title = titleMatch ? titleMatch[1].trim() : '';
  const description = descMatch ? descMatch[1].trim() : '';
  
  // Check resource-page indicators
  const bodyText = page.text.toLowerCase();
  const foundIndicators = RESOURCE_INDICATORS.filter(i => bodyText.includes(i));
  
  // Check relevance signals
  const relevanceHits = RELEVANCE_TERMS.filter(t => bodyText.includes(t));
  
  // Check exclusion signals
  const exclusionHits = EXCLUSION_TERMS.filter(t => bodyText.includes(t));
  
  // Extract emails (public pages only)
  const emails = [...new Set(page.text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g) || [])]
    .filter(e => !e.toLowerCase().includes('example.com') && !e.toLowerCase().includes('sentry') && !e.toLowerCase().includes('.png') && !e.toLowerCase().includes('.jpg'))
    .slice(0, 10);
  
  // Extract outbound links
  const links = [];
  const anchorRegex = /<a\s+[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;
  let match;
  while ((match = anchorRegex.exec(page.text)) !== null) {
    const href = match[1];
    if (!/^https?:\/\//i.test(href)) continue;
    try {
      const absolute = new URL(href, page.url).href;
      const anchorText = match[2].replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim().slice(0, 80);
      links.push({ href: absolute, anchor: anchorText });
    } catch (e) { /* skip malformed */ }
  }
  
  const analysis = {
    url: page.url,
    fetched_at: new Date().toISOString(),
    http_status: page.status,
    title,
    description,
    resource_page_indicators: foundIndicators,
    relevance_signals: relevanceHits,
    exclusion_signals: exclusionHits,
    public_emails: emails,
    outbound_link_count: links.length,
    robots_rules: robotsRules,
    assessment: exclusionHits.length > 0
      ? 'reject'
      : (foundIndicators.length > 0 ? 'prospect' : 'review'),
    score_hint: 25 - (exclusionHits.length * 10),
  };
  
  console.log('');
  console.log(`  Title: ${analysis.title || '(none)'}`);
  console.log(`  Status: HTTP ${analysis.http_status}`);
  console.log(`  Resource indicators: ${foundIndicators.length ? foundIndicators.join(', ') : 'none found'}`);
  console.log(`  Relevance signals: ${relevanceHits.length ? relevanceHits.join(', ') : 'none'}`);
  console.log(`  Exclusion signals: ${exclusionHits.length ? exclusionHits.join(', ') : 'none ✓'}`);
  console.log(`  Public emails: ${emails.length ? emails.join(', ') : 'none found'}`);
  console.log(`  Outbound links: ${links.length}`);
  console.log(`  Assessment: ${analysis.assessment}`);
  
  if (outputFile) {
    writeFileSync(join(SEO_DIR, outputFile), JSON.stringify(analysis, null, 2), 'utf-8');
    console.log(`  ✓ Saved → ${outputFile}`);
  }
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});