# Project Changelog

All notable changes to UIT Hub are documented here. Format follows [Keep a Changelog](https://keepachangelog.com/).

## [Unreleased]

### Added
- Galactic login page with animated constellations and floating stairs
- Split-layout login design with feature showcase cards
- Onboarding wizard with 3-step flow (profile → courses → success)
- Canvas confetti celebration on onboarding completion
- Dark mode support across all pages
- New color tokens (Duolingo-inspired: green, yellow, red, orange)
- Spring animation system with configurable easing
- Claymorphism shadow system for depth perception
- Button press effect (thick bottom shadow squish on active)
- Progress bar shine overlay with spring easing (10px height)
- Stagger animation helpers for cascading list effects
- Responsive design breakpoints (mobile, tablet, desktop)

### Changed
- **Login UI**: Complete redesign from split light layout to dark galactic space theme
- **Design System**: Migrated to CSS custom properties (not Tailwind only)
  - Border radius tokens now unified (--r, --r-lg, --r-xl, --r-2xl)
  - Shadow system centralized (--shadow-card, --shadow-clay, --shadow-btn-*)
  - Animation keyframes organized in globals.css
- **Animations**: All transitions now use spring easing cubic-bezier(0.34, 1.56, 0.64, 1)
- **Button styles**: New press effect pattern (0.08s transform + shadow reduction)
- **Card styling**: Removed borders, increased radius to 24-28px, added clay shadows
- **Topbar**: Adjusted padding and responsive layout (mobile hamburger menu)
- **Dark mode**: Complete token overrides for contrast and readability

### Removed
- Old split login (light theme) — deprecated in favor of galactic version
- Simple box-shadow patterns — replaced with multi-layer clay system

### Security
- Google OAuth restricted to @gm.uit.edu.vn domain
- Server-side Supabase client for auth checks
- No sensitive data in client components

### Dependencies Added
- `canvas-confetti@^1.9.4` — for celebration particles on onboarding completion

### Performance
- CSS animations use transform/opacity (GPU-accelerated)
- No JavaScript animation library overhead (CSS-first approach)
- Spring easing reduces perceived load time (natural motion)
- Dark mode uses CSS custom properties (zero JS overhead for theme switching)

### Accessibility
- All buttons have focus states
- Color contrast ≥ 4.5:1 (WCAG AA)
- Semantic HTML: button, input, label elements
- ARIA labels on icon-only buttons
- prefers-reduced-motion respected (animations disabled)

### Documentation
- Created design-guidelines.md (design tokens, components, animations)
- Created codebase-summary.md (architecture, features, dependencies)
- Created project-changelog.md (this file)
- Created development-roadmap.md (phases, milestones, progress)

## [0.1.0] - Initial Release

### Features
- Student authentication via Google OAuth
- Course tracker with grade management
- GPA forecasting and weighted average calculation
- Exam scheduler with study day tracking
- Dashboard with statistics and quick actions
- Sidebar navigation with active state indicators
- Responsive layout (desktop-first)
- Learning resource management (admin panel)
- Student list management (admin panel)

### Design
- UIT blue (#2563EB) as primary brand color
- Plus Jakarta Sans typography
- Basic card and button components
- Sidebar (248px width) with dark background
- Topbar with page title and actions

### Tech Stack
- Next.js 16 (App Router)
- React 19
- TypeScript
- Tailwind CSS 4
- Supabase (Auth + Database)
- Class Variance Authority

### Known Issues
- Mobile navigation not fully implemented
- Keyboard navigation incomplete
- No loading skeletons
- Limited error handling
- Tests not implemented

---

## Migration Guide: Old Login → Galactic Login

### For Users
- Navigate to `/login` — no URL changes
- Same Google OAuth flow (redirects to dashboard)
- Dark mode respected from system preference or theme toggle

### For Developers
- Old login classes (`.es-login-screen`, `.es-login-split`) deprecated
- Use `.es-split-login` with `.es-login-panel` (left) + `.es-showcase` (right)
- Galactic background via `<GalacticBackground />` component
- Feature showcase via `<FeatureShowcase />` component

### Breaking Changes
- Login form DOM structure changed (split panel layout)
- New CSS class hierarchy for styling
- Animation timing updated (spring vs linear)

---

## Component Updates Summary

### Login Features
| Component | Old | New |
|-----------|-----|-----|
| Layout | Light split | Dark split (galactic) |
| Background | Solid color | Animated constellation + stairs |
| Form position | Left half | Left quarter (480px) |
| Showcase | None | Right three-quarters with cards |
| Animations | None | Spring bounce-in + stagger |

### Onboarding
| Step | Input | Output |
|------|-------|--------|
| 1 | Name, student ID, major, year | Profile saved to DB |
| 2 | Course list with scores | Courses inserted, GPA calculated |
| 3 | Success | Confetti + redirect to dashboard |

### Dashboard Changes
- All cards: removed borders, increased radius to 24px
- Buttons: new press effect (translateY + shadow reduction)
- Progress bars: 10px height, spring animation on fill
- Stats cards: accent-color bar at bottom
- Panels: stagger animations on mount

---

## Next Steps (Development Roadmap)

Phase 1: Core Features (Complete)
- ✓ Authentication
- ✓ Course tracking
- ✓ GPA forecasting
- ✓ Dashboard UI

Phase 2: Polish & Design (In Progress)
- ✓ Galactic login redesign
- ✓ Onboarding wizard
- ⏳ Mobile-first responsive design
- ⏳ Dark mode refinements
- ⏳ Animation performance testing

Phase 3: Exam Tracking (Planned)
- Exam scheduling
- Study plan generation
- Exam performance analytics

Phase 4: Testing & Performance (Planned)
- Unit tests (Jest)
- E2E tests (Playwright)
- Performance profiling
- Accessibility audit (WCAG AAA)

Phase 5: Advanced Features (Future)
- Collaborative learning
- Course recommendations
- GPA trend analysis
- Export/print transcripts

---

## Release Timeline

| Version | Date | Focus |
|---------|------|-------|
| 0.1.0 | Initial | Core features |
| 0.2.0 (Next) | Design phase | UI/UX polish, dark mode, responsive |
| 0.3.0 | Testing | Unit + E2E tests, bug fixes |
| 1.0.0 | Launch | Public release, performance optimized |

---

## Contributors

- @vanductan-NLT (Lead developer, UI/UX design)
- @Justarandomduddd (Repository setup, initial scaffolding)

---

## Links

- [Design Guidelines](./design-guidelines.md)
- [Codebase Summary](./codebase-summary.md)
- [Development Roadmap](./development-roadmap.md)
