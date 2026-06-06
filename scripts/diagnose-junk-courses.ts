/**
 * READ-ONLY diagnosis: categorize ALL courses to separate canonical UIT codes
 * from synthetic/junk rows, and report which rows are referenced by
 * user_courses or curriculum_courses (must NOT deactivate those).
 *
 * Usage: npx tsx scripts/diagnose-junk-courses.ts
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

async function main() {
  // Paginate: PostgREST caps a single select at 1000 rows.
  const all: { id: string; name: string; credits: number; is_active: boolean }[] = [];
  for (let from = 0; ; from += 1000) {
    const { data, error } = await supabase
      .from("courses")
      .select("id, name, credits, is_active")
      .order("id")
      .range(from, from + 999);
    if (error) { console.error(error.message); process.exit(1); }
    all.push(...(data ?? []));
    if (!data || data.length < 1000) break;
  }

  const { data: ucs } = await supabase.from("user_courses").select("course_id");
  const refCount = new Map<string, number>();
  for (const u of ucs ?? []) refCount.set(u.course_id, (refCount.get(u.course_id) ?? 0) + 1);

  const { data: ccs } = await supabase.from("curriculum_courses").select("course_id");
  const currCount = new Map<string, number>();
  for (const c of ccs ?? []) currCount.set(c.course_id, (currCount.get(c.course_id) ?? 0) + 1);

  const refd = (id: string) => (refCount.get(id) ?? 0) > 0 || (currCount.get(id) ?? 0) > 0;

  // Family classifiers for the cleanup decision.
  const families: Record<string, RegExp> = {
    "impossible-credit (>10TC)": /.*/, // special-cased below
    "CNBU*": /^CNBU/,
    "CSBU*": /^CSBU/,
    "MSIS*": /^MSIS/,
    "ACCT/MKTG/ECON/BUS/IEM/SPCH 4-digit (foreign business)": /^(ACCT|MKTG|ECON|BUS|IEM|SPCH)\d{4}$/,
    "CS/IS/CE 4-digit (foreign CS)": /^(CS|IS|CE)\d{4}$/,
    "MATH/PHYS/STAT/ENGL 4-digit (foreign basics)": /^(MATH|PHYS|STAT|ENGL)\d{4}$/,
    "mnemonic seeds (OSYS/DSAL/OOPT/CNET/CARC/DBSS/CSC/WINP/ECE)": /^(OSYS|DSAL|OOPT|CNET|CARC|DBSS|CSC|WINP|ECE|CSKI)\d*$/,
  };

  console.log("=== Family breakdown (active rows only) ===");
  for (const [label, re] of Object.entries(families)) {
    let rows = all.filter((c) => c.is_active);
    rows = label.startsWith("impossible")
      ? rows.filter((c) => c.credits > 10)
      : rows.filter((c) => re.test(c.id));
    const total = rows.length;
    const referenced = rows.filter((c) => refd(c.id));
    console.log(`  ${label.padEnd(58)} count=${String(total).padStart(3)}  referenced=${referenced.length}` +
      (referenced.length ? `  [${referenced.map((c) => c.id).join(", ")}]` : ""));
  }

  console.log("\n=== Exact ID list: CNBU* / CSBU* / MSIS* (user-named junk, active) ===");
  const named = all
    .filter((c) => c.is_active && /^(CNBU|CSBU|MSIS)/.test(c.id))
    .sort((a, b) => a.id.localeCompare(b.id));
  const namedSafe = named.filter((c) => !refd(c.id));
  const namedBlocked = named.filter((c) => refd(c.id));
  console.log(`Total: ${named.length}  |  safe (0 refs): ${namedSafe.length}  |  blocked: ${namedBlocked.length}`);
  console.log("SAFE IDS:", namedSafe.map((c) => c.id).join(", "));
  if (namedBlocked.length) console.log("BLOCKED:", namedBlocked.map((c) => `${c.id}(u${refCount.get(c.id) ?? 0}/c${currCount.get(c.id) ?? 0})`).join(", "));

  console.log("\n=== Exact ID list: impossible-credit (>10TC, active) ===");
  const imp = all.filter((c) => c.is_active && c.credits > 10).sort((a, b) => a.id.localeCompare(b.id));
  console.log(`Total: ${imp.length}  |  all 0-ref: ${imp.every((c) => !refd(c.id))}`);
  console.log("IDS:", imp.map((c) => `${c.id}(${c.credits})`).join(", "));

  console.log("\nDone (read-only, no changes written).");
}

main();
