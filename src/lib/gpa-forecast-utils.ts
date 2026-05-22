import type { Course, UserCourseWithCourse } from "@/types/database";
import { calculateGPA4 } from "@/hooks/use-courses";

// UIT letter grade thresholds (scale 10)
export const GRADE_THRESHOLDS = [
  { label: "A+", minScore: 9.0 },
  { label: "A",  minScore: 8.5 },
  { label: "B+", minScore: 8.0 },
  { label: "B",  minScore: 7.0 },
  { label: "C+", minScore: 6.5 },
  { label: "C",  minScore: 5.5 },
  { label: "D+", minScore: 5.0 },
  { label: "D",  minScore: 4.0 },
] as const;

export type GradeLabel = (typeof GRADE_THRESHOLDS)[number]["label"];

// Tổng điểm thành phần đã có (bỏ qua component null)
// Returns null nếu chưa có điểm nào
export function calculatePartialScore(
  course: Course,
  componentScores: Record<string, number | null>
): number | null {
  let total = 0;
  let hasAny = false;
  for (const comp of course.components) {
    const val = componentScores[comp.name];
    if (val !== null && val !== undefined) {
      total += val * comp.weight;
      hasAny = true;
    }
  }
  return hasAny ? Math.round(total * 100) / 100 : null;
}

// Tìm component cuối kỳ (CK)
function findCKComponent(course: Course) {
  return course.components.find(
    (c) => c.name.toLowerCase().includes("cuối kỳ") || c.name.toUpperCase() === "CK"
  );
}

// Tính điểm CK cần đạt để đạt targetScore
// Returns null nếu không có CK component, "impossible" nếu > 10
export function calculateRequiredCK(
  course: Course,
  componentScores: Record<string, number | null>,
  targetScore: number
): number | null {
  const ckComp = findCKComponent(course);
  if (!ckComp || ckComp.weight === 0) return null;

  // Tổng điểm từ các component không phải CK (đã nhập)
  let partialWithoutCK = 0;
  for (const comp of course.components) {
    if (comp.name === ckComp.name) continue;
    const val = componentScores[comp.name];
    if (val !== null && val !== undefined) {
      partialWithoutCK += val * comp.weight;
    }
  }

  const required = (targetScore - partialWithoutCK) / ckComp.weight;
  // Clamp: CK > 10 → không thể đạt, CK < 0 → đã chắc chắn đạt
  return Math.round(Math.min(Math.max(required, 0), 10.01) * 100) / 100;
}

// Dự báo điểm cuối môn cho môn in_progress:
// - Nếu tất cả non-CK component đã nhập → dùng required_ck_for_B làm CK dự báo
// - Fallback: partialScore hiện tại
export function forecastCourseScore(
  course: UserCourseWithCourse
): number | null {
  const componentScores = course.component_scores ?? {};
  const partial = calculatePartialScore(course.course, componentScores);
  if (partial === null) return null;

  const ckComp = findCKComponent(course.course);
  if (!ckComp) return partial;

  // Dùng CK cần để đạt B (7.0) làm dự báo mặc định
  const requiredCK = calculateRequiredCK(course.course, componentScores, 7.0);
  const predictedCK = requiredCK !== null ? Math.min(requiredCK, 10) : 7.0;

  // partialWithoutCK + predictedCK * w_ck
  let partialWithoutCK = 0;
  for (const comp of course.course.components) {
    if (comp.name === ckComp.name) continue;
    const val = componentScores[comp.name];
    if (val !== null && val !== undefined) {
      partialWithoutCK += val * comp.weight;
    }
  }
  return Math.round((partialWithoutCK + predictedCK * ckComp.weight) * 100) / 100;
}

// Dự báo GPA tích lũy cuối HK (thang 4)
export function forecastCumulativeGPA4(
  completedCourses: UserCourseWithCourse[],
  inProgressCourses: UserCourseWithCourse[]
): number {
  const predicted: UserCourseWithCourse[] = inProgressCourses.map((c) => ({
    ...c,
    score: forecastCourseScore(c),
    status: "completed" as const,
  }));
  return calculateGPA4([...completedCourses, ...predicted]);
}

// Điểm rủi ro: cao = nguy hiểm hơn
// Môn chưa có điểm nào → riskScore tối đa (10 × credits)
export function getRiskScore(course: UserCourseWithCourse): number {
  const partial = calculatePartialScore(course.course, course.component_scores ?? {});
  const current = partial ?? 0;
  return (10 - current) * course.course.credits;
}

// Sort môn theo mức độ rủi ro giảm dần
export function sortByRisk(courses: UserCourseWithCourse[]): UserCourseWithCourse[] {
  return [...courses].sort((a, b) => getRiskScore(b) - getRiskScore(a));
}

// ── Reverse GPA calculator ──────────────────────────────────────────────────

/**
 * Given a target cumulative GPA (hệ 4), compute the average course score
 * that ALL in-progress courses need to achieve to hit that target.
 *
 * Formula:
 *   requiredAvg = (targetGPA10 × totalCredits − completedWeightedSum) / ipCredits
 */
export function calculateRequiredAvgScore(
  targetGPA4: number,
  completedCourses: UserCourseWithCourse[],
  inProgressCourses: UserCourseWithCourse[]
): { requiredAvg: number; isAlreadyMet: boolean; isImpossible: boolean } {
  const targetGPA10 = targetGPA4 * 2.5;

  // Only scored, completed courses contribute to the weighted sum
  const scored = completedCourses.filter((c) => c.score !== null && c.status === "completed");
  const completedWeightedSum = scored.reduce((s, c) => s + (c.score ?? 0) * c.course.credits, 0);
  const completedCredits = scored.reduce((s, c) => s + c.course.credits, 0);

  const ipCredits = inProgressCourses.reduce((s, c) => s + c.course.credits, 0);
  if (ipCredits === 0) return { requiredAvg: 0, isAlreadyMet: false, isImpossible: true };

  const totalCredits = completedCredits + ipCredits;
  const neededFromIP = targetGPA10 * totalCredits - completedWeightedSum;
  const requiredAvg = Math.round((neededFromIP / ipCredits) * 100) / 100;

  return {
    requiredAvg,
    isAlreadyMet: requiredAvg <= 0,
    isImpossible: requiredAvg > 10,
  };
}
