# UIT Hub — Tài liệu tổng quan theo module

> Mục đích: Tài liệu chuẩn bị vấn đáp SE104.
> Mỗi module trình bày 4 góc: **Frontend · Backend · Nghiệp vụ · Report (Use Case / DFD)**

---

## Mục lục

1. [Auth & Profile](#1-auth--profile)
2. [Course Tracker — Lộ trình môn học](#2-course-tracker--lộ-trình-môn-học)
3. [GPA Forecast — Dự báo GPA](#3-gpa-forecast--dự-báo-gpa)
4. [Exam Plan — Kế hoạch ôn thi](#4-exam-plan--kế-hoạch-ôn-thi)
5. [Study Resources — Tài nguyên học tập](#5-study-resources--tài-nguyên-học-tập)
6. [Admin — Quản trị hệ thống](#6-admin--quản-trị-hệ-thống)

---

## 1. Auth & Profile

### 1.1 Frontend

**File chính:** `src/app/login/login-form.tsx`, `src/app/onboarding/onboarding-wizard.tsx`

- **Login page** (`/login`): form Google OAuth duy nhất — click → `supabase.auth.signInWithOAuth({ provider: "google" })` → redirect sang `/auth/callback`.
- **Onboarding wizard** (`/onboarding`): 3 bước sau khi đăng nhập lần đầu:
  1. Nhập MSSV, họ tên, ngành, khoá nhập học.
  2. Chọn chương trình đào tạo (curriculum).
  3. Import bảng điểm hoặc thêm môn thủ công.
- **Profile page** (`/profile`): hiển thị `student_id`, `major`, `intake_year`, `total_credits_required`, `training_type`. Cho phép chỉnh sửa inline.
- **State:** không có Redux/Zustand — dùng React Context `AuthContext` + SWR hooks.
- **UI states:** loading skeleton (spinner), empty state (`<EmptyState>`), error state (`<ErrorState>`).

### 1.2 Backend

**File chính:** `src/app/auth/callback/route.ts`, `src/lib/supabase/courses-api.ts` (`upsertUserProfile`)

| Bước | Kỹ thuật |
|------|----------|
| Google OAuth callback | Route Handler `/auth/callback` → `supabase.auth.exchangeCodeForSession(code)` → redirect `/` |
| Tạo/cập nhật profile | `upsertUserProfile()` — `upsert` với `onConflict: "id"` vào bảng `user_profiles` |
| Lấy session phía server | `createClient()` (server) — đọc cookie `sb-*` |
| Middleware bảo vệ route | `middleware.ts` — check session, redirect `/login` nếu chưa đăng nhập |
| RLS | Mỗi user chỉ đọc/ghi được row có `id = auth.uid()` trong `user_profiles` |

### 1.3 Nghiệp vụ

- **QD1:** Mỗi tài khoản gắn 1 `user_id` UUID từ Supabase Auth.
- **QD3:** Phân quyền: `owner > admin > student` — `role` lưu trong `user_profiles`.
- Sau onboarding, `curriculum_id` được gán → dùng để tra cứu CTĐT chuẩn của ngành/khoá.
- `training_type`: `chinh-quy` hoặc `tu-xa` — ảnh hưởng tổng tín chỉ yêu cầu.

### 1.4 Report

- **UC-01:** Đăng ký (Google OAuth — không đăng ký thủ công).
- **UC-02:** Đăng nhập.
- **UC-03:** Đăng xuất — `supabase.auth.signOut()`.
- **UC-04:** Cập nhật hồ sơ học tập (MSSV, ngành, khoá...).
- **Actor:** Sinh viên (chính), Quản trị viên (đọc danh sách user).

---

## 2. Course Tracker — Lộ trình môn học

### 2.1 Frontend

**Files:** `src/app/(app)/roadmap/page.tsx`, `src/components/features/course-tracker/`

| Component | Vai trò |
|-----------|---------|
| `course-list.tsx` | Danh sách môn đã học, nhóm theo học kỳ. Inline edit điểm + học kỳ. Grade pill màu: `grade-a` (≥8.0), `grade-b` (≥6.0), `grade-c` (<6.0). Status badge: **Đạt** (score ≥ 4.0), **Đang học**, **Rớt** (score < 4.0) |
| `gpa-summary.tsx` | Thẻ GPA tích lũy: GPA10 (trung bình gia quyền), GPA4, số tín chỉ tích lũy. Màu GPA10: xanh lá (≥8), xanh dương (≥6), vàng (≥5), đỏ (<5) |
| `course-add-modal.tsx` | Modal thêm môn: tìm kiếm từ danh mục, chọn trạng thái, nhập điểm |
| `roadmap-timeline.tsx` | Timeline 4 năm chia theo học kỳ: completed / in_progress / locked |
| `prerequisites-graph.tsx` | Đồ thị tiên quyết — hiển thị cảnh báo nếu chưa đủ tiên quyết |

**Trạng thái UI:**
- **Loading:** skeleton cards.
- **Empty:** `<EmptyState>` + nút "Thêm môn đầu tiên".
- **In-progress:** border xanh dương + shadow nhạt.
- **Risky (score thấp):** border đỏ hoặc border vàng.

### 2.2 Backend

**Files:** `src/lib/supabase/courses-api.ts`, `src/lib/course-utils.ts`, `src/lib/parsers/`

| Hàm / API | Mô tả |
|-----------|-------|
| `getUserCourses(userId)` | `SELECT *, course:courses(*) FROM user_courses WHERE user_id = $1` |
| `getAllCourses()` | Paginate 1000 rows/lần — tránh limit Supabase. Filter `is_active = true` |
| `upsertUserCourse(input)` | `upsert` với `onConflict: "user_id,course_id"` — không tạo duplicate |
| `updateUserCourse(id, patch)` | `UPDATE user_courses SET ... WHERE id = $1` — dùng khi chỉ update điểm |
| `deleteUserCourse(id)` | `DELETE FROM user_courses WHERE id = $1` |
| `uit-transcript-parser.ts` | Parse file bảng điểm UIT (PDF/HTML) → mảng `{course_id, score, semester}` |
| `uit-dkhp-parser.ts` | Parse file ĐKHP → lấy môn đang đăng ký học kỳ hiện tại |

**Database tables:**
- `courses`: id, name, credits, course_type, prerequisites[], components (JSONB), suggested_semester, course_group.
- `user_courses`: id, user_id, course_id, score, semester, status, component_scores (JSONB).

**RLS:** `user_id = auth.uid()` — user chỉ xem/sửa courses của mình.

### 2.3 Nghiệp vụ

**Tính GPA:**
```
GPA10 = Σ(score_i × credits_i) / Σ(credits_i)   // chỉ môn đã hoàn thành, score ≥ 4.0
GPA4  = GPA10 / 2.5                              // xấp xỉ tuyến tính
```

**Ngưỡng điểm chữ (UIT 2025, bảng ký 14/04/2025):**
| Điểm 10 | Điểm chữ | GPA4 |
|---------|----------|------|
| ≥ 9.0 | A+ | 4.0 |
| ≥ 8.0 | A | 3.5 |
| ≥ 7.0 | B+ | 3.0 |
| ≥ 6.0 | B | 2.5 |
| ≥ 5.0 | C | 2.0 |
| ≥ 4.0 | D+ (Đạt) | 1.5 |
| ≥ 3.0 | D (Không đạt) | 1.0 |
| < 3.0 | F | 0.0 |

**Quy tắc:**
- Môn **Đạt** (status = `exempted` hoặc score ≥ 4.0) mới tính vào tín chỉ tích lũy.
- Ngưỡng pass = **4.0** (D+ vẫn là Đạt — `course-list.tsx` dùng `>= 4.0`).
- Môn `in_progress` không tính GPA hiện tại — chỉ dùng trong dự báo.
- Tiên quyết: `prerequisites[]` — hệ thống check khi user muốn thêm môn; cảnh báo nếu chưa đủ.

**BM2 (báo cáo từ báo cáo):** Form dữ liệu gồm: mã môn, tên môn, số tín chỉ, kỳ học, điểm số, trạng thái hoàn thành.

### 2.4 Report

**Use Cases:**
- UC-05: Xem danh sách môn học.
- UC-06: Xem quan hệ tiên quyết.
- UC-07: Gợi ý lộ trình học theo học kỳ.
- UC-08: Đánh dấu môn đã hoàn thành.

**DFD:**
- **Hình 5.2 (DFD nhập môn đã học và điểm):** Sinh viên → D1 (danh sách môn, điểm, học kỳ) → Process "nhập môn đã học và điểm" → D3 (danh mục môn học) + D4 (hồ sơ cập nhật) → D5 (thông tin sau khi lưu) + D6 (thông báo).
- **Hình 5.3 (DFD gợi ý môn học kỳ tới):** Đọc hồ sơ môn đã học + danh mục CTĐT + điều kiện tiên quyết → lọc môn chưa học + đủ tiên quyết → sắp xếp theo học kỳ khuyến nghị → trả kết quả.
- **Hình 5.4 (DFD cảnh báo môn tiên quyết):** Sinh viên chọn môn → so sánh `prerequisites` với môn đã hoàn thành → cảnh báo nếu thiếu.
- **Hình 5.5 (DFD timeline lộ trình 4 năm):** Đọc CTĐT + hồ sơ học tập → phân loại (đã học / đang học / chưa học) → nhóm theo học kỳ → hiển thị timeline.

**UC-07 — Đặc tả (trích):**
- Tiền điều kiện: đã đăng nhập, hồ sơ học tập có dữ liệu môn, dữ liệu CTĐT có trong hệ thống.
- Dòng sự kiện chính: 7 bước — từ "chọn Course Roadmap" → truy xuất hồ sơ → hiển thị danh sách → kiểm tra môn hoàn thành + tiên quyết → gợi ý môn kỳ tiếp theo → sinh viên xem → lưu lộ trình nếu cần.

---

## 3. GPA Forecast — Dự báo GPA

### 3.1 Frontend

**Files:** `src/app/(app)/gpa/page.tsx`, `src/components/features/gpa-forecast/`

| Component | Vai trò |
|-----------|---------|
| `course-score-editor.tsx` | Card nhập điểm thành phần (QT/GK/TH/CK). Tính điểm hiện tại, CK cần để đạt B, CK cần để đạt A. Badge: Nguy hiểm / Cần chú ý / Ổn định. Auto-save khi blur |
| `gpa-target-calculator.tsx` | Slider GPA mục tiêu (2.0→4.0, step 0.05). Kết quả: "cần trung bình X.XX/10 mỗi môn" hoặc "Đã đạt" / "Không thể". Per-course CK target với water-fill |
| `gpa-forecast-summary.tsx` | 3 chỉ số dashboard: Dự báo cuối HK, Thay đổi (delta), Cần cải thiện (khoảng cách đến 3.6 XS) |
| `dashboard-academic-overview.tsx` | Bảng tổng quan GPA4, tín chỉ, milestone progress bar |

**Color system (gpa-summary):**
```
GPA10 ≥ 8.0 → var(--green)   // Giỏi/Xuất sắc
GPA10 ≥ 6.0 → var(--blue)    // Khá
GPA10 ≥ 5.0 → var(--amber)   // Trung bình
GPA10 > 0   → var(--red)     // Yếu
```

### 3.2 Backend

**File:** `src/lib/gpa-forecast-utils.ts`

| Hàm | Logic |
|-----|-------|
| `calculatePartialScore(course, scores)` | Σ(val × weight) chỉ với component đã nhập — trả null nếu chưa có gì |
| `calculateRequiredCK(course, scores, target)` | `(target - partialWithoutCK) / w_ck` — clamp [0, 10.01] |
| `forecastCourseScore(course)` | Dùng CK dự báo = max(requiredCKforB, 10) → tính điểm môn dự kiến |
| `forecastCumulativeGPA4(completed, inProgress)` | Merge completed + predicted in-progress → `calculateGPA4(...)` |
| `getRiskScore(course)` | `(10 - partial) × credits` — cao = rủi ro cao |
| `calculateRequiredAvgScore(target4, ...)` | `neededFromIP / ipCredits` — trả requiredAvg, isAlreadyMet, isImpossible |
| `distributeRequiredScores(target4, ...)` | **Water-fill binary search** — tìm level L để phân bổ điểm CK công bằng |

**Data flow (server actions):**
- Score changes → `updateUserCourse({ component_scores: {...} })` → Supabase → revalidate cache.
- Không có API endpoint riêng — dùng Supabase client trực tiếp từ component (client-side).

**DB:** `user_courses.component_scores` là JSONB `{ "Quá trình": 7.5, "Giữa kỳ": 8.0, "Cuối kỳ": null }`.

### 3.3 Nghiệp vụ

**Dự báo cuối HK (`forecastCumulativeGPA4`):**
- Với mỗi môn `in_progress`, tính điểm dự báo:
  - Nếu **chưa nhập gì** → dự báo = điểm nếu đạt B (7.0) ở tất cả component.
  - Nếu **đã nhập QT/GK/TH** (không có CK) → tính CK cần để đạt B → dùng làm CK dự báo.
  - Nếu **đã nhập CK** → dùng điểm thực tế.
- Ghép môn in_progress (đã dự báo) với completed → tính GPA tích lũy.

**Tại sao chọn mốc B (7.0)?** — Đây là kỳ vọng hợp lý (loại Khá), không quá lạc quan (A) cũng không quá bi quan (C).

**Thay đổi (delta):** `forecastGPA4 - currentGPA4`.

**Cần cải thiện:** `3.6 - currentGPA4` (mốc Xuất sắc). Âm hoặc 0 → đã đạt.

**Water-fill (distributeRequiredScores):**
- Bài toán: phân điểm CK cho N môn sao cho tổng tín chỉ × điểm đủ để đạt targetGPA.
- Cách làm: binary search level L ∈ [0, 10]; mỗi môn nhận `clamp(L, min_i, max_i)`. Môn có tiến độ yếu bị cap ở `max_i`, phần thiếu chuyển sang môn khác có headroom → công bằng hơn cách "mỗi môn cần X như nhau".
- Analogie: "đổ nước vào cốc — cốc đầy thì nước tràn sang cốc bên cạnh".

**Thang điểm chữ (`GRADE_THRESHOLDS`):** dùng để gắn nhãn (A+/A/B+/B/C/D+/D) cho kết quả dự báo.

### 3.4 Report

**Use Cases:**
- UC-09: Nhập điểm môn học.
- UC-10: Tính GPA hiện tại.
- UC-11: Dự đoán GPA sau học kỳ.
- UC-12: Mô phỏng điểm cần đạt để đạt GPA mục tiêu.

**UC-11 — Đặc tả (trích):**
- Tiền điều kiện: đã đăng nhập, có dữ liệu điểm (thực tế hoặc nhập tay).
- Dòng chính: 5 bước — mở GPA Prediction → nhập môn/điểm → kiểm tra hợp lệ → tính GPA hiện tại & dự đoán → hiển thị kết quả (bảng + biểu đồ).
- Hậu điều kiện: sinh viên xem được GPA dự đoán, có thể lưu kết quả.

---

## 4. Exam Plan — Kế hoạch ôn thi

### 4.1 Frontend

**Files:** `src/app/(app)/exam-plan/page.tsx`, `src/components/features/exam-plan/`

| Component | Vai trò |
|-----------|---------|
| `exam-list.tsx` | Danh sách lịch thi: môn, ngày thi, giờ, phòng. Parse từ file TKBT hoặc nhập thủ công. Badge kỳ (GK/CK). Đếm ngày còn lại |
| `study-plan-view.tsx` | Hiển thị kế hoạch ôn thi đã sinh: calendar view theo ngày, session checkbox (đã ôn / chưa ôn) |
| `session-progress.tsx` | Progress bar tổng tiến độ ôn tập (sessions completed / total) |
| `exam-import-modal.tsx` | Paste text lịch thi UIT → parser tự động extract môn, ngày, giờ, phòng |

**UI states:**
- Chưa có lịch thi → empty state, hướng dẫn import.
- Lịch thi đã thêm nhưng chưa sinh kế hoạch → nút "Tạo kế hoạch ôn thi".
- Kế hoạch đã sinh → calendar sessions, có thể tick từng buổi.
- Session hôm nay → highlight.

### 4.2 Backend

**Files:** `src/lib/supabase/exam-api.ts`, `src/lib/exam-schedule-utils.ts`, `src/lib/parsers/uit-exam-parser.ts`

| Hàm | Mô tả |
|-----|-------|
| `getExamSchedules(userId)` | `SELECT *, course FROM exam_schedules WHERE user_id = $1` |
| `upsertExamSchedule(input)` | upsert lịch thi (`onConflict: "user_id,course_id,exam_period,semester"`) |
| `getStudySessions(userId)` | Lấy tất cả study sessions của user, join với exam |
| `upsertStudySessions(sessions[])` | Batch insert/upsert kế hoạch ôn thi |
| `toggleStudySession(id, isDone)` | `UPDATE study_sessions SET is_completed = $1` |
| `generateStudySessions(exams, userCourses)` | **Thuật toán sinh kế hoạch** (xem 4.3) — pure function, không gọi DB |
| `uit-exam-parser.ts` | Parse text lịch thi TKBT → `ExamSchedule[]` |

**DB tables:**
- `exam_schedules`: id, user_id, course_id, exam_period (GK/CK), exam_date, start_time, room.
- `study_sessions`: id, user_id, exam_id, session_date, is_completed, completed_at.

### 4.3 Nghiệp vụ

**Thuật toán sinh kế hoạch ôn thi (`generateStudySessions`):**

1. **Tính weight** cho mỗi môn thi: `weight = getRiskScore(userCourse)` = `(10 - partial) × credits`. Môn chưa nhập điểm → riskScore tối đa (`10 × credits`).
2. **Đếm totalSlots**: số ngày từ hôm nay đến ngày thi cuối cùng (bỏ qua ngày thi) × `MAX_SESSIONS_PER_DAY` (=3).
3. **Phân bổ số buổi** cho mỗi môn: `count_i = round(weight_i / totalWeight × totalSlots)`, tối thiểu 1.
4. **Lấp ngày**: với mỗi môn, đi ngược từ ngày trước kỳ thi, tìm ngày còn slot (< 3 buổi/ngày và không phải ngày thi). Ưu tiên môn thi sớm hơn.
5. **Ghi DB**: batch upsert `study_sessions`.

**Ưu tiên môn rủi ro cao:** môn ít điểm / nhiều tín chỉ nhận nhiều buổi ôn hơn.

**Ví dụ:** Môn A (8 tín, partial=3.0) → riskScore=56; Môn B (3 tín, partial=8.0) → riskScore=6. Tỷ lệ buổi ≈ 9:1 cho A:B.

**BM5 (báo cáo):** Form dữ liệu kế hoạch ôn thi gồm: tên môn, ngày ôn, số buổi, mức độ ưu tiên, trạng thái hoàn thành.

### 4.4 Report

**Use Cases:**
- UC-13: Nhập lịch thi.
- UC-14: Nhập mức độ khó từng môn.
- UC-15: Sinh kế hoạch ôn thi.
- UC-16: Theo dõi tiến độ ôn tập.

**UC-15 — Đặc tả (trích):**
- Tiền điều kiện: đăng nhập, có lịch thi, có thời gian rảnh.
- Dòng chính (10 bước):
  1. Mở Exam Review Planning.
  2. Chọn học kỳ / danh sách môn cần lập kế hoạch.
  3. Hệ thống truy xuất ngày thi, thời gian rảnh, dữ liệu học tập.
  4. Kiểm tra tính hợp lệ đầu vào.
  5. Tính mức độ ưu tiên ôn tập (ngày thi × mức độ khó × rủi ro).
  6. Lập lịch ngược từ ngày thi.
  7. Môn rủi ro cao → nhiều buổi/thời lượng hơn.
  8. Tự động tạo study sessions.
  9. Hiển thị kế hoạch (môn, thời gian, số buổi, thứ tự ưu tiên).
  10. Sinh viên xem, điều chỉnh, lưu.

---

## 5. Study Resources — Tài nguyên học tập

### 5.1 Frontend

**Files:** `src/app/(app)/study-resource/page.tsx`, `src/components/features/study-resource/`

| Component | Vai trò |
|-----------|---------|
| `resource-list.tsx` | Danh sách tài nguyên theo môn học. Filter theo loại (video/slide/exercise/exam). Badge loại tài nguyên |
| `resource-card.tsx` | Card: tiêu đề, mô tả, URL/file, loại, nguồn, trạng thái. Nút yêu thích ♥ |
| `resource-submit-form.tsx` | Form đề xuất tài nguyên mới: chọn môn, loại, dán URL, mô tả. Submit → status `pending` |
| `resource-search.tsx` | Tìm kiếm tài nguyên theo tên môn hoặc tiêu đề tài nguyên |

**UI states:**
- Loading: skeleton cards.
- Empty: `<EmptyState>` gợi ý import hoặc đề xuất tài nguyên.
- Pending (đề xuất chờ duyệt): badge vàng "Đang chờ duyệt".
- Rejected: badge đỏ "Bị từ chối" + admin_note.

### 5.2 Backend

**Files:** `src/lib/supabase/resources-api.ts`, `src/lib/parse-source-from-url.ts`, `src/app/api/url-metadata/route.ts`

| Hàm | Mô tả |
|-----|-------|
| `getResourcesByCourse(courseId)` | Lấy tài nguyên `published` theo `course_id` |
| `submitResource(input)` | Insert với `status: "pending"`, `submitted_by: user_id` |
| `toggleFavorite(userId, resourceId)` | Upsert/delete vào `user_resource_favorites` |
| `moderateResource(id, status, note)` | Admin: `UPDATE study_resources SET status=$1, admin_note=$2` — dùng `createAdminClient()` (service_role key) |
| `url-metadata/route.ts` | API Route: fetch URL → extract title, favicon (OGP) |
| `parse-source-from-url.ts` | Detect nguồn từ URL: YouTube, Google Drive, GitHub, Notion... |

**DB tables:**
- `study_resources`: id, course_id, title, url, file_path, resource_type (video/slide/exercise/exam), status (pending/published/rejected), submitted_by, admin_note.
- `user_resource_favorites`: user_id, resource_id (many-to-many).

**Moderation flow:**
```
submit → status="pending" → Admin xét duyệt → "published" (hiển thị) hoặc "rejected" (kèm ghi chú)
```

**Service role key:** dùng `createAdminClient()` (bypass RLS) chỉ trong Server Action của admin — **không bao giờ expose ra client**.

### 5.3 Nghiệp vụ

- **QD6 (báo cáo):** Tài nguyên chỉ hiển thị khi `status = "published"`.
- **QD7 (báo cáo):** Admin có thể từ chối kèm ghi chú lý do.
- Người dùng có thể lưu yêu thích (`user_resource_favorites`).
- Mỗi tài nguyên thuộc về 1 môn học cụ thể (`course_id`).
- Loại tài nguyên: `video` (YouTube), `slide` (PDF/Drive), `exercise` (bài tập), `exam` (đề thi cũ).

### 5.4 Report

**Use Cases:**
- UC-17: Xem tài nguyên theo môn học.
- UC-18: Tìm kiếm tài nguyên.
- UC-19: Lưu tài nguyên yêu thích.
- UC-20: Đề xuất tài nguyên học tập.
- UC-23: Admin quản lý tài nguyên (duyệt/từ chối).

**Use Case Diagram (Hình 5.1 — Module 4):**
- Sinh viên: Danh sách tài nguyên → filter theo loại → gợi ý tài nguyên → lưu yêu thích → đề xuất tài nguyên.
- Quản trị viên: Admin duyệt tài nguyên.

---

## 6. Admin — Quản trị hệ thống

### 6.1 Frontend

**Files:** `src/app/admin/page.tsx`, `src/app/admin/admin-shell.tsx`, `src/components/features/admin/`

| Component | Vai trò |
|-----------|---------|
| `student-list.tsx` | Bảng sinh viên: MSSV, tên, ngành, khóa, môn hoàn thành, tín chỉ, GPA, quyền. Tìm kiếm live. Dropdown đổi role (owner > admin > student theo hierarchy) |
| `resource-moderation.tsx` | Queue tài nguyên `pending`: xem preview URL, duyệt/từ chối + ghi chú |
| `course-manager.tsx` | Thêm/sửa/xoá môn học trong danh mục. Nhập prerequisites, course components, weights |
| `stats-overview.tsx` | Thống kê: tổng user, tài nguyên đã duyệt, môn học, phân bổ role |

**Phân quyền UI:**
- Dropdown role chỉ hiển thị với user có quyền đủ (`canAssignRole(currentRole, targetRole)`).
- Admin không thể đổi quyền Owner.

### 6.2 Backend

**Files:** `src/lib/supabase/admin-api.ts`, `src/lib/supabase/role-admin-actions.ts`, `src/lib/role-utils.ts`, `src/lib/supabase/course-admin-actions.ts`

| Hàm | Mô tả |
|-----|-------|
| `getStudentsWithProgress()` | `SELECT user_profiles.*, COUNT(user_courses) ...` — admin view, service_role |
| `assignRole(userId, newRole)` | Server Action — kiểm tra `canAssignRole`, gọi Supabase `UPDATE user_profiles SET role` |
| `canAssignRole(assigner, target, newRole)` | Logic: owner có thể đổi tất cả; admin chỉ đổi student↔admin; không ai đổi owner |
| `moderateResource(id, status, note)` | Dùng `createAdminClient()` — bypass RLS |
| `upsertCourse(data)` | Insert/update bảng `courses` — chỉ admin/owner |

**Bảo mật:**
- Tất cả admin actions là **Server Actions** (`"use server"`) — không chạy phía client.
- `createAdminClient()` dùng `SUPABASE_SERVICE_ROLE_KEY` — chỉ có trong môi trường server.
- RLS policy: `user_profiles.role = 'admin' OR role = 'owner'` mới được read tất cả users.

### 6.3 Nghiệp vụ

**Hierarchy quyền:** `owner > admin > student`
- **owner**: đổi quyền bất kỳ, bao gồm promote admin → owner.
- **admin**: quản lý student + tài nguyên + môn học; không đổi được owner.
- **student**: chỉ xem/sửa dữ liệu cá nhân.

**Quy trình duyệt tài nguyên:**
1. SV submit → `pending`.
2. Admin vào trang moderation → xem danh sách pending.
3. Click Duyệt → `published`; Click Từ chối + nhập lý do → `rejected`.

**QD5 (báo cáo):** Admin có quyền thêm/sửa/xoá dữ liệu hệ thống.

### 6.4 Report

**Use Cases:**
- UC-21: Quản lý người dùng (xem danh sách, đổi quyền).
- UC-22: Quản lý môn học (CRUD courses).
- UC-23: Quản lý tài nguyên (duyệt/từ chối).
- UC-24: Xem thống kê hệ thống.

**Actor:** Quản trị viên (chính), Owner (superuser).

---

## Tóm tắt kiến trúc hệ thống

```
Browser (Next.js Client Components)
    ↓ fetch / Supabase JS SDK
Next.js App Router (Server Components + Server Actions)
    ↓ supabase-js (service_role cho admin)
Supabase (PostgreSQL + Auth + Storage + RLS)
    ↓
Vercel (deploy frontend + serverless functions)
```

**Luồng data chính:**
1. **Read:** Client Component → Supabase JS → PostgreSQL (với RLS).
2. **Write (user):** Client Component → Supabase JS → PostgreSQL (upsert/update/delete).
3. **Write (admin):** Client Component → Server Action (`"use server"`) → `createAdminClient()` → PostgreSQL (bypass RLS).
4. **Auth:** Google OAuth → Supabase Auth → session cookie → middleware check.

**Bảng DB chính:**

| Bảng | Mô tả |
|------|-------|
| `users` | Supabase Auth built-in |
| `user_profiles` | Hồ sơ sinh viên, role |
| `courses` | Danh mục môn học |
| `user_courses` | Môn học của từng sinh viên, điểm, component_scores |
| `curricula` | Chương trình đào tạo |
| `curriculum_courses` | Mapping môn → CTĐT |
| `exam_schedules` | Lịch thi |
| `study_sessions` | Kế hoạch ôn thi |
| `study_resources` | Tài nguyên học tập |
| `user_resource_favorites` | Tài nguyên yêu thích |
| `user_milestones` | Milestone tốt nghiệp |

---

## Câu hỏi vấn đáp thường gặp theo module

### Course Tracker
- **Tại sao dùng upsert thay vì insert?** → Tránh duplicate khi user thêm lại môn đã có; `onConflict: "user_id,course_id"` đảm bảo 1 record/user/môn.
- **Tại sao paginate khi lấy courses?** → Supabase giới hạn 1000 rows/query; catalog > 1000 môn nên phải loop.
- **Ngưỡng pass tại sao là 4.0?** → Theo bảng điểm UIT 2025: D+ (4.0–4.9) vẫn là "Đạt".

### GPA Forecast
- **Water-fill là gì?** → Thuật toán binary search tìm level L để phân điểm CK công bằng; môn có tiến độ yếu bị cap, phần thiếu chuyển sang môn khác.
- **GPA4 = GPA10 / 2.5 có chính xác không?** → Là xấp xỉ tuyến tính. Bảng thực tế là step function (A=3.5, B+=3.0...). Hệ thống dùng xấp xỉ để tính toán liên tục.
- **Tại sao forecast dùng B (7.0) làm mặc định?** → Kỳ vọng hợp lý, không quá lạc quan.

### Exam Plan
- **Thuật toán sinh kế hoạch có ưu tiên gì?** → Ưu tiên 3 yếu tố: (1) rủi ro học tập (risk score), (2) ngày thi gần → đi ngược từ ngày trước thi, (3) không trùng ngày thi.
- **MAX_SESSIONS_PER_DAY = 3 lấy từ đâu?** → Design decision — tránh overload; 3 buổi/ngày ≈ sáng/chiều/tối.

### Study Resources
- **Tại sao cần moderation flow?** → Tránh nội dung spam/không phù hợp; admin kiểm duyệt trước khi publish.
- **Service role key dùng ở đâu?** → Chỉ trong Server Actions — không bao giờ expose ra browser.

### Admin
- **canAssignRole hoạt động ra sao?** → Matrix: owner có thể gán bất kỳ role; admin chỉ gán student↔admin; không ai đổi được owner (trừ owner).
