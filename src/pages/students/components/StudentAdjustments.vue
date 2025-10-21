<template>
  <div class="student-adjustments">
    <!-- Loading state -->
    <div v-if="loading" class="loading-container">
      <VaProgressCircle indeterminate size="small" />
      <p class="loading-text">Đang tải dữ liệu...</p>
    </div>

    <!-- Empty state -->
    <div v-else-if="adjustmentHistory.length === 0" class="empty-state">
      <VaIcon name="edit_calendar" color="secondary" size="large" />
      <p class="empty-text">Chưa có lịch sử điều chỉnh</p>
    </div>

    <!-- Adjustment list -->
    <div v-else class="adjustment-content">
      <div class="adjustment-list">
        <div v-for="(adjustment, index) in paginatedAdjustments" :key="index" class="adjustment-item">
          <div class="adjustment-left">
            <div class="adjustment-icon" :class="`icon-${getAdjustmentType(adjustment)}`">
              <VaIcon :name="adjustment.source === 'lessonUpdate' ? 'swap_vert' : 'calendar_month'" size="small" />
            </div>
            <div class="adjustment-info">
              <div class="adjustment-date">{{ formatDate(adjustment.dateUpdate || adjustment.date) }}</div>
              <div class="adjustment-desc">{{ getAdjustmentDescription(adjustment) }}</div>
              <div class="adjustment-source">{{ getSourceLabel(adjustment.source) }}</div>
            </div>
          </div>

          <div class="adjustment-right">
            <VaChip :text="getAdjustmentStatus(adjustment)" :color="getAdjustmentColor(adjustment)" size="small" />
            <div class="adjustment-value" :class="`value-${getAdjustmentType(adjustment)}`">
              {{ formatLessonValue(adjustment) }}
            </div>
          </div>
        </div>
      </div>

      <!-- Pagination -->
      <div v-if="totalPages > 1" class="adjustment-pagination">
        <VaPagination
          v-model="currentPage"
          :pages="totalPages"
          :visible-pages="3"
          buttons-preset="secondary"
          size="small"
          gapped
        />
      </div>
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

const formatDate = (dateString) => {
  if (!dateString) return 'Chưa có ngày'
  
  try {
    let date
    
    // Format: DD/MM/YYYY
    if (dateString.includes('/')) {
      const parts = dateString.split('/')
      if (parts.length === 3) {
        // Assuming DD/MM/YYYY
        date = new Date(parts[2], parts[1] - 1, parts[0])
      }
    } 
    // Format: YYYY-MM-DD or ISO
    else if (dateString.includes('-')) {
      date = new Date(dateString)
    }
    // Timestamp
    else if (!isNaN(dateString)) {
      date = new Date(parseInt(dateString))
    }
    // Default
    else {
      date = new Date(dateString)
    }
    
    // Check if date is valid
    if (isNaN(date.getTime())) {
      console.warn('⚠️ Invalid adjustment date:', dateString)
      return dateString
    }
    
    return date.toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    })
  } catch (error) {
    console.error('❌ Error formatting adjustment date:', dateString, error)
    return dateString
  }
}

const getAdjustmentType = (adjustment) => {
  const lesson = parseInt(adjustment.lesson || 0)
  if (isNaN(lesson)) return 'neutral'
  return lesson > 0 ? 'increase' : lesson < 0 ? 'decrease' : 'neutral'
}

const getAdjustmentDescription = (adjustment) => {
  if (adjustment.source === 'lessonUpdate') {
    return adjustment.reason || adjustment.note || 'Điều chỉnh lịch học'
  }
  const lessonValue = adjustment.lesson || ''
  if (lessonValue.includes('Break')) {
    return `Nghỉ học: ${lessonValue}`
  }
  return adjustment.note || 'Điều chỉnh theo quy định'
}

const getAdjustmentStatus = (adjustment) => {
  const lesson = parseInt(adjustment.lesson || 0)
  if (isNaN(lesson)) {
    const lessonValue = adjustment.lesson || ''
    return lessonValue.includes('Break') ? 'Nghỉ học' : 'Điều chỉnh'
  }
  if (lesson > 0) return 'Tăng buổi'
  if (lesson < 0) return 'Giảm buổi'
  return 'Không đổi'
}

const getAdjustmentColor = (adjustment) => {
  const lesson = parseInt(adjustment.lesson || 0)
  if (!isNaN(lesson)) {
    if (lesson > 0) return 'success'
    if (lesson < 0) return 'danger'
  }
  const lessonValue = adjustment.lesson || ''
  return lessonValue.includes('Break') ? 'warning' : 'info'
}

const formatLessonValue = (adjustment) => {
  const lessonValue = adjustment.lesson || '0'
  const num = parseInt(lessonValue)
  if (!isNaN(num)) {
    return num > 0 ? `+${num} buổi` : `${num} buổi`
  }
  return lessonValue
}

const getSourceLabel = (source) => {
  return source === 'lessonUpdate' ? 'Điều chỉnh lịch' : 'Theo quy định'
}

const loadAdjustmentData = async () => {
  if (!props.studentCode) return

  loading.value = true
  try {
    // Load lesson update data
    await store.load(DataSheet.lessonUpdate)
    const lessonUpdates = (store.allData || [])
      .filter((item) => (item.studentCode || '').toLowerCase() === props.studentCode.toLowerCase())
      .map((item) => ({ ...item, source: 'lessonUpdate' }))

    // Load student update month data
    await store.load(DataSheet.studentUpdateMonth)
    const studentUpdates = (store.allData || [])
      .filter((item) => (item.studentCode || '').toLowerCase() === props.studentCode.toLowerCase())
      .map((item) => ({ ...item, source: 'studentUpdateMonth' }))

    // Combine and sort
    const combined = [...lessonUpdates, ...studentUpdates]
    combined.sort((a, b) => {
      const dateA = new Date(a.dateUpdate || a.date || 0)
      const dateB = new Date(b.dateUpdate || b.date || 0)
      return dateB - dateA
    })

    adjustmentHistory.value = combined
  } catch (error) {
    console.error('Lỗi khi tải dữ liệu điều chỉnh:', error)
    adjustmentHistory.value = []
  } finally {
    loading.value = false
  }
}

const adjustmentHistory = ref([])

const paginatedAdjustments = computed(() => {
  const start = (currentPage.value - 1) * pageSize
  return adjustmentHistory.value.slice(start, start + pageSize)
})

const totalPages = computed(() => Math.ceil(adjustmentHistory.value.length / pageSize))

onMounted(() => {
  loadAdjustmentData()
})

watch(
  () => props.studentCode,
  (newCode) => {
    if (newCode) {
      currentPage.value = 1
      loadAdjustmentData()
    }
  },
)
</script>

<style lang="scss" scoped>
.student-adjustments {
  min-height: 200px;
}

.loading-container,
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem 1rem;
  gap: 1rem;
  text-align: center;
}

.loading-text,
.empty-text {
  color: var(--va-secondary);
  font-size: 0.875rem;
}

.adjustment-content {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.adjustment-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.adjustment-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.875rem;
  background-color: var(--va-background-element);
  border-radius: 0.5rem;
  border: 1px solid var(--va-background-border);
  transition: all 0.2s;

  &:hover {
    background-color: var(--va-background-border);
    transform: translateX(4px);
  }

  @media (min-width: 640px) {
    padding: 1rem;
  }
}

.adjustment-left {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex: 1;
  min-width: 0;
}

.adjustment-icon {
  flex-shrink: 0;
  width: 2rem;
  height: 2rem;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 0.375rem;

  &.icon-increase {
    background-color: rgba(var(--va-success-rgb), 0.1);
    color: var(--va-success);
  }

  &.icon-decrease {
    background-color: rgba(var(--va-danger-rgb), 0.1);
    color: var(--va-danger);
  }

  &.icon-neutral {
    background-color: rgba(var(--va-info-rgb), 0.1);
    color: var(--va-info);
  }
}

.adjustment-info {
  flex: 1;
  min-width: 0;
}

.adjustment-date {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--va-text-primary);
  margin-bottom: 0.25rem;

  @media (min-width: 640px) {
    font-size: 1rem;
  }
}

.adjustment-desc {
  font-size: 0.75rem;
  color: var(--va-secondary);
  margin-bottom: 0.125rem;

  @media (min-width: 640px) {
    font-size: 0.875rem;
  }
}

.adjustment-source {
  font-size: 0.75rem;
  color: var(--va-text-secondary);
}

.adjustment-right {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 0.5rem;
  flex-shrink: 0;
}

.adjustment-value {
  font-size: 0.875rem;
  font-weight: 700;

  @media (min-width: 640px) {
    font-size: 1rem;
  }

  &.value-increase {
    color: var(--va-success);
  }

  &.value-decrease {
    color: var(--va-danger);
  }

  &.value-neutral {
    color: var(--va-secondary);
  }
}

.adjustment-pagination {
  display: flex;
  justify-content: center;
  margin-top: 0.5rem;
}
</style>
