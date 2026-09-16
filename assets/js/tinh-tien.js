/*
 * AI Lành Nghề — bộ tính tiền (Pha 1)
 *
 * Không phụ thuộc giao diện. Dùng trong trình duyệt (window.TinhTien) và Node (require).
 * Baseline đã chốt 16/09/2026:
 *  - Hai sản phẩm: Gói nghề (theo năm, doanh nghiệp × seat được gán) và Tinh chỉnh (một lần, không nhân seat).
 *  - Thứ tự nghề: khách chọn nghề chính; các nghề còn lại trong cùng đơn xếp giá niêm yết cao → thấp
 *    (cùng giá theo thứ tự danh mục); lần mua sau nối tiếp vào cuối, không xếp lại nghề cũ.
 *  - Ưu đãi quy mô theo tổng seat đang hoạt động của subscription (mỗi seat đếm một lần).
 *  - Ưu đãi mở rộng nghề: cá nhân trên cả subscription, doanh nghiệp trong từng nhóm seat.
 *  - Ưu đãi Tinh chỉnh theo số dịch vụ trong cùng một đơn.
 *  - Một subscription một ngày hết hạn; mua thêm tính theo ngày còn lại; lên bậc giữa kỳ chỉ áp cho phần mua thêm.
 *  - Giảm seat, bỏ nghề, đổi nghề, đổi nghề chính: hiệu lực kỳ gia hạn sau. Đổi người dùng seat: 0 đ.
 *  - Không hồi tố: đơn đã tạo không bị tính lại. 50% là giới hạn chiết khấu nội bộ mỗi dòng.
 *  - Thuế GTGT: CHƯA CHỐT, cần kế toán. Bộ tính tiền không cài tỉ lệ thuế; mỗi dòng mang loaiThue = null.
 */
(function (root, factory) {
  var api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  else root.TinhTien = api;
})(typeof self !== "undefined" ? self : this, function () {
  "use strict";

  var CAU_HINH = {
    phienBan: "2026-09-16",
    // Thứ tự khai báo = thứ tự danh mục (dùng khi hai nghề cùng giá).
    // dangBan = false: gói đang đóng gói, giá là giá đề xuất. tinhChinhDN = null: chưa có giá niêm yết, cần báo giá.
    nghe: [
      { id: "hanh-chinh", ten: "Hành chính", dangBan: false, goiNghe: 590000, tinhChinh: 600000, tinhChinhDN: null },
      { id: "nhan-su", ten: "Nhân sự", dangBan: false, goiNghe: 690000, tinhChinh: 800000, tinhChinhDN: 3500000 },
      { id: "mua-hang", ten: "Mua hàng", dangBan: true, goiNghe: 690000, tinhChinh: 800000, tinhChinhDN: 3000000 },
      { id: "ke-toan", ten: "Kế toán – Tài chính", dangBan: false, goiNghe: 790000, tinhChinh: 900000, tinhChinhDN: 4000000 },
      { id: "marketing", ten: "Marketing", dangBan: false, goiNghe: 690000, tinhChinh: 800000, tinhChinhDN: null },
      { id: "quan-ly", ten: "Quản lý", dangBan: false, goiNghe: 890000, tinhChinh: 1200000, tinhChinhDN: null },
      // Đang bán trên site nhưng chưa chốt giá.
      { id: "giang-day", ten: "Giảng dạy", dangBan: true, goiNghe: null, tinhChinh: null, tinhChinhDN: null }
    ],
    // Phần trăm nguyên.
    moRongNghe: [0, 10, 20, 25, 30], // #1, #2, #3, #4, #5+
    quyMo: [[500, 30], [250, 25], [100, 20], [50, 15], [25, 10], [10, 5], [1, 0]], // [từ seat, %]
    tinhChinh: [[5, 20], [4, 15], [3, 10], [2, 5], [1, 0]], // [từ số dịch vụ, %]
    gioiHanGiam: 50
  };

  var CA_NHAN = "CA_NHAN";
  var DOANH_NGHIEP = "DOANH_NGHIEP";

  function Loi(ma, thongDiep) {
    var e = new Error(thongDiep);
    e.ma = ma;
    return e;
  }

  function sao(x) {
    return JSON.parse(JSON.stringify(x));
  }

  /* ---------- Ngày ---------- */

  var MS_NGAY = 86400000;

  function docNgay(s) {
    var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s || "");
    if (!m) throw Loi("NGAY_KHONG_HOP_LE", "Ngày phải có dạng YYYY-MM-DD: " + s);
    var t = Date.UTC(+m[1], +m[2] - 1, +m[3]);
    if (new Date(t).toISOString().slice(0, 10) !== s) throw Loi("NGAY_KHONG_HOP_LE", "Ngày không tồn tại: " + s);
    return t;
  }

  function vietNgay(t) {
    return new Date(t).toISOString().slice(0, 10);
  }

  // Số ngày tính cả hai đầu.
  function soNgay(tu, den) {
    return Math.round((docNgay(den) - docNgay(tu)) / MS_NGAY) + 1;
  }

  function congNgay(s, n) {
    return vietNgay(docNgay(s) + n * MS_NGAY);
  }

  // Kỳ 1 năm: từ ngày bắt đầu tới ngày trước ngày cùng tên năm sau.
  function taoKy(batDau) {
    var t = new Date(docNgay(batDau));
    var nam = t.getUTCFullYear() + 1, thang = t.getUTCMonth(), ngay = t.getUTCDate();
    var sau = Date.UTC(nam, thang, ngay);
    if (new Date(sau).getUTCMonth() !== thang) sau = Date.UTC(nam, thang + 1, 1); // 29/02 → 01/03
    var hetHan = vietNgay(sau - MS_NGAY);
    return { batDau: batDau, hetHan: hetHan, soNgay: soNgay(batDau, hetHan) };
  }

  /* ---------- Tra cứu ---------- */

  function timNghe(id, cauHinh) {
    for (var i = 0; i < cauHinh.nghe.length; i++) if (cauHinh.nghe[i].id === id) return { nghe: cauHinh.nghe[i], viTri: i };
    throw Loi("NGHE_KHONG_TON_TAI", "Không có nghề " + id);
  }

  function giaGoiNghe(id, cauHinh) {
    var n = timNghe(id, cauHinh).nghe;
    if (n.goiNghe == null) throw Loi("CHUA_CO_GIA", "Gói nghề " + n.ten + " chưa có giá niêm yết");
    return n.goiNghe;
  }

  function tyLeMoRong(thuTu, cauHinh) {
    var b = cauHinh.moRongNghe;
    return b[Math.min(thuTu, b.length) - 1];
  }

  function bacQuyMo(tongSeat, cauHinh) {
    for (var i = 0; i < cauHinh.quyMo.length; i++) {
      var b = cauHinh.quyMo[i];
      if (tongSeat >= b[0]) {
        return { tongSeat: tongSeat, tyLe: b[1], tuSeat: b[0], denSeat: i === 0 ? null : cauHinh.quyMo[i - 1][0] - 1 };
      }
    }
    return { tongSeat: tongSeat, tyLe: 0, tuSeat: 0, denSeat: 0 };
  }

  function tyLeTinhChinh(soDichVu, cauHinh) {
    for (var i = 0; i < cauHinh.tinhChinh.length; i++) if (soDichVu >= cauHinh.tinhChinh[i][0]) return cauHinh.tinhChinh[i][1];
    return 0;
  }

  /* ---------- Số học: số nguyên, làm tròn nửa lên một lần ở cuối dòng ---------- */

  function chiaLamTron(tu, mau) {
    return Number((2n * tu + mau) / (2n * mau));
  }

  function dinhDang(n) {
    var s = String(Math.abs(Math.round(n))).replace(/\B(?=(\d{3})+(?!\d))/g, ".");
    return (n < 0 ? "−" : "") + s;
  }

  function dinhDangTyLe(p) {
    return String(Math.round(p * 100) / 100).replace(".", ",") + "%";
  }

  /*
   * Một dòng Gói nghề.
   * giam: [{ loai, tyLe, lyDo }] — các tầng nhân với nhau.
   * thoiGian: { conLai, ky } hoặc null (đủ kỳ).
   */
  function tinhDong(dong, cauHinh) {
    var niemYet = dong.donGia * dong.seat;
    var giam = dong.giam.filter(function (g) { return g.tyLe > 0; });
    var tu = 1n, mau = 1n;
    giam.forEach(function (g) { tu *= BigInt(100 - g.tyLe); mau *= 100n; });
    var mucGiam = 100 - (Number(tu) / Number(mau)) * 100;
    var mucGiamGoc = mucGiam;
    var cham = mucGiam > cauHinh.gioiHanGiam;
    if (cham) { tu = BigInt(100 - cauHinh.gioiHanGiam); mau = 100n; mucGiam = cauHinh.gioiHanGiam; }

    var duNam = chiaLamTron(BigInt(niemYet) * tu, mau);
    var thanhTien = duNam;
    var tgTu = 1n, tgMau = 1n;
    if (dong.thoiGian) {
      tgTu = BigInt(dong.thoiGian.conLai);
      tgMau = BigInt(dong.thoiGian.ky);
      thanhTien = chiaLamTron(BigInt(niemYet) * tu * tgTu, mau * tgMau);
    }

    // Diễn giải từng bước cho khách tự kiểm.
    var buoc = [];
    var chayTu = BigInt(niemYet), chayMau = 1n;
    buoc.push({ nhan: dinhDang(dong.donGia) + (dong.loaiKhach === DOANH_NGHIEP ? " × " + dong.seat + " seat" : ""), giaTri: niemYet });
    if (!cham) {
      giam.forEach(function (g) {
        chayTu *= BigInt(100 - g.tyLe); chayMau *= 100n;
        buoc.push({ nhan: "× (1 − " + g.tyLe + "%) " + g.ten, lyDo: g.lyDo, giaTri: chiaLamTron(chayTu, chayMau) });
      });
    } else {
      buoc.push({ nhan: "Giảm " + dinhDangTyLe(mucGiamGoc) + " vượt giới hạn " + cauHinh.gioiHanGiam + "%", lyDo: "Chính sách giá nội bộ của AI Lành Nghề", giaTri: duNam });
    }
    if (dong.thoiGian) buoc.push({ nhan: "× " + dong.thoiGian.conLai + "/" + dong.thoiGian.ky + " ngày", lyDo: "Chỉ trả cho thời gian còn lại của kỳ", giaTri: thanhTien });

    var moTa = [dinhDang(dong.donGia)];
    if (dong.loaiKhach === DOANH_NGHIEP) moTa.push(String(dong.seat));
    if (cham) moTa.push("(1 − " + cauHinh.gioiHanGiam + "%)");
    else giam.forEach(function (g) { moTa.push("(1 − " + g.tyLe + "%)"); });
    if (dong.thoiGian) moTa.push(dong.thoiGian.conLai + "/" + dong.thoiGian.ky);

    return {
      loai: "GOI_NGHE",
      maNhom: dong.maNhom,
      ngheId: dong.ngheId,
      tenNghe: dong.tenNghe,
      seat: dong.seat,
      thuTu: dong.thuTu,
      donGia: dong.donGia,
      giaNiemYet: niemYet,
      giam: giam,
      mucGiam: mucGiam,
      chamGioiHan: cham,
      thoiGian: dong.thoiGian || null,
      thanhTienDuKy: duNam,
      thanhTien: thanhTien,
      loaiThue: null, // chưa chốt, cần kế toán
      moTa: moTa.join(" × "),
      buoc: buoc
    };
  }

  /* ---------- Thứ tự nghề ---------- */

  // Nghề chính (nếu nhóm chưa có nghề nào) đứng đầu; còn lại giá cao → thấp, cùng giá theo danh mục.
  function xepNgheMoi(ngheMoi, ngheChinh, soNgheDaCo, cauHinh) {
    var ds = ngheMoi.slice();
    var dau = [];
    if (soNgheDaCo === 0) {
      if (ds.length > 1 && !ngheChinh) throw Loi("THIEU_NGHE_CHINH", "Cần chọn nghề chính khi mua nhiều nghề");
      var chinh = ngheChinh || ds[0];
      var i = ds.indexOf(chinh);
      if (i < 0) throw Loi("NGHE_CHINH_KHONG_TRONG_DON", "Nghề chính phải nằm trong đơn");
      dau = ds.splice(i, 1);
    }
    ds.sort(function (a, b) {
      var ga = giaGoiNghe(a, cauHinh), gb = giaGoiNghe(b, cauHinh);
      if (ga !== gb) return gb - ga;
      return timNghe(a, cauHinh).viTri - timNghe(b, cauHinh).viTri;
    });
    return dau.concat(ds);
  }

  function kiemTraTrung(ds, thongDiep) {
    var gap = {};
    ds.forEach(function (x) {
      if (gap[x]) throw Loi("TRUNG_LAP", thongDiep + ": " + x);
      gap[x] = true;
    });
  }

  /* ---------- Tinh chỉnh ---------- */

  function tinhPhanTinhChinh(loaiKhach, dsNghe, ngheHopLe, cauHinh) {
    dsNghe = dsNghe || [];
    kiemTraTrung(dsNghe, "Mỗi nghề tối đa một dịch vụ Tinh chỉnh trong một đơn");
    var dichVu = dsNghe.map(function (id) {
      if (ngheHopLe.indexOf(id) < 0) throw Loi("TINH_CHINH_THIEU_GOI_NGHE", "Tinh chỉnh " + id + " cần có Gói nghề cùng nghề");
      var n = timNghe(id, cauHinh).nghe;
      var gia = loaiKhach === DOANH_NGHIEP ? n.tinhChinhDN : n.tinhChinh;
      if (gia == null) throw Loi("CHUA_CO_GIA", "Tinh chỉnh " + n.ten + " chưa có giá niêm yết, cần báo giá");
      return { ngheId: id, tenNghe: n.ten, donGia: gia, loaiThue: null };
    });
    var tong = dichVu.reduce(function (a, d) { return a + d.donGia; }, 0);
    var tyLe = dichVu.length ? tyLeTinhChinh(dichVu.length, cauHinh) : 0;
    var thanhTien = chiaLamTron(BigInt(tong) * BigInt(100 - tyLe), 100n);
    return {
      loai: "TINH_CHINH",
      dichVu: dichVu,
      soDichVu: dichVu.length,
      tongNiemYet: tong,
      tyLeGiam: tyLe,
      tienGiam: tong - thanhTien,
      lyDo: dichVu.length ? "Đơn có " + dichVu.length + " dịch vụ Tinh chỉnh" : "",
      thanhTien: thanhTien
    };
  }

  /* ---------- Subscription ---------- */

  function tongSeat(sub) {
    return sub.nhomSeat.reduce(function (a, n) { return a + n.seat; }, 0);
  }

  function timNhom(sub, ma) {
    for (var i = 0; i < sub.nhomSeat.length; i++) if (sub.nhomSeat[i].ma === ma) return sub.nhomSeat[i];
    throw Loi("NHOM_KHONG_TON_TAI", "Không có nhóm seat " + ma);
  }

  function taoSeat(sub, nhom, soLuong) {
    for (var i = 0; i < soLuong; i++) {
      sub.soSeatDaTao += 1;
      sub.seat.push({ ma: "S" + String(sub.soSeatDaTao).padStart(3, "0"), maNhom: nhom, lichSuGan: [] });
    }
  }

  function kiemTraSeat(seat) {
    if (!Number.isInteger(seat) || seat < 1) throw Loi("SEAT_KHONG_HOP_LE", "Số seat phải là số nguyên dương");
  }

  function chuanHoaDauVao(dauVao) {
    if (dauVao.loaiKhach === CA_NHAN) {
      return [{ ma: "CA_NHAN", ten: "Cá nhân", seat: 1, nghe: dauVao.nghe || [], ngheChinh: dauVao.ngheChinh }];
    }
    if (dauVao.loaiKhach !== DOANH_NGHIEP) throw Loi("LOAI_KHACH_KHONG_HOP_LE", "loaiKhach phải là CA_NHAN hoặc DOANH_NGHIEP");
    return dauVao.nhomSeat || [];
  }

  function giamCho(loaiKhach, bac, thuTu, nhomTen, cauHinh) {
    var giam = [];
    if (loaiKhach === DOANH_NGHIEP) {
      giam.push({ loai: "QUY_MO", ten: "quy mô", tyLe: bac.tyLe, lyDo: "Tổng " + bac.tongSeat + " seat" });
    }
    giam.push({
      loai: "MO_RONG_NGHE", ten: "mở rộng nghề", tyLe: tyLeMoRong(thuTu, cauHinh),
      lyDo: thuTu === 1 ? "Nghề chính #1" : "Nghề #" + thuTu + (loaiKhach === DOANH_NGHIEP ? " · " + nhomTen : "")
    });
    return giam;
  }

  function tongKet(don) {
    var phiGoiNghe = don.items.reduce(function (a, d) { return a + d.thanhTien; }, 0);
    var niemYetGoi = don.items.reduce(function (a, d) { return a + d.giaNiemYet; }, 0);
    don.phiGoiNghe = phiGoiNghe;
    don.phiMotLan = don.tinhChinh.thanhTien;
    don.tongNiemYet = niemYetGoi + don.tinhChinh.tongNiemYet;
    don.tongThanhToan = phiGoiNghe + don.tinhChinh.thanhTien;
    // Với đơn mua thêm, phần chênh gồm cả thời gian chưa dùng; tách riêng để hiển thị trung thực.
    var duKy = don.items.reduce(function (a, d) { return a + d.thanhTienDuKy; }, 0);
    don.tongUuDai = (niemYetGoi - duKy) + don.tinhChinh.tienGiam;
    don.giamDoThoiGian = duKy - phiGoiNghe;
    return don;
  }

  /*
   * Mua mới.
   * Cá nhân:     { loaiKhach: "CA_NHAN", ngayBatDau, nghe: [id], ngheChinh, tinhChinh: [id] }
   * Doanh nghiệp:{ loaiKhach: "DOANH_NGHIEP", ngayBatDau, nhomSeat: [{ ma, ten, seat, nghe: [id], ngheChinh }], tinhChinh: [id] }
   * Trả về { don, subscription } — subscription là trạng thái sau khi đơn thanh toán thành công.
   */
  function muaMoi(dauVao, cauHinh) {
    cauHinh = cauHinh || CAU_HINH;
    var loaiKhach = dauVao.loaiKhach;
    var nhomVao = chuanHoaDauVao(dauVao);
    if (!nhomVao.length) throw Loi("DON_RONG", "Đơn chưa có nghề nào");
    kiemTraTrung(nhomVao.map(function (n) { return n.ma; }), "Trùng mã nhóm seat");

    var ky = taoKy(dauVao.ngayBatDau);
    var sub = { loaiKhach: loaiKhach, ky: ky, nhomSeat: [], seat: [], soSeatDaTao: 0, thayDoiKySau: [], donHang: [], bangGiaPhienBan: cauHinh.phienBan };

    nhomVao.forEach(function (n) {
      kiemTraSeat(n.seat);
      if (!n.nghe || !n.nghe.length) throw Loi("NHOM_KHONG_CO_NGHE", "Nhóm " + n.ten + " chưa có nghề");
      kiemTraTrung(n.nghe, "Trùng nghề trong nhóm " + n.ten);
      var thuTu = xepNgheMoi(n.nghe, n.ngheChinh, 0, cauHinh);
      sub.nhomSeat.push({ ma: n.ma, ten: n.ten, seat: n.seat, nghe: thuTu.map(function (id, i) { return { ngheId: id, thuTu: i + 1, tuNgay: ky.batDau }; }) });
      taoSeat(sub, n.ma, n.seat);
    });

    var bac = loaiKhach === DOANH_NGHIEP ? bacQuyMo(tongSeat(sub), cauHinh) : null;
    var items = [];
    sub.nhomSeat.forEach(function (n) {
      n.nghe.forEach(function (g) {
        items.push(tinhDong({
          loaiKhach: loaiKhach, maNhom: n.ma, ngheId: g.ngheId, tenNghe: timNghe(g.ngheId, cauHinh).nghe.ten,
          seat: n.seat, thuTu: g.thuTu, donGia: giaGoiNghe(g.ngheId, cauHinh),
          giam: giamCho(loaiKhach, bac, g.thuTu, n.ten, cauHinh), thoiGian: null
        }, cauHinh));
      });
    });

    var ngheTrongDon = [];
    sub.nhomSeat.forEach(function (n) { n.nghe.forEach(function (g) { if (ngheTrongDon.indexOf(g.ngheId) < 0) ngheTrongDon.push(g.ngheId); }); });

    var don = tongKet({
      loaiDon: "MUA_MOI", loaiKhach: loaiKhach, ngayHieuLuc: ky.batDau, ky: ky,
      bangGiaPhienBan: cauHinh.phienBan, bacQuyMo: bac, items: items,
      tinhChinh: tinhPhanTinhChinh(loaiKhach, dauVao.tinhChinh, ngheTrongDon, cauHinh)
    });
    don.giaHanDuKien = don.phiGoiNghe;
    sub.donHang.push(sao(don));
    return { don: Object.freeze(don), subscription: sub };
  }

  /*
   * Mua thêm giữa kỳ, hiệu lực ngay, tính theo ngày còn lại.
   * { ngayHieuLuc,
   *   themSeat: [{ maNhom, soSeat }],           — seat mới nhận mọi nghề đang có của nhóm, giữ thứ tự nhóm
   *   themNghe: [{ maNhom, nghe: [id] }],       — cấp cho toàn bộ seat của nhóm (kể cả seat thêm cùng đơn), nối tiếp cuối
   *   themNhom: [{ ma, ten, seat, nghe, ngheChinh }],
   *   tinhChinh: [id] }                          — giá đủ, không theo ngày
   * Bậc quy mô = tổng seat đang hoạt động sau thay đổi, chỉ áp cho phần mua thêm.
   */
  function muaThem(subVao, dauVao, cauHinh) {
    cauHinh = cauHinh || CAU_HINH;
    var sub = sao(subVao);
    var loaiKhach = sub.loaiKhach;
    var ngay = dauVao.ngayHieuLuc;
    if (docNgay(ngay) < docNgay(sub.ky.batDau) || docNgay(ngay) > docNgay(sub.ky.hetHan)) {
      throw Loi("NGOAI_KY", "Ngày mua thêm phải nằm trong kỳ " + sub.ky.batDau + " – " + sub.ky.hetHan);
    }
    var themSeat = dauVao.themSeat || [], themNghe = dauVao.themNghe || [], themNhom = dauVao.themNhom || [];
    if (loaiKhach === CA_NHAN && (themSeat.length || themNhom.length)) throw Loi("CA_NHAN_KHONG_CO_SEAT", "Cá nhân không mua thêm seat");
    if (loaiKhach === CA_NHAN && dauVao.nghe) themNghe = [{ maNhom: "CA_NHAN", nghe: dauVao.nghe }];

    var thoiGian = { tuNgay: ngay, denNgay: sub.ky.hetHan, conLai: soNgay(ngay, sub.ky.hetHan), ky: sub.ky.soNgay };

    // 1. Áp thay đổi vào trạng thái, ghi lại phần nào là mua thêm.
    var phan = []; // { maNhom, ngheId, seat, thuTu }
    var seatCuTheoNhom = {};
    sub.nhomSeat.forEach(function (n) { seatCuTheoNhom[n.ma] = n.seat; });

    themNhom.forEach(function (n) {
      kiemTraSeat(n.seat);
      if (sub.nhomSeat.some(function (x) { return x.ma === n.ma; })) throw Loi("TRUNG_LAP", "Trùng mã nhóm seat: " + n.ma);
      if (!n.nghe || !n.nghe.length) throw Loi("NHOM_KHONG_CO_NGHE", "Nhóm " + n.ten + " chưa có nghề");
      kiemTraTrung(n.nghe, "Trùng nghề trong nhóm " + n.ten);
      var thuTu = xepNgheMoi(n.nghe, n.ngheChinh, 0, cauHinh);
      sub.nhomSeat.push({ ma: n.ma, ten: n.ten, seat: n.seat, nghe: thuTu.map(function (id, i) { return { ngheId: id, thuTu: i + 1, tuNgay: ngay }; }) });
      taoSeat(sub, n.ma, n.seat);
      thuTu.forEach(function (id, i) { phan.push({ maNhom: n.ma, ngheId: id, seat: n.seat, thuTu: i + 1 }); });
    });

    themSeat.forEach(function (t) {
      kiemTraSeat(t.soSeat);
      if (!(t.maNhom in seatCuTheoNhom)) throw Loi("NHOM_MOI_TRONG_DON", "Nhóm mới trong đơn đã khai số seat, không thêm seat riêng");
      var n = timNhom(sub, t.maNhom);
      n.nghe.forEach(function (g) { phan.push({ maNhom: n.ma, ngheId: g.ngheId, seat: t.soSeat, thuTu: g.thuTu, _seatThem: true }); });
      n.seat += t.soSeat;
      taoSeat(sub, n.ma, t.soSeat);
    });

    themNghe.forEach(function (t) {
      var n = timNhom(sub, t.maNhom);
      kiemTraTrung(t.nghe, "Trùng nghề trong đơn");
      t.nghe.forEach(function (id) {
        if (n.nghe.some(function (g) { return g.ngheId === id; })) throw Loi("NGHE_DA_CO", "Nhóm " + n.ten + " đã có nghề " + id);
      });
      var moi = xepNgheMoi(t.nghe, null, n.nghe.length, cauHinh);
      moi.forEach(function (id) {
        var thuTu = n.nghe.length + 1;
        n.nghe.push({ ngheId: id, thuTu: thuTu, tuNgay: ngay });
        phan.push({ maNhom: n.ma, ngheId: id, seat: n.seat, thuTu: thuTu }); // n.seat đã gồm seat thêm cùng đơn
      });
    });

    if (!phan.length && !(dauVao.tinhChinh || []).length) throw Loi("DON_RONG", "Đơn mua thêm chưa có gì");

    // 2. Tính tiền phần mua thêm theo bậc sau thay đổi.
    var bac = loaiKhach === DOANH_NGHIEP ? bacQuyMo(tongSeat(sub), cauHinh) : null;
    var items = phan.map(function (p) {
      var n = timNhom(sub, p.maNhom);
      return tinhDong({
        loaiKhach: loaiKhach, maNhom: p.maNhom, ngheId: p.ngheId, tenNghe: timNghe(p.ngheId, cauHinh).nghe.ten,
        seat: p.seat, thuTu: p.thuTu, donGia: giaGoiNghe(p.ngheId, cauHinh),
        giam: giamCho(loaiKhach, bac, p.thuTu, n.ten, cauHinh),
        thoiGian: { conLai: thoiGian.conLai, ky: thoiGian.ky }
      }, cauHinh);
    });

    var ngheCo = [];
    sub.nhomSeat.forEach(function (n) { n.nghe.forEach(function (g) { if (ngheCo.indexOf(g.ngheId) < 0) ngheCo.push(g.ngheId); }); });

    var don = tongKet({
      loaiDon: "MUA_THEM", loaiKhach: loaiKhach, ngayHieuLuc: ngay, ky: sub.ky, thoiGian: thoiGian,
      bangGiaPhienBan: cauHinh.phienBan, bacQuyMo: bac, items: items,
      tinhChinh: tinhPhanTinhChinh(loaiKhach, dauVao.tinhChinh, ngheCo, cauHinh)
    });
    don.giaHanDuKien = baoGiaGiaHan(sub, cauHinh).don.phiGoiNghe;
    sub.donHang.push(sao(don));
    return { don: Object.freeze(don), subscription: sub };
  }

  /* ---------- Thay đổi không phát sinh tiền ---------- */

  // Đổi người dùng seat: 0 đ, hiệu lực ngay, lưu lịch sử.
  function ganNguoiDung(subVao, maSeat, nguoiDung, ngay) {
    var sub = sao(subVao);
    var s = sub.seat.filter(function (x) { return x.ma === maSeat; })[0];
    if (!s) throw Loi("SEAT_KHONG_TON_TAI", "Không có seat " + maSeat);
    var hienTai = s.lichSuGan[s.lichSuGan.length - 1];
    if (hienTai && !hienTai.denNgay) hienTai.denNgay = congNgay(ngay, -1);
    s.lichSuGan.push({ nguoiDung: nguoiDung, tuNgay: ngay, denNgay: null });
    return { phi: 0, subscription: sub };
  }

  /*
   * Đăng ký thay đổi cho kỳ sau:
   *  { loai: "GIAM_SEAT", maNhom, soSeat }        — số seat còn lại của nhóm (0 = bỏ nhóm)
   *  { loai: "BO_NGHE", maNhom, ngheId }
   *  { loai: "DOI_NGHE", maNhom, tu, den }          — nghề mới nhận đúng thứ tự nghề bị thay
   *  { loai: "DOI_NGHE_CHINH", maNhom, ngheId }     — lên #1, các nghề khác giữ thứ tự tương đối
   */
  function dangKyKySau(subVao, thayDoi, ngayDangKy, cauHinh) {
    cauHinh = cauHinh || CAU_HINH;
    var sub = sao(subVao);
    var loai = ["GIAM_SEAT", "BO_NGHE", "DOI_NGHE", "DOI_NGHE_CHINH"];
    if (loai.indexOf(thayDoi.loai) < 0) throw Loi("THAY_DOI_KHONG_HOP_LE", "Loại thay đổi không hợp lệ");
    timNhom(sub, thayDoi.maNhom);
    var td = sao(thayDoi);
    td.ngayDangKy = ngayDangKy;
    sub.thayDoiKySau.push(td);
    apThayDoi(sao(sub), cauHinh); // kiểm tra hợp lệ sớm
    return { phi: 0, subscription: sub };
  }

  function apThayDoi(sub, cauHinh) {
    sub.thayDoiKySau.forEach(function (t) {
      var n = timNhom(sub, t.maNhom);
      var viTri = function (id) {
        for (var i = 0; i < n.nghe.length; i++) if (n.nghe[i].ngheId === id) return i;
        throw Loi("NGHE_KHONG_CO_TRONG_NHOM", "Nhóm " + n.ten + " không có nghề " + id);
      };
      if (t.loai === "GIAM_SEAT") {
        if (!Number.isInteger(t.soSeat) || t.soSeat < 0 || t.soSeat > n.seat) throw Loi("SEAT_KHONG_HOP_LE", "Chỉ giảm được xuống 0–" + n.seat + " seat");
        n.seat = t.soSeat;
      } else if (t.loai === "BO_NGHE") {
        n.nghe.splice(viTri(t.ngheId), 1);
      } else if (t.loai === "DOI_NGHE") {
        timNghe(t.den, cauHinh);
        if (n.nghe.some(function (g) { return g.ngheId === t.den; })) throw Loi("NGHE_DA_CO", "Nhóm đã có nghề " + t.den);
        n.nghe[viTri(t.tu)].ngheId = t.den;
      } else if (t.loai === "DOI_NGHE_CHINH") {
        var g = n.nghe.splice(viTri(t.ngheId), 1)[0];
        n.nghe.unshift(g);
      }
    });
    sub.nhomSeat = sub.nhomSeat.filter(function (n) { return n.seat > 0 && n.nghe.length > 0; });
    sub.nhomSeat.forEach(function (n) { n.nghe.forEach(function (g, i) { g.thuTu = i + 1; }); }); // dồn thứ tự, giữ thứ tự tương đối
    sub.thayDoiKySau = [];
    return sub;
  }

  /*
   * Báo giá gia hạn: cấu hình đang hoạt động + thay đổi đã đăng ký, đủ năm, bảng giá hiện hành.
   * Không tự trừ tiền: kết quả là báo giá; khách xác nhận và thanh toán như một đơn.
   */
  function baoGiaGiaHan(subVao, cauHinh) {
    cauHinh = cauHinh || CAU_HINH;
    var sub = apThayDoi(sao(subVao), cauHinh);
    if (!sub.nhomSeat.length) throw Loi("KHONG_CON_GI_DE_GIA_HAN", "Subscription không còn nghề hoặc seat để gia hạn");
    var ky = taoKy(congNgay(subVao.ky.hetHan, 1));
    var loaiKhach = sub.loaiKhach;
    var bac = loaiKhach === DOANH_NGHIEP ? bacQuyMo(tongSeat(sub), cauHinh) : null;
    var items = [];
    sub.nhomSeat.forEach(function (n) {
      n.nghe.forEach(function (g) {
        items.push(tinhDong({
          loaiKhach: loaiKhach, maNhom: n.ma, ngheId: g.ngheId, tenNghe: timNghe(g.ngheId, cauHinh).nghe.ten,
          seat: n.seat, thuTu: g.thuTu, donGia: giaGoiNghe(g.ngheId, cauHinh),
          giam: giamCho(loaiKhach, bac, g.thuTu, n.ten, cauHinh), thoiGian: null
        }, cauHinh));
      });
    });
    var don = tongKet({
      loaiDon: "GIA_HAN", loaiKhach: loaiKhach, ngayHieuLuc: ky.batDau, ky: ky,
      bangGiaPhienBan: cauHinh.phienBan, bacQuyMo: bac, items: items,
      tinhChinh: tinhPhanTinhChinh(loaiKhach, [], [], cauHinh)
    });
    don.giaHanDuKien = don.phiGoiNghe;

    // Trạng thái sau khi khách thanh toán báo giá gia hạn: kỳ mới, bỏ seat thừa ở cuối mỗi nhóm.
    var sau = sao(sub);
    sau.ky = ky;
    sau.bangGiaPhienBan = cauHinh.phienBan;
    sau.seat = [];
    sub.nhomSeat.forEach(function (n) {
      subVao.seat.filter(function (s) { return s.maNhom === n.ma; }).slice(0, n.seat).forEach(function (s) { sau.seat.push(sao(s)); });
    });
    sau.donHang = subVao.donHang.concat([sao(don)]);
    return { don: Object.freeze(don), subscription: sau };
  }

  return {
    CAU_HINH: CAU_HINH,
    Loi: Loi,
    muaMoi: muaMoi,
    muaThem: muaThem,
    baoGiaGiaHan: baoGiaGiaHan,
    dangKyKySau: dangKyKySau,
    ganNguoiDung: ganNguoiDung,
    // tiện ích
    taoKy: taoKy,
    soNgay: soNgay,
    bacQuyMo: bacQuyMo,
    dinhDang: dinhDang
  };
});
