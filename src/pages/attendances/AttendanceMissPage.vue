<template>
  <div class="flex justify-between items-center">
    <div>
      <h1 class="page-title">Danh sách nghỉ</h1>
    </div>
    <div v-if="filteredItems?.length && !loading">
      <span>
        <VaIcon :name="`mso-free_cancellation`" class="font-light mb-2 pr-2" color="danger" size="2rem" />
        <span class="text-dark mb-2 text-primary text-lg leading-8 font-bold">
          <!-- {{ filteredDoneCount + ' / ' + filteredItems.length }} -->
          <span class="text-success">{{ countApproveStudent }}</span> / {{ filteredItems.length }}
        </span>
      </span>
    </div>
  </div>
  <VaCard>
    <VaCardContent>
      <div class="grid md:grid-cols-2 xs:grid-cols-2 gap-4 mb-4">
        <VaDateInput v-model="startDate" :parse="parseDate" :format="formatDate" label="Bắt đầu" />
        <VaDateInput
          v-model="endDate"
          :parse="parseDate"
          :format="formatDate"
          :disable-date="disableEndDate"
          label="Kết thúc"
        />

        <VaSelect
          v-model="selectedLocation"
          label="Cơ sở"
          placeholder="Chọn cơ sở"
          :options="uniqueLocations"
          value-by="value"
        />
        <VaSelect
          v-model="selectedStatus"
          label="Trạng thái"
          placeholder="Chọn trạng thái"
          :options="statusList"
          value-by="value"
        />
      </div>
      <VaInput v-model="searchValue" class="mb-4" placeholder="Nhập tên hoặc lớp ..." label="Tìm kiếm">
        <template #appendInner>
          <VaIcon color="secondary" name="mso-search" />
        </template>
      </VaInput>
    </VaCardContent>
  </VaCard>

  <VaInnerLoading :loading="loading">
    <VaDataTable
      v-if="!loading"
      :items="filteredItems"
      :columns="columns"
      virtual-scroller
      sticky-header
      height="calc(100vh - 300px)"
      no-data-html="Không có dữ liệu"
    >
      <template #cell(status)="{ value }">
        <VaBadge :text="value" text-color="#ffffff" :color="getStatusColor(value)" class="mr-2" />
      </template>
      <template #cell(actions)="{ row, isExpanded }">
        <VaButton
          :icon="isExpanded ? 'va-arrow-up' : 'va-arrow-down'"
          preset="secondary"
          @click="row.toggleRowDetails()"
        >
          {{ isExpanded ? 'Ẩn' : 'Xem' }}
        </VaButton>
      </template>
      <template #expandableRow="{ rowData }">
        <div class="gap-2">
          <div class="pl-2 grid md:grid-cols-2 xs:grid-cols-2 justify-between pt-2">
            <div class="flex items-center pt-2">
              <VaIcon size="small" :name="`mso-calendar_month`" color="primary" class="mr-2" />
              <span>{{ rowData.dateTime }}</span>
            </div>
            <div class="flex items-center pt-2 m-auto" @click="callStudent(rowData.phoneNumber)">
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
            </div>
          </div>
          <div class="items-center pl-2 pt-2">
            <div class="w-full">
              <VaIcon size="small" :name="`mso-edit_square`" color="primary" class="font-light mr-2" />
              <span class="text-primary font-bold">Ghi chú:</span>
            </div>
            <p class="text-wrap pt-2">{{ rowData.note ? rowData.note : 'Chưa có ghi chú' }}</p>
          </div>
        </div>
        <VaDivider class="my-3" />
      </template>
    </VaDataTable>
  </VaInnerLoading>
  <VaModal v-slot="{ cancel, ok }" v-model="doShowAttendanceMissingModal" size="small" hide-default-actions>
    <AttendanceMissingModal
      :student-missing="studentMissingToEdit"
      :status-list="statusList"
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
import { ref, watch, computed } from 'vue'
import { useData } from '../../stores/use-data'
import { DataSheet, showMessageBox } from '../../stores/data-from-sheet'
import { sleep } from '../../services/utils'
import AttendanceMissingModal from './widgets/AttendanceMissingModal.vue'
import { Action, sendRequest } from '../../stores/data-from-sheet'

const today = new Date()
const todayDate = new Date(today.getFullYear(), today.getMonth(), today.getDate())
const startDate = ref(todayDate)
const endDate = ref(todayDate)
const selectedStatus = ref('')
const selectedLocation = ref('')
const searchValue = ref('')

const doShowAttendanceMissingModal = ref(false)
const studentMissingToEdit = ref(undefined)

const statusList = ref([
  { value: '', text: 'Tất cả' },
  { value: 'missing', text: 'Chưa chăm sóc', color: 'warning', colorText: 'white' },
  { value: 'waiting', text: 'Đã xếp lớp', color: 'info', colorText: 'white' },
  { value: 'approved', text: 'Đã học bù', color: 'success', colorText: 'white' },
  { value: 'rejected', text: 'Từ chối', color: 'secondary', colorText: '#000000' },
])

const locations = ref([])

const data = useData()
const items = computed(() => data.allData)
const anotherData = computed(() => data.anotherData)
const loading = computed(() => data.loading)

data.load(DataSheet.attendanceMissing, [DataSheet.location])

watch(anotherData, (newData) => {
  locations.value = newData[0]
})

const columns = [
  { key: 'fullName', label: 'Tên', width: '150px' },
  { key: 'status', label: 'Trạng thái' },
  { key: 'actions', label: 'Hành động' },
]

const filteredItems = computed(() => {
  return items?.value.filter((item) => {
    const isStatusSelected = selectedStatus.value !== ''
    const isLocationSelected = selectedLocation.value !== ''
    const search = searchValue.value.trim().toLowerCase()

    if (search && !item.fullName.toLowerCase().includes(search) && !item.group.toLowerCase().includes(search)) {
      return false
    }
    if (isLocationSelected && !item.studentCode.includes(selectedLocation.value)) {
      return false
    }

    if (isStatusSelected && item?.status.toLowerCase() != getStatusText(selectedStatus.value).toLocaleLowerCase()) {
      return false
    }

    const itemDateTime = parseDate(item.dateTime).getTime()
    const startDateTime = startDate.value.getTime()
    const endDateTime = endDate.value.getTime()
    const isWithinRange = startDateTime <= itemDateTime && itemDateTime <= endDateTime
    return isWithinRange
  })
})

const doneStatus = ref('Đã học bù')

const countApproveStudent = computed(() => {
  return filteredItems.value.filter((item) => item.status.toLowerCase() == doneStatus.value.toLowerCase()).length
})

function formatDate(date) {
  const day = String(date.getDate()).padStart(2, '0')
  const month = String(date.getMonth() + 1).padStart(2, '0') // Tháng bắt đầu từ 0
  const year = date.getFullYear()
  return `${day}/${month}/${year}`
}

function parseDate(dateString) {
  const [day, month, year] = dateString ? dateString.split('/').map(Number) : [0, 0, 0]
  return new Date(year, month - 1, day)
}

const disableEndDate = (date) => {
  const parsedStartDate = parseDate(startDate.value)
  return date < parsedStartDate
}

const getStatusColor = (status) => {
  const statusItem = statusList.value.find((item) => item.text == status)
  return statusItem ? statusItem.color : ''
}

const getStatusText = (statusValue) => {
  const statusItem = statusList.value.find((item) => item.value == statusValue)
  return statusItem ? statusItem.text : ''
}

// const getTextLocation = (code) => {
//   const location = locations.value.find((location) => location.code === code)
//   return location ? location.name : ''
// }

const uniqueLocations = computed(() => {
  const uniqueLocationsArray = Array.from(locations.value).map((location) => ({
    value: location.code,
    text: location.name,
  }))
  uniqueLocationsArray.unshift({ value: '', text: 'Tất cả' })
  return items.value ? uniqueLocationsArray : []
})

const callStudent = (phone) => {
  window.location.href = `tel:${phone}`
}

const showAttendanceMissingModal = (student) => {
  studentMissingToEdit.value = student
  doShowAttendanceMissingModal.value = true
}

const sendUpdateStudentMissing = async (dataJson) => {
  data.loading = true
  const res = await sendRequest(Action.updateStudentMissing, dataJson)

  if (res.status == 'success') {
    showMessageBox(`Cập nhật thành công!`, 'success')
    updateStudentMissing(dataJson)
  } else {
    showMessageBox(`Cập nhật thất bại!`, 'danger')
  }
  data.loading = false
}

const updateStudentMissing = (data) => {
  items.value = items.value.map((item) => {
    if (item.studentCode == data.studentCode && item.dateTime == data.dateTime && item.group == data.group) {
      item = data
    }
    return item
  })
}

watch(startDate, (newStartDate) => {
  if (newStartDate > endDate.value) {
    endDate.value = newStartDate
  }
})

watch([startDate, endDate], () => {
  data.loading = true
  sleep(500).then(() => {
    data.loading = false
  })
})

watch(selectedStatus, () => {
  data.loading = true
  sleep(500).then(() => {
    data.loading = false
  })
})
</script>
<style>
.va-data-table__table-tr--expanded td {
  background: var(--va-background-border);
}

.va-data-table__table-expanded-content td {
  background-color: var(--va-background-element);
}

.table-container {
  width: 100%;
}
</style>
