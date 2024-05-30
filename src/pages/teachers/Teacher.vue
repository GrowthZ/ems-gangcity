<template>
  <div class="flex justify-between items-center mb-6">
    <div>
      <h1 class="page-title">Giáo viên</h1>
    </div>
    <div>
      <VaButton @click="$refs.modal.show()"> + Thêm giáo viên </VaButton>
    </div>
  </div>
  <VaCard>
    <VaCardContent>
      <div>
        <div class="grid md:grid-cols-2 gap-6 mb-6 pt-6">
          <VaInput v-model="filter" placeholder="Tìm kiếm..." class="w-full">
            <template #prependInner>
              <VaIcon name="search" color="secondary" size="small" />
            </template>
          </VaInput>
        </div>
        <VaDataTable
          :items="teachers"
          :columns="columns"
          :loading="loading"
          :filter="filter"
          :filter-method="customFilteringFn"
        >
          <template #cell(nickname)="{ value, row }">
            <VaChip size="small" :color="getColorById(row.itemKey.id)">
              {{ value }}
            </VaChip>
          </template>
        </VaDataTable>
      </div>
    </VaCardContent>
  </VaCard>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useData } from '../../stores/use-data'
import { DataSheet } from '../../stores/data-from-sheet'

const data = useData()
const teachers = computed(() => data.allData)
const loading = computed(() => data.loading)

const filter = ref('')
const filterByFields = ref([])
const colors = ['primary', 'secondary', 'success', 'info', 'warning', 'danger']

data.load(DataSheet.teacher)
const columns = [
  { key: 'code', label: 'ID' },
  { key: 'fullname', label: 'Tên đầy đủ' },
  { key: 'nickname', label: 'Biệt danh' },
  { key: 'phoneNumber', label: 'SĐT' },
  { key: 'gender', label: 'Giới tính' },
]

const customFilteringFn = (source, cellData) => {
  if (!filter.value) {
    return true
  }

  if (filterByFields.value.length >= 1) {
    const searchInCurrentRow = filterByFields.value.some((field) => cellData.column.key === field)
    if (!searchInCurrentRow) return false
  }

  const filterRegex = new RegExp(filter.value, 'i')

  return filterRegex.test(source)
}

const getColorById = (id) => {
  console.log('ID:', id)
  const colorIndex = id % colors.length
  return colors[colorIndex]
}
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
