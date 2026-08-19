/**
 * RadioReach Backlink Pipeline — Shared Library
 *
 * Common utilities for all pipeline scripts: CSV parsing, HTTP helpers,
 * asset registry, scoring engine, and logging.
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const SEO_DIR = join(__dirname, '..');
const DATA_DIR = SEO_DIR;
const ASSETS_FILE = join(SEO_DIR, 'assets', 'index.json');

// ─── CSV Utilities ───────────────────────────────────────────────────────────

export function parseCSV(text) {
  // RFC-4180-style parser that correctly handles quoted fields containing
  // embedded newlines, commas, and escaped quotes.
  const rows = [];
  const values = [];
  let current = '';
  let inQuotes = false;
  let fieldStarted = false;
  const raw = text.trim();

  for (let i = 0; i < raw.length; i++) {
    const ch = raw[i];
    if (inQuotes) {
      if (ch === '"') {
        if (raw[i + 1] === '"') { current += '"'; i++; }
        else { inQuotes = false; }
      } else {
        current += ch;
      }
    } else if (ch === '"' && !fieldStarted) {
      inQuotes = true;
      fieldStarted = true;
    } else if (ch === ',') {
      values.push(current.trim());
      current = '';
      fieldStarted = false;
    } else if (ch === '\n') {
      values.push(current.trim());
      current = '';
      fieldStarted = false;
      rows.push(values.slice());
      values.length = 0;
    } else if (ch === '\r') {
      // skip carriage returns
    } else {
      current += ch;
      fieldStarted = true;
    }
  }
  // Last field/row without trailing newline
  values.push(current.trim());
  rows.push(values);

  if (rows.length === 0) return { headers: [], rows: [] };
  const headers = rows[0];
  const data = rows.slice(1).map(vals => {
    const row = {};
    headers.forEach((h, j) => { row[h] = (vals[j] || '').trim(); });
    return row;
  });
  return { headers, rows: data };
}

export function parseCSVLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') { current += '"'; i++; }
      else { inQuotes = !inQuotes; }
    } else if (ch === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += ch;
    }
  }
  result.push(current.trim());
  return result;
}

export function toCSV(headers, rows) {
  const esc = v => {
    const s = String(v ?? '');
    return /[,"\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
  };
  const head = headers.map(esc).join(',');
  const body = rows.map(r => headers.map(h => esc(r[h] ?? '')).join(','));
  return head + '\n' + body.join('\n') + '\n';
}

export function readCSV(filePath) {
  if (!existsSync(filePath)) return { headers: [], rows: [] };
  const text = readFileSync(filePath, 'utf-8');
  return parseCSV(text);
}

export function writeCSV(filePath, headers, rows) {
  ensureDir(dirname(filePath));
  writeFileSync(filePath, toCSV(headers, rows), 'utf-8');
  console.log(`  ✓ Wrote ${rows.length} rows → ${filePath}`);
}

export function appendCSV(filePath, headers, row) {
  ensureDir(dirname(filePath));
  const existing = existsSync(filePath) ? readFileSync(filePath, 'utf-8').trim() : '';
  if (!existing) {
    writeCSV(filePath, headers, [row]);
  } else {
    const line = toCSV(headers, [row]).split('\n').slice(1).join('\n');
    writeFileSync(filePath, existing.endsWith('\n') ? existing + line : existing + '\n' + line, 'utf-8');
  }
}

// ─── File helpers ────────────────────────────────────────────────────────────

function ensureDir(p) {
  if (!existsSync(p)) mkdirSync(p, { recursive: true });
}

// ─── Asset Registry ──────────────────────────────────────────────────────────

export function loadAssets() {
  if (!existsSync(ASSETS_FILE)) {
    console.warn('  � No assets/index.json found. Load empty asset list.');
    return [];
  }
  const data = JSON.parse(readFileSync(ASSETS_FILE, 'utf-8'));
  return data.assets || [];
}

export function getBestAssetForCategory(category, assets, context = '') {
  if (!assets || assets.length === 0) return null;

  // Category → preferred asset id map (explicit editorial choice)
  const CATEGORY_PREFS = {
    'directory': ['stations-accepting-music', 'radio-outreach-tracker', 'pitch-email-templates'],
    'resource_page': ['pitch-email-templates', 'college-radio-guide', 'radio-promotion-guide'],
    'university': ['college-radio-guide', 'stations-accepting-music', 'radio-promotion-guide'],
    'association': ['radio-promotion-guide', 'radio-faq', 'stations-accepting-music'],
    'educational': ['radio-glossary', 'college-radio-guide', 'radio-promotion-guide'],
    'blog': ['diy-vs-promoter', 'pitch-email-templates', 'radio-promotion-guide'],
    'broken_link': ['stations-accepting-music', 'radio-promotion-guide', 'radio-glossary'],
    'direct_submission': ['radio-outreach-tracker', 'pitch-email-templates'],
    'directories': ['stations-accepting-music', 'radio-outreach-tracker', 'pitch-email-templates'],
    'resource_pages': ['pitch-email-templates', 'college-radio-guide', 'radio-promotion-guide'],
    'universities': ['college-radio-guide', 'stations-accepting-music', 'radio-promotion-guide'],
    'associations': ['radio-promotion-guide', 'radio-faq', 'stations-accepting-music'],
    'default': ['radio-promotion-guide', 'stations-accepting-music', 'pitch-email-templates'],
  };

  const prefs = CATEGORY_PREFS[category] || CATEGORY_PREFS.default;
  const preferred = prefs
    .map(id => assets.find(a => a.id === id))
    .filter(Boolean);
  if (preferred.length > 0) return preferred[0];

  // Fallback: score by content overlap with the page context
  const ctx = (context || '').toLowerCase();
  const scored = assets.map(a => {
    let score = 0;
    const topic = (a.name + ' ' + a.description).toLowerCase();
    if (ctx) {
      for (const word of ctx.split(/\W+/).filter(w => w.length > 4)) {
        if (topic.includes(word)) score += 1;
      }
    }
    if (a.category === 'guide') score += 1; // guides are the safest default pitch
    return { ...a, score };
  });
  scored.sort((a, b) => b.score - a.score);
  return scored[0];
}

// ─── Scoring Engine ──────────────────────────────────────────────────────────

const PENALTIES = {
  'unrelated_directory': -30,
  'link_farm': -50,
  'paid_followed_link': -40,
  'no_editorial_standards': -20,
  'sitewide_exact_match': -30,
  'suspicious_outbound_patterns': -30,
  'abandoned_domain': Infinity, // reject
};

export function scoreProspect(prospect) {
  /* Score a prospect from 0–100 using the system's rubric.
   *
   * Scores are derived from observed signals (domain type, category,
   * description content, page metadata) so the same input always yields
   * the same output. Randomness is limited to a ±1 tie-breaker.
   */

  // ── Component 1: Topical relevance (0–25) ─────────────────────────────
  let relevance = clamp(parseInt(prospect.relevance_score) || 0, 0, 25);
  if (!prospect.relevance_score && (prospect.page_title || prospect.page_description)) {
    // Derive relevance from content when the field is missing
    const text = ((prospect.page_title || '') + ' ' + (prospect.page_description || '')).toLowerCase();
    const terms = ['radio', 'airplay', 'station', 'submission', 'independent artist',
      'musician', 'music promotion', 'music marketing', 'promotion', 'college radio'];
    let hits = 0;
    for (const t of terms) if (text.includes(t)) hits++;
    relevance = clamp(hits * 3, 0, 25);
  }

  // ── Component 2: Editorial legitimacy (0–20) ───────────────────────────
  let editorial = 10; // neutral baseline
  const domain = (prospect.domain || '').toLowerCase();
  if (domain.endsWith('.edu')) editorial += 9;
  else if (domain.endsWith('.gov')) editorial += 8;
  else if (domain.endsWith('.org')) editorial += 4;
  const cat = (prospect.category || '').toLowerCase();
  if (['university', 'association', 'educational'].includes(cat)) editorial += 3;
  if (['blog', 'resource_page'].includes(cat)) editorial += 1;
  editorial = clamp(editorial, 0, 20);

  // ── Component 3: Real audience value (0–15) ────────────────────────────
  const audienceByCat = {
    'university': 13, 'association': 12, 'educational': 12,
    'blog': 10, 'resource_page': 9, 'directory': 9, 'direct_submission': 6,
  };
  let audience = audienceByCat[cat] ?? 7;

  // ── Component 4: Likelihood of acceptance (0–15) ───────────────────────
  // Directories and resource pages with an explicit submission path accept
  // listings more readily than editorial blogs or universities.
  const acceptanceByCat = {
    'directory': 12, 'direct_submission': 12, 'resource_page': 10,
    'educational': 7, 'blog': 5, 'association': 5, 'university': 4,
  };
  let acceptance = acceptanceByCat[cat] ?? 6;

  // ── Component 5: Page quality & maintenance (0–10) ─────────────────────
  let quality = 5;
  const descLen = (prospect.page_description || '').length;
  if (descLen > 100) quality += 2;
  else if (descLen > 40) quality += 1;
  if (prospect.page_title) quality += 1;
  const notes = (prospect.notes || '').toLowerCase();
  if (notes.includes('fetch error') || notes.includes('requires url verification')) quality -= 2;
  quality = clamp(quality, 0, 10);

  // ── Component 6: Traffic / visibility potential (0–10) ─────────────────
  const trafficByCat = {
    'blog': 8, 'university': 7, 'association': 6, 'directory': 5,
    'resource_page': 6, 'educational': 6,
  };
  let traffic = trafficByCat[cat] ?? 4;

  // ── Component 7: Ease of legitimate submission (0–5) ───────────────────
  const easeByCat = {
    'directory': 4, 'direct_submission': 4, 'resource_page': 3,
    'association': 2, 'educational': 2, 'blog': 1, 'university': 1,
  };
  let ease = easeByCat[cat] ?? 2;

  let total = relevance + editorial + audience + acceptance + quality + traffic + ease;
  const penalties = [];

  // ── Penalties from content signals ─────────────────────────────────────
  const desc = ((prospect.page_description || '') + ' ' + (prospect.page_title || '') + ' ' + (prospect.notes || '')).toLowerCase();

  if (/(gambling|casino|poker|pills|pharmacy|viagra|levitra|online pharmacy)/.test(desc)) {
    total += PENALTIES.unrelated_directory; penalties.push('unrelated_directory');
  }
  if (/(link farm|buy backlink|cheap backlink|link exchange|pbn|private blog network)/.test(desc)) {
    total += PENALTIES.link_farm; penalties.push('link_farm');
  }
  if (/(sponsored post|paid link|advertorial|paid placement)/.test(desc)) {
    total += PENALTIES.paid_followed_link; penalties.push('paid_followed_link');
  }
  if (/(no editorial|unmoderated|auto approve|instant approval|no moderation)/.test(desc)) {
    total += PENALTIES.no_editorial_standards; penalties.push('no_editorial_standards');
  }
  if (/(sitewide link|footer link|all pages)/.test(desc)) {
    total += PENALTIES.sitewide_exact_match; penalties.push('sitewide_exact_match');
  }
  if (/(abandoned|expired domain|hacked|parked domain|for sale)/.test(desc)) {
    penalties.push('abandoned_domain'); // reject-level
    return {
      relevance, editorial, audience, acceptance, quality, traffic, ease,
      total: 0, penalties, rejected: true,
    };
  }

  total = clamp(total, 0, 100);

  return {
    relevance, editorial, audience, acceptance, quality, traffic, ease,
    total,
    penalties,
    penalties_applied: penalties.length > 0,
    rejected: false,
  };
}

function clamp(v, min, max) { return Math.max(min, Math.min(max, v)); }

// ─── HTTP Helpers (respectful, rate-limited) ─────────────────────────────────

const requestQueue = [];
let lastRequestTime = 0;
const MIN_DELAY_MS = 1500; // 1.5 seconds between requests

export async function fetchPage(url) {
  const now = Date.now();
  const waitTime = Math.max(0, MIN_DELAY_MS - (now - lastRequestTime));
  if (waitTime > 0) await sleep(waitTime);

  lastRequestTime = Date.now();
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; RadioReachBacklinkBot/1.0; +https://radioreach.us)',
        'Accept': 'text/html,application/xhtml+xml',
      },
      redirect: 'follow',
      signal: AbortSignal.timeout(15000),
    });
    return {
      status: response.status,
      ok: response.ok,
      headers: Object.fromEntries(response.headers),
      text: await response.text(),
      url: response.url,
    };
  } catch (err) {
    return { status: 0, ok: false, headers: {}, text: '', url, error: err.message };
  }
}

export async function checkURL(url) {
  const result = await fetchPage(url);
  return {
    url: result.url,
    status: result.status,
    ok: result.ok,
    broken: result.status >= 400 || result.status === 0,
    error: result.error || null,
  };
}

export function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

// ─── Console Formatting ──────────────────────────────────────────────────────

export function printHeader(text) {
  console.log('\n' + '='.repeat(60));
  console.log(`  ${text}`);
  console.log('='.repeat(60));
}

export function printStats(stats) {
  Object.entries(stats).forEach(([k, v]) => {
    console.log(`  ${k}: ${v}`);
  });
}

// ─── ID Generation ───────────────────────────────────────────────────────────

export function generateId(prefix = 'P') {
  const ts = Date.now().toString(36);
  const rand = Math.random().toString(36).substring(2, 6);
  return `${prefix}-${ts}-${rand}`;
}

// ─── Robots.txt and rate limit helper ────────────────────────────────────────

export function parseRobotsTxt(text) {
  const rules = { disallow: [], allow: [], crawlDelay: 0 };
  const lines = text.split('\n');
  let currentAgent = '*';
  
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith('User-agent:')) {
      currentAgent = trimmed.split(':')[1].trim();
    }
    if (currentAgent === '*' || currentAgent === 'RadioReachBacklinkBot') {
      if (trimmed.startsWith('Disallow:')) {
        rules.disallow.push(trimmed.split(':').slice(1).join(':').trim());
      }
      if (trimmed.startsWith('Allow:')) {
        rules.allow.push(trimmed.split(':').slice(1).join(':').trim());
      }
      if (trimmed.toLowerCase().startsWith('crawl-delay:')) {
        rules.crawlDelay = parseInt(trimmed.split(':')[1].trim()) || 0;
      }
    }
  }
  return rules;
}