import type { Course, UserCourseWithCourse } from "@/types/database";

export function buildPassedIds(userCourses: UserCourseWithCourse[]): Set<string> {
  return new Set(
    userCourses
      .filter((c) => c.status === "exempted" || (c.score !== null && c.score >= 5.0))
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

export function getSuggestedCourses(
  allCourses: Course[],
  takenIds: Set<string>,
  passedIds: Set<string>
): Course[] {
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

  const typeOrder: Record<string, number> = { required: 0, general: 1, elective: 2 };
  return allCourses
    .filter((c) =>
      !takenIds.has(c.id) &&
      !supersededIds.has(c.id) &&
      c.prerequisites.every((pid) => passedIds.has(pid))
    )
    .sort((a, b) => {
      const td = (typeOrder[a.course_type] ?? 3) - (typeOrder[b.course_type] ?? 3);
      return td !== 0 ? td : a.id.localeCompare(b.id);
    });
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
