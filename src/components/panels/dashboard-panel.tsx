"use client";

import { useMemo } from "react";
import type { UserCourseWithCourse } from "@/types/database";
import { calculateRequiredCK, calculatePartialScore } from "@/lib/gpa-forecast-utils";

interface Props {
  onNav: (panel: string) => void;
  displayName: string;
  loading: boolean;
  gpa4: number;
  passedCredits: number;
  totalCreditsRequired: number;
  inProgressCourses: UserCourseWithCourse[];
  completedCourses: UserCourseWithCourse[];
}

function gradeLabel(gpa4: number) {
  if (gpa4 >= 3.6) return "Xuất sắc";
  if (gpa4 >= 3.2) return "Giỏi";
  if (gpa4 >= 2.8) return "Khá";
  if (gpa4 >= 2.0) return "Trung bình";
  return gpa4 > 0 ? "Yếu" : "—";
}

export default function DashboardPanel({ onNav, displayName, loading, gpa4, passedCredits, totalCreditsRequired, inProgressCourses, completedCourses }: Props) {
  const now = new Date();
  const hour = now.getHours();
  const greeting = hour < 12 ? "Chào buổi sáng" : hour < 18 ? "Chào buổi chiều" : "Chào buổi tối";
  const dayNames = ["Chủ Nhật", "Thứ Hai", "Thứ Ba", "Thứ Tư", "Thứ Năm", "Thứ Sáu", "Thứ Bảy"];
  const dateStr = `${dayNames[now.getDay()]}, ${now.getDate()} tháng ${now.getMonth() + 1} · HK2 2024–2025`;

  const riskyCourses = useMemo(() =>
    inProgressCourses
      .map((c) => {
        const scores = c.component_scores ?? {};
        return { c, ckNeeded: calculateRequiredCK(c.course, scores, 7.0), partial: calculatePartialScore(c.course, scores) };
      })
      .filter(({ c, ckNeeded, partial }) => {
        const ckEntered = (c.component_scores?.["Cuối kỳ"] ?? null) !== null;
        return !ckEntered && partial !== null && ((ckNeeded !== null && ckNeeded > 8.5) || partial < 5.5);
      }),
    [inProgressCourses]
  );

  const riskyCount = riskyCourses.length;
  const aGradeCount = completedCourses.filter((c) => c.score !== null && c.score >= 8.5).length;

  const bannerTitle = loading ? "Đang tải dữ liệu..."
    : riskyCount > 0 ? `${riskyCount} môn cần chú ý kỳ này`
    : inProgressCourses.length > 0 ? "Tất cả môn đang tiến triển tốt"
    : "Chưa có môn học kỳ này";

  const bannerSub = loading ? ""
    : riskyCount > 0 ? "Nhập điểm thành phần và xem dự báo GPA để cải thiện kịp thời."
    : inProgressCourses.length > 0 ? "Tiếp tục duy trì nhịp học đều đặn nhé!"
    : "Import lịch học từ cổng thông tin UIT để bắt đầu theo dõi.";

  return (
    <>
      <div className="es-topbar">
        <div className="es-topbar-left">
          <div className="es-topbar-title">{greeting}, {displayName} 👋</div>
          <div className="es-topbar-sub">{dateStr}</div>
        </div>
        <div className="es-topbar-right">
          <button className="es-btn es-btn-outline es-btn-sm">⚙️ Cài đặt</button>
        </div>
      </div>

      <div className="es-content">
        <div className="es-welcome-banner">
          <div className="es-welcome-text">
            <h2>{bannerTitle}</h2>
            <p>{bannerSub}</p>
          </div>
          <div className="es-welcome-actions">
            <button className="es-btn-white" onClick={() => onNav("exam")}>Xem lịch ôn thi</button>
            <button className="es-btn-dark" onClick={() => onNav(riskyCount > 0 ? "gpa" : "tracker")}>
              {riskyCount > 0 ? "Xem dự báo GPA" : "Cập nhật tiến độ"}
            </button>
          </div>
        </div>

        {!loading && riskyCourses.slice(0, 2).map(({ c, ckNeeded }) => (
          <div key={c.id} className="es-alert-strip warn" style={{ marginTop: 8 }}>
            <span>⚠️</span>
            <span className="es-alert-text">
              <strong>{c.course.name}:</strong>{" "}
              {ckNeeded !== null && ckNeeded > 10
                ? "Không thể đạt B với điểm hiện tại."
                : ckNeeded !== null
                ? `Cần ít nhất ${ckNeeded.toFixed(1)} điểm cuối kỳ để đạt B.`
                : "Điểm hiện tại chưa đủ an toàn."}
            </span>
            <button className="es-alert-cta" onClick={() => onNav("gpa")}>Xem dự báo →</button>
          </div>
        ))}

        <div className="es-grid-4" style={{ margin: "20px 0 0" }}>
          <div className="es-stat-card">
            <div className="es-stat-label">GPA tích lũy</div>
            <div className="es-stat-value">{loading ? "…" : gpa4.toFixed(2)}</div>
            <div className="es-stat-delta" style={{ color: "var(--es-muted)" }}>{loading ? "" : gradeLabel(gpa4)}</div>
          </div>
          <div className="es-stat-card">
            <div className="es-stat-label">Tín chỉ tích lũy</div>
            <div className="es-stat-value">
              {loading ? "…" : passedCredits}
              {!loading && <span style={{ fontSize: 16, color: "var(--es-muted)" }}>/{totalCreditsRequired}</span>}
            </div>
            <div className="es-stat-delta" style={{ color: "var(--es-muted)" }}>
              {loading ? "" : `${Math.round((passedCredits / totalCreditsRequired) * 100)}% chương trình`}
            </div>
          </div>
          <div className="es-stat-card">
            <div className="es-stat-label">Môn đã hoàn thành</div>
            <div className="es-stat-value">{loading ? "…" : completedCourses.length}</div>
            <div className="es-stat-delta" style={{ color: "var(--es-muted)" }}>
              {loading ? "" : `${aGradeCount} môn điểm A`}
            </div>
          </div>
          <div className="es-stat-card">
            <div className="es-stat-label">Môn HK này</div>
            <div className="es-stat-value">{loading ? "…" : inProgressCourses.length}</div>
            <div className="es-stat-delta" style={{ color: riskyCount > 0 ? "var(--amber)" : "var(--green)" }}>
              {loading ? "" : riskyCount > 0 ? `${riskyCount} cần chú ý` : inProgressCourses.length > 0 ? "Tất cả ổn" : "—"}
            </div>
          </div>
        </div>

        <div className="es-section-hdr" style={{ marginTop: 20 }}>
          <div className="es-section-title">Hành động nhanh</div>
        </div>
        <div className="es-quick-actions">
          <div className="es-quick-action" onClick={() => onNav("gpa")}>
            <div className="es-quick-action-icon">🔮</div>
            <div className="es-quick-action-name">Kiểm tra dự báo</div>
            <div className="es-quick-action-desc">
              {loading ? "…" : riskyCount > 0 ? `${riskyCount} môn cần chú ý` : "Mọi thứ đang ổn"}
            </div>
          </div>
          <div className="es-quick-action" onClick={() => onNav("exam")}>
            <div className="es-quick-action-icon">📅</div>
            <div className="es-quick-action-name">Lịch ôn thi</div>
            <div className="es-quick-action-desc">Xem kế hoạch ôn thi</div>
          </div>
          <div className="es-quick-action" onClick={() => onNav("roadmap")}>
            <div className="es-quick-action-icon">🗺️</div>
            <div className="es-quick-action-name">Lộ trình HK sau</div>
            <div className="es-quick-action-desc">
              {loading ? "…" : `${completedCourses.length} môn đã hoàn thành`}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
