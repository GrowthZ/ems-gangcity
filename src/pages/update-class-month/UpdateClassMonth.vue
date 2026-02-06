<template>
  <div class="flex justify-between items-center mb-6">
    <div>
      <h1 class="page-title">Cập nhật số buổi học tháng</h1>
    </div>
  </div>
  <!-- <SectionReport :data="filteredItems" /> -->
  <VaCard>
    <VaCardContent>
      <div>
        <!-- <VaCollapse header="Bộ lọc nâng cao" icon="mso-filter_alt" class="custom-collapse"> -->
        <div class="grid md:grid-cols-2 xs:grid-cols-2 gap-4 mb-6">
          <!-- <VaInput v-model="filter" placeholder="Tìm kiếm..." class="w-full">
              <template #prependInner>
                <VaIcon name="search" color="secondary" size="small" />
              </template>
            </VaInput> -->
          <VaSelect
            v-model="selectedLocation"
            label="Cơ sở"
            placeholder="Chọn cơ sở"
            :options="uniqueLocations"
            value-by="value"
          />
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
          <VaButton
            v-if="canUpdate"
            color="success"
            class="mt-4"
            :disabled="alreadyUpdateChecked"
            :loading="loading"
            @click="sendUpdateLesson(computedItems)"
          >
            <VaIcon :name="`mso-${alreadyUpdateChecked ? 'check_circle' : 'cloud_upload'}`" class="mr-2" />
            {{ alreadyUpdateChecked ? 'Đã cập nhật' : 'Cập nhật' }}
          </VaButton>
          <VaButton v-if="!canUpdate" :disabled="true" color="warning" icon="mso-warning" class="mt-4">
            Chọn đủ thông tin
          </VaButton>
        </div>
        <!-- </VaCollapse> -->
        <VaDataTable
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
        <div class="flex justify-between items-center mb-6">
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
import { DataSheet, sendRequest, Action, showMessageBox, fetchDataSheet } from '../../stores/data-from-sheet'
import { sleep } from '../../services/utils'

const filter = ref('')
const filterByFields = ref([])
const date = new Date()
const month = date.getMonth() + 1
const year = date.getFullYear()
const selectedGroup = ref('')
const selectedTeacher = ref('')
const selectedSubTeacher = ref('')
const selectedLocation = ref('')
const selectedYear = ref(year)
const selectedMonth = ref(month)
const currentPage = ref(1) // Trang hiện tại

const data = useData()

const items = computed(() => data.allData)
const anotherData = computed(() => data.anotherData)
const loading = computed(() => data.loading)
const attendances = ref([])
const locations = ref([])
const students = ref([])
const dataStudentUpdateMonth = ref([])

data.load(DataSheet.followStudent, [
  DataSheet.attendaceDetail,
  DataSheet.location,
  DataSheet.student,
  DataSheet.studentUpdateMonth,
])

const user = JSON.parse(localStorage.getItem('user') || '{}')

// const isManager = user.role === 'manager' || user.role === 'admin'
const isTeacher = user.role === 'teacher'

watch(anotherData, (newData) => {
  if (newData) {
    attendances.value = newData[0]
    locations.value = newData[1]
    students.value = newData[2]
    dataStudentUpdateMonth.value = newData[3]
  }
})

const columns = [
  { key: 'group', sortable: true, label: 'Lớp' },
  { key: 'fullname', sortable: true, label: 'Tên học sinh' },
  { key: 'buoiConLai', sortable: true, label: 'Buổi còn lại', sortMethod: (a, b) => Number(a) - Number(b) },
  { key: 'soBuoiHocTrongThang', sortable: true, label: 'Học trong tháng', sortMethod: (a, b) => Number(a) - Number(b) },
  { key: 'soBuoiTieuChuan', sortable: true, label: 'Tiêu chuẩn' },
  { key: 'soBuoiSauDieuChinh', sortable: true, label: 'Cập nhật' },
]

const uniqueGroups = computed(() => {
  // Tạo danh sách các giá trị duy nhất của cột group
  const groups = new Set(filteredGroups.value.map((item) => item.group))
  const uniqueGroupsArray = Array.from(groups).map((group) => ({ value: group, text: group }))
  uniqueGroupsArray.unshift({ value: '', text: 'Tất cả' })
  return items.value ? uniqueGroupsArray : []
})

const uniqueLocations = computed(() => {
  const uniqueLocationsArray = Array.from(locations.value).map((location) => ({
    value: location.code,
    text: location.name,
  }))
  uniqueLocationsArray.unshift({ value: '', text: 'Tất cả' })
  return items.value ? uniqueLocationsArray : []
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
  const years = [2024, 2025, 2026]
  const uniqueArrayYear = years.map((year) => ({
    value: year,
    text: 'Năm ' + year.toString(),
  }))
  return items.value ? uniqueArrayYear : []
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

const getLocationFromCode = (studentCode) => {
  return studentCode.match(/[A-Za-z]+/)[0] // Lấy phần chữ cái đầu tiên
}

const studyingStudentIds = computed(() =>
  students.value.filter((student) => student.status == 'Đang học').map((student) => student.code),
)

const filteredItems = computed(() => {
  return items.value.filter((item) => {
    const isGroupSelected = selectedGroup.value !== ''
    const isTeacherSelected = selectedTeacher.value !== ''
    const isMonthSelected = selectedMonth.value !== ''
    const isLocationSelected = selectedLocation.value !== ''

    if (!studyingStudentIds.value.includes(item?.code)) {
      return false
    }

    // Bỏ qua điều kiện check location vì có học sinh chuyển lớp
    // Location chỉ dùng để update select group

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
        const parts = item.dateTime.split('/')
        const itemMonth = parseInt(parts[1], 10)
        const itemYear = parseInt(parts[2], 10)
        if (itemMonth != parseInt(selectedMonth.value, 10)) {
          return false
        }
        if (selectedYear.value && itemYear != parseInt(selectedYear.value, 10)) {
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

  // Deduplicate by student code (keep the latest entry as items are reversed)
  const uniqueItems = []
  const seenCodes = new Set()
  for (const item of filtered) {
    if (item.code && !seenCodes.has(item.code)) {
      uniqueItems.push(item)
      seenCodes.add(item.code)
    }
  }

  return uniqueItems
})

const filteredGroups = computed(() => {
  return items.value.filter((item) => {
    // Bỏ qua nếu không thuộc danh sách đang học
    if (!studyingStudentIds.value.includes(item?.code)) {
      return false
    }

    // Nếu người dùng đã chọn cơ sở, kiểm tra xem item có khớp không
    const isLocationSelected = selectedLocation.value !== ''
    if (isLocationSelected && getLocationFromCode(item?.code) !== selectedLocation.value) {
      return false
    }

    return true
  })
})

const attendanceByMonth = computed(() => {
  return attendances.value.reduce((acc, record) => {
    const { studentCode, fullname, dateTime } = record
    const [day, month, year] = dateTime.split('/') // Chuyển đổi ngày tháng
    const key = `${studentCode}-${year}-${month}`

    if (!acc[key]) {
      acc[key] = { studentCode, fullname, year, month, day, soBuoiHocTrongThang: 0 }
    }

    acc[key].soBuoiHocTrongThang += 1
    return acc
  }, {})
})
const attendanceArray = computed(() => Object.values(attendanceByMonth.value))

const canUpdate = computed(() => {
  const isLocationValid = selectedLocation.value && selectedLocation.value !== 'Tất cả'
  const isGroupValid = selectedGroup.value && selectedGroup.value !== 'Tất cả'
  const isMonthValid = selectedMonth.value && selectedMonth.value !== 'Tất cả'

  return isLocationValid && isGroupValid && isMonthValid
})

const computedItems = computed(() => {
  return filteredItems.value.map((item) => {
    const attendanceRecord = attendanceArray.value.find(
      (record) =>
        record.studentCode == item.code && record.month == selectedMonth.value && record.year == selectedYear.value,
    )
    const soBuoiHocTrongThang = attendanceRecord ? attendanceRecord.soBuoiHocTrongThang : 0
    const soBuoiTieuChuan = 6 // Tiêu chuẩn mặc định mỗi tháng là 6
    const soBuoiSauDieuChinh = soBuoiHocTrongThang < soBuoiTieuChuan ? soBuoiHocTrongThang - soBuoiTieuChuan : 0

    return {
      ...item,
      soBuoiHocTrongThang,
      soBuoiTieuChuan,
      soBuoiSauDieuChinh,
    }
  })
})
const alreadyUpdateChecked = computed(() => {
  return dataStudentUpdateMonth.value.some((row) => {
    const [month, year] = row.dateUpdate.split('/')
    return (
      // Bỏ qua check location vì có học sinh chuyển lớp
      selectedMonth.value == month &&
      selectedYear.value == year &&
      row.note == selectedGroup.value
    )
  })
})

const sendUpdateLesson = async (dataJson) => {
  data.loading = true
  const dataToSend = dataJson.map((item) => {
    return {
      location: getLocationFromCode(item.code),
      studentCode: item.code,
      studentName: item.fullname,
      dateUpdate: selectedMonth.value + '/' + selectedYear.value,
      lesson: item.soBuoiSauDieuChinh,
      note: item.group,
    }
  })
  const dataToSendJson = {
    data: dataToSend,
    month: selectedMonth.value,
    year: selectedYear.value,
  }

  const dataUpdated = await fetchDataSheet(DataSheet.studentUpdateMonth)
  const selectedFormatted = `${Number(selectedMonth.value)}/${selectedYear.value}`
  const alreadyUpdated = dataUpdated.some((row) => {
    const [month, year] = row.dateUpdate.split('/')
    return (
      // Bỏ qua check location vì có học sinh chuyển lớp
      selectedMonth.value == month &&
      selectedYear.value == year &&
      row.note == selectedGroup.value
    )
  })
  if (alreadyUpdated) {
    showMessageBox(
      `Dữ liệu đã được cập nhật trong tháng ${selectedFormatted} cho lớp ${selectedGroup.value} !`,
      'error',
    )
    data.loading = false
    return
  }

  const response = await sendRequest(Action.updateStudentByMonth, dataToSendJson)
  if (response) {
    showMessageBox('Cập nhật thành công', 'success')
  } else {
    showMessageBox('Cập nhật thất bại', 'error')
  }
  dataStudentUpdateMonth.value = await fetchDataSheet(DataSheet.studentUpdateMonth)
  data.loading = false
}

watch([selectedGroup, selectedTeacher, selectedMonth, selectedYear], () => {
  data.loading = true
  sleep(100).then(() => {
    data.loading = false
    currentPage.value = 1
  })
  // currentPage.value = 1
})

watch(selectedLocation, (newValue) => {
  if (newValue) {
    selectedGroup.value = ''
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
</style>
