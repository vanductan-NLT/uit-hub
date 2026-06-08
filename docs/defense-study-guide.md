# UIT Hub — Hướng dẫn vấn đáp đồ án

> Mục tiêu: giải thích được **tại sao** hệ thống làm vậy, **user trải qua gì**, và **thầy hỏi đến đâu thì trả lời được đến đó**.

---

## 1. Dự án là gì — giải thích cho người không biết IT

Sinh viên UIT muốn biết "mình đang học ổn không" phải tra cứu qua nhiều trang: trang kết quả học tập để xem điểm, trang ĐKHP để biết đang đăng ký môn gì, trang lịch thi để biết thi ngày nào, trang CTĐT để biết còn thiếu môn nào. Không có chỗ nào cho biết "nếu kỳ này thi như thế này thì GPA sẽ là bao nhiêu" hay "còn bao nhiêu học kỳ nữa thì tốt nghiệp".

**UIT Hub giải quyết:** tập hợp tất cả vào một chỗ. Sinh viên import dữ liệu từ các trang UIT có sẵn vào, hệ thống tự tính toán và đưa ra cảnh báo, dự báo, gợi ý.

### Tại sao chọn ý tưởng này?

- Vấn đề có thật, tự mình gặp hàng ngày — không phải demo app gượng ép
- Dữ liệu đầu vào là HTML thật từ portal UIT — không cần tự tạo giả
- Scope vừa phải: đủ để demo đầy đủ auth/DB/business logic mà không mất cả năm làm

### Tech stack — tại sao chọn?

| Công nghệ | Lý do thực tế |
|---|---|
| **Next.js 15** | Framework React phổ biến nhất 2024–2025, có Server Components (chạy logic ở server, không expose xuống browser), routing file-based |
| **TypeScript** | Khi codebase lớn dần, TypeScript bắt lỗi "kiểu sai" lúc viết code thay vì lúc chạy. Không dùng TS thì debug runtime rất mệt |
| **Supabase** | Cung cấp database (PostgreSQL), đăng nhập (Auth), và lưu file (Storage) trong một dịch vụ. Không cần tự dựng server backend |
| **Tailwind CSS** | Viết style ngay trong HTML/JSX bằng class, không cần tạo file CSS riêng, responsive nhanh |
| **Vercel** | Deploy Next.js chỉ cần push git, tự động build và có URL preview |

---

## 2. Kiến trúc tổng quan — ai làm gì

```
Supabase (cloud)
  ├─ Auth:     quản lý tài khoản, đăng nhập, session
  ├─ Database: PostgreSQL lưu toàn bộ dữ liệu
  └─ Storage:  lưu file tài liệu upload

Next.js App (Vercel)
  ├─ Server side: kiểm tra đăng nhập, bảo vệ trang
  └─ Client side: giao diện, tính toán GPA, hiển thị

Browser (user)
  └─ Tương tác với app, import file HTML từ UIT
```

Dữ liệu đi theo chiều: **User thao tác → Browser → Supabase DB → Browser hiển thị lại**. Không có server riêng ở giữa — Next.js + Supabase đảm nhiệm luôn.

---

## 3. Auth & Bảo vệ trang — nghiệp vụ

### Ai được vào trang nào?

| Trang | Điều kiện |
|---|---|
| `/login` | Ai cũng vào được |
| `/onboarding` | Đã đăng nhập nhưng chưa tạo hồ sơ lần đầu |
| `/dashboard`, `/gpa`, `/roadmap`... | Đã đăng nhập + đã có hồ sơ |
| `/admin` | Đã đăng nhập + role là `admin` hoặc `owner` |

### Tại sao cần onboarding riêng?

Khi user đăng nhập lần đầu, hệ thống biết họ *tồn tại* (có account trong Auth) nhưng chưa biết họ là sinh viên ngành gì, khoá nào. Onboarding là bước bắt buộc để tạo profile — không có profile thì không biết hiển thị lộ trình nào, tính GPA theo ngưỡng nào.

### Luồng đăng nhập

```
1. Vào /dashboard
2. Hệ thống kiểm tra: có session chưa?
   → Chưa → về /login
3. Login xong → Supabase set cookie session
4. Kiểm tra: có profile chưa?
   → Chưa → về /onboarding
5. Onboarding xong → vào /dashboard bình thường
```

Cookie session tự động theo mỗi request → server biết ai đang dùng mà không cần gửi lại token thủ công.

### 3 role trong hệ thống

- **student**: chỉ quản lý dữ liệu của chính mình
- **admin**: thêm được catalog môn học, duyệt tài liệu, quản lý sinh viên
- **owner**: làm được mọi thứ, kể cả nâng/hạ role của admin

Quan trọng: admin **không** được đụng vào owner. Chỉ owner mới assign owner cho người khác.

---

## 4. Onboarding — 3 bước đầu tiên

### Bước 1: Nhập hồ sơ

User điền: Họ tên, MSSV, Ngành, Hệ đào tạo.

Hệ thống tự suy ra từ MSSV:
- **Năm nhập học**: 2 chữ số đầu của MSSV. `22521234` → năm 2022
- **Năm tốt nghiệp dự kiến**: tùy ngành. KHMT/TTNT/ATTT học 3.5 năm, còn lại 4 năm. Ví dụ CNTT vào 2022 → tốt nghiệp 2026

Tại sao cần suy ra? Để hệ thống hiển thị đúng CTĐT của khoá đó, tính đúng số học kỳ còn lại.

### Bước 2: Nhập môn đã học (có thể bỏ qua)

User có thể nhập điểm các môn đã học trước đó. Nếu bỏ qua, GPA bắt đầu từ 0 — sau có thể import file bảng điểm từ UIT.

GPA được tính realtime ngay trên trang này khi user nhập, không cần lưu.

### Bước 3: Done

Hệ thống hiển thị GPA và số tín chỉ đã nhập được. User bấm vào app.

---

## 5. Course Tracker — nghiệp vụ quản lý môn học

### Bài toán cần giải

Sinh viên có nhiều môn ở nhiều trạng thái khác nhau:
- Môn đã qua (có điểm)
- Môn đang học học kỳ này (chưa có điểm cuối)
- Môn rớt (điểm < 4)
- Môn được miễn (exempted — không học nhưng vẫn tính tín chỉ)

Hệ thống cần biết đúng trạng thái từng môn để tính GPA, tín chỉ tích lũy, lộ trình.

### 4 trạng thái môn + ý nghĩa nghiệp vụ

| Status | Ý nghĩa | Tính GPA? | Tính tín chỉ? |
|---|---|---|---|
| `completed` | Đã hoàn thành, có điểm | Có | Nếu điểm ≥ 4 |
| `in_progress` | Đang học kỳ này | Không (dự báo) | Chưa |
| `failed` | Đã thi, điểm < 4 | Có (kéo GPA xuống) | Không |
| `exempted` | Được miễn học | Không | Có (vẫn tính TC) |

Môn `failed` vẫn tính vào GPA (kéo xuống) — đây là quy định của UIT, không phải hệ thống tự chế.

### 3 cách nhập môn vào hệ thống

**Cách 1: Nhập thủ công** — chọn môn từ catalog, nhập điểm. Dùng khi chỉ muốn thêm 1-2 môn.

**Cách 2: Import file HTML bảng điểm**
- Vào trang kết quả học tập UIT → Ctrl+S lưu file HTML
- Upload vào UIT Hub → hệ thống đọc HTML, nhận ra cấu trúc bảng, lấy ra toàn bộ môn học + điểm + học kỳ
- Tự động phân biệt môn "Miễn" thành `exempted`, điểm < 4 thành `failed`

Tại sao đọc được HTML? HTML từ UIT có cấu trúc bảng nhất quán. Hệ thống nhận ra header học kỳ, nhận ra row môn học dựa trên mã môn (ví dụ `CS001`, `MT001`).

**Cách 3: Import từ ĐKHP**
- Vào trang ĐKHP UIT → copy text danh sách môn đăng ký
- Paste vào UIT Hub → hệ thống parse, thêm vào với status `in_progress`

**Quy tắc quan trọng khi import:** nếu môn đó đã có trạng thái `completed` hoặc `exempted`, hệ thống **không cho phép** import ĐKHP ghi đè thành `in_progress`. Lý do: sinh viên có thể học lại môn đã qua (để cải thiện điểm) nhưng ĐKHP không phân biệt được — nên hệ thống chọn cách an toàn là giữ nguyên trạng thái cũ.

### Unique constraint: mỗi người chỉ có 1 record cho 1 môn

Hệ thống dùng cơ chế "upsert" — nếu đã có môn đó thì cập nhật, chưa có thì thêm mới. Không bao giờ có 2 record cùng (người dùng + môn học) trong DB.

---

## 6. GPA — nghiệp vụ tính điểm

### GPA thang 10 tính thế nào?

```
GPA10 = Tổng (điểm_môn × số_tín_chỉ) / Tổng số_tín_chỉ
```

Chỉ tính môn **có điểm** (không tính môn đang học, không tính môn được miễn). Môn rớt (điểm < 4) **vẫn tính** — kéo GPA xuống.

### GPA thang 4 tính thế nào?

```
GPA4 = GPA10 / 2.5   ← code dùng công thức linear này
```

Bảng **chính thức UIT** dùng step function: A(≥8.5)→4.0, B+(8.0–8.4)→3.5, B(7.0–7.9)→3.0, C+(6.5–6.9)→2.5, C(5.0–6.4)→2.0, D(4.0–4.9)→1.0, F(<4.0)→0.0.

Code dùng `GPA10 / 2.5` là gần đúng (approximation), không khớp hoàn toàn (ví dụ: 8.5/2.5=3.4, bảng UIT là 4.0). Nếu cần chính xác tuyệt đối phải dùng lookup table.

### Tín chỉ tích lũy tính thế nào?

Chỉ tính môn **điểm ≥ 4** hoặc **được miễn**. Môn rớt không tính tín chỉ tích lũy dù đã học.

### Xếp loại học lực

| GPA4 | Xếp loại |
|---|---|
| ≥ 3.6 | Xuất sắc |
| ≥ 3.2 | Giỏi |
| ≥ 2.8 | Khá |
| ≥ 2.0 | Trung bình |
| < 2.0 | Yếu |

---

## 7. GPA Forecast — nghiệp vụ dự báo

### Bài toán 1: Dự báo GPA cuối học kỳ

User đang học môn X với điểm quá trình 8.5. Chưa thi cuối kỳ. GPA cuối học kỳ sẽ là bao nhiêu?

Hệ thống làm:
1. Với môn chưa có điểm CK: **giả định** CK đạt vừa đủ loại B (7.0). Từ đó tính điểm dự báo cho môn đó.
2. Cộng tất cả môn dự báo vào môn đã có điểm → tính GPA dự báo tích lũy.

Dự báo này hiển thị ở card "Dự báo cuối HK" và "Thay đổi" trên trang GPA.

### Bài toán 2: Điểm CK cần để đạt loại B (hoặc mức bất kỳ)

Mỗi môn có điểm thành phần khác nhau — ví dụ:
- Môn A: 40% Quá trình + 60% Cuối kỳ
- Môn B: 30% GK + 70% CK

User nhập điểm Quá trình = 8.5 (môn A). Cần CK bao nhiêu để được B (7.0)?

```
0.4 × 8.5 + 0.6 × CK = 7.0
3.4 + 0.6 × CK = 7.0
CK = (7.0 - 3.4) / 0.6 = 6.0
```

Hệ thống tính ngược như vậy cho từng môn. Nếu kết quả > 10 → không thể đạt được dù thi 10/10.

### Cảnh báo môn rủi ro (riskyCount trên sidebar)

Hệ thống tự động đánh dấu môn "nguy hiểm" khi:
- Chưa thi CK: cần điểm CK > 8.5 để đạt B — nghĩa là áp lực rất cao
- Hoặc: tổng điểm hiện tại (kể cả chưa có CK) đã < 5.5 — gần rớt môn

Số đỏ trên sidebar sidebar = số môn đang trong tình trạng này.

### Bài toán 3: 🎯 Tính ngược — "Tôi cần GPA bao nhiêu, phải thi thế nào?"

Đây là tính năng cốt lõi nhất. User kéo slider chọn mục tiêu GPA (2.0–4.0), hệ thống tính:

**Câu hỏi:** Để GPA tích lũy đạt 3.2 sau học kỳ này, các môn đang học cần điểm trung bình bao nhiêu?

**Tính điểm trung bình cần:**
```
GPA10 mục tiêu = 3.2 × 2.5 = 8.0

Từ môn đã hoàn thành: đã đóng góp bao nhiêu điểm × tín chỉ rồi?
Còn thiếu: (8.0 × tổng tín chỉ) − điểm đã có
Trung bình cần từ môn đang học = còn thiếu / tín chỉ đang học
```

**Phân bổ công bằng từng môn (water-fill):**

Nếu chỉ bảo "mỗi môn cần trung bình 8.0" → vô lý: môn đã điểm thành phần 4.0 thì dù CK = 10 cũng chỉ đạt khoảng 8.0 thôi; môn điểm thành phần 8.0 thì chỉ cần CK 6.0.

Hệ thống phân bổ thông minh hơn: tìm một mức chung L, rồi:
- Môn điểm thành phần cao → được giao target thấp hơn (đã gần đủ)
- Môn điểm thành phần thấp → được phép yêu cầu CK cao hơn, tối đa đến 10
- Nếu môn nào ngay cả CK = 10 cũng không đủ → hiện ">10 ⚠️", slack chuyển sang môn khác

Kết quả: mỗi môn có 1 con số CK cần đạt cụ thể, màu xanh/cam/đỏ theo độ khó. User biết cần tập trung ôn môn nào nhất.

**3 kết quả có thể xảy ra:**
- ✅ **Đã đạt rồi** — GPA hiện tại đã vượt mục tiêu rồi, học kỳ này đủ
- 🚫 **Không thể đạt** — dù tất cả môn 10/10 cũng không đủ, cần hạ mục tiêu xuống
- 📊 **Cần trung bình X** — khả thi, hiển thị từng môn cần CK bao nhiêu

---

## 8. Exam Schedule — nghiệp vụ lịch thi

### Bài toán

Sinh viên có nhiều môn thi trong một học kỳ. Lịch thi từ UIT chỉ là file HTML, không thể đồng bộ với app bên thứ ba. User cần biết: còn bao nhiêu ngày đến kỳ thi gần nhất? Thi ngày nào? Phòng nào?

### Cách import lịch thi

- Vào trang lịch thi UIT → lưu file HTML
- Upload vào UIT Hub → hệ thống đọc bảng lịch, match tên môn với catalog → lưu vào DB

Mỗi môn chỉ có 1 kỳ GK và 1 kỳ CK — import lại sẽ cập nhật chứ không tạo trùng.

### Đếm ngày đến kỳ thi

Hệ thống tìm kỳ thi gần nhất từ hôm nay trở đi, tính số ngày còn lại. Số này hiển thị trên sidebar. Nếu không có kỳ thi nào trong tương lai → không hiện.

### Study sessions — ôn tập có kế hoạch

User có thể tạo lịch ôn tập trước mỗi kỳ thi: "Ngày X ôn môn Y, ngày Z ôn môn Y". Tick từng buổi khi hoàn thành. Giúp track tiến độ ôn tập.

Khi tạo plan mới cho 1 kỳ thi → xóa plan cũ + tạo mới (không chồng chéo).

---

## 9. Study Resources — nghiệp vụ tài liệu học tập

### Bài toán

Tài liệu học tập (slide, video, đề thi cũ) thường phân tán trên Facebook group, Drive cá nhân. UIT Hub tạo chỗ tập trung.

### Ai được làm gì?

| Ai | Làm được gì |
|---|---|
| Sinh viên | Xem tài liệu đã được duyệt; đóng góp tài liệu mới (chờ duyệt) |
| Admin | Duyệt/từ chối tài liệu; thêm tài liệu trực tiếp không cần duyệt |

### Luồng moderation — tại sao cần duyệt?

Tránh tài liệu spam, sai, vi phạm bản quyền. Tài liệu mới → trạng thái "pending" → admin xem → approve thành "published" hoặc reject với ghi chú lý do.

Chỉ tài liệu "published" mới hiện với mọi người. Sinh viên submit vẫn thấy được tài liệu của chính mình (kể cả pending/rejected) qua phần "Bài đóng góp của tôi".

### Loại tài liệu

- `video`: video bài giảng
- `slide`: slide môn học
- `exercise`: bài tập, worksheet
- `exam`: đề thi cũ

### Upload file

File lưu vào Supabase Storage, không phải DB. DB chỉ lưu đường dẫn file. URL truy cập file được generate lúc hiển thị, không lưu cứng — tránh URL thay đổi làm DB lỗi thời.

Chỉ chấp nhận: PDF, PPTX, PPT, DOCX, DOC. Tối đa 50MB. Các định dạng khác bị chặn từ validation phía client trước khi upload.

---

## 10. Curriculum Roadmap — nghiệp vụ lộ trình tốt nghiệp

### Bài toán

Sinh viên không biết mình còn thiếu môn nào để tốt nghiệp, tiếp theo nên đăng ký môn gì, và điều kiện tốt nghiệp là gì.

### Dữ liệu CTĐT từ đâu?

CTĐT (chương trình đào tạo) là bộ quy tắc: ngành CNTT khoá K19 phải học những môn nào, theo thứ tự nào (tiên quyết), bao nhiêu tín chỉ.

Admin import CTĐT từ trang `student.uit.edu.vn` → lưu vào DB. Mỗi sinh viên sau đó import CTĐT của mình (theo ngành + khoá) → hệ thống biết lộ trình của họ.

**Curriculum ID format:** `CNTT-K24`, `KTPM-K19` — ghép từ tên ngành + khoá (năm nhập học - 2005).

### 4 trạng thái môn trong lộ trình

| Trạng thái | Nghĩa | Màu |
|---|---|---|
| ✅ Đã qua | điểm ≥ 4 hoặc được miễn | Xanh lá |
| 🔄 Đang học | đang đăng ký học kỳ này | Vàng |
| 📗 Có thể đăng ký | tất cả môn tiên quyết đã qua | Xanh dương |
| 🔒 Chưa đủ điều kiện | còn môn tiên quyết chưa qua | Xám |

Ví dụ: môn Lập trình hướng đối tượng yêu cầu phải qua Nhập môn lập trình trước. Nếu Nhập môn LP chưa qua → OOP bị khóa.

### Gợi ý môn học kỳ tới

Hệ thống tự động gợi ý môn nên đăng ký kỳ tới. Tiêu chí:
1. Trong CTĐT của sinh viên (không phải môn ngành khác)
2. Chưa đăng ký hoặc học bao giờ
3. Môn tiên quyết đã qua đủ hết
4. Không gợi ý môn học kỳ quá xa so với hiện tại (ví dụ đang HK3, không gợi môn HK7)
5. Không gợi môn tiên quyết của môn đã học (ví dụ đã học OOP rồi thì không gợi Nhập môn LP nữa — dù chưa học)

Ưu tiên: môn bắt buộc (required) trước, môn đại cương (general) sau, môn tự chọn (elective) cuối.

### Nhóm môn tự chọn (elective group)

Một số nhóm CTĐT có dạng "chọn 10 tín chỉ từ 3 môn sau". Roadmap hiển thị nhóm này gom lại, theo dõi đã earn bao nhiêu tín chỉ. Khi đủ → nhóm đó được đánh dấu fulfilled, các môn còn lại trong nhóm không gợi ý nữa.

### Điều kiện tốt nghiệp

Hệ thống kiểm tra từng điều kiện:

| Điều kiện | Mặc định UIT |
|---|---|
| Tiếng Anh | TOEIC ≥ 450 |
| Giáo dục quốc phòng | Hoàn thành |
| Giáo dục thể chất | Hoàn thành |
| Tổng tín chỉ | Theo CTĐT (thường 131 TC) |
| GPA tích lũy | ≥ 2.0 (thang 4) |

Sinh viên tự tick các milestone (TOEIC đạt, GDQP xong...). Hệ thống tự tính tín chỉ và GPA từ dữ liệu môn học đã có.

### Dự tính thời gian còn lại

Từ tốc độ học kỳ trước (trung bình bao nhiêu tín chỉ/học kỳ), hệ thống tính:
```
Còn bao nhiêu kỳ = (Tổng TC cần − TC đã có) / trung bình TC/kỳ
```

---

## 11. Admin Panel — nghiệp vụ quản trị

### Tại sao cần admin?

Catalog môn học và CTĐT của UIT thỉnh thoảng thay đổi (thêm môn mới, cập nhật tiên quyết). Admin cần cập nhật dữ liệu gốc để mọi sinh viên dùng được đúng.

### Các tác vụ admin

**Quản lý Catalog môn học:**
Upload file HTML catalog từ UIT → hệ thống parse và cập nhật toàn bộ thông tin môn: tên, tín chỉ, tiên quyết, nhóm môn. Dùng upsert — môn đã có thì update, chưa có thì thêm mới.

**Quản lý CTĐT:**
Import link từ trang CTĐT UIT → hệ thống fetch, parse, lưu vào 3 bảng (curricula, curriculum_courses, graduation_requirements). Mỗi lần import cho một ngành + khoá.

**Duyệt tài liệu:**
Xem danh sách tài liệu pending, xem nội dung, approve/reject kèm ghi chú lý do.

**Quản lý sinh viên:**
Xem danh sách sinh viên, thay đổi role (admin có thể nâng lên admin hoặc hạ xuống student, nhưng không được đụng owner).

### Tại sao admin dùng key đặc biệt?

Database có cơ chế bảo vệ: mỗi user chỉ đọc/ghi được dữ liệu của chính mình. Nhưng admin cần ghi vào bảng catalog dùng chung. Supabase cấp một "service role key" bypass bảo vệ đó. Key này chỉ dùng ở phía server, không bao giờ gửi xuống browser — tránh bị lộ.

---

## 12. Import HTML — tại sao đọc được?

Đây là tính năng nhiều người tò mò nhất. Hệ thống không cần login vào UIT, chỉ cần file HTML người dùng tự lưu.

### Tại sao hoạt động được?

Trang UIT sinh ra HTML với cấu trúc bảng nhất quán qua nhiều năm. Hệ thống nhận biết cấu trúc đó:
- Bảng bảng điểm có header học kỳ ở dạng "Học kỳ 1 - Năm học 2024-2025"
- Mỗi môn có mã môn theo format chuẩn (2-5 chữ cái + 2-3 số: CS001, MT001...)
- Điểm nằm ở cột thứ 9 trong bảng

Khi gặp "Miễn" ở cột điểm → môn được miễn. Khi gặp số < 4 → rớt môn.

### Tại sao không tự động đồng bộ mà phải upload tay?

Portal UIT không có API công khai. Không có cách tự động lấy dữ liệu mà không yêu cầu mật khẩu UIT của sinh viên — điều này vi phạm bảo mật. Giải pháp upload file tay là cách an toàn nhất: sinh viên chủ động, không cần cấp quyền cho app.

---

## 13. Câu hỏi thầy hay hỏi — trả lời theo nghiệp vụ

**"Tại sao cần onboarding riêng, không gộp vào đăng ký tài khoản?"**
> Đăng nhập dùng Supabase Auth (có thể Google OAuth) — bước đó chỉ tạo account. Thông tin học tập (ngành, khoá, MSSV) là dữ liệu riêng của app, không phải của hệ thống auth. Tách ra để rõ ràng: auth giải quyết "ai đang dùng", onboarding giải quyết "sinh viên này thuộc về CTĐT nào".

**"GPA tính thế nào, tại sao môn rớt vẫn tính?"**
> Đây là quy định của UIT — môn rớt vẫn tính vào GPA (kéo xuống), không được loại bỏ. Sinh viên muốn cải thiện GPA phải học lại và có điểm mới đè lên. Hệ thống tuân theo đúng quy định này, không tự ý bỏ môn rớt ra.

**"Tại sao không để hệ thống tự đồng bộ với UIT?"**
> UIT không cung cấp API công khai. Cách duy nhất tự động là yêu cầu mật khẩu tài khoản UIT của sinh viên — rủi ro bảo mật rất cao, không phù hợp. Upload file HTML là giải pháp an toàn, sinh viên kiểm soát hoàn toàn.

**"Tính ngược GPA hoạt động thế nào?"**
> User chọn GPA mục tiêu → hệ thống tính ngược: cần điểm trung bình bao nhiêu từ các môn đang học. Sau đó phân bổ công bằng từng môn — môn đang điểm thành phần cao thì CK cần ít hơn, môn đang yếu thì CK cần nhiều hơn, tối đa 10. Nếu ngay cả 10 cũng không đủ → báo không thể đạt.

**"Tại sao có cơ chế guard khi import ĐKHP?"**
> Import ĐKHP chỉ biết môn đang đăng ký — không biết đó là lần đầu học hay học lại. Nếu sinh viên học lại môn đã qua, hệ thống không được xóa điểm cũ đi. Guard kiểm tra: môn đã completed/exempted thì bỏ qua, không ghi đè.

**"Study resources tại sao cần duyệt?"**
> Tránh spam, nội dung sai, vi phạm bản quyền. Sinh viên đóng góp, admin kiểm tra chất lượng rồi mới publish. Giống cơ chế pull request trong git — ai cũng đề xuất nhưng người có quyền mới merge.

**"CTĐT lưu thế nào?"**
> Một CTĐT (ví dụ CNTT khoá K19) bao gồm: thông tin tổng quan (tổng tín chỉ, loại yêu cầu từng nhóm), danh sách môn học kèm học kỳ gợi ý và loại yêu cầu, và tiêu chuẩn tốt nghiệp. Admin import một lần, toàn bộ sinh viên khoá đó dùng chung.

**"Lộ trình hiển thị thế nào nếu sinh viên chưa import CTĐT?"**
> Hiện trạng thái "chưa có CTĐT", kêu gọi import. Không gợi ý môn ngẫu nhiên vì catalog có hơn 1000 môn từ nhiều ngành — gợi ý không có CTĐT sẽ ra hàng trăm môn không liên quan.

---

## 14. Q&A chi tiết theo từng module

### 14.1 Module lộ trình môn học

**Công thức chuyển thang 10 → thang 4?**
> Bảng chính thức UIT (có dấu trường, ký ngày 14/04/2025) dùng **step function**:
>
> | Thang 10 | Điểm 4 | Điểm chữ | Xếp loại | Loại |
> |---|---|---|---|---|
> | 9.0 – 10.0 | 4.0 | A+ | Xuất sắc | Đạt |
> | 8.0 – cận 9.0 | 3.5 | A | Giỏi | Đạt |
> | 7.0 – cận 8.0 | 3.0 | B+ | Khá | Đạt |
> | 6.0 – cận 7.0 | 2.5 | B | Trung bình khá | Đạt |
> | 5.0 – cận 6.0 | 2.0 | C | Trung bình | Đạt |
> | 4.0 – cận 5.0 | 1.5 | D+ | Yếu | Đạt |
> | 3.0 – cận 4.0 | 1.0 | D | Kém | **Không đạt** |
> | < 3.0 | 0.0 | F | Kém | **Không đạt** |

**Nguồn công thức ở đâu và code có đúng không?**
> Code dùng `GPA4 = GPA10 / 2.5` (linear, comment "Quamon/SVUIT linear formula").
> Đây là **gần đúng, không khớp hoàn toàn** bảng step function trên.
> Ví dụ: 9.0 / 2.5 = 3.6, bảng UIT là 4.0 (A+).
>
> **Khi thầy hỏi:** "Code dùng công thức tuyến tính để đơn giản hoá. Biết là xấp xỉ — nếu cần chính xác tuyệt đối theo quy định trường thì cần dùng lookup table."

**Điểm như thế nào là đạt, như thế nào là rớt?**
> Theo bảng chính thức 2025: **D+ (4.0–cận 5.0) vẫn Đạt** (Yếu), **D (<4.0) và F (<3.0) mới Không đạt**.
> → Ngưỡng qua môn là **4.0**.
>
> Code dùng `>= 4.0` cho "đạt/tính tín chỉ" — **ĐÚNG** theo bảng chính thức.
> - `completed` + `score >= 4.0` → đạt, tính tín chỉ tích lũy (badge **Đạt** xanh)
> - `failed` hoặc `score < 4.0` → rớt (badge **Rớt** đỏ), không tính tín chỉ
> - Môn rớt vẫn tính vào GPA — đúng quy định UIT
>
> ⚠️ **Bug phát hiện:** `course-utils.ts` dùng `>= 5.0` để dự tính thời gian tốt nghiệp — **sai**, phải là `>= 4.0` theo bảng chính thức.

**Tín chỉ tích lũy tính thế nào?**
> Hàm `calculatePassedCredits` trong `use-courses.ts`:
> ```
> Tính tín chỉ nếu: status === "exempted" (được miễn)
>                   HOẶC (score >= 4.0 VÀ status === "completed")
> ```
> Môn rớt, môn đang học → không tính.

**Làm sao biết môn đại cương / chuyên ngành / tự chọn?**
> Trường `course_type` trong bảng `courses` trong DB, giá trị có thể là: `general` (đại cương), `required` (chuyên ngành bắt buộc), `elective` (tự chọn).
> Data này đến từ **admin import catalog** — admin upload file HTML catalog từ UIT, hệ thống parse và gán `course_type` cho từng môn.
> Sinh viên không tự gán — hoàn toàn lấy từ catalog chính thức.

**Nếu thêm môn bị trùng thì sao?**
> Hệ thống dùng **upsert** với unique constraint `(user_id, course_id)` trong DB.
> Nghĩa là: nếu đã có môn đó rồi → **cập nhật** record cũ. Không bao giờ có 2 record cùng người cùng môn.
> Thêm lại môn đã có → cập nhật điểm/semester mới nhất.

**Thêm môn không có trong CTĐT của ngành đó thì sao?**
> Vẫn thêm được bình thường. Hệ thống không chặn — catalog có hơn 1000 môn từ nhiều ngành.
> Môn đó sẽ:
> - Được tính vào GPA và tín chỉ (như mọi môn khác)
> - **Không** xuất hiện trong lộ trình CTĐT (vì CTĐT của ngành không có môn này)
> - **Không** được gợi ý ở phần "Gợi ý môn kỳ tới" (vì gợi ý lọc theo CTĐT)

**Tại sao lại có nút xóa môn? Xóa xong thì sao?**
> Xóa dùng để: sửa lỗi nhập sai môn, môn bị hủy đăng ký, dọn dẹp dữ liệu test.
> Khi xóa: gọi `deleteUserCourse` → DELETE record khỏi DB → môn biến mất khỏi danh sách, không còn tính vào GPA nữa. Không có undo.

**Tại sao lại cần sửa môn?**
> Nút ✏️ mở inline edit để sửa **điểm** và **học kỳ**. Cần thiết khi: nhập điểm sai, học kỳ sai, hoặc muốn cập nhật điểm mới sau khi thi lại.

**Tab "Lộ trình" có ý nghĩa gì? Tại sao hiện như vậy?**
> Có 2 tab: "Danh sách" (table view) và "Lộ trình" (roadmap view).
>
> Tab **Lộ trình** hiện CTĐT của ngành sinh viên, chia theo từng học kỳ gợi ý (HK1, HK2, ...). Mỗi môn hiện màu theo trạng thái:
> - 🟢 Xanh = đã qua
> - 🔵 Xanh dương = có thể đăng ký (prereq đã xong)
> - 🟡 Vàng = đang học
> - ⬜ Xám = chưa đủ điều kiện (còn prereq chưa qua)
>
> Ý nghĩa: sinh viên nhìn vào biết ngay còn cần học gì, học theo thứ tự nào. Hiện ra như vậy vì dữ liệu được sắp xếp theo `suggested_semester` trong bảng `curriculum_courses`.

---

### 14.2 Module dự báo GPA

**GPA được tính như thế nào?**
> **GPA thang 10:**
> ```
> GPA10 = Σ(điểm_môn × tín_chỉ) / Σ(tín_chỉ)
> ```
> Chỉ tính môn có điểm (`score != null` và `status == "completed"`). Môn rớt tính vào. Môn đang học, môn được miễn không tính.
>
> **GPA thang 4:** `GPA4 = GPA10 / 2.5`
>
> Hàm: `calculateGPA10`, `calculateGPA4` trong `src/hooks/use-courses.ts`.

**Như thế nào là "ổn định" hay "nguy hiểm"? Mấy phần trăm đó ở đâu ra?**
> Không có khái niệm % ổn định/nguy hiểm trong code. Hệ thống dùng badge màu:
> - Badge GPA: **Xuất sắc** ≥3.6 | **Giỏi** ≥3.2 | **Khá** ≥2.8 | **Trung bình** ≥2.0 | **Yếu** <2.0
> - Badge "⚠️ X môn cần chú ý" = `riskyCount` — đếm số môn đang học có nguy cơ cao (xem phần dưới)
>
> Màu badge GPA: xanh lá ≥3.2, vàng ≥2.8, đỏ <2.8.

**A, B, C — A+, B+, … là gì?**
> Hệ letter grade theo thang 10, dùng để hiển thị badge điểm môn (không tính vào GPA).
>
> Bảng **chính thức UIT 2025** vs bảng **trong code** (`GRADE_THRESHOLDS`):
>
> | Letter | Bảng chính thức | Code (gpa-forecast-utils.ts) |
> |---|---|---|
> | A+ | ≥ 9.0 | ≥ 9.0 ✅ |
> | A  | ≥ 8.0 | ≥ 8.5 ⚠️ |
> | B+ | ≥ 7.0 | ≥ 8.0 ⚠️ |
> | B  | ≥ 6.0 | ≥ 7.0 ⚠️ |
> | C  | ≥ 5.0 | ≥ 5.5 ⚠️ |
> | D+ | ≥ 4.0 | ≥ 5.0 ⚠️ |
> | D  | ≥ 3.0 | ≥ 4.0 ⚠️ |
>
> Code có sự khác biệt so với bảng chính thức 2025 — các ngưỡng trong code lấy theo bảng cũ hơn (có thể là bảng trước tháng 4/2025).
>
> **Khi thầy hỏi:** "Phát hiện ra code dùng ngưỡng theo bảng cũ. Bảng mới nhất ký tháng 4/2025 có cập nhật ngưỡng. Để fix thì chỉ cần cập nhật mảng `GRADE_THRESHOLDS` trong `gpa-forecast-utils.ts`."

**Logic nghiệp vụ tính ngược GPA là gì?**
> User muốn GPA tích lũy đạt X sau học kỳ này. Hệ thống hỏi: "Các môn đang học cần điểm trung bình bao nhiêu?"
>
> ```
> 1. Đổi: targetGPA10 = targetGPA4 × 2.5
> 2. Tổng điểm đã có (môn hoàn thành): completedWeightedSum = Σ(score × credits)
> 3. Tổng tín chỉ = môn đã xong + môn đang học
> 4. Điểm cần từ môn đang học = (targetGPA10 × totalCredits) − completedWeightedSum
> 5. Trung bình cần = điểm cần / tín chỉ đang học
> ```
>
> Hàm: `calculateRequiredAvgScore` trong `gpa-forecast-utils.ts`.

**Làm sao từ GPA suy ngược ra điểm từng môn?**
> `requiredAvg` là điểm trung bình chung. Nhưng giao cùng 1 con số cho mọi môn sẽ không công bằng: môn đang 8.0 quá trình thì chỉ cần CK 6.x, nhưng môn đang 3.0 quá trình thì dù CK 10 cũng chỉ đạt tầm 7.x.
>
> **Thuật toán water-fill (binary search):**
> 1. Mỗi môn có `[min, max]` điểm khả thi (phụ thuộc điểm thành phần đã nhập + CK)
> 2. Tìm mức L (binary search, 40 lần lặp) sao cho `Σ(clamp(L, min_i, max_i) × credits_i) = needed`
> 3. Môn nào không thể đạt L (đã capped) → slack chuyển sang môn có headroom
> 4. Tính ngược CK cần: `CK = (targetScore − partialWithoutCK) / ckWeight`
>
> Hàm: `distributeRequiredScores` trong `gpa-forecast-utils.ts`.

**Như thế nào là môn "cần chú ý"?**
> Badge "⚠️ X môn cần chú ý" trong topbar GPA panel.
> 1 môn bị flag khi **ít nhất 1 trong 2**:
> - Chưa nhập điểm CK, nhưng CK cần để đạt B (7.0) > **8.5** → áp lực thi rất cao
> - Điểm hiện tại (kể cả chưa có CK) < **5.5** → đang gần ngưỡng rớt môn
>
> Logic: `gpa-panel.tsx` hàm `riskyCount`, dùng `calculateRequiredCK` và `calculatePartialScore`.

---

### 14.3 Module kế hoạch ôn thi

**Module hoạt động ra sao?**
> 1. User vào trang lịch thi UIT → Ctrl+S lưu file HTML
> 2. Upload vào UIT Hub → hệ thống parse bảng lịch, extract: tên môn, ngày thi, phòng thi, ca thi
> 3. Match tên môn với catalog (theo mã môn) → lưu vào bảng `exam_schedules`
> 4. Hệ thống **tự động tạo study sessions** ngược từ ngày thi: ví dụ thi ngày 20, tạo buổi ôn ngày 17, 18, 19
> 5. User tick buổi ôn khi hoàn thành → toggle `is_completed` trong DB

**Màu sắc có ý nghĩa gì?**
> Màu urgency (dựa trên số ngày còn đến kỳ thi):
> - 🔴 Đỏ = ≤ 7 ngày → khẩn cấp
> - 🟡 Vàng = 8–14 ngày → cảnh báo
> - 🟢 Xanh = > 14 ngày → ổn
>
> Calendar heatmap:
> - 🔵 Xanh dương = ngày có buổi ôn chưa hoàn thành
> - 🟢 Xanh lá = ngày có buổi ôn đã tick xong hết
> - 🔴 Đỏ = ngày thi
> - Trắng = ngày bình thường

**Logic link vs calendar là sao?**
> Mỗi môn thi có nút **"📅 Lịch"** → mở Google Calendar với thông tin thi điền sẵn (tên môn, ngày, giờ, phòng). User chỉ cần click "Save" trong Google Calendar.
>
> **Calendar heatmap** (góc phải) là lịch tháng visual: nhìn vào biết ngày nào ôn thi, ngày nào thi, tiến độ tổng thể.
>
> Hai thứ này độc lập: Calendar heatmap = view trong app; Google Calendar link = export ra Google Calendar của user.

**Data môn thi này ở đâu ra?**
> Hoàn toàn từ user import. Hệ thống không tự lấy từ UIT. User tự lưu file HTML từ trang lịch thi UIT về, upload vào app. Không có lịch thi demo hay mock data.

---

### 14.4 Module tài nguyên học tập

**Module hoạt động như thế nào?**
> **Luồng sinh viên đóng góp:**
> 1. Fill form: tên tài liệu, mô tả, loại, môn học, URL YouTube (nếu video) hoặc upload file
> 2. Submit → lưu với `status = "pending"` → không ai thấy được (kể cả người khác)
> 3. Admin duyệt → `status = "published"` → hiện với tất cả sinh viên
>
> **Luồng xem tài liệu:**
> - Mặc định: chỉ thấy tài liệu đã `published`
> - Tab "Bài đóng góp của tôi": thấy cả pending + rejected (của chính mình)

**Màu sắc có ý nghĩa gì?**
> Badge loại tài liệu màu khác nhau:
> - 🎬 Video — màu xanh dương
> - 📊 Slide — màu tím
> - 📝 Bài tập — màu cam
> - 📋 Đề thi cũ — màu đỏ
>
> Badge trạng thái: `pending` (vàng), `published` (xanh), `rejected` (đỏ) — chỉ thấy trong tab "Bài đóng góp của tôi".

**Data lưu ở đâu?**
> **Database (Supabase):** metadata — tên tài liệu, mô tả, loại, course_id, submitted_by, status, reject_reason, created_at
>
> **Supabase Storage:** file thật — path `resources/{userId}/{uuid}.{extension}`
>
> DB không lưu URL cứng. Khi hiển thị → gọi Supabase Storage API để lấy public URL lúc đó. Tránh URL hỏng theo thời gian.

**Upload được những gì? Dung lượng tối đa?**
> - Định dạng: `.pdf`, `.pptx`, `.ppt`, `.docx`, `.doc`
> - Dung lượng: tối đa **50MB** mỗi file
> - Validation chạy ở **client trước** khi upload → báo lỗi ngay, không tốn bandwidth nếu file sai định dạng
> - Nguồn: `validateResourceFile()` trong `src/lib/validation-utils.ts`

---

### 14.5 Module Admin

**Tại sao CTĐT và danh mục lại ở module Admin?**
> Dữ liệu catalog và CTĐT là dữ liệu **dùng chung** cho toàn bộ sinh viên — không phải dữ liệu cá nhân. Nếu mọi sinh viên đều tự nhập thì:
> - Dữ liệu rác, không nhất quán (cùng môn nhưng mỗi người nhập tên khác nhau)
> - Không đảm bảo tín chỉ, loại môn, tiên quyết chính xác
>
> Admin là người được tin tưởng để giữ dữ liệu gốc sạch. Giống như DBAdmin của một tổ chức.

**Data từ Catalog môn học (admin import) giúp hệ thống làm được gì?**
> Catalog là nền tảng của mọi thứ. Không có catalog thì:
> - Không biết môn X có bao nhiêu tín chỉ → không tính được GPA
> - Không biết môn X có thành phần nào (QT 40% + CK 60%) → không tính được điểm cần
> - Không biết môn nào là tiên quyết của môn nào → không hiện được lộ trình đúng
> - Không phân được loại môn → không đếm được tín chỉ đại cương vs chuyên ngành
>
> Cụ thể catalog cung cấp: `course_id`, `name`, `credits`, `course_type`, `components[]` (tên + weight), `prerequisites[]`.

**Data từ CTĐT (admin import) giúp hệ thống làm được gì?**
> CTĐT là "lộ trình học của ngành X khoá Y". Không có CTĐT thì:
> - Không biết sinh viên ngành CNTT K22 cần học những môn nào → roadmap trống
> - Không gợi ý được môn học kỳ tới (vì gợi ý phải lọc theo CTĐT của ngành)
> - Không kiểm tra được điều kiện tốt nghiệp (cần bao nhiêu TC, bao nhiêu đại cương...)
> - Không nhóm được môn tự chọn theo elective group
>
> CTĐT lưu vào 3 bảng: `curricula` (thông tin chung), `curriculum_courses` (danh sách môn + HK gợi ý + loại yêu cầu), `graduation_requirements` (điều kiện tốt nghiệp).
>
> **Liên kết với user:** khi sinh viên hoàn thành onboarding → hệ thống set `curriculum_id = "CNTT-K22"` vào profile → từ đó tất cả tính năng roadmap đều dùng CTĐT đúng của họ.

---

## 15. Chiến lược modify on-the-spot

### Nguyên tắc: logic ở lib, UI ở components

```
Thầy muốn đổi quy tắc/ngưỡng nghiệp vụ → src/lib/
Thầy muốn thêm/đổi giao diện            → src/components/features/ hoặc panels/
Thầy muốn đổi DB operation              → src/lib/supabase/
Thầy muốn đổi validation                → src/lib/validation-utils.ts
```

### Bảng modify nhanh

| Yêu cầu | File | Ghi chú |
|---|---|---|
| Ngưỡng rủi ro (8.5 → 9.0) | `app-shell-layout.tsx:65` | Logic riskyCount |
| Ngưỡng tổng kết nguy hiểm (5.5 → 6.0) | `app-shell-layout.tsx:67` | Cùng chỗ |
| GPA tốt nghiệp tối thiểu | `curriculum-api.ts:183` | `threshold_value: 2.0` |
| TOEIC tối thiểu 450 → 500 | `curriculum-api.ts:182` | `threshold_value: 450` |
| Thêm loại tài liệu mới | `database.ts` → `ResourceType` | Thêm vào union type |
| Giới hạn file upload 50MB → 100MB | `validation-utils.ts` | `MAX_RESOURCE_FILE_BYTES` |
| Email domain được đăng ký | `validation-utils.ts` | `ALLOWED_EMAIL_DOMAIN` |
| MSSV phải 8 chữ số → 9 chữ số | `validation-utils.ts` | `validateStudentId()` regex |
| Ngưỡng xếp loại Giỏi 3.2 → 3.5 | `gpa-panel.tsx` | `gpa4 >= 3.2` |
| Thêm ngành mới vào onboarding | `onboarding-wizard.tsx` | mảng `MAJORS` |
| Ngành học 3.5 năm | `validation-utils.ts` | `inferGraduationYear()` |
| Thêm bước onboarding | `onboarding-wizard.tsx` | tăng `TOTAL_STEPS` |

### Cách dùng AI đúng lúc vấn đáp

**Không nên:** "Thầy bảo sửa X, tao paste vào AI, copy code ra, không biết gì."

**Nên:**
1. Xác định file + logic cần sửa (từ bảng trên)
2. Đọc đoạn code đó — hiểu ý nghĩa nghiệp vụ của nó
3. Nếu chưa chắc: hỏi AI "File X, hàm Y. Tôi muốn thay đổi ngưỡng từ A sang B — có ảnh hưởng gì khác không?"
4. Giải thích cho thầy nghe logic trước khi sửa
5. Sửa code → confirm

Thầy cần nghe bạn **hiểu tại sao sửa chỗ đó**, không chỉ cần thấy code chạy được.

---

## 16. Files PHẢI đọc trước vấn đáp

```
Nhóm 1 — Hiểu toàn hệ thống:
  src/types/database.ts                   ← data model: mọi entity là gì
  src/contexts/app-context.tsx            ← state toàn cục: app biết gì
  src/app/(app)/app-shell-layout.tsx      ← orchestration: ai tính cái gì

Nhóm 2 — Logic nghiệp vụ cốt lõi:
  src/hooks/use-courses.ts                ← GPA, tín chỉ, optimistic update
  src/lib/gpa-forecast-utils.ts           ← forecast, water-fill, rủi ro
  src/lib/supabase/courses-api.ts         ← CRUD + upsert môn học
  src/lib/parsers/uit-transcript-parser.ts← parse HTML bảng điểm UIT

Nhóm 3 — Feature-specific:
  src/lib/supabase/curriculum-api.ts      ← import CTĐT
  src/lib/supabase/exam-api.ts            ← lịch thi
  src/lib/supabase/resources-api.ts       ← tài liệu
  src/lib/course-utils.ts                 ← gợi ý môn, lộ trình

Nhóm 4 — Auth + Validation:
  src/app/(app)/layout.tsx                ← gate bảo vệ trang
  src/lib/validation-utils.ts            ← rule MSSV, điểm, file
  src/lib/role-utils.ts                  ← phân quyền admin
```
