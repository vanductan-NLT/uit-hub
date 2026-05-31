"use server";

/**
 * Server-side API for Phase 2 data imports.
 * Uses service-role admin client to bypass RLS — only callable from Server Actions.
 */

import { createAdminClient } from "@/lib/supabase/admin";
import type { CatalogCourse } from "@/lib/parsers/uit-course-catalog-parser";
import type { CtdtParseResult } from "@/lib/parsers/uit-ctdt-parser";
import type { Curriculum, GraduationRequirement } from "@/types/database";

// ── Course catalog upsert ──────────────────────────────────────────────────────

export interface CatalogImportResult {
  upserted: number;
  errors: string[];
}

/**
 * Bulk-upsert parsed catalog courses into `courses` table.
 * Only writes the 4 augmentation columns (prerequisites, equivalents,
 * course_group, credits) — does NOT overwrite component weights.
 */
export async function upsertCatalogCourses(
  courses: CatalogCourse[]
): Promise<CatalogImportResult> {
  if (courses.length === 0) return { upserted: 0, errors: [] };

  const supabase = createAdminClient();
  const errors: string[] = [];
  const BATCH = 100;
  let upserted = 0;

  // Map course_group (ĐC/CSN/CN/CNTC) → course_type enum for backward compat
  function toCourseType(group: string): "general" | "required" | "elective" {
    const g = group.toUpperCase();
    if (g === "ĐC") return "general";
    if (g === "CSN" || g === "CN" || g === "BB") return "required";
    return "elective";
  }

  for (let i = 0; i < courses.length; i += BATCH) {
    const batch = courses.slice(i, i + BATCH).map((c) => ({
      id: c.id,
      name: c.name,
      name_en: c.name_en,
      credits: c.credits,
      course_type: toCourseType(c.course_group),
      course_group: c.course_group,
      prerequisites: c.prerequisites,
      equivalents: c.equivalents,
      is_active: true,
      updated_at: new Date().toISOString(),
    }));

    const { error } = await supabase
      .from("courses")
      .upsert(batch, { onConflict: "id" });

    if (error) {
      errors.push(`Batch ${i / BATCH + 1}: ${error.message}`);
    } else {
      upserted += batch.length;
    }
  }

  return { upserted, errors };
}

// ── Curriculum (CTĐT) upsert ───────────────────────────────────────────────────

export interface CtdtImportResult {
  curriculumId: string;
  coursesLinked: number;
  errors: string[];
}

/**
 * Upsert a parsed CTĐT result into curricula + curriculum_courses + graduation_requirements.
 * curriculumId format: "{MAJOR}-K{intakeYear-2000}" e.g. "CNTT-K19"
 */
export async function upsertCurriculum(
  data: CtdtParseResult
): Promise<CtdtImportResult> {
  const supabase = createAdminClient();
  const errors: string[] = [];

  const curriculumId = `${data.major.toUpperCase()}-K${String(data.intake_year_from).slice(-2)}`;

  // 1. Upsert curriculum row
  const curriculum: Omit<Curriculum, "created_at" | "updated_at"> & { updated_at: string } = {
    id: curriculumId,
    major: data.major,
    intake_year_from: data.intake_year_from,
    total_credits_required: data.total_credits_required,
    general_credits: data.general_credits,
    foundation_credits: data.foundation_credits,
    major_required_credits: data.major_required_credits,
    major_elective_credits: data.major_elective_credits,
    updated_at: new Date().toISOString(),
  };

  const { error: cErr } = await supabase
    .from("curricula")
    .upsert(curriculum, { onConflict: "id" });

  if (cErr) {
    errors.push(`Curricula upsert: ${cErr.message}`);
    return { curriculumId, coursesLinked: 0, errors };
  }

  // 2. Upsert curriculum_courses (batch)
  const BATCH = 100;
  let coursesLinked = 0;
  const rows = data.courses.map((c) => ({
    curriculum_id: curriculumId,
    course_id: c.course_id,
    requirement_type: c.requirement_type,
    suggested_semester: c.suggested_semester,
    elective_group_key: c.elective_group_key,
    group_required_credits: c.group_required_credits,
  }));

  for (let i = 0; i < rows.length; i += BATCH) {
    const { error } = await supabase
      .from("curriculum_courses")
      .upsert(rows.slice(i, i + BATCH), { onConflict: "curriculum_id,course_id" });

    if (error) {
      errors.push(`Curriculum courses batch ${i / BATCH + 1}: ${error.message}`);
    } else {
      coursesLinked += Math.min(BATCH, rows.length - i);
    }
  }

  // 3. Seed default graduation_requirements
  const defaults: Omit<GraduationRequirement, never>[] = [
    { curriculum_id: curriculumId, key: "english",       label: "Tiếng Anh (TOEIC 450+)",    threshold_value: 450, unit: "score" },
    { curriculum_id: curriculumId, key: "gdqp",          label: "Giáo dục quốc phòng",       threshold_value: null, unit: "boolean" },
    { curriculum_id: curriculumId, key: "gdtc",          label: "Giáo dục thể chất",         threshold_value: null, unit: "boolean" },
    { curriculum_id: curriculumId, key: "total_credits", label: "Tổng tín chỉ",               threshold_value: data.total_credits_required, unit: "credits" },
    { curriculum_id: curriculumId, key: "gpa_min",       label: "GPA tối thiểu (thang 4)",   threshold_value: 2.0, unit: "score" },
  ];

  const { error: rErr } = await supabase
    .from("graduation_requirements")
    .upsert(defaults, { onConflict: "curriculum_id,key" });

  if (rErr) errors.push(`Graduation requirements: ${rErr.message}`);

  return { curriculumId, coursesLinked, errors };
}
