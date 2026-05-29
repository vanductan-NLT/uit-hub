export interface DkhpCourse {
  course_id: string;
  course_name: string;
  credits: number;
  semester: string;
  academic_year: string;
}

export interface DkhpParseResult {
  semester: string;
  academic_year: string;
  courses: DkhpCourse[];
  peCourses: string[]; // PE course IDs detected (0-credit GDTC courses)
}

function parseSemester(titleText: string): { semester: string; academic_year: string } {
  // "THÔNG TIN ĐĂNG KÝ HỌC PHẦN HỌC KỲ 2 NĂM 2025 - 2026"
  const m = titleText.match(/H[OỌ]C K[YỲ]\s+(\d+)\s+N[AĂ]M\s+(\d{4})\s*[-–]\s*(\d{4})/i);
  if (m) {
    return {
      semester: `HK${m[1]}-${m[2]}-${m[3]}`,
      academic_year: `${m[2]}-${m[3]}`,
    };
  }
  return { semester: "", academic_year: "" };
}

function cleanText(el: Element): string {
  return (el.textContent ?? "").replace(/\s+/g, " ").trim();
}

export function parseUitDkhp(html: string): DkhpParseResult {
  const doc = new DOMParser().parseFromString(html, "text/html");

  // Extract semester from title div
  const titleEl = doc.querySelector(".title_thongtindangky");
  const { semester, academic_year } = parseSemester(titleEl?.textContent ?? "");

  // Target data table specifically — NOT the sticky-header table which comes first inside the form
  const table = doc.querySelector("table.sticky-enabled") ?? doc.querySelector("#uit-tracuu-dkhp-data table:last-of-type");
  if (!table) return { semester, academic_year, courses: [], peCourses: [] };

  const rows = Array.from(table.querySelectorAll("tr.odd, tr.even"));
  const seen = new Set<string>();
  const courses: DkhpCourse[] = [];
  const peCourses: string[] = [];

  for (const row of rows) {
    const tds = Array.from(row.querySelectorAll("td"));
    if (tds.length < 5) continue;

    const course_id = cleanText(tds[1]);
    const classCode = cleanText(tds[2]); // e.g. CS112.Q21 or CS112.Q21.1
    const course_name = cleanText(tds[3]);
    const credits = parseInt(cleanText(tds[4]), 10);

    if (!course_id) continue;

    // Detect GDTC/PE courses (0 credits, PE prefix) — track separately, don't import as user_course
    if (isNaN(credits) || credits === 0) {
      if (course_id.startsWith("PE") && !peCourses.includes(course_id)) {
        peCourses.push(course_id);
      }
      continue;
    }

    // Accumulate lab sub-section credits into parent course instead of discarding
    const dotCount = (classCode.match(/\./g) ?? []).length;
    if (dotCount >= 2) {
      const parent = courses.find((c) => c.course_id === course_id);
      if (parent && credits > 0) parent.credits += credits;
      continue;
    }

    // Deduplicate by course_id (keep first occurrence)
    if (seen.has(course_id)) continue;
    seen.add(course_id);

    courses.push({ course_id, course_name, credits, semester, academic_year });
  }

  return { semester, academic_year, courses, peCourses };
}
