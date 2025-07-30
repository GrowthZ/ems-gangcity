<template>
  <div>
    <div class="flex items-center gap-2 mb-4">
      <VaIcon name="swap_vert" color="primary" />
      <h3 class="text-lg font-semibold">Lịch sử điều chỉnh</h3>
    </div>
    <div v-if="loading" class="flex justify-center py-8">
      <VaProgressCircular indeterminate />
    </div>

    <div v-else-if="adjustmentHistory.length === 0" class="text-center py-8">
      <VaIcon name="info" color="secondary" size="large" class="mb-4" />
      <p class="text-gray-500">Chưa có lịch sử điều chỉnh</p>
    </div>

    <div v-else class="space-y-4">
      <div
        v-for="(adjustment, index) in paginatedAdjustments"
        :key="index"
        class="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
      >
        <div class="flex items-center gap-4">
          <VaIcon name="swap_vert" color="warning" size="small" />
          <div>
            <div class="font-semibold">{{ adjustment.date }}</div>
            <div class="text-sm text-gray-600">
              {{ adjustment.reason || 'Điều chỉnh buổi học' }}
            </div>
            <div class="text-xs text-gray-500 mt-1">{{ adjustment.teacher }} - {{ adjustment.group }}</div>
          </div>
        </div>

        <div class="flex items-center gap-2">
          <VaChip text="Đã điều chỉnh" color="warning" size="small" />
          <span class="text-sm text-gray-500">{{ adjustment.time }}</span>
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

// Load adjustment data
const loadAdjustmentData = async () => {
  loading.value = true
  try {
    await store.load(DataSheet.lessonUpdate)
    loading.value = false
  } catch (error) {
    console.error('Lỗi khi tải dữ liệu điều chỉnh:', error)
    loading.value = false
  }
}

// Filter adjustment history for this student
const adjustmentHistory = computed(() => {
  const adjustmentData = store.allData || []

  // Filter by student code
  return adjustmentData.filter((adjustment) => adjustment.studentCode === props.studentCode)
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
  () => {
    currentPage.value = 1
    loadAdjustmentData()
  },
)
</script>
