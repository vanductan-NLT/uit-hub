"use client";

import { useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { parseUitTranscript, type ParsedCourse, type ParseResult } from "@/lib/parsers/uit-transcript-parser";
import type { Course } from "@/types/database";

interface ImportFromHtmlProps {
  userId: string;
  userEmail: string;
  allCourses: Course[];
  onSuccess: () => void;
  onClose: () => void;
}

const STATUS_BADGE: Record<ParsedCourse["status"], string> = {
  completed: "es-badge-green",
  exempted: "es-badge-amber",
  failed: "es-badge-red",
};
const STATUS_LABEL: Record<ParsedCourse["status"], string> = {
  completed: "Đạt", exempted: "Miễn", failed: "Rớt",
};

function buildGuideSteps(mssv: string) {
  const url = `https://daa.uit.edu.vn/print/sinhvien/kqhoctap/?sid=${mssv}`;
  return [
    { n: 1, text: "Vào trang điểm → chuột phải → ", link: url, linkText: url, suffix: ' → "Save as..." → lưu file .html' },
    { n: 2, text: "Kéo thả hoặc chọn file bên dưới", link: null, linkText: null, suffix: null },
  ];
}

export default function ImportFromHtml({ userId, userEmail, allCourses, onSuccess, onClose }: ImportFromHtmlProps) {
  const [step, setStep] = useState<"guide" | "preview" | "done">("guide");
  const [result, setResult] = useState<ParseResult | null>(null);
  const [checked, setChecked] = useState<Set<string>>(new Set());
  const [importing, setImporting] = useState(false);
  const [parseError, setParseError] = useState<string | null>(null);
  const [importedCount, setImportedCount] = useState(0);
  const fileRef = useRef<HTMLInputElement>(null);
  const knownIds = new Set(allCourses.map((c) => c.id));
  const mssv = userEmail.split("@")[0];
  const guideSteps = buildGuideSteps(mssv);

  function handleFile(file: File) {
    setParseError(null);
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const parsed = parseUitTranscript(e.target?.result as string);
        setResult(parsed);
        // Default: check all except exempted
        setChecked(new Set(parsed.courses.filter((c) => c.status !== "exempted").map((c) => c.course_id)));
        setStep("preview");
      } catch {
        setParseError("Không thể đọc file. Hãy đảm bảo đây là file HTML từ daa.uit.edu.vn.");
      }
    };
    reader.readAsText(file, "utf-8");
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }

  async function handleImport() {
    if (!result) return;
    setImporting(true);
    const selected = result.courses.filter((c) => checked.has(c.course_id));
    // Dedup by course_id — keep highest-scoring occurrence.
    // UIT HTML lists newest semester first, so simple last-write would store the older (lower) score
    // when a student retook a course to improve. Keeping highest score matches UIT GPA calculation.
    const deduped = [...selected.reduce((map, c) => {
      const existing = map.get(c.course_id);
      if (!existing || (c.score ?? -1) > (existing.score ?? -1)) {
        map.set(c.course_id, c);
      }
      return map;
    }, new Map<string, typeof selected[0]>()).values()];
    try {
      const supabase = createClient();
      const { error } = await supabase.from("user_courses").upsert(
        deduped.map((c) => ({
          user_id: userId, course_id: c.course_id, score: c.score,
          semester: c.semester, academic_year: c.academic_year, status: c.status,
        })),
        { onConflict: "user_id,course_id" }
      );
      if (error) throw new Error(error.message);
      setImportedCount(selected.length);
      setStep("done");
      onSuccess();
    } catch (e) {
      setParseError(e instanceof Error ? e.message : "Lỗi khi import.");
    } finally {
      setImporting(false);
    }
  }

  const toggleAll = (val: boolean) =>
    setChecked(val ? new Set(result!.courses.map((c) => c.course_id)) : new Set());

  return (
    <div className="es-logout-overlay" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} style={{
        background: "var(--white)", borderRadius: "var(--r-lg)", border: "1px solid var(--es-border)",
        width: step === "preview" ? 680 : 460, maxWidth: "calc(100vw - 32px)",
        maxHeight: "85vh", display: "flex", flexDirection: "column",
      }}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "20px 24px 0" }}>
          <div style={{ fontSize: 16, fontWeight: 700, color: "var(--ink)" }}>📥 Import từ UIT</div>
          <button className="es-btn-ghost" onClick={onClose} style={{ fontSize: 18 }}>×</button>
        </div>

        <div style={{ padding: "16px 24px 24px", overflowY: "auto", flex: 1 }}>
          {/* STEP: GUIDE */}
          {step === "guide" && (
            <>
              <div style={{ marginBottom: 20 }}>
                {guideSteps.map((s) => (
                  <div key={s.n} style={{ display: "flex", gap: 12, marginBottom: 12, alignItems: "flex-start" }}>
                    <div style={{ width: 22, height: 22, borderRadius: 99, background: "var(--blue)", color: "#fff", fontSize: 12, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 1 }}>
                      {s.n}
                    </div>
                    <div style={{ fontSize: 13, color: "var(--ink2)", paddingTop: 2 }}>
                      {s.text}
                      {s.link && <a href={s.link} target="_blank" rel="noreferrer" style={{ color: "var(--blue)", fontWeight: 600, wordBreak: "break-all" }}>{s.linkText}</a>}
                      {s.suffix}
                    </div>
                  </div>
                ))}
              </div>

              {parseError && <div className="es-login-error" style={{ marginBottom: 12 }}>{parseError}</div>}

              <div
                onDrop={onDrop} onDragOver={(e) => e.preventDefault()}
                onClick={() => fileRef.current?.click()}
                style={{
                  border: "2px dashed var(--blue-mid)", borderRadius: "var(--r)", padding: "32px 24px",
                  textAlign: "center", cursor: "pointer", background: "var(--blue-lt)", transition: "all .15s",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.borderColor = "var(--blue)")}
                onMouseLeave={(e) => (e.currentTarget.style.borderColor = "var(--blue-mid)")}
              >
                <div style={{ fontSize: 28, marginBottom: 8 }}>📄</div>
                <div style={{ fontSize: 14, fontWeight: 600, color: "var(--blue)", marginBottom: 4 }}>Kéo thả file .html vào đây</div>
                <div style={{ fontSize: 12, color: "var(--es-muted)" }}>hoặc click để chọn file</div>
              </div>
              <input ref={fileRef} type="file" accept=".html,.htm" style={{ display: "none" }}
                onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])} />
            </>
          )}

          {/* STEP: PREVIEW */}
          {step === "preview" && result && (
            <>
              {/* Student info */}
              <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
                <span className="es-badge es-badge-blue">{result.student.full_name}</span>
                <span className="es-badge es-badge-gray">{result.student.student_id}</span>
                <span className="es-badge es-badge-gray">{result.student.major} · {result.student.class_name}</span>
                <span className="es-badge es-badge-green">GPA {result.summary.gpa}</span>
              </div>

              {/* Controls */}
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                <span style={{ fontSize: 13, color: "var(--ink2)", flex: 1 }}>
                  {checked.size}/{result.courses.length} môn được chọn
                </span>
                <button className="es-btn-ghost" style={{ fontSize: 12 }} onClick={() => toggleAll(true)}>Chọn tất cả</button>
                <button className="es-btn-ghost" style={{ fontSize: 12 }} onClick={() => toggleAll(false)}>Bỏ chọn</button>
              </div>

              {/* Course table */}
              <div style={{ border: "1px solid var(--es-border)", borderRadius: "var(--r-sm)", overflow: "hidden", marginBottom: 16 }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ background: "var(--bg)" }}>
                      {["", "Mã HP", "Tên môn học", "TC", "Điểm", "Học kỳ", "Tình trạng"].map((h) => (
                        <th key={h} style={{ padding: "8px 10px", fontSize: 11, fontWeight: 600, color: "var(--es-muted)", textAlign: "left", borderBottom: "1px solid var(--es-border)", whiteSpace: "nowrap" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {result.courses.map((c) => {
                      const unknown = !knownIds.has(c.course_id);
                      return (
                        <tr key={`${c.course_id}-${c.semester}`} style={{ background: unknown ? "var(--amber-lt)" : "var(--white)", borderBottom: "1px solid var(--es-border)" }}>
                          <td style={{ padding: "8px 10px" }}>
                            <input type="checkbox" checked={checked.has(c.course_id)}
                              onChange={(e) => setChecked((prev) => { const s = new Set(prev); e.target.checked ? s.add(c.course_id) : s.delete(c.course_id); return s; })} />
                          </td>
                          <td style={{ padding: "8px 10px", fontSize: 12, fontWeight: 600, fontFamily: "monospace", color: unknown ? "var(--amber)" : "var(--ink)" }}>{c.course_id}</td>
                          <td style={{ padding: "8px 10px", fontSize: 12, color: "var(--ink)", maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.course_name}</td>
                          <td style={{ padding: "8px 10px", fontSize: 12, color: "var(--ink2)", textAlign: "center" }}>{c.credits}</td>
                          <td style={{ padding: "8px 10px", fontSize: 13, fontWeight: 700, textAlign: "center", fontFamily: "monospace" }}>{c.score ?? "—"}</td>
                          <td style={{ padding: "8px 10px", fontSize: 11, color: "var(--es-muted)", fontFamily: "monospace" }}>{c.semester}</td>
                          <td style={{ padding: "8px 10px" }}><span className={`es-badge ${STATUS_BADGE[c.status]}`}>{STATUS_LABEL[c.status]}</span></td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {parseError && <div className="es-login-error" style={{ marginBottom: 12 }}>{parseError}</div>}
              {result.courses.some((c) => !knownIds.has(c.course_id)) && (
                <div className="es-alert-strip warn" style={{ marginBottom: 12 }}>
                  <span>⚠️</span>
                  <div className="es-alert-text">Các môn nền vàng chưa có trong danh mục — vẫn có thể import.</div>
                </div>
              )}

              <div style={{ display: "flex", gap: 10 }}>
                <button className="es-btn es-btn-outline" onClick={() => setStep("guide")} style={{ flex: 1, justifyContent: "center" }}>← Quay lại</button>
                <button className="es-btn es-btn-primary" onClick={handleImport} disabled={importing || checked.size === 0} style={{ flex: 2, justifyContent: "center" }}>
                  {importing ? "Đang import..." : `Import ${checked.size} môn`}
                </button>
              </div>
            </>
          )}

          {/* STEP: DONE */}
          {step === "done" && (
            <div style={{ textAlign: "center", padding: "16px 0" }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>✅</div>
              <div style={{ fontSize: 16, fontWeight: 700, color: "var(--ink)", marginBottom: 6 }}>Import thành công!</div>
              <div style={{ fontSize: 13, color: "var(--es-muted)", marginBottom: 24 }}>
                Đã lưu <strong>{importedCount}</strong> môn học vào hồ sơ của bạn.
              </div>
              <button className="es-btn es-btn-primary" onClick={onClose} style={{ justifyContent: "center" }}>Đóng</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
