/**
 * Client-side helper for reading curriculum data from Supabase.
 * Used by roadmap-panel and graduation tracker to get the right
 * CTĐT for a user's major + intake year.
 */

import { createClient } from "@/lib/supabase/client";
import type { Curriculum, CurriculumCourse, GraduationRequirement } from "@/types/database";

export interface CurriculumWithDetails extends Curriculum {
  courses: CurriculumCourse[];
  graduation_requirements: GraduationRequirement[];
}

/** Build curriculum ID from major + intake year e.g. "CNTT" + 2019 → "CNTT-K19" */
export function buildCurriculumId(major: string, intakeYear: number): string {
  return `${major.toUpperCase()}-K${String(intakeYear).slice(-2)}`;
}

/** Fetch full curriculum (courses + graduation requirements) for a given ID. */
export async function getCurriculum(curriculumId: string): Promise<CurriculumWithDetails | null> {
  const supabase = createClient();

  const [currRes, coursesRes, reqRes] = await Promise.all([
    supabase.from("curricula").select("*").eq("id", curriculumId).single(),
    supabase.from("curriculum_courses").select("*").eq("curriculum_id", curriculumId).order("suggested_semester"),
    supabase.from("graduation_requirements").select("*").eq("curriculum_id", curriculumId),
  ]);

  if (currRes.error || !currRes.data) return null;

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
