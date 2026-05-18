import { createClient } from "@/lib/supabase/client";
import type { Course, UserCourseWithCourse, UserProfile } from "@/types/database";

// ── COURSES ──────────────────────────────────────────────

export async function getAllCourses(): Promise<Course[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("courses")
    .select("*")
    .eq("is_active", true)
    .order("id");
  if (error) throw new Error(error.message);
  return data as Course[];
}

// ── USER COURSES ──────────────────────────────────────────

export async function getUserCourses(userId: string): Promise<UserCourseWithCourse[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("user_courses")
    .select("*, course:courses(*)")
    .eq("user_id", userId)
    .order("created_at", { ascending: true });
  if (error) throw new Error(error.message);
  return data as UserCourseWithCourse[];
}

export interface UpsertUserCourseInput {
  user_id: string;
  course_id: string;
  score: number | null;
  semester: string | null;
  academic_year: string | null;
  status: "completed" | "in_progress" | "failed";
  component_scores?: Record<string, number | null>;
  note?: string | null;
}

export async function upsertUserCourse(input: UpsertUserCourseInput): Promise<UserCourseWithCourse> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("user_courses")
    .upsert(input, { onConflict: "user_id,course_id" })
    .select("*, course:courses(*)")
    .single();
  if (error) throw new Error(error.message);
  return data as UserCourseWithCourse;
}

export async function updateUserCourse(
  id: string,
  patch: Partial<Pick<UpsertUserCourseInput, "score" | "semester" | "academic_year" | "status" | "component_scores" | "note">>
): Promise<UserCourseWithCourse> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("user_courses")
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select("*, course:courses(*)")
    .single();
  if (error) throw new Error(error.message);
  return data as UserCourseWithCourse;
}

export async function deleteUserCourse(id: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.from("user_courses").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

// ── USER PROFILE ──────────────────────────────────────────

export async function getUserProfile(userId: string): Promise<UserProfile | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("user_profiles")
    .select("*")
    .eq("id", userId)
    .single();
  if (error?.code === "PGRST116") return null; // not found
  if (error) throw new Error(error.message);
  return data as UserProfile;
}

export interface UpsertUserProfileInput {
  id: string;
  student_id?: string | null;
  full_name?: string | null;
  major?: string;
  intake_year?: number | null;
  target_graduation_year?: number | null;
  total_credits_required?: number;
}

export async function upsertUserProfile(input: UpsertUserProfileInput): Promise<UserProfile> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("user_profiles")
    .upsert({ ...input, updated_at: new Date().toISOString() }, { onConflict: "id" })
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data as UserProfile;
}
