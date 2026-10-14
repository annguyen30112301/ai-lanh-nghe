# Bàn giao: gắn banner chuyển sang website mới cho site cũ

> Repo: https://github.com/annguyen30112301/ai-lanh-nghe (nhánh `main`) · Site cũ: https://annguyen30112301.github.io/ai-lanh-nghe/
> Site mới (website + Web App, đã chạy): **https://ai-lanh-nghe-app.nghoangan-bt96.workers.dev/** – repo `ai-lanh-nghe-app`
> Lập ngày 14/10/2026, cập nhật cùng ngày sau khi đối chiếu repo cũ, repo `ai-lanh-nghe-app` (commit `f5cfd22`) và các nhánh. Đọc hết file trước khi sửa.

## 0. Trạng thái (14/10/2026)

**Đã làm** trên nhánh `claude/practical-bell-45ns68` (chưa gộp `main`, nên GitHub Pages chưa đổi):
- Banner: JS ở `assets/js/site.js` (`NEW_SITE`, `NEW_PAGES`, `initOldSiteBanner`), CSS cuối `assets/css/site.css`. Banner `sticky` trên cùng; JS đo chiều cao thật vào biến `--banner-h` (theo dõi bằng `ResizeObserver`).
- Khối sticky được đẩy xuống theo `--banner-h`: header (`!important` vì style inline), thanh bên bảng điều khiển, tóm tắt giỏ hàng (`gio-hang.css`), khung duyệt ở Bàn thử việc (`dung-thu.css`), `scroll-margin-top` của các neo.
- README: thêm 2 dòng báo bản cũ + link site mới, repo mới.
- Đã kiểm tra bằng Chromium (Playwright) cả 12 trang ở 1440px và 390px: banner là phần tử đầu `<body>`, link đúng bảng 2.2, header nằm ngay dưới banner, không lỗi JS, phím Tab tới nút được và có viền focus. Test tính tiền 26/26 qua.

**Lệch so với yêu cầu:**
- Ở 390px banner cao 91px (3 dòng, nút nối sau chữ), không phải 2 dòng: chữ phải giữ nguyên và ≥ 16px nên không gói vào 2 dòng được. Desktop cao 50px.
- `index.html` ở 390px có cuộn ngang khoảng 8px – **có sẵn từ trước** (khối `.u100` rộng 398px), không do banner; không sửa vì site cũ đóng băng nội dung.

**Còn lại:** gộp nhánh vào `main` rồi kiểm tra link thật ở cửa sổ ẩn danh (mục 4); dọn nhánh (2.4) chờ Royan đồng ý; việc ngoài repo (mục 5). Khi site mới có thêm trang, chỉ sửa `NEW_PAGES` trong `site.js`.

## 1. Bối cảnh

- Site cũ là bản đã nộp kèm báo cáo giai đoạn 1 (link nằm trong Phụ lục). Sau buổi góp ý 09/10, nhóm làm lại toàn bộ website và chuyển sản phẩm sang dạng **Web App** ở repo `ai-lanh-nghe-app`.
- Site cũ **đóng băng nội dung**: không sửa chữ, giá, số liệu, hình. Nó chỉ còn là nguồn lấy nội dung và là link cũ trong báo cáo.
- Site cũ vẫn còn nội dung đã lỗi thời (số liệu minh họa “1.200+ người dùng · 4.8/5”, mô hình cài vào ChatGPT/Gem qua Connector). Ai mở link cũ cần **thấy ngay** đây là bản cũ và có đường sang bản mới.

## 1b. Hiện trạng đã kiểm tra (14/10/2026)

| Mục | Kết quả |
|---|---|
| Số trang HTML | 12: `index`, `goi-nghe`, `nghe-mua-hang`, `nghe-giang-day`, `bang-gia`, `gio-hang`, `do-gio`, `thanh-toan`, `dung-thu`, `an-toan`, `tai-nguyen`, `bang-dieu-khien` |
| `site.js` + `site.css` | Cả 12 trang đều nạp (mỗi trang đúng 1 lần) → làm banner một chỗ là đủ |
| `noindex` + `robots.txt` (`Disallow: /`) | Có ở cả 12 trang, giữ nguyên |
| Header | 11 trang dùng `<header class="nav">` với **style inline** `position: sticky; top: 0px; z-index: 50` → CSS trong `site.css` muốn đổi `top` phải dùng `!important` (hoặc JS đặt `style.top`). Không có header nào `position: fixed` |
| `bang-dieu-khien.html` | Không có `header.nav`; dùng `.dashboard > aside` `sticky; top: 0; height: 100vh` → cần `top: var(--banner-h)` và `height: calc(100vh - var(--banner-h))` |
| Thanh nổi `.float-bar` | `position: fixed; bottom: 16px` – ở đáy, không đụng banner |
| Test | `node --test tests/*.test.js`: 26/26 qua |
| Site mới – trang đang có | `/`, `/goi-nghe/`, `/bang-gia/`, `/an-toan/`, `/cach-hoat-dong/`, `/app/` (+ `dang-nhap`, `bang-dieu-khien`, `lam-viec`, `tinh-huong`, `ket-noi-ai`, `quan-tri`, `xac-thuc-thiet-bi`). Chưa có: `/nghe/mua-hang/`, `/dung-thu/`, `/dat-mua/`, `/hoi-dap/`, `/doanh-nghiep/`; `/goi-nghe/` chưa có neo `#giang-day` |
| Site mới – đường dẫn | `trailingSlash: "ignore"`, `build.format: "directory"` → dùng dạng có `/` cuối |
| `/app/dang-nhap/?demo=doanh-nghiep` | Có thật: tự điền tài khoản demo doanh nghiệp (`LoginForm.tsx`) → dùng cho `bang-dieu-khien.html` |

Ghi chú: container của Claude Code không mở được `*.workers.dev` (proxy chặn), nên danh sách trang site mới lấy từ `src/pages` của repo `ai-lanh-nghe-app`. Trước khi làm vẫn mở site thật để xác nhận.

## 2. Việc cần làm (chỉ có vậy)

### 2.1 Banner trên mọi trang
- Một dải cố định ở **đầu trang**, trên header, hiện trên cả 12 trang HTML.
- Nội dung (giữ đúng chữ):
  - Chữ: **“Đây là bản website cũ (trước góp ý ngày 09/10/2026). Sản phẩm đã chuyển sang Web App.”**
  - Nút: **“Xem bản mới →”** – mở trang tương ứng ở site mới (mục 2.2), cùng tab.
- Không có nút đóng (banner phải luôn thấy). Không tự chuyển hướng: người chấm vẫn cần đọc được bản cũ để so với báo cáo.
- Giao diện: nền nâu đậm `#5A3B0A`, chữ trắng, chữ ≥ 16px, nút viền trắng; cao tối đa 56px trên desktop, xuống 2 dòng trên điện thoại (390px) mà không che nội dung. Header cũ đang `sticky` (style inline, xem 1b) thì đẩy xuống bằng biến CSS `--banner-h` (JS đo chiều cao banner thật, cập nhật khi `resize`), không để banner đè lên menu.
- Có `role="region"` + `aria-label="Thông báo phiên bản"`; nút là thẻ `<a>`.

### 2.2 Bảng chuyển trang (cũ → mới)
Đặt trong **một** object JS để sửa một chỗ khi site mới có thêm trang.

| Trang cũ | Trang mới hiện có | Khi site mới có trang riêng thì đổi thành |
|---|---|---|
| `index.html` | `/` | – |
| `goi-nghe.html` | `/goi-nghe/` | – |
| `nghe-mua-hang.html` | `/goi-nghe/` | `/nghe/mua-hang/` |
| `nghe-giang-day.html` | `/goi-nghe/` | `/goi-nghe/#giang-day` |
| `bang-gia.html`, `do-gio.html` | `/bang-gia/` | – |
| `gio-hang.html`, `thanh-toan.html` | `/bang-gia/` | `/dat-mua/` |
| `dung-thu.html` | `/app/dang-nhap/` | `/dung-thu/` |
| `an-toan.html` | `/an-toan/` | – |
| `tai-nguyen.html` | `/cach-hoat-dong/` | `/hoi-dap/` |
| `bang-dieu-khien.html` | `/app/dang-nhap/?demo=doanh-nghiep` | `/doanh-nghiep/` |
| trang khác / không khớp | `/` | – |

Gốc site mới: `https://ai-lanh-nghe-app.nghoangan-bt96.workers.dev`. Kiểm tra lại danh sách trang của site mới trước khi làm (mở trang chủ, xem menu và chân trang); trang nào đã có thì dùng cột bên phải. Cột phải khớp mục “Chuyển trang cũ → mới” trong `docs/WEBSITE_PLAN_AI-LanhNghe.md` của repo mới; nếu hai nơi lệch nhau thì theo kế hoạch của repo mới. `#giang-day` chỉ dùng khi trang `/goi-nghe/` đã có phần tử `id="giang-day"`.

### 2.3 Cách làm đề xuất
- Mọi trang đều nạp `assets/js/site.js` và `assets/css/site.css` → **thêm banner bằng JS ở `site.js`** (chèn làm phần tử đầu tiên của `<body>`, chọn link theo `location.pathname`) và **CSS ở `site.css`**. Không sửa từng file HTML.
- Thêm `<noscript>` không bắt buộc.
- Không đụng các phần khác của `site.js` (giỏ hàng, bảng điều khiển, carousel…).
- Giữ nguyên `robots.txt` và thẻ `noindex`.

### 2.4 Dọn nhánh (nếu Royan đồng ý)
- Xóa `claude/affectionate-pascal-ofsc0f` (đã gộp, PR #1; 0 commit riêng, sau `main` 6 commit) và `claude/laughing-ptolemy-rotwa4` (0 commit riêng, sau `main` 1 commit).
- **Giữ** `claude/wizardly-allen-n9fvnf` (kế hoạch backend Connector cũ, 2 commit riêng – 1 file tài liệu 277 dòng, chưa gộp) – không gộp, không xóa.
- Nhánh `claude/practical-bell-45ns68` chứa tài liệu này; gộp vào `main` cùng lúc với banner.

### 2.5 README
Thêm vào đầu `README.md` 2 dòng: site này là bản cũ, đã đóng băng; link site mới và repo `ai-lanh-nghe-app`.

## 3. Không làm
- Không sửa nội dung, giá, số liệu, ảnh, video, tình huống của site cũ.
- Không tự chuyển hướng (meta refresh, `location.replace`), không 301.
- Không xóa trang, không xóa repo, không tắt GitHub Pages: link cũ phải sống đến khi có điểm chính thức (quy định trừ 3 điểm nếu link trong Phụ lục không truy cập được).

## 4. Kiểm tra trước khi đẩy
- [ ] Riêng `bang-dieu-khien.html`: thanh bên trái không bị banner che, vẫn cuộn được đến mục cuối.
- [ ] Các neo có `scroll-margin-top: 90px` (`#chung-toi-la-ai`, `#vi-sao-chon`, `#lien-he`, `#faq`) vẫn không bị header + banner che; nếu bị thì cộng thêm `var(--banner-h)`.
- [ ] Mở từng trang trong 12 trang (chạy `python3 -m http.server 8000`): banner hiện, nút dẫn đúng trang theo bảng 2.2.
- [ ] Desktop 1440px và điện thoại 390px: banner không che menu, không gây cuộn ngang.
- [ ] Nút “Xem bản mới →” dùng được bằng bàn phím, viền focus thấy rõ.
- [ ] `node --test tests/*.test.js` vẫn qua (bộ tính tiền không bị ảnh hưởng).
- [ ] Sau khi push, chờ GitHub Pages cập nhật (1–2 phút) rồi mở link thật ở cửa sổ ẩn danh.

## 5. Việc của nhóm ngoài repo này
- Thay link website trong **Phụ lục báo cáo** và mục 2.9 bằng link site mới; ghi thêm một dòng “Bản cũ (giai đoạn 1): <link cũ>”.
- Mở quyền xem công khai cho mọi link trong Phụ lục.
