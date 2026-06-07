"use client";

import { useRef, useState } from "react";
import { parseUitCtdt, type CtdtParseResult } from "@/lib/parsers/uit-ctdt-parser";
import { upsertCurriculum } from "@/lib/supabase/curriculum-api";
import { intakeYearFromStudentId, khoaLabel, khoaNumberFromYear } from "@/lib/validation-utils";

interface Props {
  onSuccess: () => void;
  onClose: () => void;
  /** User whose profile gets bound to the imported curriculum. */
  userId?: string;
  /** Pre-fill from user profile */
  defaultMajor?: string | null;
  defaultIntakeYear?: number | null;
  defaultStudentId?: string | null;
  defaultTrainingType?: "chinh-quy" | "tu-xa" | null;
}

const MAJORS = ["CNTT", "KTPM", "KHMT", "MMT&TT", "ATTT", "HTTT", "TTNT", "Khác"];
type HeDaoTao = "chinh-quy" | "tu-xa";

function buildCtdtUrl(year: number, he: HeDaoTao): string {
  if (he === "tu-xa") return `https://student.uit.edu.vn/tu-xa/ctdt-khoa-${year}`;
  const seg = year >= 2025 ? "cqui" : "chuong-trinh-dao-tao";
  return `https://student.uit.edu.vn/${seg}/ctdt-khoa-${year}`;
}

export default function ImportCtdtModal({ onSuccess, onClose, userId, defaultMajor, defaultIntakeYear, defaultStudentId, defaultTrainingType }: Props) {
  const fileRef = useRef<HTMLInputElement>(null);

  // Derive intake from MSSV when the profile doesn't have it stored, so the
  // curriculum id matches the student's actual cohort instead of a guess.
  const fallbackIntake = intakeYearFromStudentId(defaultStudentId ?? "") ?? new Date().getFullYear() - 4;

  // Profile mode: all 3 values come from profile → no selectors shown
  const hasProfile = !!(defaultMajor && defaultIntakeYear);

  const [major, setMajor] = useState(
    defaultMajor && MAJORS.includes(defaultMajor) ? defaultMajor : "CNTT"
  );
  const [intakeYear, setIntakeYear] = useState(defaultIntakeYear ?? fallbackIntake);
  const [he, setHe] = useState<HeDaoTao>(defaultTrainingType ?? "chinh-quy");

  const [result, setResult] = useState<CtdtParseResult | null>(null);
  const [parseError, setParseError] = useState<string | null>(null);
  const [importing, setImporting] = useState(false);
  const [done, setDone] = useState<{ curriculumId: string; coursesLinked: number } | null>(null);

  const ctdtUrl = buildCtdtUrl(intakeYear, he);
  const heLabel = he === "tu-xa" ? "Từ xa" : "Chính quy";

  function handleFile(file: File) {
    const reader = new FileReader();
    reader.onload = (e) => {
      setParseError(null);
      setResult(null);
      const r = parseUitCtdt(e.target?.result as string, major, intakeYear);
      if (r.courses.length === 0) setParseError(r.errors[0] ?? "Không tìm thấy môn học nào trong file.");
      else setResult(r);
    };
    reader.readAsText(file, "utf-8");
  }

  async function handleImport() {
    if (!result) return;
    setImporting(true);
    try {
      const res = await upsertCurriculum(result, userId);
      if (res.errors.length > 0) setParseError(res.errors.join(" · "));
      setDone({ curriculumId: res.curriculumId, coursesLinked: res.coursesLinked });
      onSuccess();
    } catch (e) {
      setParseError(e instanceof Error ? e.message : "Import thất bại.");
    } finally {
      setImporting(false);
    }
  }

  const bySemester = result?.courses.reduce<Record<number, number>>((acc, c) => {
    acc[c.suggested_semester] = (acc[c.suggested_semester] ?? 0) + 1;
    return acc;
  }, {});

  const selectStyle: React.CSSProperties = {
    width: "100%", padding: "8px 12px", borderRadius: "var(--r)",
    border: "1.5px solid var(--es-border)", fontFamily: "inherit",
    fontSize: 14, background: "var(--white)", color: "var(--ink)",
  };

  return (
    <div className="es-logout-overlay" onClick={onClose}>
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "var(--white)", borderRadius: "var(--r-2xl)",
          padding: 28, width: "min(480px, calc(100vw - 32px))",
          boxShadow: "var(--shadow-clay)",
          animation: "duo-bounce-in 0.3s cubic-bezier(0.34,1.56,0.64,1)",
          maxHeight: "90dvh", overflowY: "auto",
        }}
      >
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: 16, color: "var(--ink)" }}>🎓 Import CTĐT theo khoá</div>
            <div style={{ fontSize: 12, color: "var(--es-muted)", marginTop: 3 }}>
              Nguồn: student.uit.edu.vn · Chương trình đào tạo
            </div>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", fontSize: 22, cursor: "pointer", color: "var(--es-muted)" }}>×</button>
        </div>

        {!done ? (
          <>
            {/* Profile mode: read-only summary of 4 fields */}
            {hasProfile ? (
              <div style={{
                display: "grid", gridTemplateColumns: "1fr 1fr",
                gap: 8, marginBottom: 16, padding: "12px 14px",
                borderRadius: "var(--r)", background: "var(--es-bg-alt, #f8f9fa)",
                border: "1.5px solid var(--es-border)",
              }}>
                {[
                  { label: "Ngành", val: major },
                  { label: "Khoá", val: khoaLabel(intakeYear) },
                  { label: "Hệ đào tạo", val: heLabel },
                ].map(({ label, val }) => (
                  <div key={label}>
                    <div style={{ fontSize: 11, color: "var(--es-muted)", fontWeight: 600, marginBottom: 2 }}>{label}</div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: "var(--ink)" }}>{val}</div>
                  </div>
                ))}
              </div>
            ) : (
              /* Manual mode: show all 3 selectors */
              <div style={{ display: "flex", gap: 10, marginBottom: 16, flexWrap: "wrap" }}>
                <div style={{ flex: "1 1 110px" }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: "var(--ink2)", marginBottom: 6 }}>Ngành</div>
                  <select value={major} onChange={(e) => setMajor(e.target.value)} style={selectStyle}>
                    {MAJORS.map((m) => <option key={m} value={m}>{m}</option>)}
                  </select>
                </div>
                <div style={{ flex: "1 1 90px" }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: "var(--ink2)", marginBottom: 6 }}>Năm nhập học</div>
                  <input type="number" value={intakeYear} min={2013} max={2030}
                    onChange={(e) => setIntakeYear(parseInt(e.target.value) || intakeYear)} style={selectStyle} />
                </div>
                <div style={{ flex: "1 1 110px" }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: "var(--ink2)", marginBottom: 6 }}>Hệ đào tạo</div>
                  <select value={he} onChange={(e) => setHe(e.target.value as HeDaoTao)} style={selectStyle}>
                    <option value="chinh-quy">Chính quy</option>
                    <option value="tu-xa">Từ xa</option>
                  </select>
                </div>
              </div>
            )}

            {/* 2-step guide */}
            <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 16 }}>
              {[
                {
                  n: 1, label: "Mở trang CTĐT và lưu về máy",
                  detail: (
                    <span style={{ color: "var(--es-muted)" }}>
                      <a href={ctdtUrl} target="_blank" rel="noopener noreferrer"
                        style={{ color: "var(--blue)", fontWeight: 600, textDecoration: "none" }}
                        onClick={(e) => e.stopPropagation()}>
                        {ctdtUrl.replace("https://student.uit.edu.vn/", "")} ↗
                      </a>
                      {" "}→ chọn ngành <strong>{major}</strong> → Ctrl+S → <strong>Webpage, HTML Only</strong>
                    </span>
                  ),
                },
                {
                  n: 2, label: "Kéo thả file HTML vào đây",
                  detail: <span style={{ color: "var(--es-muted)" }}>hoặc click vùng bên dưới để chọn file</span>,
                },
              ].map(({ n, label, detail }) => (
                <div key={n} style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
                  <div style={{
                    width: 24, height: 24, borderRadius: "50%", flexShrink: 0,
                    background: "var(--blue)", color: "#fff",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 12, fontWeight: 700,
                  }}>{n}</div>
                  <div style={{ paddingTop: 2 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: "var(--ink)" }}>{label}</div>
                    <div style={{ fontSize: 12, marginTop: 1 }}>{detail}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* File drop zone */}
            <div
              style={{
                border: `2px dashed ${result ? "var(--green)" : "var(--es-border)"}`,
                borderRadius: "var(--r-xl)", padding: "20px",
                textAlign: "center", cursor: "pointer",
                marginBottom: 16, background: "var(--bg)", transition: "border-color 0.15s",
              }}
              onClick={() => fileRef.current?.click()}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) handleFile(f); }}
            >
              <div style={{ fontSize: 24, marginBottom: 6 }}>{result ? "✅" : "🎓"}</div>
              <div style={{ fontWeight: 600, fontSize: 13, color: result ? "var(--green)" : "var(--ink)" }}>
                {result
                  ? `${result.courses.length} môn · ${Object.keys(bySemester ?? {}).length} học kỳ đã nhận diện`
                  : "Kéo thả hoặc click để chọn file HTML"}
              </div>
              <input ref={fileRef} type="file" accept=".html,.htm" style={{ display: "none" }}
                onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
            </div>

            {/* Semester preview chips */}
            {result && bySemester && (
              <div className="es-card" style={{ padding: "12px 14px", marginBottom: 16 }}>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {Object.entries(bySemester).sort(([a], [b]) => Number(a) - Number(b)).map(([sem, count]) => (
                    <div key={sem} style={{
                      padding: "4px 10px", borderRadius: "var(--r-full)",
                      background: "var(--blue-lt)", fontSize: 11, fontWeight: 700, color: "var(--blue)",
                    }}>HK{sem}: {count}</div>
                  ))}
                  {result.total_credits_required > 0 && (
                    <div style={{ fontSize: 11, color: "var(--es-muted)", alignSelf: "center", marginLeft: 4 }}>
                      Tổng {result.total_credits_required} TC
                    </div>
                  )}
                </div>
              </div>
            )}

            {parseError && (
              <div className="es-alert-strip warn" style={{ marginBottom: 12 }}>
                <span>⚠️</span><span>{parseError}</span>
              </div>
            )}

            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
              <button className="es-btn es-btn-outline" onClick={onClose}>Huỷ</button>
              <button className="es-btn es-btn-primary" onClick={handleImport} disabled={!result || importing}>
                {importing ? "Đang import..." : `📥 Import ${major} K${khoaNumberFromYear(intakeYear)}`}
              </button>
            </div>
          </>
        ) : (
          <div style={{ textAlign: "center", padding: "20px 0" }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>✅</div>
            <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 6 }}>Import thành công!</div>
            <div style={{ fontSize: 13, color: "var(--es-muted)", marginBottom: 4 }}>
              Curriculum ID: <span className="es-mono" style={{ color: "var(--blue)" }}>{done.curriculumId}</span>
            </div>
            <div style={{ fontSize: 13, color: "var(--es-muted)", marginBottom: 20 }}>
              {done.coursesLinked} môn đã được liên kết vào chương trình.
            </div>
            <button className="es-btn es-btn-primary" onClick={onClose}>Đóng</button>
          </div>
        )}
      </div>
    </div>
  );
}
