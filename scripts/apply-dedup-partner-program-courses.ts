/**
 * Apply 20260607_003_dedup_partner_program_courses.sql via the service-role
 * client (no direct psql connection string is provisioned for this project).
 * Idempotent + reversible: deactivates only currently-active CNBU / CSBU /
 * MSIS rows. Re-run safely; pass `--rollback` to reactivate.
 *
 * Usage: npx tsx scripts/apply-dedup-partner-program-courses.ts [--rollback]
 */

import { createClient } from "@supabase/supabase-js";
import * as path from "path";
import * as dotenv from "dotenv";

dotenv.config({ path: path.join(process.cwd(), ".env.local") });
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const ROLLBACK = process.argv.includes("--rollback");
const PREFIXES = ["CNBU", "CSBU", "MSIS"];

async function main() {
  // Pre-flight: safety re-check — no user_courses / curriculum_courses refs.
  const { data: targets } = await supabase
    .from("courses")
    .select("id")
    .or(PREFIXES.map((p) => `id.like.${p}%`).join(","))
    .eq("is_active", ROLLBACK ? false : true);
  const ids = (targets ?? []).map((r) => r.id);
  console.log(`${ROLLBACK ? "Reactivating" : "Deactivating"} ${ids.length} rows.`);
  if (ids.length === 0) { console.log("Nothing to do."); return; }

  const { data: uc } = await supabase.from("user_courses").select("course_id").in("course_id", ids);
  const { data: cc } = await supabase.from("curriculum_courses").select("course_id").in("course_id", ids);
  if (!ROLLBACK && ((uc?.length ?? 0) > 0 || (cc?.length ?? 0) > 0)) {
    console.error("ABORT: some targets are referenced:", uc, cc);
    process.exit(1);
  }

  const { data: updated, error } = await supabase
    .from("courses")
    .update({ is_active: ROLLBACK, updated_at: new Date().toISOString() })
    .in("id", ids)
    .select("id");
  if (error) { console.error(error.message); process.exit(1); }
  console.log(`Done. Rows updated: ${updated?.length ?? 0}`);
}

main();
