"use client";

import { useRef, useState } from "react";
import type { Course } from "@/types/database";
import { parseUitDkhp, type DkhpCourse, type DkhpParseResult } from "@/lib/parsers/uit-dkhp-parser";
import { insertCourseAdmin } from "@/lib/supabase/course-admin-actions";
import { getCourseComponents } from "@/lib/data/course-weight-registry";
import type { UpsertUserCourseInput } from "@/lib/supabase/courses-api";

interface Props {
  allCourses: Course[];
  onAdd: (input: Omit<UpsertUserCourseInput, "user_id">) => Promise<void>;
  onSuccess: () => void;
  onClose: () => void;
}

export default function ImportFromDkhp({ allCourses, onAdd, onSuccess, onClose }: Props) {
  const [result, setResult] = useState<DkhpParseResult | null>(null);
  const [checked, setChecked] = useState<Set<string>>(new Set());
  const [importing, setImporting] = useState(false);
  const [parseError, setParseError] = useState<string | null>(null);
  const [importedCount, setImportedCount] = useState(0);
  const [createdCount, setCreatedCount] = useState(0);
  const [done, setDone] = useState(false);
  const [dragging, setDragging] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const knownIds = new Set(allCourses.map((c) => c.id));

  function handleFile(file: File) {
    setParseError(null);
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const parsed = parseUitDkhp(e.target?.result as string);
        if (parsed.courses.length === 0) {
          setParseError("Không tìm thấy môn học. Hãy dùng file HTML từ trang Thông tin ĐKHP trên student.uit.edu.vn.");
          return;
        }
        setResult(parsed);
        setChecked(new Set(parsed.courses.map((c) => c.course_id)));
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

  function toggleCourse(id: string) {
    setChecked((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  async function handleImport() {
    if (!result) return;
    setImporting(true);
    const selected = result.courses.filter((c) => checked.has(c.course_id));
    let imported = 0;
    let created = 0;
    for (const c of selected) {
      try {
        // Auto-create unknown courses with default components before importing
        if (!knownIds.has(c.course_id)) {
          const components = getCourseComponents(c.course_id) ?? undefined;
          await insertCourseAdmin({ id: c.course_id, name: c.course_name, credits: c.credits, components });
          created++;
        }
        await onAdd({
          course_id: c.course_id,
          status: "in_progress",
          score: null,
          semester: c.semester || null,
          academic_year: c.academic_year || null,
          component_scores: {},
        });
        imported++;
      } catch {
        // skip duplicates / errors silently
      }
    }
    setImportedCount(imported);
    setCreatedCount(created);
    setImporting(false);
    setDone(true);
    onSuccess();
  }

  // ── Done screen ──────────────────────────────────────────
  if (done) {
    return (
      <div className="es-logout-overlay" onClick={onClose}>
        <div className="es-logout-modal" onClick={(e) => e.stopPropagation()} style={{ width: 400, textAlign: "center" }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>✅</div>
          <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 6 }}>
            Đã thêm {importedCount} môn đang học
          </div>
          {result?.semester && (
            <div style={{ fontSize: 13, color: "var(--es-muted)", marginBottom: createdCount > 0 ? 8 : 20 }}>
              Học kỳ: <strong>{result.semester}</strong>
            </div>
          )}
          {createdCount > 0 && (
            <div style={{ fontSize: 12, color: "var(--es-muted)", marginBottom: 20 }}>
              {createdCount} môn mới đã được thêm vào hệ thống
            </div>
          )}
          <button className="es-btn es-btn-primary" onClick={onClose}>Đóng</button>
        </div>
      </div>
    );
  }

  // ── Preview screen (after parse) ──────────────────────────
  if (result) {
    const unknown = result.courses.filter((c) => !knownIds.has(c.course_id));
    const allChecked = result.courses.every((c) => checked.has(c.course_id));

    return (
      <div className="es-logout-overlay" onClick={onClose}>
        <div className="es-logout-modal" onClick={(e) => e.stopPropagation()} style={{ width: 540 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <div>
              <div style={{ fontWeight: 700, fontSize: 16 }}>Xác nhận import lịch học</div>
              {result.semester && (
                <div style={{ fontSize: 12, color: "var(--es-muted)", marginTop: 2 }}>{result.semester}</div>
              )}
            </div>
            <button onClick={onClose} style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer", color: "var(--es-muted)" }}>×</button>
          </div>

          {unknown.length > 0 && (
            <div className="es-alert-strip warn" style={{ marginBottom: 12 }}>
              <span>ℹ️</span>
              <span>{unknown.length} môn chưa có trong hệ thống — sẽ được tạo tự động khi import</span>
            </div>
          )}

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
            <span style={{ fontSize: 13, color: "var(--es-muted)" }}>{checked.size}/{result.courses.length} môn được chọn</span>
            <button
              className="es-btn es-btn-outline es-btn-sm"
              onClick={() =>
                setChecked(allChecked ? new Set() : new Set(result.courses.map((c) => c.course_id)))
              }
            >
              {allChecked ? "Bỏ chọn tất cả" : "Chọn tất cả"}
            </button>
          </div>

          <div style={{ maxHeight: 300, overflowY: "auto", border: "1px solid var(--es-border)", borderRadius: "var(--r-sm)", marginBottom: 16 }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr style={{ background: "var(--es-bg-alt)", position: "sticky", top: 0 }}>
                  <th style={{ padding: "8px 10px", textAlign: "left", fontWeight: 600 }}></th>
                  <th style={{ padding: "8px 10px", textAlign: "left", fontWeight: 600 }}>Mã MH</th>
                  <th style={{ padding: "8px 10px", textAlign: "left", fontWeight: 600 }}>Tên môn</th>
                  <th style={{ padding: "8px 10px", textAlign: "right", fontWeight: 600 }}>TC</th>
                </tr>
              </thead>
              <tbody>
                {result.courses.map((c: DkhpCourse) => {
                  const isNew = !knownIds.has(c.course_id);
                  return (
                    <tr
                      key={c.course_id}
                      style={{ borderTop: "1px solid var(--es-border)", cursor: "pointer" }}
                      onClick={() => toggleCourse(c.course_id)}
                    >
                      <td style={{ padding: "8px 10px" }}>
                        <input
                          type="checkbox"
                          checked={checked.has(c.course_id)}
                          onChange={() => toggleCourse(c.course_id)}
                          onClick={(e) => e.stopPropagation()}
                        />
                      </td>
                      <td style={{ padding: "8px 10px", fontFamily: "var(--font-mono, monospace)", color: "var(--es-muted)" }}>
                        {c.course_id}
                        {isNew && (
                          <span style={{ marginLeft: 6, fontSize: 10, padding: "1px 5px", borderRadius: 4, background: "var(--amber-lt, #fef3c7)", color: "var(--amber, #d97706)", fontWeight: 600 }}>
                            MỚI
                          </span>
                        )}
                      </td>
                      <td style={{ padding: "8px 10px" }}>{c.course_name}</td>
                      <td style={{ padding: "8px 10px", textAlign: "right" }}>{c.credits}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
            <button className="es-btn es-btn-outline" onClick={() => setResult(null)}>← Chọn lại file</button>
            <button
              className="es-btn es-btn-primary"
              onClick={handleImport}
              disabled={importing || checked.size === 0}
            >
              {importing ? "Đang lưu..." : `Import ${checked.size} môn`}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Upload screen ──────────────────────────────────────────
  return (
    <div className="es-logout-overlay" onClick={onClose}>
      <div className="es-logout-modal" onClick={(e) => e.stopPropagation()} style={{ width: 460 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <div style={{ fontWeight: 700, fontSize: 16 }}>Import lịch học kỳ này</div>
          <button onClick={onClose} style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer", color: "var(--es-muted)" }}>×</button>
        </div>

        {parseError && (
          <div className="es-alert-strip warn" style={{ marginBottom: 12 }}>
            <span>⚠️</span><span>{parseError}</span>
          </div>
        )}

        {/* Drop zone */}
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
          <div style={{ fontSize: 36, marginBottom: 8 }}>📄</div>
          <div style={{ fontWeight: 600, marginBottom: 4 }}>Kéo thả hoặc click để chọn file</div>
          <div style={{ fontSize: 13, color: "var(--es-muted)" }}>File .html từ trang Thông tin ĐKHP</div>
        </div>

        <input
          ref={fileRef}
          type="file"
          accept=".html,.htm"
          style={{ display: "none" }}
          onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
        />

        {/* Guide hint */}
        <div style={{ fontSize: 12, color: "var(--es-muted)", lineHeight: 1.6 }}>
          <strong>Cách lấy file:</strong> Vào{" "}
          <a
            href="https://student.uit.edu.vn/sinhvien/dkhp/thongtindangky"
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: "var(--blue)" }}
          >
            Thông tin ĐKHP
          </a>
          {" "}→ <kbd style={{ fontSize: 11, padding: "1px 5px", borderRadius: 4, border: "1px solid var(--es-border)", background: "var(--es-bg-alt)" }}>Ctrl+S</kbd> → lưu file .html → upload ở đây.
        </div>
      </div>
    </div>
  );
}
