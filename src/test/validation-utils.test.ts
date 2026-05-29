import { describe, it, expect } from "vitest";
import {
  intakeYearFromStudentId,
  inferGraduationYear,
  validateStudentId,
  validateFullName,
} from "@/lib/validation-utils";

describe("validation-utils", () => {
  describe("intakeYearFromStudentId", () => {
    it("should correctly parse intake year from valid student ID", () => {
      expect(intakeYearFromStudentId("22521234")).toBe(2022);
      expect(intakeYearFromStudentId("19521234")).toBe(2019);
      expect(intakeYearFromStudentId("25529999")).toBe(2025);
    });

    it("should return null for invalid or empty student ID", () => {
      expect(intakeYearFromStudentId("")).toBeNull();
      expect(intakeYearFromStudentId("abc")).toBeNull();
    });
  });

  describe("inferGraduationYear", () => {
    it("should return 3.5 years duration for KHMT, TTNT, ATTT", () => {
      expect(inferGraduationYear("KHMT", 2022)).toBe(2025.5);
      expect(inferGraduationYear("TTNT", 2022)).toBe(2025.5);
      expect(inferGraduationYear("ATTT", 2022)).toBe(2025.5);
    });

    it("should return 4.0 years duration for other majors", () => {
      expect(inferGraduationYear("CNTT", 2022)).toBe(2026);
      expect(inferGraduationYear("KTPM", 2022)).toBe(2026);
      expect(inferGraduationYear("MMT&TT", 2022)).toBe(2026);
      expect(inferGraduationYear("HTTT", 2022)).toBe(2026);
      expect(inferGraduationYear("Khác", 2022)).toBe(2026);
    });

    it("should return null if intake year is null", () => {
      expect(inferGraduationYear("KHMT", null)).toBeNull();
      expect(inferGraduationYear("CNTT", null)).toBeNull();
    });
  });

  describe("validateStudentId", () => {
    it("should validate correct student IDs", () => {
      expect(validateStudentId("22521234").valid).toBe(true);
      expect(validateStudentId("  22521234  ").valid).toBe(true);
    });

    it("should reject invalid student IDs", () => {
      expect(validateStudentId("").valid).toBe(false);
      expect(validateStudentId("123").valid).toBe(false);
      expect(validateStudentId("abc12345").valid).toBe(false);
    });
  });

  describe("validateFullName", () => {
    it("should validate non-empty names", () => {
      expect(validateFullName("Nguyễn Văn A").valid).toBe(true);
    });

    it("should reject empty or whitespace names", () => {
      expect(validateFullName("").valid).toBe(false);
      expect(validateFullName("   ").valid).toBe(false);
    });
  });
});
