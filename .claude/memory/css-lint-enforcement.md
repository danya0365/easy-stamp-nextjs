---
name: css-lint-enforcement
description: CSS theme-token rules are now enforced by ESLint + stylelint (no hardcoded colors)
metadata: 
  node_type: memory
  type: project
  originSessionId: 67955480-3ace-4361-beb6-449c7329deb7
---

The semantic-theme CSS rules ([[project-easy-stamp]] uses the `nextjs-semantic-theme` skill) are now **automatically enforced** (previously doc-only):

- **ESLint** (`eslint.config.mjs`): `no-restricted-syntax` rules (scoped `**/*.{ts,tsx}`) ban hardcoded colors in className — arbitrary values `bg-[#...]`/`text-[rgb(...)]`/`[hsl(...)]` AND raw neutral palettes (`gray|slate|zinc|neutral|stone`). Matches both `Literal` and `TemplateElement` (cn template strings). black/white and accent palettes (amber/green/red for stars/status) are intentionally NOT banned. `npm run lint`.
- **stylelint** (`stylelint.config.mjs`, installed as devDep, v17): `color-no-hex` + `color-named: never` on `public/styles/index.css` + `theme.css` (token-map/entry layers must be `var()`-only); `public/styles/themes/**` overridden to allow hex (real palette source). Minimal config, no shared base → Tailwind v4 at-rules (`@theme`, `@import "tailwindcss"`, `@custom-variant`, `@layer`) aren't flagged. `npm run lint:css`.
- Combined: `npm run lint:all`. Documented in `AGENTS.md` (CSS/Theming section).

**Justified exceptions** use `// eslint-disable-next-line no-restricted-syntax -- <reason>` (e.g. LINE brand `#06C755` in OnboardingSuggestions.tsx + ConnectionsSection.tsx).

Fixes made while enabling: LeadMapView popup `text-gray-*`→`text-foreground/text-muted`; Modal scrim `bg-slate-900/40`→`bg-black/40`. Note `next build` runs ESLint but NOT stylelint — run `lint:css`/`lint:all` in CI separately if needed.
