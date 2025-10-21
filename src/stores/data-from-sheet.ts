import axios from 'axios'
import { useToast } from 'vuestic-ui'

// Khai báo các thông tin cần thiết
// Sử dụng env variables để dễ quản lý
const sheetId = import.meta.env.VITE_GOOGLE_SHEET_ID || '1HhIpXU6Egq9MZmyCAvPnEjCT8V4n9soD7EY4LQ8Nt0w'
const apiKey = import.meta.env.VITE_GOOGLE_SHEETS_API_KEY || 'AIzaSyC9NlfiP4qs-Hfaej4RpmxxWXRcAoKM7ao'
const baseUrl = 'https://sheets.googleapis.com/v4/spreadsheets'

// Apps Script URL - CHỈ dùng cho GHI/CẬP NHẬT dữ liệu
// ĐỌC dữ liệu sẽ dùng API v4 (nhanh hơn và không tốn quota Apps Script)
const scriptUrl =
  import.meta.env.VITE_APPS_SCRIPT_URL ||
  'https://script.google.com/macros/s/AKfycby0_EvfFeMRcRkelOS6qP_tEoD7wWYxyxDmYNv4Vv_vmXnebYYGXWipSerivXuPdYY/exec'

// Tạo một Axios instance để gửi các yêu cầu HTTP
const axiosInstance = axios.create()
const { init: notify } = useToast()
const delay = (ms: any) => new Promise((resolve) => setTimeout(resolve, ms))

/**
 * Generate idempotency key to prevent duplicate operations
 */
function generateIdempotencyKey(action: string, param: any): string {
  const timestamp = Date.now()
  const random = Math.random().toString(36).substring(7)
  // Create a simple hash from param (first 20 chars)
  const paramStr = JSON.stringify(param)
  const paramHash = paramStr.substring(0, Math.min(20, paramStr.length))
  return `${action}_${timestamp}_${random}_${paramHash.replace(/[^a-zA-Z0-9]/g, '')}`
}

/**
 * ĐỌC dữ liệu từ Google Sheets sử dụng API v4
 *
 * ✅ Ưu điểm:
 * - Nhanh hơn Apps Script
 * - Không tốn quota Apps Script
 * - Không cần deploy Apps Script khi thay đổi
 * - Free với API key
 *
 * @param sheetName - Tên sheet cần đọc
 * @returns Promise với array of objects
 */
export async function fetchDataSheet(sheetName: string): Promise<any> {
  try {
    console.log(`📖 Đọc dữ liệu từ sheet "${sheetName}" qua API v4...`)

    // Tạo URL để lấy dữ liệu từ sheet cụ thể
    const sheetUrl = `${baseUrl}/${sheetId}/values/${sheetName}?key=${apiKey}`

    // Gửi yêu cầu GET để lấy dữ liệu từ sheet
    const response = await axiosInstance.get(sheetUrl, {
      timeout: 15000, // 15 seconds timeout
    })

    const data = convertData(response.data.values)
    console.log(`✅ Đọc thành công ${data.length} rows từ "${sheetName}"`)

    return data
  } catch (error: any) {
    console.error(`❌ Lỗi khi đọc dữ liệu từ sheet "${sheetName}":`, error)

    // Retry logic cho read operations
    if (error?.response?.status === 429) {
      console.log('⏳ Quá nhiều requests, đợi 2 giây và thử lại...')
      await delay(2000)
      return fetchDataSheet(sheetName)
    }

    // Return empty array on error để không break app
    return []
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
  updatePayment: 'updatePayment',
  deletePayment: 'deletePayment',
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

/**
 * IMPROVED: Send request to Apps Script with idempotency key to prevent duplicates
 *
 * ✅ Ưu điểm:
 * - Tránh duplicate rows với idempotency key
 * - Retry logic thông minh
 * - Timeout hợp lý
 *
 * Chỉ sử dụng Apps Script cho WRITE operations
 * READ operations sử dụng API v4 (fetchDataSheet)
 */
export const sendRequest = async (action: string, param: any): Promise<SendRequestResult> => {
  try {
    const idempotencyKey = generateIdempotencyKey(action, param)
    const paramString = typeof param === 'string' ? param : JSON.stringify(param)

    console.log(`🚀 Gửi request với action: ${action}, key: ${idempotencyKey}`)

    const response = await axiosInstance.get(
      `${scriptUrl}?action=${action}&param=${paramString}&key=${idempotencyKey}`,
      {
        timeout: 30000, // 30 seconds timeout
      },
    )

    console.log(`✅ Response từ Apps Script:`, response.data)

    return {
      status: 'success',
      data: response.data,
    }
  } catch (error: any) {
    console.error('❌ Lỗi khi gửi request:', error)

    // Retry logic với exponential backoff
    if (error?.response?.status === 429 || error?.code === 'ECONNABORTED') {
      console.log('⏳ Đang thử lại sau 2 giây...')
      await delay(2000)
      // Retry with same idempotency key
      return sendRequest(action, param)
    }

    return {
      status: 'error',
      error: error?.message || error,
    }
  }
}

export const showMessageBox = (message: string, color: string) => {
  notify({
    message: message,
    color: color,
  })
}
