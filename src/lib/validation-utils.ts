// Shared input validation helpers. Each returns a result with a Vietnamese
// error message (null when valid) so callers can render inline feedback.

export interface ValidationResult {
  valid: boolean;
  error: string | null;
}

const OK: ValidationResult = { valid: true, error: null };

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
