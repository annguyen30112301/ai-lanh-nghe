# Kế hoạch chuẩn bị triển khai backend — AI Lành Nghề

Trạng thái: **bản 2 — đã áp các quyết định ngày 25/09/2026** · baseline kiến trúc là tài liệu
*03 · Cấu trúc hệ thống — bản chốt* (Skill-as-a-Service: Web App, License Server, Skill Engine,
Connector, Analytics, Dashboard). Phần giá lấy **repo làm chuẩn** (`assets/js/tinh-tien.js`).

---

## 1. Quyết định đã chốt

| # | Quyết định | Hệ quả cho backend |
|---|---|---|
| Q1 | Connector **chỉ trả** hướng dẫn, mẫu biểu, quy tắc cho AI; **không bao giờ nhận nội dung công việc** của khách | Mọi tool của Connector có tham số đầu vào là mã (nghề, tình huống, bước), không có trường văn bản tự do chứa dữ liệu khách. Lời hứa “không máy chủ trung gian” trên `an-toan.html` giữ nguyên |
| Q2 | Không tuyên bố “không sao chép được”; nói là **hạn chế và truy vết** | Nội dung trả về theo từng tình huống, có dấu vết theo người dùng (mục 6) |
| Q3 | Tìm thêm kênh ngoài Connector | Chọn **Connector (MCP) + tiện ích trình duyệt**, xem mục 3 |
| Q4 | Thời gian **sau** khi dùng phải do nền tảng đo; tự khai chỉ dùng cho **mốc ban đầu** | Có “phiên việc” đo giờ thật, xem mục 5 |
| Q5 | Xác thực ở **đăng nhập Web App** và ở **bước kết nối Connector** | OAuth 2.1 + OTP khi thiết bị mới, xem mục 4 |
| Q6 | OTP ưu tiên **Zalo** | Zalo ZNS, SMS dự phòng |
| Q7 | Pilot **cả cá nhân và doanh nghiệp** | Tổ chức + seat nằm trong Giai đoạn 1 |
| Q8 | Hết hạn: không kết nối được Connector nữa; phải xử lý trường hợp skill bị nạp sẵn vào môi trường người dùng | Skill phục vụ theo yêu cầu, không giao trọn gói, xem mục 6 |
| Q9–15 | **Repo đúng**: giá theo `tinh-tien.js` (ưu đãi quy mô, mở rộng nghề, Tinh chỉnh trả một lần), Mua hàng + Giảng dạy đang mở, Cổng 3 = giảm ≥ 40% trên 2/3 đầu việc | Tài liệu 02 cần sửa theo repo. `thanh-toan.html` (còn giá cũ 37,6 triệu) sẽ làm lại ở Pha 3 |

---

## 2. Kiến trúc

```
                 ┌──────────────── Web App (site hiện tại + trang tài khoản, dashboard) ───────────────┐
                 │                                                                                    │
 Người dùng ─────┤  Tiện ích trình duyệt  ── chèn skill, đo phiên việc, kiểm dữ liệu cấm ngay trên máy  │
                 │                                                                                    │
                 │  ChatGPT / Claude / Gemini / Copilot  ── gọi ──►  Connector (remote MCP)            │
                 └────────────────────────────────────────────────────────────────────────────────────┘
                                         │  chỉ mã + siêu dữ liệu, không nội dung khách
                                         ▼
                        API AI Lành Nghề (Node.js/TypeScript, Fastify)
                         ├─ Auth + OTP (Zalo ZNS / SMS)
                         ├─ License Server (user, org, seat, entitlement, thiết bị, grant)
                         ├─ Skill Engine (nội dung skill có phiên bản, phục vụ theo tình huống)
                         ├─ Billing (tinh-tien.js dùng chung, VNPay, chuyển khoản)
                         └─ Analytics (sự kiện → chỉ số dashboard, báo cáo PDF)
                                         │
                                    PostgreSQL
```

Lựa chọn công nghệ giữ như bản 1: Node.js/TypeScript (để server chạy đúng `tinh-tien.js`),
Fastify, PostgreSQL, Drizzle/Kysely, pg-boss cho việc nền. Cần **tên miền riêng** trước khi làm
đăng nhập (cookie và trang OAuth của Connector đều cần một miền ổn định).

---

## 3. Kênh đưa skill tới người dùng (Q3)

| Kênh | Nền tảng / gói | Kiểm soát quyền | Đo được gì | Rủi ro |
|---|---|---|---|---|
| **A. Connector remote MCP** | Claude: có cả gói Free (Free giới hạn 1 connector). ChatGPT: custom connector cần Plus/Pro/Business trở lên (Developer Mode); gói Free chỉ dùng được app đã duyệt trong thư mục Plugin của OpenAI. Gemini: chỉ trong Spark hoặc Gemini Enterprise. Copilot: qua agent Microsoft 365, cần tenant bật | OAuth theo từng người, kiểm entitlement **mỗi lần gọi** | Lần gọi tool: tình huống nào, bước nào, lúc nào | AI có thể không gọi tool; lời gọi đi từ máy chủ nền tảng nên không biết thiết bị |
| **B. Tiện ích trình duyệt** (Chrome/Edge) | Mọi nền tảng bản web, **kể cả gói miễn phí** | Đăng nhập tiện ích bằng OAuth + OTP, giới hạn số thiết bị | **Đo phiên việc thật** (bắt đầu, kết thúc, thời gian thao tác); kiểm dữ liệu cấm (CCCD, số tài khoản…) **ngay trên máy**, chỉ gửi loại dữ liệu bị phát hiện | Giao diện nền tảng đổi thì phải sửa; không chạy trên app điện thoại/desktop; doanh nghiệp phải cho phép cài tiện ích |
| C. GPT / Project / Gem dựng sẵn, không connector | Mọi gói | Không có | Không có | Sao chép được toàn bộ; chỉ dùng cho gói Gia nhập 0 đ |
| D. Add-in Office / agent Copilot | Doanh nghiệp dùng Microsoft 365 | Theo tenant | Theo lời gọi | Chu kỳ duyệt dài; để Giai đoạn 3 |

**Đề xuất:** Giai đoạn 1 làm **A trên một nền tảng** + **B**.
- Connector là kênh chính thức cho skill và kiểm quyền.
- Tiện ích là nơi **đo thời gian** (Q4) và **kiểm dữ liệu cấm tại chỗ**, đúng luồng 7 bước đang vẽ
  trên `an-toan.html`. Nó cũng phủ được khách dùng Gemini/ChatGPT miễn phí.
- Nền tảng cho Connector đầu tiên: chọn theo khảo sát khách pilot. Claude cho phép gói Free dùng
  custom connector nên dễ pilot nhất. ChatGPT phổ biến hơn nhưng gói Free phải chờ OpenAI duyệt
  vào thư mục Plugin.
- Chính sách quyền riêng tư của tiện ích phải nói rõ: đọc nội dung trang **chỉ để xử lý tại máy**,
  không gửi đi (yêu cầu “limited use” của Chrome Web Store).

> Khả năng connector của từng nền tảng thay đổi theo tháng. Kiểm tra lại ngay trước khi code Giai đoạn 1.

---

## 4. Xác thực và chống chia sẻ (Q5, Q6)

Chỉ có **ba điểm** để xác thực: đăng nhập Web App, đăng nhập tiện ích, và bước cấp quyền (OAuth)
khi người dùng kết nối Connector trong ChatGPT/Claude. Sau đó, mỗi lời gọi Connector mang token và
License Server kiểm entitlement.

```
Đăng nhập (Web App / tiện ích / OAuth của Connector)
  → email + mật khẩu hoặc link email
  → thiết bị hoặc grant mới? ── có → OTP Zalo ZNS (SMS dự phòng) tới số của chủ license
  → cấp token: access 1 giờ, refresh xoay vòng, gắn user + seat + grant
Mỗi lời gọi Connector → kiểm token, seat còn hiệu lực, license chưa hết hạn, nghề trong entitlement
```

| Quy tắc | Personal | Business |
|---|---|---|
| Số thiết bị tin cậy (Web App + tiện ích) | 2 | Theo chính sách tổ chức, mặc định 3 / người |
| Số grant Connector đang hoạt động | 2 (ví dụ Claude + ChatGPT) | 2 / người |
| Thêm thiết bị / grant mới | OTP tới số chủ license | OTP tới số của chính người giữ seat |
| Đổi người giữ seat | — | Thu hồi toàn bộ token và grant của người cũ ngay lập tức |
| Dấu hiệu bất thường (nhiều grant bị thu hồi rồi tạo lại, lượng gọi vượt ngưỡng) | Xác thực lại → giới hạn → tạm khoá | Báo admin tổ chức |

- Không khoá theo IP (lời gọi Connector đều đến từ máy chủ nền tảng AI).
- Không chặn được việc khách chia sẻ cả tài khoản ChatGPT/Claude. Chấp nhận điều này.
- **Zalo ZNS**: cần Zalo OA đã xác thực doanh nghiệp, mẫu tin OTP được duyệt, trả phí theo tin.
  SMS brandname làm dự phòng (cũng cần đăng ký mẫu). Đăng ký cả hai **từ Giai đoạn 0** vì thời gian
  duyệt tính bằng tuần. Không dùng email làm kênh OTP chính vì mất tác dụng chống chia sẻ.
- Số điện thoại là dữ liệu cá nhân: nêu mục đích trong chính sách, không dùng cho marketing nếu
  khách chưa đồng ý.

---

## 5. Đo thời gian do nền tảng đo (Q4)

### Mốc ban đầu (trước khi dùng)
Mỗi nghề có **3 đầu việc chuẩn** (Mua hàng: so sánh báo giá, thư đàm phán, báo cáo tuần). Có hai
cách ghi mốc, nguồn được lưu kèm:
1. **Tự khai** có quản lý xác nhận (chấp nhận được cho dữ liệu ban đầu).
2. **Bấm giờ một lần không dùng AI** bằng chế độ đo của tiện ích hoặc trang `do-gio.html`. Mốc này
   tin cậy hơn; nên khuyến khích trong pilot.

### Sau khi dùng: phiên việc đo tự động
Một **phiên việc** = một lần làm một tình huống, từ lúc bắt đầu tới lúc người dùng xác nhận kết quả.

| Mốc | Nguồn đo |
|---|---|
| Bắt đầu | Tiện ích: người dùng chọn tình huống / skill được chèn. Connector: lời gọi `bat_dau_tinh_huong` |
| Các bước | Lời gọi `lay_buoc` của Connector; tiện ích ghi thời điểm |
| Kết thúc | Người dùng tick đủ checklist và bấm “Dùng kết quả này” (trong tiện ích hoặc trang Kiểm duyệt). Connector: lời gọi `ghi_nhan_ket_qua` |
| Thời gian thao tác | Tiện ích trừ khoảng tab không được mở/không có thao tác quá 5 phút |

- Phiên chỉ có Connector (không có tiện ích) tính **thời gian trôi qua**, gắn nhãn độ tin cậy thấp hơn.
- Chỉ **phiên hoàn tất** mới vào báo cáo. Loại phiên dưới 1 phút hoặc trên 8 giờ.

### Báo cáo
- Mỗi đầu việc chuẩn: **trung vị** thời gian sau so với mốc ban đầu, số phiên (n), số người.
- Tỷ lệ người đạt ngưỡng Cổng 3 (giảm ≥ 40% trên ít nhất 2/3 đầu việc, theo repo).
- Ghi rõ **phương pháp đo và nguồn mốc** (tự khai hay bấm giờ) ngay trên báo cáo và PDF xuất ra.
- Chưa đủ số phiên tối thiểu (ví dụ 5 phiên/đầu việc/người) thì hiện “chưa đủ dữ liệu”, không suy ra số.
- Giờ tiết kiệm = (mốc − trung vị sau) × số phiên hoàn tất. Ghi là **“ước tính từ thời gian đo”**.

Giới hạn cần nói với khách: nền tảng chỉ đo phần việc làm trong phiên. Thời gian gom dữ liệu hoặc
làm việc ngoài trình duyệt không được đo.

---

## 6. Phục vụ skill và hết hạn license (Q8)

Vấn đề: nếu skill được **nạp nguyên bộ** vào môi trường AI của khách (tệp trong Project, GPT, Gem)
thì khách giữ được mãi sau khi hết hạn và chia sẻ dễ dàng. Khi đó, việc “ngắt Connector” không còn
nhiều ý nghĩa.

**Đề xuất: tách skill thành hai lớp.**

| Lớp | Nội dung | Cách giao | Sau khi hết hạn |
|---|---|---|---|
| **Vỏ** (cài vào nền tảng) | Vài đoạn hướng dẫn ngắn: “Khi người dùng làm việc thuộc nghề X, gọi Connector để lấy quy trình của tình huống tương ứng.” Không chứa quy trình, quy tắc, mẫu biểu | Mô tả tool của Connector / tiện ích tự chèn | Còn nguyên nhưng vô dụng khi đứng một mình |
| **Lõi** (Skill Engine) | Quy trình từng bước, quy tắc nghiệp vụ, checklist, mẫu đầu ra, danh mục dữ liệu cấm | Trả **theo từng tình huống, từng bước**, đúng lúc AI cần | Connector trả thông báo hết hạn kèm link gia hạn; không trả lõi |

Biện pháp đi kèm:
- **Dấu vết theo người dùng**: mỗi bản trả về có biến thể nhỏ về câu chữ hoặc mã ẩn theo user. Nếu
  bộ skill bị lộ ra ngoài thì truy được nguồn.
- **Giới hạn tốc độ**: một người lấy nhiều tình huống khác nhau trong thời gian ngắn (dấu hiệu cào
  dữ liệu) thì hạn chế và cảnh báo.
- **Cập nhật thường xuyên** (Continuous Skill Upgrade): bản bị sao chép sẽ nhanh cũ. Đây là rào cản
  thật sự, mạnh hơn mọi cơ chế khoá.

**Khách giữ được gì sau khi hết hạn** (để khớp nguyên tắc “không khoá khách khỏi tài liệu cũ” của
tài liệu 02):
- Sổ tay PDF và biểu mẫu đã tải về, theo phiên bản tại thời điểm tải.
- Mọi kết quả đã làm ra.
- Xuất dữ liệu dashboard và báo cáo của mình (CSV/PDF) trong **90 ngày** sau hạn, sau đó xoá theo
  chính sách lưu trữ. Riêng nhật ký tuân thủ giữ đủ 24 tháng.
- **Doanh nghiệp dùng dịch vụ Tinh chỉnh**: quy tắc và mẫu do khách tự cung cấp là tài sản của khách,
  xuất trả được. Phần lõi chung của AI Lành Nghề thì không.
- Thời gian ân hạn 14 ngày: Connector vẫn chạy nhưng nhắc gia hạn ở mỗi phiên.

**Kênh C (GPT/Gem dựng sẵn, giao nguyên bộ)**: chỉ dùng cho **gói Gia nhập 0 đ** với 5 tình huống cố
định. Chấp nhận là sao chép được, vì đây vốn là nội dung mẫu để thu hút khách.

Tài liệu 02 cần sửa câu về gia hạn thành: *“Không thu hồi những gì đã giao (sổ tay, biểu mẫu, kết quả,
dữ liệu của khách); skill vận hành qua Connector, các bản cập nhật và dashboard dừng khi hết hạn.”*

---

## 7. Mô hình dữ liệu (bản phác)

**Danh mục & nội dung**
- `bang_gia_phien_ban` (bản sao `CAU_HINH` của `tinh-tien.js`), `nghe`.
- `skill_versions` — nghề, số phiên bản, ngày phát hành, ghi chú thay đổi.
- `skill_units` — phiên bản × tình huống × bước: nội dung lõi, checklist, mẫu đầu ra.
- `dau_viec_chuan` — 3 đầu việc chuẩn mỗi nghề, gắn tình huống.
- `ky_nang` + `tinh_huong_ky_nang` — danh mục kỹ năng cho Skill Map (chờ nhóm nội dung định nghĩa).

**Tài khoản & quyền**
- `users` (email, số điện thoại đã xác minh), `organizations`, `memberships` (owner, admin, reviewer, member).
- `devices` — thiết bị tin cậy của Web App và tiện ích.
- `oauth_clients`, `oauth_grants`, `tokens` — grant Connector theo nền tảng (claude, chatgpt…), thu hồi được.
- `otp_challenges` — kênh (zalo, sms), trạng thái, số lần thử.
- `entitlements` — suy ra từ subscription: user/seat × nghề × hạn dùng.

**Bán hàng** (giữ như bản 1, bám `tinh-tien.js`)
- `subscriptions`, `seat_groups`, `seat_group_nghe`, `seats`, `seat_assignments`, `pending_changes`.
- `orders` (bất biến, lưu nguyên đối tượng `don`), `payments`, `invoices`.

**Đo lường**
- `baselines` — user × đầu việc chuẩn × số phút × nguồn (`tu_khai`, `bam_gio`) × người xác nhận.
- `work_sessions` — user, tình huống, kênh (`connector`, `extension`), bắt đầu, kết thúc, phút thao tác, trạng thái, độ tin cậy.
- `usage_events` — sự kiện thô (grant, gọi tool, chọn tình huống…), không nội dung.
- `review_items`, `review_log` — tiêu đề, checklist, người duyệt; không lưu đầu ra AI.
- `compliance_events` — loại dữ liệu cấm bị phát hiện tại máy, kênh, hành động; giữ 24 tháng.
- `audit_log`.

---

## 8. API (bản phác)

```
# Web App & tiện ích
POST /auth/login · /auth/otp/verify · /auth/logout · GET /me
GET/DELETE /me/devices · GET/DELETE /me/grants
POST /quote · /orders · /orders/:id/pay · /webhooks/vnpay
GET  /subscriptions/:id · POST /subscriptions/:id/seats/:ma/assign
POST /orgs/:id/invites · DELETE /orgs/:id/members/:userId
POST /baselines · /baselines/:id/confirm
POST /sessions (bắt đầu) · PATCH /sessions/:id (bước, kết thúc) · POST /compliance-events
GET  /dashboard/me · /dashboard/org/:id/(overview|staff|before-after|review|compliance)
GET  /dashboard/org/:id/export.(csv|pdf)

# OAuth 2.1 cho Connector (authorization code + PKCE, dynamic client registration)
GET  /.well-known/oauth-authorization-server · /oauth/authorize · POST /oauth/token · /oauth/register

# Connector (remote MCP) — tham số chỉ là mã
tool danh_sach_tinh_huong(nghe)
tool bat_dau_tinh_huong(tinh_huong)          → quy trình tổng quát + mã phiên
tool lay_buoc(ma_phien, buoc)                → hướng dẫn + mẫu cho bước đó
tool lay_checklist(ma_phien)
tool ghi_nhan_ket_qua(ma_phien, checklist_da_tick[])
```

---

## 9. Giai đoạn

### Giai đoạn 0 — Chuẩn bị (2 tuần)
- [ ] Chọn nền tảng cho Connector đầu tiên (khảo sát 2 doanh nghiệp + nhóm cá nhân pilot đang dùng gói AI nào).
- [ ] Mua tên miền; trỏ site tĩnh sang.
- [ ] Đăng ký Zalo OA + mẫu ZNS OTP; SMS brandname dự phòng.
- [ ] Nhóm nội dung tách skill Mua hàng thành vỏ / lõi theo tình huống và bước (mục 6); định nghĩa 3 đầu việc chuẩn.
- [ ] Dựng `server/`: Fastify + TypeScript + Postgres (Docker Compose), CI chạy `node --test` + kiểm thử API.
- [ ] Đưa `tinh-tien.js` vào chỗ dùng chung; kiểm thử chứng minh server và trình duyệt ra cùng số.
- [ ] Sửa tài liệu 02 theo repo (mục 1, Q9–15) và câu về gia hạn (mục 6).

### Giai đoạn 1 — Pilot cá nhân + doanh nghiệp (6–8 tuần)
- Tài khoản, OTP Zalo, thiết bị tin cậy; tổ chức, mời thành viên, gán/đổi seat.
- Đơn hàng + thanh toán chuyển khoản (admin xác nhận), VNPay nếu kịp; đơn 0 đ cho Gia nhập.
- License Server + OAuth + Connector MCP cho **một nền tảng**, nghề Mua hàng.
- Tiện ích trình duyệt bản 1: đăng nhập, chọn tình huống, đo phiên việc, kiểm CCCD / số tài khoản tại máy.
- Mốc ban đầu (tự khai + bấm giờ), Personal Dashboard và các màn hình Business: Tổng quan, Theo nhân sự,
  Đo trước–sau. `bang-dieu-khien.html` đọc API, bản demo giữ ở `?demo=1`.
- Trang quản trị nội bộ tối thiểu.

### Giai đoạn 2 — Hoàn thiện Business
- Kiểm duyệt, nhật ký tuân thủ, xuất PDF/CSV, báo cáo quý.
- Skill Map (sau khi có danh mục kỹ năng), AI Skill Score (sau khi chốt công thức).
- Phát hiện bất thường cho chống chia sẻ.

### Giai đoạn 3 — Mở rộng
- Connector cho nền tảng thứ hai trở đi; agent Microsoft 365 Copilot.
- Mua thêm giữa kỳ, gia hạn, `dangKyKySau`; MoMo; hoá đơn điện tử tự động; luồng thanh toán 5 bước (Pha 3).

---

## 10. Còn mở

| Câu hỏi | Ai trả lời |
|---|---|
| Nền tảng Connector đầu tiên | Kết quả khảo sát pilot |
| Thuế GTGT, nhà cung cấp hoá đơn điện tử | Kế toán |
| Giá Giảng dạy (`CHUA_CO_GIA`) | Nhóm sản phẩm |
| Nơi đặt hạ tầng, nghĩa vụ theo Luật 91/2025/QH15 (cả với số điện thoại, dữ liệu phiên việc) | Tư vấn pháp lý |
| Danh mục kỹ năng từng nghề, công thức AI Skill Score | Nhóm nội dung |
| Doanh nghiệp pilot có cho cài tiện ích trình duyệt không | Khảo sát pilot |
