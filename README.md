# AI Lành Nghề — website

Website tĩnh dựng từ bản thiết kế *AI Lành Nghề · UI mockup 2.8* trên Claude Design.
Thuần HTML + CSS + JavaScript, không cần Node.js, không cần bước build.

Bản chạy thật: https://annguyen30112301.github.io/ai-lanh-nghe/

Site đang chặn công cụ tìm kiếm (`robots.txt` + thẻ meta `noindex` trên mọi trang).

## Chạy thử

Mở thẳng `index.html` bằng trình duyệt là xem được. Nếu muốn giống môi trường thật
(đường dẫn tuyệt đối, font, cache) thì chạy một server tĩnh:

```bash
python3 -m http.server 8000
```

Rồi mở http://localhost:8000

## Cấu trúc

```
index.html              Trang chủ
goi-nghe.html           Danh sách gói nghề
nghe-giang-day.html     Gói nghề Giảng dạy
nghe-mua-hang.html      Gói nghề Mua hàng
bang-gia.html           Bảng giá
thanh-toan.html         Thanh toán (4 bước trong cùng một trang)
do-gio.html             Công cụ tự đo giờ tiết kiệm
an-toan.html            An toàn dữ liệu & tuân thủ
tai-nguyen.html         Hướng dẫn, checklist, sổ tay
bang-dieu-khien.html    Bảng điều khiển doanh nghiệp (5 màn hình)

assets/css/fonts.css    @font-face cho Be Vietnam Pro
assets/css/tokens.css   Biến thiết kế (màu, khoảng cách, bo góc, đổ bóng) + lớp
                        thành phần: .btn, .card, .tag, .table, .input…
assets/css/site.css     Ghi đè cấp trang, bố cục khung, responsive, lớp tiện ích
assets/js/site.js       Toàn bộ tương tác
assets/fonts/           Be Vietnam Pro (.woff2)
assets/img/             Ảnh và logo
```

## Tương tác trong `assets/js/site.js`

| Phần | Mô tả |
|---|---|
| `[data-go]` | Nút không phải thẻ `<a>` nhưng cần điều hướng sang trang khác |
| `[data-carousel]` | Băng chuyền gói nghề và tình huống: nút ‹ ›, chấm tròn, cuộn vòng |
| `[data-task]` | Trang đo giờ: chọn đầu việc → tính lại giờ/tuần, giờ/năm, chi phí quy đổi |
| `[data-checkout]` | Chuyển 4 bước thanh toán, chọn hình thức thanh toán |
| `[data-screen]` / `[data-panel]` | Chuyển màn hình bảng điều khiển, ghi nhớ bằng hash URL |
| `[data-staff]` | Bấm dòng nhân sự → cập nhật thẻ chi tiết và cảnh báo ngừng dùng |
| `[data-pp]` | Sửa số phút trước/sau → tính lại % giảm, biểu đồ cột, mức giảm trung bình |
| `[data-queue]` | Hàng chờ kiểm duyệt: checklist, nút Duyệt chỉ bật khi tick đủ, ghi nhật ký |

Dữ liệu mẫu của bảng điều khiển (danh sách nhân sự, hàng chờ kiểm duyệt) nằm ngay
trong `site.js` dưới dạng hằng `STAFF` và `QUEUE` — thay bằng API thật khi cần.

## Ảnh

Ảnh gốc (PNG 1,5–1,9MB mỗi tấm) không đưa lên repo. Các ảnh trong `assets/img/` đã
được thu về tối đa 1400px và nén WebP chất lượng 78, mỗi tấm còn khoảng 20–80KB.

| Vị trí trên trang | Ảnh gốc |
|---|---|
| Khối “Vì sao cần làm ngay” | `19 phan tram.png` |
| Bước 01 Cấu hình cho nghề | `goi nghe anh 1.png` |
| Bước 02 Làm thử trên việc thật | `goi nghe anh 2.png` |
| Bước 03 Dùng được trong thực tế | `goi nghe anh 3.png` |
| Bước 04 Đo lại và tối ưu | `goi nghe anh 4.png` |
| Khối “Chúng tôi là ai” | `chung toi la ai.png` |
| Vì sao 1 — Công cụ bạn đang dùng | `cong cu ban dang dung.png` |
| Vì sao 2 — Có người đồng hành | `co nguoi dong hanh.png` |
| Vì sao 3 — Bảo vệ dữ liệu | `bao ve du lieu.png` |
| Vì sao 4 — Đo được kết quả | `do duoc ket qua.png` |
| Khối An toàn dữ liệu | `bao ve du lieu 2.png` |
| Tình huống 01 — So sánh báo giá | `bao gia.png` |
| Tình huống 02 — Soạn thảo & đàm phán | `soan thao va dam phan.png` |
| Tình huống 03 — Rà soát rủi ro | `ra soat va kiem soat rui ro.png` |
| Tình huống 04 — Tổng hợp định kỳ | `tong hop dinh ky.png` |
| Tình huống 05 — Tra cứu nội bộ | `tra cuu noi bo.png` |
| Nền thẻ nghề Mua hàng | `nen mua hang.png` |
| Nền thẻ nghề Giảng dạy | `nen giang day.png` |
| Nền thẻ nghề Hành chính – Nhân sự | `nen hanh chinh nhan su.png` |
| Nền đầu trang Gói nghề (`goi-nghe.html`) | `nen trang goi nghe.png` |

Nền trang Gói nghề gắn vào thẻ `<main>` giống trang Bảng giá. Vì ảnh có chi tiết ở
nửa phải, ba thẻ gói nghề trên trang này được thêm lớp `.pack-card` (nền sáng, viền,
bo góc, bóng nhẹ — cùng kiểu thẻ giá) để chữ không chìm vào ảnh.

Ba ảnh nền thẻ nghề nằm ở lớp `.u221` — khối tuyệt đối chiếm 62% chiều ngang phía
trên bên phải thẻ, độ mờ 0.5, bên trên có lớp gradient `.u223` loang dần sang trái
để chữ vẫn đọc rõ. Đây là bố cục sẵn có của bản thiết kế, không phải thêm mới.

Mọi vị trí ảnh trong bản thiết kế đều đã có ảnh — không còn khung giữ chỗ nào.
Lớp `.image-placeholder` trong `site.css` vẫn giữ lại để dùng khi thêm khối mới.

## Ghi chú

- Cỡ chữ tiêu đề trong bản thiết kế dùng `clamp()` đặt thẳng ở thuộc tính `style`,
  nên phần responsive trong `site.css` phải dùng `!important` mới ghi đè được.
- Các lớp `.u1`, `.u2`, … trong `site.css` được sinh tự động: mỗi lớp là một bộ
  thuộc tính style lặp lại từ 3 lần trở lên trong bản thiết kế, gom lại cho nhẹ file.
- Vài liên kết chân trang còn để `href="#"` vì bản thiết kế chưa có trang tương ứng
  (Chúng tôi là ai, Sứ mệnh, Liên hệ, Câu hỏi thường gặp, Sự kiện & Workshop).
- Ảnh đi kèm bản thiết kế gốc cũng đã được nén WebP theo cùng tham số, nên toàn bộ
  site chỉ khoảng 1,9MB thay vì 13MB. Riêng `logo.png` giữ định dạng PNG để
  dùng làm favicon, chỉ thu nhỏ lại cho vừa kích thước hiển thị.
- Ảnh có nền trong suốt (`logo-wordmark.webp` ở chân trang, `home-hero.webp`) được
  nén WebP có kênh alpha; nếu ép sang RGB, phần trong suốt sẽ thành nền đen.
- Nút nổi `#modeswitch` ở góc phải dưới thay cho nút “Dùng thử” trên menu: trên các
  trang giới thiệu nó dẫn tới bảng điều khiển demo, trên bảng điều khiển thì dẫn về
  trang chủ. Bỏ nút này khỏi menu giúp logo và menu nằm gọn trên một hàng.
