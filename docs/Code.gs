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

// ============================================
// ACTION HANDLERS - GHI/CẬP NHẬT DỮ LIỆU
// ============================================

/**
 * Login - Verify user credentials
 */
function login(paramString) {
  try {
    const param = JSON.parse(paramString);
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
    const param = JSON.parse(paramString);
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
          mark[3], // date
          mark[4], // group
          mark[5] || '', // note
          new Date().toISOString() // timestamp
        ];
        detailSheet.appendRow(rowData);
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
          missing[3] || calendar?.dateTime, // date
          missing[1], // studentCode
          missing[2], // studentName
          missing[4] || calendar?.group, // group
          missing[5] || '', // reason
          missing[6] || 'Chưa chăm sóc' // note
        ];
        missingSheet.appendRow(rowData);
      });
      
      Logger.log('✅ Đã ghi ' + studentMissings.length + ' học viên vắng mặt');
    }
    
    // 3. Cập nhật attendanceCode vào sheet LichDay
    if (calendar) {
      updateStatusCalendar(attendanceCode);
    }
    
    // 4. Ghi summary vào sheet DiemDanh (tổng hợp điểm danh)
    if (calendar) {
      const attendanceSheet = getSheet(sheetName.attendance);
      if (!attendanceSheet) {
        throw new Error('Sheet DiemDanh không tồn tại');
      }
      
      // Check xem đã tồn tại chưa để tránh duplicate
      const existingData = attendanceSheet.getDataRange().getValues();
      const isExist = existingData.some(row => row[0] === attendanceCode);
      
      if (isExist) {
        Logger.log('⚠️ AttendanceCode đã tồn tại trong DiemDanh, skip tạo mới');
      } else {
        // Cấu trúc columns: attendanceCode, dateTime, group, teacher, subTeacher, 
        //                   total, totalMain, totalSub, salary, subSalary, location
        const summaryRowData = [
          attendanceCode, // A: attendanceCode
          calendar.dateTime || '', // B: dateTime
          calendar.group || '', // C: group
          calendar.teacher || '', // D: teacher
          calendar.subTeacher || '' // E: subTeacher
          // F, G, H, I, J, K sẽ dùng formula
        ];
        
        attendanceSheet.appendRow(summaryRowData);
        const newRow = attendanceSheet.getLastRow();
        
        // Set formulas để tự động tính toán
        const formulaTeacher = `=IFERROR(VLOOKUP(A${newRow}, ${sheetName.calendar}!A:E, 5, FALSE), "")`;
        const formulaSubTeacher = `=IFERROR(VLOOKUP(A${newRow}, ${sheetName.calendar}!A:F, 6, FALSE), "")`;
        const formulaTotalMain = `=IF(A${newRow} <> "", COUNTIFS(DiemDanhChiTiet!A:A, A${newRow}, DiemDanhChiTiet!E:E, C${newRow}), 0)`;
        const formulaTotalSub = `=IF(A${newRow} <> "", COUNTIFS(DiemDanhChiTiet!A:A, A${newRow}, DiemDanhChiTiet!E:E, "<>"&C${newRow}), 0)`;
        const formulaTotal = `=SUM(G${newRow}:H${newRow})`;
        const formulaSalary = `=IF(F${newRow} = 0, 0, IF(F${newRow} <= 12, 150000, IF(F${newRow} <= 14, 170000, 200000)))+IF(K${newRow} = "Gang Thép", 20000, 0)`;
        const formulaSubSalary = `=IF(E${newRow} <> "", 50000, 0)`;
        const formulaLocation = `=XLOOKUP(TRIM(C${newRow}), LopHoc!$B$4:$B$100, LopHoc!$A$4:$A$100, "Không tìm thấy")`;
        
        // Apply formulas
        attendanceSheet.getRange(`D${newRow}`).setFormula(formulaTeacher);
        attendanceSheet.getRange(`E${newRow}`).setFormula(formulaSubTeacher);
        attendanceSheet.getRange(`G${newRow}`).setFormula(formulaTotalMain);
        attendanceSheet.getRange(`H${newRow}`).setFormula(formulaTotalSub);
        attendanceSheet.getRange(`F${newRow}`).setFormula(formulaTotal);
        attendanceSheet.getRange(`I${newRow}`).setFormula(formulaSalary);
        attendanceSheet.getRange(`J${newRow}`).setFormula(formulaSubSalary);
        attendanceSheet.getRange(`K${newRow}`).setFormula(formulaLocation);
        
        Logger.log('✅ Đã ghi summary vào DiemDanh với formulas');
      }
    }
    
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
    const code = JSON.parse(dataJson);
    const sheet = getSheet(sheetName.attendanceDetail);
    const data = sheet.getDataRange().getValues();
    
    // Filter rows with matching attendance code (bỏ qua header)
    const rowAttendanced = data.filter((row, index) => index > 2 && row[0] === code);
    
    console.log('✅ Found marked students:', rowAttendanced.length, 'for code:', code);
    return rowAttendanced;
  } catch (error) {
    console.error('Get marked students error:', error);
    throw error;
  }
}

/**
 * Cập nhật điểm danh - Xóa dữ liệu cũ và tạo mới
 */
function updateAttendance(paramString) {
  try {
    const param = JSON.parse(paramString);
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
    const param = JSON.parse(paramString);
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
    const param = JSON.parse(paramString);
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
 * Tạo lịch dạy
 */
function createCalendars(paramString) {
  try {
    const param = JSON.parse(paramString);
    const sheet = getSheet(sheetName.calendar);
    const calendars = Array.isArray(param) ? param : [param];

    calendars.forEach(cal => {
      // Cấu trúc theo logic cũ: 11 cột
      // attendanceCode, dateTime, location, group, teacher, subTeacher, 
      // startTime, endTime, attendanceTime, note, status
      const rowData = [
        cal.attendanceCode || '',
        cal.dateTime || '',
        cal.location || '',
        cal.group || '',
        cal.teacher || '',
        cal.subTeacher || '',
        cal.startTime || '',
        cal.endTime || '',
        cal.attendanceTime || '',
        cal.note || '',
        cal.status || ''
      ];
      sheet.appendRow(rowData);
    });

    Logger.log('✅ Tạo lịch dạy thành công:', calendars.length, 'lịch');
    return calendars;
  } catch (error) {
    Logger.log('❌ Create calendars error: ' + error.toString());
    throw error;
  }
}

/**
 * Đóng học - Create payment
 */
function createPayment(paramString) {
  try {
    const param = JSON.parse(paramString);
    const sheet = getSheet(sheetName.payment);

    // Cấu trúc theo logic cũ: 7 cột
    // studentCode, studentName, datePayment, type, money, lesson, note
    const rowData = [
      param.studentCode || '',
      param.studentName || '',
      param.datePayment || '',
      param.type || '',
      param.money || '',
      param.lesson || '',
      param.note || ''
    ];

    sheet.appendRow(rowData);
    Logger.log('✅ Đóng học thành công:', param.studentCode);
    
    return rowData;
  } catch (error) {
    Logger.log('❌ Create payment error: ' + error.toString());
    throw error;
  }
}

/**
 * Cập nhật giao dịch thanh toán
 */
function updatePayment(paramString) {
  try {
    const param = JSON.parse(paramString);
    Logger.log('📝 Updating payment for: ' + param.studentCode);
    
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
    
    // Find column indexes
    const studentCodeCol = headers.indexOf('studentCode');
    const datePaymentCol = headers.indexOf('datePayment');
    const typeCol = headers.indexOf('type');
    const lessonCol = headers.indexOf('lesson');
    const moneyCol = headers.indexOf('money');
    const noteCol = headers.indexOf('note');
    
    if (studentCodeCol === -1 || datePaymentCol === -1) {
      return {
        status: 'error',
        message: 'Không tìm thấy cột studentCode hoặc datePayment'
      };
    }
    
    // Find the row to update
    let rowIndex = -1;
    for (let i = headerRow + 1; i < values.length; i++) {
      if (values[i][studentCodeCol] === param.studentCode && 
          values[i][datePaymentCol] === param.datePayment) {
        rowIndex = i;
        break;
      }
    }
    
    if (rowIndex === -1) {
      return {
        status: 'error',
        message: 'Không tìm thấy giao dịch cần cập nhật'
      };
    }
    
    // Update the row
    const actualRowNumber = rowIndex + 1; // Convert to 1-based index
    
    if (typeCol !== -1 && param.type) {
      sheet.getRange(actualRowNumber, typeCol + 1).setValue(param.type);
    }
    if (lessonCol !== -1 && param.lesson !== undefined) {
      sheet.getRange(actualRowNumber, lessonCol + 1).setValue(param.lesson);
    }
    if (moneyCol !== -1 && param.money) {
      sheet.getRange(actualRowNumber, moneyCol + 1).setValue(param.money);
    }
    if (noteCol !== -1 && param.note !== undefined) {
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
 * Xóa giao dịch thanh toán
 */
function deletePayment(paramString) {
  try {
    const param = JSON.parse(paramString);
    Logger.log('🗑️ Deleting payment for: ' + param.studentCode);
    
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
    
    // Find column indexes
    const studentCodeCol = headers.indexOf('studentCode');
    const datePaymentCol = headers.indexOf('datePayment');
    
    if (studentCodeCol === -1 || datePaymentCol === -1) {
      return {
        status: 'error',
        message: 'Không tìm thấy cột studentCode hoặc datePayment'
      };
    }
    
    // Find the row to delete
    let rowIndex = -1;
    for (let i = headerRow + 1; i < values.length; i++) {
      if (values[i][studentCodeCol] === param.studentCode && 
          values[i][datePaymentCol] === param.datePayment) {
        rowIndex = i;
        break;
      }
    }
    
    if (rowIndex === -1) {
      return {
        status: 'error',
        message: 'Không tìm thấy giao dịch cần xóa'
      };
    }
    
    // Delete the row
    const actualRowNumber = rowIndex + 1; // Convert to 1-based index
    sheet.deleteRow(actualRowNumber);
    
    Logger.log('✅ Payment deleted successfully');
    
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
    const param = JSON.parse(paramString);
    const sheet = getSheet(sheetName.lessonUpdate);

    // Cấu trúc theo logic cũ: 5 cột
    // studentCode, studentName, datePayment, lesson, note
    const rowData = [
      param.studentCode || '',
      param.studentName || '',
      param.datePayment || '',
      param.lesson || 0,
      param.note || ''
    ];

    sheet.appendRow(rowData);
    Logger.log('✅ Điều chỉnh buổi học:', param.studentCode);
    
    return rowData;
  } catch (error) {
    Logger.log('❌ Update lesson error: ' + error.toString());
    throw error;
  }
}

/**
 * Thêm học viên mới
 */
function newStudent(paramString) {
  try {
    const param = JSON.parse(paramString);
    const sheet = getSheet(sheetName.student);

    // Cấu trúc theo logic cũ: 11 cột
    // code, location, fullname, nickname, group, gender, birthday, 
    // phoneNumber, dateStart, status, note
    const rowData = [
      param.code || '',
      param.location || '',
      param.fullname || '',
      param.nickname || '',
      param.group || '',
      param.gender || '',
      param.birthday || '',
      param.phoneNumber || param.phone || '',
      param.dateStart || '',
      param.status || 'active',
      param.note || ''
    ];

    sheet.appendRow(rowData);
    Logger.log('✅ Thêm học viên mới:', param.code);
    
    // Tạo student follow
    createStudentFollow(param);
    
    return rowData;
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
    const isExist = data.some(row => row[0] === student.code);
    
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
    const param = JSON.parse(paramString);
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
      param.birthday || '',
      param.phoneNumber || param.phone || '',
      param.dateStart || '',
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
    const param = JSON.parse(paramString);
    const sheet = getSheet(sheetName.studentMonthUpdate);
    const dataArray = param.data || [param];

    dataArray.forEach(item => {
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
