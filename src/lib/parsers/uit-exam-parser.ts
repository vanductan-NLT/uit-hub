export interface ParsedExam {
  course_id: string;
  class_code: string;
  exam_time_raw: string;
  start_time: string | null;
  day_of_week: number;
  exam_date: string;
  room: string;
  exam_type: string;
}

export interface ExamParseResult {
  exam_period: "GK" | "CK";
  semester: string;
  academic_year: string;
  exams: ParsedExam[];
}

const CA_TIME_MAP: Record<string, string> = {
  "1": "07:30",
  "2": "09:30",
  "3": "13:30",
  "4": "15:30",
};

function cleanText(el: Element): string {
  return (el.textContent ?? "").replace(/\s+/g, " ").trim();
}

function parseExamPeriodAndSemester(titleText: string): {
  exam_period: "GK" | "CK";
  semester: string;
  academic_year: string;
} {
  // "LỊCH THI CK 2 NĂM 2025 - 2026" or "LỊCH THI GK 1 NĂM 2025 - 2026"
  const m = titleText.match(
    /L[IỊ]CH\s+THI\s+(GK|CK)\s+(\d+)\s+N[AĂ]M\s+(\d{4})\s*[-–]\s*(\d{4})/i
  );
  if (m) {
    const period = m[1].toUpperCase() as "GK" | "CK";
    return {
      exam_period: period,
      semester: `HK${m[2]}-${m[3]}-${m[4]}`,
      academic_year: `${m[3]}-${m[4]}`,
    };
  }
  return { exam_period: "CK", semester: "", academic_year: "" };
}

function resolveStartTime(caText: string): string | null {
  const caMatch = caText.match(/Ca\s+(\d)/i);
  if (caMatch) return CA_TIME_MAP[caMatch[1]] ?? null;
  return null;
}

function parseExamDate(dateStr: string): string {
  // "11-06-2026" (dd-mm-yyyy) → "2026-06-11"
  const parts = dateStr.split("-");
  if (parts.length !== 3) return dateStr;
  return `${parts[2]}-${parts[1]}-${parts[0]}`;
}

function parseDayOfWeek(thuStr: string): number {
  // Vietnamese: Thứ 2=Monday(1), 3=Tuesday(2), ..., 7=Saturday(6), CN=Sunday(0)
  const cleaned = thuStr.replace(/[Tt]hứ\s*/g, "").trim();
  if (cleaned === "CN") return 0;
  const n = parseInt(cleaned, 10);
  return isNaN(n) ? -1 : n;
}

function findTitleText(doc: Document): string {
  const candidates = [
    ".title_thongtindangky",
    "h2.title",
    "h2",
    "h3",
    ".page-title",
    ".block-title",
    "title",
  ];
  for (const sel of candidates) {
    const el = doc.querySelector(sel);
    if (el) {
      const text = cleanText(el);
      if (/L[IỊ]CH\s+THI/i.test(text)) return text;
    }
  }
  // Scan all headings as fallback
  for (const el of Array.from(doc.querySelectorAll("h1,h2,h3,h4"))) {
    const text = cleanText(el);
    if (/L[IỊ]CH\s+THI/i.test(text)) return text;
  }
  return doc.title ?? "";
}

function findDataRows(table: Element): Element[] {
  // Try Drupal-style odd/even classes first
  const drupalRows = Array.from(table.querySelectorAll("tr.odd, tr.even"));
  if (drupalRows.length > 0) return drupalRows;

  // Fallback: all tbody rows
  const tbodyRows = Array.from(table.querySelectorAll("tbody tr"));
  if (tbodyRows.length > 0) return tbodyRows;

  // Last resort: all tr rows except the first (header)
  const allRows = Array.from(table.querySelectorAll("tr"));
  return allRows.slice(1);
}

export function parseUitExamSchedule(html: string): ExamParseResult {
  const doc = new DOMParser().parseFromString(html, "text/html");

  const titleText = findTitleText(doc);
  const { exam_period, semester, academic_year } =
    parseExamPeriodAndSemester(titleText);

  const table =
    doc.querySelector("table.sticky-enabled") ??
    doc.querySelector("table.views-table") ??
    doc.querySelector("table");
  if (!table) return { exam_period, semester, academic_year, exams: [] };

  const rows = findDataRows(table);
  const seen = new Set<string>();
  const exams: ParsedExam[] = [];

  for (const row of rows) {
    const tds = Array.from(row.querySelectorAll("td"));
    if (tds.length < 7) continue;

    const course_id = cleanText(tds[1]);
    const class_code = cleanText(tds[2]);
    const exam_time_raw = cleanText(tds[3]);
    const thuStr = cleanText(tds[4]);
    const dateStr = cleanText(tds[5]);
    const room = cleanText(tds[6]);
    const exam_type = tds.length > 7 ? cleanText(tds[7]) : "";

    if (!course_id || !dateStr) continue;
    // Skip header-like rows (course codes start with 2 letters + digit, e.g. CS101, IE103)
    if (!/^[A-Z]{2}\d/.test(course_id)) continue;

    // Deduplicate by course_id
    if (seen.has(course_id)) continue;
    seen.add(course_id);

    exams.push({
      course_id,
      class_code,
      exam_time_raw,
      start_time: resolveStartTime(exam_time_raw),
      day_of_week: parseDayOfWeek(thuStr),
      exam_date: parseExamDate(dateStr),
      room,
      exam_type,
    });
  }

  return { exam_period, semester, academic_year, exams };
}
