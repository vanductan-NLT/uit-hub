# Design Guidelines

UIT Hub follows a **Duolingo-inspired modern design language** combined with UIT's official blue (#2563EB). This guide details the design system, components, and implementation patterns.

## Design Philosophy

- **Gamification**: Spring animations, press effects, and visual feedback encourage engagement
- **Claymorphism**: Multi-layer shadows create depth and tactile feel
- **Accessibility**: High contrast, 10px+ touch targets, dark mode support
- **Simplicity**: Clear hierarchy, minimal decoration, purposeful motion

## Color System

### Primary Colors

| Token | Value | Purpose |
|-------|-------|---------|
| `--blue` | #2563EB | Primary action, brand accent |
| `--blue-d` | #1D4ED8 | Dark variant, press state |
| `--blue-lt` | #EFF4FF | Light background, states |
| `--blue-mid` | #BFCFFE | Midtone variant |
| `--blue-shadow` | #1E40AF | Thick bottom shadow for buttons |

### Accent Colors (Duolingo)

| Token | Value | Use Case |
|-------|-------|----------|
| `--duo-green` | #58CC02 | Success, completion, progress |
| `--duo-green-d` | #46A302 | Dark variant |
| `--duo-green-shadow` | #358A00 | Button press shadow |
| `--duo-yellow` | #FFC800 | Warning, daily streak |
| `--duo-yellow-d` | #E6A800 | Dark variant |
| `--duo-red` | #FF4B4B | Error, alert, urgent |
| `--duo-orange` | #FF9600 | Secondary accent, pending |

All colors have light variants (`-lt`) and dark variants (`-d`) for theming.

### Semantic Aliases

```css
--green: var(--duo-green);        /* Success state */
--amber: var(--duo-yellow);       /* Warning state */
--red: var(--duo-red);            /* Error state */
--purple: #7C3AED;                /* Tertiary accent */
```

### Dark Mode

Dark mode overrides maintain contrast and readability:
- Text: `--ink: #F1F5F9` (light)
- Backgrounds: `--bg: #111827` (dark gray)
- Shadows: Adjusted for dark surfaces (more pronounced opacity)
- Accent colors: Brightened variants for visibility

Apply dark mode via `[data-theme="dark"]` selector.

## Border Radius System

Consistent radius tokens for all components:

| Token | Value | Use |
|-------|-------|-----|
| `--r-sm` | 12px | Small elements, inputs |
| `--r` | 16px | Standard components |
| `--r-lg` | 20px | Cards, buttons |
| `--r-xl` | 24px | Large cards |
| `--r-2xl` | 28px | Extra-large cards, panels |
| `--r-full` | 9999px | Pill buttons, badges |

## Shadow System

### Card Shadows (Claymorphism)

```css
--shadow-card: 0 2px 0 rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.06);
--shadow-card-hover: 0 2px 0 rgba(0,0,0,0.08), 0 8px 24px rgba(37,99,235,0.10);
```

Multi-layer: thick bottom shadow (2px) + soft distant shadow (16px).

### Clay Shadows (Interactive Elements)

```css
--shadow-clay: 0 2px 0 rgba(0,0,0,0.10), 0 6px 20px rgba(0,0,0,0.08), inset 0 1px 0 rgba(255,255,255,0.70);
--shadow-clay-hover: 0 2px 0 rgba(0,0,0,0.14), 0 10px 30px rgba(37,99,235,0.12), inset 0 1px 0 rgba(255,255,255,0.80);
```

Includes inset highlight for 3D tactile effect.

### Button Shadows

```css
--shadow-btn-blue: 0 4px 0 var(--blue-shadow);
--shadow-btn-green: 0 4px 0 var(--duo-green-shadow);
--shadow-btn-yellow: 0 4px 0 var(--duo-yellow-shadow);
```

Thick colored bottom shadow for press effect. On press, squish shadow to 1px.

## Component Patterns

### Button Press Effect

Duolingo-style interaction:
1. Hover: slight filter brightness increase
2. Active: `transform: translateY(3px)` + shadow reduced to `0 1px 0`
3. Transition: 0.08s ease

```css
button {
  transition: transform 0.08s ease, box-shadow 0.08s ease;
}
button:active {
  transform: translateY(3px);
  box-shadow: 0 1px 0 var(--shadow-color);
}
```

### Cards (`.es-card`, `.es-clay-card`)

- No borders
- Border radius: 24-28px
- Background: white (light) or dark overlay (dark mode)
- Shadow: clay shadow for depth
- Hover: lift effect (translateY -2px) + enhanced shadow

### Progress Bars (`.es-prog-fill`)

- Height: 10px
- Transition: 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) — spring easing
- Shine overlay: inset white semi-transparent stripe (::after)
- Colors: blue (default), green (success), amber (warning)

### Badges (`.es-badge`)

- Pill shape with full radius
- Filled variants: solid color + white text
- Light variants: tinted background + darker text
- Font: 11px, weight 700, letter-spacing 0.02em

## Animation System

### Spring Animations

Primary easing: `cubic-bezier(0.34, 1.56, 0.64, 1)`

| Animation | Duration | Use |
|-----------|----------|-----|
| `spring-in` | 0.45s | Component entry, scale + position |
| `duo-bounce-in` | 0.5s | Logo, modal entry |
| `card-enter` | 0.4s | Card appearance |
| `check-pop` | 0.3s | Completion checkmarks |
| `fire-pulse` | 1.5s ∞ | Streak flame animation |

### Stagger Effect

CSS class stagger delays for list item animations:
- `.stagger-1`: 0ms
- `.stagger-2`: 60ms
- `.stagger-3`: 120ms
- `.stagger-4`: 180ms

Apply animation + stagger class for cascading effect.

### Transitions

Smooth theme switching via global:
```css
* { transition: background-color 0.3s ease, border-color 0.3s ease, color 0.2s ease; }
button { transition: transform 0.08s, box-shadow 0.08s, filter 0.08s; }
```

Exempt: progress bars (custom timing), inputs.

## Typography

### Font Family

- **Body/UI**: Plus Jakarta Sans (Google Font)
- **Monospace**: JetBrains Mono (for IDs, metadata)
- **Fallback**: System fonts

### Sizes & Weights

| Element | Size | Weight |
|---------|------|--------|
| Page title | 18px | 800 |
| Section heading | 15px | 700 |
| Body text | 14px | 400–600 |
| Small text | 12px | 600 |
| Label/metadata | 10–11px | 600–700 |

Letter spacing: -0.3 to -1px for headings, 0.01–0.1em for UI.

## Spacing

Use consistent multiples:
- 4px, 8px, 12px, 16px, 20px, 24px, 28px, 32px

Grid layouts: 14–16px gaps.
Card padding: 20–24px.

## Onboarding & Login

### Login Page

Split layout (desktop 900px+):
- **Left panel** (480px): login form + brand
- **Right panel** (flex): feature showcase with animated cards
- **Background**: galactic dark gradient with constellations + animated stairs

Animation:
- Brand logo: bounce-in on mount
- Login form: slide from left (0.55s ease-out)
- Feature cards: fade-in-up with stagger (0.3s–0.54s delays)

### Onboarding Wizard

Three-step flow with dark gradient background:
1. Profile setup (name, student ID, major)
2. Course registration
3. Success screen with confetti

Interactive elements:
- Step dots with spring animation
- Form validation with error states
- Canvas confetti on completion (`canvas-confetti` library)
- Confetti colors: blue, green, yellow, orange, red

## Best Practices

### Do's
- Use spring easing for user feedback
- Keep interactions under 0.3s for responsiveness
- Provide hover/focus states for all interactive elements
- Test colors in both light and dark modes
- Use semantic color tokens (--green, --red) not hardcoded hex

### Don'ts
- Avoid pure black (#000) or white (#FFF) — use design tokens
- Don't animate more than 3 properties simultaneously
- Avoid transitions on opacity for loading states (use skeleton instead)
- Don't override transitions globally on specific elements without reason

## Responsive Behavior

| Breakpoint | Layout Changes |
|------------|----------------|
| ≤900px (login) | Split → stacked (login top, showcase below) |
| ≤768px | Sidebar → drawer, grids → single column |
| ≤480px | Hide topbar subtitle, reduce text sizes |

Ensure touch targets ≥ 44px on mobile.
