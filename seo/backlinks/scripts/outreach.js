#!/usr/bin/env node

/**
 * RadioReach Backlink Pipeline — Outreach Draft Generation
 *
 * For every qualified prospect, selects the best linkable asset and
 * generates a unique, personalized outreach message using the appropriate
 * template. Messages are saved to outreach-ready.csv for human review
 * before sending.
 *
 * Usage:
 *   node outreach.js --input qualified.csv --output outreach-ready.csv
 *   node outreach.js --auto-submit   (only where automated submission is permitted)
 */

import { existsSync, readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import {
  readCSV, writeCSV, generateId, printHeader, printStats,
  loadAssets, getBestAssetForCategory,
} from './lib.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const SEO_DIR = join(__dirname, '..');
const TEMPLATES_DIR = join(SEO_DIR, 'templates');

const OUTREACH_HEADERS = [
  'id', 'qualified_id', 'source_url', 'target_url',
  'suggested_anchor', 'asset_name', 'contact_name', 'contact_email',
  'outreach_template', 'outreach_message', 'message_subject',
  'follow_up_1_date', 'follow_up_2_date', 'status', 'created_date',
];

// ─── Template system ─────────────────────────────────────────────────────────

const TEMPLATE_REGISTRY = {
  'directory': {
    template: 'directory-submission.txt',
    subject: 'RadioReach — resource listing for {{category}}',
    category_label: (prospect) => {
      const map = {
        'music_resources': 'music resources',
        'diy_artist_tools': 'artist tools',
        'college_radio': 'college radio',
        'music_business': 'music business',
        'artist_development': 'artist development',
        'music_marketing': 'music marketing',
        'industry_education': 'industry education',
      };
      return map[prospect.subcategory] || 'music promotion resources';
    },
  },
  'resource_page': {
    template: 'resource-page-outreach.txt',
    subject: 'Possible resource for your {{page_topic}}',
  },
  'university': {
    template: 'educational-resource.txt',
    subject: 'Free radio outreach resource for your students',
    audience_type: 'music students',
  },
  'association': {
    template: 'resource-page-outreach.txt',
    subject: 'Resource for your {{audience_type}}',
  },
  'blog': {
    template: 'resource-page-outreach.txt',
    subject: 'Resource idea for your readers',
  },
  'educational': {
    template: 'educational-resource.txt',
    subject: 'Free resource for your {{audience_type}}',
    audience_type: 'readers',
  },
  'direct_submission': {
    template: 'directory-submission.txt',
    subject: 'RadioReach — music promotion resource listing',
  },
  'broken_link': {
    template: 'broken-link-replacement.txt',
    subject: 'Broken link replacement suggestion',
  },
  'default': {
    template: 'resource-page-outreach.txt',
    subject: 'Possible resource for your {{page_topic}}',
  },
};

// ─── Sender identity (edit to the real person sending outreach) ─────────────

const SENDER_NAME = process.env.RADIO_REACH_SENDER || 'the RadioReach team';
const SENDER_EMAIL = process.env.RADIO_REACH_OUTREACH_EMAIL || 'outreach@radioreach.us';

function signoff() {
  // Avoid the awkward "RadioReach / RadioReach" double when the sender
  // identity already contains the brand.
  if (SENDER_NAME.toLowerCase().includes('radioreach')) {
    return `Best,\n${SENDER_NAME}\nhttps://radioreach.us`;
  }
  return `Best,\n${SENDER_NAME}\nRadioReach\nhttps://radioreach.us`;
}

// ─── Message Generation ──────────────────────────────────────────────────────

function pageLabel(prospect) {
  // Prefer the real page title; fall back to a domain-based description so
  // drafts never say the awkward placeholder "page".
  if (prospect.page_title && prospect.page_title.trim()) {
    return `"${shortenTitle(prospect.page_title.trim(), 80)}"`;
  }
  const domain = prospect.domain || '';
  if (domain) {
    const host = domain.replace(/^www\./, '');
    return `the ${host} resource page`;
  }
  if (prospect.subcategory) {
    return `your ${prospect.subcategory.replace(/_/g, ' ')} page`;
  }
  return 'your resource page';
}

function generateOutreachMessage(prospect, asset) {
  if (!asset) return { subject: '', message: '' };
  
  const pageTitle = prospect.page_title || '';
  const pageTopic = shortenTitle(pageTitle || 'resources', 60);
  const category = prospect.category || 'music resources';
  const config = TEMPLATE_REGISTRY[category] || TEMPLATE_REGISTRY.default;
  const label = pageLabel(prospect);
  const categoryLabel = config.category_label
    ? config.category_label(prospect)
    : (category.replace(/_/g, ' ') || 'music resources');
  
  // Build subject
  let subject = config.subject;
  subject = subject.replace('{{page_topic}}', pageTopic);
  subject = subject.replace('{{category}}', categoryLabel);
  subject = subject.replace('{{audience_type}}', config.audience_type || 'independent musicians');
  subject = subject.replace('{{resource_description}}', asset.description || 'Radio station contacts for independent artists');
  
  // Build message body
  const benefit = asset.benefit || 'save time finding radio station contacts';
  const feature = asset.feature || '18,000+ station contacts with verified roles and emails';
  const assetUrl = asset.url || 'https://radioreach.us/resources/';
  const assetName = asset.name || 'RadioReach resources';
  const contactName = prospect.contact_name || 'there';
  
  let message = '';
  if (config.template === 'resource-page-outreach.txt') {
    message = `Hi ${contactName},

I found ${label} while researching resources for independent musicians. The page covers topics relevant to our free ${assetName}, which helps artists ${benefit}.

Resource: ${assetUrl}

It includes ${feature}. No pressure, but I thought it might be useful for the page.

${signoff()}`;
  } else if (config.template === 'directory-submission.txt') {
    message = `Site name: RadioReach
URL: https://radioreach.us
Description: RadioReach helps independent musicians find radio station contacts and conduct direct radio outreach. The directory includes 18,000+ station contacts organized by station, location, and role.

Category: ${categoryLabel}
Contact email: ${SENDER_EMAIL}`;
  } else if (config.template === 'educational-resource.txt') {
    message = `Hi ${contactName},

I work with RadioReach, a resource helping independent musicians conduct radio outreach. I came across ${label} and think our free ${assetName} could be a useful addition for your ${config.audience_type || 'readers'}.

The resource (${assetUrl}) helps artists ${benefit}.

It's entirely free and regularly updated.

${signoff()}`;
  } else if (config.template === 'broken-link-replacement.txt') {
    message = `Hi ${contactName},

I was reading ${label} and noticed the link to ${prospect.broken_url || 'a resource'} appears to be returning an error.

Since that resource appears to be unavailable, I wanted to mention a free alternative that covers similar ground: ${assetName} (${assetUrl}). It includes ${feature}, and your readers might find it useful.

Broken link: ${prospect.broken_url || '(see broken-links.csv)'}
Context: ${prospect.anchor_context || ''}
Suggested replacement: ${assetUrl}

No pressure at all — just thought I'd mention it.

${signoff()}`;
  } else {
    message = `Hi ${contactName},

I came across ${label} and think our free ${assetName} might complement your content. It helps artists ${benefit}.

Resource: ${assetUrl}

It includes ${feature}.

${signoff()}`;
  }
  
  return { subject, message };
}

// ─── Asset Selection ─────────────────────────────────────────────────────────

function selectBestAsset(prospect, assets) {
  const context = [
    prospect.page_title,
    prospect.page_description,
    prospect.subcategory,
    prospect.notes,
  ].join(' ').trim();
  return getBestAssetForCategory(prospect.category, assets, context);
}

// ─── Natural Anchor Text Generation ──────────────────────────────────────────

function generateAnchor(asset, prospect) {
  const naturalAnchors = [
    asset.name,
    `${asset.name} guide`,
    'radio outreach resource',
    'independent artist radio guide',
    'radio station submission resource',
    'RadioReach',
  ];
  
  // Prefer the asset name or a natural variation
  if (prospect.category === 'directory') return asset.name;
  if (prospect.category === 'university') return `${asset.name} for independent artists`;
  
  return naturalAnchors[Math.floor(Math.random() * naturalAnchors.length)];
}

// ─── Main ────────────────────────────────────────────────────────────────────

async function main() {
  printHeader('RadioReach Outreach Draft Generation');
  
  const args = process.argv.slice(2);
  let inputFile = '';
  let outputFile = join(SEO_DIR, 'outreach-ready.csv');
  let autoSubmit = false;
  
  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case '--input':
        inputFile = args[++i];
        break;
      case '--output':
        outputFile = args[++i];
        break;
      case '--auto-submit':
        autoSubmit = true;
        break;
    }
  }
  
  if (!inputFile) {
    console.error('Usage: node outreach.js --input qualified.csv [--output outreach-ready.csv] [--auto-submit]');
    process.exit(1);
  }
  
  if (!existsSync(inputFile)) {
    console.error(`  ✗ Input file not found: ${inputFile}`);
    process.exit(1);
  }
  
  const assets = loadAssets();
  console.log(`  Assets loaded: ${assets.length}`);
  console.log(`  Input: ${inputFile}`);
  console.log(`  Auto-submit mode: ${autoSubmit ? 'ON' : 'OFF (human review required)'}`);
  
  const { rows: prospects } = readCSV(inputFile);
  console.log(`  Qualified prospects: ${prospects.length}`);
  
  const outreachRows = [];
  let skippedNoAsset = 0;
  
  for (const prospect of prospects) {
    const asset = selectBestAsset(prospect, assets);
    if (!asset) {
      skippedNoAsset++;
      continue;
    }
    
    const { subject, message } = generateOutreachMessage(prospect, asset);
    const anchor = generateAnchor(asset, prospect);
    const today = new Date().toISOString().split('T')[0];
    
    // Calculate follow-up dates
    const fu1 = new Date();
    fu1.setDate(fu1.getDate() + 7);
    const fu2 = new Date();
    fu2.setDate(fu2.getDate() + 14);
    
    outreachRows.push({
      id: generateId('O'),
      qualified_id: prospect.id || '',
      source_url: prospect.source_url || '',
      target_url: asset.url,
      suggested_anchor: anchor,
      asset_name: asset.name,
      contact_name: prospect.contact_name || '',
      contact_email: prospect.contact_email || '',
      outreach_template: 'generated',
      outreach_message: message,
      message_subject: subject,
      follow_up_1_date: fu1.toISOString().split('T')[0],
      follow_up_2_date: fu2.toISOString().split('T')[0],
      status: autoSubmit ? 'auto_submitted' : 'ready_for_review',
      created_date: today,
    });
  }
  
  writeCSV(outputFile, OUTREACH_HEADERS, outreachRows);
  
  printStats({
    'Qualified prospects': prospects.length,
    'Outreach drafts created': outreachRows.length,
    'Skipped (no matching asset)': skippedNoAsset,
    'Auto-submitted': autoSubmit ? outreachRows.length : 0,
    'Pending human review': autoSubmit ? 0 : outreachRows.length,
  });
  
  if (outreachRows.length === 0) {
    console.log('\n  ⚠ No outreach drafts created.');
    console.log('  Ensure qualified.csv has prospects and assets/index.json is populated.');
  }
}

function shortenTitle(title, maxLen) {
  if (title.length <= maxLen) return title;
  return title.substring(0, maxLen).replace(/\s+\S*$/, '') + '…';
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});