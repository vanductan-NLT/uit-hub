"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import type { Course, CourseComponent } from "@/types/database";

const DEFAULT_COMPONENTS: CourseComponent[] = [{ name: "Cuối kỳ", weight: 1.0 }];

export async function insertCourseAdmin(input: {
  id: string;
  name: string;
  credits: number;
  components?: CourseComponent[];
}): Promise<Course> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("courses")
    .upsert(
      {
        id: input.id,
        name: input.name,
        credits: input.credits,
        course_type: "general",
        prerequisites: [],
        components: input.components ?? DEFAULT_COMPONENTS,
        is_active: true,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "id" }
    )
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data as Course;
}
