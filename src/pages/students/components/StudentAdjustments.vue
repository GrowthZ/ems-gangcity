<template>
  <div>
    <div class="flex items-center gap-2 mb-4">
      <VaIcon name="swap_vert" color="primary" />
      <h3 class="text-lg font-semibold">Lịch sử điều chỉnh</h3>
    </div>

    <div v-if="loading" class="flex justify-center py-8">
      <VaProgressCircle indeterminate />
    </div>

    <div v-else-if="adjustmentHistory.length === 0" class="text-center py-8">
      <VaIcon name="info" color="secondary" size="large" class="mb-4" />
      <p class="text-gray-500">Chưa có lịch sử điều chỉnh</p>
      <p class="text-xs text-gray-400 mt-2">Mã học viên: {{ studentCode }}</p>
    </div>

    <div v-else class="space-y-4">
      <div
        v-for="(adjustment, index) in paginatedAdjustments"
        :key="index"
        class="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
      >
        <div class="flex items-center gap-4">
          <VaIcon
            :name="adjustment.source === 'lessonUpdate' ? 'swap_vert' : 'calendar_month'"
            :color="adjustment.source === 'lessonUpdate' ? 'warning' : 'info'"
            size="small"
          />
          <div>
            <div class="font-semibold">
              {{
                formatDate(adjustment.dateUpdate || adjustment.date || adjustment.dateTime || adjustment.ngayDieuChinh)
              }}
            </div>
            <div class="text-sm text-gray-600">
              {{ getAdjustmentDescription(adjustment) }}
            </div>
            <div class="text-xs text-gray-500 mt-1">
              {{ adjustment.studentName || 'Chưa có tên' }}
            </div>
            <div v-if="adjustment.source" class="text-xs text-gray-400">
              {{ adjustment.source === 'lessonUpdate' ? 'Điều chỉnh lịch học' : 'Điều chỉnh theo quy định' }}
            </div>
          </div>
        </div>

        <div class="flex flex-col items-end gap-2">
          <VaChip :text="getAdjustmentStatus(adjustment)" :color="getAdjustmentColor(adjustment)" size="small" />
          <div class="text-sm font-semibold" :class="getLessonColor(adjustment)">
            {{ formatLessonValue(adjustment) }}
          </div>
        </div>
      </div>
    </div>

    <!-- Pagination -->
    <div v-if="totalPages > 1" class="flex justify-center mt-6">
      <VaPagination
        v-model="currentPage"
        :pages="totalPages"
        :visible-pages="3"
        buttons-preset="secondary"
        active-page-color="primary"
        gapped
      />
    </div>

    <!-- Debug info (remove in production) -->
    <div v-if="debug" class="mt-4 p-4 bg-gray-100 rounded text-xs">
      <p><strong>Debug Info:</strong></p>
      <p>Student Code: {{ studentCode }}</p>
      <p>Total Lesson Update Records: {{ lessonUpdateRecords.length }}</p>
      <p>Total Student Update Month Records: {{ studentUpdateMonthRecords.length }}</p>
      <p>Filtered Adjustments: {{ adjustmentHistory.length }}</p>
      <p>Loading: {{ loading }}</p>
      <p>Data Sources: lessonUpdate, studentUpdateMonth</p>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useData } from '../../../stores/use-data'
import { DataSheet } from '../../../stores/data-from-sheet'

const props = defineProps({
  studentCode: {
    type: String,
    required: true,
  },
})

const store = useData()
const loading = ref(false)
const currentPage = ref(1)
const pageSize = 10
const debug = ref(true) // Set to true for debugging

// Store data from both sheets
const lessonUpdateRecords = ref([])
const studentUpdateMonthRecords = ref([])

// Helper function to format date
const formatDate = (dateString) => {
  if (!dateString) return 'Chưa có ngày'
  return dateString
}

// Helper function to get adjustment description
const getAdjustmentDescription = (adjustment) => {
  if (adjustment.source === 'lessonUpdate') {
    return adjustment.reason || adjustment.note || 'Điều chỉnh lịch học'
  } else {
    // For studentUpdateMonth, the lesson field contains the description
    const lessonValue = adjustment.lesson || ''
    if (lessonValue.includes('Break')) {
      return `Nghỉ học: ${lessonValue}`
    }
    return adjustment.note || 'Điều chỉnh theo quy định'
  }
}

// Helper function to get adjustment status
const getAdjustmentStatus = (adjustment) => {
  if (adjustment.source === 'lessonUpdate') {
    const lesson = adjustment.lesson || 0
    const num = parseInt(lesson)
    if (isNaN(num)) return 'Đã điều chỉnh'

    if (num > 0) {
      return 'Tăng buổi'
    } else if (num < 0) {
      return 'Giảm buổi'
    } else {
      return 'Không đổi'
    }
  } else {
    // For studentUpdateMonth
    const lessonValue = adjustment.lesson || ''
    if (lessonValue.includes('Break')) {
      return 'Nghỉ học'
    }

    // Check if it's a numeric value
    const num = parseInt(lessonValue)
    if (!isNaN(num)) {
      if (num > 0) {
        return 'Tăng buổi'
      } else if (num < 0) {
        return 'Giảm buổi'
      } else {
        return 'Không đổi'
      }
    }

    return 'Theo quy định'
  }
}

// Helper function to get adjustment color
const getAdjustmentColor = (adjustment) => {
  if (adjustment.source === 'lessonUpdate') {
    const lesson = adjustment.lesson || 0
    const num = parseInt(lesson)
    if (isNaN(num)) return 'warning'

    if (num > 0) {
      return 'success' // Green for positive adjustments
    } else if (num < 0) {
      return 'danger' // Red for negative adjustments
    } else {
      return 'warning' // Yellow for zero adjustments
    }
  } else {
    // For studentUpdateMonth
    const lessonValue = adjustment.lesson || ''
    if (lessonValue.includes('Break')) {
      return 'danger' // Red for breaks
    }

    // Check if it's a numeric value
    const num = parseInt(lessonValue)
    if (!isNaN(num)) {
      if (num > 0) {
        return 'success' // Green for positive
      } else if (num < 0) {
        return 'danger' // Red for negative
      } else {
        return 'info' // Blue for zero
      }
    }

    return 'info' // Default blue for other cases
  }
}

// Helper function to format lesson value
const formatLessonValue = (adjustment) => {
  if (adjustment.source === 'lessonUpdate') {
    const lesson = adjustment.lesson || 0
    const num = parseInt(lesson)
    if (isNaN(num)) return lesson

    if (num > 0) {
      return `+${num} buổi`
    } else if (num < 0) {
      return `${num} buổi`
    } else {
      return '0 buổi'
    }
  } else {
    // For studentUpdateMonth, show the lesson value as is
    return adjustment.lesson || '0'
  }
}

// Helper function to get lesson color
const getLessonColor = (adjustment) => {
  if (adjustment.source === 'lessonUpdate') {
    const lesson = adjustment.lesson || 0
    const num = parseInt(lesson)
    if (isNaN(num)) return 'text-gray-600'

    if (num > 0) {
      return 'text-green-600 font-bold'
    } else if (num < 0) {
      return 'text-red-600 font-bold'
    } else {
      return 'text-gray-600'
    }
  } else {
    // For studentUpdateMonth
    const lessonValue = adjustment.lesson || ''
    if (lessonValue.includes('Break')) {
      return 'text-red-600 font-bold'
    }

    // Check if it's a numeric value
    const num = parseInt(lessonValue)
    if (!isNaN(num)) {
      if (num > 0) {
        return 'text-green-600 font-bold'
      } else if (num < 0) {
        return 'text-red-600 font-bold'
      } else {
        return 'text-blue-600'
      }
    }

    return 'text-gray-600'
  }
}

// Load adjustment data from both sheets
const loadAdjustmentData = async () => {
  if (!props.studentCode) return

  loading.value = true
  try {
    console.log('Loading adjustment data for student:', props.studentCode)

    // Load lessonUpdate data
    await store.load(DataSheet.lessonUpdate)
    lessonUpdateRecords.value = store.allData || []

    // Load studentUpdateMonth data
    await store.load(DataSheet.studentUpdateMonth)
    studentUpdateMonthRecords.value = store.allData || []

    loading.value = false
  } catch (error) {
    console.error('Lỗi khi tải dữ liệu điều chỉnh:', error)
    loading.value = false
  }
}

// Filter adjustment history for this student from both sources
const adjustmentHistory = computed(() => {
  const studentCodeLower = props.studentCode.toLowerCase()

  // Filter lessonUpdate records
  const filteredLessonUpdates = lessonUpdateRecords.value
    .filter((adjustment) => {
      const adjustmentCode = (adjustment.code || '').toLowerCase()
      const adjustmentStudentCode = (adjustment.studentCode || '').toLowerCase()
      const adjustmentStudent = (adjustment.student || '').toLowerCase()

      return (
        adjustmentCode === studentCodeLower ||
        adjustmentStudentCode === studentCodeLower ||
        adjustmentStudent === studentCodeLower
      )
    })
    .map((item) => ({ ...item, source: 'lessonUpdate' }))

  // Filter studentUpdateMonth records
  const filteredStudentUpdates = studentUpdateMonthRecords.value
    .filter((adjustment) => {
      const adjustmentCode = (adjustment.code || '').toLowerCase()
      const adjustmentStudentCode = (adjustment.studentCode || '').toLowerCase()
      const adjustmentStudent = (adjustment.student || '').toLowerCase()

      return (
        adjustmentCode === studentCodeLower ||
        adjustmentStudentCode === studentCodeLower ||
        adjustmentStudent === studentCodeLower
      )
    })
    .map((item) => ({ ...item, source: 'studentUpdateMonth' }))

  // Combine and sort by date (newest first)
  const combined = [...filteredLessonUpdates, ...filteredStudentUpdates]
  combined.sort((a, b) => {
    const dateA = new Date(a.dateUpdate || a.date || a.dateTime || a.ngayDieuChinh || 0)
    const dateB = new Date(b.dateUpdate || b.date || b.dateTime || b.ngayDieuChinh || 0)
    return dateB - dateA
  })

  console.log('Filtered lesson updates:', filteredLessonUpdates.length)
  console.log('Filtered student updates:', filteredStudentUpdates.length)
  console.log('Total filtered adjustments:', combined.length)

  return combined
})

// Paginated data
const paginatedAdjustments = computed(() => {
  const startIndex = (currentPage.value - 1) * pageSize
  const endIndex = startIndex + pageSize
  return adjustmentHistory.value.slice(startIndex, endIndex)
})

const totalPages = computed(() => {
  return Math.ceil(adjustmentHistory.value.length / pageSize)
})

// Lifecycle
onMounted(() => {
  loadAdjustmentData()
})

// Watch for student code changes
watch(
  () => props.studentCode,
  (newCode) => {
    if (newCode) {
      currentPage.value = 1
      loadAdjustmentData()
    }
  },
  { immediate: true },
)
</script>
