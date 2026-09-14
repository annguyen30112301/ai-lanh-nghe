/* Kịch bản Bàn thử việc — kết quả soạn sẵn, không gọi AI thật. Mỗi tình huống có đúng một lỗi cài sẵn. */
window.DUNG_THU = (function () {
  'use strict';

  function vnd(n) { return n.toLocaleString('vi-VN'); }

  /* ───────────── MUA HÀNG ───────────── */

  var baoGia = {
    id: 'bao-gia',
    ten: 'So sánh 3 báo giá nhà cung cấp',
    thoiGian: '~2 phút',
    dauVao: {
      files: [
        { ten: 'Báo giá NCC A — Bao bì Tân Á.pdf', meta: '2 trang · giá đã gồm VAT' },
        { ten: 'Báo giá NCC B — Bao bì Hà Thành.xlsx', meta: '1 sheet · giá đã gồm VAT' },
        { ten: 'Báo giá NCC C — Bao bì Đông Phương.pdf', meta: '3 trang', trich: 'Trang 3, dòng cuối: “Đơn giá trên chưa bao gồm thuế GTGT 10%.”' }
      ],
      yeuCau: 'Tôi đã nhận được 3 báo giá thùng carton cho đơn hàng quý 4. Hãy lập bảng so sánh theo giá, thời gian giao hàng, điều khoản thanh toán và dịch vụ hậu mãi.'
    },
    nut: {
      ten: 'Ưu tiên',
      chon: [
        { id: 'chi-phi', label: 'Tổng chi phí' },
        { id: 'giao-nhanh', label: 'Giao nhanh' },
        { id: 'hau-mai', label: 'Hậu mãi' }
      ]
    },
    xuLy: ['Đọc 3 báo giá', 'Chuẩn hoá thông tin', 'Đưa về cùng tiêu chí', 'So sánh', 'Chỉ ra điểm khác biệt'],
    ketQua: function (chon, sua) {
      var giaC = sua ? 126500000 : 115000000;
      var nhanXet = {
        'chi-phi': sua ? ['Cân nhắc', 'Tốt nhất', 'Cao nhất'] : ['Cân nhắc', 'Phù hợp', 'Tốt nhất'],
        'giao-nhanh': sua ? ['Chậm nhất', 'Tốt nhất', 'Cao nhất'] : ['Chậm nhất', 'Tốt nhất', 'Phù hợp'],
        'hau-mai': sua ? ['Cân nhắc', 'Tốt nhất', 'Cao nhất'] : ['Cân nhắc', 'Tốt nhất', 'Phù hợp']
      }[chon];
      var deXuat = {
        'chi-phi': sua
          ? 'Đề xuất: NCC B — thấp nhất khi quy về cùng mức đã gồm VAT (118,5 triệu), giao nhanh nhất 10 ngày.'
          : 'Đề xuất: NCC C — giá thấp nhất (115,0 triệu), giao trong 12 ngày.',
        'giao-nhanh': sua
          ? 'Đề xuất: NCC B — giao nhanh nhất 10 ngày và cũng rẻ nhất khi quy về cùng mức VAT.'
          : 'Đề xuất: NCC B — giao 10 ngày. NCC C rẻ hơn 3,5 triệu nhưng giao chậm hơn 2 ngày.',
        'hau-mai': sua
          ? 'Đề xuất: NCC B — bảo hành 18 tháng và rẻ nhất khi quy về cùng mức VAT.'
          : 'Đề xuất: NCC B — bảo hành 18 tháng, dài hơn 6 tháng; giá cao hơn NCC C 3,5 triệu.'
      }[chon];
      return {
        type: 'table',
        head: ['Tiêu chí', 'NCC A', 'NCC B', 'NCC C'],
        num: true,
        rows: [
          ['Giá đã gồm VAT (đ)', vnd(120000000), vnd(118500000), { v: vnd(giaC), changed: sua }],
          ['Giao hàng', '14 ngày', '10 ngày', '12 ngày'],
          ['Thanh toán', '30% – 70%', '50% – 50%', '30% – 70%'],
          ['Hậu mãi', '12 tháng', '18 tháng', '12 tháng'],
          ['Nhận xét', nhanXet[0], nhanXet[1], { v: nhanXet[2], changed: sua }]
        ],
        summary: { text: deXuat, changed: sua }
      };
    },
    kiemTra: [
      { ten: 'Số liệu khớp với bản báo giá gốc' },
      { ten: 'Không thiếu nhà cung cấp nào trong danh sách mời' },
      {
        ten: 'Đơn vị tiền tệ và VAT nhất quán giữa các dòng',
        loi: {
          goiY: 'Báo giá NCC C ghi “Đơn giá trên chưa bao gồm thuế GTGT 10%”, còn NCC A và B đã gồm thuế. Bảng đang so giá chưa thuế của C với giá đã thuế của A và B, nên C trông rẻ nhất.',
          nut: 'Quy NCC C về giá đã gồm VAT',
          daSua: 'Đã sửa: NCC C là 126.500.000 đ sau thuế, cao nhất trong 3 nhà cung cấp.'
        }
      },
      { ten: 'Không chứa dữ liệu thuộc danh mục cấm nạp' }
    ],
    tietKiem: { truoc: '3 giờ 30', sau: 'khoảng 1 giờ' },
    baiHoc: 'Nếu dùng bảng ngay, bạn đã chọn nhầm NCC C chỉ vì một dòng ghi chú về VAT ở trang 3.'
  };

  var thuGiamGia = {
    id: 'thu-giam-gia',
    ten: 'Soạn thư đề nghị giảm giá',
    thoiGian: '~2 phút',
    dauVao: {
      fields: [
        ['Nhà cung cấp', 'Công ty Bao bì Tân Á'],
        ['Hợp đồng khung', 'Số 14/2025/HĐK, hiệu lực đến 12/2026'],
        ['Sản lượng 12 tháng tới', 'Khoảng 48 tấn'],
        ['Đề nghị', 'Giảm 5% đơn giá từ đơn hàng tháng 11'],
        ['Điều kiện kèm theo', 'Thanh toán trong 15 ngày kể từ khi nhận hàng'],
        ['Người gửi', 'Chuyên viên mua hàng — không có thẩm quyền ký hay gia hạn hợp đồng']
      ],
      yeuCau: 'Soạn email đề nghị Tân Á giảm 5% đơn giá, giữ nguyên các điều khoản khác của hợp đồng khung.'
    },
    nut: {
      ten: 'Giọng thư',
      chon: [
        { id: 'mem', label: 'Mềm mỏng' },
        { id: 'trung-tinh', label: 'Trung tính' },
        { id: 'cung', label: 'Cứng rắn' }
      ]
    },
    xuLy: ['Đọc bối cảnh hợp đồng', 'Xác định điều cần đề nghị', 'Chọn giọng văn', 'Soạn bản nháp'],
    ketQua: function (chon, sua) {
      var hua = {
        mem: ['Nếu quý công ty đồng ý, chúng tôi cam kết ký gia hạn hợp đồng khung thêm 3 năm.',
          'Chúng tôi sẵn sàng trao đổi thêm về kế hoạch sản lượng năm tới trong buổi làm việc gần nhất.'],
        'trung-tinh': ['Nếu Tân Á đồng ý, chúng tôi cam kết ký gia hạn hợp đồng khung thêm 3 năm.',
          'Chúng tôi sẵn sàng trao đổi thêm về kế hoạch sản lượng năm tới khi hai bên gặp nhau.'],
        cung: ['Nếu không nhận được điều chỉnh trước ngày 30/10, chúng tôi sẽ chấm dứt hợp tác và chuyển sang nhà cung cấp khác.',
          'Đề nghị Tân Á phản hồi trước ngày 30/10 để chúng tôi kịp đưa vào kế hoạch mua hàng tháng 11.']
      }[chon];
      var than = {
        mem: [
          'Kính gửi Anh/Chị phụ trách kinh doanh Công ty Bao bì Tân Á,',
          'Trước hết, phòng Mua hàng xin cảm ơn Tân Á đã đồng hành ổn định trong thời gian thực hiện hợp đồng khung số 14/2025/HĐK.',
          'Trong 12 tháng tới, chúng tôi dự kiến duy trì sản lượng khoảng 48 tấn. Với mức sản lượng này, rất mong Tân Á cân nhắc giảm 5% đơn giá, áp dụng từ đơn hàng tháng 11. Đổi lại, chúng tôi có thể thanh toán trong vòng 15 ngày kể từ khi nhận hàng.',
          null,
          'Các điều khoản khác của hợp đồng khung giữ nguyên. Rất mong nhận được phản hồi của Anh/Chị.',
          'Trân trọng,'
        ],
        'trung-tinh': [
          'Kính gửi Công ty Bao bì Tân Á,',
          'Phòng Mua hàng gửi Tân Á đề nghị điều chỉnh đơn giá theo hợp đồng khung số 14/2025/HĐK.',
          'Sản lượng dự kiến 12 tháng tới: khoảng 48 tấn. Đề nghị: giảm 5% đơn giá, áp dụng từ đơn hàng tháng 11. Điều kiện kèm theo: thanh toán trong 15 ngày kể từ khi nhận hàng.',
          null,
          'Các điều khoản khác của hợp đồng khung giữ nguyên. Đề nghị Tân Á phản hồi trước ngày 30/10.',
          'Trân trọng,'
        ],
        cung: [
          'Kính gửi Công ty Bao bì Tân Á,',
          'Phòng Mua hàng đề nghị Tân Á điều chỉnh đơn giá theo hợp đồng khung số 14/2025/HĐK.',
          'Với sản lượng dự kiến khoảng 48 tấn trong 12 tháng tới, mức giá hiện tại chưa tương xứng. Chúng tôi đề nghị giảm 5% đơn giá từ đơn hàng tháng 11 và sẵn sàng thanh toán trong 15 ngày kể từ khi nhận hàng.',
          null,
          'Các điều khoản khác của hợp đồng khung giữ nguyên.',
          'Trân trọng,'
        ]
      }[chon];
      return {
        type: 'letter',
        subject: 'Đề nghị điều chỉnh đơn giá bao bì từ tháng 11',
        paras: than.map(function (p) {
          return p === null ? { text: sua ? hua[1] : hua[0], changed: sua } : { text: p };
        })
      };
    },
    kiemTra: [
      { ten: 'Số liệu đúng đầu vào: 5%, 48 tấn, 15 ngày' },
      {
        ten: 'Không có cam kết vượt thẩm quyền người gửi',
        loi: {
          goiY: 'Thư có một câu cam kết mà người gửi không có quyền đưa ra, và câu đó cũng không có trong thông tin đầu vào. Chuyên viên mua hàng không được ký, gia hạn hay chấm dứt hợp đồng.',
          nut: 'Viết lại câu vượt thẩm quyền',
          daSua: 'Đã sửa: câu cam kết được thay bằng một đề nghị nằm trong thẩm quyền.'
        }
      },
      { ten: 'Giọng văn hợp với quan hệ nhà cung cấp hiện có' }
    ],
    tietKiem: { truoc: '75 phút', sau: 'khoảng 22 phút' },
    baiHoc: 'Nếu gửi ngay, thư đã hứa thay công ty một điều mà chỉ Ban giám đốc mới quyết được.'
  };

  var TIEU_CHI = [
    { ten: 'Năng lực sản xuất', ti: 0.84, nguon: '3 dây chuyền CNC, công suất 12.000 sản phẩm/tháng (tr. 4)' },
    { ten: 'Chứng nhận chất lượng', ti: 0.9, tiSua: 0.4, nguon: 'ISO 9001 còn hiệu lực (tr. 9)', nguonSua: 'ISO 9001 hết hạn 03/2026, đang chờ tái đánh giá (tr. 9)' },
    { ten: 'Năng lực tài chính', ti: 0.7, nguon: 'Doanh thu 2025 đạt 86 tỷ, có lãi 3 năm liền (tr. 11)' },
    { ten: 'Giao hàng', ti: 0.8, nguon: 'Tỉ lệ giao đúng hẹn năm 2025 là 94% (tr. 12)' },
    { ten: 'Khách hàng tham chiếu', ti: 0.6, nguon: '2 khách hàng tham chiếu, 1 khách cùng ngành (tr. 14)' }
  ];
  var TRONG_SO = {
    'can-bang': [25, 20, 20, 20, 15],
    'chat-luong': [25, 30, 15, 15, 15],
    'gia-giao': [20, 10, 25, 30, 15]
  };

  var hoSoNcc = {
    id: 'ho-so-ncc',
    ten: 'Chấm hồ sơ năng lực nhà cung cấp',
    thoiGian: '~3 phút',
    dauVao: {
      files: [{ ten: 'Hồ sơ năng lực — Công ty Cơ khí Minh Phát.pdf', meta: '14 trang' }],
      yeuCau: 'Chấm hồ sơ năng lực của Minh Phát theo khung 5 tiêu chí của phòng, thang 100 điểm, ghi rõ trang nguồn cho từng điểm.'
    },
    baoVe: {
      canhBao: 'Trang 2 của hồ sơ có số CCCD và số điện thoại cá nhân của người đại diện. Theo danh mục dữ liệu cấm nạp của gói Mua hàng, cần ẩn trước khi xử lý.',
      truoc: 'Người đại diện theo pháp luật: Trần Văn Hải · CCCD 012345678901 · ĐT 0900 000 111 · Chức vụ: Giám đốc',
      sau: 'Người đại diện theo pháp luật: [Người đại diện] · CCCD [đã ẩn] · ĐT [đã ẩn] · Chức vụ: Giám đốc',
      nut: 'Ẩn thông tin và tiếp tục'
    },
    nut: {
      ten: 'Trọng số',
      chon: [
        { id: 'can-bang', label: 'Cân bằng' },
        { id: 'chat-luong', label: 'Ưu tiên chất lượng' },
        { id: 'gia-giao', label: 'Ưu tiên giao hàng' }
      ]
    },
    xuLy: ['Đọc 14 trang hồ sơ', 'Trích thông tin theo tiêu chí', 'Chấm theo khung', 'Nêu điểm cần kiểm tra'],
    ketQua: function (chon, sua) {
      var ts = TRONG_SO[chon];
      var tong = 0;
      var rows = TIEU_CHI.map(function (c, i) {
        var ti = sua && c.tiSua != null ? c.tiSua : c.ti;
        var diem = Math.round(ts[i] * ti);
        tong += diem;
        var doi = sua && c.tiSua != null;
        return [c.ten, ts[i] + '', { v: diem + '', changed: doi }, { v: doi ? c.nguonSua : c.nguon, changed: doi }];
      });
      var kl = tong >= 75 ? 'Đạt — đưa vào danh sách nhà cung cấp' : tong >= 60 ? 'Đạt có điều kiện — yêu cầu bổ sung chứng nhận ISO 9001 còn hiệu lực' : 'Chưa đạt';
      rows.push(['Tổng', '100', { v: tong + '', changed: sua, strong: true }, { v: kl, changed: sua, strong: true }]);
      return { type: 'table', head: ['Tiêu chí', 'Trọng số', 'Điểm', 'Căn cứ trong hồ sơ'], numCols: [1, 2], rows: rows };
    },
    kiemTra: [
      {
        ten: 'Mỗi điểm có dẫn trang nguồn và khớp với hồ sơ',
        loi: {
          goiY: 'Trang 9 ghi chứng nhận ISO 9001 hết hạn tháng 03/2026, nhưng bảng chấm lại ghi “còn hiệu lực” và cho 90% số điểm của tiêu chí này.',
          nut: 'Chấm lại tiêu chí Chứng nhận theo trang 9',
          daSua: 'Đã sửa: tiêu chí Chứng nhận chấm lại theo trang 9, tổng điểm và kết luận thay đổi theo.'
        }
      },
      { ten: 'Không suy diễn thông tin ngoài hồ sơ' },
      { ten: 'Dữ liệu cá nhân đã được ẩn trước khi xử lý' }
    ],
    tietKiem: { truoc: 'khoảng 2 giờ', sau: 'khoảng 40 phút' },
    baiHoc: 'Nếu dùng bảng chấm ngay, Minh Phát đã được đưa vào danh sách dù chứng nhận chất lượng đã hết hạn.'
  };

  /* ───────────── GIẢNG DẠY ───────────── */

  var keHoach = {
    id: 'ke-hoach',
    ten: 'Kế hoạch tiết học',
    thoiGian: '~2 phút',
    dauVao: {
      fields: [
        ['Môn · Lớp', 'Toán · Lớp 6'],
        ['Bài', 'Phân số — So sánh phân số'],
        ['Sĩ số', '40 học sinh'],
        ['Đặc điểm lớp', '5 học sinh còn yếu phần quy đồng mẫu số'],
        ['Yêu cầu', 'Có hoạt động nhóm và kiểm tra nhanh cuối tiết']
      ],
      yeuCau: 'Soạn giúp tôi kế hoạch tiết học bài So sánh phân số theo thông tin lớp ở trên.'
    },
    nut: {
      ten: 'Thời lượng',
      chon: [
        { id: '45', label: '1 tiết · 45 phút' },
        { id: '90', label: '2 tiết · 90 phút' }
      ]
    },
    xuLy: ['Thông tin lớp học', 'Mục tiêu bài học', 'Cấu trúc tiết học', 'Hoạt động', 'Điều chỉnh theo nhóm học sinh'],
    ketQua: function (chon, sua) {
      var rows;
      if (chon === '45') {
        rows = [
          ['5 phút', 'Khởi động: trò chơi “Ai nhanh hơn” so sánh phân số cùng mẫu', 'Gợi lại kiến thức cũ'],
          ['10 phút', 'Hình thành kiến thức: quy đồng để so sánh 3/4 và 5/6', 'Nắm cách so sánh phân số khác mẫu'],
          [{ v: sua ? '15 phút' : '20 phút', changed: sua }, 'Hoạt động nhóm: nhóm 4–5 em xếp thẻ phân số theo thứ tự tăng dần; 5 em còn yếu chia vào các nhóm khác nhau, có thẻ gợi ý quy đồng', 'Vận dụng, hỗ trợ lẫn nhau'],
          ['10 phút', 'Luyện tập: 4 bài trên phiếu, 2 mức độ', 'Kiểm tra mức độ hiểu'],
          ['5 phút', 'Exit ticket: so sánh 2/3 và 3/5, nộp trước khi ra về', 'Biết em nào cần hỗ trợ thêm']
        ];
      } else {
        rows = [
          ['10 phút', 'Khởi động: trò chơi “Ai nhanh hơn” so sánh phân số cùng mẫu', 'Gợi lại kiến thức cũ'],
          ['20 phút', 'Hình thành kiến thức: quy đồng để so sánh 3/4 và 5/6, rồi 7/8 và 6/7', 'Nắm cách so sánh phân số khác mẫu'],
          [{ v: sua ? '25 phút' : '30 phút', changed: sua }, 'Hoạt động nhóm: nhóm 4–5 em xếp thẻ phân số theo thứ tự tăng dần; 5 em còn yếu chia vào các nhóm khác nhau, có thẻ gợi ý quy đồng', 'Vận dụng, hỗ trợ lẫn nhau'],
          ['20 phút', 'Luyện tập: 6 bài trên phiếu, 3 mức độ', 'Kiểm tra mức độ hiểu'],
          ['10 phút', 'Phân hoá: nhóm khá giỏi so sánh bằng phân số trung gian; 5 em còn yếu làm bài củng cố quy đồng cùng giáo viên', 'Mở rộng và củng cố'],
          ['5 phút', 'Exit ticket: so sánh 2/3 và 3/5, nộp trước khi ra về', 'Biết em nào cần hỗ trợ thêm']
        ];
      }
      var tong = chon === '45' ? (sua ? 45 : 50) : (sua ? 90 : 95);
      return {
        type: 'table',
        head: ['Thời gian', 'Hoạt động', 'Mục đích'],
        rows: rows,
        summary: { text: 'Tổng thời lượng: ' + tong + ' phút', changed: sua }
      };
    },
    kiemTra: [
      { ten: 'Kiến thức chính xác, đúng chương trình lớp 6' },
      {
        ten: 'Tổng thời lượng các hoạt động khớp với tiết học',
        loi: {
          goiY: function (chon) {
            return chon === '45'
              ? 'Cộng cột thời gian: 5 + 10 + 20 + 10 + 5 = 50 phút, vượt tiết học 45 phút.'
              : 'Cộng cột thời gian: 10 + 20 + 30 + 20 + 10 + 5 = 95 phút, vượt 2 tiết 90 phút.';
          },
          nut: 'Rút ngắn hoạt động nhóm 5 phút',
          daSua: 'Đã sửa: hoạt động nhóm rút 5 phút, tổng thời lượng khớp với tiết học.'
        }
      },
      { ten: 'Có hỗ trợ cụ thể cho 5 học sinh còn yếu' },
      { ten: 'Không có thông tin cá nhân của học sinh' }
    ],
    tietKiem: { truoc: 'khoảng 90 phút', sau: 'khoảng 25 phút' },
    baiHoc: 'Nếu dạy theo bản nháp, tiết học đã hụt 5 phút ngay phần exit ticket, đúng phần giúp bạn biết em nào cần hỗ trợ.'
  };

  var CAU = {
    1: { q: 'So sánh 3/7 và 5/7.', a: '3/7 < 5/7 (cùng mẫu, tử nhỏ hơn thì phân số nhỏ hơn)' },
    2: { q: 'So sánh 4/9 và 4/5.', a: '4/9 < 4/5 (cùng tử dương, mẫu lớn hơn thì phân số nhỏ hơn)' },
    3: { q: 'Điền dấu thích hợp: 2/3 … 1', a: '2/3 < 1' },
    4: { q: 'So sánh −1/2 và 1/3.', a: '−1/2 < 1/3 (phân số âm nhỏ hơn phân số dương)' },
    5: { q: 'So sánh 3/4 và 5/6.', a: '3/4 = 9/12, 5/6 = 10/12, nên 3/4 < 5/6' },
    6: { q: 'Sắp xếp theo thứ tự tăng dần: 1/2; 2/5; 3/4.', a: '2/5 < 1/2 < 3/4' },
    7: { q: 'So sánh 7/8 và 6/7.', a: '7/8 = 49/56, 6/7 = 48/56, nên 7/8 > 6/7' },
    8: { q: 'So sánh 5/6 và 7/9.', a: '5/6 < 7/9 (vì mẫu 9 lớn hơn mẫu 6)', aSua: '5/6 = 15/18, 7/9 = 14/18, nên 5/6 > 7/9' },
    9: { q: 'So sánh 2023/2024 và 2024/2025.', a: '2023/2024 = 1 − 1/2024 và 2024/2025 = 1 − 1/2025; vì 1/2024 > 1/2025 nên 2023/2024 < 2024/2025' },
    10: { q: 'Tìm một phân số có mẫu 12 nằm giữa 1/3 và 1/2.', a: '1/3 = 4/12 và 1/2 = 6/12, nên 5/12' }
  };

  var phieuBaiTap = {
    id: 'phieu-bai-tap',
    ten: 'Phiếu bài tập theo 3 mức độ',
    thoiGian: '~2 phút',
    dauVao: {
      fields: [
        ['Môn · Lớp', 'Toán · Lớp 6'],
        ['Chủ đề', 'So sánh phân số'],
        ['Số câu', '9 câu, chia 3 mức: cơ bản · chuẩn · nâng cao'],
        ['Kèm theo', 'Đáp án ngắn cho giáo viên']
      ],
      yeuCau: 'Tạo phiếu bài tập 9 câu về so sánh phân số, chia 3 mức độ, có đáp án.'
    },
    nut: {
      ten: 'Số câu mỗi mức',
      chon: [
        { id: '432', label: '4 · 3 · 2' },
        { id: '333', label: '3 · 3 · 3' }
      ]
    },
    xuLy: ['Mục tiêu chủ đề', 'Chọn dạng bài', 'Chia mức độ', 'Tạo đáp án'],
    ketQua: function (chon, sua) {
      var nhom = chon === '432'
        ? [['Cơ bản', [1, 2, 3, 4]], ['Chuẩn', [5, 6, 7]], ['Nâng cao', [8, 9]]]
        : [['Cơ bản', [1, 2, 3]], ['Chuẩn', [5, 6, 7]], ['Nâng cao', [8, 9, 10]]];
      var stt = 0;
      return {
        type: 'questions',
        groups: nhom.map(function (g) {
          return {
            title: g[0],
            items: g[1].map(function (id) {
              stt++;
              var c = CAU[id];
              var doi = sua && c.aSua;
              return { n: stt, q: c.q, a: doi ? c.aSua : c.a, changed: !!doi };
            })
          };
        })
      };
    },
    kiemTra: [
      {
        ten: 'Đáp án đúng ở mọi câu',
        loi: {
          goiY: 'Câu “So sánh 5/6 và 7/9”: quy đồng được 5/6 = 15/18 và 7/9 = 14/18, nên 5/6 > 7/9. Đáp án đang ghi ngược, và lý do “mẫu lớn hơn” chỉ đúng khi hai phân số cùng tử.',
          nut: 'Sửa đáp án câu so sánh 5/6 và 7/9',
          daSua: 'Đã sửa: đáp án ghi đúng 5/6 > 7/9 kèm cách quy đồng.'
        }
      },
      { ten: 'Câu hỏi rõ nghĩa, ký hiệu phân số đúng' },
      { ten: 'Mức độ tăng dần hợp lý' }
    ],
    tietKiem: { truoc: 'khoảng 60 phút', sau: 'khoảng 15 phút' },
    baiHoc: 'Nếu phát phiếu ngay, cả lớp đã học theo một đáp án sai, lại đúng ở câu dành cho học sinh khá giỏi.'
  };

  var nhanXet = {
    id: 'nhan-xet',
    ten: 'Nhận xét học sinh, đã ẩn danh',
    thoiGian: '~3 phút',
    dauVao: {
      raw: 'Nguyễn Văn An, lớp 7A3, SĐT phụ huynh 0900 000 222, nhà ở ngõ 12 phố Trần Phú. Gia đình đang có chuyện riêng. Điểm Toán giữa kỳ 4,5. Hay sai khi cộng phân số khác mẫu, chưa quy đồng đã cộng tử với tử. Tích cực phát biểu trong giờ.',
      yeuCau: 'Viết nhận xét cho em này dựa trên ghi chú của tôi.'
    },
    baoVe: {
      canhBao: 'Ghi chú có họ tên đầy đủ, lớp cụ thể, số điện thoại phụ huynh, địa chỉ nhà và hoàn cảnh gia đình. Theo lớp bảo vệ dữ liệu học sinh, những thông tin này không đưa vào AI.',
      truoc: 'Nguyễn Văn An, lớp 7A3, SĐT phụ huynh 0900 000 222, nhà ở ngõ 12 phố Trần Phú. Gia đình đang có chuyện riêng. Điểm Toán giữa kỳ 4,5. Hay sai khi cộng phân số khác mẫu, chưa quy đồng đã cộng tử với tử. Tích cực phát biểu trong giờ.',
      sau: 'Học sinh A, lớp 7. Điểm Toán giữa kỳ dưới mức yêu cầu. Hay sai khi cộng phân số khác mẫu, chưa quy đồng đã cộng tử với tử. Tích cực phát biểu trong giờ.',
      nut: 'Dùng bản tối thiểu và tiếp tục'
    },
    nut: {
      ten: 'Gửi cho',
      chon: [
        { id: 'phu-huynh', label: 'Phụ huynh' },
        { id: 'so-theo-doi', label: 'Sổ theo dõi của lớp' }
      ]
    },
    xuLy: ['Đọc ghi chú đã ẩn danh', 'Tách điểm mạnh và điểm cần cải thiện', 'Chọn giọng văn theo người nhận', 'Đề xuất cách hỗ trợ'],
    ketQua: function (chon, sua) {
      var suyDien = sua ? null : { text: chon === 'phu-huynh' ? 'Em còn thường xuyên không làm bài tập về nhà.' : 'Thái độ: thường xuyên không làm bài tập về nhà.', flagged: true };
      if (chon === 'phu-huynh') {
        var paras = [
          { text: 'Kính gửi phụ huynh em A,' },
          { text: 'Trong giờ học, em tích cực phát biểu và mạnh dạn chia sẻ cách làm. Đây là điểm rất đáng khen.' },
          { text: 'Ở phần cộng phân số khác mẫu, em hay cộng tử với tử khi chưa quy đồng mẫu số, nên kết quả giữa kỳ chưa đạt mức yêu cầu.' }
        ];
        if (suyDien) paras.push(suyDien);
        paras.push(
          { text: 'Trong 2 tuần tới, thầy/cô sẽ cho em luyện quy đồng mẫu số 10 phút mỗi buổi học. Gia đình có thể nhắc em làm 3 bài trong phiếu luyện tập mỗi tối.' },
          { text: 'Cảm ơn gia đình đã phối hợp.' }
        );
        return { type: 'letter', paras: paras, note: sua ? 'Đã bỏ câu suy diễn không có trong ghi chú.' : '' };
      }
      var items = [
        { k: 'Điểm mạnh', text: 'Tích cực phát biểu, mạnh dạn chia sẻ cách làm.' },
        { k: 'Cần cải thiện', text: 'Cộng phân số khác mẫu: cộng tử với tử khi chưa quy đồng mẫu số.' }
      ];
      if (suyDien) items.push({ k: 'Thái độ', text: 'Thường xuyên không làm bài tập về nhà.', flagged: true });
      items.push({ k: 'Kế hoạch hỗ trợ', text: 'Luyện quy đồng 10 phút mỗi buổi trong 2 tuần, kiểm tra lại cuối tuần thứ 2.' });
      return { type: 'list', items: items, note: sua ? 'Đã bỏ dòng suy diễn không có trong ghi chú.' : '' };
    },
    kiemTra: [
      { ten: 'Không còn thông tin nhận diện học sinh' },
      {
        ten: 'Nhận xét chỉ dựa trên dữ kiện đã có',
        loi: {
          goiY: 'Ý “thường xuyên không làm bài tập về nhà” không có trong ghi chú ban đầu. AI đã tự suy diễn, và nếu gửi đi, câu này có thể làm phụ huynh hiểu sai về em.',
          nut: 'Bỏ ý suy diễn',
          daSua: 'Đã sửa: bỏ ý không có trong ghi chú.'
        }
      },
      { ten: 'Có gợi ý cải thiện cụ thể' }
    ],
    tietKiem: { truoc: 'khoảng 10 phút mỗi em', sau: 'khoảng 3 phút mỗi em' },
    baiHoc: 'Nếu gửi ngay, phụ huynh đã đọc một nhận xét về việc làm bài tập mà bạn chưa từng ghi nhận.'
  };

  return [
    {
      id: 'mua-hang',
      ten: 'Mua hàng – Thu mua',
      moTa: 'Báo giá, thư gửi nhà cung cấp, hồ sơ năng lực.',
      tinhHuong: [baoGia, thuGiamGia, hoSoNcc],
      tiepTheo: [
        { ten: 'Dùng gói Miễn phí trên AI của bạn', moTa: 'Gói Nhập nghề 0 đ: đăng nhập, thanh toán 0 đ, rồi thực hành 5 tình huống Mua hàng trên ChatGPT, Claude, Copilot hoặc Gemini bạn đang dùng.', href: 'bang-gia.html', chinh: true },
        { ten: 'Xem gói Mua hàng', moTa: '24 tình huống, lớp bảo vệ dữ liệu, một buổi kèm cặp 45 phút.', href: 'nghe-mua-hang.html' },
        { ten: 'Cho cả phòng Mua hàng', moTa: 'Bảng điều khiển đo mức độ áp dụng và kiểm duyệt đầu ra AI.', href: 'bang-dieu-khien.html' }
      ]
    },
    {
      id: 'giang-day',
      ten: 'Giảng dạy',
      moTa: 'Kế hoạch tiết học, phiếu bài tập, nhận xét học sinh.',
      tinhHuong: [keHoach, phieuBaiTap, nhanXet],
      tiepTheo: [
        { ten: 'Dùng gói Miễn phí trên AI của bạn', moTa: 'Gói Nhập nghề 0 đ: đăng nhập, thanh toán 0 đ, rồi thực hành 5 tình huống Giảng dạy trên ChatGPT, Claude, Copilot hoặc Gemini bạn đang dùng.', href: 'bang-gia.html', chinh: true },
        { ten: 'Xem gói Giảng dạy', moTa: '30+ tình huống từ chuẩn bị bài đến nhận xét sau giờ dạy.', href: 'nghe-giang-day.html' },
        { ten: 'Cho cả tổ bộ môn', moTa: 'Bảng giá doanh nghiệp và gói tinh chỉnh theo trường.', href: 'bang-gia.html' }
      ]
    }
  ];
})();
