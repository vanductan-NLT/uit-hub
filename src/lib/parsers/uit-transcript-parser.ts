export interface ParsedCourse {
  course_id: string;
  course_name: string;
  credits: number;
  score: number | null;
  status: "completed" | "exempted" | "failed";
  semester: string;       // "HK1-2025-2026"
  academic_year: string;  // "2025-2026"
}

export interface ParseResult {
  student: {
    full_name: string;
    student_id: string;
    major: string;
    class_name: string;
  };
  courses: ParsedCourse[];
  summary: {
    total_credits_studied: number;
    total_credits_accumulated: number;
    gpa: number;
    gpa_accumulated: number;
  };
}

function cleanText(el: Element | null): string {
  if (!el) return "";
  return el.textContent?.replace(/ /g, " ").trim() ?? "";
}

function parseStudentInfo(tables: HTMLCollectionOf<HTMLTableElement>) {
  const rows = tables[0]?.querySelectorAll("tr") ?? [];
  const get = (row: Element, tdIndex: number) =>
    cleanText(row.querySelectorAll("td")[tdIndex]?.querySelector("strong") ?? row.querySelectorAll("td")[tdIndex]);

  return {
    full_name: get(rows[0], 1),
    student_id: get(rows[1], 1),
    class_name: get(rows[1], 3),
    major: get(rows[1], 5),
  };
}

// "Học kỳ 1 - Năm học 2025-2026" → { semester: "HK1-2025-2026", academic_year: "2025-2026" }
function parseSemesterHeader(text: string): { semester: string; academic_year: string } | null {
  const m = text.match(/Học kỳ\s+(\d+)\s*-\s*Năm học\s+(\d{4}-\d{4})/);
  if (!m) return null;
  return { semester: `HK${m[1]}-${m[2]}`, academic_year: m[2] };
}

function isCourseRow(tds: NodeListOf<Element>): boolean {
  if (tds.length < 9) return false;
  const titleAttr = tds[1]?.getAttribute("title") ?? "";
  return /^[A-Z]{2,5}\d{2,3}/.test(titleAttr);
}

function parseCourseRow(
  tds: NodeListOf<Element>,
  semester: string,
  academic_year: string
): ParsedCourse {
  const course_id = cleanText(tds[1]);
  const course_name = cleanText(tds[2]);
  const credits = parseInt(cleanText(tds[3])) || 0;
  const scoreText = cleanText(tds[8]);

  let score: number | null = null;
  let status: ParsedCourse["status"] = "completed";

  if (scoreText === "Miễn") {
    status = "exempted";
  } else {
    const parsed = parseFloat(scoreText);
    if (!isNaN(parsed)) {
      score = parsed;
      status = score >= 5 ? "completed" : "failed";
    }
  }

  return { course_id, course_name, credits, score, status, semester, academic_year };
}

// Summary rows use colspan so actual td count < 10 — scan from the end for a numeric value
function lastNumericTd(tds: NodeListOf<Element>): number {
  for (let i = tds.length - 1; i >= 0; i--) {
    const v = parseFloat(cleanText(tds[i]));
    if (!isNaN(v)) return v;
  }
  return 0;
}

function parseSummary(rows: NodeListOf<Element>) {
  let total_credits_studied = 0;
  let total_credits_accumulated = 0;
  let gpa = 0;
  let gpa_accumulated = 0;

  for (const row of Array.from(rows)) {
    const text = cleanText(row);
    const tds = row.querySelectorAll("td");
    if (text.includes("Số tín chỉ đã học")) {
      total_credits_studied = parseInt(cleanText(tds[3])) || lastNumericTd(tds);
    } else if (text.includes("Số tín chỉ tích lũy")) {
      total_credits_accumulated = parseInt(cleanText(tds[3])) || lastNumericTd(tds);
    } else if (text.includes("Điểm trung bình chung tích lũy")) {
      gpa_accumulated = lastNumericTd(tds);
    } else if (text.includes("Điểm trung bình chung")) {
      gpa = lastNumericTd(tds);
    }
  }

  return { total_credits_studied, total_credits_accumulated, gpa, gpa_accumulated };
}

export function parseUitTranscript(htmlString: string): ParseResult {
  const doc = new DOMParser().parseFromString(htmlString, "text/html");
  const tables = doc.getElementsByTagName("table");

  const student = parseStudentInfo(tables);

  const gradeRows = tables[1]?.querySelectorAll("tr") ?? [];
  const courses: ParsedCourse[] = [];
  let currentSemester = "";
  let currentYear = "";

  for (const row of Array.from(gradeRows)) {
    const tds = row.querySelectorAll("td");
    const rowText = cleanText(row);

    // Stop at summary section
    if (rowText.includes("Số tín chỉ đã học")) break;

    // Skip semester average row
    if (rowText.includes("Trung bình học kỳ")) continue;

    // Semester header: single td with colspan="10"
    const firstTd = tds[0];
    if (firstTd?.getAttribute("colspan") === "10") {
      const parsed = parseSemesterHeader(rowText);
      if (parsed) {
        currentSemester = parsed.semester;
        currentYear = parsed.academic_year;
      }
      continue;
    }

    if (isCourseRow(tds) && currentSemester) {
      courses.push(parseCourseRow(tds, currentSemester, currentYear));
    }
  }

  const summary = parseSummary(gradeRows);

  return { student, courses, summary };
}
