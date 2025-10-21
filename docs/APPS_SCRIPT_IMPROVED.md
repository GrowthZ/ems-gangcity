# Cải thiện Apps Script để tránh Duplicate

## Vấn đề

Apps Script hiện tại có thể bị duplicate khi nhiều request cùng lúc.

## Giải pháp: Idempotency Key

### 1. Cập nhật Apps Script

Mở Apps Script của bạn và thay thế bằng code này:

```javascript
// Code.gs - Google Apps Script

// Cache để lưu kết quả đã xử lý (tránh duplicate)
const cache = CacheService.getScriptCache()
const CACHE_EXPIRY = 3600 // 1 hour

function doGet(e) {
  try {
    const action = e.parameter.action
    const param = JSON.parse(e.parameter.param || '{}')
    const idempotencyKey = e.parameter.key || ''

    // Check if this request was already processed
    if (idempotencyKey) {
      const cachedResult = cache.get(idempotencyKey)
      if (cachedResult) {
        console.log(`Using cached result for key: ${idempotencyKey}`)
        return createResponse(JSON.parse(cachedResult))
      }
    }

    // Process the request
    const result = processAction(action, param)

    // Cache the result to prevent duplicate processing
    if (idempotencyKey) {
      cache.put(idempotencyKey, JSON.stringify(result), CACHE_EXPIRY)
    }

    return createResponse(result)
  } catch (error) {
    console.error('Error:', error)
    return createResponse({
      status: 'error',
      message: error.toString(),
    })
  }
}

function createResponse(data) {
  return ContentService.createTextOutput(JSON.stringify(data)).setMimeType(ContentService.MimeType.JSON)
}

function processAction(action, param) {
  const ss = SpreadsheetApp.openById('1HhIpXU6Egq9MZmyCAvPnEjCT8V4n9soD7EY4LQ8Nt0w')

  switch (action) {
    case 'login':
      return handleLogin(ss, param)

    case 'markAttendance':
      return handleMarkAttendance(ss, param)

    case 'createPayment':
      return handleCreatePayment(ss, param)

    case 'updateLesson':
      return handleUpdateLesson(ss, param)

    case 'newStudent':
      return handleNewStudent(ss, param)

    case 'updateStudent':
      return handleUpdateStudent(ss, param)

    case 'createCalendars':
      return handleCreateCalendars(ss, param)

    case 'updateStudentByMonth':
      return handleUpdateStudentByMonth(ss, param)

    case 'updateAttendance':
      return handleUpdateAttendance(ss, param)

    case 'updateStudentMissing':
      return handleUpdateStudentMissing(ss, param)

    case 'changeTeacher':
      return handleChangeTeacher(ss, param)

    default:
      return { status: 'error', message: 'Unknown action: ' + action }
  }
}

// Helper function để append row an toàn
function safeAppendRow(sheet, rowData, idempotencyKey) {
  // Check if this row was already added (based on unique identifier)
  const lastRow = sheet.getLastRow()

  // Optional: Check last few rows for duplicates
  if (lastRow > 2) {
    const checkRange = sheet.getRange(Math.max(3, lastRow - 5), 1, Math.min(6, lastRow - 2), rowData.length)
    const recentRows = checkRange.getValues()

    // Simple duplicate check based on first few columns
    for (let i = 0; i < recentRows.length; i++) {
      if (JSON.stringify(recentRows[i].slice(0, 3)) === JSON.stringify(rowData.slice(0, 3))) {
        console.log('Duplicate detected, skipping append')
        return { status: 'success', message: 'Row already exists', duplicate: true }
      }
    }
  }

  // Append the row
  sheet.appendRow(rowData)

  return { status: 'success', message: 'Row added', duplicate: false }
}

// Example handlers (customize based on your needs)

function handleMarkAttendance(ss, param) {
  const sheet = ss.getSheetByName('DiemDanh')
  const rowData = [
    param.id || '',
    param.date || '',
    param.studentCode || '',
    param.studentName || '',
    param.group || '',
    param.teacher || '',
    param.status || '',
    param.note || '',
  ]

  const result = safeAppendRow(sheet, rowData)
  return result
}

function handleCreatePayment(ss, param) {
  const sheet = ss.getSheetByName('DongHoc')
  const rowData = [
    param.date || '',
    param.studentCode || '',
    param.studentName || '',
    param.amount || 0,
    param.paymentType || '',
    param.note || '',
  ]

  const result = safeAppendRow(sheet, rowData)
  return result
}

function handleNewStudent(ss, param) {
  const sheet = ss.getSheetByName('DanhSach')
  const rowData = [
    param.code || '',
    param.fullname || '',
    param.phone || '',
    param.group || '',
    param.location || '',
    param.status || '',
    param.enrollDate || '',
  ]

  const result = safeAppendRow(sheet, rowData)
  return result
}

// Add more handlers as needed...
// Copy and customize the pattern above for each action
```

### 2. Cập nhật Frontend

Sửa file `src/stores/data-from-sheet.ts`:

```typescript
// Thêm hàm tạo idempotency key
function generateIdempotencyKey(action: string, param: any): string {
  // Create unique key based on action, timestamp, and random
  const timestamp = Date.now()
  const random = Math.random().toString(36).substring(7)
  const paramHash = JSON.stringify(param).substring(0, 20)
  return `${action}_${timestamp}_${random}_${paramHash}`
}

// Update sendRequestLegacy để dùng idempotency key
export const sendRequest = async (action: string, param: any): Promise<SendRequestResult> => {
  try {
    const idempotencyKey = generateIdempotencyKey(action, param)
    const paramString = typeof param === 'string' ? param : JSON.stringify(param)

    console.log(`🚀 Gửi request với idempotency key: ${idempotencyKey}`)

    const response = await axiosInstance.get(
      `${scriptUrl}?action=${action}&param=${paramString}&key=${idempotencyKey}`,
      {
        timeout: 30000, // 30 seconds timeout
      },
    )

    console.log(`✅ Response:`, response.data)

    return {
      status: 'success',
      data: response.data,
    }
  } catch (error: any) {
    console.error('❌ Lỗi khi gửi request:', error)

    // Retry logic
    if (error?.response?.status === 429 || error?.code === 'ECONNABORTED') {
      console.log('⏳ Đang thử lại...')
      await delay(2000)
      // Note: Don't generate new key for retry - reuse the same one
      return sendRequest(action, param)
    }

    return {
      status: 'error',
      error: error?.message || error,
    }
  }
}
```

## Ưu điểm

- ✅ Không cần backend
- ✅ Không cần OAuth2
- ✅ Chỉ cần API key để đọc
- ✅ Apps Script để ghi (đã cải thiện)
- ✅ Idempotency key tránh duplicate
- ✅ Cache kết quả trong 1 giờ

## Nhược điểm

- ⚠️ Vẫn phụ thuộc Apps Script cho write operations
- ⚠️ Performance không bằng direct API
- ⚠️ Rate limiting của Apps Script

## Setup

1. Deploy Apps Script code mới
2. Update frontend code
3. Test thoroughly
4. Keep API key trong .env để đọc dữ liệu

Đơn giản hơn nhiều so với backend! 🎉
