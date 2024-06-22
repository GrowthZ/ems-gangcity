<template>
  <!-- <VaInnerLoading :loading="isLoading" :size="60"> -->
  <div class="flex justify-between items-center mb-6">
    <div>
      <h1 class="page-title">Lịch dạy</h1>
    </div>
    <div>
      <VaButton @click="showAddCalendarModal"> + Thêm lịch dạy </VaButton>
    </div>
  </div>
  <VaCard class="w-full">
    <VaCardContent>
      <div>
        <div class="grid md:grid-cols-2 gap-6 mb-6 pt-6">
          <VaInput v-model="filter" placeholder="Tìm kiếm..." class="w-full">
            <template #prependInner>
              <VaIcon name="search" color="secondary" size="small" />
            </template>
          </VaInput>
        </div>
        <VaDataTable :items="paginateItems" :columns="columns" :loading="loading">
          <template #cell(teacher)="{ value }">
            <!-- <VaChip size="small" :color="getColorById(row.itemKey.id)">
              {{ value }}
            </VaChip> -->
            <div size="small" class="text-primary font-bold">
              {{ value }}
            </div>
          </template>
          <template #cell(subTeacher)="{ value }">
            <div size="small" :class="value ? 'text-info' : 'text-secondary opacity-70'">
              {{ value ? value : 'Chưa có' }}
            </div>
          </template>
          <template #cell(status)="{ value }">
            <VaBadge
              :text="value == 1 ? 'Đã điểm danh ✓' : 'Chưa điểm danh'"
              :color="value == 1 ? 'success' : 'warning'"
              size="small"
              class="rounded"
              @click="showAttendanceModal(row)"
            />
          </template>
        </VaDataTable>

        <div class="flex justify-between items-center mb-6">
          <div color="info" class="pt-3">
            Tổng số:
            <strong>{{ calendars.length }}</strong>
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
  <VaModal
    v-slot="{ ok, cancel }"
    v-model="doShowModal"
    mobile-fullscreen
    hide-default-actions
    close-button
    no-outside-dismiss
    size="small"
  >
    <h1 class="va-h5">{{ calendarToEdit ? 'Cập nhật lịch dạy' : 'Thêm mới lịch dạy' }}</h1>
    <CalendarModal
      v-model="doShowModal"
      :save-button-label="calendarToEdit ? 'Cập nhật' : 'Tạo lịch dạy'"
      :calendars="calendars"
      :calendar="calendarToEdit"
      :teachers="teachers"
      :centers="centers"
      :groups="groups"
      :tkb="tkb"
      @close="cancel"
      @save="
        (newCalendars) => {
          sendData(newCalendars)
          ok()
        }
      "
    />
  </VaModal>
  <!-- </VaInnerLoading> -->
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useData } from '../../stores/use-data'
import { DataSheet, Action, sendRequest, showMessageBox } from '../../stores/data-from-sheet'
import { VaCard, VaCardContent, VaDataTable, VaIcon, VaInput, VaButton } from 'vuestic-ui'
import CalendarModal from './widgets/CalendarModal.vue'

const data = useData()
const calendars = computed(() => data.filteredData)
const anotherData = computed(() => data.anotherData)
const loading = computed(() => data.loading)
const paginateItems = computed(() => data.paginateItems)
const currentPage = ref(1)
const totalPages = computed(() => data.totalPages)
const isPaginationVisible = computed(() => data.isPaginationVisible)

const filter = ref('')
// const colors = ['primary', 'secondary', 'success', 'info', 'warning', 'danger']

data.load(DataSheet.calendar, [DataSheet.teacher, DataSheet.location, DataSheet.group, DataSheet.tkb])
const teachers = ref(null)
const centers = ref(null)
const groups = ref(null)
const tkb = ref(null)
const isLoading = ref(false)

watch(anotherData, (newData) => {
  if (newData) {
    teachers.value = newData[0]
    centers.value = newData[1]
    groups.value = newData[2]
    tkb.value = newData[3]
  }
})

const doShowModal = ref(false)
const doShowAttendanceModal = ref(false)
const calendarToEdit = ref(null)

// const showEdit  = (calendar) => {
//   calendarToEdit.value = calendar
//   doShowModal.value = true
// }

const showAddCalendarModal = () => {
  calendarToEdit.value = null
  doShowModal.value = true
}

const showAttendanceModal = (calendar) => {
  calendarToEdit.value = calendar
  doShowAttendanceModal.value = true
}

const sendData = async (dataNew) => {
  isLoading.value = true
  const res = await sendRequest(Action.createCalendars, dataNew)

  // const res = { status: 'success' }
  if (res.status == 'success') {
    showMessageBox(`Tạo mới lịch dạy thành công!`, 'success')
    for (let i = 0; i < dataNew.length; i++) {
      data.add(dataNew[i])
    }
  } else {
    showMessageBox(`Tạo mới lịch dạy thất bại!`, 'danger')
  }
  isLoading.value = false
}

const columns = [
  { key: 'location', label: 'Trung tâm' },
  { key: 'dateTime', label: 'Ngày tháng', sortable: true },
  { key: 'attendanceTime', label: 'Thời gian' },
  { key: 'group', label: 'Lớp học' },
  { key: 'teacher', label: 'Giáo viên' },
  { key: 'subTeacher', label: 'Trợ giảng' },
  { key: 'status', label: 'Trạng thái' },
]

const changePage = (page) => {
  data.setCurrentPage(page)
  currentPage.value = page
}

const filterSearch = () => {
  data.filter = filter.value
  data.setFilterData()
}

// const getColorById = (id) => {
//   const colorIndex = id % colors.length
//   return colors[colorIndex]
// }

watch(
  [currentPage, filter],
  ([page]) => {
    changePage(page)
    filterSearch()
  },
  { immediate: true },
)
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
