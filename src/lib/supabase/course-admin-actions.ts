"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import type { Course } from "@/types/database";

export async function insertCourseAdmin(input: {
  id: string;
  name: string;
  credits: number;
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
        components: [{ name: "Cuối kỳ", weight: 1.0 }],
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
