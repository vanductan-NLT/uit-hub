"use client";

import { useState, useMemo } from "react";
import { useExamSchedule, type ExamWithProgress } from "@/hooks/use-exam-schedule";
import type { Course, UserCourseWithCourse } from "@/types/database";
import ImportExamHtml from "@/components/features/exam-schedule/import-exam-html";

interface Props {
  userId: string;
  userCourses: UserCourseWithCourse[];
  allCourses: Course[];
  currentSemester: string | null;
}

const MONTH_NAMES = ["Tháng 1", "Tháng 2", "Tháng 3", "Tháng 4", "Tháng 5", "Tháng 6", "Tháng 7", "Tháng 8", "Tháng 9", "Tháng 10", "Tháng 11", "Tháng 12"];
const URGENCY_ICONS: Record<string, string> = { red: "🔴", amber: "🟡", green: "🟢" };
const URGENCY_COLORS: Record<string, string> = { red: "var(--red)", amber: "var(--amber)", green: "var(--green)" };
const URGENCY_BAR: Record<string, string> = { red: "", amber: "amber", green: "green" };

export default function ExamPanel({ userId, userCourses, allCourses, currentSemester }: Props) {
  const { exams, sessions, loading, nearestExam, todaySessions, stats, toggleSession, deleteExam, refetch } = useExamSchedule(userId, userCourses);
  const [showImport, setShowImport] = useState(false);

  const today = new Date().toISOString().split("T")[0];

  if (loading) {
    return (
      <>
        <div className="es-topbar">
          <div className="es-topbar-left">
            <div className="es-topbar-title">Kế hoạch ôn thi</div>
            <div className="es-topbar-sub">Đang tải...</div>
          </div>
        </div>
        <div className="es-content" style={{ textAlign: "center", padding: 60, color: "var(--es-muted)" }}>
          Đang tải lịch thi...
        </div>
      </>
    );
  }

  // ── Empty state ──
  if (exams.length === 0) {
    return (
      <>
        <div className="es-topbar">
          <div className="es-topbar-left">
            <div className="es-topbar-title">Kế hoạch ôn thi</div>
            <div className="es-topbar-sub">Lịch ngược từ ngày thi · Ưu tiên môn yếu</div>
          </div>
        </div>
        <div className="es-content" style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: 400 }}>
          <div style={{ textAlign: "center", maxWidth: 400 }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>📅</div>
            <div style={{ fontWeight: 700, fontSize: 18, marginBottom: 8 }}>Chưa có lịch thi</div>
            <div style={{ fontSize: 14, color: "var(--es-muted)", marginBottom: 24, lineHeight: 1.6 }}>
              Import lịch thi từ cổng thông tin UIT hoặc thêm thủ công để hệ thống tự động tạo kế hoạch ôn tập.
            </div>
            <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
              <button className="es-btn es-btn-primary" onClick={() => setShowImport(true)}>
                📄 Import từ HTML
              </button>
            </div>
          </div>
        </div>
        {showImport && (
          <ImportExamHtml
            userId={userId}
            currentSemester={currentSemester}
            userCourses={userCourses}
            allCourses={allCourses}
            onSuccess={refetch}
            onClose={() => setShowImport(false)}
          />
        )}
      </>
    );
  }

  return (
    <>
      <div className="es-topbar">
        <div className="es-topbar-left">
          <div className="es-topbar-title">Kế hoạch ôn thi</div>
          <div className="es-topbar-sub">Lịch ngược từ ngày thi · Ưu tiên môn yếu</div>
        </div>
        <div className="es-topbar-right">
          {nearestExam && nearestExam.daysLeft >= 0 && (
            <span className={`es-badge es-badge-${nearestExam.urgency === "green" ? "green" : nearestExam.urgency === "amber" ? "amber" : "red"}`}>
              Gần nhất: {nearestExam.daysLeft} ngày
            </span>
          )}
          <button className="es-btn es-btn-primary es-btn-sm" onClick={() => setShowImport(true)}>
            + Import lịch thi
          </button>
        </div>
      </div>

      <div className="es-content">
        <div className="es-grid-2" style={{ alignItems: "start" }}>
          {/* Left: Exam list */}
          <div>
            {nearestExam && nearestExam.daysLeft >= 0 && (
              <div style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "6px 12px", borderRadius: 99, background: nearestExam.urgency === "red" ? "var(--red-lt)" : nearestExam.urgency === "amber" ? "var(--amber-lt)" : "var(--green-lt)", fontSize: 12, fontWeight: 700, color: URGENCY_COLORS[nearestExam.urgency], marginBottom: 14 }}>
                {nearestExam.urgency === "red" ? "🚨" : "📅"} Thi gần nhất: {formatDateShort(nearestExam.exam_date)} · Còn {nearestExam.daysLeft} ngày
              </div>
            )}

            {exams.map((exam) => (
              <ExamCard
                key={exam.id}
                exam={exam}
                today={today}
                onToggleSession={toggleSession}
                onDelete={() => deleteExam(exam.id)}
              />
            ))}
          </div>

          {/* Right: Today + Stats */}
          <div>
            {/* Today's priority */}
            <div className="es-card" style={{ marginBottom: 14 }}>
              <div className="es-section-hdr"><div className="es-section-title">Ưu tiên hôm nay</div></div>
              {todaySessions.length === 0 ? (
                <div style={{ fontSize: 13, color: "var(--es-muted)", padding: "12px 0" }}>
                  Không có buổi ôn nào hôm nay 🎉
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {todaySessions.map((s, i) => {
                    const exam = exams.find((e) => e.id === s.exam_id);
                    if (!exam) return null;
                    const urgencyBg = exam.urgency === "red" ? "var(--red-lt)" : exam.urgency === "amber" ? "var(--amber-lt)" : undefined;
                    const urgencyBorder = exam.urgency === "red" ? "var(--red)" : exam.urgency === "amber" ? "var(--amber)" : undefined;
                    return (
                      <div
                        key={s.id}
                        className="es-card-sm"
                        style={{
                          display: "flex", alignItems: "center", gap: 12,
                          borderColor: urgencyBorder, background: urgencyBg,
                          opacity: s.is_completed ? 0.6 : 1,
                          cursor: "pointer",
                        }}
                        onClick={() => toggleSession(s.id)}
                      >
                        <span style={{ fontSize: 18 }}>
                          {s.is_completed ? "✅" : `${i + 1}️⃣`}
                        </span>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 13, fontWeight: 700, textDecoration: s.is_completed ? "line-through" : undefined }}>
                            {exam.course.name}
                          </div>
                          <div style={{ fontSize: 11, color: "var(--es-muted)" }}>
                            Thi còn {exam.daysLeft} ngày · Ôn {exam.progress.percentage}%
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Stats */}
            <div className="es-card" style={{ marginBottom: 14 }}>
              <div className="es-section-hdr"><div className="es-section-title">Thống kê ôn tập</div></div>
              <div className="es-grid-2" style={{ gap: 10 }}>
                <div className="es-stat-card">
                  <div className="es-stat-label">Buổi ôn đã lên lịch</div>
                  <div className="es-stat-value">{stats.totalSessions}</div>
                  <div className="es-stat-delta" style={{ color: "var(--es-muted)" }}>cho {exams.length} môn thi</div>
                </div>
                <div className="es-stat-card">
                  <div className="es-stat-label">Đã hoàn thành</div>
                  <div className="es-stat-value">{stats.completedSessions}</div>
                  <div className="es-stat-delta delta-up" style={{ color: stats.completedSessions > 0 ? "var(--green)" : "var(--es-muted)" }}>
                    {stats.totalSessions > 0 ? `${Math.round((stats.completedSessions / stats.totalSessions) * 100)}% tổng` : "—"}
                  </div>
                </div>
              </div>
            </div>

            {/* Calendar heatmap */}
            <CalendarHeatmap exams={exams} sessions={sessions} />
          </div>
        </div>
      </div>

      {showImport && (
        <ImportExamHtml
          userId={userId}
          currentSemester={currentSemester}
          userCourses={userCourses}
          allCourses={allCourses}
          onSuccess={refetch}
          onClose={() => setShowImport(false)}
        />
      )}
    </>
  );
}

// ── Exam Card ──

function ExamCard({ exam, today, onToggleSession, onDelete }: {
  exam: ExamWithProgress;
  today: string;
  onToggleSession: (id: string) => void;
  onDelete: () => void;
}) {
  const date = new Date(exam.exam_date);
  const day = String(date.getDate()).padStart(2, "0");
  const month = MONTH_NAMES[date.getMonth()];
  const isPast = exam.daysLeft < 0;

  const borderStyle = isPast ? {} :
    exam.urgency === "red" ? { borderColor: "var(--red)", borderWidth: 1.5 } :
    exam.urgency === "amber" ? { borderColor: "var(--amber)", borderWidth: 1.5 } : {};

  return (
    <div className="es-exam-item" style={{ ...borderStyle, opacity: isPast ? 0.5 : 1 }}>
      <div className="es-exam-date-col">
        <div className="es-exam-day">{day}</div>
        <div className="es-exam-month">{month}</div>
        <div className="es-exam-vline" />
        <span style={{ fontSize: 16 }}>{isPast ? "✓" : URGENCY_ICONS[exam.urgency]}</span>
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <div className="es-exam-subject">{exam.course.name}</div>
            <div className="es-exam-meta">
              📍 {exam.room ?? "—"} · {exam.start_time ?? exam.exam_time_raw ?? "—"} · {exam.course.credits}TC
              {exam.exam_period && <span> · {exam.exam_period}</span>}
            </div>
          </div>
          {!isPast && (
            <button
              onClick={(e) => { e.stopPropagation(); onDelete(); }}
              style={{ background: "none", border: "none", cursor: "pointer", fontSize: 14, color: "var(--es-muted)", padding: "2px 6px" }}
              title="Xoá lịch thi"
            >
              ×
            </button>
          )}
        </div>

        {!isPast && (
          <>
            <div style={{ marginTop: 8 }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 4 }}>
                <span style={{ color: "var(--ink2)", fontWeight: 500 }}>
                  Tiến độ ôn {exam.daysLeft >= 0 ? `· Còn ${exam.daysLeft} ngày` : ""}
                </span>
                <span className="es-mono" style={{ fontWeight: 700, color: URGENCY_COLORS[exam.urgency] }}>
                  {exam.progress.percentage}%
                </span>
              </div>
              <div className="es-prog-wrap">
                <div
                  className={`es-prog-fill ${URGENCY_BAR[exam.urgency]}`}
                  style={{
                    width: `${exam.progress.percentage}%`,
                    background: exam.urgency === "red" ? "var(--red)" : undefined,
                  }}
                />
              </div>
            </div>

            {exam.sessions.length > 0 && (
              <div className="es-study-days">
                {exam.sessions.map((s) => {
                  const cls = s.is_completed ? "done" : s.session_date === today ? "today" : "scheduled";
                  const isClickable = s.session_date === today || s.is_completed;
                  return (
                    <span
                      key={s.id}
                      className={`es-day-chip ${cls}`}
                      style={isClickable ? { cursor: "pointer" } : undefined}
                      onClick={isClickable ? () => onToggleSession(s.id) : undefined}
                    >
                      {formatDateShort(s.session_date)}
                    </span>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

// ── Calendar Heatmap ──

function CalendarHeatmap({ exams, sessions }: {
  exams: ExamWithProgress[];
  sessions: { session_date: string; is_completed: boolean; exam_id: string }[];
}) {
  const today = new Date();
  const currentMonth = today.getMonth();
  const currentYear = today.getFullYear();

  const months = useMemo(() => {
    const m1 = { month: currentMonth, year: currentYear };
    const m2 = currentMonth === 11
      ? { month: 0, year: currentYear + 1 }
      : { month: currentMonth + 1, year: currentYear };
    return [m1, m2];
  }, [currentMonth, currentYear]);

  const examDates = useMemo(() => new Set(exams.map((e) => e.exam_date)), [exams]);

  const sessionsByDate = useMemo(() => {
    const map = new Map<string, { total: number; completed: number }>();
    for (const s of sessions) {
      const entry = map.get(s.session_date) ?? { total: 0, completed: 0 };
      entry.total++;
      if (s.is_completed) entry.completed++;
      map.set(s.session_date, entry);
    }
    return map;
  }, [sessions]);

  return (
    <div className="es-card">
      <div className="es-section-hdr"><div className="es-section-title">Lịch ôn tập</div></div>
      <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
        {months.map(({ month, year }) => (
          <MonthGrid
            key={`${year}-${month}`}
            month={month}
            year={year}
            today={today}
            examDates={examDates}
            sessionsByDate={sessionsByDate}
          />
        ))}
      </div>
      <div style={{ display: "flex", gap: 12, marginTop: 10, fontSize: 11, color: "var(--es-muted)" }}>
        <span><span style={{ display: "inline-block", width: 10, height: 10, borderRadius: 2, background: "var(--blue-lt)", marginRight: 4, verticalAlign: "middle" }} />Có lịch ôn</span>
        <span><span style={{ display: "inline-block", width: 10, height: 10, borderRadius: 2, background: "var(--green)", marginRight: 4, verticalAlign: "middle" }} />Đã ôn xong</span>
        <span><span style={{ display: "inline-block", width: 10, height: 10, borderRadius: 2, background: "var(--red)", marginRight: 4, verticalAlign: "middle" }} />Ngày thi</span>
      </div>
    </div>
  );
}

function MonthGrid({ month, year, today, examDates, sessionsByDate }: {
  month: number;
  year: number;
  today: Date;
  examDates: Set<string>;
  sessionsByDate: Map<string, { total: number; completed: number }>;
}) {
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDow = new Date(year, month, 1).getDay(); // 0=Sun
  const todayStr = today.toISOString().split("T")[0];
  const dayLabels = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];

  const cells: (number | null)[] = [];
  for (let i = 0; i < firstDow; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  return (
    <div style={{ flex: 1, minWidth: 180 }}>
      <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 6, color: "var(--ink)" }}>
        {MONTH_NAMES[month]} {year}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 2 }}>
        {dayLabels.map((l) => (
          <div key={l} style={{ fontSize: 9, textAlign: "center", color: "var(--es-muted)", fontWeight: 600, padding: "2px 0" }}>{l}</div>
        ))}
        {cells.map((day, i) => {
          if (day === null) return <div key={`empty-${i}`} />;
          const iso = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
          const isToday = iso === todayStr;
          const isExam = examDates.has(iso);
          const entry = sessionsByDate.get(iso);
          const allDone = entry && entry.completed === entry.total && entry.total > 0;

          let bg = "transparent";
          if (isExam) bg = "var(--red-lt)";
          else if (allDone) bg = "var(--green-lt)";
          else if (entry && entry.total > 0) bg = "var(--blue-lt)";

          return (
            <div
              key={iso}
              style={{
                fontSize: 11,
                textAlign: "center",
                padding: "3px 0",
                borderRadius: 4,
                background: bg,
                border: isToday ? "1.5px solid var(--blue)" : isExam ? "1.5px solid var(--red)" : "1px solid transparent",
                fontWeight: isToday || isExam ? 700 : 400,
                color: isExam ? "var(--red)" : isToday ? "var(--blue)" : "var(--ink2)",
              }}
              title={isExam ? "Ngày thi" : entry ? `${entry.completed}/${entry.total} buổi ôn` : undefined}
            >
              {day}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Utility ──

function formatDateShort(iso: string): string {
  const [, m, d] = iso.split("-");
  return `${parseInt(d)}/${parseInt(m)}`;
}
