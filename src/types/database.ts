export interface CourseComponent {
  name: string;   // "Quá trình" | "Thực hành" | "Giữa kỳ" | "Cuối kỳ"
  weight: number; // 0.0 – 1.0
}

export interface Course {
  id: string;
  name: string;
  name_en: string | null;
  credits: number;
  department: string | null;
  course_type: "required" | "elective" | "general";
  prerequisites: string[];
  components: CourseComponent[];
  is_active: boolean;
  // Phase 2 augmentation columns (nullable — may not exist for older rows)
  suggested_semester: number | null;   // 1..8, from CTĐT khoá
  course_group: string | null;         // ĐC | CSN | CN | CNTC
  equivalents: string[];               // mã môn tương đương
  created_at: string;
  updated_at: string;
}

// ── Phase 2: Curriculum data model ──────────────────────────

export interface Curriculum {
  id: string;                   // e.g. "CNTT-K19"
  major: string;
  intake_year_from: number;
  total_credits_required: number;
  general_credits: number | null;
  foundation_credits: number | null;
  major_required_credits: number | null;
  major_elective_credits: number | null;
  created_at: string;
  updated_at: string;
}

export interface CurriculumCourse {
  curriculum_id: string;
  course_id: string;
  requirement_type: "general" | "foundation" | "required" | "elective";
  suggested_semester: number | null;
}

export interface GraduationRequirement {
  curriculum_id: string;
  key: string;   // english | gdqp | gdtc | total_credits | gpa_min
  label: string;
  threshold_value: number | null;
  unit: string | null; // credits | score | boolean
}

export interface UserMilestone {
  user_id: string;
  key: string;
  is_completed: boolean;
  value: number | null;
  note: string | null;
  updated_at: string;
}

export interface UserCourse {
  id: string;
  user_id: string;
  course_id: string;
  score: number | null;
  semester: string | null;       // "HK1-2023-2024"
  academic_year: string | null;  // "2023-2024"
  status: "completed" | "in_progress" | "failed" | "exempted";
  component_scores: Record<string, number | null>; // { "GK": 7.5, "BT": 8.0 }
  note: string | null;
  created_at: string;
  updated_at: string;
  // joined
  course?: Course;
}

export interface UserProfile {
  id: string;
  student_id: string | null;
  full_name: string | null;
  major: string;
  intake_year: number | null;
  target_graduation_year: number | null;
  total_credits_required: number;
  training_type: "chinh-quy" | "tu-xa";
  role: "student" | "admin" | "owner";
  created_at: string;
  updated_at: string;
}

// Shape returned by getUserCourses (join)
export interface UserCourseWithCourse extends UserCourse {
  course: Course;
}

// ── Module 3: Exam Schedule ──────────────────────────────

export interface ExamSchedule {
  id: string;
  user_id: string;
  course_id: string;
  class_code: string | null;
  exam_period: "GK" | "CK";
  semester: string;
  academic_year: string;
  exam_date: string;
  start_time: string | null;
  exam_time_raw: string | null;
  room: string | null;
  exam_type: string | null;
  note: string | null;
  created_at: string;
  updated_at: string;
  course?: Course;
}

export interface StudySession {
  id: string;
  user_id: string;
  exam_id: string;
  session_date: string;
  is_completed: boolean;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
  exam?: ExamSchedule;
}

export interface ExamScheduleWithCourse extends ExamSchedule {
  course: Course;
}

export interface StudySessionWithExam extends StudySession {
  exam: ExamScheduleWithCourse;
}

// ── Module 4: Study Resources ───────────────────────────

export type ResourceType = "video" | "slide" | "exercise" | "exam";
export type ResourceStatus = "published" | "pending" | "rejected";

export interface StudyResource {
  id: string;
  course_id: string;
  title: string;
  description: string | null;
  url: string | null;
  file_path: string | null;
  resource_type: ResourceType;
  source: string | null;
  status: ResourceStatus;
  submitted_by: string | null;
  admin_note: string | null;
  created_at: string;
  updated_at: string;
  course?: Course;
}

export interface StudyResourceWithCourse extends StudyResource {
  course: Course;
}
