# GrandePrairie.dev Design System

Reviewed source: `C:\Users\cjell\Downloads\GrandePrairie.dev Design System.zip` on 2026-07-08.

## Incorporated Surfaces

- `src/styles/globals.css` contains the platform color, type, layout, radius, elevation, glow, glass, and scoped agency tokens.
- `tailwind.config.ts` exposes the brand palette, semantic shadcn tokens, font CSS variables, radius variables, and `shadow-gp-*` elevation aliases.
- `public/images/` already contains the design-system photography assets from the bundle.
- `public/images/logo-swan.png` contains the bundle's primary swan logo asset for future marketing/deck use.
- `public/scripts/neural-net.js` provides the `<neural-net>` ambient overlay from the bundle.
- `src/components/AuroraHero.tsx` uses the hero photography, `gp-glow`, `<neural-net>`, and the `spruce` CTA button variant.
- `src/pages/Agency.tsx` is scoped with `.gp-agency` so the Build / Run / Show marketing language does not leak into the platform shell.

## Platform Direction

The community platform is dark-mode-first, compact, and utility-oriented. Keep the fixed sidebar, dense 14px body text, 210px navigation width, 56rem content column, 6px radius anchor, 16px card padding, 1px borders, and restrained elevation.

Use the land-based palette: Boreal Spruce, Prairie Amber, Aurora Teal, River Slate, Midnight Prairie, Deep Frost, Twilight, Fresh Snow, and Hoarfrost. Avoid blue as a dominant brand color. `clear-sky` is only a soft informational accent.

Use Geist for display/headings, Inter for body, and JetBrains Mono for coordinates, labels, code, and small data readouts. Keep uppercase micro-labels compact and readable.

Cards should stay quiet: border, `shadow-gp-1`, subtle hover border changes, and a 2px Aurora Teal rail only for genuinely featured items. Use `gp-glow` and `<neural-net>` surgically for hero/auth/header moments, not as page-wide decoration.

## Agency Direction

The agency route is a separate visual language for Build / Run / Show services. Keep it under `.gp-agency`, with near-black canvas, bronze-gold accent, Instrument Serif display, DM Sans body, IBM Plex Mono labels, sharper 3px corners, film-grain texture, and measured scroll reveals.

## Asset Notes

The swan logo from the bundle ships on a white background. Do not place `public/images/logo-swan.png` on dark surfaces until it has been knocked out or replaced with a transparent-background export. Continue using the existing diamond app mark for favicon/sidebar contexts.
