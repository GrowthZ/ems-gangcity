// ============================================
// Google Apps Script - CHỈ XỬ LÝ GHI DỮ LIỆU
// ĐỌC dữ liệu sẽ dùng API v4 từ frontend
// ============================================

const SPREADSHEET_ID = "1HhIpXU6Egq9MZmyCAvPnEjCT8V4n9soD7EY4LQ8Nt0w";

// ✅ LAZY LOADING: Chỉ mở spreadsheet khi cần, cache lại để tái sử dụng
let _spreadsheetCache = null;
function getSpreadsheet() {
  if (!_spreadsheetCache) {
    _spreadsheetCache = SpreadsheetApp.openById(SPREADSHEET_ID);
  }
  return _spreadsheetCache;
}

// Cache để tránh duplicate
const cache = CacheService.getScriptCache();
const CACHE_EXPIRY = 3600; // 1 giờ

// Action handlers - GHI/CẬP NHẬT và một số đọc cần thiết
var actionHandlers = {
  'login': login,
  'markAttendance': markAttendance,
  'getMarkedStudents': getMarkedStudents, // Vẫn cần cho AttendanceModal
  'updateAttendance': updateAttendance,
  'changeTeacherOfCalendar': changeTeacherOfCalendar,
  'updateStudentMissing': updateStudentMissing,
  'createCalendars': createCalendars,
  'createPayment': createPayment,
  'updatePayment': updatePayment,
  'deletePayment': deletePayment,
  'updateLesson': updateLesson,
  'newStudent': newStudent,
  'updateStudent': updateStudent,
  'updateStudentByMonth': updateStudentByMonth,
  'checkAttendanceDuplicates': checkAttendanceDuplicates, // Check điểm danh bị trùng
};

let sheetName = {
  student: 'DanhSach',
  studentFollow: 'KiemSoatBuoiHoc',
  attendance: "DiemDanh",
  attendanceDetail: "DiemDanhChiTiet",
  calendar: "LichDay",
  attendanceMissing: "DiemDanhNghi",
  payment: "DongHoc",
  lessonUpdate: "DieuChinh",
  studentMonthUpdate: "DieuChinhTheoQuyDinh",
  user: "TaiKhoan",
  teacher: "GiaoVien",
  group: "LopHoc",
  location: "CoSo",
  tkb: "TKB"
}

function doGet(e) {
  return handleRequest(e);
}

function handleRequest(e) {
  try {
    let action = e.parameter.action;
    let param = e.parameter.param;
    let idempotencyKey = e.parameter.key || ''; // Idempotency key để tránh duplicate

    // Check cache trước - nếu đã xử lý rồi thì trả kết quả cũ
    if (idempotencyKey) {
      const cachedResult = cache.get(idempotencyKey);
      if (cachedResult) {
        console.log('✅ Sử dụng kết quả đã cache (key: ' + idempotencyKey + ')');
        return createResponse(JSON.parse(cachedResult));
      }
    }

    let data = {
      message: "success",
      status: "success",
      data: {}
    };

    // Kiểm tra action có tồn tại không
    if (actionHandlers.hasOwnProperty(action)) {
      if (param != undefined && param != "") {
        // Gọi hàm tương ứng với action và param
        data.data = actionHandlers[action](param);
      } else {
        data.data = actionHandlers[action]();
      }

      // Lưu kết quả vào cache nếu có idempotency key
      if (idempotencyKey) {
        cache.put(idempotencyKey, JSON.stringify(data), CACHE_EXPIRY);
        console.log('💾 Đã cache kết quả (key: ' + idempotencyKey + ')');
      }

      return createResponse(data);
    } else {
      // Action không hợp lệ
      data.message = "error";
      data.status = "error";
      data.data = { error: "Unknown action: " + action };
      return createResponse(data);
    }
  } catch (error) {
    console.error('❌ Error:', error);
    return createResponse({
      status: 'error',
      message: 'Internal error',
      data: { error: error.toString() }
    });
  }
}

function createResponse(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

// ✅ LAZY LOADING: Sử dụng getSpreadsheet() thay vì biến global
function getSheet(name) {
  return getSpreadsheet().getSheetByName(name);
}

/**
 * Safe JSON parsing - Xử lý cả string thuần và JSON string
 */
function safeJSONParse(dataString) {
  // Nếu đã là object rồi, return luôn
  if (typeof dataString === 'object' && dataString !== null) {
    return dataString;
  }
  
  // Nếu là string, thử parse
  if (typeof dataString === 'string') {
    try {
      return JSON.parse(dataString);
    } catch (e) {
      // Nếu parse lỗi, coi như string thuần và return nguyên bản
      Logger.log('⚠️ JSON parse failed, treating as plain string: ' + e.toString());
      return dataString;
    }
  }
  
  // Các trường hợp khác (undefined, null, number, etc.)
  return dataString;
}

/**
 * Format date to dd/mm/yyyy
 * Hỗ trợ nhiều input formats: Date object, "1/11/2025", "01/11/2025", ISO string, etc.
 * Luôn trả về dạng dd/mm/yyyy (01/11/2025) để đồng nhất
 */
function formatDate(dateInput) {
  if (!dateInput) return '';
  
  let date;
  
  // Nếu đã là Date object
  if (dateInput instanceof Date) {
    date = dateInput;
  } 
  // Nếu là string
  else if (typeof dateInput === 'string') {
    const trimmed = dateInput.trim();
    
    // Try parsing as dd/mm/yyyy or d/m/yyyy format (most common)
    const parts = trimmed.split('/');
    if (parts.length === 3) {
      // Assume format: day/month/year (cả 1/11/2025 và 01/11/2025 đều OK)
      const day = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1; // JS months are 0-indexed
      const year = parseInt(parts[2], 10);
      
      // Validate ranges
      if (day >= 1 && day <= 31 && month >= 0 && month <= 11 && year > 1900) {
        date = new Date(year, month, day);
      } else {
        Logger.log('⚠️ Invalid date values: day=' + day + ', month=' + (month+1) + ', year=' + year);
        return String(dateInput);
      }
    } else {
      // Try other formats (ISO, etc.)
      date = new Date(trimmed);
    }
  }
  // Nếu là number (timestamp)
  else if (typeof dateInput === 'number') {
    date = new Date(dateInput);
  }
  else {
    return String(dateInput); // Fallback: return as-is
  }
  
  // Validate date
  if (isNaN(date.getTime())) {
    Logger.log('⚠️ Invalid date: ' + dateInput);
    return String(dateInput); // Return original if invalid
  }
  
  // Format as dd/mm/yyyy (luôn có 2 chữ số)
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  
  return `${day}/${month}/${year}`;
}

/**
 * Normalize date để so sánh - "1/11/2025" và "01/11/2025" sẽ giống nhau
 * Trả về dạng "dd/mm/yyyy" hoặc "" nếu invalid
 */
function normalizeDate(dateInput) {
  if (!dateInput) return '';
  
  const formatted = formatDate(dateInput);
  return formatted;
}

// ============================================
// ACTION HANDLERS - GHI/CẬP NHẬT DỮ LIỆU
// ============================================

/**
 * Login - Verify user credentials
 */
function login(paramString) {
  try {
    const param = safeJSONParse(paramString);
    Logger.log('🔐 Login attempt for username: ' + param.username);
    
    const sheet = getSheet(sheetName.user);
    
    if (!sheet) {
      Logger.log('❌ Sheet not found: ' + sheetName.user);
      throw new Error('Sheet TaiKhoan không tồn tại');
    }
    
    const data = sheet.getDataRange().getValues();
    Logger.log('📊 Total rows in sheet: ' + data.length);

    // Skip first 2 rows (row 1: title, row 2: headers)
    // Data starts from row 3 (index 2)
    // Columns: A=username(0), B=password(1), C=token(2), D=role(3)
    for (let i = 2; i < data.length; i++) {
      const rowUsername = String(data[i][0]).trim();
      const rowPassword = String(data[i][1]).trim();
      const inputUsername = String(param.username).trim();
      const inputPassword = String(param.password).trim();
      
      Logger.log('Checking row ' + (i+1) + ': ' + rowUsername);
      
      if (rowUsername === inputUsername) {
        Logger.log('✅ Username match found at row ' + (i+1));
        
        if (rowPassword === inputPassword) {
          Logger.log('✅ Password match!');
          
          const role = data[i][3] ? String(data[i][3]).trim() : 'guest';
          const token = data[i][2] ? String(data[i][2]).trim() : ('token_' + Date.now());
          
          const result = {
            username: rowUsername,
            role: role,
            token: token
          };
          
          Logger.log('✅ Login success: ' + JSON.stringify(result));
          return result;
        } else {
          Logger.log('❌ Password mismatch');
          Logger.log('Expected: "' + rowPassword + '" (length: ' + rowPassword.length + ')');
          Logger.log('Got: "' + inputPassword + '" (length: ' + inputPassword.length + ')');
        }
      }
    }

    Logger.log('❌ No matching user found');
    throw new Error('Sai tên đăng nhập hoặc mật khẩu');
    
  } catch (error) {
    Logger.log('❌ Login error: ' + error.toString());
    throw error;
  }
}

/**
 * Điểm danh - Mark attendance
 * ✅ LOCK SERVICE: Tránh race condition khi nhiều người điểm danh cùng lúc
 */
function markAttendance(paramString) {
  const lock = LockService.getScriptLock();
  
  try {
    // Chờ tối đa 30 giây để lấy lock
    lock.waitLock(30000);
    Logger.log('🔒 Lock acquired for markAttendance');
    
    const param = safeJSONParse(paramString);
    Logger.log('📝 Mark attendance request: ' + JSON.stringify(param));
    
    const attendanceCode = param.code || param.calendar?.attendanceCode;
    const calendar = param.calendar;
    const studentMarks = param.studentMarks || [];
    const studentMissings = param.studentMissings || [];
    
    if (!attendanceCode) {
      throw new Error('Attendance code is required');
    }
    
    Logger.log('Attendance code: ' + attendanceCode);
    Logger.log('Students present: ' + studentMarks.length);
    Logger.log('Students missing: ' + studentMissings.length);
    
    // 1. Ghi danh sách học viên có mặt vào sheet DiemDanhChiTiet
    // ✅ BATCH WRITE với DUPLICATE CHECK: Kiểm tra trước khi ghi
    if (studentMarks.length > 0) {
      const detailSheet = getSheet(sheetName.attendanceDetail);
      if (!detailSheet) {
        throw new Error('Sheet DiemDanhChiTiet không tồn tại');
      }
      
      // ✅ CHECK DUPLICATE: Đọc dữ liệu hiện tại để kiểm tra
      const existingDetailData = detailSheet.getDataRange().getValues();
      const existingDetailKeys = new Set();
      for (let i = 2; i < existingDetailData.length; i++) {
        // Key = attendanceCode + studentCode
        const key = String(existingDetailData[i][0]).trim() + '|' + String(existingDetailData[i][1]).trim();
        existingDetailKeys.add(key);
      }
      
      const timestamp = new Date().toISOString();
      const allRows = [];
      let skippedCount = 0;
      
      studentMarks.forEach(mark => {
        const dupKey = String(mark[0]).trim() + '|' + String(mark[1]).trim();
        
        // ✅ Skip nếu attendanceCode + studentCode đã tồn tại
        if (existingDetailKeys.has(dupKey)) {
          Logger.log('⚠️ SKIP duplicate DiemDanhChiTiet: ' + dupKey);
          skippedCount++;
          return;
        }
        
        allRows.push([
          mark[0], // attendanceCode
          mark[1], // studentCode
          mark[2], // studentName
          formatDate(mark[3]), // date - FORMAT về dd/mm/yyyy
          mark[4], // group
          mark[5] || '', // note
          timestamp // timestamp
        ]);
        
        // Thêm vào set để phòng duplicate trong cùng batch
        existingDetailKeys.add(dupKey);
      });
      
      if (allRows.length > 0) {
        const startRow = detailSheet.getLastRow() + 1;
        detailSheet.getRange(startRow, 1, allRows.length, allRows[0].length).setValues(allRows);
        
        // ✅ ÉP FORMAT TEXT cho cột date (D) để tránh Google Sheets parse nhầm
        detailSheet.getRange(startRow, 4, allRows.length, 1).setNumberFormat('@');
      }
      
      Logger.log('✅ Đã ghi batch ' + allRows.length + ' học viên có mặt' + (skippedCount > 0 ? ' (bỏ qua ' + skippedCount + ' duplicate)' : ''));
    }
    
    // 2. Ghi danh sách học viên vắng mặt vào sheet DiemDanhNghi
    // ✅ BATCH WRITE với DUPLICATE CHECK
    if (studentMissings.length > 0) {
      const missingSheet = getSheet(sheetName.attendanceMissing);
      if (!missingSheet) {
        throw new Error('Sheet DiemDanhNghi không tồn tại');
      }
      
      // ✅ CHECK DUPLICATE: Đọc dữ liệu hiện tại
      const existingMissingData = missingSheet.getDataRange().getValues();
      const existingMissingKeys = new Set();
      for (let i = 2; i < existingMissingData.length; i++) {
        // DiemDanhNghi: cột 0=timestamp, 1=date, 2=studentCode
        // Dùng attendanceCode khó xác định trong DiemDanhNghi, dùng date+studentCode
        const key = String(existingMissingData[i][1]).trim() + '|' + String(existingMissingData[i][2]).trim() + '|' + String(existingMissingData[i][4]).trim();
        existingMissingKeys.add(key);
      }
      
      const timestamp = new Date().toISOString();
      const allMissingRows = [];
      let skippedMissingCount = 0;
      
      studentMissings.forEach(missing => {
        const dateStr = formatDate(missing[3] || calendar?.dateTime);
        const dupKey = String(dateStr).trim() + '|' + String(missing[1]).trim() + '|' + String(missing[4] || calendar?.group).trim();
        
        // ✅ Skip nếu đã tồn tại
        if (existingMissingKeys.has(dupKey)) {
          Logger.log('⚠️ SKIP duplicate DiemDanhNghi: ' + dupKey);
          skippedMissingCount++;
          return;
        }
        
        allMissingRows.push([
          timestamp, // timestamp
          dateStr, // date - FORMAT về dd/mm/yyyy
          missing[1], // studentCode
          missing[2], // studentName
          missing[4] || calendar?.group, // group
          missing[5] || '', // reason
          missing[6] || 'Chưa chăm sóc' // note
        ]);
        
        existingMissingKeys.add(dupKey);
      });
      
      if (allMissingRows.length > 0) {
        const startRow = missingSheet.getLastRow() + 1;
        missingSheet.getRange(startRow, 1, allMissingRows.length, allMissingRows[0].length).setValues(allMissingRows);
        
        // ✅ ÉP FORMAT TEXT cho cột date (B) để tránh Google Sheets parse nhầm
        missingSheet.getRange(startRow, 2, allMissingRows.length, 1).setNumberFormat('@');
      }
      
      Logger.log('✅ Đã ghi batch ' + allMissingRows.length + ' học viên vắng mặt' + (skippedMissingCount > 0 ? ' (bỏ qua ' + skippedMissingCount + ' duplicate)' : ''));
    }
    
    // 3. Cập nhật attendanceCode vào sheet LichDay
    if (calendar) {
      updateStatusCalendar(attendanceCode);
    }
    
    // 4. Ghi summary vào sheet DiemDanh (tổng hợp điểm danh)
    // ✅ FIX: Luôn ghi vào DiemDanh nếu có attendanceCode, không cần calendar
    const attendanceSheet = getSheet(sheetName.attendance);
    if (!attendanceSheet) {
      throw new Error('Sheet DiemDanh không tồn tại');
    }
    
    // Check xem đã tồn tại chưa để tránh duplicate hoặc update
    const existingData = attendanceSheet.getDataRange().getValues();
    let rowIndex = -1;
    
    // Tìm row có attendanceCode trùng (bỏ qua header)
    for (let i = 0; i < existingData.length; i++) {
      if (String(existingData[i][0]).trim() === String(attendanceCode).trim()) {
        rowIndex = i + 1; // Convert to 1-based index
        break;
      }
    }
    
    let targetRow = rowIndex;
    
    if (rowIndex > -1) {
      Logger.log('⚠️ AttendanceCode đã tồn tại trong DiemDanh tại row ' + rowIndex + ', tiến hành cập nhật');
      targetRow = rowIndex;
    } else {
      // Nếu chưa có thì append row mới
      // Cấu trúc columns: attendanceCode, dateTime, group, teacher, subTeacher, 
      //                   total, totalMain, totalSub, salary, subSalary, location
      const summaryRowData = [
        attendanceCode, // A: attendanceCode
        formatDate(calendar?.dateTime) || '', // B: dateTime - ✅ FORMAT về dd/mm/yyyy
        calendar?.group || '', // C: group (fallback nếu không có calendar)
        '', // D: teacher - sẽ dùng VLOOKUP formula
        '' // E: subTeacher - sẽ dùng VLOOKUP formula
        // F, G, H, I, J, K sẽ dùng formula
      ];
      
      attendanceSheet.appendRow(summaryRowData);
      targetRow = attendanceSheet.getLastRow();
      Logger.log('✅ Đã tạo mới row ' + targetRow + ' trong DiemDanh');
    }
      
    // Set formulas để tự động tính toán (Update lại cho cả trường hợp mới và cũ)
    // ✅ VLOOKUP sẽ tự động lấy thông tin từ LichDay dựa trên attendanceCode
    const newRow = targetRow;
    const formulaDateTime = `=IFERROR(VLOOKUP(A${newRow}, ${sheetName.calendar}!A:B, 2, FALSE), "")`;
    const formulaGroup = `=IFERROR(VLOOKUP(A${newRow}, ${sheetName.calendar}!A:D, 4, FALSE), "")`;
    const formulaTeacher = `=IFERROR(VLOOKUP(A${newRow}, ${sheetName.calendar}!A:E, 5, FALSE), "")`;
    const formulaSubTeacher = `=IFERROR(VLOOKUP(A${newRow}, ${sheetName.calendar}!A:F, 6, FALSE), "")`;
    const formulaTotalMain = `=IF(A${newRow} <> "", COUNTIFS(DiemDanhChiTiet!A:A, A${newRow}, DiemDanhChiTiet!E:E, C${newRow}), 0)`;
    const formulaTotalSub = `=IF(A${newRow} <> "", COUNTIFS(DiemDanhChiTiet!A:A, A${newRow}, DiemDanhChiTiet!E:E, "<>"&C${newRow}), 0)`;
    const formulaTotal = `=SUM(G${newRow}:H${newRow})`;
    const formulaSalary = `=IF(F${newRow} = 0, 0, IF(F${newRow} <= 12, 150000, IF(F${newRow} <= 14, 170000, 200000)))+IF(K${newRow} = "Gang Thép", 20000, 0)`;
    const formulaSubSalary = `=IF(E${newRow} <> "", 50000, 0)`;
    const formulaLocation = `=XLOOKUP(TRIM(C${newRow}), LopHoc!$B$4:$B$100, LopHoc!$A$4:$A$100, "Không tìm thấy")`;
    
    // Apply formulas & Update data
    // Nếu là update, ta cũng update lại các cột dữ liệu nếu có từ calendar
    if (calendar?.dateTime) {
       attendanceSheet.getRange(`B${newRow}`).setValue(formatDate(calendar.dateTime));
    } else if (rowIndex === -1) {
       // Nếu tạo mới mà ko có calendar, dùng formula
       attendanceSheet.getRange(`B${newRow}`).setFormula(formulaDateTime);
    }
    
    if (calendar?.group) {
       attendanceSheet.getRange(`C${newRow}`).setValue(calendar.group);
    } else if (rowIndex === -1) {
       // Nếu tạo mới mà ko có calendar, dùng formula
       attendanceSheet.getRange(`C${newRow}`).setFormula(formulaGroup);
    }

    // Luôn update lại formulas để đảm bảo tính đúng đắn
    attendanceSheet.getRange(`D${newRow}`).setFormula(formulaTeacher);
    attendanceSheet.getRange(`E${newRow}`).setFormula(formulaSubTeacher);
    attendanceSheet.getRange(`G${newRow}`).setFormula(formulaTotalMain);
    attendanceSheet.getRange(`H${newRow}`).setFormula(formulaTotalSub);
    attendanceSheet.getRange(`F${newRow}`).setFormula(formulaTotal);
    attendanceSheet.getRange(`I${newRow}`).setFormula(formulaSalary);
    attendanceSheet.getRange(`J${newRow}`).setFormula(formulaSubSalary);
    attendanceSheet.getRange(`K${newRow}`).setFormula(formulaLocation);
    
    // ✅ ÉP FORMAT TEXT cho cột dateTime để tránh Google Sheets parse nhầm
    attendanceSheet.getRange(`B${newRow}`).setNumberFormat('@');
    
    Logger.log('✅ Đã ghi/update summary vào DiemDanh với formulas (calendar: ' + (calendar ? 'có' : 'không') + ')');
    
    Logger.log('✅ Mark attendance completed successfully');
    
    return { 
      success: true, 
      message: 'Điểm danh thành công',
      details: {
        attendanceCode: attendanceCode,
        present: studentMarks.length,
      }
    };
    
  } catch (error) {
    Logger.log('❌ Mark attendance error: ' + error.toString());
    console.error('Mark attendance error:', error);
    throw error;
  } finally {
    // ✅ Luôn release lock dù thành công hay lỗi
    lock.releaseLock();
    Logger.log('🔓 Lock released for markAttendance');
  }
}

/**
 * Lấy danh sách học viên đã điểm danh
 */
function getMarkedStudents(dataJson) {
  try {
    // Parse safely - có thể nhận string thuần hoặc JSON string
    const code = safeJSONParse(dataJson);
    
    Logger.log('📋 Getting marked students for code: ' + code);
    
    const sheet = getSheet(sheetName.attendanceDetail);
    if (!sheet) {
      throw new Error('Sheet DiemDanhChiTiet không tồn tại');
    }
    
    const data = sheet.getDataRange().getValues();
    
    // Filter rows with matching attendance code (bỏ qua 2 dòng header)
    const rowAttendanced = data.filter((row, index) => index > 1 && String(row[0]).trim() === String(code).trim());
    
    Logger.log('✅ Found ' + rowAttendanced.length + ' marked students for code: ' + code);
    return rowAttendanced;
  } catch (error) {
    Logger.log('❌ Get marked students error: ' + error.toString());
    throw error;
  }
}

/**
 * DEBUG: Log sheet structure to understand row layout
 */
function debugSheetStructure() {
  try {
    const detailSheet = getSheet(sheetName.attendanceDetail);
    const attendanceSheet = getSheet(sheetName.attendance);
    
    Logger.log('========================================');
    Logger.log('🔍 DEBUG: Sheet Structure Analysis');
    Logger.log('========================================');
    
    // DiemDanhChiTiet
    const detailData = detailSheet.getDataRange().getValues();
    Logger.log('');
    Logger.log('📊 DiemDanhChiTiet Structure:');
    Logger.log('Total rows: ' + detailData.length);
    for (let i = 0; i < Math.min(5, detailData.length); i++) {
      Logger.log('Row ' + (i+1) + ' (index ' + i + '): ' + JSON.stringify(detailData[i].slice(0, 5)));
    }
    
    // DiemDanh
    const attendanceData = attendanceSheet.getDataRange().getValues();
    Logger.log('');
    Logger.log('📋 DiemDanh Structure:');
    Logger.log('Total rows: ' + attendanceData.length);
    for (let i = 0; i < Math.min(5, attendanceData.length); i++) {
      Logger.log('Row ' + (i+1) + ' (index ' + i + '): ' + JSON.stringify(attendanceData[i].slice(0, 5)));
    }
    
    Logger.log('');
    Logger.log('========================================');
    
  } catch (error) {
    Logger.log('❌ Debug error: ' + error.toString());
  }
}

/**
 * Cập nhật điểm danh - Xóa dữ liệu cũ và tạo mới
 * ✅ LOCK SERVICE: Tránh race condition khi nhiều người cập nhật cùng lúc
 * ✅ FIX: Thêm flush + verify để đảm bảo xoá xong trước khi ghi mới
 */
function updateAttendance(paramString) {
  const lock = LockService.getScriptLock();
  
  try {
    // Chờ tối đa 30 giây để lấy lock
    lock.waitLock(30000);
    Logger.log('🔒 Lock acquired for updateAttendance');
    
    const param = safeJSONParse(paramString);
    const code = param.code;
    
    Logger.log('🔄 Updating attendance for code: ' + code);
    
    // Xóa dữ liệu cũ
    deleteOldAttendance(code, sheetName.attendanceDetail);
    deleteOldAttendance(code, sheetName.attendanceMissing);
    
    // ✅ FIX: Force flush pending changes trước khi ghi mới
    SpreadsheetApp.flush();
    
    // ✅ VERIFY: Kiểm tra đã xoá hết DiemDanhChiTiet chưa
    const verifyDetailSheet = getSheet(sheetName.attendanceDetail);
    if (verifyDetailSheet) {
      const verifyData = verifyDetailSheet.getDataRange().getValues();
      const normalizedCode = String(code).trim();
      const remaining = verifyData.filter((row, i) => i >= 2 && String(row[0]).trim() === normalizedCode);
      if (remaining.length > 0) {
        Logger.log('⚠️ WARNING: Still ' + remaining.length + ' rows remaining in DiemDanhChiTiet after delete, retrying...');
        deleteOldAttendance(code, sheetName.attendanceDetail);
        SpreadsheetApp.flush();
      }
    }
    
    // ✅ VERIFY: Kiểm tra đã xoá hết DiemDanhNghi chưa
    const verifyMissingSheet = getSheet(sheetName.attendanceMissing);
    if (verifyMissingSheet) {
      const verifyMissingData = verifyMissingSheet.getDataRange().getValues();
      const normalizedCode2 = String(code).trim();
      const remainingMissing = verifyMissingData.filter((row, i) => i >= 2 && String(row[0]).trim() === normalizedCode2);
      if (remainingMissing.length > 0) {
        Logger.log('⚠️ WARNING: Still ' + remainingMissing.length + ' rows remaining in DiemDanhNghi after delete, retrying...');
        deleteOldAttendance(code, sheetName.attendanceMissing);
        SpreadsheetApp.flush();
      }
    }
    
    // Tạo lại điểm danh mới (copy logic từ markAttendance nhưng không lock)
    const attendanceParam = safeJSONParse(paramString);
    const attendanceCode = attendanceParam.code || attendanceParam.calendar?.attendanceCode;
    const calendar = attendanceParam.calendar;
    const studentMarks = attendanceParam.studentMarks || [];
    const studentMissings = attendanceParam.studentMissings || [];
    
    // Ghi studentMarks batch (đã xoá hết data cũ, không cần check duplicate)
    if (studentMarks.length > 0) {
      const detailSheet = getSheet(sheetName.attendanceDetail);
      const timestamp = new Date().toISOString();
      const allRows = studentMarks.map(mark => [
        mark[0], mark[1], mark[2], formatDate(mark[3]), mark[4], mark[5] || '', timestamp
      ]);
      const startRow = detailSheet.getLastRow() + 1;
      detailSheet.getRange(startRow, 1, allRows.length, allRows[0].length).setValues(allRows);
      detailSheet.getRange(startRow, 4, allRows.length, 1).setNumberFormat('@');
    }
    
    // Ghi studentMissings batch
    if (studentMissings.length > 0) {
      const missingSheet = getSheet(sheetName.attendanceMissing);
      const timestamp = new Date().toISOString();
      const allMissingRows = studentMissings.map(missing => [
        timestamp, formatDate(missing[3] || calendar?.dateTime), missing[1], missing[2],
        missing[4] || calendar?.group, missing[5] || '', missing[6] || 'Chưa chăm sóc'
      ]);
      const startRow = missingSheet.getLastRow() + 1;
      missingSheet.getRange(startRow, 1, allMissingRows.length, allMissingRows[0].length).setValues(allMissingRows);
      missingSheet.getRange(startRow, 2, allMissingRows.length, 1).setNumberFormat('@');
    }
    
    // Update calendar status
    if (calendar) {
      updateStatusCalendar(attendanceCode);
    }
    
    Logger.log('✅ Cập nhật điểm danh thành công');
    return { success: true, message: 'Cập nhật thành công' };
  } catch (error) {
    Logger.log('❌ Update attendance error: ' + error.toString());
    throw error;
  } finally {
    lock.releaseLock();
    Logger.log('🔓 Lock released for updateAttendance');
  }
}

/**
 * Xóa dữ liệu điểm danh cũ
 */
function deleteOldAttendance(code, nameSheet) {
  try {
    const sheet = getSheet(nameSheet);
    if (!sheet) {
      Logger.log('⚠️ Sheet not found: ' + nameSheet);
      return;
    }
    
    const data = sheet.getDataRange().getValues();
    const rowsToDelete = [];
    
    // Tìm tất cả rows có attendanceCode trùng (bỏ qua 2 dòng header)
    // ✅ FIX: Convert về string và trim để tránh lỗi so sánh type mismatch
    const codeStr = String(code).trim();
    Logger.log('🔍 Searching for code: "' + codeStr + '" in ' + nameSheet);
    
    for (let i = data.length - 1; i >= 2; i--) {
      const rowCode = String(data[i][0]).trim();
      if (rowCode === codeStr) {
        rowsToDelete.push(i + 1); // Convert to 1-based index
        Logger.log('  Found match at row ' + (i + 1) + ': "' + rowCode + '"');
      }
    }
    
    // Xóa từ cuối lên đầu để tránh lỗi index
    rowsToDelete.forEach(rowIndex => {
      sheet.deleteRow(rowIndex);
    });
    
    Logger.log('🗑️ Deleted ' + rowsToDelete.length + ' rows from ' + nameSheet);
  } catch (error) {
    Logger.log('❌ Delete old attendance error: ' + error.toString());
    // ✅ FIX: Throw error lên caller để ngăn ghi mới khi chưa xoá xong
    throw error;
  }
}

/**
 * Cập nhật attendanceCode vào LichDay (đánh dấu đã điểm danh)
 */
function updateStatusCalendar(attendanceCode) {
  try {
    const calendarSheet = getSheet(sheetName.calendar);
    if (!calendarSheet) {
      throw new Error('Sheet LichDay không tồn tại');
    }
    
    const calendarData = calendarSheet.getDataRange().getValues();
    Logger.log('🔍 Searching for attendanceCode: "' + attendanceCode + '"');
    Logger.log('📊 Total calendar rows: ' + calendarData.length);
    
    // Tìm row có attendanceCode trùng và update status
    // Cấu trúc: attendanceCode(A), dateTime(B), location(C), group(D), teacher(E), 
    //           subTeacher(F), startTime(G), endTime(H), attendanceTime(I), note(J), status(K)
    // status = cột K = index 10 = column 11
    for (let i = 0; i < calendarData.length; i++) {
      const rowCode = String(calendarData[i][0]).trim();
      
      // Debug: Log first 5 codes to compare
      if (i < 5) {
        Logger.log('  Row ' + (i+1) + ' code: "' + rowCode + '"');
      }
      
      if (rowCode === attendanceCode) {
        const rowNumber = i + 1;
        const oldStatus = calendarData[i][10]; // Column K (status)
        
        // ✅ FIX: Update status = 1 (number, không phải string)
        calendarSheet.getRange(rowNumber, 11).setValue(1);
        Logger.log('✅ Updated status for calendar row ' + rowNumber);
        Logger.log('   - AttendanceCode: ' + attendanceCode);
        Logger.log('   - Old status: ' + oldStatus);
        Logger.log('   - New status: 1');
        return calendarData[i];
      }
    }
    
    Logger.log('❌ Calendar NOT FOUND with code: "' + attendanceCode + '"');
    Logger.log('⚠️ This may be because:');
    Logger.log('   1. AttendanceCode format mismatch (old vs new format)');
    Logger.log('   2. Calendar does not exist in LichDay sheet');
    Logger.log('   3. AttendanceCode has extra spaces or special characters');
  } catch (error) {
    Logger.log('❌ Update status calendar error: ' + error.toString());
  }
}

/**
 * Đổi giáo viên trong lịch dạy
 */
function changeTeacherOfCalendar(paramString) {
  try {
    const param = safeJSONParse(paramString);
    Logger.log('🔄 Changing teacher for calendar: ' + JSON.stringify(param));
    
    const sheet = getSheet(sheetName.calendar);
    
    if (!sheet) {
      Logger.log('❌ Sheet not found: ' + sheetName.calendar);
      throw new Error('Sheet LichDay không tồn tại');
    }
    
    const data = sheet.getDataRange().getValues();
    Logger.log('📊 Total rows in calendar sheet: ' + data.length);

    // Logic cũ: param là array [code, teacher, subTeacher]
    let code, teacher, subTeacher;
    
    if (Array.isArray(param)) {
      // Array format từ logic cũ
      code = param[0];
      teacher = param[1];
      subTeacher = param[2];
    } else {
      // Object format từ frontend mới
      code = param.attendanceCode || param.code;
      teacher = param.teacher;
      subTeacher = param.subTeacher;
    }
    
    Logger.log('Searching for code: ' + code);

    // Tìm row theo attendanceCode (cột A = cột 0)
    for (let i = 0; i < data.length; i++) {
      const rowCode = String(data[i][0]).trim();
      
      if (rowCode === code) {
        Logger.log('✅ Match found at row ' + (i+1));
        
        const rowNumber = i + 1;
        
        // Update columns 5 (teacher) and 6 (subTeacher)
        sheet.getRange(rowNumber, 5).setValue(teacher);
        sheet.getRange(rowNumber, 6).setValue(subTeacher);
        
        Logger.log('✅ Teacher changed successfully to: ' + teacher + ' / ' + subTeacher);
        return data[i];
      }
    }

    Logger.log('❌ No matching calendar found for code: ' + code);
    throw new Error('Không tìm thấy lịch dạy');
  } catch (error) {
    Logger.log('❌ Change teacher error: ' + error.toString());
    throw error;
  }
}

/**
 * Cập nhật thông tin học viên nghỉ (chăm sóc)
 */
function updateStudentMissing(paramString) {
  try {
    const param = safeJSONParse(paramString);
    Logger.log('🔄 Updating student missing: ' + JSON.stringify(param));
    
    const sheet = getSheet(sheetName.attendanceMissing);
    if (!sheet) {
      throw new Error('Sheet DiemDanhNghi không tồn tại');
    }
    
    const data = sheet.getDataRange().getValues();
    
    // Tìm row cần update
    // Logic cũ: data[i][0]=attendanceCode && data[i][1]=studentCode
    // Columns: attendanceCode(0), studentCode(1), ..., status(6), note(7)
    for (let i = 0; i < data.length; i++) {
      const rowAttendanceCode = String(data[i][0]).trim();
      const rowStudentCode = String(data[i][1]).trim();
      
      if (rowAttendanceCode === param.attendanceCode && rowStudentCode === param.studentCode) {
        const rowNumber = i + 1;
        
        // Update status (column 7) và note (column 8) theo logic cũ
        if (param.status) {
          sheet.getRange(rowNumber, 7).setValue(param.status);
        }
        if (param.note !== undefined) {
          sheet.getRange(rowNumber, 8).setValue(param.note);
        }
        
        Logger.log('✅ Cập nhật học viên nghỉ thành công');
        return data[i];
      }
    }

    Logger.log('❌ Không tìm thấy bản ghi học viên nghỉ');
    throw new Error('Không tìm thấy bản ghi học viên nghỉ');
  } catch (error) {
    Logger.log('❌ Update student missing error: ' + error.toString());
    throw error;
  }
}

/**
 * Get month abbreviation (3 letters)
 * @param {number} monthNumber - Month number (1-12)
 * @return {string} - Month abbreviation (jan, feb, mar, ...)
 */
function getMonthAbbr(monthNumber) {
  const months = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
  const index = parseInt(monthNumber, 10) - 1;
  return months[index] || '';
}

/**
 * Parse month abbreviation to month number
 * @param {string} monthAbbr - Month abbreviation (jan, feb, mar, ...)
 * @return {number} - Month number (1-12)
 */
function parseMonthAbbr(monthAbbr) {
  const months = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
  const index = months.indexOf(monthAbbr.toLowerCase());
  return index >= 0 ? index + 1 : 0;
}

/**
 * Format time to HH:mm (remove Date object if exists)
 */
function formatTime(timeInput) {
  if (!timeInput) return '';
  
  // Nếu là string và đã đúng format HH:mm, return luôn
  if (typeof timeInput === 'string') {
    const trimmed = timeInput.trim();
    // Check format HH:mm (08:00, 19:30, etc.)
    if (/^\d{1,2}:\d{2}$/.test(trimmed)) {
      return trimmed;
    }
  }
  
  // Nếu là Date object, extract hours:minutes
  if (timeInput instanceof Date) {
    const hours = String(timeInput.getHours()).padStart(2, '0');
    const minutes = String(timeInput.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
  }
  
  // Fallback: return as string
  return String(timeInput);
}

/**
 * Tạo lịch dạy
 * ✅ BATCH WRITE: Thay vì appendRow từng row, dùng setValues() batch
 */
function createCalendars(paramString) {
  try {
    const param = safeJSONParse(paramString);
    const sheet = getSheet(sheetName.calendar);
    const calendars = Array.isArray(param) ? param : [param];

    // Chuẩn bị tất cả rows trước
    const allRows = calendars.map(cal => {
      // ✅ VALIDATE & FORMAT TIME: Đảm bảo startTime/endTime luôn là string HH:mm
      const startTime = formatTime(cal.startTime);
      const endTime = formatTime(cal.endTime);
      const attendanceTime = cal.attendanceTime || `${startTime} - ${endTime}`;
      
      // ✅ VALIDATE ATTENDANCE CODE: Đảm bảo format đúng (không có Date object, dùng 8 chữ số cho date)
      let attendanceCode = cal.attendanceCode || '';
      let needRegenerate = false;
      
      if (!attendanceCode) {
        needRegenerate = true;
        Logger.log('⚠️ Warning: attendanceCode is empty, regenerating...');
      } else if (attendanceCode.includes('GMT')) {
        needRegenerate = true;
        Logger.log('⚠️ Warning: attendanceCode contains Date object, regenerating...');
      }
      
      if (needRegenerate) {
        // Regenerate code: GC{group}-{d}mmm{yyyy}-{HHmm}{HHmm}
        const dateTime = formatDate(cal.dateTime);
        const dateParts = dateTime.split('/');
        if (dateParts.length === 3) {
          const dayNum = parseInt(dateParts[0], 10); // 1-31 (no padding)
          const monthNum = parseInt(dateParts[1], 10);
          const year = String(dateParts[2]); // yyyy
          const monthAbbr = getMonthAbbr(monthNum); // jan, feb, mar, ...
          const dateCode = dayNum + monthAbbr + year; // 1nov2025, 15dec2024
          const timeCode = startTime.replace(/:/g, '') + endTime.replace(/:/g, '');
          attendanceCode = 'GC' + (cal.group || '') + '-' + dateCode + '-' + timeCode;
          Logger.log('  → Regenerated code: ' + attendanceCode);
        }
      }
      
      // Cấu trúc theo logic cũ: 11 cột
      // attendanceCode, dateTime, location, group, teacher, subTeacher, 
      // startTime, endTime, attendanceTime, note, status
      return [
        attendanceCode,
        formatDate(cal.dateTime) || '', // FORMAT về dd/mm/yyyy
        cal.location || '',
        cal.group || '',
        cal.teacher || '',
        cal.subTeacher || '',
        startTime,
        endTime,
        attendanceTime,
        cal.note || '',
        cal.status || ''
      ];
    });
    
    // ✅ BATCH WRITE: Ghi tất cả rows một lần
    const startRow = sheet.getLastRow() + 1;
    sheet.getRange(startRow, 1, allRows.length, allRows[0].length).setValues(allRows);
    
    // ✅ ÉP FORMAT TEXT cho cột dateTime (B) để tránh Google Sheets parse nhầm
    sheet.getRange(startRow, 2, allRows.length, 1).setNumberFormat('@');

    Logger.log('✅ Tạo lịch dạy batch thành công: ' + calendars.length + ' lịch');
    return calendars;
  } catch (error) {
    Logger.log('❌ Create calendars error: ' + error.toString());
    throw error;
  }
}

/**
 * Generate payment ID - gd0001, gd0002, ...
 */
function generatePaymentId() {
  try {
    const sheet = getSheet(sheetName.payment);
    const data = sheet.getDataRange().getValues();
    
    Logger.log('📝 Generating payment ID');
    
    // Find ID column (assume it's the last column with header 'id')
    const headerRow = 2; // Index 2 = row 3
    const headers = data[headerRow];
    const idCol = headers.indexOf('id');
    
    if (idCol === -1) {
      Logger.log('⚠️ ID column not found, using default gd0001');
      return 'gd0001';
    }
    
    let maxNumber = 0;
    
    // Find max number in existing IDs (skip header rows)
    for (let i = headerRow + 1; i < data.length; i++) {
      const id = String(data[i][idCol]).trim();
      const match = id.match(/^gd(\d+)$/i); // Match gd0001, GD0001, etc.
      if (match) {
        const num = parseInt(match[1], 10);
        if (num > maxNumber) {
          maxNumber = num;
        }
      }
    }
    
    Logger.log('  - Max ID number found: ' + maxNumber);
    
    // Generate new ID with padding 4 digits
    const newNumber = (maxNumber + 1).toString().padStart(4, '0');
    const newId = 'gd' + newNumber;
    
    Logger.log('  ✅ Generated new ID: ' + newId);
    
    return newId;
  } catch (error) {
    Logger.log('❌ Generate payment ID error: ' + error.toString());
    // Fallback: use timestamp
    return 'gd' + Date.now().toString().slice(-8);
  }
}

/**
 * Đóng học - Create payment
 */
function createPayment(paramString) {
  try {
    const param = safeJSONParse(paramString);
    const sheet = getSheet(sheetName.payment);

    // Generate unique ID
    const paymentId = generatePaymentId();
    
    // Cấu trúc mới: 8 cột (thêm id ở cuối)
    // studentCode, studentName, datePayment, type, money, lesson, note, id
    const rowData = [
      param.studentCode || '',
      param.studentName || '',
      formatDate(param.datePayment) || '', // ✅ FORMAT về dd/mm/yyyy
      param.type || '',
      param.money || '',
      param.lesson || '',
      param.note || '',
      paymentId  // ID duy nhất
    ];

    sheet.appendRow(rowData);
    const newRow = sheet.getLastRow();
    
    // ✅ ÉP FORMAT TEXT cho cột datePayment (C) để tránh Google Sheets parse nhầm
    sheet.getRange(`C${newRow}`).setNumberFormat('@');
    
    Logger.log('✅ Đóng học thành công: ' + param.studentCode + ' (ID: ' + paymentId + ')');
    
    return { ...param, id: paymentId };
  } catch (error) {
    Logger.log('❌ Create payment error: ' + error.toString());
    throw error;
  }
}

/**
 * Cập nhật giao dịch thanh toán - Dùng ID để tìm chính xác
 */
function updatePayment(paramString) {
  try {
    const param = safeJSONParse(paramString);
    Logger.log('📝 Updating payment');
    Logger.log('📝 Full params: ' + JSON.stringify(param));
    
    const sheet = getSheet(sheetName.payment);
    
    if (!sheet) {
      return {
        status: 'error',
        message: 'Không tìm thấy sheet DongHoc'
      };
    }
    
    // Get all data
    const dataRange = sheet.getDataRange();
    const values = dataRange.getValues();
    
    Logger.log('📊 Sheet has ' + values.length + ' rows');
    
    // Find header row (thường là row 3)
    const headerRow = 2; // Index 2 = row 3 in sheet
    const headers = values[headerRow];
    
    Logger.log('📋 Headers: ' + JSON.stringify(headers));
    
    // Find column indexes
    const idCol = headers.indexOf('id');
    const studentCodeCol = headers.indexOf('studentCode');
    const studentNameCol = headers.indexOf('studentName');
    const datePaymentCol = headers.indexOf('datePayment');
    const typeCol = headers.indexOf('type');
    const lessonCol = headers.indexOf('lesson');
    const moneyCol = headers.indexOf('money');
    const noteCol = headers.indexOf('note');
    
    Logger.log('📍 Column indexes: id=' + idCol + 
               ', studentCode=' + studentCodeCol + 
               ', datePayment=' + datePaymentCol + 
               ', type=' + typeCol + 
               ', lesson=' + lessonCol + 
               ', money=' + moneyCol + 
               ', note=' + noteCol);
    
    // PRIORITY 1: Find by ID (chính xác nhất)
    let rowIndex = -1;
    
    if (param.id && idCol !== -1) {
      const paramId = String(param.id).trim();
      Logger.log('🎯 Searching by ID: "' + paramId + '"');
      
      for (let i = headerRow + 1; i < values.length; i++) {
        const rowId = String(values[i][idCol]).trim();
        
        if (rowId === paramId) {
          rowIndex = i;
          Logger.log('✅ Match found by ID at row ' + (i+1));
          break;
        }
      }
    }
    
    // FALLBACK: Find by studentCode + datePayment (legacy support)
    if (rowIndex === -1 && studentCodeCol !== -1 && datePaymentCol !== -1) {
      const paramStudentCode = String(param.studentCode).trim();
      const paramDatePayment = String(param.datePayment).trim();
      
      Logger.log('🔄 Fallback: Searching by studentCode + datePayment');
      Logger.log('🎯 Searching for: studentCode="' + paramStudentCode + '", datePayment="' + paramDatePayment + '"');
      
      for (let i = headerRow + 1; i < values.length; i++) {
        const rowStudentCode = String(values[i][studentCodeCol]).trim();
        const rowDatePayment = String(values[i][datePaymentCol]).trim();
        
        Logger.log('🔍 Row ' + (i+1) + ': studentCode="' + rowStudentCode + '", datePayment="' + rowDatePayment + '"');
        
        if (rowStudentCode === paramStudentCode && rowDatePayment === paramDatePayment) {
          rowIndex = i;
          Logger.log('✅ Match found by studentCode+datePayment at row ' + (i+1));
          break;
        }
      }
    }
    
    if (rowIndex === -1) {
      Logger.log('❌ No matching row found');
      Logger.log('❌ Search criteria: id="' + (param.id || 'N/A') + '", studentCode="' + (param.studentCode || 'N/A') + '", datePayment="' + (param.datePayment || 'N/A') + '"');
      
      // Log first 5 rows để debug
      Logger.log('📋 First 5 data rows for reference:');
      for (let i = headerRow + 1; i < Math.min(headerRow + 6, values.length); i++) {
        const debugId = idCol !== -1 ? String(values[i][idCol]).trim() : 'N/A';
        const debugCode = studentCodeCol !== -1 ? String(values[i][studentCodeCol]).trim() : 'N/A';
        const debugDate = datePaymentCol !== -1 ? String(values[i][datePaymentCol]).trim() : 'N/A';
        Logger.log('  Row ' + (i+1) + ': id="' + debugId + '", studentCode="' + debugCode + '", datePayment="' + debugDate + '"');
      }
      
      return {
        status: 'error',
        message: 'Không tìm thấy giao dịch cần cập nhật'
      };
    }
    
    // Update the row
    const actualRowNumber = rowIndex + 1; // Convert to 1-based index
    
    Logger.log('📝 Updating row ' + actualRowNumber);
    
    if (studentCodeCol !== -1 && param.studentCode) {
      Logger.log('  - Updating studentCode to: ' + param.studentCode);
      sheet.getRange(actualRowNumber, studentCodeCol + 1).setValue(param.studentCode);
    }
    if (studentNameCol !== -1 && param.studentName) {
      Logger.log('  - Updating studentName to: ' + param.studentName);
      sheet.getRange(actualRowNumber, studentNameCol + 1).setValue(param.studentName);
    }
    if (datePaymentCol !== -1 && param.datePayment) {
      const formattedDate = formatDate(param.datePayment);
      Logger.log('  - Updating datePayment to: ' + formattedDate);
      sheet.getRange(actualRowNumber, datePaymentCol + 1).setValue(formattedDate);
      // ✅ ÉP FORMAT TEXT để tránh Google Sheets parse nhầm
      sheet.getRange(actualRowNumber, datePaymentCol + 1).setNumberFormat('@');
    }
    if (typeCol !== -1 && param.type) {
      Logger.log('  - Updating type to: ' + param.type);
      sheet.getRange(actualRowNumber, typeCol + 1).setValue(param.type);
    }
    if (lessonCol !== -1 && param.lesson !== undefined) {
      Logger.log('  - Updating lesson to: ' + param.lesson);
      sheet.getRange(actualRowNumber, lessonCol + 1).setValue(param.lesson);
    }
    if (moneyCol !== -1 && param.money) {
      Logger.log('  - Updating money to: ' + param.money + ' (type: ' + typeof param.money + ')');
      // Convert to number if it's a string with commas
      let moneyValue = param.money;
      if (typeof moneyValue === 'string') {
        moneyValue = moneyValue.replace(/,/g, ''); // Remove commas
        moneyValue = parseFloat(moneyValue) || moneyValue; // Try to parse as number
      }
      Logger.log('  - Money after conversion: ' + moneyValue + ' (type: ' + typeof moneyValue + ')');
      sheet.getRange(actualRowNumber, moneyCol + 1).setValue(moneyValue);
    }
    if (noteCol !== -1 && param.note !== undefined) {
      Logger.log('  - Updating note to: ' + param.note);
      sheet.getRange(actualRowNumber, noteCol + 1).setValue(param.note);
    }
    
    Logger.log('✅ Payment updated successfully');
    
    return {
      status: 'success',
      message: 'Cập nhật giao dịch thành công'
    };
    
  } catch (error) {
    Logger.log('❌ Error updating payment: ' + error.toString());
    return {
      status: 'error',
      message: 'Lỗi: ' + error.toString()
    };
  }
}

/**
 * Xóa giao dịch thanh toán - Dùng ID để xóa chính xác
 */
function deletePayment(paramString) {
  try {
    const param = safeJSONParse(paramString);
    Logger.log('🗑️ Deleting payment');
    Logger.log('🗑️ Params: ' + JSON.stringify(param));
    
    const sheet = getSheet(sheetName.payment);
    
    if (!sheet) {
      return {
        status: 'error',
        message: 'Không tìm thấy sheet DongHoc'
      };
    }
    
    // Get all data
    const dataRange = sheet.getDataRange();
    const values = dataRange.getValues();
    
    // Find header row (thường là row 3)
    const headerRow = 2; // Index 2 = row 3 in sheet
    const headers = values[headerRow];
    
    Logger.log('📋 Headers: ' + JSON.stringify(headers));
    
    // Find column indexes
    const idCol = headers.indexOf('id');
    const studentCodeCol = headers.indexOf('studentCode');
    const datePaymentCol = headers.indexOf('datePayment');
    
    Logger.log('📍 Column indexes: id=' + idCol + ', studentCode=' + studentCodeCol + ', datePayment=' + datePaymentCol);
    
    // PRIORITY 1: Delete by ID (chính xác nhất)
    let rowIndex = -1;
    
    if (param.id && idCol !== -1) {
      const paramId = String(param.id).trim();
      Logger.log('🎯 Deleting by ID: "' + paramId + '"');
      
      for (let i = headerRow + 1; i < values.length; i++) {
        const rowId = String(values[i][idCol]).trim();
        
        if (rowId === paramId) {
          rowIndex = i;
          Logger.log('✅ Match found by ID at row ' + (i+1));
          break;
        }
      }
    }
    
    // FALLBACK: Delete by studentCode + datePayment (legacy support)
    if (rowIndex === -1 && studentCodeCol !== -1 && datePaymentCol !== -1) {
      const paramStudentCode = String(param.studentCode).trim();
      const paramDatePayment = String(param.datePayment).trim();
      
      Logger.log('🔄 Fallback: Deleting by studentCode + datePayment');
      Logger.log('🎯 Searching for: studentCode="' + paramStudentCode + '", datePayment="' + paramDatePayment + '"');
      
      for (let i = headerRow + 1; i < values.length; i++) {
        const rowStudentCode = String(values[i][studentCodeCol]).trim();
        const rowDatePayment = String(values[i][datePaymentCol]).trim();
        
        if (rowStudentCode === paramStudentCode && rowDatePayment === paramDatePayment) {
          rowIndex = i;
          Logger.log('✅ Match found by studentCode+datePayment at row ' + (i+1));
          break;
        }
      }
    }
    
    if (rowIndex === -1) {
      Logger.log('❌ No matching row found');
      return {
        status: 'error',
        message: 'Không tìm thấy giao dịch cần xóa'
      };
    }
    
    // Delete the row
    const actualRowNumber = rowIndex + 1; // Convert to 1-based index
    sheet.deleteRow(actualRowNumber);
    
    Logger.log('✅ Payment deleted successfully (row ' + actualRowNumber + ')');
    
    return {
      status: 'success',
      message: 'Xóa giao dịch thành công'
    };
    
  } catch (error) {
    Logger.log('❌ Error deleting payment: ' + error.toString());
    return {
      status: 'error',
      message: 'Lỗi: ' + error.toString()
    };
  }
}

/**
 * Điều chỉnh buổi học
 */
function updateLesson(paramString) {
  try {
    const param = safeJSONParse(paramString);
    const sheet = getSheet(sheetName.lessonUpdate);

    // Cấu trúc theo logic cũ: 5 cột
    // studentCode, studentName, datePayment, lesson, note
    const rowData = [
      param.studentCode || '',
      param.studentName || '',
      formatDate(param.datePayment) || '', // ✅ FORMAT về dd/mm/yyyy
      param.lesson || 0,
      param.note || ''
    ];

    sheet.appendRow(rowData);
    const newRow = sheet.getLastRow();
    
    // ✅ ÉP FORMAT TEXT cho cột datePayment (C) để tránh Google Sheets parse nhầm
    sheet.getRange(`C${newRow}`).setNumberFormat('@');
    
    Logger.log('✅ Điều chỉnh buổi học:', param.studentCode);
    
    return rowData;
  } catch (error) {
    Logger.log('❌ Update lesson error: ' + error.toString());
    throw error;
  }
}

/**
 * Tạo studentCode tự động dựa trên location
 * Format: {locationCode}{number} (GT001, GT002, ...)
 */
function generateStudentCode(location) {
  try {
    const sheet = getSheet(sheetName.student);
    const data = sheet.getDataRange().getValues();
    
    Logger.log('📝 Generating student code for location: ' + location);
    
    // Lọc học viên theo location (bỏ qua 2 dòng header)
    const locationStudents = data.filter((row, index) => 
      index > 1 && String(row[1]).trim() === String(location).trim()
    );
    
    Logger.log('  - Found ' + locationStudents.length + ' students at this location');
    
    // Tìm số lớn nhất trong các studentCode
    let maxNumber = 0;
    locationStudents.forEach(row => {
      const code = String(row[0]).trim(); // Column A = studentCode
      const match = code.match(/\d+$/); // Extract số ở cuối string
      if (match) {
        const num = parseInt(match[0], 10);
        if (num > maxNumber) {
          maxNumber = num;
        }
      }
    });
    
    Logger.log('  - Max number found: ' + maxNumber);
    
    // Tạo code mới với padding 3 chữ số
    const newNumber = (maxNumber + 1).toString().padStart(3, '0');
    const newCode = location + newNumber;
    
    Logger.log('  ✅ Generated new code: ' + newCode);
    
    return newCode;
  } catch (error) {
    Logger.log('❌ Generate student code error: ' + error.toString());
    // Fallback: dùng timestamp nếu có lỗi
    return location + Date.now().toString().slice(-6);
  }
}

/**
 * Thêm học viên mới
 */
function newStudent(paramString) {
  try {
    const param = safeJSONParse(paramString);
    const sheet = getSheet(sheetName.student);
    
    // ✅ AUTO-GENERATE CODE: Nếu frontend không gửi code hoặc code rỗng
    let studentCode = param.code;
    if (!studentCode || studentCode.trim() === '') {
      studentCode = generateStudentCode(param.location);
      Logger.log('🔄 Auto-generated student code: ' + studentCode);
    }
    
    // ✅ CHECK TRÙNG: Kiểm tra xem studentCode đã tồn tại chưa
    const existingData = sheet.getDataRange().getValues();
    const isDuplicate = existingData.some((row, index) => 
      index > 1 && String(row[0]).trim() === String(studentCode).trim()
    );
    
    if (isDuplicate) {
      Logger.log('❌ Student code already exists: ' + studentCode);
      throw new Error('Mã học viên "' + studentCode + '" đã tồn tại. Vui lòng sử dụng mã khác.');
    }

    // Cấu trúc theo logic cũ: 11 cột
    // code, location, fullname, nickname, group, gender, birthday, 
    // phoneNumber, dateStart, status, note
    const rowData = [
      studentCode,  // ✅ Sử dụng code đã generate hoặc từ frontend
      param.location || '',
      param.fullname || '',
      param.nickname || '',
      param.group || '',
      param.gender || '',
      formatDate(param.birthday) || '', // ✅ FORMAT về dd/mm/yyyy
      param.phoneNumber || param.phone || '',
      formatDate(param.dateStart) || '', // ✅ FORMAT về dd/mm/yyyy
      param.status || 'active',
      param.note || ''
    ];

    sheet.appendRow(rowData);
    const newRow = sheet.getLastRow();
    
    // ✅ ÉP FORMAT TEXT cho cột birthday (G) và dateStart (I) để tránh Google Sheets parse nhầm
    sheet.getRange(`G${newRow}`).setNumberFormat('@');
    sheet.getRange(`I${newRow}`).setNumberFormat('@');
    
    Logger.log('✅ Thêm học viên mới: ' + studentCode);
    
    // Tạo student follow
    param.code = studentCode; // Update code cho createStudentFollow
    createStudentFollow(param);
    
    return { ...param, code: studentCode }; // ✅ Trả về code đã tạo
  } catch (error) {
    Logger.log('❌ New student error: ' + error.toString());
    throw error;
  }
}

/**
 * Tạo student follow (theo dõi học viên)
 */
function createStudentFollow(student) {
  try {
    const sheet = getSheet(sheetName.studentFollow);
    if (!sheet) {
      Logger.log('⚠️ Sheet KiemSoatBuoiHoc không tồn tại');
      return;
    }
    
    const data = sheet.getDataRange().getValues();
    
    // Check trùng với trim và so sánh loose (== giống logic cũ)
    const isExist = data.some((row, index) => 
      index > 1 && String(row[0]).trim() == String(student.code).trim()
    );
    
    if (isExist) {
      Logger.log('⚠️ Student follow đã tồn tại: ' + student.code);
      return;
    }
    
    const studentFollow = [student.code];
    sheet.appendRow(studentFollow);
    
    const newRow = sheet.getLastRow();
    
    // Set formulas theo logic cũ
    const formulaFullName = `=IFERROR(VLOOKUP(A${newRow}, ${sheetName.student}!A:C, 3, FALSE), "")`;
    const formulaGroup = `=IFERROR(VLOOKUP(A${newRow}, ${sheetName.student}!A:E, 5, FALSE), "")`;
    const formulaDongHoc = `=COUNTIF(${sheetName.payment}!A:A, A${newRow})`;
    const formulaTong = `=ARRAYFORMULA(SUMIFS(${sheetName.payment}!$F$4:F, ${sheetName.payment}!$A$4:A, A${newRow}) + SUMIFS(${sheetName.lessonUpdate}!$D$4:D, ${sheetName.lessonUpdate}!$A$4:A, A${newRow}))`;
    const formulaDaHoc = `=COUNTIF(${sheetName.attendanceDetail}!B:B, A${newRow})`;
    const formulaConLai = `=E${newRow}-F${newRow}`;
    
    sheet.getRange(`B${newRow}`).setFormula(formulaFullName);
    sheet.getRange(`C${newRow}`).setFormula(formulaGroup);
    sheet.getRange(`D${newRow}`).setFormula(formulaDongHoc);
    sheet.getRange(`E${newRow}`).setFormula(formulaTong);
    sheet.getRange(`F${newRow}`).setFormula(formulaDaHoc);
    sheet.getRange(`G${newRow}`).setFormula(formulaConLai);
    
    Logger.log('✅ Tạo student follow thành công');
  } catch (error) {
    Logger.log('❌ Create student follow error: ' + error.toString());
  }
}

/**
 * Cập nhật thông tin học viên
 */
function updateStudent(paramString) {
  try {
    const param = safeJSONParse(paramString);
    const sheet = getSheet(sheetName.student);
    const data = sheet.getDataRange().getValues();

    // Cấu trúc theo logic cũ: 11 cột
    // code, location, fullname, nickname, group, gender, birthday, 
    // phoneNumber, dateStart, status, note
    const student = [
      param.code || '',
      param.location || '',
      param.fullname || '',
      param.nickname || '',
      param.group || '',
      param.gender || '',
      formatDate(param.birthday) || '', // ✅ FORMAT về dd/mm/yyyy
      param.phoneNumber || param.phone || '',
      formatDate(param.dateStart) || '', // ✅ FORMAT về dd/mm/yyyy
      param.status || 'active',
      param.note || ''
    ];

    // Tìm row theo code
    let rowIndex = -1;
    for (let i = 0; i < data.length; i++) {
      if (data[i][0] === param.code) {
        rowIndex = i + 1; // Convert to 1-based index
        break;
      }
    }

    if (rowIndex > -1) {
      // Cập nhật row
      const range = sheet.getRange(rowIndex, 1, 1, student.length);
      range.setValues([student]);
      Logger.log('✅ Cập nhật học viên:', param.code);
    } else {
      // Nếu không tìm thấy, thêm mới
      sheet.appendRow(student);
      Logger.log('✅ Thêm học viên mới (không tìm thấy):', param.code);
    }
    
    return student;
  } catch (error) {
    Logger.log('❌ Update student error: ' + error.toString());
    throw error;
  }
}

/**
 * Điều chỉnh theo tháng
 */
function updateStudentByMonth(paramString) {
  try {
    const param = safeJSONParse(paramString);
    const sheet = getSheet(sheetName.studentMonthUpdate);
    const dataArray = param.data || [param];

    dataArray.forEach(item => {
      const rowData = [
        item.location || '',
        item.studentCode || '',
        item.studentName || '',
        formatDate(item.dateUpdate) || '', // ✅ FORMAT về dd/mm/yyyy
        item.lesson || 0,
        item.note || ''
      ];
      sheet.appendRow(rowData);
      const newRow = sheet.getLastRow();
      
      // ✅ ÉP FORMAT TEXT cho cột dateUpdate (D) để tránh Google Sheets parse nhầm
      sheet.getRange(`D${newRow}`).setNumberFormat('@');
    });

    console.log('✅ Cập nhật tháng thành công:', dataArray.length, 'records');
    return { success: true, message: 'Cập nhật thành công', count: dataArray.length };
  } catch (error) {
    console.error('Update student by month error:', error);
    throw error;
  }
}

// ============================================
// LƯU Ý:
// - Code này CHỈ xử lý GHI/CẬP NHẬT dữ liệu
// - ĐỌC dữ liệu sẽ dùng API v4 từ frontend (nhanh hơn)
// - Idempotency key giúp tránh duplicate
// - Cache kết quả trong 1 giờ
// ============================================

// ============================================
// UTILITY FUNCTIONS - Chỉ dùng thủ công khi cần
// ============================================

/**
 * FIX ATTENDANCE CODES
 * Sửa tất cả attendanceCode về format chuẩn: GC{group}-{d}mmm{yyyy}-{HHmm}{HHmm}
 * Ví dụ: GCBreak2-1nov2025-18422012
 * 
 * Logic:
 * 1. Đọc dateTime từ LichDay & DiemDanhChiTiet → Parse dd/mm/yyyy
 * 2. Tạo mapping: oldCode → newCode
 * 3. Update cả 3 sheets: LichDay, DiemDanh, DiemDanhChiTiet
 */
function fixAttendanceCodeFromDateTime() {
  try {
    Logger.log('🔧 Fix Attendance Codes');
    Logger.log('========================================');

    const calendarSheet = sheetData.getSheetByName('LichDay');
    const attendanceSheet = sheetData.getSheetByName('DiemDanh');
    const detailSheet = sheetData.getSheetByName('DiemDanhChiTiet');

    if (!calendarSheet || !attendanceSheet || !detailSheet) {
      Logger.log('❌ Required sheets not found');
      return { success: false, error: 'Missing sheets' };
    }

    const codeMapping = {}; // oldCode → newCode

    // ===== STEP 1: LichDay =====
    Logger.log('\n📌 STEP 1: Processing LichDay...');
    const calendarData = calendarSheet.getDataRange().getValues();
    const calendarDisplay = calendarSheet.getDataRange().getDisplayValues();
    let count1 = 0;
    
    for (let i = 3; i < calendarData.length; i++) {
      const oldCode = String(calendarData[i][0]).trim();
      if (!oldCode || !oldCode.startsWith('GC')) continue;
      
      const dateTimeStr = calendarDisplay[i][1]; // Column B
      const group = String(calendarData[i][3]).trim(); // Column D
      const startTime = formatTime(calendarData[i][6]); // Column G
      const endTime = formatTime(calendarData[i][7]); // Column H
      
      // Parse dd/mm/yyyy
      const parts = dateTimeStr.split('/');
      if (parts.length !== 3) continue;
      
      const day = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10);
      const year = parseInt(parts[2], 10);
      
      if (!day || !month || !year || month < 1 || month > 12) continue;
      
      // Generate: GC{group}-{d}mmm{yyyy}-{HHmm}{HHmm}
      const dateCode = day + getMonthAbbr(month) + year;
      const timeCode = startTime.replace(/:/g, '') + endTime.replace(/:/g, '');
      const newCode = 'GC' + group + '-' + dateCode + '-' + timeCode;
      
      if (oldCode !== newCode) {
        codeMapping[oldCode] = newCode;
        count1++;
        if (count1 <= 5) Logger.log('  ' + oldCode + ' → ' + newCode);
      }
    }
    Logger.log('  ✓ Processed: ' + count1 + ' codes');

    // ===== STEP 2: DiemDanhChiTiet =====
    Logger.log('\n📌 STEP 2: Processing DiemDanhChiTiet...');
    const detailData = detailSheet.getDataRange().getValues();
    const detailDisplay = detailSheet.getDataRange().getDisplayValues();
    let count2 = 0;
    
    for (let i = 3; i < detailData.length; i++) {
      const oldCode = String(detailData[i][0]).trim();
      if (!oldCode || !oldCode.startsWith('GC') || codeMapping[oldCode]) continue;
      
      const dateStr = detailDisplay[i][3]; // Column D
      const group = String(detailData[i][4]).trim(); // Column E
      
      // Parse dd/mm/yyyy
      const parts = dateStr.split('/');
      if (parts.length !== 3) continue;
      
      const day = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10);
      const year = parseInt(parts[2], 10);
      
      if (!day || !month || !year || month < 1 || month > 12) continue;
      
      // Extract time from oldCode (support both formats)
      let timeCode = '';
      const withHyphen = oldCode.match(/-(\d{8})$/);
      if (withHyphen) {
        timeCode = withHyphen[1];
      } else {
        const noGC = oldCode.replace(/^GC/, '').replace(new RegExp('^' + group + '-?'), '');
        const match = noGC.match(/(\d{4})(\d{4})$/);
        if (match) timeCode = match[1] + match[2];
        else continue;
      }
      
      // Generate new code
      const dateCode = day + getMonthAbbr(month) + year;
      const newCode = 'GC' + group + '-' + dateCode + '-' + timeCode;
      
      if (oldCode !== newCode) {
        codeMapping[oldCode] = newCode;
        count2++;
      }
    }
    Logger.log('  ✓ Processed: ' + count2 + ' codes');

    // ===== SUMMARY =====
    const totalCodes = Object.keys(codeMapping).length;
    Logger.log('\n📋 Total: ' + totalCodes + ' codes');
    if (totalCodes === 0) {
      Logger.log('✅ All codes already correct!');
      return { success: true, totalCodes: 0 };
    }
    
    // ===== UPDATE SHEETS =====
    Logger.log('\n📝 Updating sheets...');
    
    // Update LichDay
    let updated1 = 0;
    for (let i = 3; i < calendarData.length; i++) {
      const oldCode = String(calendarData[i][0]).trim();
      if (codeMapping[oldCode]) {
        calendarSheet.getRange(i + 1, 1).setValue(codeMapping[oldCode]);
        updated1++;
      }
    }
    
    // UPDATE 2: DiemDanh
    const attendanceData = attendanceSheet.getDataRange().getValues();
    let updated2 = 0;
    for (let i = 3; i < attendanceData.length; i++) {
      const oldCode = String(attendanceData[i][0]).trim();
      if (codeMapping[oldCode]) {
        attendanceSheet.getRange(i + 1, 1).setValue(codeMapping[oldCode]);
        updated2++;
      }
    }
    
    // UPDATE 3: DiemDanhChiTiet
    let updated3 = 0;
    for (let i = 3; i < detailData.length; i++) {
      const oldCode = String(detailData[i][0]).trim();
      if (codeMapping[oldCode]) {
        detailSheet.getRange(i + 1, 1).setValue(codeMapping[oldCode]);
        updated3++;
      }
    }

    Logger.log('  ✓ LichDay: ' + updated1);
    Logger.log('  ✓ DiemDanh: ' + updated2);
    Logger.log('  ✓ DiemDanhChiTiet: ' + updated3);
    Logger.log('\n✅ COMPLETED! Total: ' + (updated1 + updated2 + updated3) + ' rows');
    Logger.log('========================================');

    return {
      success: true,
      totalCodes: totalCodes,
      updates: { calendar: updated1, attendance: updated2, detail: updated3 }
    };
    
  } catch (error) {
    Logger.log('❌ Error: ' + error.toString());
    throw error;
  }
}

/**
 * FIX WRONG FORMAT IN ATTENDANCE CODES
 * 
 * Vấn đề 1: Ngày 1/11/2025 bị tạo code với format "0111" (tháng 1, ngày 11)
 *          → Phải là "1101" (ngày 1, tháng 11)
 * 
 * Vấn đề 2: startTime/endTime bị Date object → "Sat Dec 30 1899 17:54:26 GMT+0706"
 *          → Phải là "1754" (HH:mm format)
 * 
 * Script này sẽ:
 * 1. Tìm các code bị sai format (date hoặc time)
 * 2. Tạo code mới đúng format: GC{group}{ddmmyyyy}{HHmm}{HHmm}
 * 3. Update tất cả sheets liên quan:
 *    - LichDay (calendar) - cả attendanceCode, startTime, endTime
 *    - DiemDanh (attendance summary)
 *    - DiemDanhChiTiet (attendance detail)
 * 
 * Cách dùng:
 * 1. Mở Apps Script Editor
 * 2. Chọn function "fixWrongDateFormatInCodes" từ dropdown
 * 3. Click Run
 */
function fixWrongDateFormatInCodes() {
  try {
    Logger.log('🔧 Starting fix wrong format in attendance codes...');
    Logger.log('========================================');
    
    // Sheets cần update
    const calendarSheet = getSheet(sheetName.calendar);
    const attendanceSheet = getSheet(sheetName.attendance);
    const detailSheet = getSheet(sheetName.attendanceDetail);
    
    if (!calendarSheet || !attendanceSheet || !detailSheet) {
      Logger.log('❌ Required sheets not found');
      return;
    }
    
    // Lấy dữ liệu từ LichDay
    const calendarData = calendarSheet.getDataRange().getValues();
    
    Logger.log('📊 Total calendar rows: ' + calendarData.length);
    
    // Map để theo dõi: oldCode -> newCode
    const codeMapping = {};
    const updatedRows = [];
    
    // Duyệt qua từng row trong LichDay (bỏ qua header)
    for (let i = 3; i < calendarData.length; i++) {
      const oldCode = String(calendarData[i][0]).trim(); // Column A
      const dateTimeStr = String(calendarData[i][1]).trim(); // Column B
      const group = String(calendarData[i][3]).trim(); // Column D
      let startTimeRaw = calendarData[i][6]; // Column G
      let endTimeRaw = calendarData[i][7]; // Column H
      
      if (!oldCode || !dateTimeStr) continue;
      
      // ✅ FIX TIME FORMAT: Convert Date object → HH:mm
      const startTime = formatTime(startTimeRaw);
      const endTime = formatTime(endTimeRaw);
      
      // Parse date từ dateTime (format: dd/mm/yyyy)
      const dateParts = dateTimeStr.split('/');
      if (dateParts.length !== 3) continue;
      
      const dayNum = parseInt(dateParts[0], 10); // 1-31 (no padding)
      const monthNum = parseInt(dateParts[1], 10); // 1-12
      const year = String(dateParts[2]); // yyyy
      const monthAbbr = getMonthAbbr(monthNum); // jan, feb, mar, ...
      
      // Tạo code mới ĐÚNG format: GC{group}{d}mmm{yyyy}{HHmm}{HHmm}
      // QUAN TRỌNG: Dùng tên tháng 3 chữ cái để tránh nhầm lẫn
      // Ví dụ: 01/11/2025 → 1nov2025, 11/01/2025 → 11jan2025
      const dateCode = dayNum + monthAbbr + year; // 1nov2025
      const timeCode = startTime.replace(/:/g, '') + endTime.replace(/:/g, ''); // 08001930
      const newCode = 'GC' + group + dateCode + timeCode;
      
      // Check xem có cần update không (code hoặc time khác)
      const needUpdate = oldCode !== newCode || 
                         String(startTimeRaw).trim() !== startTime || 
                         String(endTimeRaw).trim() !== endTime;
      
      if (needUpdate) {
        codeMapping[oldCode] = newCode;
        updatedRows.push({
          row: i + 1,
          oldCode: oldCode,
          newCode: newCode,
          date: dateTimeStr,
          group: group,
          startTime: startTime,
          endTime: endTime,
          oldStartTime: String(startTimeRaw),
          oldEndTime: String(endTimeRaw)
        });
        
        Logger.log('🔄 Row ' + (i+1) + ':');
        Logger.log('   Code: ' + oldCode + ' → ' + newCode);
        if (String(startTimeRaw).trim() !== startTime) {
          Logger.log('   Start: "' + String(startTimeRaw).substring(0, 50) + '..." → "' + startTime + '"');
        }
        if (String(endTimeRaw).trim() !== endTime) {
          Logger.log('   End: "' + String(endTimeRaw).substring(0, 50) + '..." → "' + endTime + '"');
        }
      }
    }
    
    Logger.log('');
    Logger.log('========================================');
    Logger.log('📋 SUMMARY:');
    Logger.log('Total rows need to be fixed: ' + Object.keys(codeMapping).length);
    Logger.log('========================================');
    
    if (Object.keys(codeMapping).length === 0) {
      Logger.log('✅ No codes need to be fixed!');
      return;
    }
    
    // UPDATE 1: LichDay (Calendar) - Update code, startTime, endTime
    Logger.log('');
    Logger.log('📝 Updating LichDay...');
    let calendarUpdates = 0;
    updatedRows.forEach(item => {
      // Update attendanceCode (Column A)
      calendarSheet.getRange(item.row, 1).setValue(item.newCode);
      
      // ✅ Update startTime (Column G) - fix Date object
      if (item.oldStartTime !== item.startTime) {
        calendarSheet.getRange(item.row, 7).setValue(item.startTime);
      }
      
      // ✅ Update endTime (Column H) - fix Date object
      if (item.oldEndTime !== item.endTime) {
        calendarSheet.getRange(item.row, 8).setValue(item.endTime);
      }
      
      // ✅ Update attendanceTime (Column I) - rebuild from fixed times
      const attendanceTime = item.startTime + ' - ' + item.endTime;
      calendarSheet.getRange(item.row, 9).setValue(attendanceTime);
      
      calendarUpdates++;
    });
    Logger.log('  ✅ Updated ' + calendarUpdates + ' rows in LichDay');
    Logger.log('     (Fixed attendanceCode + startTime + endTime + attendanceTime)');
    
    // UPDATE 2: DiemDanh (Attendance Summary)
    Logger.log('');
    Logger.log('📝 Updating DiemDanh...');
    const attendanceData = attendanceSheet.getDataRange().getValues();
    let attendanceUpdates = 0;
    
    for (let i = 3; i < attendanceData.length; i++) {
      const oldCode = String(attendanceData[i][0]).trim();
      if (codeMapping[oldCode]) {
        attendanceSheet.getRange(i + 1, 1).setValue(codeMapping[oldCode]);
        attendanceUpdates++;
        Logger.log('  🔄 Row ' + (i+1) + ': ' + oldCode + ' → ' + codeMapping[oldCode]);
      }
    }
    Logger.log('  ✅ Updated ' + attendanceUpdates + ' rows in DiemDanh');
    
    // UPDATE 3: DiemDanhChiTiet (Attendance Detail)
    Logger.log('');
    Logger.log('📝 Updating DiemDanhChiTiet...');
    const detailData = detailSheet.getDataRange().getValues();
    let detailUpdates = 0;
    
    for (let i = 3; i < detailData.length; i++) {
      const oldCode = String(detailData[i][0]).trim();
      if (codeMapping[oldCode]) {
        detailSheet.getRange(i + 1, 1).setValue(codeMapping[oldCode]);
        detailUpdates++;
      }
    }
    Logger.log('  ✅ Updated ' + detailUpdates + ' rows in DiemDanhChiTiet');
    
    // Final summary
    Logger.log('');
    Logger.log('========================================');
    Logger.log('✅ FIX COMPLETED!');
    Logger.log('========================================');
    Logger.log('Total codes fixed: ' + Object.keys(codeMapping).length);
    Logger.log('  - LichDay: ' + calendarUpdates + ' rows (code + time)');
    Logger.log('  - DiemDanh: ' + attendanceUpdates + ' rows');
    Logger.log('  - DiemDanhChiTiet: ' + detailUpdates + ' rows');
    Logger.log('========================================');
    
    return {
      success: true,
      totalCodes: Object.keys(codeMapping).length,
      updates: {
        calendar: calendarUpdates,
        attendance: attendanceUpdates,
        detail: detailUpdates
      },
      mapping: codeMapping
    };
    
  } catch (error) {
    Logger.log('❌ Error in fixWrongDateFormatInCodes: ' + error.toString());
    throw error;
  }
}

/**
 * DEBUG: Kiểm tra và báo cáo các attendanceCode bị trùng
 */
function debugDuplicateAttendanceCodes() {
  try {
    Logger.log('🔍 DEBUG: Checking for duplicate attendance codes');
    Logger.log('========================================');
    
    const calendarSheet = getSheet(sheetName.calendar);
    const calendarData = calendarSheet.getDataRange().getValues();
    
    // Map: code -> array of rows
    const codeMap = {};
    
    for (let i = 3; i < calendarData.length; i++) {
      const code = String(calendarData[i][0]).trim();
      if (!code) continue;
      
      if (!codeMap[code]) {
        codeMap[code] = [];
      }
      
      codeMap[code].push({
        row: i + 1,
        code: code,
        date: String(calendarData[i][1]).trim(),
        group: String(calendarData[i][3]).trim(),
        startTime: String(calendarData[i][6]).trim(),
        endTime: String(calendarData[i][7]).trim()
      });
    }
    
    // Find duplicates
    const duplicates = [];
    Object.keys(codeMap).forEach(code => {
      if (codeMap[code].length > 1) {
        duplicates.push({
          code: code,
          count: codeMap[code].length,
          instances: codeMap[code]
        });
      }
    });
    
    Logger.log('📊 Total unique codes: ' + Object.keys(codeMap).length);
    Logger.log('⚠️  Duplicate codes found: ' + duplicates.length);
    
    if (duplicates.length > 0) {
      Logger.log('');
      Logger.log('🔴 DUPLICATE CODES:');
      Logger.log('========================================');
      
      duplicates.forEach(dup => {
        Logger.log('');
        Logger.log('Code: ' + dup.code + ' (' + dup.count + ' instances)');
        dup.instances.forEach((inst, idx) => {
          Logger.log('  [' + (idx + 1) + '] Row ' + inst.row + ': ' + inst.date + ' | ' + inst.group + ' | ' + inst.startTime + '-' + inst.endTime);
        });
      });
    }
    
    Logger.log('');
    Logger.log('========================================');
    
    return {
      totalCodes: Object.keys(codeMap).length,
      duplicates: duplicates.length,
      duplicateDetails: duplicates
    };
    
  } catch (error) {
    Logger.log('❌ Error in debugDuplicateAttendanceCodes: ' + error.toString());
    throw error;
  }
}

/**
 * DEBUG: Xem raw data của 5 rows đầu tiên trong DiemDanhChiTiet
 */
function debugDiemDanhChiTietRawData() {
  try {
    Logger.log('🔍 DEBUG: Raw data in DiemDanhChiTiet');
    Logger.log('========================================');
    
    const detailSheet = getSheet(sheetName.attendanceDetail);
    const detailData = detailSheet.getDataRange().getValues();
    
    Logger.log('Total rows: ' + detailData.length);
    Logger.log('');
    Logger.log('First 10 data rows (starting from row 4):');
    Logger.log('─────────────────────────────────────');
    
    for (let i = 3; i < Math.min(13, detailData.length); i++) {
      const row = detailData[i];
      Logger.log('');
      Logger.log('Row ' + (i+1) + ':');
      Logger.log('  A (code): "' + row[0] + '" (type: ' + typeof row[0] + ')');
      Logger.log('  B (studentCode): "' + row[1] + '"');
      Logger.log('  C (studentName): "' + row[2] + '"');
      Logger.log('  D (date): "' + row[3] + '" (type: ' + typeof row[3] + ')');
      if (row[3] instanceof Date) {
        Logger.log('      → Date value: ' + row[3].getDate() + '/' + (row[3].getMonth() + 1) + '/' + row[3].getFullYear());
      }
      Logger.log('  E (group): "' + row[4] + '"');
    }
    
    Logger.log('');
    Logger.log('========================================');
    Logger.log('Now searching for 01/11/2025 specifically...');
    Logger.log('');
    
    let foundCount = 0;
    for (let i = 3; i < detailData.length; i++) {
      const dateRaw = detailData[i][3];
      let isMatch = false;
      
      if (dateRaw instanceof Date) {
        if (dateRaw.getDate() === 1 && dateRaw.getMonth() + 1 === 11 && dateRaw.getFullYear() === 2025) {
          isMatch = true;
        }
      } else if (typeof dateRaw === 'string') {
        const parts = dateRaw.trim().split('/');
        if (parts.length === 3) {
          const day = parseInt(parts[0], 10);
          const month = parseInt(parts[1], 10);
          const year = parseInt(parts[2], 10);
          if (day === 1 && month === 11 && year === 2025) {
            isMatch = true;
          }
        }
      }
      
      if (isMatch) {
        foundCount++;
        if (foundCount <= 5) {
          Logger.log('Found at row ' + (i+1) + ': code="' + detailData[i][0] + '", date=' + dateRaw);
        }
      }
    }
    
    Logger.log('');
    Logger.log('Total rows with date 01/11/2025: ' + foundCount);
    Logger.log('========================================');
    
    return foundCount;
    
  } catch (error) {
    Logger.log('❌ Error: ' + error.toString());
    throw error;
  }
}

/**
 * DEBUG: Kiểm tra dữ liệu ngày 01/11/2025 trong các sheets
 */
function debugNovember1Data() {
  try {
    Logger.log('🔍 DEBUG: Checking data for 01/11/2025');
    Logger.log('========================================');
    
    const detailSheet = getSheet(sheetName.attendanceDetail);
    const attendanceSheet = getSheet(sheetName.attendance);
    const calendarSheet = getSheet(sheetName.calendar);
    
    // Target date
    const targetDay = 1;
    const targetMonth = 11; // November
    const targetYear = 2025;
    
    // Check DiemDanhChiTiet
    Logger.log('');
    Logger.log('📋 DiemDanhChiTiet (Attendance Detail):');
    Logger.log('─────────────────────────────────────');
    const detailData = detailSheet.getDataRange().getValues();
    const detailCodesNov1 = new Set();
    
    Logger.log('🔍 Checking rows starting from index 3 (row 4)...');
    
    for (let i = 3; i < detailData.length; i++) {
      const code = String(detailData[i][0]).trim();
      const dateRaw = detailData[i][3]; // Column D (index 3)
      
      if (!code) continue;
      
      // Parse date - hỗ trợ nhiều format
      let matchDate = false;
      
      // Case 1: Date object
      if (dateRaw instanceof Date) {
        if (dateRaw.getDate() === targetDay && 
            dateRaw.getMonth() + 1 === targetMonth && 
            dateRaw.getFullYear() === targetYear) {
          matchDate = true;
        }
      }
      // Case 2: String (dd/mm/yyyy hoặc d/m/yyyy)
      else if (typeof dateRaw === 'string') {
        const dateStr = dateRaw.trim();
        const parts = dateStr.split('/');
        if (parts.length === 3) {
          const day = parseInt(parts[0], 10);
          const month = parseInt(parts[1], 10);
          const year = parseInt(parts[2], 10);
          if (day === targetDay && month === targetMonth && year === targetYear) {
            matchDate = true;
          }
        }
      }
      
      if (matchDate) {
        detailCodesNov1.add(code);
        // Debug: Log first 3 matches
        if (detailCodesNov1.size <= 3) {
          Logger.log('  Match at row ' + (i+1) + ': code=' + code + ', date=' + dateRaw);
        }
      }
    }
    
    Logger.log('Total unique codes: ' + detailCodesNov1.size);
    if (detailCodesNov1.size > 0) {
      const sampleCodes = Array.from(detailCodesNov1).slice(0, 5);
      Logger.log('Sample codes: ' + sampleCodes.join(', '));
      if (detailCodesNov1.size > 5) {
        Logger.log('  ... + ' + (detailCodesNov1.size - 5) + ' more');
      }
    }
    
    // Check DiemDanh
    Logger.log('');
    Logger.log('📊 DiemDanh (Attendance Summary):');
    Logger.log('─────────────────────────────────────');
    const attendanceData = attendanceSheet.getDataRange().getValues();
    const attendanceCodesNov1 = new Set();
    
    for (let i = 3; i < attendanceData.length; i++) {
      const code = String(attendanceData[i][0]).trim();
      const dateRaw = attendanceData[i][1]; // Column B (index 1)
      
      if (!code) continue;
      
      let matchDate = false;
      
      if (dateRaw instanceof Date) {
        if (dateRaw.getDate() === targetDay && 
            dateRaw.getMonth() + 1 === targetMonth && 
            dateRaw.getFullYear() === targetYear) {
          matchDate = true;
        }
      } else if (typeof dateRaw === 'string') {
        const dateStr = dateRaw.trim();
        const parts = dateStr.split('/');
        if (parts.length === 3) {
          const day = parseInt(parts[0], 10);
          const month = parseInt(parts[1], 10);
          const year = parseInt(parts[2], 10);
          if (day === targetDay && month === targetMonth && year === targetYear) {
            matchDate = true;
          }
        }
      }
      
      if (matchDate) {
        attendanceCodesNov1.add(code);
        if (attendanceCodesNov1.size <= 3) {
          Logger.log('  Match at row ' + (i+1) + ': code=' + code + ', date=' + dateRaw);
        }
      }
    }
    
    Logger.log('Total unique codes: ' + attendanceCodesNov1.size);
    if (attendanceCodesNov1.size > 0) {
      const sampleCodes = Array.from(attendanceCodesNov1).slice(0, 5);
      Logger.log('Sample codes: ' + sampleCodes.join(', '));
      if (attendanceCodesNov1.size > 5) {
        Logger.log('  ... + ' + (attendanceCodesNov1.size - 5) + ' more');
      }
    }
    
    // Check LichDay
    Logger.log('');
    Logger.log('📅 LichDay (Calendar):');
    Logger.log('─────────────────────────────────────');
    const calendarData = calendarSheet.getDataRange().getValues();
    const calendarCodesNov1 = new Set();
    
    for (let i = 3; i < calendarData.length; i++) {
      const code = String(calendarData[i][0]).trim();
      const dateRaw = calendarData[i][1]; // Column B (index 1)
      
      if (!code) continue;
      
      let matchDate = false;
      
      if (dateRaw instanceof Date) {
        if (dateRaw.getDate() === targetDay && 
            dateRaw.getMonth() + 1 === targetMonth && 
            dateRaw.getFullYear() === targetYear) {
          matchDate = true;
        }
      } else if (typeof dateRaw === 'string') {
        const dateStr = dateRaw.trim();
        const parts = dateStr.split('/');
        if (parts.length === 3) {
          const day = parseInt(parts[0], 10);
          const month = parseInt(parts[1], 10);
          const year = parseInt(parts[2], 10);
          if (day === targetDay && month === targetMonth && year === targetYear) {
            matchDate = true;
          }
        }
      }
      
      if (matchDate) {
        calendarCodesNov1.add(code);
        if (calendarCodesNov1.size <= 3) {
          Logger.log('  Match at row ' + (i+1) + ': code=' + code + ', date=' + dateRaw);
        }
      }
    }
    
    Logger.log('Total unique codes: ' + calendarCodesNov1.size);
    if (calendarCodesNov1.size > 0) {
      const sampleCodes = Array.from(calendarCodesNov1).slice(0, 5);
      Logger.log('Sample codes: ' + sampleCodes.join(', '));
      if (calendarCodesNov1.size > 5) {
        Logger.log('  ... + ' + (calendarCodesNov1.size - 5) + ' more');
      }
    }
    
    // Compare
    Logger.log('');
    Logger.log('🔍 COMPARISON:');
    Logger.log('========================================');
    Logger.log('DiemDanhChiTiet: ' + detailCodesNov1.size + ' codes');
    Logger.log('DiemDanh:        ' + attendanceCodesNov1.size + ' codes');
    Logger.log('LichDay:         ' + calendarCodesNov1.size + ' codes');
    
    // Find missing in DiemDanh
    const missingInDiemDanh = [];
    detailCodesNov1.forEach(code => {
      if (!attendanceCodesNov1.has(code)) {
        missingInDiemDanh.push(code);
      }
    });
    
    Logger.log('');
    Logger.log('⚠️  Missing in DiemDanh: ' + missingInDiemDanh.length + ' codes');
    if (missingInDiemDanh.length > 0) {
      Logger.log('Missing codes:');
      missingInDiemDanh.slice(0, 10).forEach(code => {
        Logger.log('  - ' + code);
      });
      if (missingInDiemDanh.length > 10) {
        Logger.log('  ... + ' + (missingInDiemDanh.length - 10) + ' more');
      }
    }
    
    // Check if codes exist in LichDay
    Logger.log('');
    Logger.log('🔍 Checking if missing codes exist in LichDay:');
    const foundInCalendar = [];
    const notFoundInCalendar = [];
    
    missingInDiemDanh.forEach(code => {
      if (calendarCodesNov1.has(code)) {
        foundInCalendar.push(code);
      } else {
        notFoundInCalendar.push(code);
      }
    });
    
    Logger.log('  ✅ Found in LichDay: ' + foundInCalendar.length);
    Logger.log('  ❌ NOT in LichDay: ' + notFoundInCalendar.length);
    
    if (notFoundInCalendar.length > 0) {
      Logger.log('');
      Logger.log('⚠️  Codes NOT in LichDay (orphaned):');
      notFoundInCalendar.slice(0, 5).forEach(code => {
        Logger.log('  - ' + code);
      });
    }
    
    Logger.log('');
    Logger.log('========================================');
    
    return {
      detail: detailCodesNov1.size,
      attendance: attendanceCodesNov1.size,
      calendar: calendarCodesNov1.size,
      missing: missingInDiemDanh.length,
      foundInCalendar: foundInCalendar.length,
      notFoundInCalendar: notFoundInCalendar.length
    };
    
  } catch (error) {
    Logger.log('❌ Error in debugNovember1Data: ' + error.toString());
    throw error;
  }
}

/**
 * FIX ALL ATTENDANCE ISSUES - Tổng hợp fix format + tạo missing records
 * 
 * Cách sử dụng:
 * 1. Mở Apps Script Editor
 * 2. Chọn function "fixAllAttendanceIssues" từ dropdown
 * 3. Click Run (▶)
 * 
 * Script sẽ:
 * BƯỚC 1: Fix attendance code từ dateTime column (đọc lại đúng ngày/tháng)
 * BƯỚC 2: Tìm và tạo missing records trong DiemDanh
 */
/**
 * FIX ALL ATTENDANCE ISSUES
 * Wrapper function - chạy cả 2 fixes cùng lúc:
 * 1. Fix attendance codes về format chuẩn
 * 2. Tạo missing records từ LichDay → DiemDanh
 */
function fixAllAttendanceIssues() {
  try {
    Logger.log('🔧 Fix All Attendance Issues');
    Logger.log('========================================\n');
    
    // STEP 0: Check orphaned records (optional diagnostic)
    Logger.log('📌 STEP 0: Check for orphaned records...');
    const orphanedResult = checkOrphanedAttendanceRecords();
    
    // STEP 1: Fix codes
    Logger.log('\n📌 STEP 1: Fix attendance codes...');
    const formatResult = fixAttendanceCodeFromDateTime();
    
    // STEP 2: Fix missing records
    Logger.log('\n📌 STEP 2: Create missing records...');
    const missingResult = fixMissingAttendanceRecords();
    
    // STEP 3: Sync status
    Logger.log('\n📌 STEP 3: Sync status from DiemDanh...');
    const statusResult = syncStatusFromAttendance();
    
    // Summary
    Logger.log('\n========================================');
    Logger.log('🎉 ALL FIXES COMPLETED!');
    Logger.log('  - Orphaned records: ' + (orphanedResult?.orphanedCount || 0) + ' (check only)');
    Logger.log('  - Codes fixed: ' + (formatResult?.totalCodes || 0));
    Logger.log('  - Records created: ' + (missingResult?.created || 0));
    Logger.log('  - Status synced: ' + (statusResult?.updated || 0));
    Logger.log('========================================');
    
    return {
      success: true,
      orphanedCheck: orphanedResult,
      formatFixes: formatResult,
      missingRecords: missingResult,
      statusSync: statusResult
    };
    
  } catch (error) {
    Logger.log('❌ Error: ' + error.toString());
    throw error;
  }
}

/**
 * SYNC STATUS FROM ATTENDANCE
 * Đọc từ DiemDanh hoặc DiemDanhChiTiet để cập nhật status vào LichDay
 * 
 * Logic:
 * - Nếu attendanceCode có trong DiemDanh hoặc DiemDanhChiTiet → status = 1 (đã điểm danh)
 * - Nếu không có → status = 0 (chưa điểm danh)
 */
function syncStatusFromAttendance() {
  try {
    Logger.log('🔄 Syncing status from DiemDanh/DiemDanhChiTiet to LichDay...');
    Logger.log('========================================');
    
    const calendarSheet = sheetData.getSheetByName('LichDay');
    const attendanceSheet = sheetData.getSheetByName('DiemDanh');
    const detailSheet = sheetData.getSheetByName('DiemDanhChiTiet');
    
    if (!calendarSheet || !attendanceSheet || !detailSheet) {
      Logger.log('❌ Required sheets not found');
      return { success: false, error: 'Missing sheets' };
    }
    
    // Đọc tất cả attendanceCodes từ DiemDanh và DiemDanhChiTiet
    const attendanceData = attendanceSheet.getDataRange().getValues();
    const detailData = detailSheet.getDataRange().getValues();
    
    // Tạo Set chứa tất cả codes đã điểm danh (unique)
    const attendedCodes = new Set();
    
    // Từ DiemDanh (bỏ qua header 3 rows)
    for (let i = 3; i < attendanceData.length; i++) {
      const code = String(attendanceData[i][0]).trim();
      if (code && code.startsWith('GC')) {
        attendedCodes.add(code);
      }
    }
    
    // Từ DiemDanhChiTiet (bỏ qua header 3 rows)
    for (let i = 3; i < detailData.length; i++) {
      const code = String(detailData[i][0]).trim();
      if (code && code.startsWith('GC')) {
        attendedCodes.add(code);
      }
    }
    
    Logger.log('📊 Found ' + attendedCodes.size + ' unique attended codes');
    
    // Đọc LichDay và update status
    const calendarData = calendarSheet.getDataRange().getValues();
    let updated = 0;
    let alreadyCorrect = 0;
    
    for (let i = 3; i < calendarData.length; i++) {
      const code = String(calendarData[i][0]).trim();
      if (!code || !code.startsWith('GC')) continue;
      
      const currentStatus = calendarData[i][10]; // Column K (index 10)
      const shouldBeAttended = attendedCodes.has(code);
      const correctStatus = shouldBeAttended ? 1 : 0;
      
      // Check nếu cần update
      if (currentStatus != correctStatus) {
        const rowNumber = i + 1;
        calendarSheet.getRange(rowNumber, 11).setValue(correctStatus);
        updated++;
        
        if (updated <= 10) {
          Logger.log('  Updated row ' + rowNumber + ': ' + code + ' → status = ' + correctStatus);
        }
      } else {
        alreadyCorrect++;
      }
    }
    
    Logger.log('\n✅ COMPLETED!');
    Logger.log('  - Updated: ' + updated + ' rows');
    Logger.log('  - Already correct: ' + alreadyCorrect + ' rows');
    Logger.log('  - Total processed: ' + (updated + alreadyCorrect) + ' rows');
    Logger.log('========================================');
    
    return {
      success: true,
      updated: updated,
      alreadyCorrect: alreadyCorrect,
      total: updated + alreadyCorrect
    };
    
  } catch (error) {
    Logger.log('❌ Error: ' + error.toString());
    throw error;
  }
}

/**
 * FIX TIME OFFSET IN LICHDAY - Sửa thời gian bị nhanh 18 phút
 * 
 * Vấn đề: Các bản ghi trong LichDay có startTime và endTime bị nhanh hơn 18 phút
 * Giải pháp: Trừ đi 18 phút cho TẤT CẢ các bản ghi
 * 
 * Cách sử dụng:
 * 1. Mở Apps Script Editor
 * 2. Chọn function "fixTimeOffsetInLichDay" từ dropdown
 * 3. Click Run (▶)
 * 4. Kiểm tra logs để xem số bản ghi đã fix
 */
function fixTimeOffsetInLichDay() {
  try {
    Logger.log('='.repeat(50));
    Logger.log('🔧 FIX TIME OFFSET IN LICHDAY - Bắt đầu...');
    Logger.log('='.repeat(50));
    
    const calendarSheet = getSheet(sheetName.calendar);
    if (!calendarSheet) {
      throw new Error('Sheet LichDay không tồn tại');
    }
    
    const data = calendarSheet.getDataRange().getDisplayValues();
    Logger.log('📊 Total rows: ' + data.length);
    
    let updatedCount = 0;
    let skippedCount = 0;
    const codeMapping = {}; // oldCode -> newCode
    
    // Bỏ qua 3 dòng đầu (title + headers)
    // Cấu trúc: A=attendanceCode, B=dateTime, C=location, D=group, E=teacher, 
    //           F=subTeacher, G=startTime, H=endTime, I=attendanceTime, J=note, K=status
    for (let i = 3; i < data.length; i++) {
      const rowNumber = i + 1;
      const oldCode = String(data[i][0]).trim();      // Column A
      const dateTimeStr = String(data[i][1]).trim();  // Column B
      const group = String(data[i][3]).trim();        // Column D
      const startTimeStr = String(data[i][6]).trim(); // Column G (index 6)
      const endTimeStr = String(data[i][7]).trim();   // Column H (index 7)
      
      if (!startTimeStr || !endTimeStr) {
        skippedCount++;
        continue;
      }
      
      // Parse HH:mm format
      const startMatch = startTimeStr.match(/^(\d{1,2}):(\d{2})$/);
      const endMatch = endTimeStr.match(/^(\d{1,2}):(\d{2})$/);
      
      if (!startMatch || !endMatch) {
        Logger.log(`⚠️ Row ${rowNumber}: Invalid time format - startTime="${startTimeStr}", endTime="${endTimeStr}"`);
        skippedCount++;
        continue;
      }
      
      // Trừ đi 18 phút
      const startHour = parseInt(startMatch[1], 10);
      const startMinute = parseInt(startMatch[2], 10);
      const endHour = parseInt(endMatch[1], 10);
      const endMinute = parseInt(endMatch[2], 10);
      
      // Tính toán thời gian mới (trừ 18 phút)
      let newStartMinute = startMinute - 18;
      let newStartHour = startHour;
      if (newStartMinute < 0) {
        newStartMinute += 60;
        newStartHour -= 1;
        if (newStartHour < 0) newStartHour += 24;
      }
      
      let newEndMinute = endMinute - 18;
      let newEndHour = endHour;
      if (newEndMinute < 0) {
        newEndMinute += 60;
        newEndHour -= 1;
        if (newEndHour < 0) newEndHour += 24;
      }
      
      // Format lại HH:mm
      const newStartTime = String(newStartHour).padStart(2, '0') + ':' + String(newStartMinute).padStart(2, '0');
      const newEndTime = String(newEndHour).padStart(2, '0') + ':' + String(newEndMinute).padStart(2, '0');
      const newAttendanceTime = newStartTime + ' - ' + newEndTime;
      
      // Tạo attendanceCode mới với time đã fix
      let newCode = oldCode;
      if (dateTimeStr && group) {
        const dateParts = dateTimeStr.split('/');
        if (dateParts.length === 3) {
          const dayNum = parseInt(dateParts[0], 10);
          const monthNum = parseInt(dateParts[1], 10);
          const year = String(dateParts[2]);
          const monthAbbr = getMonthAbbr(monthNum);
          const dateCode = dayNum + monthAbbr + year;
          const timeCode = newStartTime.replace(/:/g, '') + newEndTime.replace(/:/g, '');
          newCode = 'GC' + group + '-' + dateCode + '-' + timeCode;
          
          if (oldCode !== newCode) {
            codeMapping[oldCode] = newCode;
          }
        }
      }
      
      // Update vào sheet
      calendarSheet.getRange(rowNumber, 1).setValue(newCode);           // Column A
      calendarSheet.getRange(rowNumber, 7).setValue(newStartTime);      // Column G
      calendarSheet.getRange(rowNumber, 8).setValue(newEndTime);        // Column H
      calendarSheet.getRange(rowNumber, 9).setValue(newAttendanceTime); // Column I
      
      updatedCount++;
      
      if (updatedCount <= 5) {
        Logger.log(`✅ Row ${rowNumber}:`);
        Logger.log(`   Time: ${startTimeStr} → ${newStartTime}, ${endTimeStr} → ${newEndTime}`);
        if (oldCode !== newCode) {
          Logger.log(`   Code: ${oldCode} → ${newCode}`);
        }
      }
    }
    
    // Update attendanceCode trong DiemDanh và DiemDanhChiTiet
    const numCodesChanged = Object.keys(codeMapping).length;
    if (numCodesChanged > 0) {
      Logger.log('');
      Logger.log('📝 Updating attendanceCode in DiemDanh and DiemDanhChiTiet...');
      Logger.log('   Codes to update: ' + numCodesChanged);
      
      // Update DiemDanh
      const attendanceSheet = getSheet(sheetName.attendance);
      if (attendanceSheet) {
        const attendanceData = attendanceSheet.getDataRange().getDisplayValues();
        let attendanceUpdated = 0;
        for (let i = 3; i < attendanceData.length; i++) {
          const oldCode = String(attendanceData[i][0]).trim();
          if (codeMapping[oldCode]) {
            attendanceSheet.getRange(i + 1, 1).setValue(codeMapping[oldCode]);
            attendanceUpdated++;
          }
        }
        Logger.log('   ✅ DiemDanh: Updated ' + attendanceUpdated + ' codes');
      }
      
      // Update DiemDanhChiTiet
      const detailSheet = getSheet(sheetName.attendanceDetail);
      if (detailSheet) {
        const detailData = detailSheet.getDataRange().getDisplayValues();
        let detailUpdated = 0;
        for (let i = 3; i < detailData.length; i++) {
          const oldCode = String(detailData[i][0]).trim();
          if (codeMapping[oldCode]) {
            detailSheet.getRange(i + 1, 1).setValue(codeMapping[oldCode]);
            detailUpdated++;
          }
        }
        Logger.log('   ✅ DiemDanhChiTiet: Updated ' + detailUpdated + ' codes');
      }
    }
    
    Logger.log('');
    Logger.log('='.repeat(50));
    Logger.log('✅ HOÀN THÀNH!');
    Logger.log('  - Đã fix time: ' + updatedCount + ' rows');
    Logger.log('  - Đã fix code: ' + numCodesChanged + ' codes');
    Logger.log('  - Bỏ qua: ' + skippedCount + ' rows');
    Logger.log('='.repeat(50));
    
    return {
      success: true,
      updated: updatedCount,
      codesChanged: numCodesChanged,
      skipped: skippedCount,
      total: data.length - 3
    };
    
  } catch (error) {
    Logger.log('❌ Error: ' + error.toString());
    throw error;
  }
}

/**
 * DEBUG: Tìm một attendanceCode cụ thể trong các sheets
 * Dùng để debug khi một code có trong DiemDanhChiTiet nhưng không có trong DiemDanh
 */
function debugFindSpecificCode() {
  const targetCode = 'GCDance2-1nov2025-20302200'; // ← Thay đổi code cần tìm ở đây
  
  Logger.log('='.repeat(60));
  Logger.log('🔍 DEBUG: Finding code "' + targetCode + '"');
  Logger.log('='.repeat(60));
  
  // Declare variables at function scope
  let foundInDetail = false;
  let foundInAttendance = false;
  let foundInCalendar = false;
  
  // Check DiemDanhChiTiet
  const detailSheet = getSheet(sheetName.attendanceDetail);
  if (detailSheet) {
    const detailData = detailSheet.getDataRange().getDisplayValues();
    Logger.log('');
    Logger.log('📊 DiemDanhChiTiet (total rows: ' + detailData.length + ')');
    Logger.log('─'.repeat(60));
    
    for (let i = 0; i < detailData.length; i++) {
      const code = String(detailData[i][0]).trim();
      if (code === targetCode) {
        foundInDetail = true;
        Logger.log('  ✅ FOUND at row ' + (i + 1) + ' (index ' + i + ')');
        Logger.log('     attendanceCode: "' + detailData[i][0] + '"');
        Logger.log('     studentCode: "' + detailData[i][1] + '"');
        Logger.log('     studentName: "' + detailData[i][2] + '"');
        Logger.log('     date: "' + detailData[i][3] + '"');
        Logger.log('     group: "' + detailData[i][4] + '"');
      }
    }
    
    if (!foundInDetail) {
      Logger.log('  ❌ NOT FOUND in DiemDanhChiTiet');
    }
  }
  
  // Check DiemDanh
  const attendanceSheet = getSheet(sheetName.attendance);
  if (attendanceSheet) {
    const attendanceData = attendanceSheet.getDataRange().getDisplayValues();
    Logger.log('');
    Logger.log('📋 DiemDanh (total rows: ' + attendanceData.length + ')');
    Logger.log('─'.repeat(60));
    
    for (let i = 0; i < attendanceData.length; i++) {
      const code = String(attendanceData[i][0]).trim();
      if (code === targetCode) {
        foundInAttendance = true;
        Logger.log('  ✅ FOUND at row ' + (i + 1) + ' (index ' + i + ')');
        Logger.log('     attendanceCode: "' + attendanceData[i][0] + '"');
        Logger.log('     dateTime: "' + attendanceData[i][1] + '"');
        Logger.log('     group: "' + attendanceData[i][2] + '"');
        Logger.log('     teacher: "' + attendanceData[i][3] + '"');
      }
    }
    
    if (!foundInAttendance) {
      Logger.log('  ❌ NOT FOUND in DiemDanh');
    }
  }
  
  // Check LichDay
  const calendarSheet = getSheet(sheetName.calendar);
  if (calendarSheet) {
    const calendarData = calendarSheet.getDataRange().getDisplayValues();
    Logger.log('');
    Logger.log('📅 LichDay (total rows: ' + calendarData.length + ')');
    Logger.log('─'.repeat(60));
    
    for (let i = 0; i < calendarData.length; i++) {
      const code = String(calendarData[i][0]).trim();
      if (code === targetCode) {
        foundInCalendar = true;
        Logger.log('  ✅ FOUND at row ' + (i + 1) + ' (index ' + i + ')');
        Logger.log('     attendanceCode: "' + calendarData[i][0] + '"');
        Logger.log('     dateTime: "' + calendarData[i][1] + '"');
        Logger.log('     location: "' + calendarData[i][2] + '"');
        Logger.log('     group: "' + calendarData[i][3] + '"');
        Logger.log('     teacher: "' + calendarData[i][4] + '"');
        Logger.log('     startTime: "' + calendarData[i][6] + '"');
        Logger.log('     endTime: "' + calendarData[i][7] + '"');
      }
    }
    
    if (!foundInCalendar) {
      Logger.log('  ❌ NOT FOUND in LichDay');
    }
  }
  
  Logger.log('');
  Logger.log('='.repeat(60));
  Logger.log('💡 SUMMARY:');
  Logger.log('   DiemDanhChiTiet: ' + (foundInDetail ? '✅ Found' : '❌ Not found'));
  Logger.log('   DiemDanh: ' + (foundInAttendance ? '✅ Found' : '❌ Not found'));
  Logger.log('   LichDay: ' + (foundInCalendar ? '✅ Found' : '❌ Not found'));
  Logger.log('='.repeat(60));
}

/**
 * CHECK ORPHANED ATTENDANCE RECORDS
 * Kiểm tra các record trong DiemDanh KHÔNG có trong DiemDanhChiTiet
 * (Không nên xảy ra nếu logic đúng, nhưng kiểm tra để chắc chắn)
 * 
 * Cách sử dụng:
 * 1. Mở Apps Script Editor
 * 2. Chọn function "checkOrphanedAttendanceRecords" từ dropdown
 * 3. Click Run (▶)
 * 
 * Script sẽ:
 * - Tìm các attendanceCode trong DiemDanh
 * - Check xem code nào KHÔNG có trong DiemDanhChiTiet
 * - Log cảnh báo (không tự động xóa)
 */
function checkOrphanedAttendanceRecords() {
  try {
    Logger.log('='.repeat(50));
    Logger.log('🔍 CHECK ORPHANED ATTENDANCE RECORDS');
    Logger.log('='.repeat(50));
    
    const detailSheet = getSheet(sheetName.attendanceDetail);
    const attendanceSheet = getSheet(sheetName.attendance);
    
    if (!detailSheet || !attendanceSheet) {
      throw new Error('Required sheets not found');
    }
    
    // Get all data
    const detailData = detailSheet.getDataRange().getDisplayValues();
    const attendanceData = attendanceSheet.getDataRange().getDisplayValues();
    
    // Extract codes from DiemDanhChiTiet (rows 4+)
    const detailCodes = new Set();
    for (let i = 3; i < detailData.length; i++) {
      const code = String(detailData[i][0]).trim();
      if (code && code.startsWith('GC')) {
        detailCodes.add(code);
      }
    }
    
    Logger.log('📊 DiemDanhChiTiet has ' + detailCodes.size + ' unique attendance codes');
    
    // Extract codes from DiemDanh (rows 4+)
    const attendanceCodes = new Set();
    const orphanedRecords = [];
    
    for (let i = 3; i < attendanceData.length; i++) {
      const code = String(attendanceData[i][0]).trim();
      const dateTime = String(attendanceData[i][1]).trim();
      const group = String(attendanceData[i][2]).trim();
      
      if (code && code.startsWith('GC')) {
        attendanceCodes.add(code);
        
        // Check if this code exists in DiemDanhChiTiet
        if (!detailCodes.has(code)) {
          orphanedRecords.push({
            row: i + 1,
            code: code,
            dateTime: dateTime,
            group: group
          });
        }
      }
    }
    
    Logger.log('📋 DiemDanh has ' + attendanceCodes.size + ' attendance codes');
    Logger.log('');
    
    if (orphanedRecords.length === 0) {
      Logger.log('✅ PERFECT! Tất cả records trong DiemDanh đều có trong DiemDanhChiTiet');
      return {
        success: true,
        orphanedCount: 0,
        message: 'No orphaned records found'
      };
    }
    
    Logger.log('⚠️  WARNING: Found ' + orphanedRecords.length + ' orphaned records!');
    Logger.log('    (Có trong DiemDanh nhưng KHÔNG có trong DiemDanhChiTiet)');
    Logger.log('');
    Logger.log('📋 Danh sách:');
    Logger.log('─'.repeat(50));
    
    orphanedRecords.forEach((record, index) => {
      if (index < 20) { // Chỉ log 20 records đầu
        Logger.log(`   Row ${record.row}: ${record.code}`);
        Logger.log(`      Date: ${record.dateTime}, Group: ${record.group}`);
      }
    });
    
    if (orphanedRecords.length > 20) {
      Logger.log(`   ... và ${orphanedRecords.length - 20} records khác`);
    }
    
    Logger.log('');
    Logger.log('💡 GỢI Ý:');
    Logger.log('   - Kiểm tra xem có phải do xóa nhầm dữ liệu trong DiemDanhChiTiet?');
    Logger.log('   - Hoặc do điểm danh nhưng không có học viên nào (0 người)?');
    Logger.log('   - Có thể xóa các records này khỏi DiemDanh nếu không cần thiết');
    Logger.log('='.repeat(50));
    
    return {
      success: true,
      orphanedCount: orphanedRecords.length,
      orphanedRecords: orphanedRecords,
      message: 'Found orphaned records - check logs for details'
    };
    
  } catch (error) {
    Logger.log('❌ Error: ' + error.toString());
    throw error;
  }
}

/**
 * FIX MISSING ATTENDANCE - Tìm và tạo record DiemDanh cho các attendance bị thiếu
 * 
 * LƯU Ý: Script này GIẢ ĐỊNH rằng attendanceCode đã được fix format đúng
 * Nếu chưa fix format, chạy fixWrongDateFormatInCodes() trước
 * Hoặc chạy fixAllAttendanceIssues() để tự động fix cả 2
 * 
 * Cách sử dụng:
 * 1. Mở Apps Script Editor
 * 2. Chọn function "fixMissingAttendanceRecords" từ dropdown
 * 3. Click Run (▶)
 * 4. Check logs (View → Execution log)
 * 
 * Script sẽ:
 * - Tìm tất cả attendanceCode trong DiemDanhChiTiet
 * - Check xem code nào chưa có trong DiemDanh
 * - Tạo record mới với VLOOKUP formulas tự động lấy data từ LichDay
 */
function fixMissingAttendanceRecords() {
  try {
    Logger.log('🔧 Starting fix missing attendance records...');
    
    const detailSheet = getSheet(sheetName.attendanceDetail);
    const attendanceSheet = getSheet(sheetName.attendance);
    
    if (!detailSheet || !attendanceSheet) {
      Logger.log('❌ Required sheets not found');
      return;
    }
    
    // Get all data - ✅ SỬ DỤNG getDisplayValues() để tránh lỗi Date object
    const detailData = detailSheet.getDataRange().getDisplayValues();
    const attendanceData = attendanceSheet.getDataRange().getDisplayValues();
    
    // Column indexes (hard-coded based on sheet structure)
    // DiemDanhChiTiet: A=attendanceCode(0), D=date(3)
    // DiemDanh: A=attendanceCode(0), B=dateTime(1)
    const detailCodeCol = 0;  // Column A
    const detailDateCol = 3;  // Column D
    const attendanceCodeCol = 0;  // Column A
    const attendanceDateCol = 1;  // Column B
    
    Logger.log('📍 Using columns: DiemDanhChiTiet [A, D], DiemDanh [A, B]');
    
    // 🔍 DEBUG: Check actual row structure
    Logger.log('');
    Logger.log('🔍 DEBUG: Sheet Structure');
    Logger.log('─'.repeat(50));
    Logger.log('DiemDanhChiTiet rows: ' + detailData.length);
    Logger.log('  Row 1 (index 0): "' + detailData[0][0] + '"');
    Logger.log('  Row 2 (index 1): "' + detailData[1][0] + '"');
    Logger.log('  Row 3 (index 2): "' + detailData[2][0] + '"');
    Logger.log('  Row 4 (index 3): "' + detailData[3][0] + '"');
    
    Logger.log('');
    Logger.log('DiemDanh rows: ' + attendanceData.length);
    Logger.log('  Row 1 (index 0): "' + attendanceData[0][0] + '"');
    Logger.log('  Row 2 (index 1): "' + attendanceData[1][0] + '"');
    Logger.log('  Row 3 (index 2): "' + attendanceData[2][0] + '"');
    Logger.log('  Row 4 (index 3): "' + attendanceData[3][0] + '"');
    Logger.log('─'.repeat(50));
    Logger.log('');
    
    // Extract unique attendanceCodes from DiemDanhChiTiet
    // Row 1-2 (index 0-1): Title/Metadata
    // Row 3 (index 2): Headers (attendanceCode, studentCode, ...)
    // Row 4+ (index 3+): Actual data starts here
    const detailCodes = new Set();
    const detailCodesWithDates = {}; // Map: code -> dateTime for debugging
    let detailSkipped = 0;
    
    for (let i = 3; i < detailData.length; i++) {
      const code = String(detailData[i][detailCodeCol]).trim();
      const date = detailData[i][detailDateCol] ? String(detailData[i][detailDateCol]).trim() : '';
      
      // ✅ VALIDATE: Chỉ thêm nếu code bắt đầu bằng 'GC'
      if (code && code.startsWith('GC')) {
        detailCodes.add(code);
        if (date && !detailCodesWithDates[code]) {
          detailCodesWithDates[code] = date;
        }
      } else if (code) {
        detailSkipped++;
      }
    }
    
    if (detailSkipped > 0) {
      Logger.log('⚠️  Skipped ' + detailSkipped + ' invalid codes in DiemDanhChiTiet');
    }
    
    Logger.log('📊 Found ' + detailCodes.size + ' unique attendance codes in DiemDanhChiTiet');
    
    // 🔍 DEBUG: Sample first 3 codes from DiemDanhChiTiet
    const detailSample = Array.from(detailCodes).slice(0, 3);
    if (detailSample.length > 0) {
      Logger.log('📋 Sample codes from DiemDanhChiTiet: ' + detailSample.join(', '));
      detailSample.forEach(code => {
        if (detailCodesWithDates[code]) {
          Logger.log('    ' + code + ' -> date: "' + detailCodesWithDates[code] + '"');
        }
      });
    }
    
    // Extract existing attendanceCodes from DiemDanh
    // Row 1-2 (index 0-1): Title/Metadata
    // Row 3 (index 2): Headers
    // Row 4+ (index 3+): Actual data starts here
    const existingCodes = new Set();
    const existingCodesWithDates = {}; // Map: code -> dateTime for debugging
    let existingSkipped = 0;
    
    for (let i = 3; i < attendanceData.length; i++) {
      const code = String(attendanceData[i][attendanceCodeCol]).trim();
      const date = attendanceData[i][attendanceDateCol] ? String(attendanceData[i][attendanceDateCol]).trim() : '';
      
      // ✅ VALIDATE: Chỉ thêm nếu code bắt đầu bằng 'GC'
      if (code && code.startsWith('GC')) {
        existingCodes.add(code);
        if (date && !existingCodesWithDates[code]) {
          existingCodesWithDates[code] = date;
        }
      } else if (code) {
        existingSkipped++;
      }
    }
    
    if (existingSkipped > 0) {
      Logger.log('⚠️  Skipped ' + existingSkipped + ' invalid codes in DiemDanh');
    }
    
    Logger.log('📊 Found ' + existingCodes.size + ' existing records in DiemDanh');
    
    // 🔍 DEBUG: Sample first 3 codes from DiemDanh
    const existingSample = Array.from(existingCodes).slice(0, 3);
    if (existingSample.length > 0) {
      Logger.log('📋 Sample codes from DiemDanh: ' + existingSample.join(', '));
      existingSample.forEach(code => {
        if (existingCodesWithDates[code]) {
          Logger.log('    ' + code + ' -> dateTime: "' + existingCodesWithDates[code] + '"');
        }
      });
    }
    
    // Find missing codes
    const missingCodes = [];
    detailCodes.forEach(code => {
      if (!existingCodes.has(code)) {
        missingCodes.push(code);
      }
    });
    
    Logger.log('🔍 Found ' + missingCodes.length + ' missing attendance records');
    
    // 🔍 DEBUG: Log first 10 missing codes
    if (missingCodes.length > 0) {
      Logger.log('📋 Missing codes (first 10):');
      missingCodes.slice(0, 10).forEach(code => {
        const date = detailCodesWithDates[code] || 'unknown';
        Logger.log('   - ' + code + ' (date: ' + date + ')');
      });
      if (missingCodes.length > 10) {
        Logger.log('   ... and ' + (missingCodes.length - 10) + ' more');
      }
    }
    
    // 🔍 DEBUG: Check specific dates 01/11/2025 - 04/11/2025
    Logger.log('');
    Logger.log('========================================');
    Logger.log('🔍 DEBUG: Chi tiết theo ngày (01/11 - 04/11/2025)');
    Logger.log('========================================');
    
    const targetDates = ['01/11/2025', '02/11/2025', '03/11/2025', '04/11/2025'];
    
    targetDates.forEach(targetDate => {
      Logger.log('');
      Logger.log('📅 NGÀY: ' + targetDate);
      Logger.log('─────────────────────────────────────');
      
      // Find codes in DiemDanhChiTiet with this date
      const detailCodesForDate = [];
      Object.keys(detailCodesWithDates).forEach(code => {
        const normalizedDetailDate = normalizeDate(detailCodesWithDates[code]);
        const normalizedTargetDate = normalizeDate(targetDate);
        if (normalizedDetailDate === normalizedTargetDate) {
          detailCodesForDate.push(code);
        }
      });
      
      // Find codes in DiemDanh with this date
      const existingCodesForDate = [];
      Object.keys(existingCodesWithDates).forEach(code => {
        const normalizedExistingDate = normalizeDate(existingCodesWithDates[code]);
        const normalizedTargetDate = normalizeDate(targetDate);
        if (normalizedExistingDate === normalizedTargetDate) {
          existingCodesForDate.push(code);
        }
      });
      
      Logger.log('📊 DiemDanhChiTiet: ' + detailCodesForDate.length + ' codes');
      if (detailCodesForDate.length > 0 && detailCodesForDate.length <= 10) {
        Logger.log('   └─ ' + detailCodesForDate.join(', '));
      } else if (detailCodesForDate.length > 10) {
        Logger.log('   └─ ' + detailCodesForDate.slice(0, 5).join(', ') + ' ... (+ ' + (detailCodesForDate.length - 5) + ' more)');
      }
      
      Logger.log('📋 DiemDanh: ' + existingCodesForDate.length + ' codes');
      if (existingCodesForDate.length > 0 && existingCodesForDate.length <= 10) {
        Logger.log('   └─ ' + existingCodesForDate.join(', '));
      } else if (existingCodesForDate.length > 10) {
        Logger.log('   └─ ' + existingCodesForDate.slice(0, 5).join(', ') + ' ... (+ ' + (existingCodesForDate.length - 5) + ' more)');
      }
      
      // Find missing codes for this date
      const missingForDate = detailCodesForDate.filter(code => !existingCodes.has(code));
      if (missingForDate.length > 0) {
        Logger.log('⚠️  BỊ THIẾU: ' + missingForDate.length + ' codes');
        if (missingForDate.length <= 10) {
          Logger.log('   └─ ' + missingForDate.join(', '));
        } else {
          Logger.log('   └─ ' + missingForDate.slice(0, 5).join(', ') + ' ... (+ ' + (missingForDate.length - 5) + ' more)');
        }
      } else {
        Logger.log('✅ Đầy đủ - Không thiếu');
      }
    });
    
    Logger.log('');
    Logger.log('========================================');
    
    if (missingCodes.length === 0) {
      Logger.log('✅ No missing records! All attendance codes are already in DiemDanh');
      return;
    }
    
    // Log missing codes
    Logger.log('📋 Missing codes: ' + missingCodes.join(', '));
    
    // Create records for missing codes
    let successCount = 0;
    missingCodes.forEach(code => {
      try {
        // Add row with attendanceCode
        const rowData = [code, '', '', '', ''];
        attendanceSheet.appendRow(rowData);
        const newRow = attendanceSheet.getLastRow();
        
        // Apply formulas to auto-populate data from LichDay
        const formulaDateTime = `=IFERROR(TEXT(VLOOKUP(A${newRow}, ${sheetName.calendar}!A:B, 2, FALSE), "dd/mm/yyyy"), "")`;
        const formulaGroup = `=IFERROR(VLOOKUP(A${newRow}, ${sheetName.calendar}!A:D, 4, FALSE), "")`;
        const formulaTeacher = `=IFERROR(VLOOKUP(A${newRow}, ${sheetName.calendar}!A:E, 5, FALSE), "")`;
        const formulaSubTeacher = `=IFERROR(VLOOKUP(A${newRow}, ${sheetName.calendar}!A:F, 6, FALSE), "")`;
        const formulaTotalMain = `=IF(A${newRow} <> "", COUNTIFS(DiemDanhChiTiet!A:A, A${newRow}, DiemDanhChiTiet!E:E, C${newRow}), 0)`;
        const formulaTotalSub = `=IF(A${newRow} <> "", COUNTIFS(DiemDanhChiTiet!A:A, A${newRow}, DiemDanhChiTiet!E:E, "<>"&C${newRow}), 0)`;
        const formulaTotal = `=SUM(G${newRow}:H${newRow})`;
        const formulaSalary = `=IF(F${newRow} = 0, 0, IF(F${newRow} <= 12, 150000, IF(F${newRow} <= 14, 170000, 200000)))+IF(K${newRow} = "Gang Thép", 20000, 0)`;
        const formulaSubSalary = `=IF(E${newRow} <> "", 50000, 0)`;
        const formulaLocation = `=XLOOKUP(TRIM(C${newRow}), LopHoc!$B$4:$B$100, LopHoc!$A$4:$A$100, "Không tìm thấy")`;
        
        // Apply all formulas
        attendanceSheet.getRange(`B${newRow}`).setFormula(formulaDateTime);
        attendanceSheet.getRange(`C${newRow}`).setFormula(formulaGroup);
        attendanceSheet.getRange(`D${newRow}`).setFormula(formulaTeacher);
        attendanceSheet.getRange(`E${newRow}`).setFormula(formulaSubTeacher);
        attendanceSheet.getRange(`F${newRow}`).setFormula(formulaTotal);
        attendanceSheet.getRange(`G${newRow}`).setFormula(formulaTotalMain);
        attendanceSheet.getRange(`H${newRow}`).setFormula(formulaTotalSub);
        attendanceSheet.getRange(`I${newRow}`).setFormula(formulaSalary);
        attendanceSheet.getRange(`J${newRow}`).setFormula(formulaSubSalary);
        attendanceSheet.getRange(`K${newRow}`).setFormula(formulaLocation);
        
        // ✅ ÉP FORMAT PLAIN TEXT cho cột dateTime để tránh Google Sheets tự động convert
        attendanceSheet.getRange(`B${newRow}`).setNumberFormat('@');
        
        successCount++;
        Logger.log('  ✅ Created record for: ' + code + ' (row ' + newRow + ')');
      } catch (error) {
        Logger.log('  ❌ Failed to create record for ' + code + ': ' + error.toString());
      }
    });
    
    Logger.log('');
    Logger.log('========================================');
    Logger.log('✅ FIX COMPLETED!');
    Logger.log('========================================');
    Logger.log('Total missing records: ' + missingCodes.length);
    Logger.log('Successfully created: ' + successCount);
    Logger.log('Failed: ' + (missingCodes.length - successCount));
    Logger.log('========================================');
    
    return {
      success: true,
      total: missingCodes.length,
      created: successCount,
      failed: missingCodes.length - successCount,
      missingCodes: missingCodes
    };
    
  } catch (error) {
    Logger.log('❌ Error in fixMissingAttendanceRecords: ' + error.toString());
    throw error;
  }
}

// ============================================
// CHECK ATTENDANCE DUPLICATES
// Kiểm tra và báo cáo các bản ghi điểm danh bị trùng lặp
// ============================================

/**
 * Kiểm tra điểm danh bị trùng lặp
 * Đảm bảo: 1 mã học viên (studentCode) ứng với 1 mã điểm danh (attendanceCode)
 * Không có trường hợp 1 mã điểm danh có 2 mã học viên trùng nhau
 * 
 * @param {string} paramString - JSON string với options: { autoFix: boolean, attendanceCode?: string }
 * @returns {Object} - Kết quả kiểm tra với danh sách duplicates
 */
function checkAttendanceDuplicates(paramString) {
  try {
    const param = paramString ? safeJSONParse(paramString) : {};
    const autoFix = param.autoFix || false;
    const filterCode = param.attendanceCode || null;
    
    Logger.log('========================================');
    Logger.log('🔍 KIỂM TRA ĐIỂM DANH TRÙNG LẶP');
    Logger.log('========================================');
    Logger.log('AutoFix: ' + autoFix);
    if (filterCode) Logger.log('Filter by attendanceCode: ' + filterCode);
    Logger.log('');
    
    const sheet = getSheet(sheetName.attendanceDetail);
    if (!sheet) {
      throw new Error('Sheet DiemDanhChiTiet không tồn tại');
    }
    
    const data = sheet.getDataRange().getValues();
    Logger.log('📊 Total rows: ' + data.length);
    
    // Map để theo dõi: attendanceCode -> { studentCode -> [rowIndices] }
    const attendanceMap = new Map();
    
    // Map để theo dõi: studentCode + date -> [attendanceCode, rowIndex]
    const studentDateMap = new Map();
    
    // Bỏ qua 2 dòng header (row 1: title, row 2: headers)
    for (let i = 2; i < data.length; i++) {
      const attendanceCode = String(data[i][0]).trim();
      const studentCode = String(data[i][1]).trim();
      const date = String(data[i][3]).trim();
      const rowNumber = i + 1;
      
      // Skip empty rows
      if (!attendanceCode || !studentCode) continue;
      
      // Filter by attendanceCode if specified
      if (filterCode && attendanceCode !== filterCode) continue;
      
      // --- Check 1: Một attendanceCode có nhiều studentCode trùng nhau ---
      if (!attendanceMap.has(attendanceCode)) {
        attendanceMap.set(attendanceCode, new Map());
      }
      const studentMap = attendanceMap.get(attendanceCode);
      
      if (!studentMap.has(studentCode)) {
        studentMap.set(studentCode, []);
      }
      studentMap.get(studentCode).push(rowNumber);
      
      // --- Check 2: Một studentCode + date có nhiều attendanceCode khác nhau ---
      const studentDateKey = studentCode + '_' + date;
      if (!studentDateMap.has(studentDateKey)) {
        studentDateMap.set(studentDateKey, []);
      }
      studentDateMap.get(studentDateKey).push({
        attendanceCode: attendanceCode,
        rowNumber: rowNumber
      });
    }
    
    // Phân tích kết quả
    const duplicatesType1 = []; // Một attendanceCode có nhiều studentCode trùng
    const duplicatesType2 = []; // Một studentCode + date có nhiều attendanceCode
    const rowsToDelete = []; // Rows to delete if autoFix
    
    // --- Analyze Type 1: Duplicate studentCode in same attendanceCode ---
    Logger.log('');
    Logger.log('📋 CHECK TYPE 1: Một mã điểm danh có học viên trùng lặp');
    Logger.log('------------------------------------------------');
    
    attendanceMap.forEach((studentMap, attendanceCode) => {
      studentMap.forEach((rowNumbers, studentCode) => {
        if (rowNumbers.length > 1) {
          const duplicate = {
            type: 'DUPLICATE_STUDENT_IN_ATTENDANCE',
            attendanceCode: attendanceCode,
            studentCode: studentCode,
            count: rowNumbers.length,
            rowNumbers: rowNumbers
          };
          duplicatesType1.push(duplicate);
          Logger.log('  ⚠️ AttendanceCode: ' + attendanceCode);
          Logger.log('     StudentCode: ' + studentCode + ' xuất hiện ' + rowNumbers.length + ' lần');
          Logger.log('     Rows: ' + rowNumbers.join(', '));
          
          // Mark duplicate rows for deletion (keep first, delete rest)
          if (autoFix) {
            for (let j = 1; j < rowNumbers.length; j++) {
              rowsToDelete.push(rowNumbers[j]);
            }
          }
        }
      });
    });
    
    if (duplicatesType1.length === 0) {
      Logger.log('  ✅ Không có học viên trùng lặp trong cùng mã điểm danh');
    }
    
    // --- Analyze Type 2: Same student + date with multiple attendanceCodes ---
    Logger.log('');
    Logger.log('📋 CHECK TYPE 2: Một học viên có nhiều mã điểm danh cùng ngày');
    Logger.log('------------------------------------------------');
    
    studentDateMap.forEach((attendances, studentDateKey) => {
      // Get unique attendanceCodes
      const uniqueCodes = [...new Set(attendances.map(a => a.attendanceCode))];
      
      if (uniqueCodes.length > 1) {
        const [studentCode, date] = studentDateKey.split('_');
        const duplicate = {
          type: 'MULTIPLE_ATTENDANCE_SAME_STUDENT_DATE',
          studentCode: studentCode,
          date: date,
          attendanceCodes: uniqueCodes,
          count: uniqueCodes.length,
          rows: attendances
        };
        duplicatesType2.push(duplicate);
        Logger.log('  ⚠️ StudentCode: ' + studentCode + ' (ngày ' + date + ')');
        Logger.log('     Có ' + uniqueCodes.length + ' mã điểm danh khác nhau: ' + uniqueCodes.join(', '));
      }
    });
    
    if (duplicatesType2.length === 0) {
      Logger.log('  ✅ Không có học viên điểm danh nhiều lần cùng ngày với mã khác nhau');
    }
    
    // Auto Fix if enabled
    let deletedCount = 0;
    if (autoFix && rowsToDelete.length > 0) {
      Logger.log('');
      Logger.log('🔧 AUTO FIX: Xóa ' + rowsToDelete.length + ' bản ghi trùng lặp...');
      
      // Sort descending để xóa từ cuối lên
      rowsToDelete.sort((a, b) => b - a);
      
      rowsToDelete.forEach(rowNumber => {
        try {
          sheet.deleteRow(rowNumber);
          deletedCount++;
          Logger.log('  ✅ Deleted row ' + rowNumber);
        } catch (e) {
          Logger.log('  ❌ Failed to delete row ' + rowNumber + ': ' + e.toString());
        }
      });
      
      Logger.log('✅ Đã xóa ' + deletedCount + '/' + rowsToDelete.length + ' bản ghi trùng lặp');
    }
    
    // Summary
    Logger.log('');
    Logger.log('========================================');
    Logger.log('📊 KẾT QUẢ KIỂM TRA');
    Logger.log('========================================');
    Logger.log('Type 1 - Học viên trùng trong cùng mã điểm danh: ' + duplicatesType1.length + ' trường hợp');
    Logger.log('Type 2 - Học viên có nhiều mã điểm danh cùng ngày: ' + duplicatesType2.length + ' trường hợp');
    if (autoFix) {
      Logger.log('Đã xóa bản ghi trùng: ' + deletedCount);
    }
    Logger.log('========================================');
    
    return {
      success: true,
      summary: {
        duplicateStudentInAttendance: duplicatesType1.length,
        multipleAttendanceSameStudentDate: duplicatesType2.length,
        totalDuplicates: duplicatesType1.length + duplicatesType2.length,
        autoFixEnabled: autoFix,
        rowsDeleted: deletedCount
      },
      duplicatesType1: duplicatesType1,
      duplicatesType2: duplicatesType2,
      message: duplicatesType1.length + duplicatesType2.length === 0 
        ? 'Không có điểm danh trùng lặp' 
        : 'Phát hiện ' + (duplicatesType1.length + duplicatesType2.length) + ' trường hợp trùng lặp'
    };
    
  } catch (error) {
    Logger.log('❌ Error in checkAttendanceDuplicates: ' + error.toString());
    throw error;
  }
}

/**
 * FIX TYPE 1: Xóa học viên trùng lặp trong cùng một mã điểm danh
 * Giữ lại bản ghi đầu tiên, xóa các bản ghi còn lại
 * 
 * @param {string} paramString - JSON string với options: { dryRun: boolean, attendanceCode?: string }
 *   - dryRun: true = chỉ báo cáo, không xóa; false = xóa thật
 *   - attendanceCode: chỉ fix cho mã điểm danh cụ thể (optional)
 * @returns {Object} - Kết quả fix với số lượng đã xóa
 */
function fixAttendanceDuplicatesType1(paramString) {
  try {
    const param = paramString ? safeJSONParse(paramString) : {};
    const dryRun = param.dryRun !== undefined ? param.dryRun : true; // Mặc định là dry run
    const filterCode = param.attendanceCode || null;
    
    Logger.log('========================================');
    Logger.log('🔧 FIX ĐIỂM DANH TRÙNG LẶP - TYPE 1');
    Logger.log('========================================');
    Logger.log('Mode: ' + (dryRun ? 'DRY RUN (chỉ báo cáo)' : '⚠️ THỰC TẾ (sẽ xóa dữ liệu)'));
    if (filterCode) Logger.log('Filter by attendanceCode: ' + filterCode);
    Logger.log('');
    
    const sheet = getSheet(sheetName.attendanceDetail);
    if (!sheet) {
      throw new Error('Sheet DiemDanhChiTiet không tồn tại');
    }
    
    const data = sheet.getDataRange().getValues();
    Logger.log('📊 Total rows in sheet: ' + data.length);
    
    // Map để theo dõi: attendanceCode -> { studentCode -> [rowNumbers] }
    const attendanceMap = new Map();
    
    // Bỏ qua 2 dòng header
    for (let i = 2; i < data.length; i++) {
      const attendanceCode = String(data[i][0]).trim();
      const studentCode = String(data[i][1]).trim();
      const studentName = String(data[i][2]).trim();
      const rowNumber = i + 1; // 1-based
      
      if (!attendanceCode || !studentCode) continue;
      if (filterCode && attendanceCode !== filterCode) continue;
      
      if (!attendanceMap.has(attendanceCode)) {
        attendanceMap.set(attendanceCode, new Map());
      }
      
      const studentMap = attendanceMap.get(attendanceCode);
      if (!studentMap.has(studentCode)) {
        studentMap.set(studentCode, []);
      }
      studentMap.get(studentCode).push({
        rowNumber: rowNumber,
        name: studentName
      });
    }
    
    // Tìm các rows cần xóa
    const rowsToDelete = [];
    const duplicateDetails = [];
    
    attendanceMap.forEach((studentMap, attendanceCode) => {
      studentMap.forEach((records, studentCode) => {
        if (records.length > 1) {
          // Có duplicate - giữ record đầu tiên, đánh dấu xóa các record còn lại
          const keepRecord = records[0];
          const deleteRecords = records.slice(1);
          
          duplicateDetails.push({
            attendanceCode: attendanceCode,
            studentCode: studentCode,
            studentName: records[0].name,
            totalCount: records.length,
            keepRow: keepRecord.rowNumber,
            deleteRows: deleteRecords.map(r => r.rowNumber)
          });
          
          Logger.log('📋 AttendanceCode: ' + attendanceCode);
          Logger.log('   StudentCode: ' + studentCode + ' (' + records[0].name + ')');
          Logger.log('   Xuất hiện: ' + records.length + ' lần');
          Logger.log('   ✅ Giữ row: ' + keepRecord.rowNumber);
          Logger.log('   🗑️ Xóa rows: ' + deleteRecords.map(r => r.rowNumber).join(', '));
          Logger.log('');
          
          deleteRecords.forEach(r => rowsToDelete.push(r.rowNumber));
        }
      });
    });
    
    Logger.log('----------------------------------------');
    Logger.log('📊 Tổng số trường hợp trùng lặp: ' + duplicateDetails.length);
    Logger.log('📊 Tổng số rows cần xóa: ' + rowsToDelete.length);
    Logger.log('');
    
    // Thực hiện xóa nếu không phải dry run
    let deletedCount = 0;
    if (!dryRun && rowsToDelete.length > 0) {
      Logger.log('🔧 Bắt đầu xóa...');
      
      // Sort descending để xóa từ cuối lên
      rowsToDelete.sort((a, b) => b - a);
      
      rowsToDelete.forEach(rowNumber => {
        try {
          sheet.deleteRow(rowNumber);
          deletedCount++;
          Logger.log('  ✅ Đã xóa row ' + rowNumber);
        } catch (e) {
          Logger.log('  ❌ Lỗi xóa row ' + rowNumber + ': ' + e.toString());
        }
      });
      
      Logger.log('');
      Logger.log('========================================');
      Logger.log('✅ HOÀN THÀNH!');
      Logger.log('Đã xóa: ' + deletedCount + '/' + rowsToDelete.length + ' rows');
      Logger.log('========================================');
    } else if (dryRun && rowsToDelete.length > 0) {
      Logger.log('⚠️ DRY RUN - Không xóa thực tế');
      Logger.log('Để xóa thật, gọi: fixAttendanceDuplicatesType1(\'{"dryRun": false}\')');
    } else {
      Logger.log('✅ Không có bản ghi trùng lặp cần xóa');
    }
    
    return {
      success: true,
      dryRun: dryRun,
      duplicatesFound: duplicateDetails.length,
      rowsToDelete: rowsToDelete.length,
      rowsDeleted: deletedCount,
      details: duplicateDetails,
      message: dryRun 
        ? 'Dry run hoàn tất. Tìm thấy ' + rowsToDelete.length + ' rows trùng lặp cần xóa.'
        : 'Đã xóa ' + deletedCount + ' rows trùng lặp.'
    };
    
  } catch (error) {
    Logger.log('❌ Error in fixAttendanceDuplicatesType1: ' + error.toString());
    throw error;
  }
}

/**
 * DRY RUN: Chỉ báo cáo các bản ghi trùng lặp, KHÔNG xóa
 * Chạy hàm này trước để kiểm tra
 */
function fixAttendanceDuplicatesType1_DryRun() {
  return fixAttendanceDuplicatesType1('{"dryRun": true}');
}

/**
 * EXECUTE: Xóa thật các bản ghi trùng lặp
 * ⚠️ CHÚ Ý: Hàm này sẽ XÓA DỮ LIỆU. Hãy chạy DryRun trước!
 */
function fixAttendanceDuplicatesType1_Execute() {
  return fixAttendanceDuplicatesType1('{"dryRun": false}');
}
