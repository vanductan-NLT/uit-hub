import type { ExamScheduleWithCourse, UserCourseWithCourse } from "@/types/database";
import { getRiskScore } from "@/lib/gpa-forecast-utils";

const MAX_SESSIONS_PER_DAY = 3;

// ── Session Generation ──────────────────────────────────

export interface GeneratedSession {
  exam_id: string;
  session_date: string;
}

export function generateStudySessions(
  exams: ExamScheduleWithCourse[],
  userCourses: UserCourseWithCourse[]
): GeneratedSession[] {
  if (exams.length === 0) return [];

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const courseMap = new Map(userCourses.map((uc) => [uc.course_id, uc]));
  const examDates = new Set(exams.map((e) => e.exam_date));

  // Compute weight per exam: credits × riskFactor
  const weighted = exams
    .filter((e) => new Date(e.exam_date) > today)
    .map((e) => {
      const uc = courseMap.get(e.course_id);
      const risk = uc ? getRiskScore(uc) : e.course.credits * 10;
      const weight = Math.max(1, risk);
      return { exam: e, weight };
    });

  const totalWeight = weighted.reduce((s, w) => s + w.weight, 0);
  if (totalWeight === 0) return [];

  // Count total available slots from today to last exam
  const lastExamDate = new Date(
    Math.max(...weighted.map((w) => new Date(w.exam.exam_date).getTime()))
  );
  let totalDays = 0;
  const d = new Date(today);
  while (d < lastExamDate) {
    const iso = toISO(d);
    if (!examDates.has(iso)) totalDays++;
    d.setDate(d.getDate() + 1);
  }
  const totalSlots = totalDays * MAX_SESSIONS_PER_DAY;

  // Track daily usage across all exams
  const dayUsage = new Map<string, number>();
  const allSessions: GeneratedSession[] = [];

  // Sort by exam date ascending (nearest first gets priority)
  const sorted = [...weighted].sort(
    (a, b) => new Date(a.exam.exam_date).getTime() - new Date(b.exam.exam_date).getTime()
  );

  for (const { exam, weight } of sorted) {
    const count = Math.max(1, Math.round((weight / totalWeight) * totalSlots));
    const examDate = new Date(exam.exam_date);
    let placed = 0;

    // Walk backwards from day before exam
    const cursor = new Date(examDate);
    cursor.setDate(cursor.getDate() - 1);

    while (placed < count && cursor >= today) {
      const iso = toISO(cursor);
      const used = dayUsage.get(iso) ?? 0;

      if (!examDates.has(iso) && used < MAX_SESSIONS_PER_DAY) {
        allSessions.push({ exam_id: exam.id, session_date: iso });
        dayUsage.set(iso, used + 1);
        placed++;
      }
      cursor.setDate(cursor.getDate() - 1);
    }
  }

  return allSessions.sort((a, b) => a.session_date.localeCompare(b.session_date));
}

// ── Helpers ─────────────────────────────────────────────

function toISO(d: Date): string {
  return d.toISOString().split("T")[0];
}

export function getExamCountdown(examDate: string): number {
  const exam = new Date(examDate);
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  return Math.ceil((exam.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

export function getStudyProgress(sessions: { is_completed: boolean }[]): {
  total: number;
  completed: number;
  percentage: number;
} {
  const total = sessions.length;
  const completed = sessions.filter((s) => s.is_completed).length;
  return { total, completed, percentage: total > 0 ? Math.round((completed / total) * 100) : 0 };
}

export type UrgencyLevel = "red" | "amber" | "green";

export function getUrgencyLevel(daysLeft: number, progressPct: number): UrgencyLevel {
  if (daysLeft <= 3) return "red";
  if (daysLeft <= 7 && progressPct < 30) return "red";
  if (daysLeft <= 14 && progressPct < 50) return "amber";
  return "green";
}

export function getExamStats(
  sessions: { is_completed: boolean }[]
): { totalSessions: number; completedSessions: number; completionPct: number } {
  const totalSessions = sessions.length;
  const completedSessions = sessions.filter((s) => s.is_completed).length;
  const completionPct = totalSessions > 0 ? Math.round((completedSessions / totalSessions) * 100) : 0;
  return { totalSessions, completedSessions, completionPct };
}
