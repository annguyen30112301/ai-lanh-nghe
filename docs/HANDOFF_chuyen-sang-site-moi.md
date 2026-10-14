# Bàn giao: gắn banner chuyển sang website mới cho site cũ

> Repo: https://github.com/annguyen30112301/ai-lanh-nghe (nhánh `main`) · Site cũ: https://annguyen30112301.github.io/ai-lanh-nghe/
> Site mới (website + Web App, đã chạy): **https://ai-lanh-nghe-app.nghoangan-bt96.workers.dev/** – repo `ai-lanh-nghe-app`
> Lập ngày 14/10/2026. Đọc hết file trước khi sửa.

## 1. Bối cảnh

- Site cũ là bản đã nộp kèm báo cáo giai đoạn 1 (link nằm trong Phụ lục). Sau buổi góp ý 09/10, nhóm làm lại toàn bộ website và chuyển sản phẩm sang dạng **Web App** ở repo `ai-lanh-nghe-app`.
- Site cũ **đóng băng nội dung**: không sửa chữ, giá, số liệu, hình. Nó chỉ còn là nguồn lấy nội dung và là link cũ trong báo cáo.
- Site cũ vẫn còn nội dung đã lỗi thời (số liệu minh họa “1.200+ người dùng · 4.8/5”, mô hình cài vào ChatGPT/Gem qua Connector). Ai mở link cũ cần **thấy ngay** đây là bản cũ và có đường sang bản mới.

## 2. Việc cần làm (chỉ có vậy)

### 2.1 Banner trên mọi trang
- Một dải cố định ở **đầu trang**, trên header, hiện trên cả 12 trang HTML.
- Nội dung (giữ đúng chữ):
  - Chữ: **“Đây là bản website cũ (trước góp ý ngày 09/10/2026). Sản phẩm đã chuyển sang Web App.”**
  - Nút: **“Xem bản mới →”** – mở trang tương ứng ở site mới (mục 2.2), cùng tab.
- Không có nút đóng (banner phải luôn thấy). Không tự chuyển hướng: người chấm vẫn cần đọc được bản cũ để so với báo cáo.
- Giao diện: nền nâu đậm `#5A3B0A`, chữ trắng, chữ ≥ 16px, nút viền trắng; cao tối đa 56px trên desktop, xuống 2 dòng trên điện thoại (390px) mà không che nội dung. Header cũ đang `sticky`/`fixed` thì đẩy xuống bằng biến CSS, không để banner đè lên menu.
- Có `role="region"` + `aria-label="Thông báo phiên bản"`; nút là thẻ `<a>`.

### 2.2 Bảng chuyển trang (cũ → mới)
Đặt trong **một** object JS để sửa một chỗ khi site mới có thêm trang.

| Trang cũ | Trang mới hiện có | Khi site mới có trang riêng thì đổi thành |
|---|---|---|
| `index.html` | `/` | – |
| `goi-nghe.html` | `/goi-nghe/` | – |
| `nghe-mua-hang.html` | `/goi-nghe/` | `/nghe/mua-hang/` |
| `nghe-giang-day.html` | `/goi-nghe/` | `/goi-nghe/#giang-day` |
| `bang-gia.html`, `gio-hang.html`, `do-gio.html` | `/bang-gia/` | – |
| `thanh-toan.html` | `/bang-gia/` | `/dat-mua/` |
| `dung-thu.html` | `/app/dang-nhap/` | `/dung-thu/` |
| `an-toan.html` | `/an-toan/` | – |
| `tai-nguyen.html` | `/cach-hoat-dong/` | `/hoi-dap/` |
| `bang-dieu-khien.html` | `/app/dang-nhap/` | `/doanh-nghiep/` |
| trang khác / không khớp | `/` | – |

Gốc site mới: `https://ai-lanh-nghe-app.nghoangan-bt96.workers.dev`. Kiểm tra lại danh sách trang của site mới trước khi làm (mở trang chủ, xem menu và chân trang); trang nào đã có thì dùng cột bên phải.

### 2.3 Cách làm đề xuất
- Mọi trang đều nạp `assets/js/site.js` và `assets/css/site.css` → **thêm banner bằng JS ở `site.js`** (chèn làm phần tử đầu tiên của `<body>`, chọn link theo `location.pathname`) và **CSS ở `site.css`**. Không sửa từng file HTML.
- Thêm `<noscript>` không bắt buộc.
- Không đụng các phần khác của `site.js` (giỏ hàng, bảng điều khiển, carousel…).
- Giữ nguyên `robots.txt` và thẻ `noindex`.

### 2.4 Dọn nhánh (nếu Royan đồng ý)
- Xóa `claude/affectionate-pascal-ofsc0f` (đã gộp, PR #1) và `claude/laughing-ptolemy-rotwa4` (không khác `main`).
- **Giữ** `claude/wizardly-allen-n9fvnf` (kế hoạch backend Connector cũ, chưa gộp) – không gộp, không xóa.

### 2.5 README
Thêm vào đầu `README.md` 2 dòng: site này là bản cũ, đã đóng băng; link site mới và repo `ai-lanh-nghe-app`.

## 3. Không làm
- Không sửa nội dung, giá, số liệu, ảnh, video, tình huống của site cũ.
- Không tự chuyển hướng (meta refresh, `location.replace`), không 301.
- Không xóa trang, không xóa repo, không tắt GitHub Pages: link cũ phải sống đến khi có điểm chính thức (quy định trừ 3 điểm nếu link trong Phụ lục không truy cập được).

## 4. Kiểm tra trước khi đẩy
- [ ] Mở từng trang trong 12 trang (chạy `python3 -m http.server 8000`): banner hiện, nút dẫn đúng trang theo bảng 2.2.
- [ ] Desktop 1440px và điện thoại 390px: banner không che menu, không gây cuộn ngang.
- [ ] Nút “Xem bản mới →” dùng được bằng bàn phím, viền focus thấy rõ.
- [ ] `node --test tests/*.test.js` vẫn qua (bộ tính tiền không bị ảnh hưởng).
- [ ] Sau khi push, chờ GitHub Pages cập nhật (1–2 phút) rồi mở link thật ở cửa sổ ẩn danh.

## 5. Việc của nhóm ngoài repo này
- Thay link website trong **Phụ lục báo cáo** và mục 2.9 bằng link site mới; ghi thêm một dòng “Bản cũ (giai đoạn 1): <link cũ>”.
- Mở quyền xem công khai cho mọi link trong Phụ lục.
