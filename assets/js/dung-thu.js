/* Bàn thử việc — chọn việc → đầu vào & AI xử lý → kiểm tra → kết quả. Dữ liệu: window.DUNG_THU */
(function () {
  'use strict';

  var NGHE = window.DUNG_THU || [];
  var root = document.querySelector('[data-dung-thu]');
  if (!root || !NGHE.length) return;

  var view = root.querySelector('[data-dt-view]');
  var stepper = root.querySelector('[data-dt-stepper]');
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var STEP_MS = reduce ? 0 : 560;

  var S = { nghe: NGHE[0], th: NGHE[0].tinhHuong[0], chon: null, anDanh: false, trangThai: 'cho', sua: false, tick: {}, moGoiY: false };
  var timers = [];

  /* ── tiện ích ── */
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function findNghe(id) { return NGHE.filter(function (n) { return n.id === id; })[0]; }
  function findTh(nghe, id) { return nghe.tinhHuong.filter(function (t) { return t.id === id; })[0]; }
  function clearTimers() { timers.forEach(clearTimeout); timers = []; }
  function cell(c) { return c && typeof c === 'object' ? c : { v: c }; }

  function resetTh(nghe, th) {
    clearTimers();
    S.nghe = nghe;
    S.th = th;
    S.chon = th.nut.chon[0].id;
    S.anDanh = false;
    S.trangThai = 'cho';
    S.sua = false;
    S.tick = {};
    S.moGoiY = false;
  }

  /* ── điều hướng ── */
  var STEPS = [
    { id: 'chon', ten: 'Chọn việc' },
    { id: 'ban', ten: 'Đầu vào' },
    { id: 'kiem-tra', ten: 'Kiểm tra' },
    { id: 'ket-qua', ten: 'Kết quả' }
  ];

  function hashFor(step) {
    if (step === 'chon') return '#' + S.nghe.id;
    var h = '#' + S.nghe.id + '/' + S.th.id;
    return step === 'ban' ? h : h + '/' + step;
  }

  function go(step, opts) {
    opts = opts || {};
    if (!opts.fromHistory) {
      var h = hashFor(step);
      if (location.hash !== h) history.pushState({ step: step }, '', h);
    }
    render(step);
    if (!opts.noFocus) {
      var hd = view.querySelector('[data-dt-focus]');
      if (hd) hd.focus({ preventScroll: true });
      var top = root.getBoundingClientRect().top + window.scrollY - 90;
      if (window.scrollY > top) window.scrollTo({ top: top, behavior: reduce ? 'auto' : 'smooth' });
    }
  }

  function fromHash() {
    var parts = location.hash.replace(/^#/, '').split('/');
    var nghe = findNghe(parts[0]);
    if (!nghe) return { step: 'chon' };
    var th = parts[1] && findTh(nghe, parts[1]);
    if (!th) {
      if (S.nghe !== nghe) resetTh(nghe, nghe.tinhHuong[0]);
      return { step: 'chon' };
    }
    if (S.th !== th) resetTh(nghe, th);
    var step = parts[2];
    if (step === 'kiem-tra' && S.trangThai === 'xong') return { step: 'kiem-tra' };
    if (step === 'ket-qua' && S.trangThai === 'xong' && allTicked()) return { step: 'ket-qua' };
    return { step: 'ban' };
  }

  window.addEventListener('popstate', function () { go(fromHash().step, { fromHistory: true }); });

  function renderStepper(step) {
    var idx = STEPS.map(function (s) { return s.id; }).indexOf(step);
    stepper.innerHTML = STEPS.map(function (s, i) {
      var cls = i < idx ? 'is-done' : i === idx ? 'is-on' : '';
      return '<li class="' + cls + '"' + (i === idx ? ' aria-current="step"' : '') + '><span class="dt-step-n">' +
        (i < idx ? '✓' : i + 1) + '</span>' + esc(s.ten) + '</li>';
    }).join('');
  }

  function render(step) {
    renderStepper(step);
    root.dataset.step = step;
    if (step === 'chon') return renderChon();
    if (step === 'ban') return renderBan();
    if (step === 'kiem-tra') return renderKiem();
    return renderXong();
  }

  /* ── Bước 1: chọn việc ── */
  function renderChon() {
    var html = '<div class="dt-view-head"><h2 class="dt-h" tabindex="-1" data-dt-focus>Hôm nay bạn muốn giao cho AI việc gì?</h2>' +
      '<p class="dt-sub">Chọn nghề của bạn và một việc quen thuộc. Tài liệu mẫu đã được điền sẵn, bạn không cần nhập dữ liệu thật.</p></div>' +
      '<div class="dt-jobs">';
    NGHE.forEach(function (n) {
      var on = n === S.nghe;
      html += '<div class="dt-job' + (on ? ' is-on' : '') + '" role="radiogroup" aria-label="Tình huống nghề ' + esc(n.ten) + '">' +
        '<div class="dt-job-head"><h3 class="dt-job-name">' + esc(n.ten) + '</h3><span class="dt-job-desc">' + esc(n.moTa) + '</span></div>';
      n.tinhHuong.forEach(function (t) {
        var sel = on && t === S.th;
        html += '<button type="button" class="dt-case' + (sel ? ' is-on' : '') + '" role="radio" aria-checked="' + sel + '" ' +
          'data-nghe="' + n.id + '" data-th="' + t.id + '" tabindex="' + (sel || (!on && t === n.tinhHuong[0]) ? 0 : -1) + '">' +
          '<span class="dt-radio" aria-hidden="true"></span><span class="dt-case-name">' + esc(t.ten) + '</span>' +
          '<span class="dt-case-time">' + esc(t.thoiGian) + '</span>' + (t.baoVe ? '<span class="dt-case-tag">Có bước ẩn dữ liệu</span>' : '') +
          '</button>';
      });
      html += '</div>';
    });
    html += '</div><div class="dt-actions dt-actions--end">' +
      '<div class="dt-promise"><span>Làm xong trong khoảng 2 phút</span><span>Bạn kiểm tra trước khi dùng</span><span>Không cần tài khoản</span></div>' +
      '<button type="button" class="dt-btn dt-btn--primary" data-dt-start>Bắt đầu: ' + esc(S.th.ten) + ' →</button></div>';
    view.innerHTML = html;

    view.querySelectorAll('.dt-case').forEach(function (b) {
      b.addEventListener('click', function () {
        var n = findNghe(b.dataset.nghe);
        resetTh(n, findTh(n, b.dataset.th));
        history.replaceState(null, '', '#' + n.id);
        renderChon();
        var again = view.querySelector('.dt-case[data-th="' + b.dataset.th + '"]');
        if (again) again.focus();
      });
      b.addEventListener('keydown', function (e) {
        if (['ArrowDown', 'ArrowUp', 'ArrowLeft', 'ArrowRight'].indexOf(e.key) === -1) return;
        e.preventDefault();
        var all = [].slice.call(view.querySelectorAll('.dt-case'));
        var i = all.indexOf(b);
        var next = all[(i + (e.key === 'ArrowDown' || e.key === 'ArrowRight' ? 1 : all.length - 1)) % all.length];
        next.click();
      });
    });
    view.querySelector('[data-dt-start]').addEventListener('click', function () {
      if (!S.chon) resetTh(S.nghe, S.th);
      go('ban');
    });
  }

  /* ── Bước 2: bàn làm việc ── */
  function renderInput() {
    var d = S.th.dauVao;
    var h = '';
    if (d.files) {
      h += '<div class="dt-files">' + d.files.map(function (f) {
        return '<div class="dt-file"><span class="dt-file-ic" aria-hidden="true"></span><span class="dt-file-name">' + esc(f.ten) +
          '</span><span class="dt-file-meta">' + esc(f.meta) + '</span>' +
          (f.trich ? '<span class="dt-file-quote">' + esc(f.trich) + '</span>' : '') + '</div>';
      }).join('') + '</div>';
    }
    if (d.fields) {
      h += '<dl class="dt-fields">' + d.fields.map(function (f) {
        return '<dt>' + esc(f[0]) + '</dt><dd>' + esc(f[1]) + '</dd>';
      }).join('') + '</dl>';
    }
    if (d.raw) {
      h += '<div class="dt-raw' + (S.anDanh ? ' is-clean' : '') + '"><span class="dt-k">' + (S.anDanh ? 'Ghi chú đã ẩn danh' : 'Ghi chú của bạn') + '</span><p>' +
        esc(S.anDanh ? S.th.baoVe.sau : d.raw) + '</p></div>';
    }
    if (S.th.baoVe && d.files && S.anDanh) {
      h += '<p class="dt-cleaned">Đã ẩn CCCD và số điện thoại ở trang 2 trước khi xử lý.</p>';
    }
    h += '<div class="dt-ask"><span class="dt-k">Bạn yêu cầu</span><p>“' + esc(d.yeuCau) + '”</p></div>';
    h += '<div class="dt-knob" role="radiogroup" aria-label="' + esc(S.th.nut.ten) + '"><span class="dt-knob-k">' + esc(S.th.nut.ten) + '</span>' +
      S.th.nut.chon.map(function (c) {
        var on = c.id === S.chon;
        return '<button type="button" class="dt-chip' + (on ? ' is-on' : '') + '" role="radio" aria-checked="' + on + '" data-chon="' + c.id + '">' + esc(c.label) + '</button>';
      }).join('') + '</div>';
    return h;
  }

  function renderBan() {
    var t = S.th;
    view.innerHTML =
      '<div class="dt-view-head dt-view-head--row"><div><span class="dt-crumb">' + esc(S.nghe.ten) + '</span>' +
      '<h2 class="dt-h" tabindex="-1" data-dt-focus>' + esc(t.ten) + '</h2></div>' +
      '<button type="button" class="dt-link" data-dt-back>← Chọn việc khác</button></div>' +
      '<div class="dt-bench">' +
      '<section class="dt-pane" aria-labelledby="dt-in-h"><div class="dt-pane-head"><h3 id="dt-in-h">Bạn đưa vào</h3><span class="dt-badge">Dữ liệu mẫu</span></div>' +
      '<div data-dt-input>' + renderInput() + '</div>' +
      '<button type="button" class="dt-btn dt-btn--primary dt-run" data-dt-run>Giao cho AI</button></section>' +
      '<section class="dt-pane dt-pane--out" aria-labelledby="dt-out-h" aria-live="polite"><div class="dt-pane-head"><h3 id="dt-out-h">AI Lành Nghề xử lý</h3><span class="dt-badge">Bản mẫu</span></div>' +
      '<div data-dt-out></div></section></div>';

    view.querySelector('[data-dt-back]').addEventListener('click', function () { go('chon'); });
    bindKnobs();
    view.querySelector('[data-dt-run]').addEventListener('click', run);
    paintOut();
  }

  function bindKnobs() {
    view.querySelectorAll('.dt-chip').forEach(function (b) {
      b.addEventListener('click', function () {
        if (S.chon === b.dataset.chon) return;
        S.chon = b.dataset.chon;
        clearTimers();
        S.trangThai = 'cho';
        S.sua = false;
        S.tick = {};
        S.moGoiY = false;
        view.querySelector('[data-dt-input]').innerHTML = renderInput();
        bindKnobs();
        var again = view.querySelector('.dt-chip[data-chon="' + S.chon + '"]');
        if (again) again.focus();
        paintOut();
      });
    });
  }

  function run() {
    if (S.trangThai === 'dang-chay') return;
    if (S.th.baoVe && !S.anDanh) { S.trangThai = 'bao-ve'; paintOut(); return; }
    clearTimers();
    S.trangThai = 'dang-chay';
    S.sua = false;
    S.tick = {};
    S.moGoiY = false;
    paintOut(0);
    var n = S.th.xuLy.length;
    for (var i = 1; i <= n; i++) {
      (function (k) {
        timers.push(setTimeout(function () {
          if (k < n) paintOut(k);
          else { S.trangThai = 'xong'; paintOut(); }
        }, STEP_MS * k));
      })(i);
    }
  }

  function pipeline(done) {
    return '<ol class="dt-pipe">' + S.th.xuLy.map(function (s, i) {
      var st = i < done ? 'is-done' : i === done ? 'is-now' : '';
      return '<li class="' + st + '"><span class="dt-pipe-dot" aria-hidden="true"></span>' + esc(s) + '</li>';
    }).join('') + '</ol>';
  }

  function paintOut(done) {
    var box = view.querySelector('[data-dt-out]');
    var runBtn = view.querySelector('[data-dt-run]');
    if (!box) return;
    runBtn.disabled = S.trangThai === 'dang-chay';
    runBtn.textContent = S.trangThai === 'xong' ? 'Giao lại cho AI' : S.trangThai === 'dang-chay' ? 'AI đang xử lý…' : 'Giao cho AI';

    if (S.trangThai === 'cho') {
      box.innerHTML = '<div class="dt-idle"><p>Bấm <b>Giao cho AI</b> để xem AI xử lý việc này.</p>' + pipeline(-1) + '</div>';
      return;
    }
    if (S.trangThai === 'bao-ve') {
      var b = S.th.baoVe;
      box.innerHTML = '<div class="dt-guard" role="alert"><p class="dt-guard-title">AI dừng lại trước khi xử lý</p><p>' + esc(b.canhBao) + '</p>' +
        '<div class="dt-diff"><div><span class="dt-k">Trước</span><p class="dt-diff-before">' + esc(b.truoc) + '</p></div>' +
        '<div><span class="dt-k">Sau khi ẩn</span><p class="dt-diff-after">' + esc(b.sau) + '</p></div></div>' +
        '<div class="dt-actions"><button type="button" class="dt-btn dt-btn--primary" data-dt-redact>' + esc(b.nut) + '</button>' +
        '<button type="button" class="dt-link" data-dt-cancel>Để sau</button></div></div>';
      box.querySelector('[data-dt-redact]').addEventListener('click', function () {
        S.anDanh = true;
        view.querySelector('[data-dt-input]').innerHTML = renderInput();
        bindKnobs();
        run();
      });
      box.querySelector('[data-dt-cancel]').addEventListener('click', function () { S.trangThai = 'cho'; paintOut(); });
      box.querySelector('[data-dt-redact]').focus();
      return;
    }
    if (S.trangThai === 'dang-chay') {
      box.innerHTML = '<div class="dt-running">' + pipeline(done || 0) + '<p class="dt-running-note">Đang tạo bản nháp…</p></div>';
      return;
    }
    box.innerHTML = pipeline(S.th.xuLy.length) + '<div class="dt-draft"><span class="dt-k">Bản nháp</span>' +
      renderOutput(S.th.ketQua(S.chon, S.sua)) + '</div>' +
      '<div class="dt-actions dt-actions--end"><p class="dt-hint">AI tạo bản nháp. Người làm nghề kiểm tra trước khi dùng.</p>' +
      '<button type="button" class="dt-btn dt-btn--primary" data-dt-check>Kiểm tra trước khi dùng →</button></div>';
    box.querySelector('[data-dt-check]').addEventListener('click', function () { go('kiem-tra'); });
  }

  /* ── hiển thị kết quả ── */
  function renderOutput(o) {
    var h = '';
    if (o.type === 'table') {
      var numCols = o.numCols || (o.num ? o.head.map(function (_, i) { return i; }).slice(1) : []);
      h += '<div class="dt-table-wrap"><table class="dt-table"><thead><tr>' + o.head.map(function (x, i) {
        return '<th' + (numCols.indexOf(i) !== -1 ? ' class="is-num"' : '') + ' scope="col">' + esc(x) + '</th>';
      }).join('') + '</tr></thead><tbody>' + o.rows.map(function (r) {
        return '<tr>' + r.map(function (c, i) {
          c = cell(c);
          var cls = [];
          if (numCols.indexOf(i) !== -1) cls.push('is-num');
          if (c.changed) cls.push('is-changed');
          if (c.strong) cls.push('is-strong');
          if (i > 0 && String(c.v).length > 22) cls.push('is-wide');
          return (i === 0 ? '<th scope="row"' : '<td data-label="' + esc(o.head[i]) + '"') + (cls.length ? ' class="' + cls.join(' ') + '"' : '') + '>' + esc(c.v) + (i === 0 ? '</th>' : '</td>');
        }).join('') + '</tr>';
      }).join('') + '</tbody></table></div>';
    } else if (o.type === 'letter') {
      h += '<div class="dt-letter">' + (o.subject ? '<p class="dt-letter-subject"><span>Tiêu đề:</span> ' + esc(o.subject) + '</p>' : '') +
        o.paras.map(function (p) { return '<p' + (p.changed ? ' class="is-changed"' : '') + '>' + esc(p.text) + '</p>'; }).join('') + '</div>';
    } else if (o.type === 'list') {
      h += '<dl class="dt-notes">' + o.items.map(function (it) {
        return '<dt>' + esc(it.k) + '</dt><dd>' + esc(it.text) + '</dd>';
      }).join('') + '</dl>';
    } else if (o.type === 'questions') {
      h += '<div class="dt-qs">' + o.groups.map(function (g) {
        return '<div class="dt-qgroup"><p class="dt-qtitle">' + esc(g.title) + '</p><ol>' + g.items.map(function (it) {
          return '<li value="' + it.n + '"><span class="dt-q">' + esc(it.q) + '</span><span class="dt-a' + (it.changed ? ' is-changed' : '') + '">Đáp án: ' + esc(it.a) + '</span></li>';
        }).join('') + '</ol></div>';
      }).join('') + '</div>';
    }
    if (o.summary) h += '<p class="dt-summary' + (o.summary.changed ? ' is-changed' : '') + '">' + esc(o.summary.text) + '</p>';
    if (o.note) h += '<p class="dt-fixnote">' + esc(o.note) + '</p>';
    return h;
  }

  /* ── Bước 3: kiểm tra ── */
  function allTicked() {
    return S.th.kiemTra.every(function (_, i) { return S.tick[i]; });
  }

  function renderKiem() {
    var t = S.th;
    view.innerHTML =
      '<div class="dt-view-head dt-view-head--row"><div><span class="dt-crumb">' + esc(S.nghe.ten) + ' · ' + esc(t.ten) + '</span>' +
      '<h2 class="dt-h" tabindex="-1" data-dt-focus>Kiểm tra trước khi dùng</h2>' +
      '<p class="dt-sub">Đây là checklist trong sổ tay của gói. Đọc bản nháp và tick từng mục như khi bạn xem lại việc của đồng nghiệp.</p></div>' +
      '<button type="button" class="dt-link" data-dt-back>← Chỉnh lại đầu vào</button></div>' +
      '<div class="dt-review">' +
      '<section class="dt-pane" aria-labelledby="dt-draft-h"><div class="dt-pane-head"><h3 id="dt-draft-h">Bản nháp của AI</h3><span class="dt-badge">Bản mẫu</span></div>' +
      '<div data-dt-draft></div></section>' +
      '<section class="dt-pane" aria-labelledby="dt-check-h"><div class="dt-pane-head"><h3 id="dt-check-h">Checklist</h3><span class="dt-count" data-dt-count></span></div>' +
      '<ul class="dt-checks" data-dt-checks></ul>' +
      '<div class="dt-actions"><button type="button" class="dt-btn dt-btn--primary" data-dt-use>Dùng kết quả này</button>' +
      '<p class="dt-hint" data-dt-use-hint></p></div></section></div>';

    view.querySelector('[data-dt-back]').addEventListener('click', function () { go('ban'); });
    view.querySelector('[data-dt-use]').addEventListener('click', function () { if (allTicked()) go('ket-qua'); });
    paintKiem();
  }

  function paintKiem(focusIdx) {
    var t = S.th;
    view.querySelector('[data-dt-draft]').innerHTML = renderOutput(t.ketQua(S.chon, S.sua));
    var n = t.kiemTra.length;
    var done = t.kiemTra.filter(function (_, i) { return S.tick[i]; }).length;
    view.querySelector('[data-dt-count]').textContent = done + ' / ' + n;

    var list = view.querySelector('[data-dt-checks]');
    list.innerHTML = t.kiemTra.map(function (c, i) {
      var on = !!S.tick[i];
      var hasErr = c.loi && !S.sua;
      var open = hasErr && S.moGoiY;
      var h = '<li class="dt-check' + (on ? ' is-on' : '') + (open ? ' is-open' : '') + (c.loi && S.sua ? ' is-fixed' : '') + '">' +
        '<button type="button" class="dt-check-btn" data-i="' + i + '" role="checkbox" aria-checked="' + on + '"' +
        (hasErr ? ' aria-expanded="' + open + '" aria-controls="dt-hint-' + i + '"' : '') + '>' +
        '<span class="dt-box" aria-hidden="true">' + (on ? '✓' : '') + '</span><span>' + esc(c.ten) + '</span></button>';
      if (open) {
        var goiY = typeof c.loi.goiY === 'function' ? c.loi.goiY(S.chon) : c.loi.goiY;
        h += '<div class="dt-issue" id="dt-hint-' + i + '"><p class="dt-issue-title">Chưa tick được mục này</p><p>' + esc(goiY) + '</p>' +
          '<button type="button" class="dt-btn dt-btn--small" data-dt-fix="' + i + '">' + esc(c.loi.nut) + '</button></div>';
      }
      if (c.loi && S.sua) h += '<p class="dt-fixed">' + esc(c.loi.daSua) + '</p>';
      return h + '</li>';
    }).join('');

    var use = view.querySelector('[data-dt-use]');
    var ok = allTicked();
    use.disabled = !ok;
    view.querySelector('[data-dt-use-hint]').textContent = ok
      ? 'Đủ checklist. Kết quả sẵn sàng để dùng.'
      : 'Tick đủ ' + n + ' mục trước khi dùng. Mục nào chưa ổn thì bấm vào để xem.';

    list.querySelectorAll('.dt-check-btn').forEach(function (b) {
      b.addEventListener('click', function () {
        var i = +b.dataset.i;
        var c = t.kiemTra[i];
        if (c.loi && !S.sua) { S.moGoiY = !S.moGoiY; paintKiem(i); return; }
        if (c.loi && S.sua) return;
        S.tick[i] = !S.tick[i];
        paintKiem(i);
      });
    });
    list.querySelectorAll('[data-dt-fix]').forEach(function (b) {
      b.addEventListener('click', function () {
        var i = +b.dataset.dtFix;
        S.sua = true;
        S.tick[i] = true;
        S.moGoiY = false;
        paintKiem(i);
        var changed = view.querySelector('[data-dt-draft] .is-changed');
        if (changed && changed.scrollIntoView && window.innerWidth < 900) changed.scrollIntoView({ block: 'center', behavior: reduce ? 'auto' : 'smooth' });
      });
    });
    if (focusIdx != null) {
      var fb = list.querySelector('.dt-check-btn[data-i="' + focusIdx + '"]');
      var fx = list.querySelector('[data-dt-fix="' + focusIdx + '"]');
      (fx || fb) && (fx || fb).focus();
    }
  }

  /* ── Bước 4: kết quả ── */
  function renderXong() {
    var t = S.th, n = S.nghe;
    var others = n.tinhHuong.filter(function (x) { return x !== t; });
    var otherNghe = NGHE.filter(function (x) { return x !== n; })[0];
    view.innerHTML =
      '<div class="dt-done">' +
      '<div class="dt-done-main"><span class="dt-crumb">' + esc(n.ten) + '</span>' +
      '<h2 class="dt-h" tabindex="-1" data-dt-focus>Xong việc: ' + esc(t.ten) + '</h2>' +
      '<div class="dt-saved"><span class="dt-k">Việc này thường mất</span><p class="dt-saved-big">' + esc(t.tietKiem.truoc) + ' <span>→ ' + esc(t.tietKiem.sau) + ' với gói nghề</span></p>' +
      '<p class="dt-saved-note">Ước lượng từ tình huống mẫu, không phải cam kết.</p></div>' +
      '<div class="dt-caught"><p class="dt-caught-title">Bạn vừa bắt được 1 lỗi trước khi dùng</p><p>' + esc(t.baiHoc) + '</p>' +
      '<p class="dt-caught-foot">Đây là lý do mỗi gói nghề đi kèm checklist: AI làm nhanh phần lặp lại, người làm nghề giữ quyền quyết định.</p></div>' +
      '<p class="dt-mock-note">Bạn vừa xem bản mô phỏng: kết quả được soạn sẵn, không có AI thật xử lý. Với gói nghề, bạn làm việc thật trên chính tài khoản AI của mình.</p>' +
      '</div>' +
      '<div class="dt-next"><h3 class="dt-next-h">Bước tiếp theo</h3>' +
      n.tiepTheo.map(function (o) {
        return '<a class="dt-next-opt' + (o.chinh ? ' is-main' : '') + '" href="' + esc(o.href) + '"><span class="dt-next-t">' + esc(o.ten) + ' →</span><span class="dt-next-d">' + esc(o.moTa) + '</span></a>';
      }).join('') +
      '<div class="dt-again"><span class="dt-k">Thử thêm</span>' +
      others.map(function (x) { return '<button type="button" class="dt-link" data-again="' + n.id + '/' + x.id + '">' + esc(x.ten) + '</button>'; }).join('') +
      '<button type="button" class="dt-link" data-again="' + otherNghe.id + '">Việc của nghề ' + esc(otherNghe.ten) + '</button></div>' +
      '</div></div>';

    view.querySelectorAll('[data-again]').forEach(function (b) {
      b.addEventListener('click', function () {
        var p = b.dataset.again.split('/');
        var nn = findNghe(p[0]);
        var tt = p[1] ? findTh(nn, p[1]) : nn.tinhHuong[0];
        resetTh(nn, tt);
        go(p[1] ? 'ban' : 'chon');
      });
    });
  }

  /* ── khởi động ── */
  var start = fromHash();
  if (!S.chon) resetTh(S.nghe, S.th);
  history.replaceState(null, '', location.hash ? hashFor(start.step) : location.pathname + location.search);
  render(start.step);
})();
