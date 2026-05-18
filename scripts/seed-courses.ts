/**
 * Seed UIT course catalog from courses-weighted.json into Supabase.
 * Uses service role key to bypass RLS — run once after migration.
 *
 * Usage:
 *   npx tsx scripts/seed-courses.ts [path/to/courses-weighted.json]
 *
 * Requires SUPABASE_SERVICE_ROLE_KEY in .env.local
 */

import { createClient } from "@supabase/supabase-js";
import * as fs from "fs";
import * as path from "path";
import * as dotenv from "dotenv";

dotenv.config({ path: path.join(process.cwd(), ".env.local") });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

// Map courseType string → DB enum value
function mapCourseType(raw: string): "general" | "required" | "elective" {
  switch (raw) {
    case "ĐC": return "general";
    case "CSNN":
    case "CSN":
    case "TN": return "required";
    case "CN":
    case "CNTC":
    case "CĐTN":
    default: return "elective";
  }
}

interface RawCourse {
  courseCode: string;
  courseNameVi: string;
  courseNameEn?: string;
  courseType: string;
  credits: number;
  defaultWeights: {
    progressWeight: number;
    practiceWeight: number;
    midtermWeight: number;
    finalTermWeight: number;
  };
}

interface CourseComponent {
  name: string;
  weight: number;
}

function buildComponents(weights: RawCourse["defaultWeights"]): CourseComponent[] {
  const map: [keyof RawCourse["defaultWeights"], string][] = [
    ["progressWeight", "Quá trình"],
    ["practiceWeight", "Thực hành"],
    ["midtermWeight", "Giữa kỳ"],
    ["finalTermWeight", "Cuối kỳ"],
  ];
  return map
    .filter(([key]) => weights[key] > 0)
    .map(([key, name]) => ({ name, weight: weights[key] }));
}

async function main() {
  const dataPath =
    process.argv[2] ??
    path.join(process.cwd(), "scripts", "data", "courses-weighted.json");

  if (!fs.existsSync(dataPath)) {
    console.error(`File not found: ${dataPath}`);
    console.error("Place courses-weighted.json in scripts/data/ or pass the path as argument.");
    process.exit(1);
  }

  const raw: RawCourse[] = JSON.parse(fs.readFileSync(dataPath, "utf-8"));

  const rows = raw.map((c) => ({
    id: c.courseCode,
    name: c.courseNameVi,
    name_en: c.courseNameEn ?? null,
    credits: c.credits,
    course_type: mapCourseType(c.courseType),
    components: buildComponents(c.defaultWeights),
    prerequisites: [],
    is_active: true,
  }));

  console.log(`Upserting ${rows.length} courses...`);

  const { data, error } = await supabase
    .from("courses")
    .upsert(rows, { onConflict: "id" })
    .select("id");

  if (error) {
    console.error("Upsert failed:", error.message);
    process.exit(1);
  }

  console.log(`✓ Seeded ${data?.length ?? 0} courses successfully.`);
}

main();
