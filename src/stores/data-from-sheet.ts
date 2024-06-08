import axios from 'axios'

// Khai báo các thông tin cần thiết
const sheetId = '1rNBjkAxE0-F4V_YYj6fOJ6aRnHucugKNBGnA63c0o6U'
const apiKey = 'AIzaSyCIwuR3WozVRKnXk9sHn7qmqqc50eN7g-A'
const baseUrl = 'https://sheets.googleapis.com/v4/spreadsheets'
const scriptUrl =
  'https://script.google.com/macros/s/AKfycby0_EvfFeMRcRkelOS6qP_tEoD7wWYxyxDmYNv4Vv_vmXnebYYGXWipSerivXuPdYY/exec'

// Tạo một Axios instance để gửi các yêu cầu HTTP
const axiosInstance = axios.create()

export async function fetchDataSheet(sheetName: string): Promise<any> {
  try {
    // Tạo URL để lấy dữ liệu từ sheet cụ thể
    const sheetUrl = `${baseUrl}/${sheetId}/values/${sheetName}?key=${apiKey}`

    // Gửi yêu cầu GET để lấy dữ liệu từ sheet
    const response = await axiosInstance.get(sheetUrl)
    const data = convertData(response.data.values)
    console.log(`Dữ liệu từ sheet "${sheetName}" đã được lưu vào file`)
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
  teacher: 'GiaoVien',
  calendar: 'LichDay',
  group: 'LopHoc2',
  location: 'CoSo',
  attendance: 'DiemDanh',
}

export const Action = {
  markAttendance: 'markAttendance',
  updateAttendance: 'updateAttendance',
  getAttendance: 'getAttendance',
}

export const sendRequest = async (action: string, param: string) => {
  try {
    const response = await axiosInstance.get(`${scriptUrl}?action=${action}&param=${JSON.stringify(param)}`)
    console.log(`Dữ liệu đã được thêm vào sheet`)
    return {
      status: 'success',
      data: response.data,
    }
  } catch (error) {
    console.error('Lỗi khi thêm dữ liệu:', error)
    return {
      status: 'error',
      error: error.message,
    }
  }
}
