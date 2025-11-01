# Hướng dẫn cài đặt dependencies cho giao diện FPT Play

## Cài đặt các packages cần thiết

Chạy lệnh sau trong terminal tại thư mục `TheGrind5_EventManagement_FrontEnd`:

```bash
npm install swiper tailwindcss postcss autoprefixer
```

Hoặc nếu gặp lỗi PowerShell, chạy:

```powershell
npm install swiper
npm install tailwindcss
npm install postcss
npm install autoprefixer
```

## Khởi tạo TailwindCSS (nếu cần)

Sau khi cài đặt, chạy:

```bash
npx tailwindcss init -p
```

**Lưu ý:** File `tailwind.config.js` và `postcss.config.js` đã được tạo sẵn trong project.

## Cấu trúc components mới

### 1. HeroEvents.jsx
- Component hero banner full-width với carousel
- Location: `src/components/ui/HeroEvents.jsx`
- Features:
  - Full-width hero banner
  - Thumbnail slider phía dưới
  - Background blur effect
  - Gradient overlay
  - Auto-slide với SwiperJS

### 2. EventCarousel.jsx
- Component carousel cho các danh sách sự kiện
- Location: `src/components/ui/EventCarousel.jsx`
- Features:
  - Card style 16:9
  - Hover zoom effect
  - Badge hiển thị
  - Responsive carousel

### 3. events.js
- File data mẫu với 10 sự kiện
- Location: `src/data/events.js`

## Sử dụng

Các components đã được tích hợp vào `HomePage.jsx`. Trang chủ sẽ tự động hiển thị:
1. Hero Featured Events Section ở đầu
2. Các carousel section theo chủ đề:
   - Sự kiện nổi bật
   - Sự kiện xu hướng
   - Workshop
   - Music
   - Campus Event
   - Dành cho bạn
   - Sự kiện sắp diễn ra

## Styles

Components sử dụng TailwindCSS classes kết hợp với Material-UI. Theme màu chính:
- Orange: #F97316 (FPT Play style)
- Black: #000000
- Gray: #1A1A1A

## Responsive

Tất cả components đã được tối ưu responsive cho:
- Mobile (320px+)
- Tablet (640px+)
- Desktop (1024px+)
- Large Desktop (1280px+)

