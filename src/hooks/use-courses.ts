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

// UIT grading scale (hệ 10 → hệ 4), per UIT Academic Affairs regulations
function toGrade4(score: number): number {
  if (score >= 8.5) return 4.0;
  if (score >= 8.0) return 3.5;
  if (score >= 7.0) return 3.0;
  if (score >= 6.5) return 2.5;
  if (score >= 5.5) return 2.0;
  if (score >= 5.0) return 1.5;
  if (score >= 4.0) return 1.0;
  return 0.0;
}

// GPA includes all scored courses (failed ones count against GPA), excludes exempted
export function calculateGPA10(courses: UserCourseWithCourse[]): number {
  const graded = courses.filter((c) => c.score !== null && c.status !== "exempted");
  if (graded.length === 0) return 0;
  const totalWeighted = graded.reduce((s, c) => s + (c.score! * c.course.credits), 0);
  const totalCredits = graded.reduce((s, c) => s + c.course.credits, 0);
  return totalCredits === 0 ? 0 : Math.round((totalWeighted / totalCredits) * 100) / 100;
}

export function calculateGPA4(courses: UserCourseWithCourse[]): number {
  const graded = courses.filter((c) => c.score !== null && c.status !== "exempted");
  if (graded.length === 0) return 0;
  const totalWeighted = graded.reduce((s, c) => s + (toGrade4(c.score!) * c.course.credits), 0);
  const totalCredits = graded.reduce((s, c) => s + c.course.credits, 0);
  return totalCredits === 0 ? 0 : Math.round((totalWeighted / totalCredits) * 100) / 100;
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
      const optimistic: UserCourseWithCourse = {
        id: `optimistic-${Date.now()}`,
        user_id: userId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        note: null,
        ...input,
        course: allCourses.find((c) => c.id === input.course_id)!,
      };
      setUserCourses((prev) => [...prev, optimistic]);
      try {
        const saved = await upsertUserCourse({ ...input, user_id: userId });
        setUserCourses((prev) => prev.map((c) => (c.id === optimistic.id ? saved : c)));
      } catch (e) {
        setUserCourses((prev) => prev.filter((c) => c.id !== optimistic.id));
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
    removeCourse,
    refetch: fetchAll,
  };
}
