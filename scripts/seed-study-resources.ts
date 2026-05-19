/**
 * Seed study resources from study-resources-seed.json into Supabase.
 * Uses service role key to bypass RLS.
 *
 * Usage: npx tsx scripts/seed-study-resources.ts
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

interface SeedResource {
  course_id: string;
  title: string;
  description: string;
  url: string;
  resource_type: string;
  source: string;
}

async function main() {
  const dataPath = path.join(process.cwd(), "src", "lib", "data", "study-resources-seed.json");

  if (!fs.existsSync(dataPath)) {
    console.error(`File not found: ${dataPath}`);
    process.exit(1);
  }

  const raw: SeedResource[] = JSON.parse(fs.readFileSync(dataPath, "utf-8"));

  const rows = raw.map((r) => ({
    ...r,
    status: "published",
    submitted_by: null,
    admin_note: null,
  }));

  console.log(`Upserting ${rows.length} study resources...`);

  const { data, error } = await supabase
    .from("study_resources")
    .upsert(rows, { onConflict: "id" })
    .select("id");

  if (error) {
    console.error("Upsert failed:", error.message);
    process.exit(1);
  }

  console.log(`Done: seeded ${data?.length ?? 0} study resources.`);
}

main();
