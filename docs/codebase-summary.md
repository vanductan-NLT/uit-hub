# Codebase Summary

## Project Overview

**UIT Hub** is a student academic management platform built with Next.js 16 and React 19. It provides GPA forecasting, course tracking, exam scheduling, and learning resource management with a modern Duolingo-inspired UI/UX.

**Tech Stack**: Next.js (App Router), TypeScript, Tailwind CSS 4, Supabase Auth, Class Variance Authority (CVA)

**Version**: Initial release with galactic login redesign and onboarding wizard

## Architecture Overview

```
src/
├── app/                     # Next.js App Router pages
│   ├── login/              # Login & authentication
│   ├── onboarding/         # Multi-step onboarding wizard
│   ├── dashboard/          # Main dashboard view
│   ├── admin/              # Admin panel
│   ├── globals.css         # Design tokens & animations
│   └── layout.tsx          # Root layout with theme provider
├── components/
│   ├── features/           # Feature-specific components
│   │   ├── login/          # Galactic background, feature showcase
│   │   ├── course-tracker/ # Course list, add course modal
│   │   ├── exam/           # Exam scheduling UI
│   │   ├── gpa/            # GPA forecasting & stats
│   │   └── admin/          # Resource & student management
│   └── app-shell.tsx       # Layout wrapper (sidebar + topbar)
├── lib/
│   ├── supabase/           # Authentication & database APIs
│   │   ├── server.ts       # Server-side Supabase client
│   │   ├── client.ts       # Client-side Supabase client
│   │   └── courses-api.ts  # Database queries
│   └── utils/              # Utility functions
└── types/                  # TypeScript definitions
```

## Design System Implementation

### Color Tokens (CSS Custom Properties)

Located in `src/app/globals.css` (lines 40-165):

**Primary (UIT Blue)**:
- `--blue: #2563EB` (main brand)
- `--blue-d: #1D4ED8` (dark variant)
- `--blue-shadow: #1E40AF` (button press effect)

**Duolingo Accents**:
- `--duo-green: #58CC02` (success, completion)
- `--duo-yellow: #FFC800` (warning, streak)
- `--duo-red: #FF4B4B` (error, alert)
- `--duo-orange: #FF9600` (secondary accent)

Each has `-d` (dark) and `-lt` (light) variants.

### Border Radius System

```css
--r: 16px;        /* Standard */
--r-sm: 12px;     /* Small buttons */
--r-lg: 20px;     /* Cards */
--r-xl: 24px;     /* Large cards */
--r-2xl: 28px;    /* Extra-large cards */
--r-full: 9999px; /* Pills & badges */
```

### Shadow System

**Card shadows** (claymorphism):
```css
--shadow-card: 0 2px 0 rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.06);
--shadow-clay: 0 2px 0 rgba(0,0,0,0.10), 0 6px 20px rgba(0,0,0,0.08), inset 0 1px 0 rgba(255,255,255,0.70);
```

**Button press shadows**:
```css
--shadow-btn-blue: 0 4px 0 var(--blue-shadow);
--shadow-btn-green: 0 4px 0 var(--duo-green-shadow);
```

Press effect: translate shadow from 4px → 1px on active state.

### Animation Keyframes

| Name | Duration | Easing | Use |
|------|----------|--------|-----|
| `spring-in` | 0.45s | cubic-bezier(0.34, 1.56, 0.64, 1) | Component entry |
| `duo-bounce-in` | 0.5s | same | Logo/modal bounce |
| `card-enter` | 0.4s | ease-out | Card fade-in |
| `check-pop` | 0.3s | spring | Completion checkmark |
| `fire-pulse` | 1.5s ∞ | ease-in-out | Streak flame |

Stagger delays: `.stagger-1` (0ms), `.stagger-2` (60ms), `.stagger-3` (120ms), `.stagger-4` (180ms)

## Key Features

### 1. Galactic Login Page

**Component**: `src/app/login/login-form.tsx`

Split layout:
- **Left panel** (.es-login-panel, 480px): Google OAuth form
- **Right panel** (.es-showcase, flex): Feature showcase with animated cards

Background layers:
- Constellation SVG (rotating + floating)
- Animated stairs (floating + rotating)
- Radial gradients (blue nebula, purple nebula, teal accent)
- Dark base gradient (130deg, #030712 → #0a0f1e)

Animations:
- Form slides from left (loginPanelIn, 0.55s)
- Feature cards fade-in-up (fadeInUp, 0.5s–0.54s stagger)
- Constellations rotate/float (15s–20s loops)

**Dependencies**: 
- Supabase Auth (Google OAuth)
- No external animation library (CSS-only animations)

### 2. Onboarding Wizard

**Component**: `src/app/onboarding/onboarding-wizard.tsx`

Three-step flow:
1. Profile setup (name, student ID, major, intake year)
2. Course registration via OnboardingCourseAdder
3. Success screen with confetti

Features:
- Dark gradient background (linear-gradient 135deg)
- Step progression dots with spring animation
- Glassmorphism form inputs
- **Canvas confetti on completion** (canvas-confetti v1.9.4)
  - 80 particles, spread 70°
  - Colors: blue, green, yellow, orange, red
  - Origin: y=0.6 (center-lower)

Database sync: `upsertUserProfile()` API call on step 1.

### 3. Dashboard Components

**Course Tracker** (`src/components/features/course-tracker/`):
- Course list with grade badges (A/B/C color-coded)
- Add course modal with validation
- Progress bars with spring easing (0.6s cubic-bezier)

**GPA Forecasting** (`src/components/features/gpa/`):
- Live GPA calculation (weighted average)
- Forecast cards: warning/ok/danger states
- Semantic coloring: green (ok), yellow (warning), red (danger)

**Exam Scheduler** (`src/components/features/exam/`):
- Exam item cards with date column
- Study day chips with states (scheduled/done/today)
- Priority indicators (urgent red, soon yellow)

**Streaks & Tracker** (ES tracker styles):
- Animated streak count + fire emoji pulse
- Daily progress dots with glow effects
- Chapter completion checkmarks with pop animation

### 4. Admin Panel

**Student List** (`src/components/features/admin/student-list.tsx`):
- Paginated table with filters
- Bulk actions (planned)

**Resource Manager** (`src/components/features/admin/resource-manager.tsx`):
- CRUD operations for learning resources
- Filter by category, status

## Code Standards

### TypeScript

- Strict mode enabled
- Interface-based props for components
- Type narrowing for null/undefined checks
- No `any` types (prefer `unknown` + type guards)

### React Patterns

- Functional components with hooks
- Server components for auth checks (`async` page functions)
- Client components for interactive UI (`"use client"` directive)
- useCallback for memoized event handlers
- useState for local state only (no Redux/Zustand)

### Styling

- Tailwind CSS 4 with PostCSS plugin
- CSS classes from design tokens (e.g., `.es-btn-primary`)
- Inline styles for dynamic values only
- BEM-like naming: `.es-{component}-{element}`
- No CSS modules (global + design token approach)

### File Organization

- Components grouped by feature domain
- One component per file (unless tightly coupled)
- Descriptive names: `onboarding-course-adder.tsx`, `feature-showcase.tsx`
- Utility functions in `lib/` with clear purpose

## Database Schema

**Users** (via Supabase Auth):
- id (UUID)
- email (gm.uit.edu.vn)
- full_name
- student_id
- intake_year
- major (CNTT/KTPM/KHMT/MMT&TT/ATTT/Khác)

**Courses**:
- id (UUID)
- user_id (FK)
- code, name, credits, semester
- score, grade
- created_at, updated_at

**Resources** (for admin):
- id (UUID)
- title, description, category
- type (PDF/Link/Video)
- created_by (user_id)

## Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| next | 16.2.6 | Framework |
| react | 19.0.0 | UI library |
| @supabase/supabase-js | 2.49.4 | Backend |
| @supabase/ssr | 0.5.2 | Auth + SSR |
| canvas-confetti | 1.9.4 | Celebration animation |
| class-variance-authority | 0.7.1 | Component variants |
| lucide-react | 1.14.0 | Icons |
| @tailwindcss/postcss | 4.3.0 | Styling |
| tailwind-merge | 3.6.0 | Class merging |

## Development Workflow

### Setup

```bash
npm install
npm run dev  # Starts on http://localhost:3000
```

### Build & Deploy

```bash
npm run build
npm start
```

Vercel deployment via git push to main.

### Testing

Unit tests: Jest (planned)
E2E tests: Playwright (planned)

Currently: manual testing in dev environment.

## Environment Variables

`.env.local` (not in repo):
```
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
```

Auth redirects: `/auth/callback` after OAuth

## Performance Considerations

- Images optimized via Next.js Image component
- Dark mode via CSS custom properties (no JS overhead)
- Spring animations use will-change sparingly
- CSS transitions on transform/opacity (GPU-accelerated)
- No animation on .es-prog-fill during transition (explicit rule)

## Accessibility

- Semantic HTML (button, input, label)
- ARIA labels for icons (google-sign-in SVG)
- Focus states on all interactive elements
- High contrast colors (WCAG AA)
- Keyboard navigation support (planned)
- prefers-reduced-motion respects (animation: none on login)

## Known Limitations & Future Work

1. Tests not yet implemented
2. Mobile responsive styles partially complete (≤768px breakpoints defined)
3. Keyboard navigation incomplete
4. Error boundary not implemented
5. Rate limiting on auth endpoints (Supabase default)
6. No offline-first support
7. Admin panel resource management basic

## Recent Changes (Galactic Redesign)

**Latest commit**: feat(login): redesign login page with galactic theme and interactive components

Changes:
- Complete login UI overhaul with galactic background
- Split layout with feature showcase
- Animated constellations (Big Dipper, Orion, Triangle)
- Floating stairs with rotation + opacity animations
- Onboarding wizard with canvas-confetti
- Dark gradient backgrounds throughout
- All panels updated with spring stagger animations
- Dark mode token updates with matching shadows
- New dependency: canvas-confetti v1.9.4

Design tokens now fully implemented in globals.css (lines 40–166).
