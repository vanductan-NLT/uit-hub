/**
 * Parser for student.uit.edu.vn CTĐT (Chương trình đào tạo) pages.
 *
 * The page lists courses grouped by semester (Học kỳ 1..8), each with:
 *   Mã MH | Tên môn học | Loại | Số TC
 *
 * Also parses the credit-block summary table for graduation requirements:
 *   Đại cương | Cơ sở ngành | Chuyên ngành | Tốt nghiệp | Tổng
 *
 * Usage:
 *   const html = <paste CTĐT page source>;
 *   const result = parseUitCtdt(html, "CNTT", 2019); // major, intakeYear
 */

export interface CtdtCourse {
  course_id: string;
  suggested_semester: number; // 1..8
  requirement_type: "general" | "foundation" | "required" | "elective";
}

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

function clean(el: Element | null | undefined): string {
  if (!el) return "";
  return (el.textContent ?? "").replace(/ /g, " ").replace(/\s+/g, " ").trim();
}

/**
 * Map raw "Loại MH" text (ĐC/CSN/CN/CNTC/TN…) to our requirement_type enum.
 * Falls back to "elective" for unknowns.
 */
function mapRequirementType(raw: string): CtdtCourse["requirement_type"] {
  const r = raw.toUpperCase().trim();
  if (r === "ĐC" || r.includes("ĐẠI CƯƠNG"))             return "general";
  if (r === "CSN" || r.includes("CƠ SỞ NGÀNH"))           return "foundation";
  if (r === "CN" || r.includes("CHUYÊN NGÀNH CHÍNH") || r === "BB") return "required";
  if (r === "CNTC" || r.includes("TỰ CHỌN") || r === "TC") return "elective";
  return "elective";
}

/** Try to extract semester number from a heading like "Học kỳ 3" or "HK3". */
function parseSemesterHeading(text: string): number | null {
  const m = text.match(/[Hh]ọc\s*[Kk][yỳ]\s*(\d+)|HK\s*(\d+)/);
  if (m) return parseInt(m[1] ?? m[2]);
  return null;
}

/** Parse the credit summary block (if present). Returns null on failure. */
function parseCreditSummary(doc: Document): Pick<
  CtdtParseResult,
  "total_credits_required" | "general_credits" | "foundation_credits" | "major_required_credits" | "major_elective_credits"
> | null {
  // Look for a table/div that mentions "Tổng" and credit counts
  const allText = doc.body?.textContent ?? "";

  // Try pattern: "Tổng số tín chỉ: 131" or similar
  const totalMatch = allText.match(/[Tt]ổng(?:\s+số)?\s+[Tt]ín\s+[Cc]hỉ[^0-9]*(\d{2,3})/);
  const total = totalMatch ? parseInt(totalMatch[1]) : 131;

  // Extract block credits by keyword search in nearby text
  function extractCredits(keywords: RegExp): number | null {
    const m = allText.match(keywords);
    return m ? parseInt(m[1]) : null;
  }

  return {
    total_credits_required: total,
    general_credits:         extractCredits(/[Đđ]ại\s*[Cc]ương[^0-9]*(\d{1,3})/),
    foundation_credits:      extractCredits(/[Cc]ơ\s*[Ss]ở\s*[Nn]gành[^0-9]*(\d{1,3})/),
    major_required_credits:  extractCredits(/[Cc]huyên\s*[Nn]gành(?:\s+[Cc]hính)?[^0-9]*(\d{1,3})/),
    major_elective_credits:  extractCredits(/[Tt]ự\s*[Cc]họn[^0-9]*(\d{1,3})/),
  };
}

// ── Main parser ────────────────────────────────────────────────────────────────

export function parseUitCtdt(html: string, major: string, intakeYear: number): CtdtParseResult {
  const doc = new DOMParser().parseFromString(html, "text/html");
  const errors: string[] = [];
  const courses: CtdtCourse[] = [];

  // -- Credit summary --
  const summary = parseCreditSummary(doc);

  // -- Course list by semester --
  // Strategy: walk all elements looking for semester headings, then consume table rows below
  const allEls = Array.from(doc.body?.querySelectorAll("h1,h2,h3,h4,h5,h6,tr,td,div,p,span") ?? []);

  let currentSemester = 0;

  for (let i = 0; i < allEls.length; i++) {
    const el = allEls[i];
    const text = clean(el);

    // Detect semester heading
    const semNum = parseSemesterHeading(text);
    if (semNum !== null && semNum >= 1 && semNum <= 8) {
      currentSemester = semNum;
      continue;
    }

    // Detect course rows: a td whose text matches a course code pattern
    if (el.tagName === "TD" && currentSemester > 0) {
      const code = text.trim();
      if (/^[A-Z]{1,5}\d{2,4}$/.test(code)) {
        // Try to find the Loại MH column in the same row
        const row = el.closest("tr");
        if (!row) continue;

        const tds = Array.from(row.querySelectorAll("td"));
        const codeIdx = tds.indexOf(el as HTMLTableCellElement);

        // Loại MH is typically the column after course code, or we search for ĐC/CSN/CN
        let rawType = "";
        for (const td of tds) {
          const t = clean(td).toUpperCase();
          if (["ĐC", "CSN", "CN", "CNTC", "BB", "TC", "TN"].includes(t)) {
            rawType = clean(td);
            break;
          }
        }
        // Fallback: look at td index+2 (common layout: STT | MãMH | TênMH | Loại | TC)
        if (!rawType && codeIdx >= 0 && tds[codeIdx + 2]) {
          rawType = clean(tds[codeIdx + 2]);
        }

        // Deduplicate (same course can appear in multiple semesters in elective lists)
        const already = courses.find((c) => c.course_id === code);
        if (!already) {
          courses.push({
            course_id: code,
            suggested_semester: currentSemester,
            requirement_type: mapRequirementType(rawType),
          });
        }
      }
    }
  }

  if (courses.length === 0) {
    errors.push(
      "Không parse được danh sách môn học. Hãy chắc chắn bạn đang paste đúng trang CTĐT từ student.uit.edu.vn."
    );
  }

  return {
    major,
    intake_year_from: intakeYear,
    total_credits_required: summary?.total_credits_required ?? 131,
    general_credits:         summary?.general_credits ?? null,
    foundation_credits:      summary?.foundation_credits ?? null,
    major_required_credits:  summary?.major_required_credits ?? null,
    major_elective_credits:  summary?.major_elective_credits ?? null,
    courses,
    errors,
  };
}
