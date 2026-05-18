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
  created_at: string;
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
  created_at: string;
  updated_at: string;
}

// Shape returned by getUserCourses (join)
export interface UserCourseWithCourse extends UserCourse {
  course: Course;
}
