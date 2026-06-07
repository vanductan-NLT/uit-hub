// Shared input validation helpers. Each returns a result with a Vietnamese
// error message (null when valid) so callers can render inline feedback.

export interface ValidationResult {
  valid: boolean;
  error: string | null;
}

const OK: ValidationResult = { valid: true, error: null };

export const ALLOWED_EMAIL_DOMAIN = "gm.uit.edu.vn";

export function isUitEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  return email.trim().toLowerCase().endsWith(`@${ALLOWED_EMAIL_DOMAIN}`);
}

// Score on a 0–10 scale. Empty string is treated as "not entered" (valid) so
// score fields stay optional.
export function validateScore(raw: string): ValidationResult {
  const trimmed = raw.trim();
  if (trimmed === "") return OK;
  const n = Number(trimmed);
  if (isNaN(n) || n < 0 || n > 10) {
    return { valid: false, error: "Điểm phải từ 0 đến 10." };
  }
  return OK;
}

// First 2 digits of MSSV encode the intake year (24 → 2024). Returns null when
// the id has fewer than 2 leading digits.
export function intakeYearFromStudentId(raw: string): number | null {
  const m = raw.trim().match(/^(\d{2})/);
  return m ? 2000 + Number(m[1]) : null;
}

// UIT khóa number is the enrollment year minus 2005 (K19 = 2024, K20 = 2025) —
// confirmed by UIT's own CTĐT pages ("Áp dụng từ Khoá 19 - 2024"). This is the
// display convention only; it is NOT the curriculum id format.
export function khoaNumberFromYear(intakeYear: number): number {
  return intakeYear - 2005;
}

// Friendly khóa label for the UI, e.g. 2024 → "K19 (2024)".
export function khoaLabel(intakeYear: number): string {
  return `K${khoaNumberFromYear(intakeYear)} (${intakeYear})`;
}

/**
 * Inferred graduation year based on major and intake year.
 * KHMT, TTNT, ATTT: 3.5 years.
 * Other majors: 4.0 years.
 */
export function inferGraduationYear(major: string, intakeYear: number | null): number | null {
  if (!intakeYear) return null;
  const isShortMajor = ["KHMT", "TTNT", "ATTT"].includes(major);
  return intakeYear + (isShortMajor ? 3.5 : 4);
}

// UIT student id: exactly 8 digits (e.g. 22521234). Empty is rejected by
// default; pass allowEmpty when the field is optional.
export function validateStudentId(raw: string, allowEmpty = false): ValidationResult {
  const trimmed = raw.trim();
  if (trimmed === "") {
    return allowEmpty ? OK : { valid: false, error: "Vui lòng nhập MSSV." };
  }
  if (!/^\d{8}$/.test(trimmed)) {
    return { valid: false, error: "MSSV phải gồm 8 chữ số." };
  }
  return OK;
}

// Full name must be non-empty after trimming.
export function validateFullName(raw: string): ValidationResult {
  if (raw.trim() === "") {
    return { valid: false, error: "Vui lòng nhập họ tên." };
  }
  return OK;
}

const ALLOWED_RESOURCE_EXTENSIONS = [".pdf", ".pptx", ".ppt", ".docx", ".doc"];
const MAX_RESOURCE_FILE_BYTES = 50 * 1024 * 1024; // 50 MB

// File upload for study resources: PDF, PPTX/PPT, DOCX/DOC; max 50 MB.
export function validateResourceFile(file: File): ValidationResult {
  const ext = "." + (file.name.split(".").pop() ?? "").toLowerCase();
  if (!ALLOWED_RESOURCE_EXTENSIONS.includes(ext)) {
    return { valid: false, error: "Chỉ chấp nhận file PDF, PPTX, PPT, DOCX, DOC." };
  }
  if (file.size > MAX_RESOURCE_FILE_BYTES) {
    return { valid: false, error: "File không được vượt quá 50MB." };
  }
  return OK;
}
