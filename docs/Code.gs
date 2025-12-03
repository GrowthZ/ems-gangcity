// ============================================
// Google Apps Script - CHỈ XỬ LÝ GHI DỮ LIỆU
// ĐỌC dữ liệu sẽ dùng API v4 từ frontend
// ============================================

let spreadsheetId_Data = "1HhIpXU6Egq9MZmyCAvPnEjCT8V4n9soD7EY4LQ8Nt0w";
let sheetData = SpreadsheetApp.openById(spreadsheetId_Data);

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

function getSheet(name) {
  return sheetData.getSheetByName(name);
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
 */
function markAttendance(paramString) {
  try {
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
    if (studentMarks.length > 0) {
      const detailSheet = getSheet(sheetName.attendanceDetail);
      if (!detailSheet) {
        throw new Error('Sheet DiemDanhChiTiet không tồn tại');
      }
      
      studentMarks.forEach(mark => {
        const rowData = [
          mark[0], // attendanceCode
          mark[1], // studentCode
          mark[2], // studentName
          formatDate(mark[3]), // date - ✅ FORMAT về dd/mm/yyyy
          mark[4], // group
          mark[5] || '', // note
          new Date().toISOString() // timestamp
        ];
        detailSheet.appendRow(rowData);
        const newRow = detailSheet.getLastRow();
        
        // ✅ ÉP FORMAT dd/mm/yyyy cho cột date (D)
        detailSheet.getRange(`D${newRow}`).setNumberFormat('dd/mm/yyyy');
      });
      
      Logger.log('✅ Đã ghi ' + studentMarks.length + ' học viên có mặt');
    }
    
    // 2. Ghi danh sách học viên vắng mặt vào sheet DiemDanhNghi
    if (studentMissings.length > 0) {
      const missingSheet = getSheet(sheetName.attendanceMissing);
      if (!missingSheet) {
        throw new Error('Sheet DiemDanhNghi không tồn tại');
      }
      
      studentMissings.forEach(missing => {
        const rowData = [
          new Date().toISOString(), // timestamp
          formatDate(missing[3] || calendar?.dateTime), // date - ✅ FORMAT về dd/mm/yyyy
          missing[1], // studentCode
          missing[2], // studentName
          missing[4] || calendar?.group, // group
          missing[5] || '', // reason
          missing[6] || 'Chưa chăm sóc' // note
        ];
        missingSheet.appendRow(rowData);
        const newRow = missingSheet.getLastRow();
        
        // ✅ ÉP FORMAT dd/mm/yyyy cho cột date (B)
        missingSheet.getRange(`B${newRow}`).setNumberFormat('dd/mm/yyyy');
      });
      
      Logger.log('✅ Đã ghi ' + studentMissings.length + ' học viên vắng mặt');
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
    
    // ✅ ÉP FORMAT dd/mm/yyyy cho cột dateTime để tránh Google Sheets hiểu nhầm
    attendanceSheet.getRange(`B${newRow}`).setNumberFormat('dd/mm/yyyy');
    
    Logger.log('✅ Đã ghi/update summary vào DiemDanh với formulas (calendar: ' + (calendar ? 'có' : 'không') + ')');
    
    Logger.log('✅ Mark attendance completed successfully');
    
    return { 
      success: true, 
      message: 'Điểm danh thành công',
      details: {
        attendanceCode: attendanceCode,
        present: studentMarks.length,
        missing: studentMissings.length
      }
    };
    
  } catch (error) {
    Logger.log('❌ Mark attendance error: ' + error.toString());
    console.error('Mark attendance error:', error);
    throw error;
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
 */
function updateAttendance(paramString) {
  try {
    const param = safeJSONParse(paramString);
    const code = param.code;
    
    Logger.log('🔄 Updating attendance for code: ' + code);
    
    // Xóa dữ liệu cũ
    deleteOldAttendance(code, sheetName.attendanceDetail);
    deleteOldAttendance(code, sheetName.attendanceMissing);
    
    // Tạo lại điểm danh mới
    markAttendance(paramString);
    
    Logger.log('✅ Cập nhật điểm danh thành công');
    return { success: true, message: 'Cập nhật thành công' };
  } catch (error) {
    Logger.log('❌ Update attendance error: ' + error.toString());
    throw error;
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
    for (let i = data.length - 1; i >= 2; i--) {
      if (data[i][0] === code) {
        rowsToDelete.push(i + 1); // Convert to 1-based index
      }
    }
    
    // Xóa từ cuối lên đầu để tránh lỗi index
    rowsToDelete.forEach(rowIndex => {
      sheet.deleteRow(rowIndex);
    });
    
    Logger.log('🗑️ Deleted ' + rowsToDelete.length + ' rows from ' + nameSheet);
  } catch (error) {
    Logger.log('❌ Delete old attendance error: ' + error.toString());
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
    
    // Tìm row có attendanceCode trùng và update status (cột 11) = '1'
    for (let i = 0; i < calendarData.length; i++) {
      const rowCode = String(calendarData[i][0]).trim();
      
      if (rowCode === attendanceCode) {
        const rowNumber = i + 1;
        // Update cột 11 (status) = '1' để đánh dấu đã điểm danh
        calendarSheet.getRange(rowNumber, 11).setValue('1');
        Logger.log('✅ Đã cập nhật status calendar row ' + rowNumber + ' = "1"');
        return calendarData[i];
      }
    }
    
    Logger.log('⚠️ Không tìm thấy calendar với code: ' + attendanceCode);
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
 */
function createCalendars(paramString) {
  try {
    const param = safeJSONParse(paramString);
    const sheet = getSheet(sheetName.calendar);
    const calendars = Array.isArray(param) ? param : [param];

    calendars.forEach(cal => {
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
      const rowData = [
        attendanceCode,
        formatDate(cal.dateTime) || '', // ✅ FORMAT về dd/mm/yyyy
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
      sheet.appendRow(rowData);
      const newRow = sheet.getLastRow();
      
      // ✅ ÉP FORMAT dd/mm/yyyy cho cột dateTime (B)
      sheet.getRange(`B${newRow}`).setNumberFormat('dd/mm/yyyy');
    });

    Logger.log('✅ Tạo lịch dạy thành công:', calendars.length, 'lịch');
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
    
    // ✅ ÉP FORMAT dd/mm/yyyy cho cột datePayment (C)
    sheet.getRange(`C${newRow}`).setNumberFormat('dd/mm/yyyy');
    
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
      // ✅ ÉP FORMAT dd/mm/yyyy
      sheet.getRange(actualRowNumber, datePaymentCol + 1).setNumberFormat('dd/mm/yyyy');
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
    
    // ✅ ÉP FORMAT dd/mm/yyyy cho cột datePayment (C)
    sheet.getRange(`C${newRow}`).setNumberFormat('dd/mm/yyyy');
    
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
    
    // ✅ ÉP FORMAT dd/mm/yyyy cho cột birthday (G) và dateStart (I)
    sheet.getRange(`G${newRow}`).setNumberFormat('dd/mm/yyyy');
    sheet.getRange(`I${newRow}`).setNumberFormat('dd/mm/yyyy');
    
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
      
      // ✅ ÉP FORMAT dd/mm/yyyy cho cột dateUpdate (D)
      sheet.getRange(`D${newRow}`).setNumberFormat('dd/mm/yyyy');
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

    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const calendarSheet = ss.getSheetByName('LichDay');
    const attendanceSheet = ss.getSheetByName('DiemDanh');
    const detailSheet = ss.getSheetByName('DiemDanhChiTiet');

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
    
    // ============================================
    // BƯỚC 3: Update DiemDanh (Column A = attendanceCode)
    // ============================================
    Logger.log('');
    Logger.log('📌 STEP 3: Updating DiemDanh...');
    Logger.log('─────────────────────────────────────');
    Logger.log('ℹ️ DiemDanh dateTime (Column B) uses VLOOKUP formula from LichDay');
    Logger.log('ℹ️ Will use codeMapping from STEP 1 & 2 to update attendanceCode only');
    
    // DiemDanh không cần parse dateTime vì Column B là công thức:
    // =IFERROR(VLOOKUP(A1823, LichDay!A:E, 5, FALSE), "")
    // Chỉ cần update Column A dựa vào codeMapping đã có
          codeMapping[oldCode] = newCode;
          attendanceProcessed++;
          
          if (attendanceProcessed <= 5) {
            Logger.log('  ' + oldCode + ' → ' + newCode + ' (date: ' + day + '/' + month + '/' + year + ')');
          }
        }
      }
    }
    
    Logger.log('  Processed: ' + detailProcessed + ' codes from DiemDanhChiTiet');
    
    // ============================================
    // BƯỚC 3: Update DiemDanh (Column A = attendanceCode)
    // ============================================
    Logger.log('');
    Logger.log('📌 STEP 3: Updating DiemDanh...');
    Logger.log('─────────────────────────────────────');
    Logger.log('ℹ️ DiemDanh dateTime (Column B) uses VLOOKUP formula from LichDay');
    Logger.log('ℹ️ Will use codeMapping from STEP 1 & 2 to update attendanceCode only');
    
    // DiemDanh không cần parse dateTime vì Column B là công thức:
    // =IFERROR(VLOOKUP(A1823, LichDay!A:E, 5, FALSE), "")
    // Chỉ cần update Column A dựa vào codeMapping đã có

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
    
    // STEP 1: Fix codes
    Logger.log('📌 STEP 1: Fix attendance codes...');
    const formatResult = fixAttendanceCodeFromDateTime();
    
    // STEP 2: Fix missing records
    Logger.log('\n📌 STEP 2: Create missing records...');
    const missingResult = fixMissingAttendanceRecords();
    
    // Summary
    Logger.log('\n========================================');
    Logger.log('🎉 ALL FIXES COMPLETED!');
    Logger.log('  - Codes fixed: ' + (formatResult?.totalCodes || 0));
    Logger.log('  - Records created: ' + (missingResult?.created || 0));
    Logger.log('========================================');
    
    return {
      success: true,
      formatFixes: formatResult,
      missingRecords: missingResult
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
    
    // Get all data
    const detailData = detailSheet.getDataRange().getValues();
    const attendanceData = attendanceSheet.getDataRange().getValues();
    
    // Column indexes (hard-coded based on sheet structure)
    // DiemDanhChiTiet: A=attendanceCode(0), D=date(3)
    // DiemDanh: A=attendanceCode(0), B=dateTime(1)
    const detailCodeCol = 0;  // Column A
    const detailDateCol = 3;  // Column D
    const attendanceCodeCol = 0;  // Column A
    const attendanceDateCol = 1;  // Column B
    
    Logger.log('📍 Using columns: DiemDanhChiTiet [A, D], DiemDanh [A, B]');
    
    // Extract unique attendanceCodes from DiemDanhChiTiet
    // Row 1-2 (index 0-1): Title/Metadata
    // Row 3 (index 2): Headers (attendanceCode, studentCode, ...)
    // Row 4+ (index 3+): Actual data starts here
    const detailCodes = new Set();
    const detailCodesWithDates = {}; // Map: code -> dateTime for debugging
    
    for (let i = 3; i < detailData.length; i++) {
      const code = String(detailData[i][detailCodeCol]).trim();
      const date = detailData[i][detailDateCol] ? String(detailData[i][detailDateCol]).trim() : '';
      if (code) {
        detailCodes.add(code);
        if (date && !detailCodesWithDates[code]) {
          detailCodesWithDates[code] = date;
        }
      }
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
    
    for (let i = 3; i < attendanceData.length; i++) {
      const code = String(attendanceData[i][attendanceCodeCol]).trim();
      const date = attendanceData[i][attendanceDateCol] ? String(attendanceData[i][attendanceDateCol]).trim() : '';
      if (code) {
        existingCodes.add(code);
        if (date && !existingCodesWithDates[code]) {
          existingCodesWithDates[code] = date;
        }
      }
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
