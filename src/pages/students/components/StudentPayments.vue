<template>
  <div>
    <div class="flex items-center gap-2 mb-4">
      <VaIcon name="payments" color="primary" />
      <h3 class="text-lg font-semibold">Lịch sử thanh toán</h3>
    </div>
    <div v-if="loading" class="flex justify-center py-8">
      <VaProgressCircular indeterminate />
    </div>

    <div v-else-if="paymentHistory.length === 0" class="text-center py-8">
      <VaIcon name="info" color="secondary" size="large" class="mb-4" />
      <p class="text-gray-500">Chưa có lịch sử thanh toán</p>
    </div>

    <div v-else class="space-y-4">
      <div
        v-for="(payment, index) in paginatedPayments"
        :key="index"
        class="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
      >
        <div class="flex items-center gap-4">
          <VaIcon name="currency_exchange" color="success" size="small" />
          <div>
            <div class="font-semibold">{{ payment.date }}</div>
            <div class="text-sm text-gray-600">{{ payment.amount }} VNĐ</div>
          </div>
        </div>

        <div class="flex items-center gap-2">
          <VaChip text="Đã thanh toán" color="success" size="small" />
          <span class="text-sm text-gray-500">{{ payment.time }}</span>
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

// Load payment data
const loadPaymentData = async () => {
  loading.value = true
  try {
    await store.load(DataSheet.payment)
    loading.value = false
  } catch (error) {
    console.error('Lỗi khi tải dữ liệu thanh toán:', error)
    loading.value = false
  }
}

// Filter payment history for this student
const paymentHistory = computed(() => {
  const paymentData = store.allData || []

  // Filter by student code
  return paymentData.filter((payment) => payment.studentCode === props.studentCode)
})

// Paginated data
const paginatedPayments = computed(() => {
  const startIndex = (currentPage.value - 1) * pageSize
  const endIndex = startIndex + pageSize
  return paymentHistory.value.slice(startIndex, endIndex)
})

const totalPages = computed(() => {
  return Math.ceil(paymentHistory.value.length / pageSize)
})

// Lifecycle
onMounted(() => {
  loadPaymentData()
})

// Watch for student code changes
watch(
  () => props.studentCode,
  () => {
    currentPage.value = 1
    loadPaymentData()
  },
)
</script>
