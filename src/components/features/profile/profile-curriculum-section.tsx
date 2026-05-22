"use client";

import { useCurriculum } from "@/hooks/use-curriculum";

interface Props {
  major: string | null | undefined;
  intakeYear: number | null | undefined;
  onImport: () => void;
  refreshKey?: number;
}

export default function ProfileCurriculumSection({ major, intakeYear, onImport, refreshKey }: Props) {
  const { curriculum, loading } = useCurriculum(major, intakeYear, refreshKey);

  const hasCurriculum = !!curriculum;
  const courseCount = curriculum?.courses.length ?? 0;
  const totalTC = curriculum?.total_credits_required ?? 0;

  return (
    <div className="es-card" style={{ marginTop: 14 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <div>
          <div className="es-section-title">Chương trình đào tạo</div>
          <div style={{ fontSize: 12, color: "var(--es-muted)", marginTop: 2 }}>
            {!major || !intakeYear
              ? "Cập nhật ngành và năm nhập học để liên kết CTĐT"
              : `${major} · K${String(intakeYear).slice(-2)} · student.uit.edu.vn`}
          </div>
        </div>
        <button
          className="es-btn es-btn-outline es-btn-sm"
          onClick={onImport}
          disabled={!major || !intakeYear}
        >
          {hasCurriculum ? "🔄 Cập nhật" : "📥 Import"}
        </button>
      </div>

      {loading ? (
        <div style={{ fontSize: 13, color: "var(--es-muted)" }}>Đang kiểm tra...</div>
      ) : hasCurriculum ? (
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {[
            { label: "Số môn", val: `${courseCount}` },
            { label: "Tổng TC", val: `${totalTC}` },
            { label: "ID", val: curriculum!.id },
          ].map((item) => (
            <div key={item.label} style={{
              flex: "1 1 80px", textAlign: "center", padding: "8px 10px",
              background: "var(--es-bg-alt, #f8f9fa)", borderRadius: "var(--r-sm)",
            }}>
              <div style={{ fontSize: 10, color: "var(--es-muted)", fontWeight: 600, marginBottom: 2 }}>{item.label}</div>
              <div style={{ fontSize: 14, fontWeight: 700, color: "var(--ink)", fontFamily: item.label === "ID" ? "monospace" : "inherit" }}>
                {item.val}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div style={{
          display: "flex", alignItems: "center", gap: 10, padding: "10px 12px",
          borderRadius: "var(--r-sm)", background: "var(--es-bg-alt, #f8f9fa)",
        }}>
          <span style={{ fontSize: 20 }}>📭</span>
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, color: "var(--ink)" }}>Chưa có dữ liệu CTĐT</div>
            <div style={{ fontSize: 11, color: "var(--es-muted)", marginTop: 1 }}>
              Bấm Import để tải CTĐT từ cổng sinh viên UIT
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
