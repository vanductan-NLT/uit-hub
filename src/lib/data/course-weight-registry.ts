import rawCourses from "./uit-course-weights.json";
import type { CourseComponent } from "@/types/database";

interface WeightedCourse {
  courseCode: string;
  defaultWeights: {
    progressWeight: number;
    practiceWeight: number;
    midtermWeight: number;
    finalTermWeight: number;
  };
}

const WEIGHT_MAP: [keyof WeightedCourse["defaultWeights"], string][] = [
  ["progressWeight", "Quá trình"],
  ["practiceWeight", "Thực hành"],
  ["midtermWeight", "Giữa kỳ"],
  ["finalTermWeight", "Cuối kỳ"],
];

const courseMap = new Map<string, WeightedCourse>(
  (rawCourses as WeightedCourse[]).map((c) => [c.courseCode, c])
);

export function buildComponents(weights: WeightedCourse["defaultWeights"]): CourseComponent[] {
  const components = WEIGHT_MAP
    .filter(([key]) => weights[key] > 0)
    .map(([key, name]) => ({ name, weight: weights[key] }));
  return components.length > 0 ? components : [{ name: "Cuối kỳ", weight: 1.0 }];
}

export function getCourseComponents(courseCode: string): CourseComponent[] | null {
  const course = courseMap.get(courseCode);
  return course ? buildComponents(course.defaultWeights) : null;
}
