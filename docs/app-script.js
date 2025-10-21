// Code.gs
let spreadsheetId_Data = '1HhIpXU6Egq9MZmyCAvPnEjCT8V4n9soD7EY4LQ8Nt0w'
let sheetData = SpreadsheetApp.openById(spreadsheetId_Data)

var actionHandlers = {
  login: login,
  addData: addData,
  markAttendance: markAttendance,
  getMarkedStudents: getMarkedStudents,
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

let sheetName = {
  student: 'DanhSach',
  studentFollow: 'KiemSoatBuoiHoc',
  attendance: 'DiemDanh',
  attendanceDetail: 'DiemDanhChiTiet',
  calendar: 'LichDay',
  attendanceMissing: 'DiemDanhNghi',
  payment: 'DongHoc',
  lessonUpdate: 'DieuChinh',
  studentMonthUpdate: 'DieuChinhTheoQuyDinh',
  user: 'TaiKhoan',
}

let dataType = {
  user: 'user',
  student: 'student',
  teacher: 'teacher',
}

function doGet(e) {
  return handleRequest(e)
}

function handleRequest(e) {
  let action = e.parameter.action
  let param = e.parameter.param

  let data = {
    message: 'success',
    data: {},
  }
  // Kiểm tra xem action có tồn tại trong actionHandlers không
  if (actionHandlers.hasOwnProperty(action)) {
    if (param != undefined && param != '') {
      // Nếu có param, gọi hàm tương ứng với action và param
      data.data = actionHandlers[action](param)
    } else {
      // Nếu không có param, gọi hàm tương ứng với action không có param
      data.data = actionHandlers[action]()
    }
    return ContentService.createTextOutput(JSON.stringify(data)).setMimeType(ContentService.MimeType.JSON)
  } else {
    data.message = 'error'
    // Trả về thông báo lỗi nếu action không hợp lệ
    return ContentService.createTextOutput('Unknown action').setMimeType(ContentService.MimeType.TEXT)
  }
}

function getSheet(name) {
  return sheetData.getSheetByName(name)
}

function addData(dataJson) {
  let sheet = getSheet('Data')
  let data = JSON.parse(dataJson)
  let arrData = [data.id, data.username, data.email]

  sheet.appendRow(arrData)
  return arrData
}

// Attendance.gs
function markAttendance(dataJson) {
  let sheetDetail = getSheet(sheetName.attendanceDetail)
  let sheetMiss = getSheet(sheetName.attendanceMissing)
  let arrData = JSON.parse(dataJson)
  let studentMarks = arrData.studentMarks
  let studentMissing = arrData.studentMissings
  studentMarks.forEach((item) => {
    sheetDetail.appendRow(item)
  })
  studentMissing.forEach((item) => {
    sheetMiss.appendRow(item)
  })
  createMarkAttendance(arrData.calendar)
  updateStatusCalendar(arrData.code)
  return arrData
}

function getMarkedStudents(dataJson) {
  let code = JSON.parse(dataJson)
  let sheet = getSheet(sheetName.attendanceDetail)
  let data = sheet.getDataRange().getValues()
  let rowAttendanced = data.filter((row) => row[0] == code)
  return rowAttendanced
}

function updateAttendance(dataJson) {
  let arrData = JSON.parse(dataJson)
  let code = arrData.code
  deleteOldAttendance(code, sheetName.attendanceDetail)
  deleteOldAttendance(code, sheetName.attendanceMissing)
  markAttendance(dataJson)
  return arrData
}

function createMarkAttendance(calendar) {
  let sheetAttendance = getSheet(sheetName.attendance)
  let data = sheetAttendance.getDataRange().getValues()
  let isExist = data.some((row) => row[0] == calendar.attendanceCode)
  if (isExist) return
  let attendance = [calendar.attendanceCode, calendar.dateTime, calendar.group, calendar.teacher, calendar.subTeacher]
  sheetAttendance.appendRow(attendance)
  const newRow = sheetAttendance.getLastRow()
  const formulaTeacher = `=IFERROR(VLOOKUP(A${newRow}, ${sheetName.calendar}!A:E, 5, FALSE), "")`
  const formulaSubTeacher = `=IFERROR(VLOOKUP(A${newRow}, ${sheetName.calendar}!A:F, 6, FALSE), "")`
  const formulaSalary = `=IF(F${newRow} = 0, 0, IF(F${newRow} <= 12, 150000, IF(F${newRow} <= 14, 170000, 200000)))+IF(K${newRow} = "Gang Thép", 20000, 0)`
  const formulaSubSalary = `=IF(E${newRow} <> "", 50000, 0)`
  const formulaTotalMain = `=IF(A${newRow} <> "", COUNTIFS(DiemDanhChiTiet!A:A, A${newRow}, DiemDanhChiTiet!E:E, C${newRow}), 0)`
  const formulaTotalSub = `=IF(A${newRow} <> "", COUNTIFS(DiemDanhChiTiet!A:A, A${newRow}, DiemDanhChiTiet!E:E, "<>"&C${newRow}), 0)`
  const formulaTotal = `=SUM(G${newRow}+H${newRow})`
  const fomulaLocation = `=XLOOKUP(TRIM(C${newRow}), LopHoc!$B$4:$B$100, LopHoc!$A$4:$A$100, "Không tìm thấy")`
  sheetAttendance.getRange(`D${newRow}`).setFormula(formulaTeacher)
  sheetAttendance.getRange(`E${newRow}`).setFormula(formulaSubTeacher)
  sheetAttendance.getRange(`G${newRow}`).setFormula(formulaTotalMain)
  sheetAttendance.getRange(`H${newRow}`).setFormula(formulaTotalSub)
  sheetAttendance.getRange(`F${newRow}`).setFormula(formulaTotal)
  sheetAttendance.getRange(`I${newRow}`).setFormula(formulaSalary)
  sheetAttendance.getRange(`J${newRow}`).setFormula(formulaSubSalary)
  sheetAttendance.getRange(`K${newRow}`).setFormula(fomulaLocation)
}

function deleteOldAttendance(code, nameSheet) {
  let sheet = getSheet(nameSheet)
  let data = sheet.getDataRange().getValues()
  let rowsToDelete = []
  for (let i = data.length - 1; i >= 0; i--) {
    var row = data[i]
    if (row[0] == code) {
      rowsToDelete.push(i + 1) // Vì index của dòng trong Google Sheets bắt đầu từ 1
    }
  }
  rowsToDelete.forEach(function (rowIndex) {
    sheet.deleteRow(rowIndex)
  })
}

function changeTeacherOfCalendar(dataJson) {
  let sheet = getSheet(sheetName.calendar)
  let data = sheet.getDataRange().getValues()
  let arrData = JSON.parse(dataJson)
  let code = arrData[0]
  let teacher = arrData[1]
  let subTeacher = arrData[2]

  for (let i = 0; i < data.length; i++) {
    if (data[i][0] == code) {
      sheet.getRange(i + 1, 5).setValue(teacher)
      sheet.getRange(i + 1, 6).setValue(subTeacher)
      return data[i]
    }
  }
}

function updateStudentMissing(dataJson) {
  let sheet = getSheet(sheetName.attendanceMissing)
  let data = sheet.getDataRange().getValues()
  let objData = JSON.parse(dataJson)
  for (let i = 0; i < data.length; i++) {
    if (data[i][0] == objData.attendanceCode && data[i][1] == objData.studentCode) {
      sheet.getRange(i + 1, 7).setValue(objData.status)
      sheet.getRange(i + 1, 8).setValue(objData.note)
      return data[i]
    }
  }
}
// Auth.gs
function login(dataJson) {
  let sheet = getSheet(sheetName.user)
  let data = sheet.getDataRange().getValues()
  let objData = JSON.parse(dataJson)
  const now = new Date()
  const token = now.getTime().toString(36)
  for (let i = 2; i < data.length; i++) {
    if (data[i][0] == objData.username && data[i][1] == objData.password) {
      sheet.getRange(i + 1, 3).setValue(token)
      return {
        username: objData.username,
        role: data[i][3],
        token: token,
      }
    }
  }
  return ''
}
// Calendar.gs
function createCalendars(dataJson) {
  let sheet = getSheet(sheetName.calendar)
  let calendars = JSON.parse(dataJson)
  let rows = calendars.map((item) => [
    item.attendanceCode,
    item.dateTime,
    item.location,
    item.group,
    item.teacher,
    item.subTeacher,
    item.startTime,
    item.endTime,
    item.attendanceTime,
    item.note,
    item.status,
  ])
  rows.forEach((item) => {
    sheet.appendRow(item)
  })
  return rows
}

function updateStatusCalendar(code) {
  let sheet = getSheet(sheetName.calendar)
  let data = sheet.getDataRange().getValues()
  for (let i = 0; i < data.length; i++) {
    if (data[i][0] == code) {
      sheet.getRange(i + 1, 11).setValue('1')
      return data[i]
    }
  }
}
// Payment.gs
function createPayment(dataJson) {
  let sheet = getSheet(sheetName.payment)
  let item = JSON.parse(dataJson)
  let newPayment = [item.studentCode, item.studentName, item.datePayment, item.type, item.money, item.lesson, item.note]
  sheet.appendRow(newPayment)
  return newPayment
}

function updateLesson(dataJson) {
  let sheet = getSheet(sheetName.lessonUpdate)
  let item = JSON.parse(dataJson)
  let newUpdate = [item.studentCode, item.studentName, item.datePayment, item.lesson, item.note]
  sheet.appendRow(newUpdate)
  return newUpdate
}

// Student.gs
function newStudent(dataJson) {
  let sheet = getSheet(sheetName.student)
  let item = JSON.parse(dataJson)
  let student = [
    item.code,
    item.location,
    item.fullname,
    item.nickname,
    item.group,
    item.gender,
    item.birthday,
    item.phoneNumber,
    item.dateStart,
    item.status,
    item.note,
  ]
  sheet.appendRow(student)
  createStudentFollow(item)
  return student
}

function updateStudent(dataJson) {
  let sheet = getSheet(sheetName.student)
  let data = sheet.getDataRange().getValues()

  let item = JSON.parse(dataJson)
  let student = [
    item.code,
    item.location,
    item.fullname,
    item.nickname,
    item.group,
    item.gender,
    item.birthday,
    item.phoneNumber,
    item.dateStart,
    item.status,
    item.note,
  ]
  let rowIndex = -1
  for (let i = 0; i < data.length; i++) {
    if (data[i][0] === item.code) {
      // Giả sử cột code là cột đầu tiên (index 0)
      rowIndex = i + 1 // Google Sheets sử dụng chỉ số hàng bắt đầu từ 1
      break
    }
  }
  // Nếu tìm thấy hàng, cập nhật giá trị
  if (rowIndex > -1) {
    let range = sheet.getRange(rowIndex, 1, 1, student.length)
    range.setValues([student])
  } else {
    // Nếu không tìm thấy hàng, thêm hàng mới
    sheet.appendRow(student)
  }
  return student
}

function createStudentFollow(student) {
  let sheet = getSheet(sheetName.studentFollow)
  let data = sheet.getDataRange().getValues()
  let isExist = data.some((row) => row[0] == student.code)
  if (isExist) return
  let studentFollow = [student.code]
  sheet.appendRow(studentFollow)
  const newRow = sheet.getLastRow()
  const formulaFullName = `=IFERROR(VLOOKUP(A${newRow}, ${sheetName.student}!A:C, 3, FALSE), "")`
  const formulaGroup = `=IFERROR(VLOOKUP(A${newRow}, ${sheetName.student}!A:E, 5, FALSE), "")`
  const formulaDongHoc = `=COUNTIF(${sheetName.payment}!A:A, A${newRow})`
  const formulaTong = `=ARRAYFORMULA(SUMIFS(${sheetName.payment}!$F$4:F, ${sheetName.payment}!$A$4:A, A${newRow}) + SUMIFS(${sheetName.lessonUpdate}!$D$4:D, ${sheetName.lessonUpdate}!$A$4:A, A${newRow}))`
  const formulaDaHoc = `=COUNTIF(${sheetName.attendanceDetail}!B:B, A${newRow})`
  const formulaConLai = `=E${newRow}-F${newRow}`

  sheet.getRange(`B${newRow}`).setFormula(formulaFullName)
  sheet.getRange(`C${newRow}`).setFormula(formulaGroup)
  sheet.getRange(`D${newRow}`).setFormula(formulaDongHoc)
  sheet.getRange(`E${newRow}`).setFormula(formulaTong)
  sheet.getRange(`F${newRow}`).setFormula(formulaDaHoc)
  sheet.getRange(`G${newRow}`).setFormula(formulaConLai)
}

function updateStudentByMonth(dataJson) {
  let sheet = getSheet(sheetName.studentMonthUpdate)
  let items = JSON.parse(dataJson).data
  items.forEach((item) => {
    let newUpdate = [item.location, item.studentCode, item.studentName, item.dateUpdate, item.lesson, item.note]
    sheet.appendRow(newUpdate)
  })
  return items
}
