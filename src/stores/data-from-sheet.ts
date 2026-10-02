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
  // 1. Ưu tiên clientRequestId nếu caller đã định danh trước phiên thao tác
  if (param && typeof param === 'object' && param.clientRequestId) {
    return `${action}_${param.clientRequestId}`.replace(/[^a-zA-Z0-9_]/g, '')
  }

  // 2. Với các thao tác ghi dữ liệu có nghiệp vụ (học sinh, ngày, tiền, buổi):
  // Tạo key ổn định trong khung thời gian 2 phút để ngăn người dùng click nhiều lần
  if (param && typeof param === 'object') {
    const code = param.studentCode || param.code || ''
    const date = param.datePayment || param.date || ''
    const amount = param.money || ''
    const lesson = param.lesson || ''
    const timeBucket = Math.floor(Date.now() / 120000) // Khung 2 phút
    if (code) {
      return `${action}_${code}_${date}_${amount}_${lesson}_${timeBucket}`.replace(/[^a-zA-Z0-9_]/g, '')
    }
  }

  // 3. Fallback
  const timestamp = Date.now()
  const random = Math.random().toString(36).substring(7)
  const paramStr = JSON.stringify(param || '')
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
  cleanDuplicatePayments: 'cleanDuplicatePayments',
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

// Map quản lý các request đang gửi dở (in-flight) để chống gửi trùng lặp
const inFlightRequests = new Map<string, Promise<SendRequestResult>>()

/**
 * IMPROVED: Send request to Apps Script with idempotency key to prevent duplicates
 *
 * ✅ Ưu điểm:
 * - Tránh duplicate rows với idempotency key
 * - Tự động tái sử dụng request đang pending nếu bị gọi trùng lặp (in-flight deduplication)
 * - Retry logic thông minh - giữ nguyên key khi retry
 * - Timeout hợp lý
 *
 * Chỉ sử dụng Apps Script cho WRITE operations
 * READ operations sử dụng API v4 (fetchDataSheet)
 */
export const sendRequest = async (action: string, param: any): Promise<SendRequestResult> => {
  const idempotencyKey = generateIdempotencyKey(action, param)

  // Nếu cùng action và idempotencyKey đang có một request chạy, tái sử dụng Promise cũ
  if (inFlightRequests.has(idempotencyKey)) {
    console.log(`⚠️ Request trùng đang được xử lý (key: ${idempotencyKey}), dùng chung kết quả in-flight`)
    return inFlightRequests.get(idempotencyKey)!
  }

  const reqPromise = _doSendRequest(action, param, idempotencyKey).finally(() => {
    inFlightRequests.delete(idempotencyKey)
  })

  inFlightRequests.set(idempotencyKey, reqPromise)
  return reqPromise
}

const _doSendRequest = async (
  action: string,
  param: any,
  idempotencyKey: string,
): Promise<SendRequestResult> => {
  try {
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
      // ✅ FIX: Retry với CÙNG idempotency key để server nhận ra request đã xử lý
      return _doSendRequest(action, param, idempotencyKey)
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
