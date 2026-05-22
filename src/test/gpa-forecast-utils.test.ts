/**
 * Unit tests for gpa-forecast-utils.ts
 *
 * calculateGPA4 (from use-courses) is imported by the module under test.
 * We mock the entire hook module so tests stay pure and don't pull in
 * Supabase/React dependencies.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import type { Course, UserCourseWithCourse } from "@/types/database";

// ── Mock @/hooks/use-courses before importing the module under test ──────────
vi.mock("@/hooks/use-courses", () => ({
  calculateGPA4: (courses: UserCourseWithCourse[]): number => {
    // Real formula: GPA10 / 2.5, where GPA10 = weighted avg of scored non-exempted courses
    const graded = courses.filter(
      (c) => c.score !== null && c.status !== "exempted"
    );
    if (graded.length === 0) return 0;
    const totalWeighted = graded.reduce(
      (s, c) => s + (c.score ?? 0) * c.course.credits,
      0
    );
    const totalCredits = graded.reduce((s, c) => s + c.course.credits, 0);
    const gpa10 = totalCredits === 0 ? 0 : totalWeighted / totalCredits;
    return Math.round((gpa10 / 2.5) * 100) / 100;
  },
}));

import {
  calculatePartialScore,
  calculateRequiredCK,
  forecastCumulativeGPA4,
  calculateRequiredAvgScore,
  sortByRisk,
} from "@/lib/gpa-forecast-utils";

// ── Helpers to build minimal test fixtures ───────────────────────────────────

function makeCourse(overrides: Partial<Course> = {}): Course {
  return {
    id: "course-1",
    name: "Lập trình",
    name_en: null,
    credits: 3,
    department: null,
    course_type: "required",
    prerequisites: [],
    is_active: true,
    suggested_semester: null,
    course_group: null,
    equivalents: [],
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-01T00:00:00Z",
    components: [
      { name: "Quá trình", weight: 0.3 },
      { name: "Cuối kỳ", weight: 0.7 },
    ],
    ...overrides,
  };
}

function makeUserCourse(
  overrides: Partial<UserCourseWithCourse> = {},
  courseOverrides: Partial<Course> = {}
): UserCourseWithCourse {
  const course = makeCourse(courseOverrides);
  return {
    id: "uc-1",
    user_id: "user-1",
    course_id: course.id,
    score: null,
    semester: "HK1-2024-2025",
    academic_year: "2024-2025",
    status: "in_progress",
    component_scores: {},
    note: null,
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-01T00:00:00Z",
    course,
    ...overrides,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// calculatePartialScore
// ─────────────────────────────────────────────────────────────────────────────

describe("calculatePartialScore", () => {
  const course = makeCourse({
    components: [
      { name: "Quá trình", weight: 0.3 },
      { name: "Cuối kỳ", weight: 0.7 },
    ],
  });

  it("returns null when all component scores are null", () => {
    const scores = { "Quá trình": null, "Cuối kỳ": null };
    expect(calculatePartialScore(course, scores)).toBeNull();
  });

  it("returns null when componentScores is empty object", () => {
    expect(calculatePartialScore(course, {})).toBeNull();
  });

  it("computes weighted average for a single entered score", () => {
    // Only "Quá trình" entered: 8.0 * 0.3 = 2.4
    const scores = { "Quá trình": 8.0, "Cuối kỳ": null };
    expect(calculatePartialScore(course, scores)).toBe(2.4);
  });

  it("computes weighted sum when all components are entered", () => {
    // 8.0 * 0.3 + 7.0 * 0.7 = 2.4 + 4.9 = 7.3
    const scores = { "Quá trình": 8.0, "Cuối kỳ": 7.0 };
    expect(calculatePartialScore(course, scores)).toBe(7.3);
  });

  it("rounds to 2 decimal places", () => {
    // 7.5 * 0.3 + 6.8 * 0.7 = 2.25 + 4.76 = 7.01
    const scores = { "Quá trình": 7.5, "Cuối kỳ": 6.8 };
    expect(calculatePartialScore(course, scores)).toBe(7.01);
  });

  it("handles course with three components correctly", () => {
    const threePart = makeCourse({
      components: [
        { name: "Bài tập", weight: 0.2 },
        { name: "Giữa kỳ", weight: 0.3 },
        { name: "Cuối kỳ", weight: 0.5 },
      ],
    });
    // 6 * 0.2 + 8 * 0.3 = 1.2 + 2.4 = 3.6 (CK null, ignored)
    const scores = { "Bài tập": 6.0, "Giữa kỳ": 8.0, "Cuối kỳ": null };
    expect(calculatePartialScore(threePart, scores)).toBe(3.6);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// calculateRequiredCK
// ─────────────────────────────────────────────────────────────────────────────

describe("calculateRequiredCK", () => {
  const course = makeCourse({
    components: [
      { name: "Quá trình", weight: 0.3 },
      { name: "Cuối kỳ", weight: 0.7 },
    ],
  });

  it("returns null when there is no CK component", () => {
    const noCK = makeCourse({
      components: [
        { name: "Quá trình", weight: 0.5 },
        { name: "Giữa kỳ", weight: 0.5 },
      ],
    });
    expect(calculateRequiredCK(noCK, {}, 7.0)).toBeNull();
  });

  it("returns null when CK component weight is 0", () => {
    const zeroCK = makeCourse({
      components: [
        { name: "Quá trình", weight: 1.0 },
        { name: "Cuối kỳ", weight: 0 },
      ],
    });
    expect(calculateRequiredCK(zeroCK, {}, 7.0)).toBeNull();
  });

  it("computes required CK correctly given partial scores", () => {
    // partialWithoutCK = 8.0 * 0.3 = 2.4
    // required = (7.0 - 2.4) / 0.7 = 4.6 / 0.7 ≈ 6.571... → rounds to 6.57
    const scores = { "Quá trình": 8.0, "Cuối kỳ": null };
    expect(calculateRequiredCK(course, scores, 7.0)).toBe(6.57);
  });

  it("clamps result to 10.01 when required CK exceeds 10", () => {
    // partialWithoutCK = 0 * 0.3 = 0
    // required = (9.5 - 0) / 0.7 ≈ 13.57 → clamped to 10.01
    const scores = { "Quá trình": 0, "Cuối kỳ": null };
    expect(calculateRequiredCK(course, scores, 9.5)).toBe(10.01);
  });

  it("clamps result to 0 when already exceeds target without CK", () => {
    // partialWithoutCK = 10.0 * 0.3 = 3.0; target = 2.0
    // required = (2.0 - 3.0) / 0.7 ≈ -1.43 → clamped to 0
    const scores = { "Quá trình": 10.0, "Cuối kỳ": null };
    expect(calculateRequiredCK(course, scores, 2.0)).toBe(0);
  });

  it("handles missing non-CK scores as 0 contribution", () => {
    // No "Quá trình" entered → partialWithoutCK = 0
    // required = (7.0 - 0) / 0.7 = 10.0
    expect(calculateRequiredCK(course, {}, 7.0)).toBe(10);
  });

  it("recognises CK component by uppercase 'CK' name", () => {
    const ckNamed = makeCourse({
      components: [
        { name: "Quá trình", weight: 0.4 },
        { name: "CK", weight: 0.6 },
      ],
    });
    const scores = { "Quá trình": 8.0, CK: null };
    // required = (7.0 - 8.0*0.4) / 0.6 = (7.0 - 3.2) / 0.6 = 6.333... → 6.33
    expect(calculateRequiredCK(ckNamed, scores, 7.0)).toBe(6.33);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// forecastCumulativeGPA4
// ─────────────────────────────────────────────────────────────────────────────

describe("forecastCumulativeGPA4", () => {
  it("returns 0 when both lists are empty", () => {
    expect(forecastCumulativeGPA4([], [])).toBe(0);
  });

  it("uses only completed courses when inProgressCourses is empty", () => {
    const completed = makeUserCourse(
      { status: "completed", score: 8.0 },
      { credits: 3 }
    );
    // GPA10 = 8.0, GPA4 = 8.0 / 2.5 = 3.2
    expect(forecastCumulativeGPA4([completed], [])).toBe(3.2);
  });

  it("forecasts in-progress courses and includes them in GPA calculation", () => {
    // completed: score=8.0, 3 credits
    const completed = makeUserCourse(
      { id: "uc-1", status: "completed", score: 8.0 },
      { id: "c-1", credits: 3 }
    );
    // in_progress: Quá trình=8.0 entered, CK needed for B(7.0): (7.0-2.4)/0.7≈6.57
    // forecast = 8.0*0.3 + 6.57*0.7 = 2.4 + 4.599 = 6.999 → ~7.0
    const inProgress = makeUserCourse(
      {
        id: "uc-2",
        course_id: "c-2",
        status: "in_progress",
        score: null,
        component_scores: { "Quá trình": 8.0 },
      },
      { id: "c-2", credits: 3 }
    );
    const result = forecastCumulativeGPA4([completed], [inProgress]);
    // Weighted avg = (8.0*3 + forecast*3) / 6; forecast≈7.0
    // GPA10 ≈ (24 + 21) / 6 = 7.5; GPA4 = 3.0
    expect(result).toBeGreaterThan(0);
    expect(result).toBeLessThanOrEqual(4);
  });

  it("excludes exempted courses from GPA calculation (mock confirms this)", () => {
    const exempted = makeUserCourse({ status: "exempted", score: 10 });
    // calculateGPA4 mock filters out exempted → result is 0
    expect(forecastCumulativeGPA4([exempted], [])).toBe(0);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// calculateRequiredAvgScore
// ─────────────────────────────────────────────────────────────────────────────

describe("calculateRequiredAvgScore", () => {
  function completedCourse(
    id: string,
    score: number,
    credits: number
  ): UserCourseWithCourse {
    return makeUserCourse(
      { id, course_id: id, status: "completed", score },
      { id, credits }
    );
  }

  function ipCourse(id: string, credits: number): UserCourseWithCourse {
    return makeUserCourse(
      { id, course_id: id, status: "in_progress", score: null },
      { id, credits }
    );
  }

  it("returns isImpossible=true when no in-progress courses", () => {
    const result = calculateRequiredAvgScore(3.0, [], []);
    expect(result.isImpossible).toBe(true);
    expect(result.isAlreadyMet).toBe(false);
    expect(result.requiredAvg).toBe(0);
  });

  it("returns isAlreadyMet=true when requiredAvg <= 0", () => {
    // completed: 10.0 score, 3 credits → weightedSum = 30
    // target GPA4=2.0 → targetGPA10=5.0
    // totalCredits = 3+3=6; neededFromIP = 5.0*6 - 30 = -0 (negative)
    const completed = completedCourse("c1", 10.0, 3);
    const ip = ipCourse("ip1", 3);
    const result = calculateRequiredAvgScore(2.0, [completed], [ip]);
    expect(result.isAlreadyMet).toBe(true);
    expect(result.requiredAvg).toBeLessThanOrEqual(0);
  });

  it("returns isImpossible=true when requiredAvg > 10", () => {
    // completed: 0.0 score, 3 credits → weightedSum = 0
    // target GPA4=4.0 → targetGPA10=10.0
    // totalCredits = 3+3=6; neededFromIP = 10*6 - 0 = 60; requiredAvg = 60/3 = 20
    const completed = completedCourse("c1", 0.0, 3);
    const ip = ipCourse("ip1", 3);
    const result = calculateRequiredAvgScore(4.0, [completed], [ip]);
    expect(result.isImpossible).toBe(true);
    expect(result.requiredAvg).toBeGreaterThan(10);
  });

  it("computes correct requiredAvg for a realistic scenario", () => {
    // completed: 7.0 score, 6 credits → weightedSum = 42, completedCredits = 6
    // in-progress: 3 credits; target GPA4 = 3.0 → targetGPA10 = 7.5
    // totalCredits = 9; neededFromIP = 7.5*9 - 42 = 67.5 - 42 = 25.5
    // requiredAvg = 25.5 / 3 = 8.5
    const completed = completedCourse("c1", 7.0, 6);
    const ip = ipCourse("ip1", 3);
    const result = calculateRequiredAvgScore(3.0, [completed], [ip]);
    expect(result.requiredAvg).toBe(8.5);
    expect(result.isAlreadyMet).toBe(false);
    expect(result.isImpossible).toBe(false);
  });

  it("ignores completed courses with null score", () => {
    // null-score completed course must not contribute to weightedSum
    const nullScore = makeUserCourse({
      id: "c0",
      status: "completed",
      score: null,
    });
    const ip = ipCourse("ip1", 3);
    // Only ip1 (3 credits); target GPA4=2.0 → targetGPA10=5.0
    // totalCredits=3; neededFromIP = 5.0*3 - 0 = 15; requiredAvg = 5.0
    const result = calculateRequiredAvgScore(2.0, [nullScore], [ip]);
    expect(result.requiredAvg).toBe(5);
  });

  it("ignores in_progress courses in the completed list", () => {
    // An in_progress entry accidentally placed in completedCourses should be ignored
    const inProg = makeUserCourse({
      id: "c0",
      status: "in_progress",
      score: 8.0,
    });
    const ip = ipCourse("ip1", 3);
    const result = calculateRequiredAvgScore(2.0, [inProg], [ip]);
    // treated same as null-score completed → requiredAvg = 5.0
    expect(result.requiredAvg).toBe(5);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// sortByRisk
// ─────────────────────────────────────────────────────────────────────────────

describe("sortByRisk", () => {
  it("returns empty array for empty input", () => {
    expect(sortByRisk([])).toEqual([]);
  });

  it("does not mutate the original array", () => {
    const a = makeUserCourse({ id: "a", score: null }, { credits: 3 });
    const b = makeUserCourse({ id: "b", score: null }, { credits: 4 });
    const original = [a, b];
    sortByRisk(original);
    expect(original[0].id).toBe("a");
  });

  it("places higher-risk courses first (no partial scores entered)", () => {
    // riskScore = (10 - partialScore) * credits; partial=null→0
    // a: (10-0)*4 = 40; b: (10-0)*3 = 30 → a first
    const a = makeUserCourse(
      { id: "a", component_scores: {} },
      { id: "ca", credits: 4 }
    );
    const b = makeUserCourse(
      { id: "b", component_scores: {} },
      { id: "cb", credits: 3 }
    );
    const sorted = sortByRisk([b, a]);
    expect(sorted[0].id).toBe("a");
    expect(sorted[1].id).toBe("b");
  });

  it("places course with lower partial score before higher partial score (same credits)", () => {
    // a: partialScore = 5.0*0.3 = 1.5; risk = (10-1.5)*3 = 25.5
    // b: partialScore = 9.0*0.3 = 2.7; risk = (10-2.7)*3 = 21.9
    // a is riskier → a first
    const a = makeUserCourse(
      { id: "a", component_scores: { "Quá trình": 5.0 } },
      { id: "ca", credits: 3 }
    );
    const b = makeUserCourse(
      { id: "b", component_scores: { "Quá trình": 9.0 } },
      { id: "cb", credits: 3 }
    );
    const sorted = sortByRisk([b, a]);
    expect(sorted[0].id).toBe("a");
    expect(sorted[1].id).toBe("b");
  });

  it("handles courses with no components gracefully (partial=null→risk uses 0)", () => {
    const noComp = makeUserCourse(
      { id: "nc", component_scores: {} },
      { id: "c-nc", credits: 2, components: [] }
    );
    const normal = makeUserCourse(
      { id: "nm", component_scores: {} },
      { id: "c-nm", credits: 3 }
    );
    // noComp: risk = (10-0)*2 = 20; normal: risk = (10-0)*3 = 30 → normal first
    const sorted = sortByRisk([noComp, normal]);
    expect(sorted[0].id).toBe("nm");
    expect(sorted[1].id).toBe("nc");
  });
});
