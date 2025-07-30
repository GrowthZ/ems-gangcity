<template>
  <div class="student-history">
    <VaCard class="mb-6">
      <VaCardTitle class="flex items-center gap-2">
        <VaIcon name="history" color="primary" />
        Lịch sử học tập
      </VaCardTitle>
      <VaCardContent>
        <div v-if="loading" class="flex justify-center items-center h-32">
          <VaProgressCircular indeterminate />
        </div>
        <div v-else-if="history.length === 0" class="text-center py-8">
          <VaIcon name="info" color="secondary" size="large" class="mb-4" />
          <p class="text-gray-500">Chưa có lịch sử học tập</p>
        </div>
        <div v-else class="space-y-4">
          <div
            v-for="(item, index) in history"
            :key="index"
            class="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
          >
            <div class="flex items-center gap-4">
              <VaIcon name="event" color="secondary" size="small" />
              <div>
                <div class="font-semibold">{{ item.dateTime }}</div>
                <div class="text-sm text-gray-600">{{ item.group }}</div>
              </div>
            </div>
            <div class="text-right">
              <div class="font-semibold">{{ item.teacher || 'Chưa có' }}</div>
              <div class="text-sm text-gray-600">{{ item.subTeacher || 'Chưa có trợ giảng' }}</div>
            </div>
          </div>
        </div>
      </VaCardContent>
    </VaCard>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
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

const loadHistory = async () => {
  loading.value = true
  try {
    await store.load(DataSheet.attendance)

    // Lọc lịch sử theo mã học viên
    history.value = store.allData.filter((item) => {
      // Giả sử có trường studentCode hoặc tương tự trong dữ liệu attendance
      return (
        item.studentCode === props.studentCode || item.code === props.studentCode || item.student === props.studentCode
      )
    })
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
</script>

<style lang="scss" scoped>
.student-history {
  // Add any specific styles here
}
</style>
