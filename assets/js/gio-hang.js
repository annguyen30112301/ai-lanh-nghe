/*
 * AI Lành Nghề — giỏ hàng (Pha 2)
 *
 * - Số nghề trong giỏ trên menu, nút [data-them-gio="nghe-id"] ở mọi trang.
 * - Trang gio-hang.html ([data-gio-hang]) và bộ ước tính doanh nghiệp trên Bảng giá ([data-uoc-tinh]).
 * Mọi con số do assets/js/tinh-tien.js tính; tệp này chỉ giữ lựa chọn của khách và hiển thị.
 * Giỏ lưu trong trình duyệt; mỗi lần mở đều tính lại theo bảng giá hiện hành, không tin giá đã lưu.
 */
(function () {
  'use strict';

  var KHOA = 'aln-gio-hang-v1';
  var TT = window.TinhTien || null;

  function $(sel, root) { return (root || document).querySelector(sel); }
  function $$(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }
  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function tien(n) { return String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, '.') + ' đ'; }
  function tyLe(p) { return String(Math.round(p * 100) / 100).replace('.', ',') + '%'; }
  function ngayVN(s) { var p = s.split('-'); return p[2] + '/' + p[1] + '/' + p[0]; }
  function homNay() {
    var d = new Date();
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  }

  /* ───────── lưu giỏ ───────── */

  function gioMoi() {
    return { loai: 'CA_NHAN', caNhan: { nghe: [], ngheChinh: null, tinhChinh: [] }, dn: { nhom: [], tinhChinh: [] }, soNhom: 0 };
  }

  function docGio() {
    var g = null;
    try { g = JSON.parse(localStorage.getItem(KHOA)); } catch (e) { g = null; }
    if (!g || (g.loai !== 'CA_NHAN' && g.loai !== 'DOANH_NGHIEP') || !g.caNhan || !g.dn) return gioMoi();
    return lamSach(g);
  }

  // Bỏ nghề không còn trong danh mục hoặc chưa có giá.
  function lamSach(g) {
    if (!TT) return g;
    var coGia = function (id) { var n = timNghe(id); return n && n.goiNghe != null; };
    g.caNhan.nghe = g.caNhan.nghe.filter(coGia);
    if (g.caNhan.nghe.indexOf(g.caNhan.ngheChinh) < 0) g.caNhan.ngheChinh = g.caNhan.nghe[0] || null;
    g.caNhan.tinhChinh = g.caNhan.tinhChinh.filter(function (id) { return g.caNhan.nghe.indexOf(id) >= 0; });
    g.dn.nhom.forEach(function (n) {
      n.nghe = n.nghe.filter(coGia);
      if (n.nghe.indexOf(n.ngheChinh) < 0) n.ngheChinh = n.nghe[0] || null;
    });
    var ngheDN = ngheTrongDN(g);
    g.dn.tinhChinh = g.dn.tinhChinh.filter(function (id) { return ngheDN.indexOf(id) >= 0; });
    return g;
  }

  function luuGio(g) {
    try { localStorage.setItem(KHOA, JSON.stringify(g)); } catch (e) { /* chế độ riêng tư: giỏ chỉ sống trong trang */ }
    capNhatDem(g);
  }

  function ngheTrongDN(g) {
    var ds = [];
    g.dn.nhom.forEach(function (n) { n.nghe.forEach(function (id) { if (ds.indexOf(id) < 0) ds.push(id); }); });
    return ds;
  }

  function soNghe(g) {
    return g.loai === 'CA_NHAN' ? g.caNhan.nghe.length : g.dn.nhom.reduce(function (a, n) { return a + n.nghe.length; }, 0);
  }

  function coTrongGio(g, id) {
    return g.loai === 'CA_NHAN' ? g.caNhan.nghe.indexOf(id) >= 0 : ngheTrongDN(g).indexOf(id) >= 0;
  }

  function timNghe(id) {
    if (!TT) return null;
    for (var i = 0; i < TT.CAU_HINH.nghe.length; i++) if (TT.CAU_HINH.nghe[i].id === id) return TT.CAU_HINH.nghe[i];
    return null;
  }

  function themNhom(g, seat) {
    g.soNhom += 1;
    var n = { ma: 'N' + g.soNhom, ten: 'Nhóm ' + g.soNhom, seat: seat || 10, nghe: [], ngheChinh: null };
    g.dn.nhom.push(n);
    return n;
  }

  // Đổi loại giỏ: hỏi trước nếu giỏ đang có nghề.
  function doiLoai(g, loai) {
    if (g.loai === loai) return true;
    var n = soNghe(g);
    if (n > 0) {
      var ten = g.loai === 'CA_NHAN' ? 'cá nhân' : 'doanh nghiệp';
      if (!window.confirm('Giỏ ' + ten + ' đang có ' + n + ' nghề. Chuyển loại giỏ sẽ xoá giỏ hiện tại. Tiếp tục?')) return false;
    }
    var moi = gioMoi();
    moi.loai = loai;
    Object.keys(moi).forEach(function (k) { g[k] = moi[k]; });
    return true;
  }

  /* ───────── số trên menu, nút thêm vào giỏ ───────── */

  function capNhatDem(g) {
    var n = soNghe(g);
    $$('[data-gio-dem]').forEach(function (el) {
      el.textContent = n;
      el.hidden = n === 0;
    });
    $$('.nav-cart').forEach(function (a) {
      a.setAttribute('aria-label', n ? 'Giỏ hàng, ' + n + ' nghề' : 'Giỏ hàng, đang trống');
    });
    $$('[data-them-gio]').forEach(function (b) { danhDauNut(b, g); });
  }

  function danhDauNut(b, g) {
    var id = b.getAttribute('data-them-gio');
    if (!b.hasAttribute('data-nhan-goc')) b.setAttribute('data-nhan-goc', b.textContent.trim());
    var co = coTrongGio(g, id);
    b.classList.toggle('is-in-cart', co);
    b.textContent = co ? 'Đã có trong giỏ · Xem giỏ →' : b.getAttribute('data-nhan-goc');
  }

  document.addEventListener('click', function (e) {
    var b = e.target.closest('[data-them-gio]');
    if (!b) return;
    e.preventDefault();
    var g = docGio();
    var id = b.getAttribute('data-them-gio');
    var nghe = timNghe(id);
    if (coTrongGio(g, id)) { location.href = 'gio-hang.html'; return; }
    if (!nghe || nghe.goiNghe == null) return;
    if (g.loai === 'CA_NHAN') {
      g.caNhan.nghe.push(id);
      if (!g.caNhan.ngheChinh) g.caNhan.ngheChinh = id;
    } else {
      var nhom = g.dn.nhom[0] || themNhom(g, 10);
      nhom.nghe.push(id);
      if (!nhom.ngheChinh) nhom.ngheChinh = id;
    }
    luuGio(g);
    var live = $('[data-gio-thong-bao]');
    if (live) live.textContent = 'Đã thêm ' + nghe.ten + ' vào giỏ.';
  });

  window.addEventListener('storage', function (e) { if (e.key === KHOA) capNhatDem(docGio()); });

  /* ───────── gọi bộ tính tiền ───────── */

  function baoGia(g) {
    if (g.loai === 'CA_NHAN') {
      if (!g.caNhan.nghe.length) return null;
      return TT.muaMoi({
        loaiKhach: 'CA_NHAN', ngayBatDau: homNay(),
        nghe: g.caNhan.nghe, ngheChinh: g.caNhan.ngheChinh, tinhChinh: g.caNhan.tinhChinh
      }).don;
    }
    var nhom = g.dn.nhom.filter(function (n) { return n.nghe.length; });
    if (!nhom.length) return null;
    nhom.forEach(function (n) {
      if (!Number.isInteger(n.seat) || n.seat < 1) throw loiHienThi('Nhập số seat từ 1 trở lên cho ' + (n.ten || 'nhóm seat') + '.');
    });
    return TT.muaMoi({
      loaiKhach: 'DOANH_NGHIEP', ngayBatDau: homNay(),
      nhomSeat: nhom.map(function (n) { return { ma: n.ma, ten: n.ten || 'Nhóm seat', seat: n.seat, nghe: n.nghe, ngheChinh: n.ngheChinh }; }),
      tinhChinh: g.dn.tinhChinh
    }).don;
  }

  function loiHienThi(msg) { var e = new Error(msg); e.hienThi = true; return e; }

  function bacKeTiep(tongSeat) {
    var bac = TT.CAU_HINH.quyMo.slice().reverse(); // tăng dần
    for (var i = 0; i < bac.length; i++) if (bac[i][0] > tongSeat) return { tuSeat: bac[i][0], tyLe: bac[i][1] };
    return null;
  }

  function uuDaiMoRong(thuTu) {
    var b = TT.CAU_HINH.moRongNghe;
    return b[Math.min(thuTu, b.length) - 1];
  }

  function uuDaiTinhChinh(so) {
    var b = TT.CAU_HINH.tinhChinh;
    for (var i = 0; i < b.length; i++) if (so >= b[i][0]) return b[i][1];
    return 0;
  }

  /* ───────── hoá đơn: mỗi dòng kể lại cách tính ───────── */

  function dongHtml(d, laDN) {
    var lyDo = d.giam.map(function (x) {
      return '<li><span>' + esc(x.ten.charAt(0).toUpperCase() + x.ten.slice(1)) + ' −' + x.tyLe + '%</span><span>' + esc(x.lyDo) + '</span></li>';
    }).join('');
    var buoc = d.buoc.map(function (b, i) {
      return '<li' + (i === d.buoc.length - 1 && d.buoc.length > 1 ? ' class="is-res"' : '') + '><span>' + esc(b.nhan) +
        (b.lyDo ? '<small>' + esc(b.lyDo) + '</small>' : '') + '</span><span class="gh-v">' + tien(b.giaTri) + '</span></li>';
    }).join('');
    var nhan = d.thuTu === 1 ? 'Nghề chính #1' : 'Nghề #' + d.thuTu;
    return '<div class="gh-line">' +
      '<div class="gh-line-top"><b>' + esc(d.tenNghe) + '</b><span class="gh-amt">' + tien(d.thanhTien) + '</span></div>' +
      '<div class="gh-formula">' + esc(d.moTa) + '</div>' +
      '<div class="gh-meta"><span class="gh-pill">' + nhan + '</span>' +
      (d.mucGiam > 0 ? '<span class="gh-pill gh-pill--save">Giảm ' + tyLe(d.mucGiam) + (d.chamGioiHan ? ' · chạm giới hạn 50%' : '') + '</span>' : '<span class="gh-pill">Giá chuẩn</span>') +
      '</div>' +
      (d.giam.length ? '<ul class="gh-why">' + lyDo + '</ul>' : '') +
      '<details class="gh-steps"><summary>Xem từng bước</summary><ol>' + buoc + '</ol></details>' +
      '</div>';
  }

  function hoaDonHtml(don, g) {
    var laDN = don.loaiKhach === 'DOANH_NGHIEP';
    var h = '<div class="gh-receipt">';
    h += '<div class="gh-period">Hiệu lực <b>' + ngayVN(don.ky.batDau) + ' – ' + ngayVN(don.ky.hetHan) + '</b> · ' + don.ky.soNgay + ' ngày · mọi nghề' + (laDN ? ' và seat' : '') + ' dùng chung ngày hết hạn</div>';

    h += '<div class="gh-sec"><span>Phí hằng năm · Gói nghề</span><small>' + (laDN ? 'giá × seat × ưu đãi' : 'giá × ưu đãi mở rộng nghề') + '</small></div>';
    if (laDN) {
      var b = don.bacQuyMo;
      h += '<div class="gh-tier"><b>Ưu đãi quy mô −' + b.tyLe + '%</b><span>Tổng ' + b.tongSeat + ' seat thuộc bậc ' + b.tuSeat + (b.denSeat ? '–' + b.denSeat : '+') + ' · chỉ giảm phí Gói nghề</span></div>';
      var nhomDaIn = {};
      don.items.forEach(function (d) {
        if (!nhomDaIn[d.maNhom]) {
          nhomDaIn[d.maNhom] = true;
          var n = g.dn.nhom.filter(function (x) { return x.ma === d.maNhom; })[0];
          var so = don.items.filter(function (x) { return x.maNhom === d.maNhom; }).length;
          h += '<div class="gh-group-head">' + esc(n ? n.ten : d.maNhom) + ' · ' + d.seat + ' seat · ' + so + ' nghề</div>';
        }
        h += dongHtml(d, true);
      });
    } else {
      don.items.forEach(function (d) { h += dongHtml(d, false); });
    }

    var tc = don.tinhChinh;
    if (tc.soDichVu) {
      h += '<div class="gh-sec"><span>Phí một lần · Tinh chỉnh</span><small>' + tc.soDichVu + ' dịch vụ' + (laDN ? ' · không nhân seat' : '') + '</small></div>';
      h += '<div class="gh-line"><ol class="gh-steps-open">' +
        tc.dichVu.map(function (d) { return '<li><span>Tinh chỉnh ' + esc(d.tenNghe) + '</span><span class="gh-v">' + tien(d.donGia) + '</span></li>'; }).join('') +
        (tc.tyLeGiam ? '<li><span>× (1 − ' + tc.tyLeGiam + '%) ưu đãi Tinh chỉnh<small>' + esc(tc.lyDo) + '</small></span><span class="gh-v">− ' + tien(tc.tienGiam) + '</span></li>' : '') +
        '<li class="is-res"><span>Thành tiền Tinh chỉnh</span><span class="gh-v">' + tien(tc.thanhTien) + '</span></li></ol></div>';
    }

    h += '<div class="gh-totals">' +
      '<div><span>Phí hằng năm</span><span>' + tien(don.phiGoiNghe) + '</span></div>' +
      '<div><span>Phí một lần</span><span>' + tien(don.phiMotLan) + '</span></div>' +
      '<div><span>Tổng giá niêm yết</span><span>' + tien(don.tongNiemYet) + '</span></div>' +
      '<div><span>Tổng ưu đãi</span><span>− ' + tien(don.tongUuDai) + '</span></div>' +
      '<div class="gh-grand"><span>Tổng thanh toán lần này</span><span>' + tien(don.tongThanhToan) + '</span></div>' +
      '<div class="gh-renew"><span>Gia hạn ' + ngayVN(tiepNgay(don.ky.hetHan)) + ' dự kiến</span><span>' + tien(don.giaHanDuKien) + '</span></div>' +
      '</div>';
    h += '</div>';
    return h;
  }

  function tiepNgay(s) {
    var d = new Date(s + 'T00:00:00Z');
    d.setUTCDate(d.getUTCDate() + 1);
    return d.toISOString().slice(0, 10);
  }

  var GHI_CHU = '<ul class="gh-notes">' +
    '<li><b>Giá chưa gồm phí ChatGPT, Claude, Gemini, Copilot.</b> Bạn dùng tài khoản AI của mình và trả trực tiếp cho nhà cung cấp nền tảng.</li>' +
    '<li>Tinh chỉnh trả một lần, không thu lại khi gia hạn. Gia hạn không tự trừ tiền: trước ngày hết hạn bạn nhận thông báo và tự xác nhận.</li>' +
    '<li>Mua thêm nghề hoặc seat giữa kỳ tính theo số ngày còn lại và hết hạn cùng ngày.</li>' +
    '<li>Thuế GTGT: đang chờ kế toán xác định cách áp dụng; bản mẫu chưa tính thuế.</li>' +
    '</ul>';

  /* ───────── trang giỏ hàng ───────── */

  function initGioHang(root) {
    var g = docGio();
    var elSua = $('[data-gh-editor]', root);
    var elTom = $('[data-gh-summary]', root);

    function luuVaVe(toanBo) {
      luuGio(g);
      if (toanBo) veEditor();
      veTomTat();
    }

    function tuyChonNghe(daCo) {
      return TT.CAU_HINH.nghe.map(function (n) {
        if (daCo.indexOf(n.id) >= 0) return '';
        if (n.goiNghe == null) return '<option value="" disabled>' + esc(n.ten) + ' · giá đang cập nhật</option>';
        return '<option value="' + n.id + '">' + esc(n.ten) + ' · ' + tien(n.goiNghe) + '/năm' + (n.dangBan ? '' : ' · sắp mở bán') + '</option>';
      }).join('');
    }

    function thuTuTheoBaoGia(ds, chinh) {
      // Lấy thứ tự từ chính bộ tính tiền để danh sách luôn khớp hoá đơn, kể cả khi số seat đang nhập dở.
      if (!ds.length) return [];
      return TT.muaMoi({ loaiKhach: 'CA_NHAN', ngayBatDau: homNay(), nghe: ds, ngheChinh: chinh }).don.items.map(function (d) { return d.ngheId; });
    }

    function mucNgheHtml(id, thuTu, radioName, laChinh, tcHtml) {
      var n = timNghe(id);
      var giam = uuDaiMoRong(thuTu);
      return '<li class="gh-item">' +
        '<div class="gh-item-top"><span class="gh-rank" aria-label="Thứ tự ' + thuTu + '">#' + thuTu + '</span>' +
        '<b>' + esc(n.ten) + '</b><span class="gh-item-price">' + tien(n.goiNghe) + '/năm' + (giam ? ' · −' + giam + '%' : '') + '</span>' +
        '<button type="button" class="gh-x" data-bo="' + id + '" aria-label="Bỏ ' + esc(n.ten) + ' khỏi giỏ">Bỏ</button></div>' +
        '<div class="gh-item-opts"><label class="gh-opt"><input type="radio" name="' + radioName + '" value="' + id + '"' + (laChinh ? ' checked' : '') + ' data-chinh> Nghề chính</label>' +
        (tcHtml || '') + '</div>' +
        (n.dangBan ? '' : '<p class="gh-tag">Đang đóng gói · giá đề xuất</p>') +
        '</li>';
    }

    function veEditor() {
      var h = '<div class="gh-tabs" role="radiogroup" aria-label="Loại giỏ hàng">' +
        '<button type="button" role="radio" aria-checked="' + (g.loai === 'CA_NHAN') + '" data-loai="CA_NHAN">Cá nhân</button>' +
        '<button type="button" role="radio" aria-checked="' + (g.loai === 'DOANH_NGHIEP') + '" data-loai="DOANH_NGHIEP">Doanh nghiệp</button></div>';

      if (g.loai === 'CA_NHAN') {
        var c = g.caNhan;
        var ds = thuTuTheoBaoGia(c.nghe, c.ngheChinh);
        h += '<p class="gh-help">Nghề chính do bạn chọn và giữ giá chuẩn. Các nghề còn lại xếp theo giá niêm yết từ cao đến thấp; nghề càng xa càng được ưu đãi nhiều hơn.</p>';
        if (ds.length) {
          h += '<ul class="gh-items">' + ds.map(function (id, i) {
            var n = timNghe(id);
            var tc = '<label class="gh-opt"><input type="checkbox" data-tc="' + id + '"' + (c.tinhChinh.indexOf(id) >= 0 ? ' checked' : '') + '> Thêm Tinh chỉnh · ' + tien(n.tinhChinh) + ' một lần</label>';
            return mucNgheHtml(id, i + 1, 'gh-chinh', id === c.ngheChinh, tc);
          }).join('') + '</ul>';
        } else {
          h += '<div class="gh-empty"><b>Giỏ đang trống.</b> Chọn nghề bên dưới hoặc xem <a href="bang-gia.html">Bảng giá</a>.</div>';
        }
        h += themNgheHtml(c.nghe, '');
        h += goiYHtml();
      } else {
        h += '<p class="gh-help">Mỗi nhóm seat là một nhóm người dùng được cấp cùng bộ nghề, thường là một phòng ban. Ưu đãi quy mô tính trên tổng seat của cả đơn; ưu đãi mở rộng nghề tính trong từng nhóm.</p>';
        h += '<div data-gh-tier></div>';
        g.dn.nhom.forEach(function (n) {
          var ds = thuTuTheoBaoGia(n.nghe, n.ngheChinh);
          h += '<fieldset class="gh-group" data-nhom="' + n.ma + '"><legend class="sr-only">' + esc(n.ten) + '</legend>' +
            '<div class="gh-group-fields">' +
            '<label class="gh-field"><span>Tên nhóm</span><input type="text" value="' + esc(n.ten) + '" data-ten maxlength="60"></label>' +
            '<label class="gh-field gh-field--seat"><span>Số seat</span><input type="number" inputmode="numeric" min="1" step="1" value="' + (n.seat || '') + '" data-seat></label>' +
            '<button type="button" class="gh-x" data-bo-nhom aria-label="Xoá ' + esc(n.ten) + '">Xoá nhóm</button></div>' +
            (ds.length ? '<ul class="gh-items">' + ds.map(function (id, i) { return mucNgheHtml(id, i + 1, 'gh-chinh-' + n.ma, id === n.ngheChinh, ''); }).join('') + '</ul>'
              : '<p class="gh-help">Nhóm chưa có nghề.</p>') +
            themNgheHtml(n.nghe, n.ma) + '</fieldset>';
        });
        h += '<button type="button" class="gh-btn" data-them-nhom>+ Thêm nhóm seat</button>';
        var ngheDN = ngheTrongDN(g);
        if (ngheDN.length) {
          h += '<fieldset class="gh-group"><legend class="gh-legend">Tinh chỉnh cho doanh nghiệp · phí một lần</legend><div class="gh-item-opts gh-item-opts--col">' +
            ngheDN.map(function (id) {
              var n = timNghe(id);
              if (n.tinhChinhDN == null) return '<span class="gh-opt is-off">Tinh chỉnh ' + esc(n.ten) + ' · cần báo giá riêng</span>';
              return '<label class="gh-opt"><input type="checkbox" data-tc="' + id + '"' + (g.dn.tinhChinh.indexOf(id) >= 0 ? ' checked' : '') + '> Tinh chỉnh ' + esc(n.ten) + ' · ' + tien(n.tinhChinhDN) + '</label>';
            }).join('') + '</div></fieldset>';
        }
        h += goiYHtml();
      }
      elSua.innerHTML = h;
    }

    function themNgheHtml(daCo, maNhom) {
      var opts = tuyChonNghe(daCo);
      if (!opts.replace(/<option value="" disabled>[^<]*<\/option>/g, '')) return '';
      var idSel = 'gh-them-' + (maNhom || 'cn');
      return '<div class="gh-add"><label for="' + idSel + '" class="sr-only">Chọn nghề để thêm</label>' +
        '<select id="' + idSel + '" data-chon-nghe' + (maNhom ? ' data-cho-nhom="' + maNhom + '"' : '') + '><option value="">Thêm nghề…</option>' + opts + '</select></div>';
    }

    function goiYHtml() {
      return '<p class="gh-nudge" data-gh-nudge hidden></p>';
    }

    function veGoiY(don) {
      var el = $('[data-gh-nudge]', elSua);
      var tier = $('[data-gh-tier]', elSua);
      if (tier) {
        if (don && don.bacQuyMo) {
          var b = don.bacQuyMo, k = bacKeTiep(b.tongSeat);
          tier.innerHTML = '<div class="gh-tierbar"><b>Tổng ' + b.tongSeat + ' seat · giảm ' + b.tyLe + '%</b>' +
            (k ? '<span>Thêm ' + (k.tuSeat - b.tongSeat) + ' seat để lên bậc giảm ' + k.tyLe + '%.</span>' : '<span>Đã ở bậc cao nhất.</span>') + '</div>';
        } else tier.innerHTML = '';
      }
      if (!el) return;
      var cau = [];
      if (don) {
        var soNgheToiDa = 0, soTC = don.tinhChinh.soDichVu;
        var dem = {};
        don.items.forEach(function (d) { dem[d.maNhom] = (dem[d.maNhom] || 0) + 1; soNgheToiDa = Math.max(soNgheToiDa, dem[d.maNhom]); });
        if (g.loai === 'CA_NHAN') {
          var tiep = uuDaiMoRong(soNgheToiDa + 1);
          cau.push('Thêm 1 nghề nữa, nghề đó được ưu đãi ' + tiep + '%.');
        }
        if (soTC > 0) {
          var hien = uuDaiTinhChinh(soTC), sau = uuDaiTinhChinh(soTC + 1);
          if (sau > hien) cau.push('Thêm 1 dịch vụ Tinh chỉnh, cả phần Tinh chỉnh được giảm ' + sau + '%.');
        }
      }
      el.textContent = cau.join(' ');
      el.hidden = !cau.length;
    }

    function veTomTat() {
      var don = null, loi = null;
      try { don = baoGia(g); } catch (e) { loi = e; }
      veGoiY(don);
      var h = '<div class="gh-sum-head"><h2 class="gh-h">Cách tính tiền</h2><span class="gh-sample">Bản mẫu · không trừ tiền</span></div>';
      if (loi) {
        h += '<p class="gh-error" role="alert">' + esc(loi.hienThi ? loi.message : 'Không tính được giỏ hàng: ' + loi.message) + '</p>';
      } else if (!don) {
        h += '<p class="gh-help">Thêm nghề vào giỏ để xem từng dòng được tính thế nào.</p>';
      } else {
        h += hoaDonHtml(don, g);
      }
      var coThe = !!don && !loi;
      h += '<div class="gh-actions"><a class="gh-btn gh-btn--primary' + (coThe ? '' : ' is-disabled') + '" href="thanh-toan.html"' + (coThe ? '' : ' aria-disabled="true" tabindex="-1"') + '>Tiếp tục thanh toán →</a>' +
        '<a class="gh-link" href="bang-gia.html">Xem lại bảng giá</a></div>';
      h += GHI_CHU;
      elTom.innerHTML = h;
      var tong = $('[data-gh-live]', root);
      if (tong) tong.textContent = don ? 'Tổng thanh toán ' + tien(don.tongThanhToan) : '';
    }

    function nhomCua(el) {
      var f = el.closest('[data-nhom]');
      if (!f) return null;
      var ma = f.getAttribute('data-nhom');
      return g.dn.nhom.filter(function (n) { return n.ma === ma; })[0] || null;
    }

    root.addEventListener('click', function (e) {
      var t = e.target;
      var tab = t.closest('[data-loai]');
      if (tab) {
        if (doiLoai(g, tab.getAttribute('data-loai'))) {
          if (g.loai === 'DOANH_NGHIEP' && !g.dn.nhom.length) themNhom(g, 10);
          luuVaVe(true);
        }
        return;
      }
      if (t.closest('[data-them-nhom]')) {
        themNhom(g, 10);
        luuVaVe(true);
        var o = $$('[data-nhom] [data-ten]', elSua).pop();
        if (o) o.focus();
        return;
      }
      if (t.closest('[data-bo-nhom]')) {
        var nh = nhomCua(t);
        g.dn.nhom = g.dn.nhom.filter(function (n) { return n !== nh; });
        luuVaVe(true);
        var nutThem = $('[data-them-nhom]', elSua);
        if (nutThem) nutThem.focus();
        return;
      }
      var bo = t.closest('[data-bo]');
      if (bo) {
        var id = bo.getAttribute('data-bo');
        var n = nhomCua(bo);
        var ten = timNghe(id).ten;
        if (g.loai === 'CA_NHAN') {
          g.caNhan.nghe = g.caNhan.nghe.filter(function (x) { return x !== id; });
        } else if (n) {
          n.nghe = n.nghe.filter(function (x) { return x !== id; });
        }
        lamSach(g);
        luuVaVe(true);
        var live = $('[data-gio-thong-bao]');
        if (live) live.textContent = 'Đã bỏ ' + ten + ' khỏi giỏ, kèm Tinh chỉnh của nghề này nếu có.';
      }
    });

    root.addEventListener('change', function (e) {
      var t = e.target;
      if (t.matches('[data-chon-nghe]')) {
        var id = t.value;
        if (!id) return;
        if (g.loai === 'CA_NHAN') {
          g.caNhan.nghe.push(id);
          if (!g.caNhan.ngheChinh) g.caNhan.ngheChinh = id;
        } else {
          var n = g.dn.nhom.filter(function (x) { return x.ma === t.getAttribute('data-cho-nhom'); })[0];
          n.nghe.push(id);
          if (!n.ngheChinh) n.ngheChinh = id;
        }
        luuVaVe(true);
        var sel = $('[data-chon-nghe]' + (t.getAttribute('data-cho-nhom') ? '[data-cho-nhom="' + t.getAttribute('data-cho-nhom') + '"]' : ''), elSua);
        if (sel) sel.focus();
        return;
      }
      if (t.matches('[data-chinh]')) {
        if (g.loai === 'CA_NHAN') g.caNhan.ngheChinh = t.value;
        else nhomCua(t).ngheChinh = t.value;
        luuVaVe(true);
        var r = $('input[data-chinh][value="' + t.value + '"]' , t.closest('[data-nhom]') || elSua);
        if (r) r.focus();
        return;
      }
      if (t.matches('[data-tc]')) {
        var ds = g.loai === 'CA_NHAN' ? g.caNhan.tinhChinh : g.dn.tinhChinh;
        var tid = t.getAttribute('data-tc');
        var i = ds.indexOf(tid);
        if (t.checked && i < 0) ds.push(tid);
        if (!t.checked && i >= 0) ds.splice(i, 1);
        luuVaVe(false);
      }
    });

    root.addEventListener('input', function (e) {
      var t = e.target;
      var n = nhomCua(t);
      if (!n) return;
      if (t.matches('[data-ten]')) { n.ten = t.value.trim() || 'Nhóm seat'; luuVaVe(false); }
      if (t.matches('[data-seat]')) {
        var v = t.value === '' ? 0 : Number(t.value);
        n.seat = Number.isInteger(v) ? v : 0;
        luuVaVe(false);
      }
    });

    capNhatDem(g);
    veEditor();
    veTomTat();
  }

  /* ───────── bộ ước tính doanh nghiệp trên Bảng giá ───────── */

  function initUocTinh(root) {
    var elSeat = $('[data-ut-seat]', root);
    var elOut = $('[data-ut-out]', root);
    var nut = $('[data-ut-gio]', root);

    function chon() {
      var ds = $$('[data-ut-nghe]:checked', root).map(function (x) { return x.value; });
      var chinhEl = $('[data-ut-chinh]:checked', root);
      var chinh = chinhEl && ds.indexOf(chinhEl.value) >= 0 ? chinhEl.value : ds[0] || null;
      $$('[data-ut-chinh]', root).forEach(function (r) {
        var on = ds.indexOf(r.value) >= 0;
        r.disabled = !on;
        r.checked = on && r.value === chinh;
      });
      return { nghe: ds, chinh: chinh, seat: Number(elSeat.value) };
    }

    function ve() {
      var c = chon();
      nut.disabled = true;
      if (!c.nghe.length) { elOut.innerHTML = '<p class="gh-help">Chọn ít nhất một nghề.</p>'; return; }
      if (!Number.isInteger(c.seat) || c.seat < 1) { elOut.innerHTML = '<p class="gh-error" role="alert">Nhập số seat từ 1 trở lên.</p>'; return; }
      try {
        var don = TT.muaMoi({
          loaiKhach: 'DOANH_NGHIEP', ngayBatDau: homNay(),
          nhomSeat: [{ ma: 'N1', ten: 'Nhóm 1', seat: c.seat, nghe: c.nghe, ngheChinh: c.chinh }]
        }).don;
        var b = don.bacQuyMo, k = bacKeTiep(b.tongSeat);
        elOut.innerHTML =
          '<div class="gh-tierbar"><b>' + b.tongSeat + ' seat · giảm ' + b.tyLe + '% quy mô</b>' +
          (k ? '<span>Thêm ' + (k.tuSeat - b.tongSeat) + ' seat để lên bậc giảm ' + k.tyLe + '%.</span>' : '<span>Đã ở bậc cao nhất.</span>') + '</div>' +
          don.items.map(function (d) { return dongHtml(d, true); }).join('') +
          '<div class="gh-totals"><div><span>Tổng giá niêm yết</span><span>' + tien(don.tongNiemYet) + '</span></div>' +
          '<div><span>Tổng ưu đãi</span><span>− ' + tien(don.tongUuDai) + '</span></div>' +
          '<div class="gh-grand"><span>Phí hằng năm</span><span>' + tien(don.phiGoiNghe) + '</span></div>' +
          '<div class="gh-renew"><span>Bình quân mỗi seat</span><span>' + tien(don.phiGoiNghe / c.seat) + '/năm</span></div></div>';
        nut.disabled = false;
      } catch (e) {
        elOut.innerHTML = '<p class="gh-error" role="alert">' + esc(e.message) + '</p>';
      }
    }

    root.addEventListener('change', ve);
    root.addEventListener('input', ve);
    nut.addEventListener('click', function () {
      var c = chon();
      var g = docGio();
      if (!doiLoai(g, 'DOANH_NGHIEP')) return;
      if (soNghe(g) > 0 && !window.confirm('Giỏ doanh nghiệp đang có nghề. Thay bằng nhóm vừa ước tính?')) return;
      g.dn = { nhom: [], tinhChinh: [] };
      g.soNhom = 0;
      var n = themNhom(g, c.seat);
      n.nghe = c.nghe.slice();
      n.ngheChinh = c.chinh;
      luuGio(g);
      location.href = 'gio-hang.html';
    });
    ve();
  }

  /* ───────── khởi động ───────── */

  var g0 = docGio();
  capNhatDem(g0);
  if (TT) {
    var gh = $('[data-gio-hang]');
    if (gh) initGioHang(gh);
    var ut = $('[data-uoc-tinh]');
    if (ut) initUocTinh(ut);
  }
})();
