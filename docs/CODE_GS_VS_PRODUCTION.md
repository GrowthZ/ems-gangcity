# So Sánh Code.gs vs Production (app-script.js)

## 📊 Tổng Quan Khác Biệt

| Tiêu chí | Code.gs (DEV) | app-script.js (PROD) | Status |
|----------|---------------|----------------------|--------|
| **Cache** | ✅ Có CacheService | ❌ Không có | 🆕 Tính năng mới |
| **Idempotency** | ✅ Có idempotency key | ❌ Không có | 🆕 Tính năng mới |
| **updatePayment** | ✅ Có | ❌ Không có | 🆕 Tính năng mới |
| **deletePayment** | ✅ Có | ❌ Không có | 🆕 Tính năng mới |
| **getMarkedStudents** | ❌ Đã loại bỏ | ✅ Có | ⚠️ Khác biệt |
| **addData** | ❌ Không có | ✅ Có | ⚠️ Khác biệt |
| **Error handling** | ✅ Try-catch đầy đủ | ⚠️ Minimal | 🆕 Cải tiến |

---

## 🔍 Chi Tiết Từng Khác Biệt

### 1. **Cache & Idempotency** (Code.gs mới có)

**Code.gs:**
```javascript
// Cache để tránh duplicate
const cache = CacheService.getScriptCache();
const CACHE_EXPIRY = 3600; // 1 giờ

function handleRequest(e) {
  let idempotencyKey = e.parameter.key || '';
  
  // Check cache trước
  if (idempotencyKey) {
    const cachedResult = cache.get(idempotencyKey);
    if (cachedResult) {
      console.log('✅ Sử dụng kết quả đã cache');
      return createResponse(JSON.parse(cachedResult));
    }
  }
  
  // ... xử lý ...
  
  // Lưu vào cache
  if (idempotencyKey) {
    cache.put(idempotencyKey, JSON.stringify(data), CACHE_EXPIRY);
  }
}
```

**Production:** ❌ Không có

**Lợi ích:**
- Tránh duplicate requests
- Tăng performance
- Idempotent operations

---

### 2. **Action Handlers**

#### Code.gs (DEV):
```javascript
var actionHandlers = {
  'login': login,
  'markAttendance': markAttendance,
  'updateAttendance': updateAttendance,
  'changeTeacherOfCalendar': changeTeacherOfCalendar,
  'updateStudentMissing': updateStudentMissing,
  'createCalendars': createCalendars,
  'createPayment': createPayment,
  'updatePayment': updatePayment,        // 🆕 MỚI
  'deletePayment': deletePayment,        // 🆕 MỚI
  'updateLesson': updateLesson,
  'newStudent': newStudent,
  'updateStudent': updateStudent,
  'updateStudentByMonth': updateStudentByMonth,
  // Loại bỏ 'getMarkedStudents' - API v4  // ⚠️ ĐÃ XÓA
};
```

#### Production:
```javascript
var actionHandlers = {
  login: login,
  addData: addData,                      // ⚠️ PRODUCTION CÓ
  markAttendance: markAttendance,
  getMarkedStudents: getMarkedStudents,  // ⚠️ PRODUCTION CÓ
  updateAttendance: updateAttendance,
  changeTeacherOfCalendar: changeTeacherOfCalendar,
  updateStudentMissing: updateStudentMissing,
  createCalendars: createCalendars,
  createPayment: createPayment,
  updateLesson: updateLesson,
  newStudent: newStudent,
  updateStudent: updateStudent,
  updateStudentByMonth: updateStudentByMonth,
}
```

**Khác biệt:**
- ✅ `updatePayment` - Chỉ có trong Code.gs
- ✅ `deletePayment` - Chỉ có trong Code.gs
- ❌ `getMarkedStudents` - Production có, Code.gs đã xóa (dùng API v4)
- ❌ `addData` - Production có, Code.gs không có

---

### 3. **updatePayment Function** (🆕 Mới)

**Code.gs có, Production không có:**
```javascript
function updatePayment(paramString) {
  try {
    const param = JSON.parse(paramString);
    Logger.log('📝 Updating payment for: ' + param.studentCode);
    
    const sheet = getSheet(sheetName.payment);
    // ... tìm và update row ...
    
    return {
      status: 'success',
      message: 'Cập nhật giao dịch thành công'
    };
  } catch (error) {
    return {
      status: 'error',
      message: 'Lỗi: ' + error.toString()
    };
  }
}
```

**Cần:** ✅ Deploy lên production

---

### 4. **deletePayment Function** (🆕 Mới)

**Code.gs có, Production không có:**
```javascript
function deletePayment(paramString) {
  try {
    const param = JSON.parse(paramString);
    Logger.log('🗑️ Deleting payment for: ' + param.studentCode);
    
    const sheet = getSheet(sheetName.payment);
    // ... tìm và xóa row ...
    
    return {
      status: 'success',
      message: 'Xóa giao dịch thành công'
    };
  } catch (error) {
    return {
      status: 'error',
      message: 'Lỗi: ' + error.toString()
    };
  }
}
```

**Cần:** ✅ Deploy lên production

---

### 5. **getMarkedStudents Function**

**Production có:**
```javascript
function getMarkedStudents(dataJson) {
  let code = JSON.parse(dataJson)
  let sheet = getSheet(sheetName.attendanceDetail)
  let data = sheet.getDataRange().getValues()
  let rowAttendanced = data.filter((row) => row[0] == code)
  return rowAttendanced
}
```

**Code.gs:** ❌ Đã xóa (comment: dùng API v4 để đọc)

**Quyết định:**
- ⚠️ Nếu frontend vẫn dùng → Cần giữ lại
- ✅ Nếu đã chuyển sang API v4 → Xóa trong production

---

### 6. **addData Function**

**Production có:**
```javascript
function addData(dataJson) {
  let sheet = getSheet('Data')
  let data = JSON.parse(dataJson)
  let arrData = [data.id, data.username, data.email]
  sheet.appendRow(arrData)
  return arrData
}
```

**Code.gs:** ❌ Không có

**Quyết định:**
- ⚠️ Nếu frontend vẫn dùng → Cần thêm vào Code.gs
- ✅ Nếu không dùng → Xóa trong production

---

### 7. **Error Handling**

**Code.gs - Better error handling:**
```javascript
function handleRequest(e) {
  try {
    // ... xử lý ...
    return createResponse(data);
  } catch (error) {
    console.error('❌ Error:', error);
    return createResponse({
      status: 'error',
      message: 'Internal error',
      data: { error: error.toString() }
    });
  }
}
```

**Production - Simple:**
```javascript
function handleRequest(e) {
  // ... xử lý ...
  if (actionHandlers.hasOwnProperty(action)) {
    // ... call handler ...
    return ContentService.createTextOutput(...)
  } else {
    return ContentService.createTextOutput('Unknown action')
  }
}
```

**Cải tiến:** Code.gs có error handling tốt hơn

---

## 📋 Action Plan - Sync Production

### Option 1: Update Production từ Code.gs (RECOMMENDED)

**Thêm vào Production:**
1. ✅ Cache & Idempotency mechanism
2. ✅ `updatePayment` function
3. ✅ `deletePayment` function
4. ✅ Better error handling
5. ✅ Logging với emoji
6. ⚠️ Xem xét xóa `addData` nếu không dùng
7. ⚠️ Xem xét xóa `getMarkedStudents` nếu đã dùng API v4

**Steps:**
```bash
1. Backup production code hiện tại
2. Copy toàn bộ Code.gs → Production
3. Test từng function
4. Deploy
```

---

### Option 2: Update Code.gs từ Production

**Thêm vào Code.gs:**
1. ⚠️ `addData` function (nếu còn dùng)
2. ⚠️ `getMarkedStudents` function (nếu còn dùng)

**Nhưng:**
- ❌ Mất cache mechanism
- ❌ Mất updatePayment/deletePayment
- ❌ Mất error handling improvements

**→ KHÔNG KHUYẾN NGHỊ**

---

## 🎯 Recommended Changes for Code.gs

### 1. Giữ nguyên các tính năng mới
✅ Cache & Idempotency
✅ updatePayment
✅ deletePayment
✅ Error handling

### 2. Kiểm tra frontend usage

**Cần check:**
```javascript
// Frontend có dùng getMarkedStudents không?
grep -r "getMarkedStudents" src/

// Frontend có dùng addData không?
grep -r "addData" src/
```

**Nếu có dùng → Thêm vào Code.gs:**
```javascript
// Thêm vào actionHandlers
var actionHandlers = {
  // ... existing ...
  'getMarkedStudents': getMarkedStudents,  // Nếu cần
  'addData': addData,                      // Nếu cần
};

// Thêm function
function getMarkedStudents(dataJson) {
  let code = JSON.parse(dataJson)
  let sheet = getSheet(sheetName.attendanceDetail)
  let data = sheet.getDataRange().getValues()
  let rowAttendanced = data.filter((row) => row[0] == code)
  return rowAttendanced
}

function addData(dataJson) {
  let sheet = getSheet('Data')
  let data = JSON.parse(dataJson)
  let arrData = [data.id, data.username, data.email]
  sheet.appendRow(arrData)
  return arrData
}
```

---

## ✅ Deployment Checklist

### Pre-deployment:
- [ ] Backup production code
- [ ] Check frontend dependencies (getMarkedStudents, addData)
- [ ] Review all new functions (updatePayment, deletePayment)
- [ ] Test cache mechanism locally
- [ ] Verify idempotency key generation in frontend

### Deployment:
- [ ] Copy Code.gs to Apps Script editor
- [ ] Save
- [ ] Test each function individually
- [ ] Deploy as new version
- [ ] Test in staging
- [ ] Deploy to production

### Post-deployment:
- [ ] Monitor logs for errors
- [ ] Check cache performance
- [ ] Verify updatePayment works
- [ ] Verify deletePayment works
- [ ] Test idempotency (duplicate requests)

---

## 🚨 Breaking Changes

### Removed in Code.gs:
1. **getMarkedStudents** - Frontend phải dùng API v4
   ```javascript
   // Old (Apps Script)
   await sendRequest(Action.getMarkedStudents, { code })
   
   // New (API v4)
   await store.load(DataSheet.attendanceDetail)
   const marked = store.allData.filter(row => row.code === code)
   ```

### Added in Code.gs:
1. **updatePayment** - Frontend cần gọi khi edit payment
2. **deletePayment** - Frontend cần gọi khi delete payment
3. **Cache** - Frontend nên gửi idempotency key

---

## 📝 Summary

**Code.gs có nhiều cải tiến hơn Production:**
- ✅ Cache & Idempotency (tránh duplicate)
- ✅ CRUD cho payments (update/delete)
- ✅ Error handling tốt hơn
- ✅ Logging rõ ràng hơn
- ❌ Bỏ getMarkedStudents (dùng API v4)
- ❌ Không có addData (có vẻ không dùng)

**Khuyến nghị:**
→ **Deploy Code.gs lên Production** với các bước:
1. Check xem frontend có dùng `getMarkedStudents` và `addData` không
2. Nếu có → thêm lại vào Code.gs
3. Nếu không → xóa khỏi production
4. Deploy và test kỹ

**Ưu tiên cao:**
- 🔴 updatePayment & deletePayment cần cho Financial Report
- 🟡 Cache & Idempotency tăng performance
- 🟢 Error handling giúp debug dễ hơn
