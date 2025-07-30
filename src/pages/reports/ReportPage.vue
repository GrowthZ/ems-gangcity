<template>
  <div class="flex justify-between items-center mb-6">
    <div>
      <h1 class="page-title">Báo cáo</h1>
    </div>
  </div>
  <SectionReport :data="filteredItems" />
  <VaCard>
    <VaCardContent>
      <div>
        <!-- <VaCollapse header="Bộ lọc nâng cao" icon="mso-filter_alt" class="custom-collapse"> -->
        <div class="grid md:grid-cols-3 xs:grid-cols-2 gap-4 mb-6">
          <!-- <VaInput v-model="filter" placeholder="Tìm kiếm..." class="w-full">
            <template #prependInner>
              <VaIcon name="search" color="secondary" size="small" />
            </template>
          </VaInput> -->
          <VaSelect v-model="selectedYear" label="Năm" placeholder="Chọn năm" :options="uniqueYears" value-by="value" />
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
            placeholder="Chọn lớp học"
            :options="uniqueGroups"
            value-by="value"
          />
        </div>
        <!-- </VaCollapse> -->
        <VaDataTable
          v-if="!loading"
          animation="fade-in-up"
          class="va-data-table"
          :items="computedItems"
          :columns="columns"
          :loading="loading"
          no-data-html="Không có dữ liệu"
        ></VaDataTable>
        <!-- <VaDataTable
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
        </VaDataTable> -->
        <div v-if="!loading" class="flex justify-between items-center mb-6">
          <div color="info" class="pt-3">
            Tổng số:
            <strong>{{ computedItems.length }}</strong>
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
import SectionReport from './widgets/SectionReport.vue'

const filter = ref('')
const filterByFields = ref([])
const date = new Date()
const month = date.getMonth() + 1
const year = date.getFullYear()
const selectedGroup = ref('')
const selectedTeacher = ref('')
const selectedSubTeacher = ref('')
const selectedMonth = ref(month)
const selectedYear = ref(year)
const currentPage = ref(1) // Trang hiện tại

const data = useData()

const items = computed(() => data.allData)
const anotherData = computed(() => data.anotherData)
const loading = computed(() => data.loading)
const teachers = ref([])

data.load(DataSheet.attendance, [DataSheet.teacher])

const user = JSON.parse(localStorage.getItem('user') || '{}')

// const isManager = user.role === 'manager' || user.role === 'admin'
const isTeacher = user.role === 'teacher'

watch(anotherData, (newData) => {
  if (newData) {
    teachers.value = newData[0]
  }
})

const columns = [
  { key: 'group', sortable: true, label: 'Lớp' },
  { key: 'soTiet', sortable: true, label: 'Số tiết' },
  { key: 'tongSiSo', sortable: true, label: 'Sĩ số' },
  { key: 'soHocSinhTrungBinhMoiTiet', sortable: true, label: 'Trung bình' },
  { key: 'siSoHocChinh', sortable: true, label: 'Học chính' },
  { key: 'siSoHocBu', sortable: true, label: 'Học bù' },
  { key: 'tongLuong', label: 'Lương GV' },
  { key: 'tongLuongSub', label: 'Lương phụ' },
]

const uniqueGroups = computed(() => {
  // Tạo danh sách các giá trị duy nhất của cột group
  const groups = new Set(items.value.map((item) => item.group))
  const uniqueGroupsArray = Array.from(groups).map((group) => ({ value: group, text: group }))
  uniqueGroupsArray.unshift({ value: '', text: 'Tất cả' })
  return items.value ? uniqueGroupsArray : []
})

// const uniqueTeachers = computed(() => {
//   // Tạo danh sách các giá trị duy nhất của cột teacher
//   // const teachers = new Set(items.value.map((item) => item.teacher))
//   const teachersOption = teachers.value.map((teacher) => teacher)
//   const uniqueTeachersArray = Array.from(teachersOption).map((teacher) => ({
//     value: teacher.nickname,
//     text: teacher.nickname,
//   }))
//   uniqueTeachersArray.unshift({ value: '', text: 'Tất cả' })
//   return items.value ? uniqueTeachersArray : []
// })

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

const uniqueMonths = computed(() => {
  const months = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]
  const uniqueArrayMonth = months.map((month) => ({
    value: month,
    text: 'Tháng ' + month.toString(),
  }))
  uniqueArrayMonth.unshift({ value: '', text: 'Tất cả' })
  return items.value ? uniqueArrayMonth : []
})

const filteredItems = computed(() => {
  return items.value.filter((item) => {
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

const computedItems = computed(() => {
  const result = filteredItems.value.reduce((acc, current) => {
    const { group, totalMain, totalSub, salary, subSalary } = current
    const total = parseInt(totalMain) + parseInt(totalSub)

    if (!acc[group]) {
      acc[group] = {
        group,
        soTiet: 0,
        siSoHocChinh: 0,
        siSoHocBu: 0,
        tongSiSo: 0,
        soHocSinhTrungBinhMoiTiet: 0,
        tongLuong: 0,
        tongLuongSub: 0,
      }
    }

    acc[group].soTiet += 1
    acc[group].siSoHocChinh += parseInt(totalMain)
    acc[group].siSoHocBu += parseInt(totalSub)
    acc[group].tongSiSo += total
    acc[group].tongLuong += parseInt(salary.replace(/,/g, ''))
    acc[group].tongLuongSub += parseInt(subSalary.replace(/,/g, ''))

    return acc
  }, {})

  return Object.values(result).map((item) => ({
    ...item,
    soHocSinhTrungBinhMoiTiet: (item.tongSiSo / item.soTiet).toFixed(2),
    tongLuong: item.tongLuong.toLocaleString('vi-VN'),
    tongLuongSub: item.tongLuongSub.toLocaleString('vi-VN'),
  }))
})

watch([selectedGroup, selectedTeacher, selectedMonth, selectedYear], () => {
  console.log('filter changed', computedItems.value)
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
