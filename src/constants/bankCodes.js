/**
 * Danh sách các ngân hàng Việt Nam và mã code tương ứng
 * Sử dụng cho VietQR và các dịch vụ thanh toán
 */

export const BANK_CODES = [
  { code: '970415', name: 'VietinBank', fullName: 'Ngân hàng Công thương Việt Nam' },
  { code: '970436', name: 'Vietcombank', fullName: 'Ngân hàng Ngoại thương Việt Nam' },
  { code: '970418', name: 'BIDV', fullName: 'Ngân hàng Đầu tư và Phát triển Việt Nam' },
  { code: '970405', name: 'Agribank', fullName: 'Ngân hàng Nông nghiệp và Phát triển Nông thôn Việt Nam' },
  { code: '970448', name: 'OCB', fullName: 'Ngân hàng Phương Đông' },
  { code: '970422', name: 'MBBank', fullName: 'Ngân hàng Quân đội' },
  { code: '970407', name: 'Techcombank', fullName: 'Ngân hàng Kỹ thương Việt Nam' },
  { code: '970416', name: 'ACB', fullName: 'Ngân hàng Á Châu' },
  { code: '970432', name: 'VPBank', fullName: 'Ngân hàng Việt Nam Thịnh Vượng' },
  { code: '970423', name: 'TPBank', fullName: 'Ngân hàng Tiên Phong' },
  { code: '970403', name: 'Sacombank', fullName: 'Ngân hàng Sài Gòn Thương Tín' },
  { code: '970437', name: 'HDBank', fullName: 'Ngân hàng Phát triển Thành phố Hồ Chí Minh' },
  { code: '970454', name: 'VietCapitalBank', fullName: 'Ngân hàng Bản Việt' },
  { code: '970429', name: 'SCB', fullName: 'Ngân hàng Sài Gòn' },
  { code: '970441', name: 'VIB', fullName: 'Ngân hàng Quốc tế Việt Nam' },
  { code: '970443', name: 'SHB', fullName: 'Ngân hàng Sài Gòn - Hà Nội' },
  { code: '970431', name: 'Eximbank', fullName: 'Ngân hàng Xuất Nhập khẩu Việt Nam' },
  { code: '970426', name: 'MSB', fullName: 'Ngân hàng Hàng Hải' },
  { code: '546034', name: 'CAKE', fullName: 'CAKE by VPBank' },
  { code: '970427', name: 'VietBank', fullName: 'Ngân hàng Việt Nam Thương Tín' },
  { code: '970428', name: 'PGBank', fullName: 'Ngân hàng Xăng dầu Petrolimex' },
  { code: '970430', name: 'PublicBank', fullName: 'Ngân hàng TNHH MTV Public Việt Nam' },
  { code: '970433', name: 'NAB', fullName: 'Ngân hàng Nam Á' },
  { code: '970434', name: 'ShinhanBank', fullName: 'Ngân hàng Shinhan Việt Nam' },
  { code: '970435', name: 'ABBank', fullName: 'Ngân hàng An Bình' },
  { code: '970438', name: 'VietABank', fullName: 'Ngân hàng Việt Á' },
  { code: '970439', name: 'SeABank', fullName: 'Ngân hàng Đông Nam Á' },
  { code: '970440', name: 'BacABank', fullName: 'Ngân hàng Bắc Á' },
  { code: '970442', name: 'OceanBank', fullName: 'Ngân hàng Đại Dương' },
  { code: '970444', name: 'NCB', fullName: 'Ngân hàng Quốc Dân' },
  { code: '970446', name: 'PVcomBank', fullName: 'Ngân hàng Đại Chúng Việt Nam' },
  { code: '970447', name: 'GPBank', fullName: 'Ngân hàng Dầu Khí Toàn Cầu' },
  { code: '970449', name: 'BaoVietBank', fullName: 'Ngân hàng Bảo Việt' },
  { code: '970451', name: 'KienLongBank', fullName: 'Ngân hàng Kiên Long' },
  { code: '970452', name: 'DongABank', fullName: 'Ngân hàng Đông Á' },
];

/**
 * Tìm ngân hàng theo mã code
 * @param {string} code - Mã code ngân hàng
 * @returns {Object|null} - Thông tin ngân hàng hoặc null nếu không tìm thấy
 */
export const getBankByCode = (code) => {
  return BANK_CODES.find(bank => bank.code === code) || null;
};

/**
 * Tìm ngân hàng theo tên (không phân biệt hoa thường)
 * @param {string} name - Tên ngân hàng
 * @returns {Object|null} - Thông tin ngân hàng hoặc null nếu không tìm thấy
 */
export const getBankByName = (name) => {
  const searchName = name.toLowerCase().trim();
  return BANK_CODES.find(bank => 
    bank.name.toLowerCase() === searchName || 
    bank.fullName.toLowerCase().includes(searchName)
  ) || null;
};

/**
 * Lấy danh sách tất cả các ngân hàng
 * @returns {Array} - Danh sách các ngân hàng
 */
export const getAllBanks = () => {
  return BANK_CODES;
};

/**
 * Lấy danh sách các ngân hàng phổ biến (top banks)
 * @returns {Array} - Danh sách các ngân hàng phổ biến
 */
export const getPopularBanks = () => {
  const popularCodes = [
    '970415', // VietinBank
    '970436', // Vietcombank
    '970418', // BIDV
    '970405', // Agribank
    '970407', // Techcombank
    '970416', // ACB
    '970432', // VPBank
    '970422', // MBBank
  ];
  
  return BANK_CODES.filter(bank => popularCodes.includes(bank.code));
};

/**
 * Validate mã code ngân hàng
 * @param {string} code - Mã code cần validate
 * @returns {boolean} - true nếu hợp lệ, false nếu không hợp lệ
 */
export const isValidBankCode = (code) => {
  return BANK_CODES.some(bank => bank.code === code);
};

