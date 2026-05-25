# GrandePrairie.dev Affiliated Network — Pitch Playbook

> Reusable procedure for converting Peace Region prospects into affiliated landing-page customers on the `grandeprairie.dev` network. Extracted from the **Bull Oilfield Instrumentation** pilot (live at [bulloilfield.grandeprairie.dev](https://bulloilfield.grandeprairie.dev)).

---

## 0. Model in one paragraph

We build a brand-aligned landing page on a memorable `*.grandeprairie.dev` subdomain, deploy it free of charge, and pitch the owner with a **60-day kill switch**: if it isn't bringing calls in two months, we shut it down — no charge, no commitment. Their only obligation during the pilot is verifying the content is accurate. Conversion = either (a) they pay a small monthly to keep it running with email/lead capture, or (b) we set up their own `.com` with our infra behind it.

**Why this works for Peace Region trades:**
- Most have weak web presence (no site, generic Wix, no GBP optimization)
- B2B owner-operators decide alone — no committee, fast cycles
- "Free pilot, kill switch, I built it for [Bull]" is concrete proof, not theory
- We rank in AI search (`llms.txt`, FAQPage schema, LocalBusiness JSON-LD) — they care about the calls, not the mechanism

---

## 1. Pipeline source

| File | Rows | Use |
|---|---|---|
| `gp_prospects_deduplicated.csv` | 2,843 | Full pool (Alberta corporate registry + industry filter) |
| `gp_prospects_narrowed_top200.csv` | 200 | First-pass narrowed by industry × activity score |
| `gp_prospect_database_1.xlsx` | n/a | Source-of-truth with extra columns |
| **`gp_low_digital_presence_leads.csv`** | **43** | **Work this list first** — web-scraped, tiered, with per-row notes on current digital footprint |

The low-digital-presence list adds columns: `tier, web_presence, research_notes, search_query`. Tiers reflect company *value* (size/revenue), not gap size — so cross-reference `web_presence` when picking:

- **No Website + Tier 1/2** = highest conversion likelihood (clear value prop)
- **Has Website + Tier 1** = harder sell (replacement, not greenfield) — defer unless the existing site is genuinely bad
- **Ghost (No Results)** = best-of-both — high tier, zero existing presence

**Picking order within the low-presence list:**
1. `tier == "Tier 1"` AND `web_presence` ∈ {`No Website`, `Ghost`} (the rarest, do these first)
2. `tier == "Tier 2"` AND `web_presence == "No Website"` (the bulk, easiest pitch)
3. Tier 3 (still qualified, still no website, just smaller)

**Composition of the 43:**
- Tier 1 (high value): 12 — but only 2 have no website
- Tier 2 (strong lead): 21 — almost all no-website
- Tier 3 (qualified): 10
- Industries: Oilfield Trucking (16), Construction Trade (12), Welding (6), Concrete (5), other (4)

These files live in `~/Downloads/`. **Do not commit them to the repo** — they're commercial intelligence. The `.gitignore` already covers `docs/leads/data/` and `*.xlsx` if you ever want to organize them inside the repo for local-only access.

---

## 2. The Nine Stages

```
Identify → Recon → Spec → Build → Deploy preview → Pitch → Decision → Live-go / Kill → Track
```

Each prospect has a tracker file at `docs/leads/{slug}.md` (copy from `docs/leads/_template.md`) that walks them through the stages in order. **A prospect is in exactly one stage at a time.**

---

### 2.1 Identify

**Goal:** Pick the next prospect from the 200-list.

**Pick order:** Score descending. Tiebreak by:
1. **Industry adjacent to Bull** (oilfield services, instrumentation, downhole, equipment rental) — leverages the Bull demo as proof
2. **Size: Small or Medium** — owner-operator, no committee
3. **Active 2024** — current operations, recent corporate filings

**Avoid for now:**
- Direct competitors of Bull Oilfield (will be awkward when Bull is live)
- Subsidiaries of national chains (MasTec Purnell, etc.) — they have corporate marketing, won't take your call
- Companies with strong existing web presence (skip if their current site looks good — wasted pitch)

**Output:** A `slug` for the prospect (e.g., `kinetic-energies`, `reed-energy`, `sundown-oilfield`).

---

### 2.2 Recon

**Goal:** Know enough to build a credible spec and pitch.

**Run before contacting anyone:**

- [ ] Google the company name — find their existing site (if any), socials, GBP, reviews
- [ ] Check domain availability: `*.com`, `*.ca`. Note who owns it (registrar WHOIS)
- [ ] Pull phone, address, hours from GBP / Yellow Pages Canada / their site
- [ ] Note services / equipment / specialties (informs `design.md`)
- [ ] Identify gaps:
  - No GBP listing?
  - No real site (Facebook-only)?
  - Site exists but no LocalBusiness schema, weak SEO?
  - Mobile-broken?
- [ ] Find a 1–2 sentence elevator gap: *"They're invisible to anyone searching `oilfield trucking grande prairie` — page 3."*
- [ ] Find the owner / contact:
  - LinkedIn for "Owner" / "President" / "Operations Manager"
  - Alberta corporate registry director name (often public)
  - Mutual contacts on LinkedIn / Facebook
- [ ] Classify the warmth:
  - **Warm intro** — you know them or mutual
  - **Warm referral** — mutual contact, no direct relationship
  - **Cold-warm** — you know the business/industry, not the person

**Output:** `docs/leads/{slug}.md` populated through the Recon section.

---

### 2.3 Spec

**Goal:** Write a brand brief so the build is opinionated, not generic.

**Template:** Copy `bull-oilfield/design.md` as the structure reference. For each prospect:

- Industry archetype (oilfield, trades, food, retail, services)
- Color palette (2–3 colors, hex + RGB)
- Typography pairing (display + body)
- Layout vibe (industrial corporate / handmade local / sterile professional / etc.)
- Voice / tone keywords
- Things to **avoid** (e.g., "no neon", "no glossy gradients")
- Use-case targets (where will this be shared — FB ads / business cards / job site signage?)

**Output:** `{slug}/design.md` checked in before building.

---

### 2.4 Build

**Goal:** Ship a credible v1 landing page in 1–2 hours.

**Use the SEO template baked in.** Every demo gets, by default:
- `<meta>` description / keywords / robots / canonical
- Geo meta: region, placename, position, ICBM
- Open Graph + Twitter Card
- `LocalBusiness` JSON-LD with address, hours, geo, areaServed, hasOfferCatalog, brand, knowsAbout
- `FAQPage` JSON-LD with 5–8 Q&A entries — **mirror the questions in visible content** (Google policy)
- Favicon as inline SVG (brand-colored)
- `mobile-web-app-capable` + `apple-mobile-web-app-capable` metas
- Mobile hamburger drawer (the bull-oilfield pattern)
- Leaflet map with brand-colored marker (not bright red)

**Lessons from Bull (don't repeat):**
- Process logo PNGs to transparent before embedding (flood-fill from edges)
- Don't reference fonts via deprecated CDNs (Geist isn't on jsDelivr anymore — Google Fonts only)
- Mobile breakpoints must include every grid you add (`@media (max-width: 900px)` then a phone `560px` breakpoint)
- Don't claim equipment/services they don't have — verify with recon, then re-verify with the owner before live-go

**Output:** `{slug}/index.html` + `{slug}/logo.png` + `{slug}/design.md`.

---

### 2.5 Deploy preview

**Goal:** Real URL, real SSL, not yet promoted.

**One command** (after `scripts/new-affiliated-demo.ps1` is set up):
```powershell
.\scripts\new-affiliated-demo.ps1 -Slug {slug} -Subdomain {subdomain}
```

What the script does:
1. Creates the Cloudflare Pages project
2. Deploys the folder
3. Attaches the custom domain via API
4. Creates the CNAME via API (requires `CLOUDFLARE_API_TOKEN` env var with `Zone:DNS:Edit` permission)
5. Returns the live URL

**Manual fallback** (if script isn't set up yet): follow the steps in `bull-oilfield/` commit history (`c5d477b` through `213717d`) — those commits document each manual step.

**Output:** Live `https://{subdomain}.grandeprairie.dev` with valid HTTPS within ~5–15 min.

---

### 2.6 Pitch

**Goal:** Walk the owner through proof, then ask the yes/no.

**Walk-through order** (in person or screen share):
1. Open `grandeprairie.dev/showcase` — *"This is the network. These are other businesses I've built for."*
2. Open `grandeprairie.dev/orgs/bull-oilfield` (or another live example) — *"Each affiliated business gets a community profile too."*
3. Open `bulloilfield.grandeprairie.dev` — *"This is the actual site. Mobile, SEO, the works."*
4. Open `{their-subdomain}.grandeprairie.dev` — *"And this is what I built for you. Verify the content is right and we go live."*

**The script (warm intro):**
> "I built this for you. No charge. Hosted on the grandeprairie.dev network so it pulls in community traffic and ranks in AI search. The only thing you need to do is verify the phone, address, hours, photos. If it's not bringing in calls in 60 days, we shut it down — no skin off your nose. If it is, we add booking, online cert lookup, whatever you want."

**The script (cold-warm):**
> "I run grandeprairie.dev — a local platform for Peace Region businesses. I've been building free landing pages for businesses I think have great service but poor web presence. I built one for you as proof — [send link]. 60-day pilot, no charge, you verify the content. Take a look when you have 5 minutes — if you hate it, I delete it, no harm done."

**Common objections + responses:**

| Objection | Response |
|---|---|
| "How much does it really cost?" | "Nothing during the pilot. After 60 days, $X/month to keep it running with lead capture, or you can take it elsewhere — the code is yours." |
| "Why are you doing this for free?" | "Each affiliated site strengthens the platform — more traffic, more authority, more value for the next business. I'm building a network." |
| "I already have a Facebook page." | "Facebook page isn't a website. Google Maps doesn't show your hours from a FB page. Customers searching 'X near me' won't find you. Your site fixes that — and it links to your FB page." |
| "What if my customers don't use the internet?" | "Most calls now start with a search. Your competitors who rank are getting those calls. You don't have to like it — but the 60-day pilot proves it without costing you anything." |
| "Can you build it on my domain?" | "Yes, once we're past the pilot. We start on the network subdomain so I can iterate fast — moving to your domain is a 30-min change later." |

**What to leave with them:**
- A one-page printout: business-card-sized URL, your phone, the kill switch promise in writing
- Confirmation of which content fields need their sign-off (phone, address, hours, services, photos)

---

### 2.7 Decision gate

Three branches:

**Yes** → proceed to **2.8 Live-go**
**Refine** → fixes, iterate, re-pitch in 1 week max
**No** → proceed to **2.10 Kill**

Don't sit in "Refine" forever. Two iterations, then commit to a decision.

---

### 2.8 Live-go (yes branch)

**Goal:** Convert the pilot to a real live operation.

Reference: `memory/project_bull_oilfield_followups.md` has the canonical live-go checklist. Summarized:

- [ ] Wire the quote form (default: Formsubmit.co; upgrade: Cloudflare Pages Function + MailChannels)
- [ ] Decide canonical URL — `{slug}.grandeprairie.dev` (free, on network) or owner's own `.com` (more brandable)
- [ ] If `.com`: add domain to Cloudflare, MX records, email forwarding (Cloudflare Email Routing → owner's inbox), set up redirect both ways
- [ ] Update canonical / OG URL / JSON-LD `url` / `@id` in `{slug}/index.html`
- [ ] Submit to Google Search Console under canonical URL
- [ ] Owner signs off on content one final time
- [ ] Re-promote on `/showcase` with status "Live"
- [ ] Schedule 30-day check-in

---

### 2.9 Track

**Goal:** Keep affiliated sites useful, catch attrition.

**Quarterly per-site checks:**
- Inbound call volume (ask the owner; we don't have call tracking yet)
- Form submissions
- GBP review count (a proxy for site-driven traffic)
- Whether the owner still wants it live

**Network-wide:**
- Update `Showcase.tsx` `DEMOS` array — keep status accurate (`live` / `preview` / `pitch`)
- Update the org row's `description` if their business pivots
- If they go dark for 6 months → kill the subdomain, archive the folder

---

### 2.10 Kill (no branch)

**Goal:** Cleanly remove a no-pilot from the network.

- [ ] `npx wrangler pages project delete {slug} --yes`
- [ ] Remove the CNAME record from Cloudflare
- [ ] Remove from `Showcase.tsx` `DEMOS` array
- [ ] Delete the org row from D1: `DELETE FROM organizations WHERE slug='{slug}';` (also kills it from `/orgs`, `/map`)
- [ ] Archive `{slug}/` folder → `archive/{slug}/` (don't lose the work; it's a template for future pitches)
- [ ] Update lead tracker `docs/leads/{slug}.md` with outcome + reason
- [ ] **Note the rejection reason** — patterns inform future pitch tuning

---

## 3. Tooling

### Per-lead tracker
Copy `docs/leads/_template.md` → `docs/leads/{slug}.md`. Fill in as you progress through stages.

### Scaffold script
`scripts/new-affiliated-demo.ps1` — automates Build + Deploy preview steps. Usage:
```powershell
.\scripts\new-affiliated-demo.ps1 -Slug kinetic-energies -Subdomain kinetic -Name "Kinetic Energies Incorporated"
```
Pre-req: `$env:CLOUDFLARE_API_TOKEN` set (token needs `Pages:Edit` + `Zone:DNS:Edit` on the grandeprairie.dev zone).

### When to graduate to DB-backed kanban
When **5 or more prospects** are active simultaneously across different stages, the markdown-per-lead approach gets clunky. Migrate to a lightweight admin page inside grandeprairie.dev itself:
- New `affiliated_leads` table (slug, name, stage, score, owner_contact, last_action_at, notes)
- Admin-only kanban at `/admin/network`
- Reuse the `business_requests` matching to auto-suggest fits

Don't build this prematurely — the docs + script approach is honest and works for the first 5 leads. The Bull experience proved the workflow; DB is the second-order optimization.

---

## 4. Anti-patterns (things we already learned the hard way)

1. **Don't pitch before the owner content is verified.** Bull demo claimed `30,000 PSI` stock until owner correction — 10K is the real number. Always treat first-draft content as fiction and require owner verification.
2. **Don't wire a real form before owner says yes.** Capturing leads on a site the owner hasn't endorsed is misrepresentation. Hold the form wiring until live-go.
3. **Don't commit the prospect data files to the public repo.** They're commercial intelligence; keep them in `~/Downloads/` or gitignored under `docs/leads/data/`.
4. **Don't skip mobile breakpoints when adding new sections.** Every new grid needs a `@media (max-width: 900px)` rule, and ideally a `560px` phone rule too. (Bull launched with broken mobile twice before this was added to the build template.)
5. **Don't claim 24/7 if it's actually on-call.** Owners hate misrepresentation more than they hate weak copy. "On-call after hours" is honest and still strong.
6. **Don't trust the scrape's `web_presence` column without manual verification.** The first two Tier 1 / "No Website" / "Ghost" picks from `gp_low_digital_presence_leads.csv` (D & D Energy Services, Kinetic Transport) both had real websites + domains on a quick manual Google check. Treat the scrape as a *first-pass filter that needs spot-checking*. Before scaffolding a demo, **always**: (a) Google `"{company name}" Grande Prairie`, (b) check the WHOIS / domain registrar for `{slug}.com` and `{slug}.ca`, (c) only proceed if there's a real gap. Five minutes of verification saves an hour of scaffolding the wrong site and an awkward pitch.

---

## 5. Living document

Update this playbook every time we learn something new from a pitch. The version that matters is the latest one — Bull's lessons (mobile, owner content review, PSI cap, NWAB, on-call) are already in here. The next prospect's lessons should be too.
