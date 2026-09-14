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
dung-thu.html           Bàn thử việc — dùng thử 6 tình huống của 2 nghề đang mở
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

## Bàn thử việc (`dung-thu.html`)

Khách giao cho AI một việc thật của nghề mình rồi tự kiểm tra kết quả. Đây là **mockup UI**:
kết quả được soạn sẵn trong `assets/js/dung-thu-data.js`, không gọi AI thật, không đăng nhập,
không lưu dữ liệu.

Khác với **gói Gia nhập 0 đ** ở trang Bảng giá: gói này yêu cầu đăng nhập,
thanh toán 0 đ và thực hành trên AI thật của khách. Bước cuối của trang dùng thử dẫn sang đó.

Luồng 4 bước: **Chọn việc → Đầu vào (AI xử lý) → Kiểm tra → Kết quả.**

| Nghề | Tình huống | Nút chỉnh | Lỗi cài sẵn khách phải tự bắt |
|---|---|---|---|
| Mua hàng | So sánh 3 báo giá | Ưu tiên chi phí / giao nhanh / hậu mãi | NCC C ghi giá chưa gồm VAT nên trông rẻ nhất |
| Mua hàng | Soạn thư đề nghị giảm giá | Giọng mềm / trung tính / cứng rắn | Câu cam kết vượt thẩm quyền người gửi |
| Mua hàng | Chấm hồ sơ năng lực NCC | 3 bộ trọng số | ISO 9001 hết hạn nhưng vẫn được chấm cao; có bước ẩn CCCD |
| Giảng dạy | Kế hoạch tiết học | 45 / 90 phút | Tổng thời lượng vượt tiết học 5 phút |
| Giảng dạy | Phiếu bài tập 3 mức độ | 4·3·2 / 3·3·3 câu | Đáp án sai ở câu so sánh 5/6 và 7/9 |
| Giảng dạy | Nhận xét học sinh | Gửi phụ huynh / sổ theo dõi | Câu suy diễn không có trong ghi chú; có bước ẩn danh học sinh |

- Mục có lỗi trong checklist không tick được cho đến khi khách bấm vào xem gợi ý và sửa;
  nút **Dùng kết quả này** chỉ bật khi tick đủ. Sau khi sửa, kết quả thật sự đổi
  (ví dụ đề xuất chuyển từ NCC C sang NCC B, hồ sơ từ “Đạt” thành “Đạt có điều kiện”).
- Link vào thẳng một tình huống: `dung-thu.html#<nghề>/<tình huống>`, ví dụ
  `#mua-hang/bao-gia`, `#giang-day/nhan-xet`. Chỉ `#mua-hang` thì mở bước chọn việc với nghề đó.
- Lối vào: nút “Thử ngay →”, “Xem AI làm được gì →”, “Xem thử một tình huống” trên trang
  Mua hàng; “Xem thử một tình huống →” trên trang Giảng dạy; nút nổi **Dùng thử** ở giữa đáy
  màn hình trên mọi trang (trừ chính trang dùng thử).
- Trên điện thoại, bảng kết quả chuyển thành dạng xếp chồng (nhãn bên trái, giá trị bên phải)
  để không phải cuộn ngang.

## Bảng giá cá nhân (`bang-gia.html`)

Ba bậc khác nhau ở **mức độ cá nhân hoá**, không chỉ ở chuyện có hỗ trợ hay không:

| Bậc | Giá | Thông điệp | Điểm chính |
|---|---|---|---|
| Gia nhập | 0 đ | Thử xem AI có làm được việc | 1 nghề · 5 tình huống mẫu **cố định theo nghề** (~15% một gói) · hướng dẫn cơ bản |
| Cơ bản | 690.000 đ/năm | Cài sẵn để dùng ngay | Trọn bộ AI theo nghề · 20–30 tình huống · biểu mẫu, checklist · hỗ trợ cài đặt · tự điều chỉnh |
| Tinh chỉnh | 1.490.000 đ/năm | AI theo đúng cách bạn làm | Toàn bộ Cơ bản · kèm cặp 45 phút · chỉnh cách xử lý và biểu mẫu đầu ra · hỏi đáp ưu tiên |

- Mỗi thẻ có dòng **“Dành cho bạn nếu”**; dưới thẻ là bảng **So sánh ba gói cho cá nhân** (10 tiêu chí).
- Gói Gia nhập không cho chọn tình huống tuỳ ý: 5 tình huống do từng nghề quy định, để không mở
  được phần lớn gói trả phí mà không trả tiền. Con số 15% chỉ là dòng ghi chú phụ.
- Nội dung ba thẻ và bảng nằm trong `PERSONAL_TIERS` / `PERSONAL_TABLE_ROWS` của script build;
  khung giá nhỏ trên trang Gói nghề Mua hàng dùng cùng tên bậc (Cơ bản, Tinh chỉnh, Doanh nghiệp).

## Nghề tiếp theo (trang Gói nghề)

Lộ trình 30 gói nghề chưa phát hành, mỗi gói 5 tình huống mẫu, nằm ngay dưới ba thẻ
gói nghề đầu trang `goi-nghe.html`.

| Tệp | Vai trò |
|---|---|
| `assets/data/nghe.json` | Nội dung gốc: 31 gói, 155 tình huống — sửa nội dung ở đây |
| `assets/js/nghe-data.js` | Cùng dữ liệu ở dạng `window.NGHE_DATA`, để trang chạy được cả khi mở bằng `file://` |
| `assets/js/nghe-tiep-theo.js` | Tìm kiếm (không cần gõ dấu), lọc trạng thái và nhóm nghề, khung xem trước |
| `assets/css/nghe-tiep-theo.css` | Giao diện section và khung xem trước |

Mỗi gói có: `id`, `ten`, `nhom`, `trangThai` (`dong-goi` / `sap-mo`), `moTa`, `duKien`,
`luuY` (không bắt buộc — ghi chú bảo vệ dữ liệu) và `tinhHuong`. Mỗi tình huống có
`ten`, `loai`, `dauVao`, `xuLy` (các bước), `dauRa` (kết quả mẫu). Năm tình huống của
một gói luôn thuộc đủ năm loại việc: Soạn thảo, Phân tích, Kiểm tra, Tổng hợp, Ra quyết định.

- Thẻ gói nghề được viết sẵn trong HTML; nếu sửa `nghe.json` thì phải sinh lại cả thẻ
  trong `goi-nghe.html` lẫn `nghe-data.js` cho khớp.
- Khung xem trước có link riêng: `goi-nghe.html#xem-truoc/<id>`, ví dụ
  `#xem-truoc/tuyen-dung`. Nút “Xem trước” của Hành chính – Nhân sự ở trang chủ dùng link này.
- Nút **Đăng ký nhận thông báo** mở Google Form “Đừng bỏ lỡ gói nghề của bạn” trong tab mới
  và chọn sẵn gói đang xem ở câu “Gói nghề quan tâm”. Cấu hình nằm ở thẻ
  `<section id="nghe-tiep-theo">` trong `goi-nghe.html`: `data-form-url` (chuỗi `{nghe}` được
  thay bằng lựa chọn), `data-form-options` (các lựa chọn đang có trong form, cách nhau bằng `|`)
  và `data-form-fallback` (để trống: gói chưa có tên trong form thì mở form không chọn sẵn).
  Tên lựa chọn trong form phải khớp từng chữ với trường `ten` trong `nghe.json` thì mới chọn sẵn được.
- Form hiện có 33 lựa chọn (2 gói đang có + 31 gói trên) và ô “Khác” tự nhập để khách đề xuất
  nghề mới. Trang Gói nghề Mua hàng và Giảng dạy có thêm link **Nhận thông báo cập nhật →**
  (lớp `.update-link`) mở cùng form, chọn sẵn đúng gói đó.
- Trạng thái hiện tại: Mua hàng và Giảng dạy đang có (có trang riêng); Hành chính – Nhân sự,
  Kế toán – Tài chính, Bán hàng, Tuyển dụng, Marketing, Logistics, Quản lý dự án đang
  đóng gói; 24 gói còn lại sắp mở.

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
- Slogan thương hiệu là **“AI giỏi việc. Bạn vững nghề.”** (thay cho “Kỹ năng AI.
  Nghiệp vững tương lai.”), hiển thị in hoa giãn chữ dưới tên thương hiệu ở menu và
  chân trang. Logo lớn ở chân trang trang chủ là logo ngang dựng bằng HTML
  (`.brand-lockup`: biểu tượng `logo.png` + tên + slogan) thay cho ảnh logo chữ cũ
  vốn in sẵn slogan cũ.
- Ảnh có nền trong suốt (`home-hero.webp`) được nén WebP có kênh alpha; nếu ép sang
  RGB, phần trong suốt sẽ thành nền đen.
- Ảnh nền trang Gói nghề có dòng chữ slogan cũ vẽ sẵn trên tấm bảng trong ảnh — cần
  thay ảnh khác nếu muốn đồng bộ hoàn toàn.
- Hàng nút nổi `.float-bar` dưới đáy màn hình thay cho nút “Dùng thử” trên menu:
  `.float-trial` **Dùng thử** ở giữa (dẫn tới `dung-thu.html`) và `#modeswitch` ở góc phải
  (**Xem bảng điều khiển (demo)**; trên bảng điều khiển là **← Về trang giới thiệu**). Trang dùng
  thử chỉ có nút demo. Màn hình dưới 640px thì hai nút đứng cạnh nhau ở giữa. Bỏ nút này khỏi menu giúp logo và menu nằm gọn trên một hàng.
