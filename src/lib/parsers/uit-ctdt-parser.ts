/**
 * Parser for student.uit.edu.vn CTĐT (Chương trình đào tạo) pages.
 *
 * Handles two common page layouts:
 *   A) Drupal view-grouping structure with div.view-grouping-header
 *   B) Table-based layout where semester headings are merged <td colspan> rows
 *
 * Also parses the credit-block summary for graduation requirements.
 */

export interface CtdtCourse {
  course_id: string;
  suggested_semester: number; // 1..8
  requirement_type: "general" | "foundation" | "required" | "elective";
  elective_group_key: string | null;
  group_required_credits: number | null;
}

/**
 * Patterns that signal the next courses in the same semester belong to one
 * "choose N of M" group. Captured group 1 (when present) is the required
 * credits; default is 10 (graduation block) when no number is captured.
 */
const GROUP_LABEL_RE = /sinh\s+vi[êe]n\s+ch[oọ]n\s+(?:m[oộ]t\s+trong|1\s+trong)\s+(?:ba|hai|\d+)/i;

export interface CtdtParseResult {
  major: string;
  intake_year_from: number;
  total_credits_required: number;
  general_credits: number | null;
  foundation_credits: number | null;
  major_required_credits: number | null;
  major_elective_credits: number | null;
  courses: CtdtCourse[];
  errors: string[];
}

// ── Helpers ────────────────────────────────────────────────────────────────────

/** Normalize + clean element text — NFC prevents decomposed-Unicode mismatches. */
function clean(el: Element | null | undefined): string {
  if (!el) return "";
  return (el.textContent ?? "")
    .normalize("NFC")
    .replace(/ /g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Course code regex — accepts IT001, MA003, SS006, CARC1, ENG03, CE107 */
const COURSE_CODE_RE = /^[A-Z]{1,6}\d{1,4}[A-Z]?$/;

function mapRequirementType(raw: string): CtdtCourse["requirement_type"] {
  const r = raw.normalize("NFC").toUpperCase().trim();
  if (r === "ĐC"  || r.includes("ĐẠI CƯƠNG"))                       return "general";
  if (r === "CSN" || r.includes("CƠ SỞ NGÀNH"))                      return "foundation";
  if (r === "CN"  || r.includes("CHUYÊN NGÀNH") || r === "BB")       return "required";
  if (r === "CNTC"|| r.includes("TỰ CHỌN")      || r === "TC")       return "elective";
  return "elective";
}

/**
 * Extract semester number from text.
 * Handles: "Học kỳ 1", "Học Kỳ 1", "HK1", "HK 1", decomposed Unicode variants.
 */
function parseSemesterNum(raw: string): number | null {
  const text = raw.normalize("NFC");
  // "Học kỳ N" — case-insensitive, various diacritics on ọ/ỳ tolerated via .normalize
  let m = text.match(/h[oọ]c\s*k[yỳỵ]\s*(\d+)/i);
  if (m) return parseInt(m[1]);
  // "HKN" or "HK N"
  m = text.match(/\bHK\s*(\d+)\b/);
  if (m) return parseInt(m[1]);
  return null;
}

/** True if a <tr> looks like a semester section header (sparse columns or heading-like text). */
function isSemesterRow(row: Element): number | null {
  const tds = row.querySelectorAll("td, th");
  // If the row has only 1-2 cells (possibly merged), check its text
  if (tds.length <= 3) {
    for (const td of tds) {
      const n = parseSemesterNum(clean(td));
      if (n !== null && n >= 1 && n <= 8) return n;
    }
  }
  // Also check the full row text (merged colspan cells)
  const rowText = clean(row);
  const n = parseSemesterNum(rowText);
  // Only accept as a semester row if it's short (not a full data row)
  if (n !== null && n >= 1 && n <= 8 && rowText.length < 80) return n;
  return null;
}

function parseCreditSummary(doc: Document) {
  const allText = (doc.body?.textContent ?? "").normalize("NFC");
  const totalMatch = allText.match(/[Tt]ổng(?:\s+số)?\s+[Tt]ín\s+[Cc]hỉ[^0-9]*(\d{2,3})/);
  const total = totalMatch ? parseInt(totalMatch[1]) : 131;
  function extractCredits(re: RegExp): number | null {
    const m = allText.match(re); return m ? parseInt(m[1]) : null;
  }
  return {
    total_credits_required:  total,
    general_credits:         extractCredits(/[Đđ]ại\s*[Cc]ương[^0-9]*(\d{1,3})/),
    foundation_credits:      extractCredits(/[Cc]ơ\s*[Ss]ở\s*[Nn]gành[^0-9]*(\d{1,3})/),
    major_required_credits:  extractCredits(/[Cc]huyên\s*[Nn]gành(?:\s*[Cc]hính)?[^0-9]*(\d{1,3})/),
    major_elective_credits:  extractCredits(/[Tt]ự\s*[Cc]họn[^0-9]*(\d{1,3})/),
  };
}

// ── Group-state helper ─────────────────────────────────────────────────────────

interface PendingGroup {
  key: string;
  requiredCredits: number;
}

/**
 * Inspect a row for a "choose N of M" label. Returns the pending-group
 * descriptor when found; the caller should attach it to every code row
 * that follows in the same semester.
 */
function detectGroupLabel(row: Element, semester: number): PendingGroup | null {
  const text = clean(row);
  if (!GROUP_LABEL_RE.test(text)) return null;
  // First standalone number in the row → required credits (e.g. "10").
  const num = text.match(/\b(\d{1,2})\b/);
  return {
    key: `sem${semester}_choose_one`,
    requiredCredits: num ? parseInt(num[1]) : 10,
  };
}

// ── Main parser ────────────────────────────────────────────────────────────────

export function parseUitCtdt(html: string, major: string, intakeYear: number): CtdtParseResult {
  const doc = new DOMParser().parseFromString(html, "text/html");
  const errors: string[] = [];
  const courses: CtdtCourse[] = [];
  const summary = parseCreditSummary(doc);

  // Per-semester pending group: once we hit a "Sinh viên chọn 1 trong N" row,
  // every subsequent course code in the same semester inherits that group key
  // until the semester changes.
  const pendingGroupBySemester = new Map<number, PendingGroup>();
  function pushCourse(code: string, semester: number, rawType: string): void {
    if (courses.find((c) => c.course_id === code)) return;
    const pending = pendingGroupBySemester.get(semester) ?? null;
    courses.push({
      course_id: code,
      suggested_semester: semester,
      requirement_type: mapRequirementType(rawType),
      elective_group_key: pending?.key ?? null,
      group_required_credits: pending?.requiredCredits ?? null,
    });
  }

  // ── Strategy A: Drupal view-grouping blocks ────────────────────────────────
  // <div class="view-grouping">
  //   <div class="view-grouping-header">Học kỳ 1</div>
  //   <div class="view-grouping-content">...<table>...</table>...</div>
  // </div>
  const groupings = doc.querySelectorAll(".view-grouping, [class*='grouping']");
  if (groupings.length > 0) {
    for (const group of groupings) {
      const headerEl = group.querySelector("[class*='grouping-header'], [class*='group-header'], h2, h3, h4");
      const semNum = headerEl ? parseSemesterNum(clean(headerEl)) : parseSemesterNum(clean(group));
      if (!semNum || semNum < 1 || semNum > 8) continue;

      for (const row of group.querySelectorAll("tr")) {
        const groupHit = detectGroupLabel(row, semNum);
        if (groupHit) pendingGroupBySemester.set(semNum, groupHit);

        const tds = Array.from(row.querySelectorAll("td"));
        for (const td of tds) {
          const code = clean(td).trim();
          if (!COURSE_CODE_RE.test(code)) continue;
          let rawType = "";
          for (const sibling of tds) {
            const t = clean(sibling).toUpperCase().normalize("NFC");
            if (["ĐC", "CSN", "CN", "CNTC", "BB", "TC", "TN"].includes(t)) {
              rawType = clean(sibling); break;
            }
          }
          pushCourse(code, semNum, rawType);
        }
      }
    }
  }

  // ── Strategy B: table-based walk (fallback) ────────────────────────────────
  if (courses.length === 0) {
    let currentSemester = 0;
    const rows = Array.from(doc.querySelectorAll("tr"));

    for (const row of rows) {
      const semNum = isSemesterRow(row);
      if (semNum !== null) { currentSemester = semNum; continue; }
      if (currentSemester === 0) continue;

      const groupHit = detectGroupLabel(row, currentSemester);
      if (groupHit) pendingGroupBySemester.set(currentSemester, groupHit);

      const tds = Array.from(row.querySelectorAll("td"));
      for (const td of tds) {
        const code = clean(td).trim();
        if (!COURSE_CODE_RE.test(code)) continue;
        let rawType = "";
        for (const sibling of tds) {
          const t = clean(sibling).toUpperCase().normalize("NFC");
          if (["ĐC", "CSN", "CN", "CNTC", "BB", "TC", "TN"].includes(t)) {
            rawType = clean(sibling); break;
          }
        }
        pushCourse(code, currentSemester, rawType);
      }
    }
  }

  // ── Strategy C: heading + nearby tables ───────────────────────────────────
  if (courses.length === 0) {
    const allEls = Array.from(doc.body?.querySelectorAll("h1,h2,h3,h4,h5,h6,p,div,td,th,span") ?? []);
    let currentSemester = 0;
    for (const el of allEls) {
      const text = clean(el);
      const semNum = parseSemesterNum(text);
      if (semNum !== null && semNum >= 1 && semNum <= 8 && text.length < 60) {
        currentSemester = semNum; continue;
      }
      if (el.tagName === "TD" && currentSemester > 0) {
        const row = el.closest("tr");
        if (row) {
          const groupHit = detectGroupLabel(row, currentSemester);
          if (groupHit) pendingGroupBySemester.set(currentSemester, groupHit);
        }
        const code = text.trim();
        if (!COURSE_CODE_RE.test(code)) continue;
        const tds = row ? Array.from(row.querySelectorAll("td")) : [];
        let rawType = "";
        for (const td of tds) {
          const t = clean(td).toUpperCase().normalize("NFC");
          if (["ĐC", "CSN", "CN", "CNTC", "BB", "TC", "TN"].includes(t)) {
            rawType = clean(td); break;
          }
        }
        pushCourse(code, currentSemester, rawType);
      }
    }
  }

  if (courses.length === 0) {
    errors.push("Không parse được danh sách môn học. Hãy chắc chắn đang dùng đúng trang CTĐT từ student.uit.edu.vn.");
  }

  return {
    major, intake_year_from: intakeYear,
    total_credits_required: summary.total_credits_required,
    general_credits:        summary.general_credits,
    foundation_credits:     summary.foundation_credits,
    major_required_credits: summary.major_required_credits,
    major_elective_credits: summary.major_elective_credits,
    courses, errors,
  };
}
