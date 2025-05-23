import axios from 'axios'
import { useToast } from 'vuestic-ui'

// Khai báo các thông tin cần thiết
const sheetId = '1HhIpXU6Egq9MZmyCAvPnEjCT8V4n9soD7EY4LQ8Nt0w'
const apiKey = 'AIzaSyC9NlfiP4qs-Hfaej4RpmxxWXRcAoKM7ao'
const baseUrl = 'https://sheets.googleapis.com/v4/spreadsheets'
const scriptUrl =
  'https://script.google.com/macros/s/AKfycby0_EvfFeMRcRkelOS6qP_tEoD7wWYxyxDmYNv4Vv_vmXnebYYGXWipSerivXuPdYY/exec'

// Tạo một Axios instance để gửi các yêu cầu HTTP
const axiosInstance = axios.create()
const { init: notify } = useToast()
const delay = (ms: any) => new Promise((resolve) => setTimeout(resolve, ms))

export async function fetchDataSheet(sheetName: string): Promise<any> {
  try {
    // Tạo URL để lấy dữ liệu từ sheet cụ thể
    const sheetUrl = `${baseUrl}/${sheetId}/values/${sheetName}?key=${apiKey}`

    // Gửi yêu cầu GET để lấy dữ liệu từ sheet
    const response = await axiosInstance.get(sheetUrl)
    const data = convertData(response.data.values)
    // console.log(`Dữ liệu từ sheet "${sheetName}" đã được lưu vào file`)
    return data
  } catch (error) {
    console.error(`Lỗi khi lấy dữ liệu từ sheet "${sheetName}":`, error)
  }
}

function convertData(data: any[][]): any[] {
  const headers = data[2]
  const convertedData = []

  for (let i = 3; i < data.length; i++) {
    const obj: any = {}
    for (let j = 0; j < headers.length; j++) {
      obj[headers[j]] = data[i][j]
    }
    convertedData.push(obj)
  }
  return reverseArray(convertedData)
}

function reverseArray(array: string | any[]) {
  const reversedArray = []
  for (let i = array.length - 1; i >= 0; i--) {
    reversedArray.push(array[i])
  }
  return reversedArray
}

export const DataSheet = {
  student: 'DanhSach',
  followStudent: 'KiemSoatBuoiHoc',
  payment: 'DongHoc',
  lessonUpdate: 'DieuChinh',
  teacher: 'GiaoVien',
  calendar: 'LichDay',
  group: 'LopHoc',
  location: 'CoSo',
  attendance: 'DiemDanh',
  attendaceDetail: 'DiemDanhChiTiet',
  attendanceMissing: 'DiemDanhNghi',
  tkb: 'TKB',
  studentUpdateMonth: 'DieuChinhTheoQuyDinh',
}

export const Action = {
  login: 'login',
  markAttendance: 'markAttendance',
  updateAttendance: 'updateAttendance',
  getMarkedStudents: 'getMarkedStudents',
  changeTeacher: 'changeTeacherOfCalendar',
  updateStudentMissing: 'updateStudentMissing',
  createCalendars: 'createCalendars',
  createPayment: 'createPayment',
  updateLesson: 'updateLesson',
  newStudent: 'newStudent',
  updateStudent: 'updateStudent',
  updateStudentByMonth: 'updateStudentByMonth',
}

interface SendRequestResult {
  status: string
  data?: any
  error?: any
}

export const sendRequest = async (action: string, param: string): Promise<SendRequestResult> => {
  try {
    console.log(`Gửi dữ liệu đến Google Apps Script với action: ${action} và param: ${JSON.stringify(param)}`)
    const response = await axiosInstance.get(`${scriptUrl}?action=${action}&param=${JSON.stringify(param)}`)
    console.log(`Dữ liệu đã được gửi đến Google Apps Script`, response.data)
    console.log(`Dữ liệu đã được thêm vào sheet`)
    return {
      status: 'success',
      data: response.data,
    }
  } catch (error: any) {
    console.error('Lỗi khi thêm dữ liệu:', error)
    if (error && error.response.status === 429) {
      console.log('Too many requests, retrying...')
      await delay(1000) // Chờ 1 giây trước khi gửi lại yêu cầu
      return sendRequest(action, param)
    }

    return {
      status: 'error',
      error: error,
    }
  }
}

export const showMessageBox = (message: string, color: string) => {
  notify({
    message: message,
    color: color,
  })
}
