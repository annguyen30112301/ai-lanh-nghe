/* Nghề tiếp theo: lọc, tìm kiếm và khung xem trước tình huống mẫu. Dữ liệu: window.NGHE_DATA */
(function () {
  'use strict';

  var DATA = window.NGHE_DATA || [];
  var byId = {};
  DATA.forEach(function (p) { byId[p.id] = p; });

  var section = document.querySelector('[data-nghe-tiep-theo]');
  var drawer = document.getElementById('nt-drawer');
  var overlay = document.getElementById('nt-overlay');
  if (!drawer || !overlay) return;

  function fold(s) {
    return (s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd');
  }
  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  }

  /* ── lọc & tìm ── */
  if (section) {
    var cards = [].slice.call(section.querySelectorAll('.nt-card'));
    var input = section.querySelector('#nt-q');
    var result = section.querySelector('[data-nt-result]');
    var empty = section.querySelector('[data-nt-empty]');
    var state = { status: 'all', group: 'all', q: '' };

    function apply() {
      var q = fold(state.q.trim());
      var shown = 0;
      cards.forEach(function (c) {
        var ok = (state.status === 'all' || c.dataset.status === state.status) &&
          (state.group === 'all' || c.dataset.group === state.group) &&
          (!q || c.dataset.search.indexOf(q) !== -1);
        c.hidden = !ok;
        if (ok) shown++;
      });
      if (result) result.textContent = 'Đang hiện ' + shown + ' / ' + cards.length + ' gói nghề';
      if (empty) {
        empty.hidden = shown > 0;
        var qEl = empty.querySelector('[data-nt-q]');
        if (qEl) qEl.textContent = state.q.trim();
      }
    }

    section.querySelectorAll('[data-filter]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var kind = btn.dataset.filter;
        state[kind] = btn.dataset.value;
        section.querySelectorAll('[data-filter="' + kind + '"]').forEach(function (b) {
          b.setAttribute('aria-pressed', b === btn ? 'true' : 'false');
        });
        apply();
      });
    });
    if (input) input.addEventListener('input', function () { state.q = input.value; apply(); });
    apply();
  }

  /* ── khung xem trước ── */
  var formUrl = (section && section.dataset.formUrl) || '';
  var lastFocus = null;
  var openId = null;

  var ICON_LOCK = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="4" y="10.5" width="16" height="10" rx="2"/><path d="M8 10.5V7.5a4 4 0 0 1 8 0v3"/></svg>';
  var ICON_SHIELD = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3l7 3v5c0 4.6-3 8.4-7 10-4-1.6-7-5.4-7-10V6z"/><path d="M9 12l2 2 4-4"/></svg>';

  function statusLabel(s) { return s === 'dong-goi' ? 'Đang đóng gói' : 'Sắp mở'; }

  function renderCase(t, i, open) {
    var li = el('li', 'nt-case' + (open ? ' is-open' : ''));
    var bodyId = 'nt-case-' + i;
    var btn = el('button', 'nt-case-btn');
    btn.type = 'button';
    btn.setAttribute('aria-expanded', open ? 'true' : 'false');
    btn.setAttribute('aria-controls', bodyId);
    btn.appendChild(el('span', 'nt-case-no', String(i + 1).padStart(2, '0')));
    btn.appendChild(el('span', '', t.ten));
    btn.appendChild(el('span', 'nt-type', t.loai));

    var body = el('div', 'nt-case-body');
    body.id = bodyId;
    body.hidden = !open;

    var inBox = el('div', 'nt-io');
    inBox.appendChild(el('span', 'nt-io-k', 'Bạn đưa vào'));
    inBox.appendChild(el('p', 'nt-quote', '“' + t.dauVao + '”'));

    var stepBox = el('div', 'nt-io');
    stepBox.appendChild(el('span', 'nt-io-k', 'AI xử lý'));
    var steps = el('ol', 'nt-steps');
    t.xuLy.forEach(function (s) { var li2 = el('li'); li2.appendChild(el('span', '', s)); steps.appendChild(li2); });
    stepBox.appendChild(steps);

    var outBox = el('div', 'nt-io');
    outBox.appendChild(el('span', 'nt-io-k', 'Kết quả mẫu'));
    var ul = el('ul', 'nt-out');
    t.dauRa.forEach(function (s) { ul.appendChild(el('li', '', s)); });
    outBox.appendChild(ul);

    body.appendChild(inBox);
    body.appendChild(stepBox);
    body.appendChild(outBox);
    if (t.loai === 'Ra quyết định') {
      body.appendChild(el('p', 'nt-decide', 'AI đưa ra phương án và lý do. Người làm nghề là người quyết định.'));
    }

    btn.addEventListener('click', function () {
      var willOpen = btn.getAttribute('aria-expanded') !== 'true';
      drawer.querySelectorAll('.nt-case').forEach(function (other) {
        other.classList.remove('is-open');
        other.querySelector('.nt-case-btn').setAttribute('aria-expanded', 'false');
        other.querySelector('.nt-case-body').hidden = true;
      });
      if (willOpen) {
        li.classList.add('is-open');
        btn.setAttribute('aria-expanded', 'true');
        body.hidden = false;
      }
    });

    li.appendChild(btn);
    li.appendChild(body);
    return li;
  }

  function render(p) {
    drawer.querySelector('[data-nt-group]').textContent = p.nhom + ' · ' + statusLabel(p.trangThai);
    drawer.querySelector('#nt-d-title').textContent = p.ten;
    drawer.querySelector('[data-nt-desc]').textContent = p.moTa;

    var list = drawer.querySelector('[data-nt-cases]');
    list.innerHTML = '';
    p.tinhHuong.forEach(function (t, i) { list.appendChild(renderCase(t, i, i === 0)); });

    var guard = drawer.querySelector('[data-nt-guard]');
    guard.innerHTML = '';
    guard.hidden = !p.luuY;
    if (p.luuY) {
      guard.insertAdjacentHTML('beforeend', ICON_SHIELD);
      var txt = el('div');
      txt.appendChild(el('b', '', 'Bảo vệ dữ liệu trong gói này'));
      txt.appendChild(document.createTextNode(p.luuY));
      guard.appendChild(txt);
    }

    var building = drawer.querySelector('[data-nt-building]');
    building.innerHTML = ICON_LOCK;
    building.appendChild(el('span', '', 'Gói nghề đang được xây dựng · dự kiến ' + p.duKien));

    var cta = drawer.querySelector('[data-nt-cta]');
    var note = drawer.querySelector('[data-nt-cta-note]');
    if (formUrl) {
      cta.href = formUrl.replace('{nghe}', encodeURIComponent(p.ten));
      cta.removeAttribute('aria-disabled');
      cta.tabIndex = 0;
      note.textContent = 'Mở biểu mẫu Google, đã điền sẵn tên nghề ' + p.ten + '.';
    } else {
      cta.removeAttribute('href');
      cta.setAttribute('aria-disabled', 'true');
      cta.tabIndex = -1;
      note.textContent = 'Biểu mẫu đăng ký sẽ mở trong thời gian tới.';
    }
  }

  function focusables() {
    return [].slice.call(drawer.querySelectorAll('button, a[href], input, [tabindex]:not([tabindex="-1"])'))
      .filter(function (n) { return !n.hidden && n.offsetParent !== null; });
  }

  function open(id, opts) {
    var p = byId[id];
    if (!p) return;
    if (!drawer.hidden && openId === id) return;
    if (drawer.hidden) lastFocus = document.activeElement;
    openId = id;
    render(p);
    overlay.hidden = false;
    drawer.hidden = false;
    drawer.classList.remove('is-open');
    void drawer.offsetWidth;
    drawer.classList.add('is-open');
    document.body.classList.add('nt-lock');
    drawer.querySelector('.nt-d-body').scrollTop = 0;
    drawer.querySelector('.nt-close').focus();
    if (!(opts && opts.fromHash)) history.replaceState(null, '', '#xem-truoc/' + id);
  }

  function close() {
    if (drawer.hidden) return;
    drawer.hidden = true;
    overlay.hidden = true;
    openId = null;
    document.body.classList.remove('nt-lock');
    if (location.hash.indexOf('#xem-truoc/') === 0) history.replaceState(null, '', location.pathname + location.search);
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }

  document.addEventListener('click', function (e) {
    var trigger = e.target.closest('[data-preview]');
    if (trigger) { e.preventDefault(); open(trigger.dataset.preview); }
  });
  overlay.addEventListener('click', close);
  drawer.querySelector('.nt-close').addEventListener('click', close);
  document.addEventListener('keydown', function (e) {
    if (drawer.hidden) return;
    if (e.key === 'Escape') { e.preventDefault(); close(); return; }
    if (e.key === 'Tab') {
      var f = focusables();
      if (!f.length) return;
      var first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  });

  function fromHash() {
    var m = location.hash.match(/^#xem-truoc\/([\w-]+)$/);
    if (m && byId[m[1]]) open(m[1], { fromHash: true });
  }
  window.addEventListener('hashchange', fromHash);
  fromHash();
})();
