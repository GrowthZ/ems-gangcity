// ============================================
// REMOVE DUPLICATES - Google Apps Script
// File này để add trực tiếp vào Google Sheet
// ============================================

/**
 * Tạo menu khi mở Google Sheet
 */
function onOpen() {
  const ui = SpreadsheetApp.getUi();
  ui.createMenu('🛠️ GC Tools')
    .addItem('🗑️ Remove Duplicates', 'showRemoveDuplicatesDialog')
    .addSeparator()
    .addItem('📊 Thống kê dữ liệu', 'showDataStats')
    .addToUi();
  
  Logger.log('✅ Custom menu loaded');
}

/**
 * Hiển thị dialog Remove Duplicates
 */
function showRemoveDuplicatesDialog() {
  const sheet = SpreadsheetApp.getActiveSheet();
  const sheetName = sheet.getName();
  
  // Tìm duplicates
  const result = findDuplicates(sheet);
  
  if (result.duplicates.length === 0) {
    SpreadsheetApp.getUi().alert(
      '✅ Không tìm thấy dữ liệu trùng lặp',
      'Sheet "' + sheetName + '" không có dữ liệu trùng lặp.',
      SpreadsheetApp.getUi().ButtonSet.OK
    );
    return;
  }
  
  // Tạo HTML dialog
  const html = createDuplicatesHTML(result, sheetName);
  const htmlOutput = HtmlService.createHtmlOutput(html)
    .setWidth(800)
    .setHeight(600);
  
  SpreadsheetApp.getUi().showModalDialog(htmlOutput, '🗑️ Remove Duplicates - ' + sheetName);
}

/**
 * Tìm các dòng trùng lặp
 */
function findDuplicates(sheet) {
  const data = sheet.getDataRange().getValues();
  const headerRow = 2; // Skip 2 rows (title + headers)
  
  if (data.length <= headerRow) {
    return { duplicates: [], total: 0 };
  }
  
  const headers = data[headerRow];
  const dataRows = data.slice(headerRow + 1);
  
  // Map để track các dòng đã thấy
  const seen = new Map();
  const duplicates = [];
  
  dataRows.forEach((row, index) => {
    const actualRowNumber = index + headerRow + 2; // +2 vì bỏ qua headers và index từ 1
    
    // Tạo key từ TẤT CẢ giá trị trong row (bao gồm cả cột đầu tiên - mã học viên/ID)
    const keyValues = row.map(cell => String(cell).trim());
    const key = keyValues.join('|||');
    
    // Bỏ qua dòng rỗng
    if (key === '' || keyValues.every(v => v === '')) {
      return;
    }
    
    if (seen.has(key)) {
      // Đây là duplicate
      const firstOccurrence = seen.get(key);
      duplicates.push({
        rowNumber: actualRowNumber,
        firstRowNumber: firstOccurrence.rowNumber,
        data: row,
        timestamp: row[0] || 'N/A'
      });
    } else {
      // Lần đầu gặp
      seen.set(key, {
        rowNumber: actualRowNumber,
        data: row,
        timestamp: row[0] || 'N/A'
      });
    }
  });
  
  return {
    duplicates: duplicates,
    total: duplicates.length,
    headers: headers
  };
}

/**
 * Tạo HTML cho dialog
 */
function createDuplicatesHTML(result, sheetName) {
  const duplicates = result.duplicates;
  const headers = result.headers;
  
  let tableRows = '';
  duplicates.forEach((dup, index) => {
    const rowData = dup.data.slice(0, 5).map(cell => {
      const str = String(cell);
      return str.length > 50 ? str.substring(0, 50) + '...' : str;
    }).join('</td><td>');
    
    tableRows += `
      <tr>
        <td><input type="checkbox" class="row-checkbox" data-row="${dup.rowNumber}" checked></td>
        <td>${dup.rowNumber}</td>
        <td>${dup.firstRowNumber}</td>
        <td>${dup.timestamp}</td>
        <td>${rowData}</td>
      </tr>
    `;
  });
  
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <base target="_top">
      <style>
        body {
          font-family: Arial, sans-serif;
          padding: 20px;
          margin: 0;
        }
        .header {
          margin-bottom: 20px;
          padding-bottom: 15px;
          border-bottom: 2px solid #1a73e8;
        }
        .header h2 {
          margin: 0 0 10px 0;
          color: #1a73e8;
        }
        .stats {
          background: #e8f0fe;
          padding: 15px;
          border-radius: 8px;
          margin-bottom: 20px;
        }
        .stats-item {
          display: inline-block;
          margin-right: 30px;
        }
        .stats-label {
          font-weight: bold;
          color: #1967d2;
        }
        .table-container {
          max-height: 350px;
          overflow-y: auto;
          border: 1px solid #ddd;
          border-radius: 4px;
        }
        table {
          width: 100%;
          border-collapse: collapse;
        }
        th {
          background: #f8f9fa;
          padding: 12px 8px;
          text-align: left;
          font-weight: bold;
          position: sticky;
          top: 0;
          border-bottom: 2px solid #ddd;
          z-index: 10;
        }
        td {
          padding: 10px 8px;
          border-bottom: 1px solid #eee;
          font-size: 13px;
        }
        tr:hover {
          background: #f5f5f5;
        }
        .actions {
          margin-top: 20px;
          padding-top: 15px;
          border-top: 1px solid #ddd;
          text-align: right;
        }
        button {
          padding: 10px 24px;
          margin-left: 10px;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-size: 14px;
          font-weight: 500;
        }
        .btn-delete {
          background: #d93025;
          color: white;
        }
        .btn-delete:hover {
          background: #b31412;
        }
        .btn-cancel {
          background: #f1f3f4;
          color: #5f6368;
        }
        .btn-cancel:hover {
          background: #e8eaed;
        }
        .btn-select {
          background: #1a73e8;
          color: white;
          padding: 6px 12px;
          font-size: 12px;
        }
        .btn-select:hover {
          background: #1967d2;
        }
        .loading {
          display: none;
          text-align: center;
          padding: 20px;
          color: #1a73e8;
        }
        .spinner {
          border: 3px solid #f3f3f3;
          border-top: 3px solid #1a73e8;
          border-radius: 50%;
          width: 40px;
          height: 40px;
          animation: spin 1s linear infinite;
          margin: 0 auto 10px;
        }
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        .warning {
          background: #fef7e0;
          border-left: 4px solid #f9ab00;
          padding: 12px;
          margin-bottom: 15px;
          border-radius: 4px;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h2>🗑️ Remove Duplicates</h2>
        <div>Sheet: <strong>${sheetName}</strong></div>
      </div>
      
      <div class="warning">
        ⚠️ <strong>Lưu ý:</strong> Các dòng được chọn sẽ bị xóa vĩnh viễn. Dòng đầu tiên xuất hiện sẽ được giữ lại.
      </div>
      
      <div class="stats">
        <div class="stats-item">
          <span class="stats-label">Tổng số dòng trùng lặp:</span>
          <span id="totalDuplicates">${duplicates.length}</span>
        </div>
        <div class="stats-item">
          <span class="stats-label">Đã chọn:</span>
          <span id="selectedCount">${duplicates.length}</span>
        </div>
        <div style="margin-top: 10px;">
          <button class="btn-select" onclick="selectAll()">✓ Chọn tất cả</button>
          <button class="btn-select" onclick="deselectAll()">✗ Bỏ chọn tất cả</button>
        </div>
      </div>
      
      <div class="table-container">
        <table>
          <thead>
            <tr>
              <th width="50">Xóa</th>
              <th width="80">Row #</th>
              <th width="100">First Row #</th>
              <th width="150">Timestamp</th>
              <th>Data Preview</th>
            </tr>
          </thead>
          <tbody>
            ${tableRows}
          </tbody>
        </table>
      </div>
      
      <div class="actions">
        <button class="btn-cancel" onclick="google.script.host.close()">Hủy</button>
        <button class="btn-delete" onclick="confirmDelete()">🗑️ Xóa các dòng đã chọn</button>
      </div>
      
      <div class="loading" id="loading">
        <div class="spinner"></div>
        <div>Đang xóa dữ liệu trùng lặp...</div>
      </div>
      
      <script>
        // Update selected count
        function updateSelectedCount() {
          const checkboxes = document.querySelectorAll('.row-checkbox:checked');
          document.getElementById('selectedCount').textContent = checkboxes.length;
        }
        
        // Select/Deselect all
        function selectAll() {
          document.querySelectorAll('.row-checkbox').forEach(cb => cb.checked = true);
          updateSelectedCount();
        }
        
        function deselectAll() {
          document.querySelectorAll('.row-checkbox').forEach(cb => cb.checked = false);
          updateSelectedCount();
        }
        
        // Listen to checkbox changes
        document.addEventListener('change', function(e) {
          if (e.target.classList.contains('row-checkbox')) {
            updateSelectedCount();
          }
        });
        
        // Confirm and delete
        function confirmDelete() {
          const checkboxes = document.querySelectorAll('.row-checkbox:checked');
          if (checkboxes.length === 0) {
            alert('Vui lòng chọn ít nhất 1 dòng để xóa');
            return;
          }
          
          const rowNumbers = Array.from(checkboxes).map(cb => parseInt(cb.dataset.row));
          
          if (!confirm('Bạn có chắc chắn muốn xóa ' + rowNumbers.length + ' dòng trùng lặp?\\n\\nHành động này không thể hoàn tác!')) {
            return;
          }
          
          // Show loading
          document.querySelector('.actions').style.display = 'none';
          document.getElementById('loading').style.display = 'block';
          
          // Call server function
          google.script.run
            .withSuccessHandler(onDeleteSuccess)
            .withFailureHandler(onDeleteFailure)
            .deleteDuplicateRows(rowNumbers);
        }
        
        function onDeleteSuccess(result) {
          alert('✅ Đã xóa thành công ' + result.deletedCount + ' dòng trùng lặp!');
          google.script.host.close();
        }
        
        function onDeleteFailure(error) {
          document.getElementById('loading').style.display = 'none';
          document.querySelector('.actions').style.display = 'block';
          alert('❌ Lỗi: ' + error.message);
        }
      </script>
    </body>
    </html>
  `;
}

/**
 * Xóa các dòng trùng lặp đã chọn
 */
function deleteDuplicateRows(rowNumbers) {
  try {
    const sheet = SpreadsheetApp.getActiveSheet();
    
    // Sort descending để xóa từ dưới lên (tránh index shift)
    rowNumbers.sort((a, b) => b - a);
    
    Logger.log('🗑️ Deleting ' + rowNumbers.length + ' duplicate rows...');
    
    rowNumbers.forEach(rowNumber => {
      sheet.deleteRow(rowNumber);
      Logger.log('Deleted row: ' + rowNumber);
    });
    
    Logger.log('✅ Successfully deleted ' + rowNumbers.length + ' rows');
    
    return {
      success: true,
      deletedCount: rowNumbers.length
    };
    
  } catch (error) {
    Logger.log('❌ Error deleting rows: ' + error.toString());
    throw error;
  }
}

/**
 * Thống kê dữ liệu (bonus feature)
 */
function showDataStats() {
  const sheet = SpreadsheetApp.getActiveSheet();
  const data = sheet.getDataRange().getValues();
  
  const totalRows = data.length - 3; // Bỏ qua headers
  const result = findDuplicates(sheet);
  
  const message = 
    '📊 THỐNG KÊ SHEET: ' + sheet.getName() + '\n\n' +
    '📝 Tổng số dòng dữ liệu: ' + totalRows + '\n' +
    '🗑️ Số dòng trùng lặp: ' + result.total + '\n' +
    '✅ Số dòng unique: ' + (totalRows - result.total);
  
  SpreadsheetApp.getUi().alert(message);
}

// ============================================
// HƯỚNG DẪN SỬ DỤNG:
// 1. Mở Google Sheet của bạn
// 2. Click Extensions > Apps Script
// 3. Tạo file mới (+ icon)
// 4. Copy toàn bộ code này vào
// 5. Đặt tên file: RemoveDuplicates.gs
// 6. Save (Ctrl+S)
// 7. Refresh Google Sheet (F5)
// 8. Menu "🛠️ GC Tools" sẽ xuất hiện
// 9. Click "🗑️ Remove Duplicates" để sử dụng
// ============================================
