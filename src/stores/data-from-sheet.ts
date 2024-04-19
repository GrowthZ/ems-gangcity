import axios from 'axios'

// Khai báo các thông tin cần thiết
const sheetId = '1rNBjkAxE0-F4V_YYj6fOJ6aRnHucugKNBGnA63c0o6U'
const apiKey = 'AIzaSyCIwuR3WozVRKnXk9sHn7qmqqc50eN7g-A'
const baseUrl = 'https://sheets.googleapis.com/v4/spreadsheets'

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

  return convertedData
}
