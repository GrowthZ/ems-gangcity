<template>
  <div class="flex justify-between items-center mb-6">
    <div>
      <h1 class="page-title">Học viên</h1>
    </div>
    <div>
      <VaButton @click="$refs.modal.show()"> + Thêm học viên </VaButton>
    </div>
  </div>
  <VaModal ref="modal" v-model="doShowModal" size="small" mobile-fullscreen close-button hide-default-actions>
    <h1 class="va-h5">{{ studentToEdit ? 'Cập nhật học viên' : 'Thêm mới học viên' }}</h1>
    <StudentModal
      v-if="doShowModal"
      v-model="doShowModal"
      :student="studentToEdit"
      :save-button-label="studentToEdit ? 'Cập nhật' : 'Thêm mới'"
      @save="onSave"
      @close="doShowModal = false"
    />
  </VaModal>
  <VaCard>
    <VaCardContent>
      <div>
        <div class="grid md:grid-cols-2 gap-6 mb-6">
          <VaInput v-model="filter" placeholder="Tìm kiếm..." class="w-full" />
          <VaSelect
            v-model="filterByFields"
            placeholder="Chọn trường lọc"
            :options="columnsWithName"
            value-by="value"
            multiple
          />
        </div>

        <VaDataTable
          :items="paginateItems"
          :columns="columns"
          :filter="filter"
          :loading="isLoading"
          :filter-method="customFilteringFn"
          @filtered="updateFilteredCount"
        />

        <div class="flex justify-between items-center mb-6">
          <div color="info" class="pt-3">
            Tổng số:
            <strong>{{ items.length }}</strong>
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
import { ref, computed } from 'vue'
import { fetchDataSheet } from '../../stores/data-from-sheet'
import StudentModal from './components/studentModal.vue'

const filter = ref('')
const filterByFields = ref([])
const filteredCount = ref(0)
const items = ref([])
const pageSize = 10 // Số lượng mục trên mỗi trang
const currentPage = ref(1) // Trang hiện tại
const isLoading = ref(false)
const doShowModal = ref(false)
const studentToEdit = (ref < import('./types').Student) | (null > null)

const fetchStudents = async () => {
  try {
    isLoading.value = true
    items.value = await fetchDataSheet('DanhSach')
    console.log('Dữ liệu học viên:', items.value)
    isLoading.value = false
  } catch (error) {
    console.error('Lỗi khi lấy dữ liệu học viên:', error)
  }
}

const columns = [
  { key: 'id', sortable: true, label: 'ID' },
  { key: 'fullname', sortable: true, label: 'Tên' },
  { key: 'group', sortable: true, label: 'Lớp' },
  { key: 'phone', sortable: true, label: 'SĐT' },
  { key: 'status', label: 'Trạng thái' },
]

const columnsWithName = columns.map((column) => {
  return { value: column.key, text: column.label || column.key }
})

const filteredItems = computed(() => {
  return items.value.filter((item) => {
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

fetchStudents()
</script>

<style scoped>
.pagination {
  margin-top: 10px;
}
</style>
