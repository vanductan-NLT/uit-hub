import type { ExamScheduleWithCourse } from "@/types/database";

function padZero(n: number): string {
  return String(n).padStart(2, "0");
}

// isoDate: "2026-05-26", time: "07:30" or null
function toICSDate(isoDate: string, time?: string | null): string {
  const [y, m, d] = isoDate.split("-");
  if (time) {
    const [h, min] = time.split(":");
    return `${y}${m}${d}T${padZero(Number(h))}${padZero(Number(min))}00`;
  }
  return `${y}${m}${d}`;
}

function escapeICS(s: string): string {
  return s.replace(/[,;\\]/g, (c) => `\\${c}`).replace(/\n/g, "\\n");
}

// Add 90 minutes to an ICS datetime string (e.g. "20260526T073000" → "20260526T090000")
function addMinutes(icsDatetime: string, minutes: number): string {
  if (!icsDatetime.includes("T")) return icsDatetime; // date-only, no duration calc
  const year = parseInt(icsDatetime.slice(0, 4));
  const month = parseInt(icsDatetime.slice(4, 6)) - 1;
  const day = parseInt(icsDatetime.slice(6, 8));
  const hour = parseInt(icsDatetime.slice(9, 11));
  const min = parseInt(icsDatetime.slice(11, 13));
  const d = new Date(year, month, day, hour, min + minutes);
  return (
    `${d.getFullYear()}` +
    `${padZero(d.getMonth() + 1)}` +
    `${padZero(d.getDate())}` +
    `T${padZero(d.getHours())}${padZero(d.getMinutes())}00`
  );
}

export function generateICSContent(exams: ExamScheduleWithCourse[]): string {
  const lines: string[] = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//UIT Hub//SE104//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
  ];

  for (const exam of exams) {
    const dtstart = toICSDate(exam.exam_date, exam.start_time);
    const dtend = addMinutes(dtstart, 90);
    const summary = escapeICS(
      `${exam.course?.name ?? exam.course_id} - ${exam.exam_period}`
    );
    const location = escapeICS(exam.room ?? "");
    const uid = `exam-${exam.id}@uit-hub`;
    const description = escapeICS(
      `Kỳ thi: ${exam.exam_period} · Học kỳ: ${exam.semester ?? ""}`
    );

    lines.push(
      "BEGIN:VEVENT",
      `UID:${uid}`,
      `DTSTART:${dtstart}`,
      `DTEND:${dtend}`,
      `SUMMARY:${summary}`,
      ...(location ? [`LOCATION:${location}`] : []),
      `DESCRIPTION:${description}`,
      "END:VEVENT"
    );
  }

  lines.push("END:VCALENDAR");
  return lines.join("\r\n");
}

export function downloadICS(content: string, filename = "lich-thi-uit.ics"): void {
  const blob = new Blob([content], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
