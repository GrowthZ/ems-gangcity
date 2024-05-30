import { defineStore } from 'pinia'
import { fetchDataSheet } from './data-from-sheet'

const fetchData = async (sheetName: string) => {
  try {
    const data = await fetchDataSheet(sheetName)
    return data
  } catch (error) {
    console.error('Lỗi khi lấy dữ liệu:', error)
  }
}

export const useData = defineStore({
  id: 'data',
  state: () => ({
    data: [] as any[],
    anotherData: [] as any[],
    loading: false,
    currentPage: 1,
    pageSize: 10,
    isPaginationVisible: true,
    filter: '',
    filteredData: [] as any[],
  }),

  getters: {
    allData: (state) => state.data,
    allAnotherData: (state) => state.anotherData,
    totalPages: (state): number => Math.ceil(state.filteredData.length / state.pageSize),
    paginateItems: (state): any[] => {
      const startIndex = (state.currentPage - 1) * state.pageSize
      const endIndex = startIndex + state.pageSize
      state.isPaginationVisible = Math.ceil(state.filteredData.length / state.pageSize) > 1
      return state.filteredData.slice(startIndex, endIndex)
    },
  },

  actions: {
    async load(sheetName: string, anotherSheetName: [] = []) {
      this.loading = true
      this.data = await fetchData(sheetName)
      if (anotherSheetName.length > 0) {
        this.anotherData = await Promise.all(
          anotherSheetName.map(async (sheetNameAnother: string) => {
            return await fetchData(sheetNameAnother)
          }),
        )
      }
      this.filteredData = [...this.data]
      this.loading = false
    },

    async add(data: any) {
      this.loading = true
      this.data.unshift(data)
      this.filteredData = [...this.data]
      this.loading = false
    },

    setCurrentPage(page: number) {
      this.currentPage = page // Sử dụng action để cập nhật currentPage
    },

    setFilterData() {
      if (this.filter != '') {
        this.filteredData = this.data.filter((item: any) => {
          for (const value of Object.values(item)) {
            const stringValue = removeVietnameseAccent(String(value).toLowerCase())
            const filterValue = removeVietnameseAccent(this.filter.toLowerCase())
            if (stringValue.includes(filterValue)) {
              return true
            }
          }
          // Nếu không có bất kỳ giá trị thuộc tính nào khớp, loại bỏ object này
          return false
        })
      } else {
        this.filteredData = this.data
      }
    },
  },
})

// Hàm loại bỏ dấu tiếng Việt và chuyển đổi chuỗi thành chữ thường
function removeVietnameseAccent(str: string): string {
  return str
    .normalize('NFD') // Chuẩn hóa Unicode Decomposition Form (NFD)
    .replace(/[\u0300-\u036f]/g, '') // Loại bỏ các ký tự dấu
    .toLowerCase() // Chuyển đổi thành chữ thường
}
