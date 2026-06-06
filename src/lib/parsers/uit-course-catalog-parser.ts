/**
 * Parser for daa.uit.edu.vn/danh-muc-mon-hoc-dai-hoc
 *
 * Actual table columns (13 cols, 0-indexed):
 *   0=Số TT | 1=Mã MH | 2=Tên MH (Tiếng Việt) | 3=Tên MH (Tiếng Anh)
 *   4=Còn mở lớp | 5=Đơn vị | 6=Loại MH | 7=Mã cũ
 *   8=Mã môn học tương đương | 9=Mã môn học tiên quyết | 10=Mã môn học trước
 *   11=Số TCLT | 12=Số TCTH
 *
 * Prereqs/equivalents are <br>-separated inside each cell.
 * Course codes include non-standard formats like CARC1, ENG03, MA003.
 */

export interface CatalogCourse {
  id: string;              // Mã MH  e.g. "IT001"
  name: string;            // Tên tiếng Việt
  name_en: string | null;
  credits: number;         // TCLT + TCTH
  course_group: string;    // Loại MH raw value (ĐC, CSN, CN, etc.)
  prerequisites: string[]; // Mã môn học trước (col 10)
  equivalents: string[];   // Mã môn học tương đương (col 8)
}

export interface CatalogParseResult {
  courses: CatalogCourse[];
  /** Courses skipped due to missing ID or 0 credits */
  skipped: number;
  errors: string[];
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function cleanText(el: Element | null | undefined): string {
  if (!el) return "";
  return (el.textContent ?? "").replace(/ /g, " ").replace(/\s+/g, " ").trim();
}

/**
 * Parse <br>-separated codes from a table cell.
 * Uses innerHTML so <br> tags are preserved before textContent strips them.
 */
function splitCodesFromCell(cell: Element | undefined): string[] {
  if (!cell) return [];
  // Replace <br> variants with newline, then extract text
  const raw = cell.innerHTML
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<[^>]+>/g, ""); // strip remaining tags
  return raw
    .split(/[\n,;/\s]+/)
    .map((s) => s.trim())
    // Accept: IT001 | CE107 | CARC1 | ENG03 | MA003 | PH002 | GD001
    .filter((s) => /^[A-Z]{1,6}\d{1,4}[A-Z]?$/.test(s));
}

/**
 * Detect column indices from the header row.
 * Falls back to hardcoded indices (stable table structure).
 */
function detectColumns(headerRow: Element): Record<string, number> {
  const headers = Array.from(headerRow.querySelectorAll("th, td")).map((th) =>
    cleanText(th).toLowerCase()
  );

  const find = (...keywords: string[]): number =>
    headers.findIndex((h) => keywords.some((kw) => h.includes(kw)));

  // Try keyword detection first
  const idIdx     = find("mã mh", "mã môn học", "course code", "mã hp");
  // "tiếng việt" before generic "tên mh" to avoid matching "Tên MH (Tiếng Anh)"
  const nameIdx   = find("tiếng việt", "tên mh (tiếng v", "tên môn học", "course name");
  const nameEnIdx = find("tiếng anh", "english", "name (en");
  const groupIdx  = find("loại mh", "loại môn", "course type", "category");
  // "mã cũ" = the course's previous code (renamed across curriculum revisions);
  // captured so searching by an old code still resolves to the current course.
  const oldCodeIdx = find("mã cũ", "old code");
  // "học trước" = hard prerequisites (must have passed); "tiên quyết" = co-req advisory
  const prereqIdx = find("học trước");
  const equivIdx  = find("tương đương", "equivalent");
  const tcltIdx   = find("tclt", "số tclt", "lý thuyết");
  const tcthIdx   = find("tcth", "số tcth", "thực hành");

  // Fall back to known stable indices if keyword detection misses columns
  return {
    idIdx:      idIdx      >= 0 ? idIdx      : 1,
    nameIdx:    nameIdx    >= 0 ? nameIdx    : 2,
    nameEnIdx:  nameEnIdx  >= 0 ? nameEnIdx  : 3,
    groupIdx:   groupIdx   >= 0 ? groupIdx   : 6,
    oldCodeIdx: oldCodeIdx >= 0 ? oldCodeIdx : 7,
    prereqIdx:  prereqIdx  >= 0 ? prereqIdx  : 10,
    equivIdx:   equivIdx   >= 0 ? equivIdx   : 8,
    tcltIdx:    tcltIdx    >= 0 ? tcltIdx    : 11,
    tcthIdx:    tcthIdx    >= 0 ? tcthIdx    : 12,
  };
}

// ── Main parser ────────────────────────────────────────────────────────────────

export function parseUitCourseCatalog(html: string): CatalogParseResult {
  const doc = new DOMParser().parseFromString(html, "text/html");
  const errors: string[] = [];
  let skipped = 0;

  // Find the main data table — prefer the largest table on the page
  const tables = Array.from(doc.querySelectorAll("table"));
  if (tables.length === 0) {
    return { courses: [], skipped: 0, errors: ["Không tìm thấy bảng dữ liệu trong HTML."] };
  }

  // The data table has the most rows
  tables.sort((a, b) => b.querySelectorAll("tr").length - a.querySelectorAll("tr").length);
  const table = tables[0];

  const rows = Array.from(table.querySelectorAll("tr"));
  if (rows.length < 2) {
    return { courses: [], skipped: 0, errors: ["Bảng dữ liệu quá ít hàng."] };
  }

  // Find header row (first row inside <thead> or first row with <th> cells)
  const theadRow = table.querySelector("thead tr");
  const headerRow = theadRow ?? rows[0];
  const cols = detectColumns(headerRow);

  // Data rows start after the header
  const dataStartIdx = rows.indexOf(headerRow as HTMLTableRowElement) + 1;

  const { idIdx, nameIdx, nameEnIdx, groupIdx, oldCodeIdx, prereqIdx, equivIdx, tcltIdx, tcthIdx } = cols;
  const courses: CatalogCourse[] = [];

  for (let i = dataStartIdx; i < rows.length; i++) {
    const tds = Array.from(rows[i].querySelectorAll("td"));
    if (tds.length < 3) { skipped++; continue; }

    const id      = cleanText(tds[idIdx]);
    const name    = cleanText(tds[nameIdx]);
    const name_en = nameEnIdx >= 0 && tds[nameEnIdx] ? cleanText(tds[nameEnIdx]) || null : null;
    const group   = groupIdx  >= 0 && tds[groupIdx]  ? cleanText(tds[groupIdx])  : "";
    const tclt    = tcltIdx   >= 0 && tds[tcltIdx]   ? parseInt(cleanText(tds[tcltIdx]))  || 0 : 0;
    const tcth    = tcthIdx   >= 0 && tds[tcthIdx]   ? parseInt(cleanText(tds[tcthIdx]))  || 0 : 0;
    const credits = tclt + tcth;

    // Skip rows with invalid/missing course code
    if (!id || !/^[A-Z]{1,6}\d{1,4}[A-Z]?$/.test(id)) { skipped++; continue; }
    if (!name) { skipped++; continue; }

    const prerequisites = splitCodesFromCell(tds[prereqIdx]);
    // Merge the official equivalents with the "Mã cũ" (old code) column, deduped
    // and excluding the course's own id — both let an old code find this course.
    const oldCodes      = oldCodeIdx >= 0 ? splitCodesFromCell(tds[oldCodeIdx]) : [];
    const equivalents   = [...new Set([...splitCodesFromCell(tds[equivIdx]), ...oldCodes])].filter((e) => e !== id);

    courses.push({
      id,
      name,
      name_en,
      credits: credits > 0 ? credits : 1, // fallback 1 if credits not parsed
      course_group: group,
      prerequisites,
      equivalents,
    });
  }

  if (courses.length === 0 && skipped > 0) {
    errors.push(`Đã bỏ qua ${skipped} hàng — có thể file không đúng định dạng UIT hoặc bảng đã đổi cấu trúc.`);
  }

  return { courses, skipped, errors };
}
