# GrandePrairie.dev — Strategic Platform Specification

**Version:** v0.2
**Status:** Draft
**Scope:** Public platform + community operating layer
**Support Layer:** ElystrumCore-powered intelligence fabric (non-public core)

<!-- Full spec content preserved from user input - see conversation context -->
<!-- This file serves as the strategic north star for all development work -->

## Key Additions Over MVP Spec

### Missing Pages (beyond current 5-page MVP)
- Projects (`/projects`, `/projects/:id`)
- Intel Feed (`/intel`)
- Tech Hub (`/tech-hub`)
- Student Corner (`/students`)
- AI Hub (`/ai-hub`)
- Small Business (`/business`)
- Admin (`/admin`)
- About / Build Together (`/about`)

### Missing Features
- Authentication (magic link, GitHub, Google)
- Slack integration (webhooks for new members, ideas, events)
- Idea → Project promotion workflow
- Business request → Project matching
- Organization profiles
- Mentor matching
- Featured partner layer

### Data Model Additions
- Organization entity
- MentorProfile entity
- Location entity (for map layers)
- Tag/Skill as first-class entities (not JSON arrays)
- User → Profile separation (for auth)

### Map Enhancements
- Organization markers
- Project location markers
- Event venue markers
- Innovation asset markers
- Sector/role/category filters
- Multiple layer types

### Launch Phases
1. Public Shell (current) — make ecosystem visible
2. Activity Layer — recurring engagement, intel, events
3. Opportunity Layer — business→builder pipeline, mentor matching
4. Intelligence Layer — ElystrumCore recommendations, matching, summaries
