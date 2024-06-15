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
          <div class="grid md:grid-cols-3 gap-4 mb-6">
            <!-- <VaInput v-model="filter" placeholder="Tìm kiếm..." class="w-full">
            <template #prependInner>
              <VaIcon name="search" color="secondary" size="small" />
            </template>
          </VaInput> -->
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
          </div>
        </VaCollapse>
        <VaInnerLoading :loading="loading">
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
          />

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
        </VaInnerLoading>
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
const selectedGroup = ref('')
const selectedTeacher = ref('')
const selectedMonth = ref(month)
const pageSize = 10 // Số lượng mục trên mỗi trang
const currentPage = ref(1) // Trang hiện tại

const data = useData()

const items = computed(() => data.allData)
const loading = computed(() => data.loading)

data.load(DataSheet.attendance, [DataSheet.teacher])

const user = JSON.parse(localStorage.getItem('user') || '{}')

const isManager = user.role === 'manager' || user.role === 'admin'
const isTeacher = user.role === 'teacher'

const columns = [
  { key: 'date', sortable: true, label: 'Ngày' },
  { key: 'group', sortable: true, label: 'Lớp' },
  { key: 'teacher', sortable: true, label: 'Giáo viên' },
  { key: 'total', label: 'Sĩ số' },
  { key: 'salary', label: 'Lương' },
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
  const teachers = new Set(items.value.map((item) => item.teacher))
  const uniqueTeachersArray = Array.from(teachers).map((teacher) => ({ value: teacher, text: teacher }))
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

    if (isGroupSelected && item?.group !== selectedGroup.value) {
      return false
    }

    if (isTeacherSelected && item?.teacher !== selectedTeacher.value) {
      return false
    }

    if (isMonthSelected) {
      if (item?.date) {
        const itemMonth = parseInt(item.date.split('/')[1], 10)
        if (itemMonth !== parseInt(selectedMonth.value, 10)) {
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

watch([selectedGroup, selectedTeacher, selectedMonth], () => {
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
