"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import type { Course, CourseComponent } from "@/types/database";

const DEFAULT_COMPONENTS: CourseComponent[] = [{ name: "Cuối kỳ", weight: 1.0 }];

/**
 * Insert a course only if it doesn't already exist. Never overwrites an
 * existing catalog row — a schedule/transcript import must not be able to
 * clobber a course's canonical name/credits/type (which is how an exam file
 * mis-imported as ĐKHP renamed SS008 to "Ca 2").
 */
export async function insertCourseAdmin(input: {
  id: string;
  name: string;
  credits: number;
  components?: CourseComponent[];
}): Promise<Course> {
  const supabase = createAdminClient();

  const { data: existing } = await supabase
    .from("courses")
    .select("*")
    .eq("id", input.id)
    .maybeSingle();
  if (existing) return existing as Course;

  const { data, error } = await supabase
    .from("courses")
    .insert({
      id: input.id,
      name: input.name,
      credits: input.credits,
      course_type: "general",
      prerequisites: [],
      components: input.components ?? DEFAULT_COMPONENTS,
      is_active: true,
      updated_at: new Date().toISOString(),
    })
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data as Course;
}
