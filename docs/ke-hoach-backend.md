# Kế hoạch chuẩn bị triển khai backend — AI Lành Nghề

Trạng thái: **bản nháp để thảo luận** · 24/09/2026

Tài liệu này dựa trên site tĩnh hiện có: trang nào đang giả lập dữ liệu, trang nào
cần backend thật, và thứ tự làm để có thể bán được gói đầu tiên (Mua hàng).

---

## 1. Hiện trạng

| Phần | Đang có | Còn giả lập |
|---|---|---|
| Bảng giá, giỏ hàng | `tinh-tien.js` (Pha 1) và `gio-hang.js` (Pha 2) tính đúng giá, có kiểm thử Node | Giỏ lưu `localStorage`, chưa có đơn hàng thật |
| Thanh toán (`thanh-toan.html`) | Giao diện 3 bước: gói → thông tin hoá đơn → VNPay / MoMo / chuyển khoản | Không tạo đơn, không gọi cổng thanh toán, không xuất hoá đơn |
| Đăng nhập | Nút “Đăng nhập” dẫn thẳng vào bảng điều khiển demo | Chưa có tài khoản |
| Bảng điều khiển (`bang-dieu-khien.html`) | 5 màn hình: Tổng quan, Theo nhân sự, Đo trước–sau, Kiểm duyệt, Tuân thủ dữ liệu | Toàn bộ số liệu là hằng `STAFF`, `QUEUE` trong `site.js` và số viết cứng trong HTML |
| Gói nghề, tình huống | `assets/data/nghe.json` (31 gói, 155 tình huống) | Nội dung gói trả phí (20–30 tình huống, biểu mẫu, checklist) chưa có nơi phát hành có kiểm soát quyền |
| Đăng ký nhận thông báo | Google Form | Chấp nhận được, chưa cần chuyển |
| Bàn thử việc | Kết quả soạn sẵn, không gọi AI | Giữ nguyên là mockup, không thuộc phạm vi backend |

### Ràng buộc sản phẩm đã công bố (không được phá)

Trang `an-toan.html` hứa với khách:

> Gói nghề chạy trên tài khoản AI của chính bạn. Chúng tôi không đặt máy chủ trung gian,
> không kết nối trực tiếp vào ERP, email hay ổ đĩa nội bộ.

Hệ quả cho backend:

1. **Backend không được proxy lời gọi AI** và không nhận nội dung công việc của khách.
2. Số liệu trên bảng điều khiển (đầu việc, giờ tiết kiệm, lần từ chối dữ liệu cấm) phải đến
   từ **khai báo của người dùng** hoặc **sự kiện chỉ chứa siêu dữ liệu** (loại việc, thời điểm,
   nhóm dữ liệu bị phát hiện) — không chứa văn bản gốc.
3. Hàng chờ Kiểm duyệt hiện hiển thị cả tóm tắt đầu ra AI. Cần quyết định (xem mục 8) là lưu
   tóm tắt do người dùng tự nhập, hay chỉ lưu tiêu đề + kết quả checklist.

---

## 2. Phạm vi theo giai đoạn

### Giai đoạn 0 — Chuẩn bị (1–2 tuần)
Chốt các quyết định ở mục 8, dựng hạ tầng trống, CI, môi trường staging.

### Giai đoạn 1 — Bán được hàng (MVP, ~4–6 tuần)
- Tài khoản: đăng ký / đăng nhập, tổ chức doanh nghiệp, mời thành viên.
- Đơn hàng: nhận giỏ từ trình duyệt, **tính lại giá trên server** bằng chính `tinh-tien.js`,
  lưu đơn bất biến kèm `bangGiaPhienBan`.
- Thanh toán: chuyển khoản ngân hàng (đối soát thủ công bởi admin) trước, VNPay sau.
- Subscription, nhóm seat, gán người dùng vào seat (`ganNguoiDung`).
- Phát hành nội dung gói nghề cho người có seat hợp lệ.
- Trang quản trị nội bộ tối thiểu: xem đơn, xác nhận đã nhận tiền, kích hoạt subscription.

### Giai đoạn 2 — Bảng điều khiển thật (~4 tuần)
- Sự kiện sử dụng (siêu dữ liệu) + khai báo giờ tiết kiệm có quản lý xác nhận.
- Màn hình Tổng quan, Theo nhân sự (cảnh báo 14 ngày), Đo trước–sau.
- Hàng chờ Kiểm duyệt và nhật ký người duyệt.
- Nhật ký Tuân thủ dữ liệu, xuất CSV/PDF, lưu 24 tháng.

### Giai đoạn 3 — Vòng đời hợp đồng
- Mua thêm giữa kỳ (`muaThem`), báo giá gia hạn (`baoGiaGiaHan`), thay đổi kỳ sau (`dangKyKySau`).
- Nhắc gia hạn qua email, MoMo, hoá đơn điện tử tự động.
- Đặt lịch kèm cặp 45 phút (dịch vụ Tinh chỉnh).

---

## 3. Kiến trúc đề xuất

```
Trình duyệt (site tĩnh hiện tại)
      │  fetch + cookie phiên (SameSite=Lax)
      ▼
api.<tên-miền>  ── Node.js (TypeScript) ── PostgreSQL
      │                  │
      │                  ├─ tinh-tien.js (dùng chung với frontend)
      │                  ├─ hàng đợi việc nền (email, đối soát, xuất PDF)
      │                  └─ lưu trữ tệp (PDF báo cáo, hoá đơn, nội dung gói)
      ▼
VNPay · MoMo · nhà cung cấp hoá đơn điện tử · dịch vụ gửi email
```

| Hạng mục | Đề xuất | Lý do |
|---|---|---|
| Ngôn ngữ | Node.js 20+ / TypeScript | `tinh-tien.js` đã chạy được trong Node; server dùng **đúng tệp đó** để tính lại giá, không viết lại logic ở ngôn ngữ khác |
| Framework | Fastify (hoặc Hono) | Nhẹ, có validate schema JSON sẵn |
| CSDL | PostgreSQL | Đơn hàng, subscription, sự kiện đều là dữ liệu quan hệ; `jsonb` cho `buoc[]`, `giam[]` của dòng đơn |
| Truy vấn / migration | Drizzle hoặc Kysely + migration SQL | Giữ SQL tường minh, dễ review |
| Việc nền | pg-boss (hàng đợi trên chính Postgres) | Không cần thêm Redis ở giai đoạn đầu |
| Xác thực | Phiên cookie httpOnly; đăng nhập bằng link email (magic link), thêm Google sau | Khách doanh nghiệp VN quen email công ty; không phải quản lý mật khẩu |
| PDF | Render HTML → PDF bằng Chromium headless | Tái dùng CSS của site |

### Tên miền — cần làm trước khi có đăng nhập

Site đang ở `annguyen30112301.github.io`. Cookie phiên từ một API khác miền sẽ bị trình duyệt
chặn (cookie bên thứ ba). Cần **tên miền riêng**, ví dụ `ailanhnghe.vn` cho site và
`api.ailanhnghe.vn` cho backend — cùng site nên cookie `SameSite=Lax` hoạt động. GitHub Pages
vẫn phục vụ được site tĩnh qua custom domain.

---

## 4. Mô hình dữ liệu (bản phác)

Tên bảng tiếng Anh, tên trường nghiệp vụ bám theo `tinh-tien.js` để dễ đối chiếu.

**Danh mục**
- `bang_gia_phien_ban` — `phien_ban` (vd `2026-09-16`), `cau_hinh jsonb` (bản sao `CAU_HINH`), `hieu_luc_tu`.
- `nghe` — `id` (`mua-hang`…), `ten`, `dang_ban`, `noi_dung_phien_ban`.

**Khách hàng**
- `users` — email, họ tên, trạng thái.
- `organizations` — tên doanh nghiệp, mã số thuế, email nhận hoá đơn, người ký duyệt.
- `memberships` — user × organization × vai trò (`owner`, `admin`, `reviewer`, `member`).

**Bán hàng**
- `subscriptions` — `loai_khach` (`CA_NHAN` / `DOANH_NGHIEP`), chủ sở hữu (user hoặc org),
  `ky_bat_dau`, `ky_het_han`, `bang_gia_phien_ban`, trạng thái (`cho_thanh_toan`, `hoat_dong`, `het_han`).
- `seat_groups` — `ma`, `ten`, `seat`, thuộc subscription.
- `seat_group_nghe` — `nghe_id`, `thu_tu`, `tu_ngay`.
- `seats` — `ma` (`S001`…), `ma_nhom`.
- `seat_assignments` — seat × user, `tu_ngay`, `den_ngay` (từ `lichSuGan`).
- `pending_changes` — `thayDoiKySau` (GIAM_SEAT, BO_NGHE, DOI_NGHE, DOI_NGHE_CHINH).
- `orders` — `loai_don` (`MUA_MOI`, `MUA_THEM`, `GIA_HAN`), `ket_qua jsonb` (nguyên đối tượng `don`
  do bộ tính tiền trả về), tổng tiền, trạng thái. **Không sửa sau khi tạo** (nguyên tắc “không hồi tố”).
- `payments` — cổng, mã giao dịch, số tiền, trạng thái, payload callback thô.
- `invoices` — số hoá đơn, mã tra cứu, tệp PDF/XML, trạng thái phát hành.

**Sử dụng & bảng điều khiển**
- `usage_events` — user, nghề, mã tình huống, loại sự kiện, thời điểm. Không có nội dung.
- `time_reports` — số phút trước/sau do người dùng khai, người xác nhận, thời điểm xác nhận.
- `review_items` — tiêu đề, loại đầu việc, người tạo, công cụ AI, trạng thái, checklist đã tick.
- `review_log` — ai duyệt / yêu cầu sửa, lý do.
- `compliance_events` — nhóm dữ liệu bị phát hiện (CCCD, tài khoản ngân hàng…), công cụ, hành động. Giữ 24 tháng.
- `audit_log` — mọi thao tác quản trị (xác nhận tiền, đổi seat, xuất dữ liệu).

Tiền lưu bằng `bigint` (đồng), khớp với BigInt trong bộ tính tiền.

---

## 5. API (bản phác)

```
POST /auth/magic-link            gửi link đăng nhập
GET  /auth/callback              đổi token lấy phiên
POST /auth/logout
GET  /me                         người dùng + các tổ chức + seat đang giữ

POST /quote                      giỏ → báo giá (server tính lại, không lưu)
POST /orders                     giỏ → đơn MUA_MOI (tính lại, so với số khách thấy, lệch thì từ chối)
GET  /orders/:id
POST /orders/:id/pay             chọn cổng → URL thanh toán / thông tin chuyển khoản
POST /webhooks/vnpay             IPN, kiểm chữ ký, idempotent
POST /webhooks/momo

GET  /subscriptions/:id
POST /subscriptions/:id/seats/:ma/assign
POST /subscriptions/:id/purchase-more     (Giai đoạn 3)
GET  /subscriptions/:id/renewal-quote     (Giai đoạn 3)
POST /subscriptions/:id/next-term-changes (Giai đoạn 3)

GET  /content/nghe/:id           nội dung gói, chỉ khi có seat hợp lệ

POST /usage-events
POST /time-reports     · POST /time-reports/:id/confirm
GET  /review-items     · POST /review-items/:id/approve | /request-changes
POST /compliance-events
GET  /dashboard/:orgId/overview | /staff | /before-after | /compliance
GET  /dashboard/:orgId/export.(csv|pdf)

/admin/*                         xác nhận chuyển khoản, kích hoạt, xem đơn
```

Lỗi trả mã nghiệp vụ có sẵn của bộ tính tiền (`CHUA_CO_GIA`, `NGOAI_KY`, `SEAT_KHONG_HOP_LE`…)
để giao diện hiện đúng thông báo.

---

## 6. Việc cần làm ở frontend để nối backend

1. Tách `tinh-tien.js` thành gói dùng chung (thư mục `shared/` hoặc package nội bộ) mà server
   `require` được; giữ nguyên bản UMD cho trình duyệt.
2. `gio-hang.js`: “Tiếp tục thanh toán” gọi `POST /orders` thay vì chỉ chuyển trang.
3. `thanh-toan.html`: thay bản 3 bước cũ bằng luồng 5 bước (Pha 3 đã ghi trong README), đọc đơn
   từ API.
4. Nút “Đăng nhập” trên menu: trang đăng nhập thật; khi đã đăng nhập hiện tên và menu tài khoản.
5. `site.js`: thay hằng `STAFF`, `QUEUE` và số viết cứng của `bang-dieu-khien.html` bằng dữ liệu
   từ `/dashboard/*`; giữ bản demo hiện tại ở một đường dẫn riêng (ví dụ `?demo=1`) cho người xem thử.
6. Thêm một tệp cấu hình `API_BASE` để trỏ staging / production.

---

## 7. Vận hành, bảo mật, tuân thủ

- **Môi trường**: local (Docker Compose: Postgres + API), staging, production. CI chạy
  `node --test tests/*.test.js` + kiểm thử API + migration trên CSDL trống.
- **Bí mật**: khoá VNPay / MoMo / email / hoá đơn điện tử để trong kho bí mật của nền tảng host,
  không commit.
- **Thanh toán**: webhook kiểm chữ ký, xử lý idempotent theo mã giao dịch, số tiền đối chiếu với
  đơn trên server; không kích hoạt subscription dựa trên redirect của trình duyệt.
- **Dữ liệu cá nhân**: site đã viện dẫn Luật 91/2025/QH15. Cần người có chuyên môn pháp lý xác nhận
  yêu cầu về nơi lưu trữ, thông báo sự cố 72 giờ, quyền truy cập / xoá dữ liệu của chủ thể, và thời
  hạn lưu 24 tháng của nhật ký tuân thủ trước khi chọn vùng hạ tầng.
- **Phân quyền**: người dùng thường chỉ thấy số liệu của chính mình; quản lý / reviewer thấy nhóm
  của mình; owner thấy toàn tổ chức. Kiểm tra quyền ở tầng truy vấn, không chỉ ở giao diện.
- **Sao lưu**: backup Postgres hằng ngày, thử khôi phục ít nhất một lần trước khi mở bán.
- **Giám sát**: log có cấu trúc, cảnh báo khi webhook thanh toán lỗi hoặc hàng đợi việc nền tắc.

---

## 8. Quyết định cần chốt trước khi viết code

| # | Câu hỏi | Ảnh hưởng | Đề xuất ban đầu |
|---|---|---|---|
| 1 | Số liệu sử dụng lấy từ đâu khi không có máy chủ trung gian? | Toàn bộ Giai đoạn 2 | MVP: người dùng tự khai trên web (đầu việc, giờ, lần bị từ chối). Sau đó cân nhắc tiện ích trình duyệt chỉ gửi siêu dữ liệu |
| 2 | Hàng chờ Kiểm duyệt lưu gì? | Rủi ro dữ liệu, mô hình `review_items` | Chỉ tiêu đề + checklist + tóm tắt ngắn người dùng tự viết; không lưu đầu ra AI |
| 3 | Nội dung gói nghề phát hành dạng gì (tệp tải về, trang web, Project/GPT dựng sẵn)? | API `/content`, lưu trữ tệp | Cần nhóm nội dung trả lời |
| 4 | Thuế GTGT và nhà cung cấp hoá đơn điện tử | Bảng `invoices`, tổng tiền | README đã ghi “chưa chốt, cần kế toán” |
| 5 | Giá Giảng dạy | Chưa bán được Giảng dạy (`CHUA_CO_GIA`) | Chốt trước Giai đoạn 1 nếu muốn mở bán cùng Mua hàng |
| 6 | Tên miền và nơi đặt hạ tầng (trong nước / khu vực) | Cookie đăng nhập, tuân thủ | Mua tên miền `.vn` sớm; vùng hạ tầng chờ ý kiến pháp lý (mục 7) |
| 7 | Gói Gia nhập 0 đ có đi qua luồng thanh toán không? | Luồng đơn hàng | Có — tạo đơn 0 đ để dùng chung logic subscription, bỏ bước cổng thanh toán |
| 8 | Ai vận hành trang quản trị, đối soát chuyển khoản | Phạm vi `/admin` | Một người vận hành nội bộ, thao tác thủ công ở Giai đoạn 1 |

---

## 9. Danh sách việc Giai đoạn 0

- [ ] Chốt các quyết định 1, 2, 3, 6, 7 ở mục 8.
- [ ] Mua tên miền, trỏ site tĩnh sang custom domain.
- [ ] Tạo thư mục `server/` (hoặc repo riêng) với Fastify + TypeScript + Drizzle, Docker Compose cho Postgres.
- [ ] Đưa `tinh-tien.js` vào chỗ dùng chung; thêm kiểm thử chứng minh server và trình duyệt ra cùng kết quả.
- [ ] Migration đầu tiên: users, organizations, memberships, bang_gia_phien_ban, nghe.
- [ ] Đăng nhập bằng link email chạy trên staging.
- [ ] CI: kiểm thử bộ tính tiền + kiểm thử API + migration.
- [ ] Đăng ký tài khoản sandbox VNPay; chuẩn bị thông tin tài khoản nhận chuyển khoản.
