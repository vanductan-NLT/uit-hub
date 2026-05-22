"use client";

import { useRef, useState } from "react";
import { parseUitCtdt, type CtdtParseResult } from "@/lib/parsers/uit-ctdt-parser";
import { upsertCurriculum } from "@/lib/supabase/curriculum-api";

interface Props {
  onSuccess: () => void;
  onClose: () => void;
}

const MAJORS = ["CNTT", "KTPM", "KHMT", "MMT&TT", "ATTT", "HTTT"];

export default function ImportCtdtModal({ onSuccess, onClose }: Props) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [major, setMajor] = useState("CNTT");
  const [intakeYear, setIntakeYear] = useState(new Date().getFullYear() - 4);
  const [result, setResult] = useState<CtdtParseResult | null>(null);
  const [parseError, setParseError] = useState<string | null>(null);
  const [importing, setImporting] = useState(false);
  const [done, setDone] = useState<{ curriculumId: string; coursesLinked: number } | null>(null);

  function handleFile(file: File) {
    const reader = new FileReader();
    reader.onload = (e) => parseHtml(e.target?.result as string);
    reader.readAsText(file, "utf-8");
  }

  function parseHtml(html: string) {
    setParseError(null);
    setResult(null);
    const r = parseUitCtdt(html, major, intakeYear);
    if (r.courses.length === 0) {
      setParseError(r.errors[0] ?? "Không tìm thấy môn học nào trong file.");
    } else {
      setResult(r);
    }
  }

  async function handleImport() {
    if (!result) return;
    setImporting(true);
    try {
      const res = await upsertCurriculum(result);
      if (res.errors.length > 0) setParseError(res.errors.join(" · "));
      setDone({ curriculumId: res.curriculumId, coursesLinked: res.coursesLinked });
      onSuccess();
    } catch (e) {
      setParseError(e instanceof Error ? e.message : "Import thất bại.");
    } finally {
      setImporting(false);
    }
  }

  // Group courses by semester for preview
  const bySemester = result?.courses.reduce<Record<number, number>>((acc, c) => {
    acc[c.suggested_semester] = (acc[c.suggested_semester] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <div className="es-logout-overlay" onClick={onClose}>
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "var(--white)", borderRadius: "var(--r-2xl)",
          padding: 28, width: "min(520px, calc(100vw - 32px))",
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
              Nguồn: student.uit.edu.vn → Chương trình đào tạo
            </div>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", fontSize: 22, cursor: "pointer", color: "var(--es-muted)" }}>×</button>
        </div>

        {!done ? (
          <>
            {/* Major + year selectors */}
            <div style={{ display: "flex", gap: 10, marginBottom: 16 }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: "var(--ink2)", marginBottom: 6 }}>Ngành</div>
                <select
                  value={major}
                  onChange={(e) => setMajor(e.target.value)}
                  style={{
                    width: "100%", padding: "8px 12px", borderRadius: "var(--r)",
                    border: "1.5px solid var(--es-border)", fontFamily: "inherit",
                    fontSize: 14, background: "var(--white)", color: "var(--ink)",
                  }}
                >
                  {MAJORS.map((m) => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: "var(--ink2)", marginBottom: 6 }}>Năm nhập học</div>
                <input
                  type="number"
                  value={intakeYear}
                  min={2015} max={2030}
                  onChange={(e) => setIntakeYear(parseInt(e.target.value) || intakeYear)}
                  style={{
                    width: "100%", padding: "8px 12px", borderRadius: "var(--r)",
                    border: "1.5px solid var(--es-border)", fontFamily: "inherit",
                    fontSize: 14, background: "var(--white)", color: "var(--ink)",
                  }}
                />
              </div>
            </div>

            {/* 3-step guide */}
            <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 16 }}>
              {[
                {
                  n: 1,
                  label: "Mở trang CTĐT theo khoá",
                  detail: (
                    <a
                      href="https://student.uit.edu.vn/thong-tin-dao-tao/chuong-trinh-dao-tao"
                      target="_blank" rel="noopener noreferrer"
                      style={{ color: "var(--blue)", textDecoration: "none", fontWeight: 600 }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      student.uit.edu.vn → Chương trình đào tạo ↗
                    </a>
                  ),
                },
                {
                  n: 2,
                  label: "Lưu trang về máy",
                  detail: <span style={{ color: "var(--es-muted)" }}>Ctrl+S → chọn <strong>Webpage, HTML Only</strong> (.html)</span>,
                },
                {
                  n: 3,
                  label: "Chọn ngành + năm nhập học, kéo thả file",
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
                marginBottom: 16, background: "var(--bg)",
                transition: "border-color 0.15s",
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
              <div style={{ fontSize: 12, color: "var(--es-muted)", marginTop: 4 }}>
                Vào student.uit.edu.vn → Chương trình đào tạo → Save as HTML
              </div>
              <input ref={fileRef} type="file" accept=".html,.htm" style={{ display: "none" }}
                onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
            </div>

            {/* Semester preview */}
            {result && bySemester && (
              <div className="es-card" style={{ padding: "14px 16px", marginBottom: 16 }}>
                <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 10, color: "var(--ink)" }}>
                  Phân bổ theo học kỳ · {major} K{String(intakeYear).slice(-2)}
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  {Object.entries(bySemester)
                    .sort(([a], [b]) => Number(a) - Number(b))
                    .map(([sem, count]) => (
                      <div
                        key={sem}
                        style={{
                          padding: "6px 12px", borderRadius: "var(--r-full)",
                          background: "var(--blue-lt)", fontSize: 12, fontWeight: 700, color: "var(--blue)",
                        }}
                      >
                        HK{sem}: {count} môn
                      </div>
                    ))}
                </div>
                {result.total_credits_required > 0 && (
                  <div style={{ fontSize: 12, color: "var(--es-muted)", marginTop: 10 }}>
                    Tổng: {result.total_credits_required} TC
                    {result.general_credits && ` · ĐC ${result.general_credits}`}
                    {result.major_required_credits && ` · CN ${result.major_required_credits}`}
                  </div>
                )}
              </div>
            )}

            {parseError && (
              <div className="es-alert-strip warn" style={{ marginBottom: 12 }}>
                <span>⚠️</span><span>{parseError}</span>
              </div>
            )}

            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
              <button className="es-btn es-btn-outline" onClick={onClose}>Huỷ</button>
              <button
                className="es-btn es-btn-primary"
                onClick={handleImport}
                disabled={!result || importing}
              >
                {importing ? "Đang import..." : `📥 Import CTĐT ${major} K${String(intakeYear).slice(-2)}`}
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
