# 🐛 Admin UI - Debug Guide

## ✅ Đã cải thiện:

### 1. **Enhanced Error Handling**
- ✅ Error messages chi tiết hơn
- ✅ Phân biệt các loại lỗi: 401, 403, 404, Network Error
- ✅ Console logging đầy đủ

### 2. **Debug Helper**
- ✅ Auto-check Backend connection
- ✅ Auto-check Auth token
- ✅ Test Admin API endpoint
- ✅ Diagnostics chạy tự động khi load page

### 3. **Quick Fix Buttons**
- 🔄 **Thử lại** - Reload dữ liệu
- 🔍 **Kiểm tra kết nối** - Chạy diagnostics
- 🔐 **Đăng nhập lại** - Clear cache và login lại

---

## 🔍 Hướng dẫn Debug:

### Bước 1: Mở Developer Console
**Bấm F12** hoặc **Ctrl+Shift+I** để mở Developer Tools

### Bước 2: Xem Console Tab
Trong Console, anh sẽ thấy:

```
🔍 === ADMIN DEBUG DIAGNOSTICS ===

1️⃣ Checking Authentication...
🔐 Auth Status:
  - Token exists: true
  - Token length: 500
  - Token preview: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
  - User exists: true
  - User role: Admin
  - User email: admin@thegrind5.com
  - User ID: 1

2️⃣ Checking Backend Connection...
✅ Backend is running

3️⃣ Testing Admin API...
📡 Response status: 200
✅ API Response: {...}

🔍 === DIAGNOSTICS COMPLETE ===
```

### Bước 3: Đọc kết quả diagnostics

#### ✅ Nếu thấy "Backend is running" + API Response:
→ **Mọi thứ OK!** Data sẽ load thành công

#### ❌ Nếu thấy "Cannot connect to Backend":
→ **Backend chưa chạy**

**Fix:**
```bash
cd TheGrind5_EventManagement_BackEnd\src
dotnet run
```

#### ❌ Nếu thấy "No token found":
→ **Chưa đăng nhập**

**Fix:**
1. Click nút "🔐 Đăng nhập lại"
2. Hoặc truy cập: http://localhost:3000/login
3. Login với: `admin@thegrind5.com / 123456`

#### ❌ Nếu thấy "403 Forbidden":
→ **Không phải Admin**

**Fix:**
1. Đăng xuất tài khoản hiện tại
2. Đăng nhập lại với tài khoản Admin: `admin@thegrind5.com / 123456`

#### ❌ Nếu thấy "404 Not Found":
→ **API endpoint không tồn tại**

**Fix:**
1. Kiểm tra Backend đã có AdminController chưa
2. Kiểm tra routing trong `Program.cs`

---

## 🔧 Các lệnh hữu ích:

### Kiểm tra Backend:
```bash
# Start Backend
cd TheGrind5_EventManagement_BackEnd/src
dotnet run

# Check nếu chạy thành công:
# → Now listening on: http://localhost:5000
```

### Test API trực tiếp:
```bash
# Test health endpoint
curl http://localhost:5000/api/health

# Test admin statistics (cần token)
curl http://localhost:5000/api/admin/statistics \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### Clear cache và reset:
```javascript
// Paste vào Console tab:
localStorage.clear();
sessionStorage.clear();
location.reload();
```

---

## 📊 Error Messages & Solutions:

| Error Message | Nguyên nhân | Giải pháp |
|--------------|-------------|-----------|
| "Không thể kết nối đến server" | Backend offline | Start Backend với `dotnet run` |
| "Phiên đăng nhập đã hết hạn" | Token expired | Đăng nhập lại |
| "Bạn không có quyền truy cập" | Không phải Admin | Login với admin@thegrind5.com |
| "Không tìm thấy API endpoint" | API route sai | Check Backend routing |

---

## 🎯 Checklist khi gặp lỗi:

- [ ] Backend đã chạy? (`dotnet run` trong folder BackEnd/src)
- [ ] Frontend đã chạy? (`npm start` trong folder FrontEnd)
- [ ] Đã login với tài khoản Admin? (admin@thegrind5.com)
- [ ] Token còn hạn? (Check trong Console diagnostics)
- [ ] Database có data? (Check trong SQL Server)
- [ ] Port đúng? (Backend: 5000, Frontend: 3000)

---

## 🚀 Quick Test:

### 1. Test Backend:
```
Truy cập: http://localhost:5000/api/admin/statistics
```
- Nếu thấy JSON hoặc 401 → Backend OK
- Nếu không load được → Backend offline

### 2. Test Frontend:
```
Truy cập: http://localhost:3000/admin/users
```
- Bấm F12 → Console tab
- Xem diagnostics output

### 3. Test Login:
```
Truy cập: http://localhost:3000/login
Email: admin@thegrind5.com
Password: 123456
```
- Sau khi login → truy cập lại `/admin/users`

---

## 💡 Tips:

1. **Always check Console first** - Mọi lỗi đều được log ra Console
2. **Run diagnostics** - Click nút "🔍 Kiểm tra kết nối" để xem status
3. **Check Network tab** - Xem request/response chi tiết
4. **Clear cache** - Nếu bị cache cũ: Ctrl+Shift+Delete

---

## ✨ Đã fix:

- ✅ Better error messages
- ✅ Auto diagnostics on page load
- ✅ Quick fix buttons
- ✅ Detailed console logging
- ✅ Connection testing
- ✅ Token validation
- ✅ User-friendly error UI

**Bây giờ refresh trang và xem Console để debug!** 🔍

