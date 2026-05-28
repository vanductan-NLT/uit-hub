"use client";

import { useState, useEffect, useCallback } from "react";
import type { Course, UserCourseWithCourse } from "@/types/database";
import {
  getAllCourses,
  getUserCourses,
  upsertUserCourse,
  updateUserCourse,
  deleteUserCourse,
  type UpsertUserCourseInput,
} from "@/lib/supabase/courses-api";

// ── GPA helpers ───────────────────────────────────────────

// GPA includes all scored courses (failed ones count against GPA), excludes exempted
export function calculateGPA10(courses: UserCourseWithCourse[]): number {
  const graded = courses.filter((c) => c.score !== null && c.status !== "exempted");
  if (graded.length === 0) return 0;
  const totalWeighted = graded.reduce((s, c) => s + (c.score! * c.course.credits), 0);
  const totalCredits = graded.reduce((s, c) => s + c.course.credits, 0);
  return totalCredits === 0 ? 0 : Math.round((totalWeighted / totalCredits) * 100) / 100;
}

// GPA4 = GPA10 / 2.5 (Quamon/SVUIT linear formula)
export function calculateGPA4(courses: UserCourseWithCourse[]): number {
  return Math.round((calculateGPA10(courses) / 2.5) * 100) / 100;
}

// Tín chỉ tích lũy: môn đạt (≥ 4.0, tức D trở lên theo thang UIT) hoặc miễn
export function calculatePassedCredits(courses: UserCourseWithCourse[]): number {
  return courses
    .filter((c) => c.status === "exempted" || (c.score !== null && c.score >= 4.0 && c.status === "completed"))
    .reduce((s, c) => s + c.course.credits, 0);
}

// ── Hook ──────────────────────────────────────────────────

export interface UseCourseState {
  userCourses: UserCourseWithCourse[];
  allCourses: Course[];
  loading: boolean;
  error: string | null;
  gpa10: number;
  gpa4: number;
  passedCredits: number;
  addCourse: (input: Omit<UpsertUserCourseInput, "user_id">) => Promise<void>;
  editCourse: (id: string, patch: Parameters<typeof updateUserCourse>[1]) => Promise<void>;
  updateComponentScores: (id: string, scores: Record<string, number | null>) => Promise<void>;
  removeCourse: (id: string) => Promise<void>;
  refetch: () => Promise<void>;
}

export function useCourses(userId: string): UseCourseState {
  const [userCourses, setUserCourses] = useState<UserCourseWithCourse[]>([]);
  const [allCourses, setAllCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAll = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    setError(null);
    try {
      const [uc, ac] = await Promise.all([getUserCourses(userId), getAllCourses()]);
      setUserCourses(uc);
      setAllCourses(ac);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const addCourse = useCallback(
    async (input: Omit<UpsertUserCourseInput, "user_id">) => {
      // Optimistic insert only when the course is in the local catalog. Freshly
      // imported courses (e.g. from DKHP) aren't in allCourses yet — skip the
      // optimistic row to avoid a render with an undefined course, and rely on
      // the saved row (which carries the joined course) instead.
      const localCourse = allCourses.find((c) => c.id === input.course_id);
      const optimisticId = `optimistic-${Date.now()}`;
      if (localCourse) {
        const optimistic: UserCourseWithCourse = {
          id: optimisticId,
          user_id: userId,
          course_id: input.course_id,
          score: input.score,
          semester: input.semester,
          academic_year: input.academic_year ?? null,
          status: input.status,
          component_scores: input.component_scores ?? {},
          note: input.note ?? null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          course: localCourse,
        };
        setUserCourses((prev) => [...prev, optimistic]);
      }
      try {
        const saved = await upsertUserCourse({ ...input, user_id: userId });
        setUserCourses((prev) => [
          ...prev.filter((c) => c.id !== optimisticId && c.id !== saved.id),
          saved,
        ]);
      } catch (e) {
        setUserCourses((prev) => prev.filter((c) => c.id !== optimisticId));
        throw e;
      }
    },
    [userId, allCourses]
  );

  const editCourse = useCallback(
    async (id: string, patch: Parameters<typeof updateUserCourse>[1]) => {
      setUserCourses((prev) =>
        prev.map((c) => (c.id === id ? { ...c, ...patch } : c))
      );
      try {
        const updated = await updateUserCourse(id, patch);
        setUserCourses((prev) => prev.map((c) => (c.id === id ? updated : c)));
      } catch (e) {
        await fetchAll(); // rollback
        throw e;
      }
    },
    [fetchAll]
  );

  const updateComponentScores = useCallback(
    async (id: string, scores: Record<string, number | null>) => {
      await editCourse(id, { component_scores: scores });
    },
    [editCourse]
  );

  const removeCourse = useCallback(
    async (id: string) => {
      const snapshot = userCourses;
      setUserCourses((prev) => prev.filter((c) => c.id !== id));
      try {
        await deleteUserCourse(id);
      } catch (e) {
        setUserCourses(snapshot); // rollback
        throw e;
      }
    },
    [userCourses]
  );

  return {
    userCourses,
    allCourses,
    loading,
    error,
    gpa10: calculateGPA10(userCourses),
    gpa4: calculateGPA4(userCourses),
    passedCredits: calculatePassedCredits(userCourses),
    addCourse,
    editCourse,
    updateComponentScores,
    removeCourse,
    refetch: fetchAll,
  };
}
