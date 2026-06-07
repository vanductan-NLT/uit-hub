/**
 * Client-side helper for reading curriculum data from Supabase.
 * Used by roadmap-panel and graduation tracker to get the right
 * CTĐT for a user's major + intake year.
 */

import { createClient } from "@/lib/supabase/client";
import type { Curriculum, CurriculumCourse, GraduationRequirement } from "@/types/database";

// Re-export the shared (server+client safe) id builder so existing imports of
// `buildCurriculumId` from this registry keep working.
export { buildCurriculumId } from "@/lib/data/curriculum-id";
import { buildCurriculumId } from "@/lib/data/curriculum-id";

export interface CurriculumWithDetails extends Curriculum {
  courses: CurriculumCourse[];
  graduation_requirements: GraduationRequirement[];
}

/** Fetch full curriculum (courses + graduation requirements) for a given ID. */
export async function getCurriculum(curriculumId: string): Promise<CurriculumWithDetails | null> {
  const supabase = createClient();

  const [currRes, coursesRes, reqRes] = await Promise.all([
    supabase.from("curricula").select("*").eq("id", curriculumId).maybeSingle(),
    supabase.from("curriculum_courses").select("*").eq("curriculum_id", curriculumId).order("suggested_semester"),
    supabase.from("graduation_requirements").select("*").eq("curriculum_id", curriculumId),
  ]);

  if (currRes.error || !currRes.data) {
    if (process.env.NODE_ENV === "development") {
      console.warn("[useCurriculum] not found:", curriculumId, currRes.error?.message);
    }
    return null;
  }

  return {
    ...(currRes.data as Curriculum),
    courses: (coursesRes.data ?? []) as CurriculumCourse[],
    graduation_requirements: (reqRes.data ?? []) as GraduationRequirement[],
  };
}

/** Fetch curriculum by user profile (major + intake_year). Returns null if not found. */
export async function getCurriculumForUser(
  major: string,
  intakeYear: number | null
): Promise<CurriculumWithDetails | null> {
  if (!intakeYear) return null;
  return getCurriculum(buildCurriculumId(major, intakeYear));
}

/** List all available curricula (for admin selector / user profile picker). */
export async function listCurricula(): Promise<Curriculum[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("curricula")
    .select("*")
    .order("intake_year_from", { ascending: false });
  if (error) return [];
  return (data ?? []) as Curriculum[];
}
