/**
 * APPSCRIPT CODE - Thêm vào Google Apps Script
 * 
 * Các function mới cần thêm vào Apps Script để hỗ trợ tính năng báo cáo tài chính
 */

// ========================================
// UPDATE PAYMENT - Cập nhật giao dịch thanh toán
// ========================================

/**
 * Cập nhật thông tin giao dịch thanh toán
 * 
 * @param {Object} data - Dữ liệu giao dịch cần cập nhật
 * @param {string} data.studentCode - Mã học viên
 * @param {string} data.datePayment - Ngày thanh toán (DD/MM/YYYY)
 * @param {string} data.type - Loại thanh toán (Le/Khoa)
 * @param {number} data.lesson - Số buổi
 * @param {string} data.money - Số tiền
 * @param {string} data.note - Ghi chú
 * @return {Object} - Kết quả cập nhật
 */
function updatePayment(data) {
  try {
    Logger.log('📝 Updating payment for: ' + data.studentCode);
    
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const paymentSheet = ss.getSheetByName('DongHoc'); // Tên sheet thanh toán
    
    if (!paymentSheet) {
      return {
        status: 'error',
        message: 'Không tìm thấy sheet DongHoc'
      };
    }
    
    // Get all data
    const dataRange = paymentSheet.getDataRange();
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
      if (values[i][studentCodeCol] === data.studentCode && 
          values[i][datePaymentCol] === data.datePayment) {
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
    
    if (typeCol !== -1) {
      paymentSheet.getRange(actualRowNumber, typeCol + 1).setValue(data.type);
    }
    if (lessonCol !== -1) {
      paymentSheet.getRange(actualRowNumber, lessonCol + 1).setValue(data.lesson);
    }
    if (moneyCol !== -1) {
      paymentSheet.getRange(actualRowNumber, moneyCol + 1).setValue(data.money);
    }
    if (noteCol !== -1 && data.note) {
      paymentSheet.getRange(actualRowNumber, noteCol + 1).setValue(data.note);
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

// ========================================
// DELETE PAYMENT - Xóa giao dịch thanh toán
// ========================================

/**
 * Xóa giao dịch thanh toán
 * 
 * @param {Object} data - Dữ liệu giao dịch cần xóa
 * @param {string} data.studentCode - Mã học viên
 * @param {string} data.datePayment - Ngày thanh toán (DD/MM/YYYY)
 * @return {Object} - Kết quả xóa
 */
function deletePayment(data) {
  try {
    Logger.log('🗑️ Deleting payment for: ' + data.studentCode);
    
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const paymentSheet = ss.getSheetByName('DongHoc'); // Tên sheet thanh toán
    
    if (!paymentSheet) {
      return {
        status: 'error',
        message: 'Không tìm thấy sheet DongHoc'
      };
    }
    
    // Get all data
    const dataRange = paymentSheet.getDataRange();
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
      if (values[i][studentCodeCol] === data.studentCode && 
          values[i][datePaymentCol] === data.datePayment) {
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
    paymentSheet.deleteRow(actualRowNumber);
    
    Logger.log('✅ Payment deleted successfully');
    
    // Optional: Update KiemSoatBuoiHoc sheet
    // updateStudentLessonSummary(data.studentCode);
    
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

// ========================================
// MAIN HANDLER - Thêm vào function doPost
// ========================================

/**
 * Thêm các case sau vào function doPost() hiện tại:
 * 
 * case 'updatePayment':
 *   result = updatePayment(param);
 *   break;
 * 
 * case 'deletePayment':
 *   result = deletePayment(param);
 *   break;
 */

// ========================================
// HELPER FUNCTION - Cập nhật tổng buổi học
// ========================================

/**
 * Cập nhật tổng số buổi học trong sheet KiemSoatBuoiHoc
 * (Optional - Gọi sau khi xóa/cập nhật payment)
 * 
 * @param {string} studentCode - Mã học viên
 */
function updateStudentLessonSummary(studentCode) {
  try {
    Logger.log('🔄 Updating lesson summary for: ' + studentCode);
    
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const paymentSheet = ss.getSheetByName('DongHoc');
    const summarySheet = ss.getSheetByName('KiemSoatBuoiHoc');
    
    if (!paymentSheet || !summarySheet) {
      Logger.log('⚠️ Sheet not found');
      return;
    }
    
    // Calculate total from payments
    const paymentData = paymentSheet.getDataRange().getValues();
    const paymentHeaders = paymentData[2]; // Row 3
    const studentCodeColIndex = paymentHeaders.indexOf('studentCode');
    const lessonColIndex = paymentHeaders.indexOf('lesson');
    
    let totalLessons = 0;
    let paymentCount = 0;
    
    for (let i = 3; i < paymentData.length; i++) {
      if (paymentData[i][studentCodeColIndex] === studentCode) {
        const lessons = parseInt(paymentData[i][lessonColIndex]) || 0;
        totalLessons += lessons;
        paymentCount++;
      }
    }
    
    // Update summary sheet
    const summaryData = summarySheet.getDataRange().getValues();
    const summaryHeaders = summaryData[2]; // Row 3
    const summaryStudentCodeCol = summaryHeaders.indexOf('code');
    const tongSoBuoiCol = summaryHeaders.indexOf('tongSoBuoi');
    const lanDongTienCol = summaryHeaders.indexOf('lanDongTien');
    
    for (let i = 3; i < summaryData.length; i++) {
      if (summaryData[i][summaryStudentCodeCol] === studentCode) {
        const actualRow = i + 1;
        
        if (tongSoBuoiCol !== -1) {
          summarySheet.getRange(actualRow, tongSoBuoiCol + 1).setValue(totalLessons);
        }
        if (lanDongTienCol !== -1) {
          summarySheet.getRange(actualRow, lanDongTienCol + 1).setValue(paymentCount);
        }
        
        break;
      }
    }
    
    Logger.log('✅ Summary updated: ' + totalLessons + ' lessons, ' + paymentCount + ' payments');
    
  } catch (error) {
    Logger.log('❌ Error updating summary: ' + error.toString());
  }
}

// ========================================
// TESTING
// ========================================

/**
 * Test function - Uncomment để test
 */
/*
function testUpdatePayment() {
  const testData = {
    studentCode: 'HV001',
    datePayment: '20/10/2025',
    type: 'Khoa',
    lesson: 12,
    money: '2400000',
    note: 'Test update'
  };
  
  const result = updatePayment(testData);
  Logger.log(result);
}

function testDeletePayment() {
  const testData = {
    studentCode: 'HV001',
    datePayment: '20/10/2025'
  };
  
  const result = deletePayment(testData);
  Logger.log(result);
}
*/
