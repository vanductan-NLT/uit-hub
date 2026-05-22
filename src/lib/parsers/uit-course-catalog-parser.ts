/**
 * Parser for daa.uit.edu.vn/danh-muc-mon-hoc-dai-hoc
 *
 * Table columns (detected by header text, not index — robust to layout shifts):
 *   Mã MH | Tên môn học | Tên tiếng Anh | Loại MH | Mã môn tiên quyết | Mã môn tương đương | TCLT | TCTH
 *
 * Usage:
 *   const html = <paste page source>;
 *   const result = parseUitCourseCatalog(html);
 *   // result.courses → bulk upsert into `courses` table
 */

export interface CatalogCourse {
  id: string;           // Mã MH  e.g. "IT001"
  name: string;         // Tên tiếng Việt
  name_en: string | null;
  credits: number;      // TCLT + TCTH
  course_group: string; // ĐC | CSN | CN | CNTC (raw from daa)
  prerequisites: string[]; // space-split, filtered to non-empty
  equivalents: string[];
}

export interface CatalogParseResult {
  courses: CatalogCourse[];
  /** Courses skipped due to missing ID or 0 credits */
  skipped: number;
  errors: string[];
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function clean(el: Element | null | undefined): string {
  if (!el) return "";
  return (el.textContent ?? "").replace(/ /g, " ").replace(/\s+/g, " ").trim();
}

function splitCodes(raw: string): string[] {
  return raw
    .split(/[\s,;]+/)
    .map((s) => s.trim())
    .filter((s) => /^[A-Z]{1,5}\d{2,4}$/.test(s));
}

/** Detect column indices from the header row. Returns null if table looks wrong. */
function detectColumns(headerRow: Element): Record<string, number> | null {
  const headers = Array.from(headerRow.querySelectorAll("th, td")).map((th) =>
    clean(th).toLowerCase()
  );

  const find = (...keywords: string[]): number =>
    headers.findIndex((h) => keywords.some((kw) => h.includes(kw)));

  const idIdx        = find("mã mh", "mã môn học", "course code", "mã hp");
  const nameIdx      = find("tên môn học", "tên vh", "tên tiếng việt", "course name");
  const nameEnIdx    = find("tiếng anh", "english", "name (en");
  const groupIdx     = find("loại mh", "loại môn", "course type", "category");
  const prereqIdx    = find("tiên quyết", "prerequisite", "học trước");
  const equivIdx     = find("tương đương", "equivalent");
  const tcltIdx      = find("tclt", "lý thuyết", "lecture");
  const tcthIdx      = find("tcth", "thực hành", "lab", "practical");

  if (idIdx === -1 || nameIdx === -1) return null;

  return { idIdx, nameIdx, nameEnIdx, groupIdx, prereqIdx, equivIdx, tcltIdx, tcthIdx };
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

  // Sort by row count desc — the data table is the largest
  tables.sort((a, b) => b.querySelectorAll("tr").length - a.querySelectorAll("tr").length);
  const table = tables[0];

  const rows = Array.from(table.querySelectorAll("tr"));
  if (rows.length < 2) {
    return { courses: [], skipped: 0, errors: ["Bảng dữ liệu quá ít hàng."] };
  }

  // Detect columns from first row that has th or multiple td
  let cols: ReturnType<typeof detectColumns> = null;
  let dataStartIdx = 0;
  for (let i = 0; i < Math.min(5, rows.length); i++) {
    cols = detectColumns(rows[i]);
    if (cols) { dataStartIdx = i + 1; break; }
  }

  if (!cols) {
    errors.push("Không nhận diện được header bảng. Thử chọn đúng trang danh mục môn học UIT.");
    return { courses: [], skipped: 0, errors };
  }

  const { idIdx, nameIdx, nameEnIdx, groupIdx, prereqIdx, equivIdx, tcltIdx, tcthIdx } = cols;
  const courses: CatalogCourse[] = [];

  for (let i = dataStartIdx; i < rows.length; i++) {
    const tds = Array.from(rows[i].querySelectorAll("td"));
    if (tds.length < 2) { skipped++; continue; }

    const id        = clean(tds[idIdx]);
    const name      = clean(tds[nameIdx]);
    const name_en   = nameEnIdx >= 0 ? clean(tds[nameEnIdx]) || null : null;
    const group     = groupIdx >= 0 ? clean(tds[groupIdx]) : "";
    const prereqRaw = prereqIdx >= 0 ? clean(tds[prereqIdx]) : "";
    const equivRaw  = equivIdx >= 0 ? clean(tds[equivIdx]) : "";
    const tclt      = tcltIdx >= 0 ? parseInt(clean(tds[tcltIdx])) || 0 : 0;
    const tcth      = tcthIdx >= 0 ? parseInt(clean(tds[tcthIdx])) || 0 : 0;
    const credits   = tclt + tcth;

    if (!id || !/^[A-Z]{1,5}\d{2,4}$/.test(id)) { skipped++; continue; }
    if (!name) { skipped++; continue; }

    courses.push({
      id,
      name,
      name_en,
      credits: credits > 0 ? credits : 1, // fallback 1 if TCLT/TCTH not detected
      course_group: group,
      prerequisites: splitCodes(prereqRaw),
      equivalents: splitCodes(equivRaw),
    });
  }

  return { courses, skipped, errors };
}
