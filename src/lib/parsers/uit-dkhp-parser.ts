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
  /** Set when the file is recognizably the wrong page (e.g. an exam schedule). */
  error?: string;
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

/**
 * Resolve the name + credits column indices from the header row.
 * - Returns "exam" when the table is clearly an exam schedule (Ca/Tiết thi,
 *   Thứ thi, Ngày thi…) — the caller rejects the file instead of mis-parsing.
 * - Returns detected indices when the ĐKHP headers are found.
 * - Falls back to the stable fixed indices (name=3, credits=4) when headers
 *   can't be read, so a valid ĐKHP file never breaks on header-text variation.
 */
function detectDkhpColumns(table: Element): { nameIdx: number; creditsIdx: number } | "exam" {
  const headerCells = Array.from(table.querySelectorAll("thead th, thead td, tr:first-child th, tr:first-child td"))
    .map((c) => cleanText(c).toLowerCase());

  const looksLikeExam = headerCells.some((h) =>
    h.includes("ca/tiết") || h.includes("ca/ti") || h.includes("tiết thi") || h.includes("thứ thi") || h.includes("ngày thi") || h.includes("phòng thi")
  );
  if (looksLikeExam) return "exam";

  const nameIdx = headerCells.findIndex((h) => h.includes("tên môn") || h.includes("tên mh"));
  const creditsIdx = headerCells.findIndex((h) => h === "tc" || h.includes("số tc") || h.includes("tín chỉ"));
  return { nameIdx: nameIdx >= 0 ? nameIdx : 3, creditsIdx: creditsIdx >= 0 ? creditsIdx : 4 };
}

export function parseUitDkhp(html: string): DkhpParseResult {
  const doc = new DOMParser().parseFromString(html, "text/html");

  // Extract semester from title div
  const titleEl = doc.querySelector(".title_thongtindangky");
  const titleText = (titleEl?.textContent ?? "") + " " + (doc.title ?? "");
  const { semester, academic_year } = parseSemester(titleEl?.textContent ?? "");

  // Reject an exam-schedule file fed into the ĐKHP importer (the column layout
  // differs, so positional parsing would store "Ca 2"/"Tiết 678" as course names).
  if (/L[IỊ]CH\s+THI/i.test(titleText)) {
    return { semester, academic_year, courses: [], peCourses: [], error: "Đây là file Lịch thi, không phải ĐKHP. Hãy dùng mục \"Import lịch thi\"." };
  }

  // Target data table specifically — NOT the sticky-header table which comes first inside the form
  const table = doc.querySelector("table.sticky-enabled") ?? doc.querySelector("#uit-tracuu-dkhp-data table:last-of-type");
  if (!table) return { semester, academic_year, courses: [], peCourses: [] };

  // Resolve columns by header; reject an exam-schedule table outright.
  const cols = detectDkhpColumns(table);
  if (cols === "exam") {
    return { semester, academic_year, courses: [], peCourses: [], error: "Đây là file Lịch thi, không phải ĐKHP. Hãy dùng mục \"Import lịch thi\"." };
  }
  const { nameIdx, creditsIdx } = cols;

  const rows = Array.from(table.querySelectorAll("tr.odd, tr.even"));
  const seen = new Set<string>();
  const courses: DkhpCourse[] = [];
  const peCourses: string[] = [];

  for (const row of rows) {
    const tds = Array.from(row.querySelectorAll("td"));
    if (tds.length < 5) continue;

    const course_id = cleanText(tds[1]);
    const classCode = cleanText(tds[2]); // e.g. CS112.Q21 or CS112.Q21.1
    const course_name = cleanText(tds[nameIdx]);
    const credits = parseInt(cleanText(tds[creditsIdx]), 10);

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
