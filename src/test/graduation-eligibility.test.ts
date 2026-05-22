/**
 * Unit tests for the credit breakdown + graduation checks logic
 * extracted from graduation-eligibility-card.tsx (useMemo breakdown block).
 *
 * We test the pure computation directly — no React rendering required.
 */

import { describe, it, expect } from "vitest";
import type { Course, UserCourseWithCourse } from "@/types/database";
import type { CurriculumWithDetails } from "@/lib/data/curriculum-registry";

// ── Types mirroring the component's internal shapes ─────────────────────────

interface CreditBreakdown {
  general:    { passed: number; required: number | null };
  foundation: { passed: number; required: number | null };
  required:   { passed: number; required: number | null };
  elective:   { passed: number; required: number | null };
  total:      { passed: number; required: number };
}

interface EligibilityChecks {
  totalCredits: boolean;
  general:      boolean;
  foundation:   boolean;
  required:     boolean;
  elective:     boolean;
  gpa:          boolean;
}

// ── Pure functions extracted from the component ──────────────────────────────

/**
 * Mirrors the passedCourses filter inside graduation-eligibility-card.tsx useMemo.
 * A course is "passed" when: status=exempted OR (status=completed AND score>=4.0).
 */
function filterPassedCourses(courses: UserCourseWithCourse[]): UserCourseWithCourse[] {
  return courses.filter(
    (c) =>
      c.status === "exempted" ||
      (c.status === "completed" && c.score !== null && c.score >= 4.0)
  );
}

/**
 * Mirrors the breakdown useMemo in graduation-eligibility-card.tsx.
 */
function computeBreakdown(
  userCourses: UserCourseWithCourse[],
  curriculum: CurriculumWithDetails | null,
  totalCreditsRequired: number
): CreditBreakdown {
  const passedCourses = filterPassedCourses(userCourses);
  const counts = { general: 0, foundation: 0, required: 0, elective: 0 };

  for (const uc of passedCourses) {
    const cc = curriculum?.courses.find((c) => c.course_id === uc.course_id);
    if (cc) counts[cc.requirement_type] += uc.course.credits;
  }

  const totalPassed = passedCourses.reduce((s, c) => s + c.course.credits, 0);

  return {
    general:    { passed: counts.general,    required: curriculum?.general_credits ?? null },
    foundation: { passed: counts.foundation,  required: curriculum?.foundation_credits ?? null },
    required:   { passed: counts.required,    required: curriculum?.major_required_credits ?? null },
    elective:   { passed: counts.elective,    required: curriculum?.major_elective_credits ?? null },
    total:      { passed: totalPassed,         required: totalCreditsRequired },
  };
}

/**
 * Mirrors the checks object in graduation-eligibility-card.tsx.
 * Soft milestones (english/gdqp/gdtc) are excluded here — they are side-effect state.
 */
function computeChecks(
  breakdown: CreditBreakdown,
  gpa4: number,
  gpaReq: number
): EligibilityChecks {
  return {
    totalCredits: breakdown.total.passed >= breakdown.total.required,
    general:      breakdown.general.required === null || breakdown.general.passed >= breakdown.general.required,
    foundation:   breakdown.foundation.required === null || breakdown.foundation.passed >= breakdown.foundation.required,
    required:     breakdown.required.required === null || breakdown.required.passed >= breakdown.required.required,
    elective:     breakdown.elective.required === null || breakdown.elective.passed >= breakdown.elective.required,
    gpa:          gpa4 >= gpaReq,
  };
}

// ── Fixtures ─────────────────────────────────────────────────────────────────

function makeCourse(id: string, credits: number): Course {
  return {
    id,
    name: `Course ${id}`,
    name_en: null,
    credits,
    department: null,
    course_type: "required",
    prerequisites: [],
    components: [],
    is_active: true,
    suggested_semester: null,
    course_group: null,
    equivalents: [],
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-01T00:00:00Z",
  };
}

function makeUserCourse(
  id: string,
  courseId: string,
  credits: number,
  status: UserCourseWithCourse["status"],
  score: number | null
): UserCourseWithCourse {
  return {
    id,
    user_id: "user-1",
    course_id: courseId,
    score,
    semester: "HK1-2024-2025",
    academic_year: "2024-2025",
    status,
    component_scores: {},
    note: null,
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-01T00:00:00Z",
    course: makeCourse(courseId, credits),
  };
}

function makeCurriculum(overrides: Partial<CurriculumWithDetails> = {}): CurriculumWithDetails {
  return {
    id: "CNTT-K22",
    major: "CNTT",
    intake_year_from: 2022,
    total_credits_required: 130,
    general_credits: 30,
    foundation_credits: 40,
    major_required_credits: 40,
    major_elective_credits: 20,
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-01T00:00:00Z",
    courses: [],
    graduation_requirements: [],
    ...overrides,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// filterPassedCourses
// ─────────────────────────────────────────────────────────────────────────────

describe("filterPassedCourses", () => {
  it("includes exempted courses regardless of score", () => {
    const exempted = makeUserCourse("u1", "c1", 3, "exempted", null);
    expect(filterPassedCourses([exempted])).toHaveLength(1);
  });

  it("includes completed courses with score >= 4.0", () => {
    const passed = makeUserCourse("u1", "c1", 3, "completed", 4.0);
    expect(filterPassedCourses([passed])).toHaveLength(1);
  });

  it("includes completed course with score exactly 4.0 (boundary)", () => {
    const boundary = makeUserCourse("u1", "c1", 3, "completed", 4.0);
    expect(filterPassedCourses([boundary])).toHaveLength(1);
  });

  it("excludes completed courses with score < 4.0 (D- threshold)", () => {
    const failed = makeUserCourse("u1", "c1", 3, "completed", 3.9);
    expect(filterPassedCourses([failed])).toHaveLength(0);
  });

  it("excludes completed courses with null score", () => {
    const noScore = makeUserCourse("u1", "c1", 3, "completed", null);
    expect(filterPassedCourses([noScore])).toHaveLength(0);
  });

  it("excludes in_progress courses", () => {
    const inProgress = makeUserCourse("u1", "c1", 3, "in_progress", null);
    expect(filterPassedCourses([inProgress])).toHaveLength(0);
  });

  it("excludes failed courses", () => {
    const failed = makeUserCourse("u1", "c1", 3, "failed", 3.0);
    expect(filterPassedCourses([failed])).toHaveLength(0);
  });

  it("returns correct subset from a mixed list", () => {
    const courses = [
      makeUserCourse("u1", "c1", 3, "completed", 8.0),   // pass
      makeUserCourse("u2", "c2", 3, "completed", 3.5),   // fail — below 4.0
      makeUserCourse("u3", "c3", 2, "exempted", null),    // pass
      makeUserCourse("u4", "c4", 3, "in_progress", null), // fail — wrong status
      makeUserCourse("u5", "c5", 3, "failed", 2.0),       // fail
    ];
    const passed = filterPassedCourses(courses);
    expect(passed).toHaveLength(2);
    expect(passed.map((c) => c.id)).toEqual(["u1", "u3"]);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// computeBreakdown — credit counting by requirement_type
// ─────────────────────────────────────────────────────────────────────────────

describe("computeBreakdown — credit counting", () => {
  it("returns all zeros with no courses", () => {
    const bd = computeBreakdown([], makeCurriculum(), 130);
    expect(bd.total.passed).toBe(0);
    expect(bd.general.passed).toBe(0);
    expect(bd.foundation.passed).toBe(0);
    expect(bd.required.passed).toBe(0);
    expect(bd.elective.passed).toBe(0);
  });

  it("accumulates general credits from passed courses mapped in curriculum", () => {
    const curriculum = makeCurriculum({
      courses: [{ curriculum_id: "CNTT-K22", course_id: "c1", requirement_type: "general", suggested_semester: 1 }],
    });
    const userCourses = [makeUserCourse("u1", "c1", 3, "completed", 8.0)];
    const bd = computeBreakdown(userCourses, curriculum, 130);
    expect(bd.general.passed).toBe(3);
    expect(bd.foundation.passed).toBe(0);
  });

  it("accumulates credits per requirement_type correctly", () => {
    const curriculum = makeCurriculum({
      courses: [
        { curriculum_id: "CNTT-K22", course_id: "c1", requirement_type: "general",    suggested_semester: 1 },
        { curriculum_id: "CNTT-K22", course_id: "c2", requirement_type: "foundation",  suggested_semester: 2 },
        { curriculum_id: "CNTT-K22", course_id: "c3", requirement_type: "required",    suggested_semester: 3 },
        { curriculum_id: "CNTT-K22", course_id: "c4", requirement_type: "elective",    suggested_semester: 4 },
      ],
    });
    const userCourses = [
      makeUserCourse("u1", "c1", 4, "completed", 7.0),
      makeUserCourse("u2", "c2", 3, "completed", 8.0),
      makeUserCourse("u3", "c3", 3, "completed", 5.0),
      makeUserCourse("u4", "c4", 2, "exempted",  null),
    ];
    const bd = computeBreakdown(userCourses, curriculum, 130);
    expect(bd.general.passed).toBe(4);
    expect(bd.foundation.passed).toBe(3);
    expect(bd.required.passed).toBe(3);
    expect(bd.elective.passed).toBe(2);
    expect(bd.total.passed).toBe(12);
  });

  it("does NOT count failed/in_progress courses toward credits", () => {
    const curriculum = makeCurriculum({
      courses: [
        { curriculum_id: "CNTT-K22", course_id: "c1", requirement_type: "general", suggested_semester: 1 },
        { curriculum_id: "CNTT-K22", course_id: "c2", requirement_type: "general", suggested_semester: 2 },
      ],
    });
    const userCourses = [
      makeUserCourse("u1", "c1", 3, "in_progress", null), // not counted
      makeUserCourse("u2", "c2", 3, "failed", 3.0),       // not counted
    ];
    const bd = computeBreakdown(userCourses, curriculum, 130);
    expect(bd.general.passed).toBe(0);
    expect(bd.total.passed).toBe(0);
  });

  it("total.passed counts ALL passed credits even if course not in curriculum", () => {
    // A passed course with no curriculum mapping still contributes to total
    const curriculum = makeCurriculum({ courses: [] });
    const userCourses = [makeUserCourse("u1", "c1", 3, "completed", 8.0)];
    const bd = computeBreakdown(userCourses, curriculum, 130);
    expect(bd.total.passed).toBe(3);
    // But no type bucket incremented
    expect(bd.general.passed).toBe(0);
  });

  it("reflects curriculum required values in breakdown", () => {
    const curriculum = makeCurriculum({
      general_credits: 30,
      foundation_credits: 40,
      major_required_credits: 40,
      major_elective_credits: 20,
    });
    const bd = computeBreakdown([], curriculum, 130);
    expect(bd.general.required).toBe(30);
    expect(bd.foundation.required).toBe(40);
    expect(bd.required.required).toBe(40);
    expect(bd.elective.required).toBe(20);
    expect(bd.total.required).toBe(130);
  });

  it("sets required to null for each type when curriculum is null", () => {
    const bd = computeBreakdown([], null, 130);
    expect(bd.general.required).toBeNull();
    expect(bd.foundation.required).toBeNull();
    expect(bd.required.required).toBeNull();
    expect(bd.elective.required).toBeNull();
    // total.required always comes from totalCreditsRequired prop
    expect(bd.total.required).toBe(130);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// computeChecks — boolean eligibility flags
// ─────────────────────────────────────────────────────────────────────────────

describe("computeChecks — eligibility flags", () => {
  function bd(
    totalPassed: number,
    generalPassed = 0,
    foundationPassed = 0,
    requiredPassed = 0,
    electivePassed = 0
  ): CreditBreakdown {
    return {
      total:      { passed: totalPassed,      required: 130 },
      general:    { passed: generalPassed,    required: 30 },
      foundation: { passed: foundationPassed,  required: 40 },
      required:   { passed: requiredPassed,    required: 40 },
      elective:   { passed: electivePassed,    required: 20 },
    };
  }

  it("checks.totalCredits is true only when passed >= required", () => {
    expect(computeChecks(bd(130), 3.0, 2.0).totalCredits).toBe(true);
    expect(computeChecks(bd(129), 3.0, 2.0).totalCredits).toBe(false);
  });

  it("checks.gpa is true when gpa4 >= gpaReq", () => {
    expect(computeChecks(bd(130), 2.0, 2.0).gpa).toBe(true);
    expect(computeChecks(bd(130), 1.99, 2.0).gpa).toBe(false);
  });

  it("checks.gpa uses exact boundary (gpa4 === gpaReq → true)", () => {
    expect(computeChecks(bd(130), 2.0, 2.0).gpa).toBe(true);
  });

  it("credit type checks are true when required is null (no curriculum)", () => {
    const nullBd: CreditBreakdown = {
      total:      { passed: 0,  required: 130 },
      general:    { passed: 0,  required: null },
      foundation: { passed: 0,  required: null },
      required:   { passed: 0,  required: null },
      elective:   { passed: 0,  required: null },
    };
    const checks = computeChecks(nullBd, 3.0, 2.0);
    expect(checks.general).toBe(true);
    expect(checks.foundation).toBe(true);
    expect(checks.required).toBe(true);
    expect(checks.elective).toBe(true);
  });

  it("credit type check is false when passed < required", () => {
    const checks = computeChecks(bd(130, 20, 40, 40, 20), 3.0, 2.0);
    // general: 20 < 30 → false
    expect(checks.general).toBe(false);
    expect(checks.foundation).toBe(true);
    expect(checks.required).toBe(true);
    expect(checks.elective).toBe(true);
  });

  it("all checks true when all thresholds are met", () => {
    const checks = computeChecks(bd(130, 30, 40, 40, 20), 3.2, 2.0);
    expect(checks.totalCredits).toBe(true);
    expect(checks.general).toBe(true);
    expect(checks.foundation).toBe(true);
    expect(checks.required).toBe(true);
    expect(checks.elective).toBe(true);
    expect(checks.gpa).toBe(true);
  });
});
