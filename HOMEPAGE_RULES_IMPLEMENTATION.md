# 📐 HOMEPAGE - TRIỂN KHAI QUY TẮC CHÍNH THỨC

## ✅ ĐÃ TRIỂN KHAI THEO QUY TẮC

### 🏷️ Quy Tắc về Label/Badge

| Badge | Điều Kiện | Priority | Status |
|-------|-----------|----------|--------|
| **ĐÃ KẾT THÚC** | `endTime < now` | Highest | ✅ |
| **ĐANG DIỄN RA** | `startTime <= now < endTime` | High | ✅ |
| **SẮP HẾT VÉ** | < 20% vé còn lại (upcoming) | High | ✅ |
| **HOT** | > 70% vé đã bán (upcoming) | Medium | ✅ |
| **MỚI** | Tạo trong 48h | Medium | ✅ |
| **SẮP DIỄN RA** | Trong 7 ngày tới | Low | ✅ |

**Priority order:**
```javascript
ĐÃ KẾT THÚC > ĐANG DIỄN RA > SẮP HẾT VÉ > HOT > MỚI > SẮP DIỄN RA
```

### 📊 Quy Tắc về Sorting

#### Default (Tất cả categories: Music, Workshop, Campus)
```javascript
Sort: Thời gian gần nhất trước
startTime ASC
```

#### Nổi Bật (Featured)
```javascript
Sort: Kết hợp thời gian + độ phổ biến
Score = (tickets * 0.7) + ((100 - days) * 0.3)
```

#### Xu Hướng (Trending)
```javascript
Sort: Tăng trưởng (mock) = tickets * recency_factor
recency_factor = daysUntil < 7 ? (2 - days/7) : 1
```

#### Dành Cho Bạn (Recommended)
```javascript
Sort: Personalized ranking
1. Location (Đà Nẵng first)
2. Popularity (tickets DESC)
3. Recency (startTime ASC)
```

#### Sắp Diễn Ra (Upcoming)
```javascript
Sort: Thời gian gần nhất trước
startTime ASC (within 30 days)
```

### 🎨 Quy Tắc về Display

#### Ẩn/Hiện Events
- ✅ **Ẩn:** Events đã kết thúc > 1 ngày
- ✅ **Hiển thị:** Events chưa kết thúc hoặc mới kết thúc (< 1 ngày)

#### Countdown
- ✅ **Hiển thị countdown** cho events < 7 ngày
- ✅ Format: "Còn X ngày"

#### Badge Numbers
- ✅ **Badge số lượng khớp** với số items thực tế
- ✅ Dynamic count cho mỗi section

#### No Duplicates
- ✅ **Featured** → độc lập
- ✅ **Trending** → loại bỏ Featured
- ✅ **Recommended** → loại bỏ Featured + Trending
- ✅ **Upcoming** → loại bỏ Featured + Trending + Recommended
- ✅ **Categories** (Music, Workshop, Campus) → độc lập (không check duplicates)

---

## 🔧 IMPLEMENTATION DETAILS

### Helper Functions

#### `getEventBadgeType(event)`
```javascript
Priority order:
1. ĐÃ KẾT THÚC (if endTime < now)
2. ĐANG DIỄN RA (if startTime <= now < endTime)
3. SẮP HẾT VÉ (if remaining < 20% and upcoming)
4. HOT (if sold > 70% and upcoming)
5. MỚI (if created within 48h)
6. SẮP DIỄN RA (if within 7 days)
7. null (default)
```

**Note:** HOT & SẮP HẾT VÉ calculation is currently estimated due to missing `originalQuantity` in backend. Needs real sold data for accurate calculation.

#### `filterValidEvents(events)`
```javascript
Filter out events:
- endTime < (now - 1 day)
  
Keep events:
- No endTime
- endTime >= (now - 1 day)
```

#### `getDaysUntilEvent(event)`
```javascript
return Math.ceil((startTime - now) / (1000 * 60 * 60 * 24))
// Returns null if already started
```

#### `getRemainingTickets(event)`
```javascript
Sum of quantity from active ticket types
// Returns null if no ticketTypes
```

---

## 📋 SECTIONS LOGIC

### 1. Hero Section (featuredEventsForHero)
**Source:** `baseEventsForCarousel`
**Logic:** Check endTime > now, sort by tickets DESC, take top 5
**Duplicates:** None (first section)

### 2. Sự Kiện Nổi Bật (featuredEvents)
**Source:** Valid events, status Open
**Sorting:** Combined score (tickets * 0.7 + proximity * 0.3)
**Count:** 5
**Duplicates:** None (second section)

### 3. Sự Kiện Xu Hướng (trendingEvents)
**Source:** Valid events, status Open, exclude Featured
**Sorting:** Growth score (tickets * recency_factor)
**Count:** 8
**Duplicates:** Exclude Featured

### 4. Music / Workshop / Campus Events
**Source:** Valid events by category
**Sorting:** Default (time ASC)
**Count:** 10 each
**Duplicates:** None (categories are independent)

### 5. Dành Cho Bạn (recommendedEvents)
**Source:** Valid events, exclude Featured + Trending
**Sorting:** Location → Popularity → Time
**Count:** 8
**Duplicates:** Exclude Featured + Trending

### 6. Sự Kiện Sắp Diễn Ra (upcomingEvents)
**Source:** Valid events (not started yet, within 30 days), exclude Featured + Trending + Recommended
**Sorting:** Default (time ASC)
**Count:** 8
**Duplicates:** Exclude Featured + Trending + Recommended

---

## 🎯 EXPECTED CONSOLE OUTPUT

```javascript
=== HERO SECTION FULL DEBUG ===
✅ Events NOT ENDED (endTime > now) after time filter: 9
✅ FINAL Selected events: [5 events]

=== FEATURED EVENTS LOGIC ===
Featured events: [
  { title: "Event A", badge: "SẮP DIỄN RA", tickets: 150, daysUntil: 3 },
  { title: "Event B", badge: "HOT", tickets: 200, daysUntil: 15 },
  { title: "Event C", badge: "MỚI", tickets: 100, daysUntil: 20 }
]

=== TRENDING EVENTS LOGIC ===
Trending events count: 8

=== MUSIC EVENTS LOGIC ===
Music events: 4 - Sorted by time (nearest first)

=== RECOMMENDED EVENTS LOGIC ===
Recommended events: 6

=== UPCOMING EVENTS LOGIC ===
Upcoming events (sorted by time): [
  { title: "...", startTime: "2025-11-20", daysUntil: 4, showCountdown: true },
  { title: "...", startTime: "2025-12-05", daysUntil: 19, showCountdown: false }
]
```

---

## ⚠️ KNOWN LIMITATIONS & TODOs

### 1. HOT & SẮP HẾT VÉ Badges
**Issue:** Backend không có `originalQuantity` của tickets
**Current:** Estimated based on current quantity
**TODO:** Backend cần thêm field:
```csharp
public class TicketType {
    public int OriginalQuantity { get; set; } // Số lượng ban đầu
    public int Quantity { get; set; } // Số lượng còn lại
}
```

**Then frontend can calculate:**
```javascript
const soldPercentage = ((originalQuantity - quantity) / originalQuantity) * 100;
const remainingPercentage = (quantity / originalQuantity) * 100;
```

### 2. Personalized Recommendations
**Issue:** Chưa có user history data
**Current:** Location-based fallback (Đà Nẵng)
**TODO:** Implement user tracking:
- View history
- Booking history
- Category preferences
- Click tracking

### 3. Real Trending Calculation
**Issue:** Mock growth calculation
**Current:** Based on tickets * recency
**TODO:** Track metrics:
- Views trong 7 ngày qua
- Bookings trong 7 ngày qua
- Growth rate = (current - previous) / previous

---

## 🧪 TESTING CHECKLIST

### Badge Display
- [ ] SẮP DIỄN RA xuất hiện cho events trong 7 ngày
- [ ] ĐANG DIỄN RA xuất hiện cho events đang diễn ra
- [ ] ĐÃ KẾT THÚC xuất hiện cho events đã kết thúc
- [ ] HOT xuất hiện cho events có nhiều vé (mock)
- [ ] MỚI xuất hiện cho events tạo trong 48h
- [ ] SẮP HẾT VÉ xuất hiện cho events ít vé

### Sorting
- [ ] Music section: events sắp xếp 17/11 → 1/12 → 7/12
- [ ] Featured: events phổ biến gần đây lên trước
- [ ] Upcoming: events gần nhất lên trước

### Display Rules
- [ ] Events đã kết thúc > 1 ngày bị ẩn
- [ ] Badge counts khớp với số items
- [ ] Không có duplicate giữa Featured/Trending/Recommended/Upcoming
- [ ] Countdown hiển thị cho events < 7 ngày

### Console Logs
- [ ] Thấy logs từ tất cả 6 sections
- [ ] Thấy ticket counts cho events
- [ ] Thấy warnings nếu missing ticketTypes
- [ ] Thấy sorting info cho each section

---

## 📞 DEPLOYMENT NOTES

### Backend Requirements
- ✅ `EventService.cs` - Close by EndTime
- ✅ `EventMapper.cs` - Return all ticketTypes
- ⚠️ **TODO:** Add OriginalQuantity to TicketType model

### Frontend Changes
- ✅ Badge logic completely rewritten
- ✅ All sections use filterValidEvents
- ✅ No duplicates between main sections
- ✅ Proper sorting for each section type

### Database
- ✅ Events updated with future times
- ✅ Events reopened (status = Open)
- ⚠️ **TODO:** Add tracking tables for views/bookings

---

**Version:** 2.0 - Rules-based Implementation
**Date:** 2025-11-16
**Author:** Cascade AI
