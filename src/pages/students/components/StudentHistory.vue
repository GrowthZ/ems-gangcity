<template>
  <div class="student-history">
    <div class="flex items-center gap-2 mb-4">
      <VaIcon name="history" color="primary" />
      <h3 class="text-lg font-semibold">Lịch sử học tập</h3>
    </div>

    <div v-if="loading" class="flex justify-center items-center h-32">
      <VaProgressCircle indeterminate />
    </div>

    <div v-else-if="history.length === 0" class="text-center py-8">
      <VaIcon name="info" color="secondary" size="large" class="mb-4" />
      <p class="text-gray-500">Chưa có lịch sử học tập</p>
      <p class="text-xs text-gray-400 mt-2">Mã học viên: {{ studentCode }}</p>
    </div>

    <div v-else class="space-y-4">
      <div
        v-for="(item, index) in history"
        :key="index"
        class="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
      >
        <div class="flex items-center gap-4">
          <VaIcon
            :name="item.source === 'attendance' ? 'event' : 'schedule'"
            :color="item.source === 'attendance' ? 'primary' : 'secondary'"
            size="small"
          />
          <div>
            <div class="font-semibold">{{ formatDate(item.dateTime || item.date) }}</div>
            <div class="text-sm text-gray-600">{{ item.group || item.groupName || 'Chưa có lớp' }}</div>
            <div class="text-xs text-gray-500">
              {{ item.fullname || item.studentName || item.student || 'Chưa có tên' }}
            </div>
            <div v-if="item.source" class="text-xs text-gray-400">
              {{ item.source === 'attendance' ? 'Điểm danh' : 'Chi tiết điểm danh' }}
            </div>
          </div>
        </div>
        <div class="text-right">
          <div class="font-semibold">{{ getTeacherInfo(item) }}</div>
          <div class="text-sm text-gray-600">{{ getSubTeacherInfo(item) }}</div>
          <div class="text-xs text-gray-500">
            <VaChip
              :text="getAttendanceStatus(item.status || item.attendance || item.groupAttendace)"
              :color="getAttendanceColor(item.status || item.attendance || item.groupAttendace)"
              size="small"
            />
          </div>
          <div v-if="item.attendanceCode" class="text-xs text-gray-400 mt-1">
            {{ item.attendanceCode }}
          </div>
        </div>
      </div>
    </div>

    <!-- Debug info (remove in production) -->
    <div v-if="debug" class="mt-4 p-4 bg-gray-100 rounded text-xs">
      <p><strong>Debug Info:</strong></p>
      <p>Student Code: {{ studentCode }}</p>
      <p>Total Attendance Records: {{ attendanceRecords.length }}</p>
      <p>Total Attendance Detail Records: {{ attendanceDetailRecords.length }}</p>
      <p>Filtered Items: {{ history.length }}</p>
      <p>Loading: {{ loading }}</p>
      <p>Data Sources: attendance, attendaceDetail</p>
      <p v-if="history.length > 0"><strong>Sample Record:</strong></p>
      <pre v-if="history.length > 0" class="text-xs bg-white p-2 rounded mt-1">{{
        JSON.stringify(history[0], null, 2)
      }}</pre>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import { useData } from '../../../stores/use-data'
import { DataSheet } from '../../../stores/data-from-sheet'

const props = defineProps({
  studentCode: {
    type: String,
    required: true,
  },
})

const store = useData()
const loading = ref(true)
const history = ref([])
const debug = ref(true) // Set to true for debugging

// Store data from both sheets
const attendanceRecords = ref([])
const attendanceDetailRecords = ref([])

// Helper function to format date
const formatDate = (dateString) => {
  if (!dateString) return 'Chưa có ngày'
  return dateString
}

// Helper functions for attendance status
const getAttendanceStatus = (status) => {
  if (!status) return 'Chưa điểm danh'

  const statusLower = status.toString().toLowerCase()
  if (
    statusLower.includes('có') ||
    statusLower.includes('present') ||
    statusLower.includes('1') ||
    statusLower.includes('dance') ||
    statusLower.includes('break')
  ) {
    return 'Có mặt'
  } else if (statusLower.includes('không') || statusLower.includes('absent') || statusLower.includes('0')) {
    return 'Vắng mặt'
  } else if (statusLower.includes('muộn') || statusLower.includes('late')) {
    return 'Đi muộn'
  } else {
    return status
  }
}

const getAttendanceColor = (status) => {
  if (!status) return 'secondary'

  const statusLower = status.toString().toLowerCase()
  if (
    statusLower.includes('có') ||
    statusLower.includes('present') ||
    statusLower.includes('1') ||
    statusLower.includes('dance') ||
    statusLower.includes('break')
  ) {
    return 'success'
  } else if (statusLower.includes('không') || statusLower.includes('absent') || statusLower.includes('0')) {
    return 'danger'
  } else if (statusLower.includes('muộn') || statusLower.includes('late')) {
    return 'warning'
  } else {
    return 'info'
  }
}

// Helper functions for teacher information
const getTeacherInfo = (item) => {
  // Priority: teacher from attendance table, then teacherName from detail
  if (item.teacher) {
    return item.teacher
  } else if (item.teacherName) {
    return item.teacherName
  } else {
    return 'Chưa có GV'
  }
}

const getSubTeacherInfo = (item) => {
  // Priority: subTeacher from attendance table, then subTeacherName from detail
  if (item.subTeacher) {
    return item.subTeacher
  } else if (item.subTeacherName) {
    return item.subTeacherName
  } else {
    return 'Chưa có trợ giảng'
  }
}

const loadHistory = async () => {
  if (!props.studentCode) return

  loading.value = true
  try {
    console.log('Loading attendance data for student:', props.studentCode)

    // Load attendance data
    await store.load(DataSheet.attendance)
    attendanceRecords.value = store.allData || []
    console.log('Raw attendance data loaded:', attendanceRecords.value.length, 'records')
    if (attendanceRecords.value.length > 0) {
      console.log('Sample attendance record:', attendanceRecords.value[0])
    }

    // Load attendance detail data
    await store.load(DataSheet.attendaceDetail)
    attendanceDetailRecords.value = store.allData || []
    console.log('Raw attendance detail data loaded:', attendanceDetailRecords.value.length, 'records')
    if (attendanceDetailRecords.value.length > 0) {
      console.log('Sample attendance detail record:', attendanceDetailRecords.value[0])
    }

    // Combine and filter data
    const combinedHistory = []
    const studentCodeLower = props.studentCode.toLowerCase()

    // Filter attendance records - try multiple approaches
    const filteredAttendance = attendanceRecords.value
      .filter((item) => {
        const itemStudentCode = (item.studentCode || '').toLowerCase()
        const itemFullname = (item.fullname || '').toLowerCase()
        const itemCode = (item.code || '').toLowerCase()
        const itemAttendanceCode = (item.attendanceCode || '').toLowerCase()

        // Check if this attendance record contains the student code
        return (
          itemStudentCode === studentCodeLower ||
          itemFullname.includes(studentCodeLower) ||
          itemCode === studentCodeLower ||
          itemAttendanceCode.includes(studentCodeLower)
        )
      })
      .map((item) => ({
        ...item,
        source: 'attendance',
        // Ensure teacher field is properly mapped
        teacher: item.teacher || item.teacherName,
        subTeacher: item.subTeacher || item.subTeacherName,
      }))

    console.log('Filtered attendance records:', filteredAttendance.length)
    if (filteredAttendance.length > 0) {
      console.log('Sample filtered attendance record:', filteredAttendance[0])
    }

    // Filter attendance detail records
    const filteredAttendanceDetail = attendanceDetailRecords.value
      .filter((item) => {
        const itemCode = (item.code || '').toLowerCase()
        const itemStudentCode = (item.studentCode || '').toLowerCase()
        const itemStudent = (item.student || '').toLowerCase()
        const itemStudentName = (item.studentName || '').toLowerCase()

        return (
          itemCode === studentCodeLower ||
          itemStudentCode === studentCodeLower ||
          itemStudent === studentCodeLower ||
          itemStudentName === studentCodeLower
        )
      })
      .map((item) => ({
        ...item,
        source: 'attendaceDetail',
        // Ensure teacher field is properly mapped
        teacher: item.teacher || item.teacherName,
        subTeacher: item.subTeacher || item.subTeacherName,
      }))

    console.log('Filtered attendance detail records:', filteredAttendanceDetail.length)

    // Combine both sources
    combinedHistory.push(...filteredAttendance, ...filteredAttendanceDetail)

    // Sort by date (newest first)
    combinedHistory.sort((a, b) => {
      const dateA = new Date(a.dateTime || a.date || 0)
      const dateB = new Date(b.dateTime || b.date || 0)
      return dateB - dateA
    })

    console.log('Total combined history records:', combinedHistory.length)

    history.value = combinedHistory
  } catch (error) {
    console.error('Lỗi khi tải lịch sử học tập:', error)
    history.value = []
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadHistory()
})

watch(
  () => props.studentCode,
  (newCode) => {
    if (newCode) {
      loadHistory()
    }
  },
  { immediate: true },
)
</script>

<style lang="scss" scoped>
.student-history {
  // Add any specific styles here
}
</style>
