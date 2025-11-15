# Hướng dẫn thêm font tiếng Việt cho jsPDF

## Vấn đề
jsPDF mặc định sử dụng font Helvetica, không hỗ trợ đầy đủ ký tự tiếng Việt (dấu thanh, dấu mũ, etc.)

## Giải pháp
Cần thêm font Unicode hỗ trợ tiếng Việt vào jsPDF.

## Các bước thực hiện:

### 1. Tải font tiếng Việt
- Tải font Noto Sans hoặc Arial Unicode MS (file .ttf)
- Hoặc sử dụng font từ Google Fonts: https://fonts.google.com/noto/specimen/Noto+Sans

### 2. Chuyển đổi font sang định dạng jsPDF
1. Truy cập: https://rawgit.com/MrRio/jsPDF/master/fontconverter/fontconverter.html
2. Upload file font .ttf
3. Nhấn "Create" để tạo file JavaScript chứa font base64
4. Lưu file JavaScript này vào thư mục `src/utils/` (ví dụ: `notoSans.js`)

### 3. Import và sử dụng font trong code
```javascript
// Import font file
import './utils/notoSans.js'; // hoặc tên file bạn đã tạo

// Trong hàm export PDF:
const doc = new jsPDF();
doc.addFont('NotoSans.ttf', 'NotoSans', 'normal');
doc.setFont('NotoSans');
```

## Lưu ý
- File font có thể khá lớn (vài MB)
- Có thể tối ưu bằng cách chỉ include các ký tự tiếng Việt cần thiết
- Hoặc sử dụng font subset chỉ chứa ký tự Latin + Vietnamese

