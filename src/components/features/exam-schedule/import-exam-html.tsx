"use client";

import { useRef, useState } from "react";
import type { Course, UserCourseWithCourse } from "@/types/database";
import { parseUitExamSchedule, type ExamParseResult, type ParsedExam } from "@/lib/parsers/uit-exam-parser";
import { generateStudySessions } from "@/lib/exam-schedule-utils";
import { bulkUpsertExamSchedules, bulkInsertStudySessions } from "@/lib/supabase/exam-api";
import type { UpsertExamInput } from "@/lib/supabase/exam-api";

interface Props {
  userId: string;
  currentSemester: string | null;
  userCourses: UserCourseWithCourse[];
  allCourses: Course[];
  onSuccess: () => void;
  onClose: () => void;
}

export default function ImportExamHtml({ userId, currentSemester, userCourses, allCourses, onSuccess, onClose }: Props) {
  const [result, setResult] = useState<ExamParseResult | null>(null);
  const [checked, setChecked] = useState<Set<string>>(new Set());
  const [importing, setImporting] = useState(false);
  const [parseError, setParseError] = useState<string | null>(null);
  const [importedCount, setImportedCount] = useState(0);
  const [sessionCount, setSessionCount] = useState(0);
  const [done, setDone] = useState(false);
  const [dragging, setDragging] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const knownIds = new Set(allCourses.map((c) => c.id));

  function handleFile(file: File) {
    setParseError(null);
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const parsed = parseUitExamSchedule(e.target?.result as string);
        if (parsed.exams.length === 0) {
          setParseError("Không tìm thấy lịch thi. Hãy dùng file HTML từ trang Lịch thi trên student.uit.edu.vn.");
          return;
        }
        setResult(parsed);
        setChecked(new Set(parsed.exams.map((ex) => ex.course_id)));
      } catch {
        setParseError("Không thể đọc file. Hãy đảm bảo đây là file HTML từ student.uit.edu.vn.");
      }
    };
    reader.readAsText(file, "utf-8");
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }

  function toggleExam(id: string) {
    setChecked((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function handleImport() {
    if (!result) return;
    setImporting(true);
    try {
      const selected = result.exams.filter((ex) => checked.has(ex.course_id));
      const inputs: UpsertExamInput[] = selected.map((ex) => ({
        user_id: userId,
        course_id: ex.course_id,
        class_code: ex.class_code || null,
        exam_period: result.exam_period,
        semester: result.semester,
        academic_year: result.academic_year,
        exam_date: ex.exam_date,
        start_time: ex.start_time || null,
        exam_time_raw: ex.exam_time_raw || null,
        room: ex.room || null,
        exam_type: ex.exam_type || null,
      }));

      const exams = await bulkUpsertExamSchedules(inputs);
      const sessions = generateStudySessions(exams, userCourses);
      const examIds = exams.map((e) => e.id);
      await bulkInsertStudySessions(userId, examIds, sessions);

      setImportedCount(exams.length);
      setSessionCount(sessions.length);
      setDone(true);
      onSuccess();
    } catch {
      setParseError("Lỗi khi lưu lịch thi. Vui lòng thử lại.");
    } finally {
      setImporting(false);
    }
  }

  const semesterMismatch = result && currentSemester && result.semester && result.semester !== currentSemester;

  // ── Done screen ──
  if (done) {
    return (
      <div className="es-logout-overlay" onClick={onClose}>
        <div className="es-logout-modal" onClick={(e) => e.stopPropagation()} style={{ width: 400, textAlign: "center" }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>✅</div>
          <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 6 }}>
            Đã thêm {importedCount} lịch thi {result?.exam_period}
          </div>
          {result?.semester && (
            <div style={{ fontSize: 13, color: "var(--es-muted)", marginBottom: 8 }}>
              Học kỳ: <strong>{result.semester}</strong>
            </div>
          )}
          <div style={{ fontSize: 12, color: "var(--es-muted)", marginBottom: 20 }}>
            Đã tạo {sessionCount} buổi ôn tập tự động
          </div>
          <button className="es-btn es-btn-primary" onClick={onClose}>Đóng</button>
        </div>
      </div>
    );
  }

  // ── Preview screen ──
  if (result) {
    const allChecked = result.exams.every((ex) => checked.has(ex.course_id));

    return (
      <div className="es-logout-overlay" onClick={onClose}>
        <div className="es-logout-modal" onClick={(e) => e.stopPropagation()} style={{ width: 560 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <div>
              <div style={{ fontWeight: 700, fontSize: 16 }}>
                Xác nhận import lịch thi {result.exam_period}
              </div>
              {result.semester && (
                <div style={{ fontSize: 12, color: "var(--es-muted)", marginTop: 2 }}>{result.semester}</div>
              )}
            </div>
            <button onClick={onClose} style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer", color: "var(--es-muted)" }}>×</button>
          </div>

          {semesterMismatch && (
            <div className="es-alert-strip warn" style={{ marginBottom: 12 }}>
              <span>⚠️</span>
              <span>
                Lịch thi thuộc <strong>{result.semester}</strong>, khác học kỳ hiện tại (<strong>{currentSemester}</strong>). Vẫn tiếp tục?
              </span>
            </div>
          )}

          {result.exams.some((ex) => !knownIds.has(ex.course_id)) && (
            <div className="es-alert-strip warn" style={{ marginBottom: 12 }}>
              <span>ℹ️</span>
              <span>Một số môn chưa có trong hệ thống — bạn nên import ĐKHP trước</span>
            </div>
          )}

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
            <span style={{ fontSize: 13, color: "var(--es-muted)" }}>{checked.size}/{result.exams.length} môn được chọn</span>
            <button
              className="es-btn es-btn-outline es-btn-sm"
              onClick={() =>
                setChecked(allChecked ? new Set() : new Set(result.exams.map((ex) => ex.course_id)))
              }
            >
              {allChecked ? "Bỏ chọn tất cả" : "Chọn tất cả"}
            </button>
          </div>

          <div style={{ maxHeight: 300, overflowY: "auto", border: "1px solid var(--es-border)", borderRadius: "var(--r-sm)", marginBottom: 16 }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr style={{ background: "var(--es-bg-alt)", position: "sticky", top: 0 }}>
                  <th style={{ padding: "8px 10px", textAlign: "left" }}></th>
                  <th style={{ padding: "8px 10px", textAlign: "left", fontWeight: 600 }}>Mã MH</th>
                  <th style={{ padding: "8px 10px", textAlign: "left", fontWeight: 600 }}>Ngày thi</th>
                  <th style={{ padding: "8px 10px", textAlign: "left", fontWeight: 600 }}>Giờ</th>
                  <th style={{ padding: "8px 10px", textAlign: "left", fontWeight: 600 }}>Phòng</th>
                  <th style={{ padding: "8px 10px", textAlign: "left", fontWeight: 600 }}>Loại</th>
                </tr>
              </thead>
              <tbody>
                {result.exams.map((ex: ParsedExam) => {
                  const unknown = !knownIds.has(ex.course_id);
                  return (
                    <tr
                      key={ex.course_id}
                      style={{ borderTop: "1px solid var(--es-border)", cursor: "pointer" }}
                      onClick={() => toggleExam(ex.course_id)}
                    >
                      <td style={{ padding: "8px 10px" }}>
                        <input
                          type="checkbox"
                          checked={checked.has(ex.course_id)}
                          onChange={() => toggleExam(ex.course_id)}
                          onClick={(e) => e.stopPropagation()}
                        />
                      </td>
                      <td style={{ padding: "8px 10px", fontFamily: "var(--font-mono, monospace)", color: "var(--es-muted)" }}>
                        {ex.course_id}
                        {unknown && (
                          <span style={{ marginLeft: 6, fontSize: 10, padding: "1px 5px", borderRadius: 4, background: "var(--amber-lt, #fef3c7)", color: "var(--amber, #d97706)", fontWeight: 600 }}>
                            ?
                          </span>
                        )}
                      </td>
                      <td style={{ padding: "8px 10px" }}>{formatDateVi(ex.exam_date)}</td>
                      <td style={{ padding: "8px 10px" }}>{ex.start_time ?? ex.exam_time_raw}</td>
                      <td style={{ padding: "8px 10px" }}>{ex.room}</td>
                      <td style={{ padding: "8px 10px" }}>{ex.exam_type}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {parseError && (
            <div className="es-alert-strip warn" style={{ marginBottom: 12 }}>
              <span>⚠️</span><span>{parseError}</span>
            </div>
          )}

          <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
            <button className="es-btn es-btn-outline" onClick={() => setResult(null)}>← Chọn lại file</button>
            <button
              className="es-btn es-btn-primary"
              onClick={handleImport}
              disabled={importing || checked.size === 0}
            >
              {importing ? "Đang lưu..." : `Import ${checked.size} lịch thi`}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Upload screen ──
  return (
    <div className="es-logout-overlay" onClick={onClose}>
      <div className="es-logout-modal" onClick={(e) => e.stopPropagation()} style={{ width: 460 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <div style={{ fontWeight: 700, fontSize: 16 }}>Import lịch thi</div>
          <button onClick={onClose} style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer", color: "var(--es-muted)" }}>×</button>
        </div>

        {parseError && (
          <div className="es-alert-strip warn" style={{ marginBottom: 12 }}>
            <span>⚠️</span><span>{parseError}</span>
          </div>
        )}

        <div
          onDrop={onDrop}
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onClick={() => fileRef.current?.click()}
          style={{
            border: `2px dashed ${dragging ? "var(--blue)" : "var(--es-border)"}`,
            borderRadius: "var(--r-md, 10px)",
            padding: "40px 24px",
            textAlign: "center",
            cursor: "pointer",
            background: dragging ? "var(--blue-lt)" : "var(--es-bg-alt)",
            transition: "all 0.15s",
            marginBottom: 16,
          }}
        >
          <div style={{ fontSize: 36, marginBottom: 8 }}>📋</div>
          <div style={{ fontWeight: 600, marginBottom: 4 }}>Kéo thả hoặc click để chọn file</div>
          <div style={{ fontSize: 13, color: "var(--es-muted)" }}>File .html từ trang Lịch thi sinh viên</div>
        </div>

        <input
          ref={fileRef}
          type="file"
          accept=".html,.htm"
          style={{ display: "none" }}
          onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
        />

        <div style={{ fontSize: 12, color: "var(--es-muted)", lineHeight: 1.6 }}>
          <strong>Cách lấy file:</strong> Vào{" "}
          <a
            href="https://student.uit.edu.vn/sinhvien/lichhoc/lichthi"
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: "var(--blue)" }}
          >
            Lịch thi sinh viên
          </a>
          {" "}→ chọn GK/CK, HK, năm →{" "}
          <kbd style={{ fontSize: 11, padding: "1px 5px", borderRadius: 4, border: "1px solid var(--es-border)", background: "var(--es-bg-alt)" }}>Ctrl+S</kbd>
          {" "}→ lưu .html → upload ở đây.
        </div>
      </div>
    </div>
  );
}

function formatDateVi(iso: string): string {
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
}
