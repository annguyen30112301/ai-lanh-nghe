/* AI Lành Nghề — tương tác phía client. Không phụ thuộc thư viện ngoài. */
(function () {
  'use strict';

  var ACCENT = 'var(--color-accent)';
  var ACCENT_BG = 'var(--color-accent-100)';
  var DIVIDER = 'var(--color-divider)';

  function $(sel, root) { return (root || document).querySelector(sel); }
  function $$(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }
  function text(el) { return (el.textContent || '').replace(/\s+/g, ' ').trim(); }

  /* ── điều hướng bằng data-go ── */
  document.addEventListener('click', function (e) {
    var el = e.target.closest('[data-go]');
    if (el) { e.preventDefault(); location.href = el.getAttribute('data-go'); }
  });

  /* ── carousel (gói nghề / tình huống) ── */
  function initCarousel(row) {
    var track = $('[data-track]', row);
    var cards = $$('[data-idx]', track);
    if (cards.length < 2) return;
    var dots = $$('[data-dot]', document.querySelector('[data-dots="' + row.getAttribute('data-carousel') + '"]') || row.parentNode);
    var windowSize = Math.min(3, cards.length);
    var start = 0;

    function render() {
      cards.forEach(function (c) { c.remove(); });
      for (var k = 0; k < windowSize; k++) {
        track.appendChild(cards[(start + k) % cards.length]);
      }
      dots.forEach(function (d, i) {
        d.style.background = i === start ? ACCENT : 'transparent';
      });
    }
    function move(delta) {
      start = (start + delta + cards.length) % cards.length;
      render();
    }
    var prev = $('[data-prev]', row), next = $('[data-next]', row);
    if (prev) prev.addEventListener('click', function () { move(-1); });
    if (next) next.addEventListener('click', function () { move(1); });
    dots.forEach(function (d, i) {
      d.addEventListener('click', function () { start = i; render(); });
    });
    render();
  }
  $$('[data-carousel]').forEach(initCarousel);

  /* ── trang đo giờ tiết kiệm ── */
  function initAssess() {
    var rows = $$('[data-task]');
    if (!rows.length) return;
    var WEEKS = 46, RATE = 213000;
    var out = $('[data-hours]'), outYear = $('[data-hours-year]'), outCost = $('[data-hours-cost]');
    function sync() {
      var total = 0;
      rows.forEach(function (r) {
        var on = r.getAttribute('aria-pressed') === 'true';
        if (on) total += parseFloat(r.getAttribute('data-task')) || 0;
        r.style.background = on ? ACCENT_BG : 'var(--color-neutral-100)';
        r.style.borderColor = on ? ACCENT : DIVIDER;
        var dot = $('[data-mark]', r);
        if (dot) { dot.style.background = on ? ACCENT : 'transparent'; dot.textContent = on ? '✓' : ''; }
      });
      var year = Math.round(total * WEEKS);
      if (out) out.textContent = total.toLocaleString('vi-VN');
      if (outYear) outYear.textContent = year.toLocaleString('vi-VN');
      if (outCost) outCost.textContent = (year * RATE / 1e6).toLocaleString('vi-VN', { maximumFractionDigits: 1 }) + ' triệu';
    }
    rows.forEach(function (r) {
      r.addEventListener('click', function () {
        r.setAttribute('aria-pressed', r.getAttribute('aria-pressed') === 'true' ? 'false' : 'true');
        sync();
      });
    });
    sync();
  }
  initAssess();

  /* ── thanh toán: 4 bước ── */
  function initCheckout() {
    var wrap = $('[data-checkout]');
    if (!wrap) return;
    var steps = $$('[data-step]', wrap);
    var cur = 1;

    function show(n) {
      cur = Math.min(Math.max(n, 1), steps.length);
      steps.forEach(function (s) { s.hidden = Number(s.getAttribute('data-step')) !== cur; });
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
    wrap.addEventListener('click', function (e) {
      var b = e.target.closest('button');
      if (!b || b.hasAttribute('data-go')) return;
      var t = text(b);
      if (t === 'Tiếp tục' || t === 'Tới bước thanh toán') show(cur + 1);
      else if (t === 'Quay lại') show(cur - 1);
      else if (t.indexOf('Thanh toán') === 0) show(4);
    });

    // chọn hình thức thanh toán
    var pays = $$('[data-pay]', wrap);
    pays.forEach(function (p) {
      p.addEventListener('click', function () {
        pays.forEach(function (q) {
          var on = q === p;
          q.style.background = on ? ACCENT_BG : 'transparent';
          q.style.borderColor = on ? ACCENT : DIVIDER;
          var dot = $('[data-mark]', q);
          if (dot) dot.style.background = on ? ACCENT : 'transparent';
        });
      });
    });
    show(1);
  }
  initCheckout();

  /* ── bảng điều khiển ── */
  function initDashboard() {
    var nav = $('[data-dash-nav]');
    if (!nav) return;
    var btns = $$('[data-screen]', nav);
    var panels = $$('[data-panel]');

    function show(key) {
      panels.forEach(function (p) { p.hidden = p.getAttribute('data-panel') !== key; });
      btns.forEach(function (b) {
        var on = b.getAttribute('data-screen') === key;
        b.style.background = on ? ACCENT_BG : 'transparent';
        b.style.borderLeftColor = on ? ACCENT : 'transparent';
        b.style.color = on ? 'var(--color-accent-800)' : 'var(--color-text)';
      });
      history.replaceState(null, '', '#' + key);
    }
    btns.forEach(function (b) {
      b.addEventListener('click', function () { show(b.getAttribute('data-screen')); });
    });
    var initial = (location.hash || '#overview').slice(1);
    show(panels.some(function (p) { return p.getAttribute('data-panel') === initial; }) ? initial : 'overview');

    initStaff();
    initPrePost();
    initReview();
  }

  /* theo từng nhân sự */
  var STAFF = [
    { name: 'Nguyễn Thị Hoa', role: 'Chuyên viên mua hàng', setup: 100, used: 12, done: 46, hours: 31, last: 'Hôm nay', days: 0 },
    { name: 'Trần Văn Khoa', role: 'Chuyên viên mua hàng', setup: 100, used: 9, done: 38, hours: 24, last: '2 ngày', days: 2 },
    { name: 'Lê Minh Tâm', role: 'Phó phòng Mua hàng', setup: 100, used: 11, done: 33, hours: 22, last: '3 ngày', days: 3 },
    { name: 'Phạm Thu Hà', role: 'Chuyên viên hợp đồng', setup: 80, used: 7, done: 21, hours: 15, last: '5 ngày', days: 5 },
    { name: 'Đỗ Quang Vinh', role: 'Chuyên viên mua hàng', setup: 60, used: 3, done: 6, hours: 4, last: '19 ngày', days: 19, email: 'vinh.dq@minhlong.vn' },
    { name: 'Vũ Thanh Mai', role: 'Trợ lý mua hàng', setup: 100, used: 8, done: 27, hours: 18, last: '1 ngày', days: 1 },
    { name: 'Hoàng Đức Trí', role: 'Chuyên viên kho vận', setup: 40, used: 1, done: 2, hours: 1, last: '23 ngày', days: 23 },
    { name: 'Bùi Kim Chi', role: 'Chuyên viên mua hàng', setup: 100, used: 10, done: 35, hours: 23, last: 'Hôm nay', days: 0 }
  ];

  function initStaff() {
    var rows = $$('[data-staff]');
    if (!rows.length) return;
    function pick(i) {
      rows.forEach(function (r, j) { r.style.background = i === j ? ACCENT_BG : 'transparent'; });
      var s = STAFF[i];
      if (!s) return;
      var email = s.email || (s.name.split(' ').pop().toLowerCase() + '@minhlong.vn');
      set('[data-sel="name"]', s.name);
      set('[data-sel="role"]', s.role);
      set('[data-sel="email"]', email);
      var bar = $('[data-sel-bar]');
      if (bar) bar.style.width = s.setup + '%';
      set('[data-sel="used"]', s.used + ' / 24 tình huống');
      set('[data-sel="done"]', s.done + ' đầu việc');
      set('[data-sel="hours"]', s.hours + ' giờ');
      set('[data-sel="last"]', s.last);
      var warn = s.days > 14;
      var box = $('[data-sel="warn"]');
      if (box) {
        box.style.borderColor = warn ? ACCENT : DIVIDER;
        box.style.background = warn ? ACCENT_BG : 'transparent';
      }
      set('[data-sel="warntext"]', warn
        ? 'Cảnh báo sớm: đã ' + s.days + ' ngày không dùng gói. Nên can thiệp kèm cặp ngay thay vì đợi kỳ gia hạn.'
        : 'Đang dùng đều. Không cần can thiệp.');
    }
    function set(sel, v) { var el = $(sel); if (el) el.textContent = v; }
    rows.forEach(function (r, i) { r.addEventListener('click', function () { pick(i); }); });
    pick(4);
  }

  /* đo trước – sau */
  function initPrePost() {
    var rows = $$('[data-pp]');
    if (!rows.length) return;
    function sync() {
      var max = 1, ratios = [];
      rows.forEach(function (r) {
        max = Math.max(max, num($('[data-pp-before]', r)));
      });
      rows.forEach(function (r, i) {
        var b = num($('[data-pp-before]', r)), a = num($('[data-pp-after]', r));
        var barB = $('[data-bar="' + i + '-before"]'), barA = $('[data-bar="' + i + '-after"]');
        if (barB) barB.style.width = Math.round((b / max) * 100) + '%';
        if (barA) barA.style.width = Math.round((a / max) * 100) + '%';
        var cut = $('[data-pp-cut]', r);
        var ratio = b ? 1 - a / b : 0;
        ratios.push(ratio);
        if (cut) cut.textContent = b ? Math.round(ratio * 100) + '%' : '—';
      });
      var avg = $('[data-pp-avg]');
      if (avg && ratios.length) {
        avg.textContent = Math.round(ratios.reduce(function (t, x) { return t + x; }, 0) / ratios.length * 100) + '%';
      }
    }
    function num(input) { return input ? Math.max(0, Number(input.value) || 0) : 0; }
    rows.forEach(function (r) {
      $$('input', r).forEach(function (i) { i.addEventListener('input', sync); });
    });
    sync();
  }

  /* kiểm duyệt đầu ra AI */
  var QUEUE = [
    { title: 'Bảng so sánh 4 báo giá — gói thầu bao bì Q4', staff: 'Nguyễn Thị Hoa', type: 'So sánh báo giá', time: '05/09 08:12', tool: 'Gemini (bậc miễn phí)',
      excerpt: 'Bảng tổng hợp 4 nhà cung cấp bao bì giấy, đơn giá theo tấn, thời gian giao, điều kiện thanh toán và tổng chi phí quy đổi 12 tháng. Đề xuất: NCC Tân Á — thấp hơn 6,2% so với giá trung bình.',
      checks: ['Số liệu khớp với bản báo giá gốc (PDF)', 'Không thiếu nhà cung cấp nào trong danh sách mời', 'Đơn vị tiền tệ và VAT nhất quán giữa các dòng', 'Không chứa dữ liệu thuộc danh mục cấm nạp'] },
    { title: 'Thư đàm phán giảm 5% — NCC Bao bì Tân Á', staff: 'Trần Văn Khoa', type: 'Thư gửi nhà cung cấp', time: '05/09 07:40', tool: 'Copilot (tài khoản công ty)',
      excerpt: 'Thư viện dẫn sản lượng cam kết cả năm, đề nghị giảm 5% đơn giá kèm điều kiện thanh toán 15 ngày, giữ nguyên các điều khoản còn lại của hợp đồng khung.',
      checks: ['Cam kết về giá và thời hạn đúng thẩm quyền người gửi', 'Không hứa điều khoản ngoài hợp đồng mẫu', 'Giọng văn phù hợp quan hệ nhà cung cấp hiện có'] },
    { title: 'Tóm tắt điều khoản hợp đồng vận chuyển Đông Phương', staff: 'Lê Minh Tâm', type: 'Rà soát hợp đồng', time: '04/09 17:05', tool: 'Claude (bậc miễn phí)',
      excerpt: 'Tóm tắt 6 điều khoản có rủi ro: giới hạn trách nhiệm hàng hư hỏng, điều kiện phạt chậm giao, điều khoản điều chỉnh giá theo giá dầu.',
      checks: ['Đối chiếu đúng điều khoản gốc, không suy diễn', 'Nêu rõ phần rủi ro pháp lý', 'Có ghi chú “cần pháp chế xem lại”'] },
    { title: 'Báo cáo mua hàng tuần 36', staff: 'Phạm Thu Hà', type: 'Báo cáo định kỳ', time: '04/09 15:22', tool: 'Gemini (bậc miễn phí)',
      excerpt: 'Tổng giá trị đơn đặt hàng 4,2 tỷ; 3 đơn chậm giao; 2 nhà cung cấp vượt hạn mức tín dụng nội bộ.',
      checks: ['Số tổng khớp với dữ liệu ERP', 'Ghi rõ nguồn cho từng bảng', 'Không đưa dữ liệu giá hợp đồng vào phần gửi ngoài phòng'] }
  ];

  function initReview() {
    var items = $$('[data-queue]');
    if (!items.length) return;
    var checksBox = $('[data-checks]');
    var approveBtn = $('[data-approve]');
    var fixBtn = $('[data-needfix]');
    var hint = $('[data-approve-hint]');
    var logBox = $('[data-log]');
    var state = { sel: 0, checks: {}, statuses: {} };

    function statusOf(i) { return state.statuses[i] || 'pending'; }

    function renderQueue() {
      items.forEach(function (el, i) {
        var on = i === state.sel;
        el.style.background = on ? ACCENT_BG : 'var(--color-neutral-100)';
        el.style.borderColor = on ? ACCENT : DIVIDER;
        var tag = $('[data-queue-status]', el);
        if (tag) {
          var map = { pending: ['Chờ duyệt', 'tag-outline'], approved: ['Đã duyệt', 'tag-accent'], needfix: ['Cần sửa', 'tag-neutral'] };
          var m = map[statusOf(i)];
          tag.textContent = m[0];
          tag.className = 'tag ' + m[1];
        }
      });
    }

    function renderDetail() {
      var q = QUEUE[state.sel];
      if (!q) return;
      setText('[data-cur="title"]', q.title);
      setText('[data-cur="staff"]', q.staff);
      setText('[data-cur="type"]', q.type);
      setText('[data-cur="time"]', q.time);
      setText('[data-cur="tool"]', q.tool);
      setText('[data-cur="excerpt"]', q.excerpt);
      if (checksBox) {
        checksBox.innerHTML = '';
        q.checks.forEach(function (label, j) {
          var key = state.sel + ':' + j;
          var on = !!state.checks[key];
          var row = document.createElement('button');
          row.type = 'button';
          row.style.cssText = 'display:flex;align-items:flex-start;gap:10px;width:100%;text-align:left;cursor:pointer;padding:11px 13px;margin-bottom:8px;border-radius:var(--radius-md);font:inherit;font-size:15px;line-height:1.5;border:1px solid ' +
            (on ? ACCENT : DIVIDER) + ';background:' + (on ? ACCENT_BG : 'var(--color-bg)') + ';color:var(--color-text)';
          var dot = document.createElement('span');
          dot.style.cssText = 'flex:0 0 auto;width:18px;height:18px;border-radius:4px;display:inline-flex;align-items:center;justify-content:center;font-size:12px;color:#fff;border:1px solid ' +
            (on ? ACCENT : DIVIDER) + ';background:' + (on ? ACCENT : 'transparent');
          dot.textContent = on ? '✓' : '';
          row.appendChild(dot);
          row.appendChild(document.createTextNode(label));
          row.addEventListener('click', function () {
            state.checks[key] = !state.checks[key];
            renderDetail();
          });
          checksBox.appendChild(row);
        });
      }
      var all = q.checks.every(function (_, j) { return state.checks[state.sel + ':' + j]; });
      if (approveBtn) { approveBtn.disabled = !all; approveBtn.style.opacity = all ? '1' : '0.5'; approveBtn.style.cursor = all ? 'pointer' : 'not-allowed'; }
      if (hint) hint.textContent = all ? 'Đủ checklist — có thể duyệt.' : 'Tick đủ checklist trước khi duyệt.';
    }

    function mark(status) {
      var q = QUEUE[state.sel];
      state.statuses[state.sel] = status;
      if (logBox) {
        var li = document.createElement('div');
        li.style.cssText = 'padding:10px 0;border-bottom:1px solid ' + DIVIDER + ';font-size:14px;line-height:1.5';
        li.textContent = new Date().toLocaleDateString('vi-VN') + ' · Trưởng phòng Mua hàng · ' +
          (status === 'approved' ? 'duyệt' : 'yêu cầu sửa') + ' “' + q.title + '”';
        logBox.insertBefore(li, logBox.firstChild);
      }
      renderQueue();
    }

    function setText(sel, v) { var el = $(sel); if (el) el.textContent = v; }

    items.forEach(function (el, i) {
      el.addEventListener('click', function () { state.sel = i; renderQueue(); renderDetail(); });
    });
    if (approveBtn) approveBtn.addEventListener('click', function () { mark('approved'); });
    if (fixBtn) fixBtn.addEventListener('click', function () { mark('needfix'); });
    renderQueue();
    renderDetail();
  }

  initDashboard();
})();
