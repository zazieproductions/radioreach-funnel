-- Frequency Dominion — core schema (D1 / SQLite)
-- Ownership column: user_id. Timestamps: ISO-8601 UTC text.
-- Content tables are re-seeded by 0002_fd_content.sql via upserts; progress,
-- notes, and campaign data live in separate tables and are never touched by
-- content re-seeds.

-- ── Identity ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL,
  email_normalized TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  password_salt TEXT NOT NULL,
  display_name TEXT NOT NULL DEFAULT '',
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('member','admin')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','disabled')),
  failed_login_count INTEGER NOT NULL DEFAULT 0,
  locked_until TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS user_profiles (
  user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  artist_name TEXT NOT NULL DEFAULT '',
  market_city TEXT NOT NULL DEFAULT '',
  market_state TEXT NOT NULL DEFAULT '',
  genres TEXT NOT NULL DEFAULT '[]',
  goals TEXT NOT NULL DEFAULT '[]',
  weekly_hours REAL,
  onboarding_complete INTEGER NOT NULL DEFAULT 0,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS auth_sessions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL UNIQUE,
  csrf_token TEXT NOT NULL,
  ip TEXT NOT NULL DEFAULT '',
  user_agent TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  revoked_at TEXT
);
CREATE INDEX IF NOT EXISTS idx_auth_sessions_user ON auth_sessions(user_id, expires_at);

-- ── Commerce & entitlements ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS stripe_customers (
  id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  stripe_customer_id TEXT UNIQUE,
  email_normalized TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS stripe_payments (
  id TEXT PRIMARY KEY,
  session_id TEXT NOT NULL UNIQUE,
  order_id TEXT,
  user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  email_normalized TEXT NOT NULL DEFAULT '',
  product_keys TEXT NOT NULL DEFAULT '',
  amount_total INTEGER NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'usd',
  payment_status TEXT NOT NULL DEFAULT 'unpaid',
  payment_intent TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_stripe_payments_email ON stripe_payments(email_normalized);
CREATE INDEX IF NOT EXISTS idx_stripe_payments_pi ON stripe_payments(payment_intent);

-- One entitlement row per (normalized email, product). user_id is linked when
-- the buyer creates an account with the same email; admin grants can create
-- the row before a user exists.
CREATE TABLE IF NOT EXISTS entitlements (
  id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  email_normalized TEXT NOT NULL,
  product_key TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending_link'
    CHECK (status IN ('pending_link','active','revoked','refunded','disputed')),
  source TEXT NOT NULL DEFAULT 'stripe' CHECK (source IN ('stripe','claim','admin')),
  stripe_customer_id TEXT,
  stripe_session_id TEXT,
  order_id TEXT,
  granted_at TEXT,
  expires_at TEXT, -- NULL = lifetime
  last_event_id TEXT,
  revoked_at TEXT,
  admin_notes TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  UNIQUE (email_normalized, product_key)
);
CREATE INDEX IF NOT EXISTS idx_entitlements_user ON entitlements(user_id, status);

CREATE TABLE IF NOT EXISTS entitlement_audit (
  id TEXT PRIMARY KEY,
  actor_user_id TEXT,
  actor_email TEXT NOT NULL DEFAULT '',
  action TEXT NOT NULL,
  entitlement_id TEXT,
  target_email TEXT NOT NULL DEFAULT '',
  product_key TEXT NOT NULL DEFAULT '',
  reason TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_ent_audit_time ON entitlement_audit(created_at);

-- Durable idempotency for Stripe webhooks (KV guard stays as a fast path).
CREATE TABLE IF NOT EXISTS webhook_events (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL,
  created_at TEXT NOT NULL
);

-- ── Course content (server-side only; served through gated APIs) ───────
CREATE TABLE IF NOT EXISTS modules (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  promise TEXT NOT NULL DEFAULT '',
  position INTEGER NOT NULL DEFAULT 0,
  published INTEGER NOT NULL DEFAULT 1,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS lessons (
  id TEXT PRIMARY KEY,
  module_id TEXT NOT NULL REFERENCES modules(id) ON DELETE CASCADE,
  code TEXT NOT NULL,
  title TEXT NOT NULL,
  minutes INTEGER NOT NULL DEFAULT 10,
  exercise_minutes INTEGER NOT NULL DEFAULT 0,
  position INTEGER NOT NULL DEFAULT 0,
  published INTEGER NOT NULL DEFAULT 1,
  truth TEXT NOT NULL DEFAULT '',
  masterclass_json TEXT NOT NULL DEFAULT '[]',
  field_protocol_json TEXT NOT NULL DEFAULT '[]',
  warnings_json TEXT NOT NULL DEFAULT '[]',
  decoder_json TEXT NOT NULL DEFAULT '[]',
  worksheets_json TEXT NOT NULL DEFAULT '[]',
  community_json TEXT NOT NULL DEFAULT '[]',
  exercise_json TEXT NOT NULL DEFAULT '{}',
  pass_json TEXT NOT NULL DEFAULT '{}',
  tool_links_json TEXT NOT NULL DEFAULT '[]',
  print_asset TEXT NOT NULL DEFAULT '',
  version INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_lessons_module ON lessons(module_id, position);

-- key/value course assets: decoder, playbooks, tools, task templates,
-- compliance, resources — seeded from the master package, editable by admins.
CREATE TABLE IF NOT EXISTS course_assets (
  key TEXT PRIMARY KEY,
  value_json TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

-- ── Progress, notes ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS lesson_progress (
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  lesson_id TEXT NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'in_progress' CHECK (status IN ('in_progress','complete')),
  started_at TEXT NOT NULL,
  last_activity_at TEXT NOT NULL,
  completed_at TEXT,
  exercise_json TEXT NOT NULL DEFAULT '{}',
  pass_confirmed INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (user_id, lesson_id)
);
CREATE INDEX IF NOT EXISTS idx_progress_user_status ON lesson_progress(user_id, status);

CREATE TABLE IF NOT EXISTS lesson_notes (
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  lesson_id TEXT NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
  body TEXT NOT NULL DEFAULT '',
  updated_at TEXT NOT NULL,
  created_at TEXT NOT NULL,
  PRIMARY KEY (user_id, lesson_id)
);

-- Shared note surface (campaign, station, general) with tags + pins.
CREATE TABLE IF NOT EXISTS notes (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  scope TEXT NOT NULL DEFAULT 'general' CHECK (scope IN ('general','campaign','station')),
  ref_id TEXT NOT NULL DEFAULT '',
  body TEXT NOT NULL DEFAULT '',
  tags TEXT NOT NULL DEFAULT '[]',
  pinned INTEGER NOT NULL DEFAULT 0,
  archived_at TEXT,
  updated_at TEXT NOT NULL,
  created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_notes_user_updated ON notes(user_id, updated_at);
CREATE INDEX IF NOT EXISTS idx_notes_user_ref ON notes(user_id, scope, ref_id);

CREATE TABLE IF NOT EXISTS note_revisions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  note_kind TEXT NOT NULL CHECK (note_kind IN ('lesson','note')),
  note_ref TEXT NOT NULL,
  body TEXT NOT NULL,
  saved_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_revisions_lookup ON note_revisions(user_id, note_kind, note_ref, saved_at);

-- ── Campaigns ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS campaigns (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  artist TEXT NOT NULL DEFAULT '',
  release_title TEXT NOT NULL DEFAULT '',
  track TEXT NOT NULL DEFAULT '',
  genre TEXT NOT NULL DEFAULT '',
  adjacent_genres_json TEXT NOT NULL DEFAULT '[]',
  runtime_sec INTEGER,
  explicit INTEGER NOT NULL DEFAULT 0,
  clean_status TEXT NOT NULL DEFAULT 'unknown' CHECK (clean_status IN ('clean','explicit','unknown')),
  release_date TEXT,
  home_city TEXT NOT NULL DEFAULT '',
  home_state TEXT NOT NULL DEFAULT '',
  connections_json TEXT NOT NULL DEFAULT '[]',
  events_json TEXT NOT NULL DEFAULT '[]',
  goals_json TEXT NOT NULL DEFAULT '[]',
  target_formats_json TEXT NOT NULL DEFAULT '[]',
  proof_json TEXT NOT NULL DEFAULT '[]',
  radio_history TEXT NOT NULL DEFAULT '',
  readiness_json TEXT NOT NULL DEFAULT '{}',
  start_date TEXT,
  weekly_hours REAL,
  status TEXT NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft','preparation','active','complete','archived')),
  objective TEXT NOT NULL DEFAULT '',
  hypothesis TEXT NOT NULL DEFAULT '',
  plan_json TEXT NOT NULL DEFAULT '{}',
  active INTEGER NOT NULL DEFAULT 0,
  cloned_from TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_campaigns_user ON campaigns(user_id, status);

CREATE TABLE IF NOT EXISTS campaign_tasks (
  id TEXT PRIMARY KEY,
  campaign_id TEXT NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  day INTEGER NOT NULL,
  phase TEXT NOT NULL DEFAULT '',
  kind TEXT NOT NULL DEFAULT 'general',
  title TEXT NOT NULL,
  detail TEXT NOT NULL DEFAULT '',
  verification TEXT NOT NULL DEFAULT '',
  depends_on_day INTEGER,
  wave INTEGER,
  touch_no INTEGER,
  target_id TEXT REFERENCES campaign_targets(id) ON DELETE CASCADE,
  scheduled_date TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending','done','skipped','blocked','cancelled')),
  status_note TEXT NOT NULL DEFAULT '',
  cancelled_reason TEXT NOT NULL DEFAULT '',
  completed_at TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_tasks_campaign_date ON campaign_tasks(campaign_id, scheduled_date);
CREATE INDEX IF NOT EXISTS idx_tasks_user_status ON campaign_tasks(user_id, status);

-- ── Stations (proprietary dataset — server-served, paginated, gated) ───
CREATE TABLE IF NOT EXISTS stations (
  id INTEGER PRIMARY KEY,
  callsign TEXT NOT NULL,
  dial TEXT NOT NULL DEFAULT '',
  name TEXT NOT NULL DEFAULT '',
  city TEXT NOT NULL DEFAULT '',
  city_label TEXT NOT NULL DEFAULT '',
  state TEXT NOT NULL DEFAULT '',
  lat REAL NOT NULL DEFAULT 0,
  lon REAL NOT NULL DEFAULT 0,
  coord_basis TEXT NOT NULL DEFAULT 'city',
  ring TEXT NOT NULL DEFAULT '',
  format TEXT NOT NULL DEFAULT '',
  specialty_program TEXT NOT NULL DEFAULT '',
  gatekeeper_role TEXT NOT NULL DEFAULT '',
  gatekeeper_name TEXT NOT NULL DEFAULT '',
  contact_route TEXT NOT NULL DEFAULT '',
  source_url TEXT NOT NULL DEFAULT '',
  verified_at TEXT NOT NULL DEFAULT '',
  data_risk INTEGER NOT NULL DEFAULT 10,
  angle TEXT NOT NULL DEFAULT '',
  import_batch TEXT NOT NULL DEFAULT 'master-package',
  updated_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_stations_state ON stations(state);
CREATE INDEX IF NOT EXISTS idx_stations_format ON stations(format);
CREATE INDEX IF NOT EXISTS idx_stations_callsign ON stations(callsign);

CREATE TABLE IF NOT EXISTS station_contacts (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  station_id INTEGER REFERENCES stations(id) ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT '',
  role TEXT NOT NULL DEFAULT '',
  email TEXT NOT NULL DEFAULT '',
  email_normalized TEXT NOT NULL DEFAULT '',
  source_url TEXT NOT NULL DEFAULT '',
  verified_at TEXT,
  notes TEXT NOT NULL DEFAULT '',
  suppressed INTEGER NOT NULL DEFAULT 0,
  suppression_reason TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_contacts_user_station ON station_contacts(user_id, station_id);

CREATE TABLE IF NOT EXISTS campaign_targets (
  id TEXT PRIMARY KEY,
  campaign_id TEXT NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  station_id INTEGER REFERENCES stations(id) ON DELETE SET NULL,
  name_override TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'queued'
    CHECK (status IN ('queued','verified','sent','replied','review','added','rotation','declined','cold','suppressed')),
  ring TEXT NOT NULL DEFAULT '',
  format_fit INTEGER NOT NULL DEFAULT 0,
  geo_relevance INTEGER NOT NULL DEFAULT 0,
  access INTEGER NOT NULL DEFAULT 0,
  timing INTEGER NOT NULL DEFAULT 0,
  evidence INTEGER NOT NULL DEFAULT 0,
  data_risk INTEGER NOT NULL DEFAULT 0,
  total_score INTEGER NOT NULL DEFAULT 0,
  weights_json TEXT NOT NULL DEFAULT '{}',
  tier TEXT NOT NULL DEFAULT '',
  angle TEXT NOT NULL DEFAULT '',
  verified_at TEXT,
  suppressed INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  UNIQUE (campaign_id, station_id)
);
CREATE INDEX IF NOT EXISTS idx_targets_campaign_score ON campaign_targets(campaign_id, total_score);
CREATE INDEX IF NOT EXISTS idx_targets_user ON campaign_targets(user_id);

CREATE TABLE IF NOT EXISTS outreach_touches (
  id TEXT PRIMARY KEY,
  campaign_id TEXT NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  target_id TEXT NOT NULL REFERENCES campaign_targets(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  wave INTEGER NOT NULL DEFAULT 1,
  touch_no INTEGER NOT NULL DEFAULT 1,
  channel TEXT NOT NULL DEFAULT 'email' CHECK (channel IN ('email','phone','social','in-person','mail')),
  subject TEXT NOT NULL DEFAULT '',
  body TEXT NOT NULL DEFAULT '',
  pitch_version TEXT NOT NULL DEFAULT '',
  sent_at TEXT NOT NULL,
  result TEXT NOT NULL DEFAULT 'pending'
    CHECK (result IN ('pending','delivered','bounce_hard','bounce_soft','replied','replied_wrong_person','declined','optout','instruction','no_reply')),
  result_at TEXT,
  notes TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_touches_campaign ON outreach_touches(campaign_id, sent_at);
CREATE INDEX IF NOT EXISTS idx_touches_target ON outreach_touches(target_id, touch_no);

CREATE TABLE IF NOT EXISTS outcomes (
  id TEXT PRIMARY KEY,
  campaign_id TEXT NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  target_id TEXT REFERENCES campaign_targets(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  kind TEXT NOT NULL DEFAULT 'other'
    CHECK (kind IN ('review','interview','feature','spin','library_add','rotation_add','chart','playlist','other')),
  label TEXT NOT NULL DEFAULT '',
  detail TEXT NOT NULL DEFAULT '',
  verified INTEGER NOT NULL DEFAULT 0,
  evidence_url TEXT NOT NULL DEFAULT '',
  occurred_at TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_outcomes_campaign ON outcomes(campaign_id, kind);

CREATE TABLE IF NOT EXISTS suppressions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  station_id INTEGER REFERENCES stations(id) ON DELETE SET NULL,
  contact_email TEXT NOT NULL DEFAULT '',
  reason TEXT NOT NULL DEFAULT 'optout'
    CHECK (reason IN ('optout','hard_bounce','declined','instruction','dead','do_not_contact')),
  note TEXT NOT NULL DEFAULT '',
  source TEXT NOT NULL DEFAULT 'manual' CHECK (source IN ('touch','manual','import','admin')),
  created_at TEXT NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS uq_suppressions_email ON suppressions(user_id, contact_email) WHERE contact_email != '';
CREATE INDEX IF NOT EXISTS idx_suppressions_station ON suppressions(user_id, station_id);

-- ── Evidence, claims, assets ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS evidence_items (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  campaign_id TEXT REFERENCES campaigns(id) ON DELETE CASCADE,
  lesson_id TEXT,
  station_id INTEGER,
  kind TEXT NOT NULL DEFAULT 'link' CHECK (kind IN ('link','upload','text')),
  title TEXT NOT NULL DEFAULT '',
  url TEXT NOT NULL DEFAULT '',
  object_key TEXT NOT NULL DEFAULT '',
  mime TEXT NOT NULL DEFAULT '',
  size INTEGER NOT NULL DEFAULT 0,
  raw_evidence TEXT NOT NULL DEFAULT '',
  approved_claim TEXT NOT NULL DEFAULT '',
  claim_status TEXT NOT NULL DEFAULT 'raw' CHECK (claim_status IN ('raw','approved','rejected')),
  source TEXT NOT NULL DEFAULT '',
  verified_at TEXT,
  revision INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_evidence_user ON evidence_items(user_id, created_at);

CREATE TABLE IF NOT EXISTS asset_uploads (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  campaign_id TEXT,
  object_key TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  mime TEXT NOT NULL,
  size INTEGER NOT NULL,
  created_at TEXT NOT NULL
);

-- ── Builder drafts (pitch lab, EPK, scripts, audit) ────────────────────
CREATE TABLE IF NOT EXISTS drafts (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  kind TEXT NOT NULL CHECK (kind IN ('pitch','subject','epk','audio','followup','rights','proof','audit')),
  campaign_id TEXT,
  title TEXT NOT NULL DEFAULT '',
  content_json TEXT NOT NULL DEFAULT '{}',
  updated_at TEXT NOT NULL,
  created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_drafts_user_kind ON drafts(user_id, kind, updated_at);

CREATE TABLE IF NOT EXISTS audit_snapshots (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  campaign_id TEXT REFERENCES campaigns(id) ON DELETE CASCADE,
  label TEXT NOT NULL DEFAULT '',
  period_start TEXT,
  period_end TEXT,
  metrics_json TEXT NOT NULL DEFAULT '{}',
  created_at TEXT NOT NULL
);

-- ── Aggregate, privacy-conscious product metrics (no user content) ─────
CREATE TABLE IF NOT EXISTS app_stats (
  key TEXT PRIMARY KEY,
  value INTEGER NOT NULL DEFAULT 0,
  updated_at TEXT NOT NULL
);
