# Development Roadmap

UIT Hub is organized into phases with clear milestones and success metrics. This document tracks progress and upcoming work.

## Phase Overview

```
Phase 1: Core Features    [████████████████████] 100% DONE
Phase 2: Design Polish    [████████░░░░░░░░░░░░] 50% IN PROGRESS
Phase 3: Exam Tracking    [░░░░░░░░░░░░░░░░░░░░] 0% PLANNED
Phase 4: Testing          [░░░░░░░░░░░░░░░░░░░░] 0% PLANNED
Phase 5: Advanced Features[░░░░░░░░░░░░░░░░░░░░] 0% FUTURE
```

---

## Phase 1: Core Features (100% - COMPLETE)

**Timeline**: Initial release  
**Status**: ✓ Shipped  
**Priority**: HIGH

### Completed Features

| Feature | Status | Notes |
|---------|--------|-------|
| Google OAuth authentication | ✓ | @gm.uit.edu.vn restriction |
| Course tracking CRUD | ✓ | Add/edit/delete courses |
| GPA calculation (weighted) | ✓ | Real-time forecasting |
| Dashboard statistics | ✓ | GPA, credits, trend |
| Sidebar navigation | ✓ | Dark theme, active states |
| Admin panel (basic) | ✓ | Student list, resource management |
| Database schema | ✓ | Users, courses, resources |
| Responsive layout | ⚠️ | Desktop primary, mobile WIP |

### Success Metrics
- ✓ Users can log in via Google
- ✓ Course data persists in Supabase
- ✓ GPA calculation matches expected weights
- ✓ Dashboard loads within 2s
- ✓ No authentication errors on refresh

---

## Phase 2: Design Polish & UX (50% - IN PROGRESS)

**Timeline**: Current release cycle  
**Status**: 🔄 In progress  
**Priority**: HIGH

### Completed (Latest Commit)

| Feature | Status | Notes |
|---------|--------|-------|
| Galactic login redesign | ✓ | Animated constellations + stairs |
| Split-panel login layout | ✓ | Feature showcase on right |
| Onboarding wizard | ✓ | 3-step profile + courses + confetti |
| Design system (CSS tokens) | ✓ | Color, radius, shadow, animation system |
| Dark mode complete | ✓ | All pages, proper contrast |
| Spring animation system | ✓ | cubic-bezier(0.34, 1.56, 0.64, 1) |
| Button press effect | ✓ | Duolingo-style squish animation |
| Claymorphism shadows | ✓ | Multi-layer depth system |
| Progress bar animations | ✓ | 10px height, spring easing, shine |
| Canvas confetti library | ✓ | Celebration on onboarding |
| Stagger animations | ✓ | Cascading delays for lists |

### In Progress

| Feature | % | Target | Notes |
|---------|---|--------|-------|
| Mobile responsive | 40% | v0.2.1 | Breakpoints defined, testing needed |
| Touch interactions | 30% | v0.2.1 | Button sizes ≥44px, tap feedback |
| Tablet layout | 20% | v0.2.2 | Sidebar drawer, grid adjustments |
| Animation performance | 60% | v0.2.2 | Profile, optimize will-change |
| Dark mode refinement | 80% | v0.2.1 | Fine-tune shadow contrast |

### Planned (Not Started)

| Feature | Priority | Notes |
|---------|----------|-------|
| Loading skeletons | MEDIUM | For dashboard data fetch |
| Error state UI | HIGH | Modal + retry logic |
| Accessibility audit | MEDIUM | WCAG AAA compliance |
| Icon system overhaul | LOW | Replace Lucide with custom? |
| Micro-interactions | MEDIUM | Hover, focus, validation feedback |

### Success Criteria
- [ ] Mobile viewport ≤480px fully functional
- [ ] Tablet viewport ≤768px sidebar drawer works
- [ ] All animations pass FPS test (60fps)
- [ ] Dark mode toggle persists across sessions
- [ ] WCAG AA color contrast on all text
- [ ] Lighthouse Performance ≥85%

### Risk & Dependencies
- **Risk**: Animation performance on low-end devices
  - Mitigation: prefers-reduced-motion support ✓, will-change optimization
- **Dependency**: Tailwind CSS 4 stability
  - Status: Stable, using PostCSS plugin

---

## Phase 3: Exam Tracking (0% - PLANNED)

**Timeline**: Q2 2026 (estimated)  
**Status**: 📋 Backlog  
**Priority**: MEDIUM

### Features to Implement

| Feature | Complexity | Est. Days | Notes |
|---------|-----------|----------|-------|
| Exam list UI | LOW | 1 | Card layout, exam details |
| Exam CRUD | MEDIUM | 2 | Add/edit/delete with validation |
| Study schedule | MEDIUM | 3 | Calendar + task breakdown |
| Study progress | HIGH | 4 | Real-time tracker, sync with courses |
| Exam performance | MEDIUM | 2 | Score input, trend analysis |
| Notification system | HIGH | 3 | Exam reminders, study milestones |

### Database Schema Additions

```typescript
// Exams table
{
  id: uuid;
  user_id: uuid (FK);
  course_id: uuid (FK);
  subject: string;
  exam_date: date;
  location: string;
  duration_minutes: number;
  exam_type: 'midterm' | 'final' | 'quiz';
  created_at: timestamp;
  updated_at: timestamp;
}

// Study tasks
{
  id: uuid;
  exam_id: uuid (FK);
  task: string;
  target_date: date;
  completed_at: timestamp | null;
  priority: 1 | 2 | 3; // 1=high, 3=low
}
```

### Success Criteria
- [ ] Exam list loads in <500ms
- [ ] Study schedule syncs with calendar
- [ ] Notifications sent 24h before exam
- [ ] Performance analytics accurate
- [ ] Export exam schedule to .ics

---

## Phase 4: Testing & Quality (0% - PLANNED)

**Timeline**: Q2-Q3 2026  
**Status**: 📋 Backlog  
**Priority**: HIGH

### Test Coverage Goals

| Type | Target | Status |
|------|--------|--------|
| Unit tests (Jest) | 80% | Not started |
| Integration tests | 60% | Not started |
| E2E tests (Playwright) | 40% | Not started |
| Performance (Lighthouse) | ≥85 | Not started |
| Accessibility (WCAG AAA) | 100% | Not started |

### Test Suites to Create

```
tests/
├── unit/
│   ├── lib/gpa-calculator.test.ts
│   ├── lib/grade-mapper.test.ts
│   └── components/buttons.test.ts
├── integration/
│   ├── auth.test.ts
│   ├── course-crud.test.ts
│   └── dashboard-data.test.ts
└── e2e/
    ├── login-flow.spec.ts
    ├── onboarding.spec.ts
    └── course-management.spec.ts
```

### Security Audit
- [ ] SQL injection prevention (Supabase client-side limits)
- [ ] XSS prevention (React auto-escaping + CSP headers)
- [ ] CSRF protection (SameSite cookies)
- [ ] Data privacy compliance (GDPR, student data protection)

### Success Criteria
- [ ] All critical paths covered (>80% unit tests)
- [ ] No regressions in main branch
- [ ] Performance budget adhered (FCP <2s, LCP <3s)
- [ ] Accessibility pass rate ≥95%

---

## Phase 5: Advanced Features (0% - FUTURE)

**Timeline**: Post-launch (Q3+ 2026)  
**Status**: 💡 Ideas  
**Priority**: LOW-MEDIUM

### Potential Features

| Feature | Scope | Rationale |
|---------|-------|-----------|
| Collaborative study groups | LARGE | Peer learning, community building |
| AI course recommendations | LARGE | ML-based major suggestions |
| GPA trend analysis | MEDIUM | Historical data visualization |
| Transcript export | SMALL | PDF/CSV download |
| Mobile app (React Native) | LARGE | iOS/Android native |
| Attendance tracker | MEDIUM | Course participation logging |
| Professor ratings | MEDIUM | Community feedback (moderated) |
| Study resource marketplace | LARGE | Peer note-sharing platform |
| API for 3rd-party integrations | MEDIUM | OAuth providers, webhooks |

### Exploration Tasks
- [ ] User interviews (5+ students)
- [ ] Competitive analysis (Duolingo, other ed-tech)
- [ ] Technical feasibility study (mobile, API)
- [ ] Revenue model if applicable

---

## Milestone Tracking

### v0.2.0 (Current - Design Phase)
- **Target Date**: End May 2026
- **Deliverables**:
  - ✓ Galactic login + onboarding
  - ✓ Design system documentation
  - [ ] Mobile responsive complete
  - [ ] Accessibility audit in progress
- **Blocker**: None
- **Status**: ON TRACK

### v0.3.0 (Testing Phase)
- **Target Date**: Mid-June 2026
- **Deliverables**:
  - Unit & integration tests
  - Bug fixes from v0.2
  - Performance optimizations
- **Estimated Effort**: 3 weeks
- **Status**: PLANNING

### v1.0.0 (Launch)
- **Target Date**: End-June 2026
- **Deliverables**:
  - Production-ready codebase
  - Full documentation
  - Public release
- **Estimated Effort**: 1 week (final polish)
- **Status**: NOT STARTED

---

## Resource Allocation

### Current Team
- @vanductan-NLT: Full-time lead (design, implementation)
- @Justarandomduddd: Part-time (reviews, guidance)

### Estimated Effort (Person-Hours)

| Phase | Design | Dev | Testing | Docs | Total |
|-------|--------|-----|---------|------|-------|
| Phase 1 | 20h | 80h | 10h | 10h | 120h |
| Phase 2 | 30h | 60h | 20h | 10h | 120h |
| Phase 3 | 20h | 100h | 30h | 10h | 160h |
| Phase 4 | 5h | 50h | 120h | 20h | 195h |
| Phase 5 | TBD | TBD | TBD | TBD | TBD |

---

## Dependency Map

```
Phase 1 ─┐
         ├─→ Phase 2 ─┐
Phase 2 ─┤           ├─→ Phase 3 ─┐
         └─→ Testing ┘            ├─→ v1.0.0 (Launch)
                                  ├─→ Phase 4
                                  └─→ Phase 5 (Optional)
```

- Phase 2 depends on Phase 1 completion
- Phase 3 can start once Phase 2 mobile is 80% done
- Phase 4 (testing) can run in parallel with Phase 3
- Phase 5 (advanced) is post-launch

---

## Risk Register

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|-----------|
| Animation perf on mobile | HIGH | MEDIUM | Profile + optimize will-change, test on low-end devices |
| Supabase quota limits | MEDIUM | LOW | Monitor usage, implement pagination |
| Design system bloat | MEDIUM | MEDIUM | Review tokens quarterly, remove unused |
| Scope creep | HIGH | HIGH | Strict backlog prioritization, weekly reviews |
| Team capacity | MEDIUM | MEDIUM | Document patterns, modularize code |

---

## Success Metrics (Overall)

| Metric | Target | Current | Status |
|--------|--------|---------|--------|
| User onboarding time | <3 min | ~4 min | 🟡 Improving |
| GPA accuracy | 100% | 100% | ✓ Met |
| Mobile usability | 80%+ | 60% | 🟡 In progress |
| API response time | <500ms | <200ms | ✓ Exceeds |
| Test coverage | 80% | 0% | 🔴 Not started |
| Accessibility score | 95%+ | ~75% | 🟡 Improving |

---

## Decision Log

| Date | Decision | Rationale | Status |
|------|----------|-----------|--------|
| Jan 2025 | Use Supabase for auth | Low barrier, Google OAuth out-of-box | ✓ Active |
| Feb 2025 | Galactic login redesign | Better UX, matches Duolingo inspiration | ✓ Complete |
| Feb 2025 | Spring animation system | Natural motion, reduced cognitive load | ✓ Complete |
| TBD | Mobile app (React Native)? | Reach more users | Under review |
| TBD | Open source contribution? | Community value, feedback | Under review |

---

## How to Update This Document

1. Monthly review: Update progress percentages
2. Completed milestone: Move to "Done" section with date
3. New risk identified: Add to risk register with probability
4. Scope change: Update phase descriptions and timeline

Last updated: 2026-05-21
Next review: 2026-06-21
