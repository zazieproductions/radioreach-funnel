#!/usr/bin/env node

/**
 * RadioReach Backlink Pipeline — Prospect Discovery
 *
 * Discovers backlink prospects by searching for relevant resource pages,
 * directories, educational resources, and industry listings.
 *
 * Modes:
 *   --keywords       Search for prospects via web search (simulated)
 *   --urls           Direct URLs to evaluate as prospects
 *   --output         Output CSV file (default: prospects.csv)
 *
 * Uses search queries across categories to discover opportunities.
 * Never scrapes private data or evades access restrictions.
 */

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import {
  readCSV, writeCSV, appendCSV, loadAssets,
  fetchPage, checkURL, sleep, generateId,
  printHeader, printStats, parseCSV, toCSV,
} from './lib.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const SEO_DIR = join(__dirname, '..');

const DATA_DIR = SEO_DIR;

const DEFAULT_OUTPUT = join(DATA_DIR, 'prospects.csv');

// ─── Discovery Queries ───────────────────────────────────────────────────────

// These are categorized search queries for finding prospects.
// In production, these would be executed via a search API.
// The agent uses these patterns to identify prospect pages.

const DISCOVERY_QUERIES = {
  directories: [
    'independent artist resources directory',
    'music promotion tools directory',
    'radio promotion resources for artists',
    'music business resources for independent musicians',
    'college radio resources directory',
    'music marketing tools list',
    'indie music resource directory',
    'artist development resources',
  ],
  resource_pages: [
    'independent artist resources',
    'music promotion resources',
    'radio submission resources',
    'college radio resources',
    'tools for musicians',
    'music business links',
    'artist marketing tools',
    'independent musician toolkit',
    'radio airplay guide',
  ],
  university: [
    'music business program resources',
    'artist development course materials',
    'campus radio station resources',
    'student musician resources university',
    'music entrepreneurship center',
    'music marketing syllabus',
    'university library music industry guide',
  ],
  associations: [
    'independent artist organization',
    'musician association resources',
    'college radio organization',
    'regional arts grant organization',
    'songwriter association',
    'music entrepreneurship network',
  ],
  broken_link_opportunities: [
    'radio station directory dead link',
    'defunct music promotion tool',
    'removed artist resource page',
    'outdated radio submission guide',
    'broken music industry spreadsheet',
  ],
};

// ─── Known industry directories (curated, vetted) ───────────────────────────

const KNOWN_DIRECTORIES = [
  // Music industry directories
  { url: 'https://www.indieonemusic.com/resources/', category: 'directory', sub: 'music_resources', notes: 'Indie music resources' },
  { url: 'https://diymusician.cdbaby.com/resources/', category: 'directory', sub: 'diy_artist_tools', notes: 'CD Baby DIY resources' },
  { url: 'https://www.berklee.edu/careers/resources/', category: 'university', sub: 'career_resources', notes: 'Berklee career resources' },
  { url: 'https://www.futureofmusic.org/resources/', category: 'association', sub: 'industry_research', notes: 'Future of Music resources' },
  { url: 'https://www.grammy.com/recording-academy/resources/', category: 'association', sub: 'industry_education', notes: 'Recording Academy resources' },
  { url: 'https://www.naccchart.com/resources/', category: 'association', sub: 'college_radio', notes: 'NACC college radio resources' },
  { url: 'https://www.ratiolab.com/blog/', category: 'educational', sub: 'music_marketing', notes: 'Music marketing blog' },
  { url: 'https://www.aria2.com/', category: 'directory', sub: 'college_radio', notes: 'College radio directory' },
  { url: 'https://www.hypebot.com/', category: 'blog', sub: 'music_industry', notes: 'Music tech blog' },
  { url: 'https://www.artistshousemusic.org/', category: 'educational', sub: 'artist_development', notes: 'Artist development resources' },
  { url: 'https://www.sonicbids.com/blog/', category: 'blog', sub: 'music_promotion', notes: 'Music promotion blog' },
  { url: 'https://www.musicbizacademy.com/', category: 'educational', sub: 'music_business', notes: 'Music business education' },
  { url: 'https://www.indieconnect.com/', category: 'association', sub: 'artist_network', notes: 'Independent artist network' },
  { url: 'https://www.musformation.com/', category: 'blog', sub: 'music_marketing', notes: 'Music marketing advice' },
  { url: 'https://www.recordingconnection.com/resources/', category: 'educational', sub: 'recording_resources', notes: 'Recording resources' },
  { url: 'https://www.bandzoogle.com/blog/', category: 'blog', sub: 'artist_tools', notes: 'Band website resources' },
];

// ─── Resource page patterns ──────────────────────────────────────────────────

const RESOURCE_PAGE_INDICATORS = [
  'helpful links',
  'recommended resources',
  'useful tools',
  'additional resources',
  'artist toolkit',
  'music industry resources',
  'resources for artists',
  'helpful resources',
  'external links',
  'links we love',
  'favorite tools',
  'curated resources',
];

const EXCLUSION_PATTERNS = [
  'gambling', 'casino', 'pills', 'pharmacy', 'online pharmacy',
  'cryptocurrency', 'binary options', 'forex', 'adult content',
  'buy backlinks', 'cheap backlinks', 'link exchange',
  'payday loans', 'viagra', 'levitra',
];

// ─── Main Discovery Engine ───────────────────────────────────────────────────

// ─── Demo data (network-independent mode) ───────────────────────────────────

const DEMO_PROSPECTS = [
  { url: 'https://diymusician.cdbaby.com/resources/', title: 'DIY Musician Resources for Independent Artists', desc: 'Practical resources and guides for independent musicians, including promotion, distribution, and radio outreach.', cat: 'directory', sub: 'diy_artist_tools', rel: 24 },
  { url: 'https://www.futureofmusic.org/resources/', title: 'Future of Music Coalition — Resources & Research', desc: 'Research, guides, and resources for musicians on fair pay, radio, and the music industry.', cat: 'association', sub: 'industry_research', rel: 20 },
  { url: 'https://www.berklee.edu/careers/resources/', title: 'Berklee Career Resources for Music Students', desc: 'Career development resources for music students: internships, portfolios, promotion, and industry guides.', cat: 'university', sub: 'career_resources', rel: 18 },
  { url: 'https://www.hypebot.com/', title: 'Hypebot — Music Industry News & Tools', desc: 'Daily music industry news, music tech coverage, and promotion tools for artists and managers.', cat: 'blog', sub: 'music_industry', rel: 16 },
  { url: 'https://www.sonicbids.com/blog/', title: 'Sonicbids Blog — Music Promotion Advice', desc: 'Gigging, promotion, press kits, and radio advice for independent artists and bands.', cat: 'blog', sub: 'music_promotion', rel: 20 },
  { url: 'https://www.indieconnect.com/', title: 'Indie Connect — Independent Artist Network', desc: 'A community and resource hub for independent musicians: education, networking, and industry access.', cat: 'association', sub: 'artist_network', rel: 18 },
  { url: 'https://www.musformation.com/', title: 'Musformation — Music Marketing & Radio', desc: 'Music marketing and radio promotion strategy guides for independent artists and labels.', cat: 'blog', sub: 'music_marketing', rel: 22 },
  { url: 'https://www.artistdevelopment.com/resources/', title: 'Artist Development Resources', desc: 'Career guidance and promotion resources for developing artists, including radio strategy.', cat: 'educational', sub: 'artist_development', rel: 17 },
  { url: 'https://www.collegeradio.org/resources/', title: 'College Radio Resources', desc: 'Resources for campus radio stations, student programmers, and independent music submission.', cat: 'association', sub: 'college_radio', rel: 25 },
  { url: 'https://www.musicbizacademy.com/', title: 'Music Business Academy — Courses & Guides', desc: 'Music business education: promotion, licensing, radio, and artist entrepreneurship courses.', cat: 'educational', sub: 'music_business', rel: 16 },
  { url: 'https://www.radioindustryresources.com/links/', title: 'Radio Industry Resources — Helpful Links', desc: 'Curated links to radio industry organizations, directories, and artist submission resources.', cat: 'resource_page', sub: 'radio_links', rel: 23 },
  { url: 'https://www.indiepromo.com/artist-tools/', title: 'Indie Promo — Artist Tools & Guides', desc: 'Free tools and guides for independent artists: radio submission, EPKs, and promotion planning.', cat: 'resource_page', sub: 'artist_tools', rel: 21 },
];

function demoProspects() {
  const today = new Date().toISOString().split('T')[0];
  return DEMO_PROSPECTS.map(d => ({
    id: generateId('P'),
    source_url: d.url,
    page_title: d.title,
    page_description: d.desc,
    category: d.cat,
    subcategory: d.sub,
    domain: new URL(d.url).hostname,
    contact_name: '',
    contact_email: '',
    contact_role: '',
    relevance_score: String(d.rel),
    discovery_date: today,
    status: 'discovered',
    notes: 'Demo prospect (network-independent mode). Replace with live discovery output for real runs.',
  }));
}

async function discoverProspects(options) {
  printHeader('RadioReach Prospect Discovery');
  
  const outputFile = options.output || DEFAULT_OUTPUT;
  const keywords = options.keywords || 'independent music radio resources';
  const urls = options.urls || [];
  const demo = options.demo || false;
  
  console.log(`  Keywords: ${keywords}`);
  console.log(`  Output:   ${outputFile}`);
  console.log(`  Mode:     ${demo ? 'DEMO (no network)' : 'LIVE'}`);
  
  const allProspects = [];
  let seenUrls = new Set();
  
  if (demo) {
    console.log('\n🧪 Demo mode: generating realistic sample prospects...');
    for (const p of demoProspects()) {
      allProspects.push(p);
      process.stdout.write('.');
    }
    console.log('');
  } else {
    // Phase 1: Evaluate known directories
    console.log('\n📁 Phase 1: Evaluating known directories...');
    for (const dir of KNOWN_DIRECTORIES) {
      if (seenUrls.has(dir.url)) continue;
      seenUrls.add(dir.url);
      
      const prospect = {
        id: generateId('P'),
        source_url: dir.url,
        page_title: '',
        page_description: '',
        category: dir.category,
        subcategory: dir.sub,
        domain: new URL(dir.url).hostname,
        contact_name: '',
        contact_email: '',
        contact_role: '',
        relevance_score: '18',
        discovery_date: new Date().toISOString().split('T')[0],
        status: 'discovered',
        notes: dir.notes || '',
      };
      
      // Try to fetch and extract meta info
      try {
        const result = await fetchPage(dir.url);
        if (result.ok) {
          const titleMatch = result.text.match(/<title[^>]*>([^<]+)<\/title>/i);
          if (titleMatch) prospect.page_title = titleMatch[1].trim();
          const descMatch = result.text.match(/<meta\s+name="description"\s+content="([^"]+)"/i);
          if (descMatch) prospect.page_description = descMatch[1].trim();
          prospect.relevance_score = assessRelevance(prospect);
        }
      } catch (e) {
        prospect.notes += ` Fetch error: ${e.message}`;
      }
      
      allProspects.push(prospect);
      process.stdout.write('.');
      await sleep(200);
    }
    
    // Phase 2: Resource page pattern search (simulated via known patterns)
    console.log('\n📄 Phase 2: Identifying resource pages from search patterns...');
    const searchGroup = keywords.split(',').map(k => k.trim());
    
    for (const kw of searchGroup) {
      // In production, this would use a search API.
      // Here we add a placeholder record for each keyword pattern.
      const prospect = {
        id: generateId('P'),
        source_url: '',
        page_title: `Search result: ${kw}`,
        page_description: `Potential resource page for topic: ${kw}`,
        category: 'resource_page',
        subcategory: 'search_pattern',
        domain: '',
        contact_name: '',
        contact_email: '',
        contact_role: '',
        relevance_score: '15',
        discovery_date: new Date().toISOString().split('T')[0],
        status: 'discovered',
        notes: `Discovered via search pattern: "${kw}". Requires URL verification.`,
      };
      allProspects.push(prospect);
    }
    
    // Phase 3: Check for resource-page indicators on known domains
    console.log('\n🔎 Phase 3: Scanning for resource-page patterns...');
    // (In production, this would crawl known music-industry domains
    // looking for pages containing resource-page indicator phrases)
    
    // Phase 4: URL-based direct evaluation
    console.log('\n🔗 Phase 4: Evaluating direct URLs...');
    for (const url of urls) {
      if (seenUrls.has(url)) continue;
      seenUrls.add(url);
      
      try {
        const result = await fetchPage(url);
        const prospect = {
          id: generateId('P'),
          source_url: url,
          page_title: '',
          page_description: '',
          category: 'direct_submission',
          subcategory: 'user_provided',
          domain: new URL(url).hostname,
          contact_name: '',
          contact_email: '',
          contact_role: '',
          relevance_score: '10',
          discovery_date: new Date().toISOString().split('T')[0],
          status: 'discovered',
          notes: 'User-submitted URL for evaluation.',
        };
        
        if (result.ok) {
          const titleMatch = result.text.match(/<title[^>]*>([^<]+)<\/title>/i);
          if (titleMatch) prospect.page_title = titleMatch[1].trim();
          const descMatch = result.text.match(/<meta\s+name="description"\s+content="([^"]+)"/i);
          if (descMatch) prospect.page_description = descMatch[1].trim();
          prospect.relevance_score = assessRelevance(prospect);
        }
        allProspects.push(prospect);
        process.stdout.write('.');
        await sleep(300);
      } catch (e) {
        console.error(`\n  ✗ Error fetching ${url}: ${e.message}`);
      }
    }
  }
  
  // Write output
  const headers = [
    'id', 'source_url', 'page_title', 'page_description',
    'category', 'subcategory', 'domain', 'contact_name',
    'contact_email', 'contact_role', 'relevance_score',
    'discovery_date', 'status', 'notes',
  ];
  writeCSV(outputFile, headers, allProspects);
  
  // Stats
  printStats({
    'Total prospects discovered': allProspects.length,
    'Directories evaluated': demo ? '—' : KNOWN_DIRECTORIES.length,
    'Search patterns': demo ? '—' : keywords.split(',').length,
    'Direct URLs evaluated': demo ? '—' : urls.length,
  });
  
  return allProspects;
}

// ─── Relevance Assessment ────────────────────────────────────────────────────

function assessRelevance(prospect) {
  const text = (
    (prospect.page_title || '') + ' ' +
    (prospect.page_description || '') + ' ' +
    (prospect.notes || '')
  ).toLowerCase();
  
  // Strong signals (core radio-promotion topics)
  const strongTerms = [
    'radio promotion', 'college radio', 'radio station', 'radio submission',
    'radio airplay', 'music submission', 'radio outreach', 'radio industry',
    'independent artist', 'independent musician',
  ];
  // Medium signals (promotion/music-industry topics)
  const mediumTerms = [
    'radio', 'airplay', 'airplay', 'station', 'submission', 'promotion',
    'music promotion', 'music marketing', 'artist development',
    'musician resource', 'artist resource', 'broadcast', 'programming',
    'dj', 'playlist', 'chart', 'music industry', 'diy music',
  ];
  // Weak signals (adjacent context)
  const weakTerms = [
    'music', 'artist', 'musician', 'band', 'label', 'marketing',
    'publicity', 'industry', 'resources', 'guide', 'tool',
  ];
  
  let score = 0;
  for (const term of strongTerms) {
    if (text.includes(term)) score += 4;
  }
  for (const term of mediumTerms) {
    if (text.includes(term)) score += 2;
  }
  for (const term of weakTerms) {
    if (text.includes(term)) score += 1;
  }
  
  // Category context boosts (a music directory is inherently more relevant
  // than a generic blog)
  const cat = (prospect.category || '').toLowerCase();
  if (['directory', 'university', 'educational', 'association'].includes(cat)) score += 3;
  if (['resource_page', 'blog'].includes(cat) && text.includes('music')) score += 2;
  
  // Penalties for exclusion patterns
  for (const pat of EXCLUSION_PATTERNS) {
    if (text.includes(pat)) score -= 10;
  }
  
  return String(Math.max(0, Math.min(25, score)));
}

// ─── CLI Entry Point ─────────────────────────────────────────────────────────

async function main() {
  const args = process.argv.slice(2);
  const options = {};
  
  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case '--keywords':
        options.keywords = args[++i];
        break;
      case '--output':
        options.output = args[++i];
        break;
      case '--urls':
        options.urls = args[++i].split(',').map(u => u.trim());
        break;
      case '--demo':
        options.demo = true;
        break;
      default:
        // Skip unknown
        break;
    }
  }
  
  await discoverProspects(options);
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});