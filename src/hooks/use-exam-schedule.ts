"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import type { ExamScheduleWithCourse, StudySessionWithExam, UserCourseWithCourse } from "@/types/database";
import {
  getExamSchedules,
  getStudySessions,
  toggleStudySession as apiToggle,
  bulkUpsertExamSchedules,
  bulkInsertStudySessions,
  deleteExamSchedule as apiDelete,
  type UpsertExamInput,
} from "@/lib/supabase/exam-api";
import { generateStudySessions, getExamCountdown, getStudyProgress, getUrgencyLevel } from "@/lib/exam-schedule-utils";

export interface ExamWithProgress extends ExamScheduleWithCourse {
  daysLeft: number;
  progress: { total: number; completed: number; percentage: number };
  urgency: "red" | "amber" | "green";
  sessions: StudySessionWithExam[];
}

export function useExamSchedule(userId: string, userCourses: UserCourseWithCourse[]) {
  const [exams, setExams] = useState<ExamScheduleWithCourse[]>([]);
  const [sessions, setSessions] = useState<StudySessionWithExam[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    setLoading(true);
    try {
      const [e, s] = await Promise.all([
        getExamSchedules(userId),
        getStudySessions(userId),
      ]);
      setExams(e);
      setSessions(s);
    } catch {
      // silently fail — empty state is fine
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => { fetch(); }, [fetch]);

  // Enrich exams with progress/urgency
  const examsWithProgress = useMemo((): ExamWithProgress[] => {
    return exams.map((exam) => {
      const examSessions = sessions.filter((s) => s.exam_id === exam.id);
      const daysLeft = getExamCountdown(exam.exam_date);
      const progress = getStudyProgress(examSessions);
      const urgency = getUrgencyLevel(daysLeft, progress.percentage);
      return { ...exam, daysLeft, progress, urgency, sessions: examSessions };
    }).sort((a, b) => a.exam_date.localeCompare(b.exam_date));
  }, [exams, sessions]);

  const nearestExam = useMemo(() => {
    return examsWithProgress.find((e) => e.daysLeft >= 0) ?? null;
  }, [examsWithProgress]);

  const todaySessions = useMemo(() => {
    const today = new Date().toISOString().split("T")[0];
    return sessions
      .filter((s) => s.session_date === today)
      .sort((a, b) => {
        const examA = exams.find((e) => e.id === a.exam_id);
        const examB = exams.find((e) => e.id === b.exam_id);
        if (!examA || !examB) return 0;
        return examA.exam_date.localeCompare(examB.exam_date);
      });
  }, [sessions, exams]);

  const stats = useMemo(() => {
    const total = sessions.length;
    const completed = sessions.filter((s) => s.is_completed).length;
    return { totalSessions: total, completedSessions: completed };
  }, [sessions]);

  const toggleSession = useCallback(async (sessionId: string) => {
    const session = sessions.find((s) => s.id === sessionId);
    if (!session) return;
    const newVal = !session.is_completed;
    // Optimistic update
    setSessions((prev) =>
      prev.map((s) =>
        s.id === sessionId
          ? { ...s, is_completed: newVal, completed_at: newVal ? new Date().toISOString() : null }
          : s
      )
    );
    try {
      await apiToggle(sessionId, newVal);
    } catch {
      setSessions((prev) =>
        prev.map((s) => (s.id === sessionId ? { ...s, is_completed: !newVal, completed_at: null } : s))
      );
    }
  }, [sessions]);

  const importExams = useCallback(async (inputs: UpsertExamInput[]) => {
    const newExams = await bulkUpsertExamSchedules(inputs);
    const generated = generateStudySessions(newExams, userCourses);
    const examIds = newExams.map((e) => e.id);
    await bulkInsertStudySessions(userId, examIds, generated);
    await fetch();
    return { examCount: newExams.length, sessionCount: generated.length };
  }, [userId, userCourses, fetch]);

  const deleteExam = useCallback(async (examId: string) => {
    await apiDelete(examId);
    setExams((prev) => prev.filter((e) => e.id !== examId));
    setSessions((prev) => prev.filter((s) => s.exam_id !== examId));
  }, []);

  const regenerateSessions = useCallback(async () => {
    if (exams.length === 0) return;
    const generated = generateStudySessions(exams, userCourses);
    const examIds = exams.map((e) => e.id);
    await bulkInsertStudySessions(userId, examIds, generated);
    await fetch();
  }, [exams, userCourses, userId, fetch]);

  return {
    exams: examsWithProgress,
    sessions,
    loading,
    nearestExam,
    todaySessions,
    stats,
    toggleSession,
    importExams,
    deleteExam,
    regenerateSessions,
    refetch: fetch,
  };
}
