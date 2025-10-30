# 🎨 Admin UI - Hướng dẫn sử dụng

## Mô tả
Giao diện quản lý người dùng dành cho Admin, bao gồm dashboard thống kê và danh sách users với đầy đủ chức năng filter, search, sort, pagination.

---

## 🚀 Cách sử dụng

### 1. Đăng nhập với tài khoản Admin

**Truy cập:** http://localhost:3000/login

**Thông tin đăng nhập:**
```
Email: admin@thegrind5.com
Password: 123456
```

### 2. Truy cập Admin Dashboard

Sau khi đăng nhập thành công, truy cập: **http://localhost:3000/admin/dashboard**

---

## 📊 Các trang Admin

### 1. Admin Dashboard (`/admin/dashboard`)

**Tính năng:**
- ✅ Thống kê tổng quan hệ thống
  - Tổng số người dùng
  - Số lượng Hosts
  - Số lượng Customers
  - Số lượng Admins
  - User mới tháng này
  - Tổng Wallet Balance
- ✅ Quick actions - Truy cập nhanh
  - Xem tất cả users
  - Xem danh sách Hosts
  - Xem danh sách Customers

**Screenshot mô tả:**
```
┌─────────────────────────────────────────────────┐
│  📊 Admin Dashboard                             │
│  Tổng quan hệ thống quản lý người dùng         │
└─────────────────────────────────────────────────┘

┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐
│ 👥      │ │ 🎤      │ │ 🎫      │ │ 👑      │
│ Tổng    │ │ Hosts   │ │Customer │ │ Admins  │
│   6     │ │   2     │ │   3     │ │   1     │
└─────────┘ └─────────┘ └─────────┘ └─────────┘

┌─────────┐ ┌─────────┐
│ 📈      │ │ 💰      │
│ User mới│ │ Wallet  │
│   6     │ │2,749,999│
└─────────┘ └─────────┘

🚀 Quản lý nhanh
┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│ 📋 Tất cả    │ │ 🎤 Hosts     │ │ 🎫 Customers │
│ Users        │ │              │ │              │
└──────────────┘ └──────────────┘ └──────────────┘
```

---

### 2. Tất cả Users (`/admin/users`)

**Tính năng:**
- ✅ Hiển thị danh sách tất cả users trong table
- ✅ Tìm kiếm theo tên, email, username
- ✅ Filter theo tabs: Tất cả / Hosts / Customers
- ✅ Sort theo: ID, Họ tên, Email, Role, Wallet, Ngày tạo
- ✅ Pagination với điều khiển trang
- ✅ Xem chi tiết user trong modal
- ✅ Responsive design

**Cách sử dụng:**

1. **Tìm kiếm user:**
   - Nhập từ khóa vào ô search
   - Click nút "Tìm kiếm"
   - Kết quả sẽ filter theo username, email, fullname

2. **Filter theo role:**
   - Click tab "👥 Tất cả" - Xem tất cả users
   - Click tab "🎤 Hosts" - Chỉ xem Hosts
   - Click tab "🎫 Customers" - Chỉ xem Customers

3. **Sort dữ liệu:**
   - Click vào header cột để sort (ID, Họ tên, Email, Role, Wallet, Ngày tạo)
   - Click lần 2 để đổi thứ tự ASC ↔ DESC

4. **Phân trang:**
   - Click "← Trước" để về trang trước
   - Click "Sau →" để sang trang sau
   - Xem trang hiện tại: "Trang X / Y"

5. **Xem chi tiết:**
   - Click nút "👁️ Xem" ở dòng user
   - Modal hiển thị đầy đủ thông tin user
   - Click "×" hoặc click bên ngoài để đóng

**Table columns:**
| Column | Mô tả |
|--------|-------|
| ID | User ID |
| Họ tên | Full name + Avatar (nếu có) |
| Email | Email address |
| Số điện thoại | Phone number |
| Role | Badge màu theo role (Host/Customer/Admin) |
| Wallet | Số dư ví (format VND) |
| Ngày tạo | Ngày tạo tài khoản |
| Hành động | Nút xem chi tiết |

---

### 3. Danh sách Hosts (`/admin/users/hosts`)

**Tính năng:**
- ✅ Chỉ hiển thị users có role "Host"
- ✅ Tất cả tính năng giống trang "Tất cả Users"
- ✅ Search, Sort, Pagination

**Truy cập:**
- URL: `/admin/users/hosts`
- Hoặc click "🎤 Danh sách Hosts" từ Dashboard

---

### 4. Danh sách Customers (`/admin/users/customers`)

**Tính năng:**
- ✅ Chỉ hiển thị users có role "Customer"
- ✅ Tất cả tính năng giống trang "Tất cả Users"
- ✅ Search, Sort, Pagination

**Truy cập:**
- URL: `/admin/users/customers`
- Hoặc click "🎫 Danh sách Customers" từ Dashboard

---

## 🎨 Giao diện

### Color Scheme:
- **Primary:** `#667eea` (Purple gradient)
- **Success:** `#48bb78` (Green - Host)
- **Info:** `#4299e1` (Blue - Customer)
- **Warning:** `#ed8936` (Orange)
- **Gold:** `#ecc94b` (Yellow)

### Components:
- **Statistics Cards:** 6 cards hiển thị thống kê
- **Quick Action Buttons:** 3 buttons link to user lists
- **Users Table:** Responsive table với sort và pagination
- **User Detail Modal:** Popup hiển thị thông tin chi tiết
- **Search Bar:** Input với button search
- **Filter Tabs:** 3 tabs (All/Hosts/Customers)

---

## 🔒 Bảo mật

### Role-based Access Control:
- ✅ Chỉ users có **role = "Admin"** mới truy cập được
- ✅ Protected by `ProtectedRoute` component với `allowedRoles={['Admin']}`
- ✅ Nếu không phải Admin, hiển thị "🚫 Không có quyền truy cập"

### Authentication:
- ✅ JWT token được tự động gửi trong header `Authorization: Bearer <token>`
- ✅ Token lưu trong `localStorage` sau khi login
- ✅ Auto redirect đến `/login` nếu chưa đăng nhập

---

## 📂 Cấu trúc Files

```
src/
├── services/
│   └── adminService.js          # Service gọi Admin APIs
├── pages/
│   └── admin/
│       ├── AdminDashboardPage.jsx  # Trang dashboard
│       └── AdminUsersPage.jsx      # Trang danh sách users
├── styles/
│   ├── AdminDashboard.css       # CSS cho dashboard
│   └── AdminUsers.css           # CSS cho users page
├── components/
│   └── common/
│       └── ProtectedRoute.jsx   # Updated với allowedRoles
└── App.js                       # Routes config
```

---

## 🧪 Testing

### Test với Postman/cURL:
1. **Login để lấy token:**
```bash
POST http://localhost:5000/api/auth/login
{
  "email": "admin@thegrind5.com",
  "password": "123456"
}
```

2. **Test API trực tiếp:**
```bash
GET http://localhost:5000/api/admin/users
Authorization: Bearer <your-token>
```

### Test trên Browser:
1. Start Backend: `cd TheGrind5_EventManagement_BackEnd/src && dotnet run`
2. Start Frontend: `cd TheGrind5_EventManagement_FrontEnd && npm start`
3. Truy cập: http://localhost:3000/login
4. Login với admin@thegrind5.com / 123456
5. Truy cập: http://localhost:3000/admin/dashboard

---

## 🎯 User Flow

```
1. Admin login → http://localhost:3000/login
   ↓
2. Redirect to Dashboard → /admin/dashboard
   ↓
3. Xem thống kê tổng quan
   ↓
4. Click "Tất cả Users" → /admin/users
   ↓
5. Tìm kiếm user: Nhập "nguyen" → Click "Tìm kiếm"
   ↓
6. Filter: Click tab "🎤 Hosts" → /admin/users/hosts
   ↓
7. Sort: Click column "Wallet" → Sort theo wallet balance
   ↓
8. Phân trang: Click "Sau →" → Xem trang tiếp theo
   ↓
9. Xem chi tiết: Click "👁️ Xem" → Modal hiển thị
   ↓
10. Quay lại Dashboard: Click "← Về Dashboard"
```

---

## ✨ Features Highlights

### 1. Real-time Data
- ✅ Dữ liệu lấy trực tiếp từ database qua API
- ✅ Không cache, luôn fresh data

### 2. Responsive Design
- ✅ Desktop: Full table layout
- ✅ Tablet: Scroll horizontal
- ✅ Mobile: Stack layout

### 3. User Experience
- ✅ Loading spinner khi fetch data
- ✅ Error message nếu có lỗi
- ✅ Empty state khi không có data
- ✅ Smooth transitions và hover effects

### 4. Performance
- ✅ Pagination giảm load (10 items/page)
- ✅ Lazy loading modal
- ✅ Debounce search input (optional)

---

## 🚀 Deployment

### Development:
```bash
# Start Backend
cd TheGrind5_EventManagement_BackEnd/src
dotnet run

# Start Frontend
cd TheGrind5_EventManagement_FrontEnd
npm start
```

### Production Build:
```bash
cd TheGrind5_EventManagement_FrontEnd
npm run build
```

---

## 📝 Notes

- **Đơn giản:** Code tuân thủ KISS principle
- **Rõ ràng:** Tên biến và function dễ hiểu
- **Maintainable:** Dễ dàng thêm/sửa tính năng
- **Reusable:** Components có thể tái sử dụng
- **Chạy được:** Đã test không có lỗi compile

---

## 🎉 Summary

Admin UI đã hoàn thành với đầy đủ tính năng:
- ✅ Dashboard thống kê
- ✅ Danh sách users với filter, search, sort, pagination
- ✅ Xem chi tiết user
- ✅ Role-based access control
- ✅ Responsive design
- ✅ Beautiful UI với gradient colors

**Tất cả đã CHẠY ĐƯỢC và sẵn sàng sử dụng!** 🎯

