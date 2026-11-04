# Editorial cross-links — how radioreach.us points at Zazie Productions

Two properties, one operator, two different audiences:

| Property | Audience | Promise |
| --- | --- | --- |
| `radioreach.us` | independent artists trying to get music on the radio | plain-English guidance + a directory of radio contacts |
| `horror.zazieproductions.com` | directors and producers looking for a composer | scored cues, credits, and an inquiry path |

They share an operator but **not a promise**. The rules below exist so the link
between them reads as editorial judgement rather than cross-brand advertising —
which is also what makes it worth anything to a search engine.

## The one rule

> A link is allowed when removing it would make the *sentence* worse.

If the sentence still stands without the link, the link is decoration and does
not belong on the page.

## Where links are allowed

| Surface | Treatment |
| --- | --- |
| `/resources/` guide bodies | One contextual, in-sentence link — only where the topic genuinely overlaps (sync/scoring, cue catalogs, instrumental catalogues) |
| Guide footer | One `Elsewhere:` credit line, generated once in `scripts/resources/layout.mjs` |
| Sales page footer (`src/funnel/SalesPage.tsx`) | The same credit line, in the existing low-contrast footer |
| `llms.txt` | An `Elsewhere` entry — machine-readable, honest, no ranking effect |

## Where links are **not** allowed

- **Checkout, upsells, thank-you, success pages, and the sticky CTA.** A
  competitor for attention next to a payment field costs conversions and looks
  like a paid placement.
- **Legal pages** (privacy, terms, refund). They are read for one reason; a
  promotional link there is noise.
- **Above the fold / hero / nav.** The funnel's job is the Vault. The composer
  link is what a curious reader finds, not what a cold visitor is sold.
- **Anywhere as a second link on the same page.** One per page, always.
- **`rel="nofollow"`, `rel="sponsored"`, or UTM parameters.** Nofollow throws
  away the signal; UTMs make the destination look like a campaign landing page
  and create duplicate analytics URLs. Attribution is handled by referrer (see
  below).

## Single source of truth

Every outbound editorial URL lives in **`src/config/sister-sites.json`**:

- renderer: `scripts/resources/shared.mjs` (`SISTER`)
- app: `src/config/sisterSites.ts`
- structured data: the `mentions` field on a page in
  `scripts/resources/content-sync.mjs`

Never hard-code the hostname in a content file or a component. When the
destination changes (a new subdomain, a `/work` path), edit the JSON once and
rerun `npm run build:resources`.

## Anchor text

Vary it, and keep it descriptive of the destination — never "click here" and
never the bare domain pasted into a paragraph:

| Page | Anchor |
| --- | --- |
| sync guide | `Zazie Productions horror and art-house score archive` |
| electronic radio playbook | `Zazie Productions horror score archive` |
| EPK guide | `Zazie Productions horror score archive` |
| footers | `Zazie Productions` |
| `llms.txt` | `Zazie Productions` |

Two identical anchors across two guides is deliberate; a third would start to
look engineered. If you add a mention, write a new one.

## Keeping the two identities distinct

- **Never claim ownership in body copy.** The guides cite the archive as an
  *example of a layout*, not as "our studio". That keeps RadioReach's voice
  independent and avoids turning the guide library into a brand brochure.
- **Never invent a relationship in structured data.** The archive appears as an
  `Article.mentions` → `CreativeWork`, which asserts only "this page references
  that work". There is no `sameAs`, no shared `Organization` node, and no
  `rel="me"` — those are identity assertions, and they are a separate decision
  with different consequences.
- **Never cross-link back the other way without a reason of its own.** A visible
  reciprocal footer link on both sites is the pattern link schemes are built
  from. If the composer site ever links here, it should be because a visitor
  there needs the Vault — not to balance the ledger.
- **Never buy, exchange, or bulk-place links.** One site, hand-written, is a
  credential. A network is a liability.

## Referrer behaviour

`public/_headers` and `index.html` set
`Referrer-Policy: strict-origin-when-cross-origin` (previously `no-referrer`).
Outbound clicks now tell the destination *that* the visit came from
`radioreach.us` — origin only, never the path, query, or fragment. Without this,
referral traffic is invisible in the destination's analytics and the link can
never be evaluated.

If the stricter `no-referrer` policy is ever restored for privacy reasons, the
links still work and still count for search; you simply lose referral
attribution.

## Review checklist — quarterly

1. `npm run build:resources` — the build fails on unknown internal links, thin
   pages, or missing metadata, so regeneration is also a link audit.
2. Count outbound links per page in `public/resources/*/index.html`; anything
   above one contextual link plus the footer line is a defect.
3. Search the generated output for the destination host and confirm the anchor
   text still matches the table above.
4. In Google Search Console, check the destination property's **Links** report:
   the referring pages should read like topical citations, not a sitewide
   template. A sudden jump in referring pages is a warning, not a win.
5. In the destination's analytics, confirm `radioreach.us` referrals convert
   into inquiry-form starts. If nobody clicks, the placement is wrong — not the
   link.
6. Re-read each sentence containing a link. If the sentence survives deletion,
   delete the link.
