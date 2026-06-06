/**
 * Regression tests for the ĐKHP parser.
 *
 * Guards the bug where an *exam schedule* file (columns: Mã MH, Mã lớp,
 * Ca/Tiết thi, Thứ thi…) fed into the ĐKHP importer was positionally
 * mis-parsed — storing "Ca 2"/"Tiết 678" as course names and the weekday as
 * credits, then corrupting the catalog via upsert.
 */

import { describe, it, expect } from "vitest";
import { parseUitDkhp } from "@/lib/parsers/uit-dkhp-parser";

const EXAM_HTML = `<!DOCTYPE html><html><body>
  <div class="title_thongtindangky">LỊCH THI CK 2 NĂM 2025 - 2026<p>MSSV: 24521586</p></div>
  <table class="sticky-enabled">
    <thead><tr><th>STT</th><th>Mã MH</th><th>Mã lớp</th><th>Ca/Tiết thi</th><th>Thứ thi</th><th>Ngày thi</th><th>Phòng thi</th><th>Ghi chú</th></tr></thead>
    <tbody>
      <tr class="odd"><td>1</td><td>CS112</td><td>CS112.Q21</td><td>Ca 2</td><td>5</td><td>11-06-2026</td><td>B3.18</td><td>CQUI</td></tr>
      <tr class="even"><td>2</td><td>SS008</td><td>SS008.Q26</td><td>Ca 2</td><td>5</td><td>18-06-2026</td><td>B5.10</td><td>CQUI</td></tr>
    </tbody>
  </table>
</body></html>`;

const DKHP_HTML = `<!DOCTYPE html><html><body>
  <div class="title_thongtindangky">THÔNG TIN ĐĂNG KÝ HỌC PHẦN HỌC KỲ 2 NĂM 2025 - 2026</div>
  <table class="sticky-enabled">
    <thead><tr><th>STT</th><th>Mã MH</th><th>Mã lớp</th><th>Tên môn học</th><th>Số TC</th></tr></thead>
    <tbody>
      <tr class="odd"><td>1</td><td>CS112</td><td>CS112.Q21</td><td>Phân tích và thiết kế thuật toán</td><td>4</td></tr>
      <tr class="even"><td>2</td><td>SS008</td><td>SS008.Q26</td><td>Kinh tế chính trị Mác – Lênin</td><td>2</td></tr>
    </tbody>
  </table>
</body></html>`;

describe("parseUitDkhp", () => {
  it("rejects an exam-schedule file instead of mis-parsing it", () => {
    const r = parseUitDkhp(EXAM_HTML);
    expect(r.courses).toHaveLength(0);
    expect(r.error).toBeTruthy();
    expect(r.error).toMatch(/Lịch thi/i);
  });

  it("parses a real ĐKHP table by header, not fixed positions", () => {
    const r = parseUitDkhp(DKHP_HTML);
    expect(r.error).toBeUndefined();
    expect(r.courses).toHaveLength(2);
    const ss = r.courses.find((c) => c.course_id === "SS008")!;
    expect(ss.course_name).toBe("Kinh tế chính trị Mác – Lênin");
    expect(ss.credits).toBe(2);
  });
});
