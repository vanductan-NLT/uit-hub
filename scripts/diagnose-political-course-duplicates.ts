/**
 * READ-ONLY diagnosis: find duplicate "Lý luận chính trị" (political) courses
 * that exist under both current SS codes and stale codes (MLPE*, PHIL*, etc.),
 * plus any user_courses still referencing the stale codes.
 *
 * Output informs the dedup migration mapping — no writes are performed.
 *
 * Usage: npx tsx scripts/diagnose-political-course-duplicates.ts
 * Requires SUPABASE_SERVICE_ROLE_KEY in .env.local
 */

import { createClient } from "@supabase/supabase-js";
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

/** Normalize a Vietnamese course name for matching (lowercase, strip diacritics + spaces). */
function norm(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/đ/gi, "d")
    .replace(/[^a-z0-9]/gi, "")
    .toLowerCase();
}

async function main() {
  const { data: courses, error } = await supabase
    .from("courses")
    .select("id, name, credits, is_active, equivalents");
  if (error) { console.error(error.message); process.exit(1); }

  const all = courses ?? [];

  // Group by normalized name → find names with >1 code (potential duplicates).
  const byName = new Map<string, { id: string; name: string; credits: number; is_active: boolean }[]>();
  for (const c of all) {
    const k = norm(c.name);
    if (!byName.has(k)) byName.set(k, []);
    byName.get(k)!.push(c);
  }

  const dupGroups = [...byName.values()].filter((g) => g.length > 1);

  console.log("=== Duplicate course names (same subject, multiple codes) ===");
  for (const g of dupGroups) {
    console.log(`\n• ${g[0].name}`);
    for (const c of g) {
      console.log(`    ${c.id.padEnd(8)} ${c.credits}TC  active=${c.is_active}`);
    }
  }

  // Stale political codes of interest.
  const staleRe = /^(MLPE|PHIL|MLP|POL|HCM|SOC|HIST)/i;
  const stale = all.filter((c) => staleRe.test(c.id));
  console.log("\n=== Stale-looking political codes (MLPE/PHIL/...) ===");
  for (const c of stale) {
    console.log(`    ${c.id.padEnd(8)} ${c.credits}TC  ${c.name}`);
  }

  // user_courses referencing stale codes.
  const staleIds = stale.map((c) => c.id);
  if (staleIds.length) {
    const { data: ucs } = await supabase
      .from("user_courses")
      .select("course_id")
      .in("course_id", staleIds);
    const counts = new Map<string, number>();
    for (const u of ucs ?? []) counts.set(u.course_id, (counts.get(u.course_id) ?? 0) + 1);
    console.log("\n=== user_courses referencing stale codes (course_id → count) ===");
    if (counts.size === 0) console.log("    (none)");
    for (const [id, n] of counts) console.log(`    ${id.padEnd(8)} ${n}`);
  }

  // Suggested mapping: stale code → SS code with the same normalized name.
  console.log("\n=== Suggested old→new mapping (by name match) ===");
  const ssByName = new Map<string, string>();
  for (const c of all) if (/^SS/i.test(c.id)) ssByName.set(norm(c.name), c.id);
  for (const c of stale) {
    const target = ssByName.get(norm(c.name));
    console.log(`    ${c.id.padEnd(8)} → ${target ?? "??? (no SS match — review manually)"}   (${c.name})`);
  }

  console.log("\nDone (read-only, no changes written).");
}

main();
