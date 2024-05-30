import { defineStore } from 'pinia'
import { sleep } from '../../services/utils'
import { Student } from './types'
import { fetchDataSheet } from '../../stores/data-from-sheet'

const fetchStudents = async () => {
  try {
    await sleep(1000)
    const data = await fetchDataSheet('DanhSach')
    console.log('Dữ liệu học viên 2:', data)
    return data
  } catch (error) {
    console.error('Lỗi khi lấy dữ liệu học viên:', error)
  }
}

export const useStudentData = defineStore({
  id: 'studentData',
  state: () => ({
    students: [] as any[],
    loading: false,
  }),
  getters: {
    allStudents: (state) => state.students,
  },
  actions: {
    async load() {
      this.loading = true
      this.students = await fetchStudents()
      this.loading = false
    },

    create(student: Student) {
      this.students.unshift(student)
    },

    update(student: Student) {
      const index = this.students.findIndex((existingStudent) => existingStudent.id === student.id)
      if (index !== -1) {
        this.students.splice(index, 1, student)
      }
    },
    remove(student: Student) {
      const index = this.students.findIndex((existingStudent) => existingStudent.id === student.id)
      if (index !== -1) {
        this.students.splice(index, 1)
      }
    },
  },
})
