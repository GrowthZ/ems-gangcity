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
    const sheet = getSheet(sheetName.user);
    const data = sheet.getDataRange().getValues();

    // Skip first 3 rows (headers)
    for (let i = 3; i < data.length; i++) {
      if (data[i][0] === param.username && data[i][1] === param.password) {
        return {
          username: data[i][0],
          role: data[i][2] || 'user',
          token: 'token_' + Date.now()
        };
      }
    }

    throw new Error('Sai tên đăng nhập hoặc mật khẩu');
  } catch (error) {
    console.error('Login error:', error);
    throw error;
  }
}

/**
 * Điểm danh - Mark attendance
 */
function markAttendance(paramString) {
  try {
    const param = JSON.parse(paramString);
    const sheet = getSheet(sheetName.attendance);

    const rowData = [
      new Date().toISOString(),
      param.date || '',
      param.studentCode || '',
      param.studentName || '',
      param.group || '',
      param.teacher || '',
      param.subTeacher || '',
      param.location || '',
      param.status || '',
      param.note || ''
    ];

    sheet.appendRow(rowData);
    console.log('✅ Điểm danh thành công:', param.studentCode);
    
    return { success: true, message: 'Điểm danh thành công' };
  } catch (error) {
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
 * Cập nhật điểm danh
 */
function updateAttendance(paramString) {
  try {
    const param = JSON.parse(paramString);
    const sheet = getSheet(sheetName.attendance);
    const data = sheet.getDataRange().getValues();

    // Tìm row cần update (bỏ qua 3 dòng header)
    for (let i = 3; i < data.length; i++) {
      if (data[i][1] === param.date && data[i][2] === param.studentCode) {
        // Update row
        const rowNumber = i + 1;
        sheet.getRange(rowNumber, 1, 1, 10).setValues([[
          data[i][0], // Keep timestamp
          param.date || data[i][1],
          param.studentCode || data[i][2],
          param.studentName || data[i][3],
          param.group || data[i][4],
          param.teacher || data[i][5],
          param.subTeacher || data[i][6],
          param.location || data[i][7],
          param.status || data[i][8],
          param.note || data[i][9]
        ]]);
        
        console.log('✅ Cập nhật điểm danh thành công:', param.studentCode);
        return { success: true, message: 'Cập nhật thành công' };
      }
    }

    throw new Error('Không tìm thấy bản ghi điểm danh');
  } catch (error) {
    console.error('Update attendance error:', error);
    throw error;
  }
}

/**
 * Đổi giáo viên trong lịch dạy
 */
function changeTeacherOfCalendar(paramString) {
  try {
    const param = JSON.parse(paramString);
    const sheet = getSheet(sheetName.calendar);
    const data = sheet.getDataRange().getValues();

    for (let i = 3; i < data.length; i++) {
      if (data[i][0] === param.calendarId || (data[i][1] === param.date && data[i][3] === param.group)) {
        const rowNumber = i + 1;
        sheet.getRange(rowNumber, 5, 1, 2).setValues([[
          param.teacher || data[i][4],
          param.subTeacher || data[i][5]
        ]]);
        
        console.log('✅ Đổi giáo viên thành công');
        return { success: true, message: 'Đổi giáo viên thành công' };
      }
    }

    throw new Error('Không tìm thấy lịch dạy');
  } catch (error) {
    console.error('Change teacher error:', error);
    throw error;
  }
}

/**
 * Cập nhật học viên nghỉ
 */
function updateStudentMissing(paramString) {
  try {
    const param = JSON.parse(paramString);
    const sheet = getSheet(sheetName.attendanceMissing);

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
    console.log('✅ Ghi nhận nghỉ học:', param.studentCode);
    
    return { success: true, message: 'Ghi nhận nghỉ học thành công' };
  } catch (error) {
    console.error('Update student missing error:', error);
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
      const rowData = [
        cal.id || new Date().getTime().toString(),
        cal.date || '',
        cal.time || '',
        cal.group || '',
        cal.teacher || '',
        cal.subTeacher || '',
        cal.location || '',
        cal.status || 'scheduled',
        cal.note || ''
      ];
      sheet.appendRow(rowData);
    });

    console.log('✅ Tạo lịch dạy thành công:', calendars.length, 'lịch');
    return { success: true, message: 'Tạo lịch thành công', count: calendars.length };
  } catch (error) {
    console.error('Create calendars error:', error);
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

    const rowData = [
      new Date().toISOString(),
      param.studentCode || '',
      param.studentName || '',
      param.amount || 0,
      param.lessons || 0,
      param.startDate || '',
      param.endDate || '',
      param.paymentMethod || '',
      param.note || ''
    ];

    sheet.appendRow(rowData);
    console.log('✅ Đóng học thành công:', param.studentCode);
    
    return { success: true, message: 'Đóng học thành công' };
  } catch (error) {
    console.error('Create payment error:', error);
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

    const rowData = [
      new Date().toISOString(),
      param.studentCode || '',
      param.studentName || '',
      param.adjustment || 0,
      param.reason || '',
      param.note || ''
    ];

    sheet.appendRow(rowData);
    console.log('✅ Điều chỉnh buổi học:', param.studentCode);
    
    return { success: true, message: 'Điều chỉnh thành công' };
  } catch (error) {
    console.error('Update lesson error:', error);
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

    const rowData = [
      param.code || '',
      param.fullname || '',
      param.phone || '',
      param.group || '',
      param.location || '',
      param.status || 'active',
      new Date().toISOString(),
      param.note || ''
    ];

    sheet.appendRow(rowData);
    console.log('✅ Thêm học viên mới:', param.code);
    
    return { success: true, message: 'Thêm học viên thành công' };
  } catch (error) {
    console.error('New student error:', error);
    throw error;
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

    for (let i = 3; i < data.length; i++) {
      if (data[i][0] === param.code) {
        const rowNumber = i + 1;
        sheet.getRange(rowNumber, 1, 1, 8).setValues([[
          param.code,
          param.fullname || data[i][1],
          param.phone || data[i][2],
          param.group || data[i][3],
          param.location || data[i][4],
          param.status || data[i][5],
          data[i][6], // Keep enroll date
          param.note || data[i][7]
        ]]);
        
        console.log('✅ Cập nhật học viên:', param.code);
        return { success: true, message: 'Cập nhật thành công' };
      }
    }

    throw new Error('Không tìm thấy học viên');
  } catch (error) {
    console.error('Update student error:', error);
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
