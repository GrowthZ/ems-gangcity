<template>
  <div class="flex justify-between items-center">
    <div>
      <h1 class="page-title">Lịch dạy</h1>
    </div>
    <div v-if="filteredItems.length > 0">
      <span
        ><VaIcon :name="`mso-event_available`" class="font-light mb-2 pr-2" color="success" size="2rem" />
        <span class="text-success mb-2 text-primary text-lg leading-8 font-bold">
          {{ filteredDoneCount + ' / ' + filteredItems.length }}
        </span>
      </span>
    </div>
  </div>
  <VaCard>
    <VaCardContent>
      <div v-if="isManager" class="grid md:grid-cols-2 xs:grid-cols-2 gap-4 mb-4">
        <VaDateInput v-model="startDate" :parse="parseDate" :format="formatDate" label="Bắt đầu" />
        <VaDateInput
          v-model="endDate"
          :parse="parseDate"
          :format="formatDate"
          :disable-date="disableEndDate"
          label="Kết thúc"
        />
      </div>
      <VaCollapse v-if="isManager" header="Bộ lọc nâng cao" icon="mso-filter_alt" class="custom-collapse">
        <div class="grid md:grid-cols-4 xs:grid-cols-2 gap-4 mb-6">
          <VaSelect
            v-model="selectedLocation"
            label="Cơ sở"
            placeholder="Chọn cơ sở"
            :options="uniqueLocations"
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
            v-model="selectedTeacher"
            label="Giáo viên"
            placeholder="Chọn giáo viên"
            :options="uniqueTeachers"
            value-by="value"
          />
          <VaSelect
            v-model="selectedStatus"
            label="Trạng thái"
            placeholder="Trạng thái"
            :options="uniqueStatus"
            value-by="value"
          />
        </div>

        <!-- <div class="flex justify-between items-center mb-6">
          <div color="info" class="pt-3">
            Tổng số:
            <strong>{{ filteredItems.length }}</strong>
          </div>
        </div> -->
      </VaCollapse>
      <Attendances :calendars="filteredItems" :students="students" :teachers="teachers" :loading="loading" />
    </VaCardContent>
  </VaCard>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useData } from '../../stores/use-data'
import { DataSheet } from '../../stores/data-from-sheet'
import { sleep } from '../../services/utils'
import Attendances from './widgets/Attendances.vue'

const filter = ref('')
const filterByFields = ref([])
const selectedGroup = ref('')
const selectedTeacher = ref('')
const selectedLocation = ref('')
const selectedStatus = ref('')
const today = new Date()
const todayDate = new Date(today.getFullYear(), today.getMonth(), today.getDate())
const startDate = ref(todayDate)
const endDate = ref(todayDate)

const data = useData()

const items = computed(() => data.allData)
const anotherData = computed(() => data.anotherData)
const loading = computed(() => data.loading)
const students = ref([])
const locations = ref([])
const teachers = ref([])

const user = JSON.parse(localStorage.getItem('user') || '{}')

const isManager = user.role === 'manager' || user.role === 'admin'
const isTeacher = user.role === 'teacher'

data.load(DataSheet.calendar, [DataSheet.student, DataSheet.location, DataSheet.teacher])

watch(anotherData, (newData) => {
  if (newData) {
    students.value = newData[0].filter((student) => student.status == 'Đang học')
    locations.value = newData[1]
    teachers.value = newData[2]
  }
})

function formatDate(date) {
  const day = String(date.getDate()).padStart(2, '0')
  const month = String(date.getMonth() + 1).padStart(2, '0') // Tháng bắt đầu từ 0
  const year = date.getFullYear()
  return `${day}/${month}/${year}`
}

function parseDate(dateString) {
  if (!dateString) return new Date()
  const [day, month, year] = dateString.split('/').map(Number)
  return new Date(year, month - 1, day)
}

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

const filteredDoneCount = computed(() => {
  return filteredItems.value.filter((item) => item.status == 1).length || 0
})

const getTextLocation = (code) => {
  const location = locations.value.find((location) => location.code === code)
  return location ? location.name : ''
}

const uniqueLocations = computed(() => {
  const uniqueLocationsArray = Array.from(locations.value).map((location) => ({
    value: location.code,
    text: location.name,
  }))
  uniqueLocationsArray.unshift({ value: '', text: 'Tất cả' })
  return items.value ? uniqueLocationsArray : []
})

const uniqueStatus = computed(() => {
  const uniqueArrayStatus = [
    { value: 'done', text: 'Hoàn thành' },
    { value: 'ongoing', text: 'Chưa điểm danh' },
  ]
  uniqueArrayStatus.unshift({ value: '', text: 'Tất cả' })
  return items.value ? uniqueArrayStatus : []
})

const filteredItems = computed(() => {
  return items.value.filter((item) => {
    const isGroupSelected = selectedGroup.value !== ''
    const isTeacherSelected = selectedTeacher.value !== ''
    const isStatusSelected = selectedStatus.value !== ''
    const isLocationSelected = selectedLocation.value !== ''

    if (isLocationSelected && item?.location != getTextLocation(selectedLocation.value)) {
      return false
    }

    if (isGroupSelected && item?.group !== selectedGroup.value) {
      return false
    }

    if (isTeacherSelected && item?.teacher !== selectedTeacher.value) {
      return false
    }

    if (isTeacher && item?.teacher.toLowerCase() !== user.username.toLowerCase()) {
      return false
    }

    if (
      isStatusSelected &&
      ((item?.attendanceCode == '' && selectedStatus.value == 'done') ||
        (item?.attendanceCode !== '' && selectedStatus.value == 'ongoing'))
    ) {
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

    // Kiểm tra nếu thời gian của mục nằm trong khoảng thời gian đã chọn
    const itemDateTime = parseDate(item.dateTime).getTime()
    const startDateTime = startDate.value.getTime()
    const endDateTime = endDate.value.getTime()
    const isWithinRange = startDateTime <= itemDateTime && itemDateTime <= endDateTime
    return isMatchFilter && isMatchFields && isWithinRange
  })
})

const disableEndDate = (date) => {
  const parsedStartDate = parseDate(startDate.value)
  return date < parsedStartDate
}

watch([selectedGroup, selectedTeacher, selectedLocation, selectedStatus, startDate, endDate], () => {
  data.loading = true
  sleep(100).then(() => {
    data.loading = false
  })
})

watch(startDate, (newStartDate) => {
  if (newStartDate > endDate.value) {
    endDate.value = newStartDate
  }
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
.custom-collapse {
  border-bottom: none !important; /* Loại bỏ viền dưới cùng */
}

/* Nếu VaCollapse có lớp con cụ thể mà bạn cần chỉnh sửa, thêm CSS cụ thể */
.custom-collapse .va-collapse__header {
  border-bottom: none !important;
}
</style>
