# Test Admin Settings Frontend - Checklist

## Prerequisites
1. Backend đang chạy trên `http://localhost:5000`
2. Database tables đã được tạo (SystemSettings, AdminNotificationSettings)
3. Đã login với tài khoản Admin

## Test Steps

### 1. Navigation Test
- [ ] Vào `/admin/settings` từ sidebar
- [ ] Page load không có lỗi console
- [ ] Header hiển thị "Cài Đặt" và subtitle
- [ ] 4 tabs hiển thị: Thông Tin Cá Nhân, Bảo Mật, Hệ Thống, Thông Báo

### 2. Tab 1: Thông Tin Cá Nhân
- [ ] Hiển thị đúng thông tin admin (Full Name, Email, Phone, Username)
- [ ] Username là disabled (read-only)
- [ ] Có thể edit Full Name, Email, Phone
- [ ] Validation:
  - [ ] Không cho phép Full Name rỗng
  - [ ] Email phải đúng format
  - [ ] Phone phải đúng format (nếu có)
- [ ] Click "Lưu Thay Đổi":
  - [ ] Hiển thị loading state
  - [ ] Success: Snackbar hiển thị "Cập nhật thông tin thành công"
  - [ ] User context được update
  - [ ] Error: Hiển thị error message nếu có

### 3. Tab 2: Bảo Mật
- [ ] 3 input fields: Current Password, New Password, Confirm Password
- [ ] Show/Hide password buttons hoạt động
- [ ] Validation:
  - [ ] Current Password required
  - [ ] New Password minimum 6 characters
  - [ ] Confirm Password phải khớp với New Password
- [ ] Click "Đổi Mật Khẩu":
  - [ ] Hiển thị loading state
  - [ ] Success: Snackbar hiển thị "Đổi mật khẩu thành công"
  - [ ] Form được clear sau khi success
  - [ ] Error: Hiển thị error message nếu mật khẩu sai

### 4. Tab 3: Hệ Thống
- [ ] Load settings từ API khi mở tab:
  - [ ] Hiển thị loading spinner
  - [ ] Settings được load và hiển thị đúng
- [ ] 4 settings:
  - [ ] Maintenance Mode (toggle)
  - [ ] Allow Registration (toggle)
  - [ ] Require Email Verification (toggle)
  - [ ] Session Timeout (number input, 5-1440)
- [ ] Toggle switches hoạt động
- [ ] Session Timeout input:
  - [ ] Có thể nhập số
  - [ ] Validation: 5-1440
- [ ] Click "Lưu Cài Đặt":
  - [ ] Hiển thị loading state
  - [ ] Success: Snackbar hiển thị "Cập nhật cài đặt hệ thống thành công"
  - [ ] Settings được update trong UI
  - [ ] Error: Hiển thị error message nếu có
- [ ] Test validation:
  - [ ] Session timeout < 5: Hiển thị error
  - [ ] Session timeout > 1440: Hiển thị error

### 5. Tab 4: Thông Báo
- [ ] Load settings từ API khi mở tab:
  - [ ] Settings được load và hiển thị đúng (hoặc defaults nếu chưa có)
- [ ] 5 notification toggles:
  - [ ] Email Notifications
  - [ ] System Announcements
  - [ ] Order Notifications
  - [ ] User Notifications
  - [ ] Event Notifications
- [ ] Toggle switches hoạt động
- [ ] Click "Lưu Cài Đặt":
  - [ ] Hiển thị loading state
  - [ ] Success: Snackbar hiển thị "Cập nhật cài đặt thông báo thành công"
  - [ ] Settings được update trong UI
  - [ ] Error: Hiển thị error message nếu có

### 6. UI/UX Tests
- [ ] Dark mode: Tất cả elements hiển thị đúng màu
- [ ] Light mode: Tất cả elements hiển thị đúng màu
- [ ] Responsive: Layout đúng trên mobile
- [ ] Snackbar notifications:
  - [ ] Hiển thị ở bottom-right
  - [ ] Auto-hide sau 6 giây
  - [ ] Có thể đóng bằng cách click X
- [ ] Loading states:
  - [ ] Button disabled khi đang save
  - [ ] Loading spinner hiển thị
  - [ ] Text thay đổi thành "Đang lưu..."

### 7. Error Handling Tests
- [ ] Network error: Hiển thị error message
- [ ] 401 Unauthorized: Redirect to login
- [ ] 403 Forbidden: Hiển thị error message
- [ ] 500 Server Error: Hiển thị error message
- [ ] Invalid data: Validation errors hiển thị

### 8. Integration Tests
- [ ] Sau khi update System Settings, refresh page → settings vẫn đúng
- [ ] Sau khi update Notification Settings, refresh page → settings vẫn đúng
- [ ] Multiple admins: Mỗi admin có settings riêng
- [ ] System Settings: Áp dụng cho toàn hệ thống
- [ ] Notification Settings: Chỉ áp dụng cho admin hiện tại

## Browser DevTools Checks

### Network Tab
- [ ] GET `/api/Admin/settings/system` - Status 200
- [ ] PUT `/api/Admin/settings/system` - Status 200
- [ ] GET `/api/Admin/settings/notifications` - Status 200
- [ ] PUT `/api/Admin/settings/notifications` - Status 200
- [ ] PUT `/api/Auth/profile` - Status 200 (Profile tab)
- [ ] POST `/api/Auth/change-password` - Status 200 (Security tab)

### Console Tab
- [ ] Không có errors
- [ ] Không có warnings liên quan đến settings

### Application Tab
- [ ] Token được lưu trong localStorage
- [ ] User data được update sau khi save profile

## Expected Results

### Success Scenarios
✅ Tất cả API calls thành công (200)
✅ UI updates đúng sau khi save
✅ Snackbar hiển thị success message
✅ Data persist sau khi refresh

### Error Scenarios
✅ Validation errors hiển thị đúng
✅ Network errors được handle gracefully
✅ Error messages rõ ràng, dễ hiểu

## Notes
- Nếu tables chưa được tạo, sẽ có lỗi 500 khi gọi API
- Nếu chưa login hoặc không phải Admin, sẽ có lỗi 401/403
- Settings được lưu trong database, persist qua sessions

