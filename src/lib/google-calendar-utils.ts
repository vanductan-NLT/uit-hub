import type { ExamScheduleWithCourse } from "@/types/database";

const GCAL_BASE = "https://calendar.google.com/calendar/render?action=TEMPLATE";
const EXAM_DURATION_MIN = 90;

function padZero(n: number): string {
  return String(n).padStart(2, "0");
}

// isoDate: "2026-05-26", time: "07:30" → "20260526T073000" (local time, no Z)
// Without time → date-only "20260526" (all-day event)
function toGCalDate(isoDate: string, time?: string | null): string {
  const [y, m, d] = isoDate.split("-");
  if (time) {
    const [h, min] = time.split(":");
    return `${y}${m}${d}T${padZero(Number(h))}${padZero(Number(min))}00`;
  }
  return `${y}${m}${d}`;
}

// Add minutes to a timed GCal datetime ("20260526T073000" → "20260526T090000")
function addMinutes(gcalDatetime: string, minutes: number): string {
  const year = parseInt(gcalDatetime.slice(0, 4));
  const month = parseInt(gcalDatetime.slice(4, 6)) - 1;
  const day = parseInt(gcalDatetime.slice(6, 8));
  const hour = parseInt(gcalDatetime.slice(9, 11));
  const min = parseInt(gcalDatetime.slice(11, 13));
  const dt = new Date(year, month, day, hour, min + minutes);
  return (
    `${dt.getFullYear()}` +
    `${padZero(dt.getMonth() + 1)}` +
    `${padZero(dt.getDate())}` +
    `T${padZero(dt.getHours())}${padZero(dt.getMinutes())}00`
  );
}

// Add one day to a date-only GCal date ("20260526" → "20260527") — Google all-day
// events treat the end date as exclusive.
function nextDay(gcalDate: string): string {
  const year = parseInt(gcalDate.slice(0, 4));
  const month = parseInt(gcalDate.slice(4, 6)) - 1;
  const day = parseInt(gcalDate.slice(6, 8));
  const dt = new Date(year, month, day + 1);
  return `${dt.getFullYear()}${padZero(dt.getMonth() + 1)}${padZero(dt.getDate())}`;
}

// Build a Google Calendar "render" URL that opens a pre-filled event the user can
// save with one click. No OAuth/API required.
export function buildGoogleCalendarUrl(exam: ExamScheduleWithCourse): string {
  const start = toGCalDate(exam.exam_date, exam.start_time);
  const end = exam.start_time
    ? addMinutes(start, EXAM_DURATION_MIN)
    : nextDay(start);

  const title = `${exam.course?.name ?? exam.course_id} - ${exam.exam_period}`;
  const details = `Kỳ thi: ${exam.exam_period} · Học kỳ: ${exam.semester ?? ""}`;

  const params = new URLSearchParams({
    text: title,
    dates: `${start}/${end}`,
    details,
  });
  if (exam.room) params.set("location", exam.room);

  return `${GCAL_BASE}&${params.toString()}`;
}
