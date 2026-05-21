# UIT Hub Documentation

Welcome to the UIT Hub documentation. This is the central hub for understanding the project architecture, design system, and development roadmap.

## Quick Navigation

### For Designers & Product Managers
- **[Design Guidelines](./design-guidelines.md)** — Color tokens, component patterns, animations, spacing system
- **[Project Changelog](./project-changelog.md)** — What changed in the latest release (Galactic UI redesign)

### For Developers
- **[Codebase Summary](./codebase-summary.md)** — Architecture overview, file structure, key features, implementation patterns
- **[Development Roadmap](./development-roadmap.md)** — Project phases, milestones, timelines, risk assessment

---

## Project at a Glance

**UIT Hub** is a student academic management platform with modern Duolingo-inspired UI.

| Aspect | Details |
|--------|---------|
| **Tech Stack** | Next.js 16, React 19, TypeScript, Tailwind CSS 4, Supabase |
| **Design Language** | Duolingo-style + UIT blue (#2563EB) |
| **Latest Feature** | Galactic login redesign with animated constellations & onboarding wizard |
| **Team** | @vanductan-NLT (lead), @Justarandomduddd (contributor) |
| **Status** | Phase 2: Design Polish (50% complete) |

---

## Documentation Structure

```
docs/
├── index.md                    # This file
├── design-guidelines.md        # Design system, tokens, components
├── codebase-summary.md         # Architecture, features, code standards
├── project-changelog.md        # Version history, breaking changes
└── development-roadmap.md      # Phases, milestones, timelines
```

### By Use Case

**"I'm adding a new button"**
→ Read [Design Guidelines](./design-guidelines.md#component-patterns) for button press effect pattern

**"I need to understand the app structure"**
→ Read [Codebase Summary](./codebase-summary.md#architecture-overview) for folder organization

**"What's new in this release?"**
→ Read [Project Changelog](./project-changelog.md) for latest changes

**"When will feature X be done?"**
→ Read [Development Roadmap](./development-roadmap.md) for phase timelines

**"How do I implement dark mode?"**
→ Read [Design Guidelines](./design-guidelines.md#dark-mode) for theme system

---

## Key Concepts

### Design System
- **Color Tokens**: CSS custom properties (--blue, --duo-green, etc.)
- **Spacing**: Consistent multiples (4px, 8px, 12px, 16px, 20px, etc.)
- **Shadow System**: Claymorphism with multi-layer shadows
- **Animations**: Spring easing (cubic-bezier 0.34, 1.56, 0.64, 1)
- **Typography**: Plus Jakarta Sans (body), JetBrains Mono (code)

### Development Workflow
1. **Phase 1** (✓ Complete): Core features (auth, courses, GPA)
2. **Phase 2** (🔄 In Progress): Design polish (responsive, dark mode, animations)
3. **Phase 3** (📋 Planned): Exam tracking
4. **Phase 4** (📋 Planned): Testing & quality
5. **Phase 5** (💡 Future): Advanced features

---

## Recent Changes (Latest Release)

The most recent update completed a major **UI/UX overhaul** with a Duolingo-inspired Galactic theme.

### What Changed
- ✓ Complete login page redesign (galactic background with constellations)
- ✓ Split-panel layout with feature showcase
- ✓ Onboarding wizard (3-step profile + course setup)
- ✓ Canvas confetti celebration on completion
- ✓ Unified design system with CSS tokens
- ✓ Spring animation system across all UI
- ✓ Dark mode support throughout

### For Existing Developers
- Old login classes (`.es-login-screen`) are deprecated
- Use new `.es-split-login` layout
- Check [Project Changelog](./project-changelog.md#migration-guide-old-login--galactic-login) for migration guide

### New Dependency
- `canvas-confetti@^1.9.4` — for celebration particles

---

## Common Questions

**Q: How do I add a new color to the design system?**  
A: Add CSS custom property to `src/app/globals.css` (root section), include dark mode override, then reference via `var(--color-name)` in styles. See [Design Guidelines → Color System](./design-guidelines.md#color-system).

**Q: What's the button press animation?**  
A: Duolingo-style effect: translateY(3px) on active + shadow reduced to 1px. Transition time: 0.08s. Details in [Design Guidelines → Button Press Effect](./design-guidelines.md#button-press-effect).

**Q: When will mobile be fully supported?**  
A: Phase 2 target date is end of May 2026. Currently 40% complete. See [Development Roadmap → Phase 2](./development-roadmap.md#phase-2-design-polish--ux-50---in-progress).

**Q: How do I test the dark mode?**  
A: Set `data-theme="dark"` on document root or use theme toggle (if implemented). CSS custom properties auto-override via `[data-theme="dark"]` selector.

**Q: Where are the design tokens?**  
A: All tokens defined in `src/app/globals.css` lines 40–166. Organized by: colors, radius, shadows, animations.

**Q: How do I implement a new component?**  
A: Follow patterns in [Codebase Summary → Code Standards](./codebase-summary.md#code-standards). Use `.es-*` class naming (BEM-like), reference design tokens, add dark mode support.

---

## Getting Started

### Setup
```bash
npm install
npm run dev  # http://localhost:3000
```

### Development Tips
1. **Check design tokens first** before hardcoding colors
2. **Use spring animations** for user feedback (not linear)
3. **Test dark mode** on every component
4. **Mobile-first mindset** even though desktop is primary now
5. **Document breaking changes** in changelog

### Code Standards
- TypeScript strict mode enabled
- Functional components + hooks
- Server components for auth (`async` page functions)
- Client components for interactivity (`"use client"` directive)
- CSS classes from design tokens only

---

## Maintaining Documentation

### When to Update
- After implementing a new feature → update [Codebase Summary](./codebase-summary.md) + [Changelog](./project-changelog.md)
- When phase status changes → update [Development Roadmap](./development-roadmap.md)
- When design system changes → update [Design Guidelines](./design-guidelines.md)

### How to Update
1. Identify which document(s) are affected
2. Update sections with accuracy checks (verify against actual code)
3. Update "Last updated" timestamp if document has one
4. Commit with message: `docs: update [document-name] for [reason]`

### Documentation Standards
- Keep files under 400 lines for readability
- Use tables for structured information
- Include code examples where helpful
- Link between related sections
- Note ambiguities or "TBD" sections clearly

---

## Resources

### External References
- [Duolingo Design System](https://design.duolingo.com/) (inspiration)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [Next.js App Router](https://nextjs.org/docs/app)
- [Supabase Documentation](https://supabase.com/docs)
- [React 19 Documentation](https://react.dev)

### Internal Resources
- Repository: GitHub (private)
- Issue Tracker: GitHub Issues
- Deployment: Vercel

---

## Support & Questions

For questions or clarifications about the documentation:
- Check the specific document's FAQ section
- Review [Codebase Summary](./codebase-summary.md) for implementation details
- Check [Project Changelog](./project-changelog.md) for recent changes
- Consult [Development Roadmap](./development-roadmap.md) for timelines

---

**Last Updated**: 2026-05-21  
**Documentation Version**: 1.0.0  
**Maintainer**: @vanductan-NLT
