# Lead: {Company Name}

> **HOW TO USE:** Copy this file to `docs/leads/{slug}.md`. Replace `{Company Name}` with the real name. Work the stages top to bottom. Mark stage status with a date when you complete it: `✓ 2026-05-30`.

**Slug:** `{slug}`
**Stage:** Identify
**Last action:** {date}

---

## Identify

- **Source:** gp_prospects_narrowed_top200.csv row #__
- **Score:** __ / 110
- **Industry:** __
- **Size:** __ (Micro / Small / Medium / Large)
- **City:** __
- **Why this one:** (1 sentence — what makes them a fit?)
- **Status:** [ ] Identified  →  proceed to Recon

---

## Recon

**Existing web presence:**
- Site: __ (URL or "none")
- Google Business Profile: __ (URL, claimed?, # reviews, last post)
- Facebook: __
- LinkedIn (company): __
- Other socials: __

**Domain availability:**
- `{name}.com`: __ (available / taken — owned by __)
- `{name}.ca`: __
- Cost if purchasing: __

**Contact info (from public sources):**
- Phone: __
- Email: __
- Address: __
- Hours: __

**Services / offerings (1-line each):**
- __
- __

**Identified gaps (elevator pitch material):**
- __
- __
- __

**Owner / decision-maker:**
- Name: __
- Title: __
- LinkedIn: __
- Mutual connection: __ (or "none")

**Warmth:** [ ] Warm intro  [ ] Warm referral  [ ] Cold-warm

**Status:** [ ] Recon complete  →  proceed to Spec

---

## Spec

Create `{slug}/design.md` with the brand brief. Use `bull-oilfield/design.md` as the structural reference.

- **Industry archetype:** __
- **Color palette:** __ (with hex codes)
- **Typography:** __ display + __ body
- **Layout vibe:** __
- **Voice:** __
- **Avoid:** __

**Status:** [ ] Spec written + checked in  →  proceed to Build

---

## Build

- [ ] Create `{slug}/index.html` from SEO template
- [ ] Process logo to transparent if needed
- [ ] Apply `design.md` palette + fonts
- [ ] Verify mobile breakpoints (900px tablet + 560px phone)
- [ ] Fill LocalBusiness JSON-LD (address, hours, geo, areaServed)
- [ ] Add FAQPage schema + matching visible accordion
- [ ] Set brand-colored map marker (no bright red defaults)
- [ ] Add mobile hamburger drawer
- [ ] Build commit message

**Status:** [ ] Build complete  →  proceed to Deploy

---

## Deploy preview

```powershell
.\scripts\new-affiliated-demo.ps1 -Slug {slug} -Subdomain {subdomain} -Name "{Company Name}"
```

Or manual (Bull's commit history is the manual fallback reference).

- [ ] Pages project created: `https://{slug}.pages.dev`
- [ ] Custom domain attached: `{subdomain}.grandeprairie.dev`
- [ ] CNAME created (proxied)
- [ ] HTTPS reachable (verify with curl)
- [ ] Org row added to `db/seed-orgs.sql`
- [ ] Org seeded to remote D1
- [ ] Added to `src/pages/Showcase.tsx` DEMOS array with status: `pitch`

**Status:** [ ] Preview live  →  proceed to Pitch

---

## Pitch

- **Walkthrough date:** __
- **Format:** [ ] In-person  [ ] Phone  [ ] Email link  [ ] Screen share
- **Owner reaction:** __
- **Objections raised:** __
- **Content corrections requested:** __

**Status:** [ ] Pitched  →  proceed to Decision

---

## Decision

[ ] **Yes** → Live-go
[ ] **Refine** → list changes, retry once or twice, max 1 week
[ ] **No** → Kill (note reason)

**Decision date:** __
**Reason / notes:** __

---

## Live-go (if Yes)

- [ ] Form wired (Formsubmit or Pages Function)
- [ ] Canonical URL decided: __
- [ ] If `.com`: domain on Cloudflare, MX configured, forwarding set up
- [ ] Update canonical / OG / JSON-LD URLs
- [ ] Owner signs off on final content
- [ ] Showcase status → "live"
- [ ] 30-day check-in scheduled: __

---

## Kill (if No / abandoned)

- [ ] Pages project deleted
- [ ] CNAME removed
- [ ] Org row deleted from D1
- [ ] Removed from `Showcase.tsx`
- [ ] Folder archived to `archive/{slug}/`
- **Rejection reason (patterns matter):** __

---

## Track (post-yes)

| Check-in | Date | Calls | Form leads | Owner happy? | Notes |
|---|---|---|---|---|---|
| 30-day |  |  |  |  |  |
| 90-day |  |  |  |  |  |
| 6-month |  |  |  |  |  |
