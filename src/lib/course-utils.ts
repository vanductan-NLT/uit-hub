import type { Course, CurriculumCourse, UserCourseWithCourse } from "@/types/database";

export function buildPassedIds(userCourses: UserCourseWithCourse[]): Set<string> {
  return new Set(
    userCourses
      .filter((c) => c.status === "exempted" || (c.score !== null && c.score >= 4.0))
      .map((c) => c.course_id)
  );
}

export function buildTakenIds(userCourses: UserCourseWithCourse[]): Set<string> {
  return new Set(userCourses.map((c) => c.course_id));
}

export function getMissingPrereqs(
  course: Course,
  passedIds: Set<string>,
  allCoursesMap: Map<string, Course>
): Course[] {
  return course.prerequisites
    .filter((id) => !passedIds.has(id))
    .map((id) => allCoursesMap.get(id))
    .filter((c): c is Course => c !== undefined);
}

export type SuggestionReason = "ok" | "no_curriculum" | "completed";

export interface SuggestionResult {
  courses: Course[];
  reason: SuggestionReason;
}

/**
 * Suggest courses for the next semester.
 *
 * Without a curriculum we cannot tell which courses belong to the user's major
 * — the global course pool spans every department, and most rows have empty
 * prerequisites so a naive filter returns hundreds of vacuously-eligible items.
 * In that case we return an empty list with reason="no_curriculum" so the UI
 * can prompt the user to import their CTĐT instead of showing noise.
 */
/**
 * Compute the set of course IDs that should be excluded because they belong
 * to an elective group whose required credits have already been earned.
 * Example: HK7 graduation block — passing CS554 fulfills the 10-credit group
 * so CS553 and CS505 should not be suggested anymore.
 */
export function getFulfilledGroupExclusions(
  curriculumCourses: Pick<CurriculumCourse, "course_id" | "elective_group_key" | "group_required_credits">[],
  passedCourses: { id: string; credits: number }[]
): Set<string> {
  const passedMap = new Map(passedCourses.map((c) => [c.id, c.credits]));
  const groups = new Map<string, { required: number; members: string[] }>();
  for (const cc of curriculumCourses) {
    if (!cc.elective_group_key) continue;
    const g = groups.get(cc.elective_group_key) ?? {
      required: cc.group_required_credits ?? 0,
      members: [],
    };
    g.members.push(cc.course_id);
    if (cc.group_required_credits && cc.group_required_credits > g.required) {
      g.required = cc.group_required_credits;
    }
    groups.set(cc.elective_group_key, g);
  }
  const exclude = new Set<string>();
  for (const g of groups.values()) {
    const earned = g.members.reduce((s, id) => s + (passedMap.get(id) ?? 0), 0);
    if (g.required > 0 && earned >= g.required) {
      for (const id of g.members) if (!passedMap.has(id)) exclude.add(id);
    }
  }
  return exclude;
}

export function getSuggestedCourses(
  allCourses: Course[],
  takenIds: Set<string>,
  passedIds: Set<string>,
  curriculumCourseIds?: Set<string>,
  /** course_id -> suggested_semester from the curriculum (1..8). */
  curriculumSemesterMap?: Map<string, number>,
  /** Course IDs to exclude because they are tracked via milestones (gdqp, gdtc). */
  excludeIds?: Set<string>
): SuggestionResult {
  if (!curriculumCourseIds || curriculumCourseIds.size === 0) {
    return { courses: [], reason: "no_curriculum" };
  }

  // Recursively mark all ancestors of taken courses as superseded —
  // e.g. ENG03 taken → ENG02 superseded → ENG01 superseded
  const courseMap = new Map(allCourses.map((c) => [c.id, c]));
  const supersededIds = new Set<string>();
  function markSuperseded(id: string) {
    const c = courseMap.get(id);
    if (!c) return;
    for (const pid of c.prerequisites) {
      if (!supersededIds.has(pid)) {
        supersededIds.add(pid);
        markSuperseded(pid);
      }
    }
  }
  for (const c of allCourses) {
    if (takenIds.has(c.id)) markSuperseded(c.id);
  }

  // Highest curriculum semester among courses the user has already engaged
  // with (passed OR currently in-progress) → next semester is +1. Using taken
  // (not just passed) means a student who imported only their current semester
  // still gets suggestions for the upcoming one, instead of being pinned to HK1.
  let maxSemester = 0;
  if (curriculumSemesterMap) {
    for (const id of takenIds) {
      const s = curriculumSemesterMap.get(id);
      if (s && s > maxSemester) maxSemester = s;
    }
  }
  const semesterCap = maxSemester + 1;

  const candidates = allCourses.filter((c) => curriculumCourseIds.has(c.id));

  const typeOrder: Record<string, number> = { required: 0, general: 1, elective: 2 };
  const courses = candidates
    .filter((c) => {
      if (takenIds.has(c.id) || supersededIds.has(c.id) || excludeIds?.has(c.id)) return false;
      if (!c.prerequisites.every((pid) => passedIds.has(pid))) return false;
      // Cap by curriculum semester to avoid showing every distant-semester
      // course just because its prerequisite list happens to be empty.
      const sem = curriculumSemesterMap?.get(c.id);
      if (sem !== undefined && sem > semesterCap) return false;
      return true;
    })
    .sort((a, b) => {
      const td = (typeOrder[a.course_type] ?? 3) - (typeOrder[b.course_type] ?? 3);
      return td !== 0 ? td : a.id.localeCompare(b.id);
    });

  return { courses, reason: courses.length === 0 ? "completed" : "ok" };
}

export function estimateRemainingTime(
  userCourses: UserCourseWithCourse[],
  passedCredits: number,
  total = 131
): { avgCreditsPerSem: number; remainingSemesters: number | null } {
  const semsWithPass = new Set(
    userCourses
      .filter((c) => c.semester && (c.status === "exempted" || (c.score !== null && c.score >= 5.0)))
      .map((c) => c.semester!)
  );
  const semCount = semsWithPass.size;
  if (semCount === 0 || passedCredits === 0) return { avgCreditsPerSem: 0, remainingSemesters: null };
  const avgCreditsPerSem = passedCredits / semCount;
  const remaining = total - passedCredits;
  return {
    avgCreditsPerSem: Math.round(avgCreditsPerSem * 10) / 10,
    remainingSemesters: remaining <= 0 ? 0 : Math.ceil(remaining / avgCreditsPerSem),
  };
}

export function parseSemester(raw: string): { index: number; label: string } | null {
  const m = raw.match(/^HK(\d+)-(\d{4})-(\d{4})$/);
  if (!m) return null;
  const semNum = parseInt(m[1]);
  const yearStart = parseInt(m[2]);
  return {
    index: yearStart * 10 + semNum,
    label: `HK ${semNum} · ${m[2]}–${m[3]}`,
  };
}
