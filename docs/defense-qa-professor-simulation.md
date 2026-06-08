# Câu hỏi vấn đáp & Yêu cầu modify — Góc nhìn thầy khó tính

> Phân loại: ⚠️ Bẫy thường gặp · 🔥 Câu hỏi khó · 🛠️ Yêu cầu modify · 📋 Câu hỏi cơ bản

---

## I. Câu hỏi tổng quan / nghiệp vụ

### 📋 Cơ bản (nhưng vẫn phải trả lời trôi chảy)

1. **Đề tài này giải quyết vấn đề gì? Tại sao cần làm?**
   - Gợi ý: Sinh viên UIT thiếu công cụ theo dõi GPA, lộ trình học tập, kế hoạch ôn thi tập trung tại một nơi.

2. **Hệ thống có bao nhiêu actor? Kể tên và phân biệt quyền hạn của từng actor.**
   - Sinh viên: dùng toàn bộ 5 module; Quản trị viên: quản lý user, môn học, duyệt tài nguyên; Owner: superuser.

3. **Hệ thống có bao nhiêu Use Case? Nhóm theo chức năng nào?**
   - UC-01→24, 6 nhóm: Tài khoản, Lộ trình, GPA, Ôn thi, Tài nguyên, Quản trị.

4. **Tại sao chỉ dùng Google OAuth mà không cho đăng ký email/password thông thường?**

5. **Database của bạn có bao nhiêu bảng? Kể tên các bảng chính.**

### 🔥 Câu hỏi khó

6. **GPA được tính theo công thức nào? Tại sao dùng GPA10/2.5 thay vì bảng step function chính thức của UIT?**
   - Trả lời: xấp xỉ tuyến tính để tính toán liên tục (cho dự báo, tính ngược). Bảng chính thức dùng để hiển thị nhãn chữ.

7. **Ngưỡng pass là bao nhiêu? Tại sao là 4.0 chứ không phải 5.0?**
   - Trả lời: Theo bảng điểm UIT ký 14/04/2025 — D+ (4.0–4.9) vẫn là Đạt.

8. **Nếu sinh viên học lại môn đã rớt, hệ thống xử lý như thế nào?**
   - `upsert` với `onConflict: "user_id,course_id"` → ghi đè điểm mới lên điểm cũ.

9. **Quan hệ tiên quyết được lưu trữ và kiểm tra như thế nào trong hệ thống?**
   - `courses.prerequisites[]` (mảng course_id). Khi user thêm môn, check xem các môn tiên quyết đã có status `completed` chưa.

10. **RLS là gì? Bạn dùng RLS để bảo vệ điều gì?**
    - Row Level Security — mỗi user chỉ đọc/ghi được row có `user_id = auth.uid()`. Không cần check trong code backend.

---

## II. Câu hỏi theo từng Module

### Module 1 — Auth / Profile

11. **Sau khi Google OAuth callback, hệ thống làm gì với session?**
    - `exchangeCodeForSession(code)` → Supabase tạo session, lưu cookie `sb-*` → middleware đọc cookie để protect routes.

12. **Middleware hoạt động ở đâu trong Next.js App Router? Nó làm gì?**
    - `middleware.ts` — chạy ở Edge trước khi request vào route. Check session → nếu chưa login redirect `/login`.

13. **`training_type` ảnh hưởng đến điều gì trong hệ thống?**
    - Tổng tín chỉ yêu cầu tốt nghiệp (chính quy khác tại chức).

### Module 2 — Course Tracker

14. **Tại sao phải paginate khi lấy danh sách môn học?**
    - Supabase giới hạn 1000 rows/query. Catalog > 1000 môn → phải loop theo PAGE=1000.

15. **`component_scores` là gì? Lưu dưới dạng nào trong database?**
    - JSONB: `{ "Quá trình": 7.5, "Giữa kỳ": 8.0, "Cuối kỳ": null }`. Tên key khớp với `course.components[].name`.

16. **Nếu thầy nhìn vào code `course-list.tsx` line 22: `score >= 4.0` — tại sao là 4.0?**

17. **Môn "miễn" (exempted) có tính vào GPA không?**
    - Tính vào tín chỉ tích lũy (nếu có điểm) nhưng có thể không tính vào weighted GPA tùy nghiệp vụ.

### Module 3 — GPA Forecast

18. **Giải thích thuật toán water-fill trong `distributeRequiredScores`. Tại sao cần nó?**
    - Binary search level L sao cho Σ clamp(L, min_i, max_i)×credits_i = needed. Tránh trường hợp 1 môn yêu cầu >10 trong khi môn khác chỉ cần 6.

19. **"Dự báo cuối HK" tính trên cơ sở nào? Nếu sinh viên chưa nhập điểm gì thì sao?**
    - Assume đạt B (7.0) cho CK. Logic trong `forecastCourseScore()`.

20. **Ba con số trên dashboard GPA forecast là gì? Tính như thế nào?**
    - Dự báo = GPA nếu tất cả in-progress đạt B; Thay đổi = forecast - current; Cần cải thiện = 3.6 - current.

21. **⚠️ Bẫy:** `GPA4 = GPA10 / 2.5` — Tính ra GPA4 của sinh viên điểm 8.0 là bao nhiêu?
    - 8.0/2.5 = 3.2. Nhưng bảng UIT chính thức: A (8.0) = 3.5. Bạn giải thích sự khác biệt này như thế nào?

22. **`getRiskScore` tính như thế nào? Môn nào có risk cao nhất?**
    - `(10 - partial) × credits`. Môn chưa nhập điểm + nhiều tín chỉ → risk tối đa.

### Module 4 — Exam Plan

23. **Thuật toán sinh kế hoạch ôn thi ưu tiên môn nào trước?**
    - Môn thi sớm hơn + risk score cao hơn → nhiều buổi ôn hơn. Lấp ngày từ sát ngày thi đi ngược lại.

24. **MAX_SESSIONS_PER_DAY = 3 có nghĩa là gì? Con số này từ đâu ra?**
    - Design decision — 3 buổi/ngày (sáng/chiều/tối). Tránh overload sinh viên.

25. **Nếu ngày thi trùng nhau (2 môn cùng 1 ngày), hệ thống xử lý ra sao?**

26. **`exam_period: "GK" | "CK"` — Tại sao cần phân biệt GK và CK?**

### Module 5 — Study Resources

27. **Quy trình moderation hoạt động như thế nào?**
    - Submit → `pending` → Admin duyệt → `published`/`rejected` kèm ghi chú.

28. **Tại sao cần `createAdminClient()` thay vì `createClient()` thông thường?**
    - Service role key — bypass RLS để admin đọc tất cả rows không bị giới hạn bởi `user_id = auth.uid()`.

29. **`service_role` key có được lộ ra client không? Bạn bảo vệ nó như thế nào?**
    - Không. Chỉ dùng trong Server Actions (`"use server"`) — không bao giờ bundle vào client JS.

### Module 6 — Admin

30. **`canAssignRole` logic như thế nào? Admin có thể thăng cấp admin khác thành owner không?**
    - Không. owner mới đổi được owner. Admin chỉ đổi student↔admin.

31. **Tại sao `getStudentsWithProgress()` dùng service_role?**
    - Cần đọc TẤT CẢ user profiles — không phải chỉ của mình. RLS bình thường sẽ chặn.

---

## III. Câu hỏi kỹ thuật / kiến trúc

32. **Next.js App Router khác gì Pages Router? Tại sao chọn App Router?**
    - Server Components mặc định, layout nesting, server actions, streaming... 

33. **Server Action là gì? Khác REST API endpoint ở điểm nào?**
    - Function với `"use server"` — Next.js compile thành POST endpoint ẩn. Không cần tạo `/api/` route riêng.

34. **Supabase có những tính năng nào bạn đang dùng?**
    - PostgreSQL (DB), Auth (OAuth), Storage (file upload), RLS (bảo mật row-level).

35. **⚠️ Bẫy:** Nếu tôi xóa `"use server"` trong một Server Action, điều gì xảy ra?
    - Hàm chạy ở client → `createAdminClient()` (dùng service key) sẽ bị expose trong bundle JS → **lỗ hổng bảo mật nghiêm trọng**.

36. **Tại sao dùng `upsert` thay vì `insert` cho `user_courses`?**
    - Idempotent — thêm lại môn đã có sẽ update thay vì lỗi duplicate.

37. **`onConflict: "user_id,course_id"` có nghĩa là gì? Cần index gì ở database?**
    - Unique constraint trên cặp (user_id, course_id). Cần `UNIQUE INDEX` tương ứng.

38. **Khi nào dùng `createClient()` (client) vs `createServer()` (server)?**
    - `createClient()`: component phía client (browser, dùng anon key). `createServer()`: server components, route handlers (đọc cookie session).

---

## IV. ⚠️ Bẫy hay gặp — Thầy hỏi để "lật"

39. **GPA 3.6 là mức nào? 3.2? 2.8? 2.0?**
    - 3.6 = Xuất sắc; 3.2 = Giỏi; 2.8 = Khá; 2.0 = Trung bình.

40. **Điểm D (3.0–3.9) có tính vào GPA tích lũy không?**
    - D (3.0–3.9) = Không đạt → không tính tín chỉ tích lũy, không tính vào GPA.

41. **Nếu sinh viên có 2 lần học môn A (lần 1 điểm 4, lần 2 điểm 7), hệ thống lưu điểm nào?**
    - Hiện tại: upsert ghi đè → lấy điểm mới nhất. (Đây là design decision — thầy có thể hỏi: "Vậy lần trước có bị ảnh hưởng không?")

42. **⚠️ Bẫy:** "Tôi thấy trong code bạn dùng `score >= 4.0` ở chỗ này nhưng chỗ khác dùng `score >= 5.0` — cái nào đúng?"
    - `course-utils.ts` đã được fix sang `>= 4.0`. `>= 5.0` là bug cũ đã sửa.

43. **Nếu tôi disable JavaScript trên trình duyệt, hệ thống có hoạt động không?**
    - Phần Server Components vẫn render HTML. Nhưng các interactive features (add course, edit score) cần JS.

44. **Vercel và Supabase đều là dịch vụ nước ngoài — nếu họ down thì sao?**

---

## V. 🛠️ Yêu cầu Modify — Thầy có thể yêu cầu

> Đây là các modify **thực tế, feasible** trong thời gian vấn đáp (hoặc yêu cầu giải thích cách làm).

### Dễ (< 5 phút thực hiện nếu biết code)

**M1.** Thêm badge hiển thị tên học kỳ trên card môn học (vd: "HK1 2024-2025").
- `course-list.tsx` — đã có `uc.semester`, chỉ cần render thêm.

**M2.** Đổi màu grade pill: điểm < 5.0 thay vì `grade-c` thì dùng màu đỏ đậm hơn.
- `getGradePillClass()` trong `course-list.tsx`.

**M3.** Thêm thông báo "Chúc mừng!" khi GPA vượt qua mốc 3.6 (Xuất sắc).
- `gpa-summary.tsx` — check `gpa4 >= 3.6`.

**M4.** Ẩn nút "Lưu yêu thích" nếu tài nguyên đã được lưu (toggle state).
- `resource-card.tsx`.

**M5.** Thêm trường "Ghi chú" cho kế hoạch ôn thi của từng môn.
- `study_sessions` table có `note` field chưa? Nếu chưa cần thêm migration.

### Trung bình (cần giải thích cách làm + viết ~20 dòng)

**M6.** **Thêm filter "Chỉ hiện môn đang học"** trên Course List.
- Thêm `useState<"all" | "in_progress" | "completed">` → filter `userCourses`.

**M7.** **Sắp xếp kế hoạch ôn thi theo mức độ ưu tiên** (môn risk cao lên đầu).
- Sort `study_sessions` bằng `getRiskScore()` trước khi render.

**M8.** **Giới hạn 1 tài nguyên/môn/loại mỗi tuần** để tránh spam đề xuất.
- Server Action: count submissions trong 7 ngày gần nhất theo `submitted_by + course_id + resource_type`.

**M9.** **Thêm cột "Điểm cần đạt (CK)" vào bảng admin Student List**.
- Join với `user_courses` + tính `calculateRequiredCK()` cho môn in_progress của từng student.

**M10.** **Hiển thị cảnh báo nếu tổng tín chỉ đăng ký vượt quá 25TC/kỳ**.
- Trong `course-add-modal.tsx`: sum credits của các môn `in_progress` cùng semester.

### Khó (cần thiết kế + giải thích logic)

**M11.** **Export báo cáo GPA ra PDF**.
- Dùng `react-pdf` hoặc `html2canvas + jsPDF`. Server-side generate.

**M12.** **Thêm chức năng so sánh GPA với trung bình khóa/ngành** (cần thêm aggregate query trên admin side).

**M13.** **Gợi ý tài nguyên học tập tự động dựa trên môn đang học** (thay vì user tìm thủ công).
- Join `user_courses` (in_progress) với `study_resources` theo `course_id`, rank theo resource_type.

**M14.** **Cho phép sinh viên import lịch thi từ file Excel (.xlsx)**.
- Cần parse XLSX → `uit-exam-parser.ts` hoặc tạo parser mới.

**M15.** **Thêm notification khi còn 3 ngày trước kỳ thi**.
- Cần background job (Supabase Edge Function + cron) hoặc email trigger.

---

## VI. Câu hỏi về phân công nhóm

45. **Phần nào bạn tự làm? Bạn hiểu code của thành viên khác không?**

46. **Nếu tôi yêu cầu bạn modify module mà bạn không làm chính — bạn có làm được không?**
    - Phải đọc và hiểu toàn bộ codebase. Không được nói "cái đó bạn A làm".

47. **Ước lượng thời gian implement một tính năng mới tương tự Module 3 từ đầu — bạn cần bao lâu?**

---

## VII. Tips trả lời khi bị hỏi modify

| Tình huống | Cách xử lý |
|-----------|-----------|
| Biết cách làm, làm được ngay | Giải thích logic → mở code → sửa trực tiếp |
| Biết cách làm nhưng cần thời gian | "Dạ thầy, approach là... [giải thích]. Em cần khoảng X phút để implement." |
| Không chắc | "Dạ thầy, em nghĩ hướng là... Nhưng em cần kiểm tra lại phần [A/B]." |
| Không biết | **Không nói "em không biết".** Nói: "Dạ thầy, em chưa làm phần này nhưng em hiểu đây là vấn đề về [X], hướng tiếp cận em nghĩ là [Y]." |

---

## VIII. Câu hỏi "giết người" — Thầy rất thích hỏi

48. **"Bạn dùng Supabase vì tiện hay vì hiểu nó hoạt động như thế nào?"**
    - Phải giải thích được: PostgREST API, RLS policy, Auth JWT flow.

49. **"Nếu phải làm lại, bạn thay đổi gì trong kiến trúc?"**

50. **"Hệ thống của bạn scale được không? Nếu có 10,000 sinh viên dùng cùng lúc?"**
    - Vercel serverless + Supabase connection pooling (PgBouncer).

51. **"Dữ liệu của sinh viên có an toàn không? Nếu tôi là hacker, tôi tấn công vào điểm nào?"**
    - SQL Injection (Supabase SDK parameterized → safe), XSS (Next.js escape HTML), IDOR (RLS block), service key exposure (chỉ dùng server-side).

52. **"Bạn có test code không? Test case nào quan trọng nhất?"**
