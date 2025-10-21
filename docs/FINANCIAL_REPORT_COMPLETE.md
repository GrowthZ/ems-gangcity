# Báo Cáo Tài Chính - Tổng Hợp Hoàn Chỉnh

## 📋 Tổng Quan

Tính năng **Báo cáo tài chính** hoàn chỉnh với:

- ✅ Frontend đầy đủ (Vue 3 + Vuestic UI)
- ✅ Backend AppScript (updatePayment, deletePayment)
- ✅ Format số có dấu phân cách (x.xxx.xxx)
- ✅ Tổng doanh thu hiển thị đúng khi chưa filter

---

## 🎯 Các Thay Đổi Đã Thực Hiện

### 1. Code.gs - AppScript Backend

**Đã thêm 2 action handlers:**

```javascript
// Trong actionHandlers object
var actionHandlers = {
  // ... existing actions
  updatePayment: updatePayment, // ✅ MỚI
  deletePayment: deletePayment, // ✅ MỚI
  // ... other actions
}
```

**Function updatePayment:**

- Tìm row theo `studentCode` + `datePayment`
- Cập nhật: `type`, `lesson`, `money`, `note`
- Return: `{status: 'success', message: '...'}`

**Function deletePayment:**

- Tìm row theo `studentCode` + `datePayment`
- Xóa row khỏi sheet DongHoc
- Return: `{status: 'success', message: '...'}`

**Cấu trúc tìm kiếm:**

```javascript
// Header ở row 3 (index 2)
const headerRow = 2
const headers = values[headerRow]

// Tìm column indexes
const studentCodeCol = headers.indexOf('studentCode')
const datePaymentCol = headers.indexOf('datePayment')

// Tìm row cần update/delete
for (let i = headerRow + 1; i < values.length; i++) {
  if (values[i][studentCodeCol] === param.studentCode && values[i][datePaymentCol] === param.datePayment) {
    rowIndex = i
    break
  }
}
```

---

### 2. FinancialReportPage.vue - Frontend

#### ✅ Fix 1: Tổng Doanh Thu Hiển Thị Đúng

**Vấn đề:** Tổng doanh thu luôn tính từ `filteredPayments` → khi chưa filter thì không hiển thị đúng

**Giải pháp:**

```javascript
// Kiểm tra có filter active không
const hasActiveFilters = computed(() => {
  return !!(
    (dateRange.value?.start && dateRange.value?.end) ||
    selectedLocation.value ||
    selectedGroup.value ||
    selectedPaymentType.value ||
    searchQuery.value
  )
})

// Statistics - Dùng payments.value nếu chưa filter
const statistics = computed(() => {
  const dataToUse = hasActiveFilters.value ? filteredPayments.value : payments.value

  const totalRevenue = dataToUse.reduce((sum, p) => sum + parseFloat(parseMoney(p.money)), 0)
  const totalTransactions = dataToUse.length
  const uniqueStudents = new Set(dataToUse.map((p) => p.studentCode))
  const totalStudents = uniqueStudents.size
  const totalLessons = dataToUse.reduce((sum, p) => sum + parseInt(p.lesson || 0), 0)

  return {
    totalRevenue,
    totalTransactions,
    totalStudents,
    totalLessons,
  }
})
```

#### ✅ Fix 2: Format Số Có Dấu Phân Cách

**Vấn đề:** Các số hiển thị không có dấu phân cách → khó đọc với số lớn

**Giải pháp:** Thêm function `formatNumber()` và sử dụng `toLocaleString('vi-VN')`

```javascript
const formatMoney = (amount) => {
  if (!amount && amount !== 0) return '0'

  const num = parseFloat(parseMoney(amount))
  if (isNaN(num)) return '0'

  // Format: 1.000.000
  return num.toLocaleString('vi-VN')
}

const formatNumber = (num) => {
  if (!num && num !== 0) return '0'

  const number = parseInt(num)
  if (isNaN(number)) return '0'

  // Format: 1.000
  return number.toLocaleString('vi-VN')
}
```

**Áp dụng vào template:**

```vue
<!-- Stats Cards -->
<div class="stat-value">{{ formatMoney(statistics.totalRevenue) }}</div>
<div class="stat-value">{{ formatNumber(statistics.totalTransactions) }}</div>
<div class="stat-value">{{ formatNumber(statistics.totalStudents) }}</div>
<div class="stat-value">{{ formatNumber(statistics.totalLessons) }}</div>

<!-- Distribution -->
<div class="distribution-amount">{{ formatMoney(item.amount) }} VNĐ</div>
<div class="distribution-count">{{ formatNumber(item.count) }} giao dịch</div>

<!-- Table -->
<VaBadge :text="`${formatNumber(rowData.lesson)} buổi`" />
<div class="cell-money">{{ formatMoney(rowData.money) }} VNĐ</div>

<!-- Detail Modal -->
<VaBadge :text="`${formatNumber(selectedPayment.lesson)} buổi`" />
<span class="detail-value amount">{{ formatMoney(selectedPayment.money) }} VNĐ</span>
```

---

## 📊 Kết Quả

### Trước khi fix:

```
Tổng doanh thu: 0 VNĐ (khi chưa filter)
Số giao dịch: 1234 (không có dấu phân cách)
Tổng số buổi: 5678 (không có dấu phân cách)
Số tiền: 2400000 (khó đọc)
```

### Sau khi fix:

```
Tổng doanh thu: 125.000.000 VNĐ ✅ (hiển thị đúng)
Số giao dịch: 1.234 ✅ (có dấu phân cách)
Tổng số buổi: 5.678 ✅ (có dấu phân cách)
Số tiền: 2.400.000 VNĐ ✅ (dễ đọc)
```

---

## 🚀 Hướng Dẫn Deploy

### Bước 1: Deploy AppScript

1. Mở Google Sheet → **Extensions → Apps Script**
2. Copy toàn bộ nội dung file `Code.gs`
3. Paste vào Apps Script editor
4. **Save** (Ctrl+S)
5. **Deploy → New deployment**
6. Copy Web App URL

### Bước 2: Test AppScript

```javascript
// Uncomment để test
function testUpdatePayment() {
  const testData = {
    studentCode: 'HV001',
    datePayment: '20/10/2025',
    type: 'Khoa',
    lesson: 12,
    money: '2400000',
    note: 'Test update',
  }

  const result = updatePayment(JSON.stringify(testData))
  Logger.log(result)
}

function testDeletePayment() {
  const testData = {
    studentCode: 'HV001',
    datePayment: '20/10/2025',
  }

  const result = deletePayment(JSON.stringify(testData))
  Logger.log(result)
}
```

Run function → Check **Execution log**

### Bước 3: Deploy Frontend

```bash
# Build production
npm run build

# Deploy to Netlify
netlify deploy --prod
```

---

## 🔧 Cấu Trúc Sheet DongHoc

**Expected structure:**

| Row | Column A    | Column B    | Column C | Column D | ...     |
| --- | ----------- | ----------- | -------- | -------- | ------- | ---- |
| 1   | (title)     |             |          |          |         |
| 2   | (empty)     |             |          |          |         |
| 3   | studentCode | datePayment | type     | lesson   | money   | note |
| 4+  | HV001       | 20/10/2025  | Khoa     | 12       | 2400000 | ...  |

**Lưu ý:**

- Header row = Row 3 (index 2)
- Data starts from Row 4 (index 3)
- `studentCode` + `datePayment` = unique key

---

## 🎨 UI Features

### 1. Statistics Cards (4 cards)

- **Tổng doanh thu** - Icon: payments, Color: revenue
- **Số giao dịch** - Icon: receipt, Color: transactions
- **Học viên đóng tiền** - Icon: people, Color: students
- **Tổng số buổi** - Icon: event, Color: lessons

### 2. Filters

- Date range picker (start - end)
- Location select (dropdown)
- Group select (dropdown)
- Payment type select (Lẻ/Khóa)
- Search input (real-time)

### 3. Chart (toggleable)

- Type: Dual-axis bar chart
- X-axis: Tháng/Năm
- Y-axis left: Doanh thu (VNĐ)
- Y-axis right: Số giao dịch
- Toggle button: Show/Hide

### 4. Distribution (toggleable)

- Progress bars by payment type
- Shows: Amount, Count, Percentage
- Toggle button: Show/Hide

### 5. Data Table

- Sortable columns
- Pagination (20 per page)
- Actions: View, Edit, Delete
- Search: Real-time filter

### 6. Modals

- **Detail Modal:** View full payment info
- **Edit Modal:** Update payment (type, lesson, money, note)
- **Delete Modal:** Confirm before delete

### 7. Export

- Export to CSV
- Includes summary row
- Formatted data

---

## 📱 Responsive Design

### Mobile (< 768px)

- Stats: 1 column
- Filters: 1 column
- Table: Horizontal scroll
- Modals: Full width

### Tablet (768px - 1024px)

- Stats: 2 columns
- Filters: 2 columns
- Table: Normal display

### Desktop (> 1024px)

- Stats: 4 columns
- Filters: 4 columns
- Chart: Full width
- Table: Full width

---

## 🐛 Troubleshooting

### Issue 1: Tổng doanh thu vẫn = 0

**Check:**

```javascript
// In browser console
console.log('All payments:', payments.value.length)
console.log('Has filters:', hasActiveFilters.value)
console.log('Data to use:', dataToUse.length)
```

**Solution:** Clear filters, refresh data

### Issue 2: Format số không đúng

**Check:**

```javascript
console.log('Format test:', formatNumber(1234567))
// Expected: "1.234.567"
```

**Solution:** Ensure locale is 'vi-VN'

### Issue 3: AppScript 403 Error

**Check:**

- Web App deployment settings
- Share sheet with "Anyone with link"
- Enable Google Sheets API

### Issue 4: Update/Delete không hoạt động

**Check:**

```javascript
// In AppScript logs
Logger.log('Updating payment:', param.studentCode, param.datePayment)
Logger.log('Row found at index:', rowIndex)
```

**Solution:**

- Verify column names match exactly
- Check header row = row 3
- Ensure studentCode + datePayment are strings

---

## ✅ Testing Checklist

### Frontend

- [ ] Load page successfully
- [ ] All 4 stats display with formatted numbers
- [ ] Filters work correctly
- [ ] Chart renders and toggles
- [ ] Distribution shows and toggles
- [ ] Table displays data with pagination
- [ ] Search filters in real-time
- [ ] Detail modal shows correct info
- [ ] Edit modal updates payment
- [ ] Delete modal removes payment
- [ ] Export CSV downloads successfully

### Backend

- [ ] updatePayment finds correct row
- [ ] updatePayment updates fields
- [ ] updatePayment returns success
- [ ] deletePayment finds correct row
- [ ] deletePayment removes row
- [ ] deletePayment returns success
- [ ] Error handling works
- [ ] Logs show in Apps Script

### Integration

- [ ] Edit action saves to sheet
- [ ] Delete action removes from sheet
- [ ] Data reloads after action
- [ ] No 403 errors
- [ ] No CORS errors
- [ ] Cache works correctly

---

## 📝 API Endpoints

### Read (Google Sheets API v4)

```javascript
const spreadsheetId = '1HhIpXU6Egq9MZmyCAvPnEjCT8V4n9soD7EY4LQ8Nt0w'
const range = 'DongHoc!A4:Z'

fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}?key=${API_KEY}`)
```

### Write (Apps Script Web App)

```javascript
const url = 'YOUR_APPSCRIPT_WEB_APP_URL'

// Update
fetch(url, {
  method: 'POST',
  body: JSON.stringify({
    action: 'updatePayment',
    param: {
      studentCode: 'HV001',
      datePayment: '20/10/2025',
      type: 'Khoa',
      lesson: 12,
      money: '2400000',
      note: 'Updated',
    },
  }),
})

// Delete
fetch(url, {
  method: 'POST',
  body: JSON.stringify({
    action: 'deletePayment',
    param: {
      studentCode: 'HV001',
      datePayment: '20/10/2025',
    },
  }),
})
```

---

## 🎉 Hoàn Thành

✅ **Code.gs** - AppScript backend với updatePayment và deletePayment
✅ **FinancialReportPage.vue** - Frontend với tất cả tính năng
✅ **Format số** - Dấu phân cách hàng nghìn (x.xxx.xxx)
✅ **Tổng doanh thu** - Hiển thị đúng khi chưa filter
✅ **Responsive** - Mobile/Tablet/Desktop
✅ **Documentation** - Đầy đủ hướng dẫn

**Next steps:**

1. Deploy AppScript to production
2. Test all CRUD operations
3. Verify number formatting
4. User acceptance testing
5. Production deployment

---

## 📞 Support

Nếu gặp vấn đề, check:

1. Browser console logs
2. Apps Script execution logs
3. Network tab (for API errors)
4. Sheet structure (row 3 = headers)
5. Column names match exactly

**Happy coding! 🚀**
