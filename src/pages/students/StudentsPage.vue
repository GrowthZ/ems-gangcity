<template>
  <div class="flex justify-between items-center mb-6">
    <div>
      <h1 class="page-title">Học viên</h1>
    </div>
    <div>
      <VaButton @click="$refs.modal.show()"> + Thêm học viên </VaButton>
    </div>
  </div>
  <VaModal
    ref="modal"
    v-slot="{ cancel, ok }"
    v-model="doShowModal"
    size="small"
    mobile-fullscreen
    close-button
    hide-default-actions
  >
    <h1 class="va-h5">{{ studentToEdit ? 'Cập nhật học viên' : 'Thêm mới học viên' }}</h1>
    <StudentModal
      v-if="doShowModal"
      v-model="doShowModal"
      :student="studentToEdit"
      :save-button-label="studentToEdit ? 'Cập nhật' : 'Thêm mới'"
      @close="cancel"
      @save="
        (student) => {
          console.log('student', student)
          onSave(student)
          ok()
        }
      "
    />
  </VaModal>
  <VaCard>
    <VaCardContent>
      <div>
        <div class="grid md:grid-cols-2 gap-6 mb-6">
          <VaInput v-model="filter" placeholder="Tìm kiếm..." class="w-full">
            <template #prependInner>
              <VaIcon name="search" color="secondary" size="small" />
            </template>
          </VaInput>
          <VaSelect v-model="selectedGroup" placeholder="Chọn lớp" :options="uniqueGroups" value-by="value" />
        </div>

        <VaDataTable
          animation="fade-in-up"
          class="va-data-table"
          :items="paginateItems"
          :columns="columns"
          :filter="filter"
          :loading="isLoading"
          :filter-method="customFilteringFn"
          no-data-html="Không có dữ liệu"
          @filtered="updateFilteredCount"
        >
          <template #cell(buoiConLai)="{ value }">
            <VaChip class="text-center" :color="getColor(value)" size="small">
              {{ value }}
            </VaChip>
          </template>
          <template #cell(status)="{ value }">
            <VaBadge :text="value" :color="getColor(value)" class="rounded" />
          </template>
          <template #cell(actions)="{ row, isExpanded }">
            <VaButton
              :icon="isExpanded ? 'do_not_disturb_on' : 'add_circle'"
              :color="isExpanded ? 'dànger' : 'success'"
              preset="secondary"
              size="medium"
              @click="row.toggleRowDetails()"
            >
              <!-- {{ isExpanded ? 'Ẩn' : 'Xem' }} -->
            </VaButton>
          </template>
          <template #expandableRow="{ rowData }">
            <div class="gap-2">
              <div class="pl-2 grid md:grid-cols-2 xs:grid-cols-3 justify-between pt-2">
                <div class="grid md:grid-cols-1">
                  <div class="flex items-center pt-2">
                    <VaIcon size="small" :name="`mso-location_on`" color="primary" class="mr-2" />
                    <span>{{ rowData.location }}</span>
                  </div>
                  <div class="flex items-center pt-2">
                    <VaIcon size="small" :name="`mso-calendar_month`" color="primary" class="mr-2" />
                    <span :class="rowData.birthday ? '' : 'opacity-70'">{{
                      rowData.birthday ? rowData.birthday : 'Chưa cập nhật'
                    }}</span>
                  </div>
                  <div class="flex items-center pt-2">
                    <VaIcon size="small" :name="`mso-login`" color="primary" class="mr-2" />
                    <span :class="rowData.dateStart ? '' : 'opacity-70'">{{
                      rowData.dateStart ? rowData.dateStart : 'Chưa cập nhật'
                    }}</span>
                  </div>
                  <div class="flex items-center pt-2">
                    <VaIcon size="small" :name="`mso-phone`" color="primary" class="mr-2" />
                    <button
                      :class="rowData.phone ? 'text-decoration-underline text-primary' : 'opacity-70'"
                      @click="callStudent(rowData.phone)"
                    >
                      {{ rowData.phone ? rowData.phone : 'Chưa cập nhật' }}
                    </button>
                  </div>
                </div>
                <div class="grid md:grid-cols-1">
                  <div class="flex items-center pt-2">
                    <VaButton preset="primary" color="success" class="ml-6" @click="showPayModal(rowData)">
                      <VaIcon size="medium" :name="`mso-currency_exchange`" color="success" class="mr-2" />
                      Đóng học
                    </VaButton>
                  </div>
                  <div class="flex items-center pt-2">
                    <VaButton preset="primary" color="info" class="ml-6" @click="showAttendanceMissingModal(rowData)">
                      <VaIcon size="medium" :name="`mso-swap_vert`" color="info" class="mr-2" />
                      Sửa buổi
                    </VaButton>
                  </div>
                  <div class="flex items-center pt-2">
                    <VaButton preset="primary" class="ml-6" @click="showAttendanceMissingModal(rowData)">
                      <VaIcon size="medium" :name="`mso-edit_square`" color="primary" class="mr-2" />
                      Cập nhật
                    </VaButton>
                  </div>
                </div>

                <!-- <div class="flex items-center pt-2 m-auto" @click="callStudent(rowData.phoneNumber)">
              <VaButton preset="secondary" color="success" class="ml-6 mb-2">
                <VaIcon size="medium" :name="`mso-phone`" color="success" class="mr-2" />
                Gọi điện
              </VaButton>
            </div>
            <div class="flex items-center">
              <VaIcon size="small" name="school" color="primary" class="mr-2" />
              <span>{{ rowData.group }}</span>
            </div>
            <div class="flex items-center pt-2 m-auto">
              <VaButton preset="primary" class="ml-6 mb-2" @click="showAttendanceMissingModal(rowData)">
                <VaIcon size="small" :name="`mso-edit_square`" color="primary" class="mr-2" />
                Cập nhật
              </VaButton>
            </div> -->
              </div>
            </div>
            <VaDivider class="my-3" />
          </template>
        </VaDataTable>

        <div class="flex justify-between items-center mb-6">
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
              :sort-by="customSort"
            />
          </div>
        </div>
      </div>
    </VaCardContent>
  </VaCard>
  <VaModal v-slot="{ cancel, ok }" v-model="doShowPayModal" size="small" hide-default-actions>
    <PayModal
      :student-to-update="studentToUpdate"
      @close="cancel"
      @save="
        (data) => {
          sendUpdateStudentMissing(data)
          ok()
        }
      "
    />
  </VaModal>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
// import { useStudentData } from './useStudentData'
import StudentModal from './components/StudentModal.vue'
import PayModal from './components/PayModal.vue'
import { sleep } from '../../services/utils'
import { DataSheet } from '../../stores/data-from-sheet'
import { useData } from '../../stores/use-data'

const filter = ref('')
const filterByFields = ref([])
const filteredCount = ref(0)
const selectedGroup = ref('')
const pageSize = 15 // Số lượng mục trên mỗi trang
const currentPage = ref(1) // Trang hiện tại
const doShowModal = ref(false)
const studentToEdit = (ref < import('./types').Student) | (null > null)

const store = useData()

const items = computed(() => store.allData)
const anotherData = computed(() => store.anotherData)
const isLoading = computed(() => store.loading)
const locations = ref([])
const followStudents = ref([])
const mergedData = ref([])

const doShowPayModal = ref(false)
// const isPayModal = ref(false)
const studentToUpdate = ref(undefined)

store.load(DataSheet.student, [DataSheet.location, DataSheet.followStudent])

watch(anotherData, (newData) => {
  if (newData) {
    locations.value = newData[0]
    followStudents.value = newData[1]
    mergedData.value = mergeArrays(items.value, followStudents.value)
    console.log('mergedData', mergedData.value)
  }
})

const columns = [
  { key: 'actions', label: 'Xem' },
  { key: 'fullname', sortable: true, label: 'Tên' },
  { key: 'group', sortable: true, label: 'Lớp' },
  { key: 'buoiConLai', sortable: true, label: 'Buổi còn lại', sortBy: (a, b) => customSort(a, b, 'buoiConLai') },
  { key: 'status', label: 'Trạng thái' },
]

function mergeArrays(arr1, arr2) {
  return arr1.map((item1) => {
    const item2 = arr2.find((item) => item.code === item1.code)
    return {
      ...item1,
      tongSoBuoi: item2 ? parseInt(item2.tongSoBuoi) : 0,
      buoiDaHoc: item2 ? parseInt(item2.buoiDaHoc) : 0,
      buoiConLai: item2 ? parseInt(item2.buoiConLai) : 0,
    }
  })
}

function customSort(a, b, key) {
  if (key === 'buoiConLai') {
    const numA = parseInt(a[key], 10)
    const numB = parseInt(b[key], 10)
    return numA - numB
  }
  // Default sorting behavior
  return a[key] > b[key] ? 1 : -1
}

const callStudent = (phone) => {
  if (!phone) return
  window.location.href = `tel:${phone}`
}

const showPayModal = (student) => {
  studentToUpdate.value = student
  doShowPayModal.value = true
}

// const columnsWithName = columns.map((column) => {
//   return { value: column.key, text: column.label || column.key }
// })

const uniqueGroups = computed(() => {
  // Tạo danh sách các giá trị duy nhất của cột group
  const groups = new Set(items.value.map((item) => item.group))
  const uniqueGroupsArray = Array.from(groups).map((group) => ({ value: group, text: group }))
  uniqueGroupsArray.unshift({ value: '', text: 'Tất cả' })
  return items.value ? uniqueGroupsArray : []
})

const filteredItems = computed(() => {
  return mergedData.value.filter((item) => {
    const isAllSelected = selectedGroup.value === ''
    if (!isAllSelected) {
      if (item?.group !== selectedGroup.value) {
        return false
      }
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

watch(selectedGroup, () => {
  store.loading = true
  sleep(100).then(() => {
    store.loading = false
    currentPage.value = 1
  })
  // currentPage.value = 1
})
const getColor = (value) => {
  if (value > 3 || value == 'Đang học') {
    return 'success'
  } else if ((value <= 3) & (value > 0) || value == 'Tạm nghỉ') {
    return 'warning'
  } else {
    return 'danger'
  }
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

.text-decoration-underline {
  text-decoration: underline;
}
</style>
