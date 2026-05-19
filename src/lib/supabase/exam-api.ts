import { createClient } from "@/lib/supabase/client";
import type { ExamScheduleWithCourse, StudySessionWithExam } from "@/types/database";

// ── TYPES ───────────────────────────────────────────────

export interface UpsertExamInput {
  user_id: string;
  course_id: string;
  class_code: string | null;
  exam_period: "GK" | "CK";
  semester: string;
  academic_year: string;
  exam_date: string;
  start_time: string | null;
  exam_time_raw: string | null;
  room: string | null;
  exam_type: string | null;
}

// ── EXAM SCHEDULES ──────────────────────────────────────

export async function getExamSchedules(
  userId: string,
  semester?: string
): Promise<ExamScheduleWithCourse[]> {
  const supabase = createClient();
  let query = supabase
    .from("exam_schedules")
    .select("*, course:courses(*)")
    .eq("user_id", userId)
    .order("exam_date", { ascending: true });
  if (semester) query = query.eq("semester", semester);
  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return data as ExamScheduleWithCourse[];
}

export async function upsertExamSchedule(
  input: UpsertExamInput
): Promise<ExamScheduleWithCourse> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("exam_schedules")
    .upsert(input, { onConflict: "user_id,course_id,exam_period" })
    .select("*, course:courses(*)")
    .single();
  if (error) throw new Error(error.message);
  return data as ExamScheduleWithCourse;
}

export async function bulkUpsertExamSchedules(
  inputs: UpsertExamInput[]
): Promise<ExamScheduleWithCourse[]> {
  const results: ExamScheduleWithCourse[] = [];
  for (const input of inputs) {
    const result = await upsertExamSchedule(input);
    results.push(result);
  }
  return results;
}

export async function deleteExamSchedule(id: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.from("exam_schedules").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

// ── STUDY SESSIONS ──────────────────────────────────────

export async function getStudySessions(
  userId: string,
  examIds?: string[]
): Promise<StudySessionWithExam[]> {
  const supabase = createClient();
  let query = supabase
    .from("study_sessions")
    .select("*, exam:exam_schedules(*, course:courses(*))")
    .eq("user_id", userId)
    .order("session_date", { ascending: true });
  if (examIds && examIds.length > 0) query = query.in("exam_id", examIds);
  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return data as StudySessionWithExam[];
}

export async function bulkInsertStudySessions(
  userId: string,
  examIds: string[],
  sessions: { exam_id: string; session_date: string }[]
): Promise<void> {
  const supabase = createClient();
  // Delete existing sessions for these exams first
  if (examIds.length > 0) {
    const { error: delErr } = await supabase
      .from("study_sessions")
      .delete()
      .eq("user_id", userId)
      .in("exam_id", examIds);
    if (delErr) throw new Error(delErr.message);
  }
  // Insert new sessions
  if (sessions.length > 0) {
    const rows = sessions.map((s) => ({ user_id: userId, ...s }));
    const { error } = await supabase.from("study_sessions").insert(rows);
    if (error) throw new Error(error.message);
  }
}

export async function toggleStudySession(
  id: string,
  completed: boolean
): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase
    .from("study_sessions")
    .update({
      is_completed: completed,
      completed_at: completed ? new Date().toISOString() : null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);
  if (error) throw new Error(error.message);
}

export async function getNearestExamDays(userId: string): Promise<number | null> {
  const supabase = createClient();
  const today = new Date().toISOString().split("T")[0];
  const { data, error } = await supabase
    .from("exam_schedules")
    .select("exam_date")
    .eq("user_id", userId)
    .gte("exam_date", today)
    .order("exam_date", { ascending: true })
    .limit(1);
  if (error || !data || data.length === 0) return null;
  const examDate = new Date(data[0].exam_date);
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  return Math.ceil((examDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}
