<template>
  <div class="flex justify-between items-center mb-6">
    <div>
      <h1 class="page-title">Bảng lương</h1>
    </div>
  </div>
  <SectionTeacher :data="filteredItems" />
  <VaCard>
    <VaCardContent>
      <div>
        <VaCollapse header="Bộ lọc nâng cao" icon="mso-filter_alt" class="custom-collapse">
          <div class="grid md:grid-cols-5 xs:grid-cols-2 gap-4 mb-6">
            <!-- <VaInput v-model="filter" placeholder="Tìm kiếm..." class="w-full">
            <template #prependInner>
              <VaIcon name="search" color="secondary" size="small" />
            </template>
          </VaInput> -->
            <VaSelect
              v-model="selectedYear"
              label="Năm"
              placeholder="Chọn năm"
              :options="uniqueYears"
              value-by="value"
            />
            <VaSelect
              v-model="selectedMonth"
              label="Tháng"
              placeholder="Chọn tháng"
              :options="uniqueMonths"
              value-by="value"
            />
            <VaSelect
              v-model="selectedGroup"
              label="Lớp học"
              placeholder="Chọn lớp"
              :options="uniqueGroups"
              value-by="value"
            />
            <VaSelect
              v-if="isManager"
              v-model="selectedTeacher"
              label="Giáo viên"
              placeholder="Chọn giáo viên"
              :options="uniqueTeachers"
              value-by="value"
            />
            <VaSelect
              v-if="isManager"
              v-model="selectedSubTeacher"
              label="Trợ giảng"
              placeholder="Chọn trợ giảng"
              :options="uniqueTeachers"
              value-by="value"
            />
          </div>
        </VaCollapse>
        <VaDataTable
          v-if="!loading"
          animation="fade-in-up"
          class="va-data-table"
          :items="paginateItems"
          :columns="columns"
          :filter="filter"
          :loading="loading"
          :filter-method="customFilteringFn"
          no-data-html="Không có dữ liệu"
          @filtered="updateFilteredCount"
        >
          <template #cell(teacher)="{ value }">
            <div size="small" class="font-bold text-primary">
              {{ value ? value : 'Chưa có' }}
            </div>
          </template>
          <template #cell(subTeacher)="{ value }">
            <div size="small" :class="value ? 'text-info' : 'text-secondary opacity-70'">
              {{ value ? value : 'Chưa có' }}
            </div>
          </template>
        </VaDataTable>
        <div v-if="!loading" class="flex justify-between items-center mb-6">
          <div color="info" class="pt-3">
            Tổng số:
            <strong>{{ filteredItems.length }}</strong>
          </div>
          <div>
            <VaPagination
              v-if="isPaginationVisible"
              v-model="currentPage"
              :pages="totalPages"
              :visible-pages="3"
              buttons-preset="secondary"
              active-page-color="primary"
              gapped
              class="pagination"
            />
          </div>
        </div>
      </div>
    </VaCardContent>
  </VaCard>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useData } from '../../stores/use-data'
import { DataSheet } from '../../stores/data-from-sheet'
import { sleep } from '../../services/utils'
import SectionTeacher from './widgets/SectionTeacher.vue'

const filter = ref('')
const filterByFields = ref([])
const filteredCount = ref(0)
const date = new Date()
const month = date.getMonth() + 1
const year = date.getFullYear()
const selectedGroup = ref('')
const selectedTeacher = ref('')
const selectedSubTeacher = ref('')
const selectedMonth = ref(month)
const selectedYear = ref(year)
const pageSize = 10 // Số lượng mục trên mỗi trang
const currentPage = ref(1) // Trang hiện tại

const data = useData()

const items = computed(() => data.allData)
const anotherData = computed(() => data.anotherData)
const loading = computed(() => data.loading)
const teachers = ref([])

data.load(DataSheet.attendance, [DataSheet.teacher])

const user = JSON.parse(localStorage.getItem('user') || '{}')

const isManager = user.role === 'manager' || user.role === 'admin'
const isTeacher = user.role === 'teacher'

watch(anotherData, (newData) => {
  if (newData) {
    teachers.value = newData[0]
  }
})

const columns = [
  { key: 'dateTime', sortable: true, label: 'Ngày' },
  { key: 'group', sortable: true, label: 'Lớp' },
  { key: 'teacher', sortable: true, label: 'Giáo viên' },
  { key: 'subTeacher', sortable: true, label: 'Trợ giảng' },
  { key: 'total', label: 'Sĩ số' },
  { key: 'salary', label: 'Lương GV' },
  { key: 'subSalary', label: 'Lương phụ' },
]

const uniqueGroups = computed(() => {
  // Tạo danh sách các giá trị duy nhất của cột group
  const groups = new Set(items.value.map((item) => item.group))
  const uniqueGroupsArray = Array.from(groups).map((group) => ({ value: group, text: group }))
  uniqueGroupsArray.unshift({ value: '', text: 'Tất cả' })
  return items.value ? uniqueGroupsArray : []
})

const uniqueTeachers = computed(() => {
  // Tạo danh sách các giá trị duy nhất của cột teacher
  // const teachers = new Set(items.value.map((item) => item.teacher))
  const teachersOption = teachers.value.map((teacher) => teacher)
  const uniqueTeachersArray = Array.from(teachersOption).map((teacher) => ({
    value: teacher.nickname,
    text: teacher.nickname,
  }))
  uniqueTeachersArray.unshift({ value: '', text: 'Tất cả' })
  return items.value ? uniqueTeachersArray : []
})

const uniqueMonths = computed(() => {
  const months = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]
  const uniqueArrayMonth = months.map((month) => ({
    value: month,
    text: 'Tháng ' + month.toString(),
  }))
  uniqueArrayMonth.unshift({ value: '', text: 'Tất cả' })
  return items.value ? uniqueArrayMonth : []
})

const uniqueYears = computed(() => {
  // Tạo danh sách các năm duy nhất từ dữ liệu
  const years = new Set()
  items.value.forEach((item) => {
    if (item?.dateTime) {
      const itemYear = parseInt(item.dateTime.split('/')[2], 10)
      if (!isNaN(itemYear)) {
        years.add(itemYear)
      }
    }
  })

  // Nếu không có dữ liệu, sử dụng năm hiện tại và 2 năm trước
  if (years.size === 0) {
    const currentYear = new Date().getFullYear()
    years.add(currentYear)
    years.add(currentYear - 1)
    years.add(currentYear - 2)
  }

  const uniqueYearsArray = Array.from(years)
    .sort((a, b) => b - a)
    .map((year) => ({
      value: year,
      text: year.toString(),
    }))
  uniqueYearsArray.unshift({ value: '', text: 'Tất cả' })
  return uniqueYearsArray
})

const filteredItems = computed(() => {
  return items.value.filter((item) => {
    // const isAllSelected = selectedGroup.value === ''
    // if (!isAllSelected) {
    //   if (item?.group !== selectedGroup.value) {
    //     return false
    //   }
    // }

    const isGroupSelected = selectedGroup.value !== ''
    const isTeacherSelected = selectedTeacher.value !== ''
    const isMonthSelected = selectedMonth.value !== ''
    const isYearSelected = selectedYear.value !== ''

    if (isGroupSelected && item?.group !== selectedGroup.value) {
      return false
    }

    if (isTeacherSelected && item?.teacher !== selectedTeacher.value) {
      return false
    }

    if (selectedSubTeacher.value && item?.subTeacher !== selectedSubTeacher.value) {
      return false
    }

    if (isMonthSelected) {
      if (item?.dateTime) {
        const itemMonth = parseInt(item.dateTime.split('/')[1], 10)
        if (itemMonth != parseInt(selectedMonth.value, 10)) {
          return false
        }
      }
    }

    if (isYearSelected) {
      if (item?.dateTime) {
        const itemYear = parseInt(item.dateTime.split('/')[2], 10)
        if (itemYear != parseInt(selectedYear.value, 10)) {
          return false
        }
      }
    }

    if (isTeacher && item.teacher.toLowerCase() !== user.username.toLowerCase()) {
      return false
    }

    // Lọc dữ liệu dựa trên filter và filterByFields
    const filterRegex = new RegExp(filter.value, 'i')
    const filterFields = filterByFields.value

    const isMatchFilter = Object.values(item).some((value) => {
      if (typeof value === 'object' && value !== null) {
        return Object.values(value).some((subValue) => filterRegex.test(subValue))
      } else {
        return filterRegex.test(String(value))
      }
    })

    const isMatchFields =
      filterFields.length === 0 ||
      filterFields.some((field) => {
        const keys = field.split('.')
        let value = item
        for (const key of keys) {
          if (!(key in value)) return false
          value = value[key]
        }
        return filterRegex.test(String(value))
      })

    return isMatchFilter && isMatchFields
  })
})

const totalPages = computed(() => {
  return Math.ceil(filteredItems.value.length / pageSize)
})

const paginateItems = computed(() => {
  const startIndex = (currentPage.value - 1) * pageSize
  const endIndex = startIndex + pageSize
  return filteredItems.value.slice(startIndex, endIndex)
})

const customFilteringFn = (source, cellData) => {
  if (!filter.value) {
    return true
  }

  if (filterByFields.value.length >= 1) {
    const searchInCurrentRow = filterByFields.value.some((field) => cellData.column.key === field)
    if (!searchInCurrentRow) return false
  }

  const filterRegex = new RegExp(filter.value, 'i')
  currentPage.value = 1
  return filterRegex.test(source)
}

const updateFilteredCount = ({ items }) => {
  filteredCount.value = items.length
}

const isPaginationVisible = computed(() => {
  return totalPages.value > 1
})

// fetchStudents()

watch([selectedGroup, selectedTeacher, selectedMonth, selectedYear], () => {
  data.loading = true
  sleep(100).then(() => {
    data.loading = false
    currentPage.value = 1
  })
  // currentPage.value = 1
})
</script>
<style lang="scss" scoped>
.va-data-table {
  ::v-deep(.va-data-table__table-tr) {
    border-bottom: 1px solid var(--va-background-border);
  }
}
.pagination {
  margin-top: 10px;
}
</style>
