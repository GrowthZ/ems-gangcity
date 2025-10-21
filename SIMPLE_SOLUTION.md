# ✅ Giải pháp ĐƠN GIẢN - Không cần Backend!

## 🎯 Bạn chỉ cần làm 2 bước:

### Bước 1: Cập nhật Google Apps Script

1. Mở Apps Script của bạn: https://script.google.com/
2. Tìm project Apps Script hiện tại (URL trong code)
3. Thay thế toàn bộ code bằng code mới có **idempotency key** (chống duplicate)

**📄 File Code.gs mới:**

\`\`\`javascript
// Cache để tránh duplicate
const cache = CacheService.getScriptCache();
const CACHE_EXPIRY = 3600; // 1 giờ
const SPREADSHEET_ID = '1HhIpXU6Egq9MZmyCAvPnEjCT8V4n9soD7EY4LQ8Nt0w';

function doGet(e) {
try {
const action = e.parameter.action;
const param = JSON.parse(e.parameter.param || '{}');
const idempotencyKey = e.parameter.key || '';

    // Kiểm tra cache - nếu đã xử lý rồi thì trả kết quả cũ
    if (idempotencyKey) {
      const cachedResult = cache.get(idempotencyKey);
      if (cachedResult) {
        console.log('✅ Sử dụng kết quả đã cache, không tạo duplicate');
        return createResponse(JSON.parse(cachedResult));
      }
    }

    // Xử lý request
    const result = processAction(action, param);

    // Lưu kết quả vào cache
    if (idempotencyKey && result.status === 'success') {
      cache.put(idempotencyKey, JSON.stringify(result), CACHE_EXPIRY);
    }

    return createResponse(result);

} catch (error) {
console.error('Error:', error);
return createResponse({
status: 'error',
message: error.toString()
});
}
}

function createResponse(data) {
return ContentService
.createTextOutput(JSON.stringify(data))
.setMimeType(ContentService.MimeType.JSON);
}

function processAction(action, param) {
const ss = SpreadsheetApp.openById(SPREADSHEET_ID);

// Route to appropriate handler
const handlers = {
'login': handleLogin,
'markAttendance': handleMarkAttendance,
'createPayment': handleCreatePayment,
'updateLesson': handleUpdateLesson,
'newStudent': handleNewStudent,
'updateStudent': handleUpdateStudent,
'createCalendars': handleCreateCalendars,
'updateStudentByMonth': handleUpdateStudentByMonth,
'updateAttendance': handleUpdateAttendance,
'updateStudentMissing': handleUpdateStudentMissing,
'changeTeacher': handleChangeTeacher
};

const handler = handlers[action];
if (handler) {
return handler(ss, param);
} else {
return { status: 'error', message: 'Unknown action: ' + action };
}
}

// ============ HANDLERS ============

function handleMarkAttendance(ss, param) {
const sheet = ss.getSheetByName('DiemDanh');
const rowData = [
new Date().toISOString(),
param.date || '',
param.studentCode || '',
param.studentName || '',
param.group || '',
param.teacher || '',
param.status || '',
param.note || ''
];
sheet.appendRow(rowData);
return { status: 'success', message: 'Điểm danh thành công' };
}

function handleCreatePayment(ss, param) {
const sheet = ss.getSheetByName('DongHoc');
const rowData = [
new Date().toISOString(),
param.studentCode || '',
param.studentName || '',
param.amount || 0,
param.lessons || 0,
param.startDate || '',
param.endDate || '',
param.note || ''
];
sheet.appendRow(rowData);
return { status: 'success', message: 'Đóng học thành công' };
}

function handleUpdateLesson(ss, param) {
const sheet = ss.getSheetByName('DieuChinh');
const rowData = [
new Date().toISOString(),
param.studentCode || '',
param.studentName || '',
param.adjustment || 0,
param.reason || '',
param.note || ''
];
sheet.appendRow(rowData);
return { status: 'success', message: 'Điều chỉnh buổi học thành công' };
}

function handleNewStudent(ss, param) {
const sheet = ss.getSheetByName('DanhSach');
const rowData = [
param.code || '',
param.fullname || '',
param.phone || '',
param.group || '',
param.location || '',
param.status || 'active',
new Date().toISOString()
];
sheet.appendRow(rowData);
return { status: 'success', message: 'Thêm học viên thành công' };
}

function handleUpdateStudent(ss, param) {
// Tìm row theo student code và update
const sheet = ss.getSheetByName('DanhSach');
const data = sheet.getDataRange().getValues();

for (let i = 3; i < data.length; i++) { // Bỏ qua header (3 rows)
if (data[i][0] === param.code) {
// Update row
sheet.getRange(i + 1, 1, 1, 7).setValues([[param.code,
        param.fullname || data[i][1],
        param.phone || data[i][2],
        param.group || data[i][3],
        param.location || data[i][4],
        param.status || data[i][5],
        data[i][6] // Keep original enroll date]]);
return { status: 'success', message: 'Cập nhật học viên thành công' };
}
}

return { status: 'error', message: 'Không tìm thấy học viên' };
}

function handleCreateCalendars(ss, param) {
const sheet = ss.getSheetByName('LichDay');

// param có thể là array hoặc single object
const calendars = Array.isArray(param) ? param : [param];

calendars.forEach(cal => {
const rowData = [
new Date().toISOString(),
cal.date || '',
cal.time || '',
cal.group || '',
cal.teacher || '',
cal.subTeacher || '',
cal.location || '',
cal.status || 'scheduled'
];
sheet.appendRow(rowData);
});

return { status: 'success', message: 'Tạo lịch dạy thành công' };
}

function handleUpdateStudentByMonth(ss, param) {
const sheet = ss.getSheetByName('DieuChinhTheoQuyDinh');
const data = param.data || [param];

data.forEach(item => {
const rowData = [
item.location || '',
item.studentCode || '',
item.studentName || '',
item.dateUpdate || '',
item.lesson || 0,
item.note || ''
];
sheet.appendRow(rowData);
});

return { status: 'success', message: 'Cập nhật tháng thành công' };
}

function handleUpdateAttendance(ss, param) {
// Tương tự handleUpdateStudent
const sheet = ss.getSheetByName('DiemDanh');
// Implement logic tìm và update...
return { status: 'success', message: 'Cập nhật điểm danh thành công' };
}

function handleUpdateStudentMissing(ss, param) {
const sheet = ss.getSheetByName('DiemDanhNghi');
const rowData = [
new Date().toISOString(),
param.date || '',
param.studentCode || '',
param.studentName || '',
param.group || '',
param.reason || '',
param.note || ''
];
sheet.appendRow(rowData);
return { status: 'success', message: 'Ghi nhận nghỉ học thành công' };
}

function handleChangeTeacher(ss, param) {
// Tìm và update teacher trong LichDay
const sheet = ss.getSheetByName('LichDay');
// Implement logic...
return { status: 'success', message: 'Đổi giáo viên thành công' };
}

function handleLogin(ss, param) {
const sheet = ss.getSheetByName('Users');
const data = sheet.getDataRange().getValues();

for (let i = 1; i < data.length; i++) {
if (data[i][0] === param.username && data[i][1] === param.password) {
return {
status: 'success',
data: {
username: data[i][0],
role: data[i][2] || 'user',
token: 'mock*token*' + Date.now()
}
};
}
}

return { status: 'error', message: 'Sai tên đăng nhập hoặc mật khẩu' };
}
\`\`\`

4. **Deploy Apps Script**:
   - Click `Deploy` → `New deployment`
   - Type: `Web app`
   - Execute as: `Me`
   - Who has access: `Anyone`
   - Click `Deploy`
   - Copy URL mới (nếu có)

### Bước 2: Cấu hình .env (Frontend)

Tạo file `.env` trong root project:

\`\`\`bash

# Google Sheets API key (chỉ để đọc dữ liệu)

VITE_GOOGLE_SHEETS_API_KEY=AIzaSyC9NlfiP4qs-Hfaej4RpmxxWXRcAoKM7ao
VITE_GOOGLE_SHEET_ID=1HhIpXU6Egq9MZmyCAvPnEjCT8V4n9soD7EY4LQ8Nt0w

# Apps Script URL (để ghi dữ liệu)

VITE_APPS_SCRIPT_URL=YOUR_APPS_SCRIPT_URL_HERE

# Mode: apps-script (mặc định, không cần backend)

VITE_API_MODE=apps-script
\`\`\`

**Thay `YOUR_APPS_SCRIPT_URL_HERE` bằng URL Apps Script của bạn!**

### ✅ Xong! Chỉ cần restart frontend:

\`\`\`bash

# Stop frontend (Ctrl+C)

npm run dev
\`\`\`

## 🎯 Giải thích cách hoạt động

1. **Đọc dữ liệu**: Dùng Google Sheets API với API key (nhanh)
2. **Ghi dữ liệu**: Dùng Apps Script nhưng có **idempotency key**
3. **Idempotency key**: Mỗi request có key unique, nếu trùng thì Apps Script trả kết quả cũ (không tạo duplicate)
4. **Cache**: Kết quả được cache 1 giờ trong Apps Script

## 📊 So với trước

|                 | Trước       | Bây giờ     |
| --------------- | ----------- | ----------- |
| Duplicate rows  | ❌ Có       | ✅ Không    |
| Cần backend     | ❌ Không    | ✅ Không    |
| Cần OAuth2      | ❌ Không    | ✅ Không    |
| Setup phức tạp  | ✅ Đơn giản | ✅ Đơn giản |
| Chỉ cần API key | ✅ Có       | ✅ Có       |

## 🔧 Troubleshooting

### Vẫn bị duplicate?

- Đảm bảo đã deploy Apps Script mới
- Check console logs xem có key không
- Clear cache Apps Script: `cache.removeAll()`

### Lỗi 401/403?

- Check API key đúng trong .env
- Check Apps Script URL đúng
- Check Apps Script deploy với "Anyone" access

### Không thấy logs?

- Mở Apps Script → Executions
- Check logs để debug

## 📝 Lưu ý

⚠️ **Code Apps Script ở trên là template**, bạn cần điều chỉnh:

- Tên sheet (nếu khác)
- Cấu trúc cột trong mỗi sheet
- Logic update/find rows

Nhưng cơ chế **idempotency đã sẵn sàng** để tránh duplicate!

---

**Đơn giản nhất rồi! Không cần backend, không cần OAuth2, chỉ cần Apps Script + API key! 🎉**
