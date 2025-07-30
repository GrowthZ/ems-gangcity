<template>
  <div>
    <div class="flex items-center gap-2 mb-4">
      <VaIcon name="payments" color="primary" />
      <h3 class="text-lg font-semibold">Lịch sử thanh toán</h3>
    </div>

    <div v-if="loading" class="flex justify-center py-8">
      <VaProgressCircle indeterminate />
    </div>

    <div v-else-if="paymentHistory.length === 0" class="text-center py-8">
      <VaIcon name="info" color="secondary" size="large" class="mb-4" />
      <p class="text-gray-500">Chưa có lịch sử thanh toán</p>
      <p class="text-xs text-gray-400 mt-2">Mã học viên: {{ studentCode }}</p>
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
            <div class="font-semibold">{{ formatDate(payment.datePayment) }}</div>
            <div class="text-sm text-gray-600">{{ formatMoney(payment.money) }} VNĐ</div>
            <div class="text-xs text-gray-500">
              {{ payment.type === 'Le' ? 'Lẻ' : payment.type === 'Khoa' ? 'Khóa' : payment.type }} -
              {{ payment.lesson }} buổi
            </div>
            <div v-if="payment.note" class="text-xs text-gray-400">{{ payment.note }}</div>
          </div>
        </div>

        <div class="flex flex-col items-end gap-2">
          <VaChip text="Đã thanh toán" color="success" size="small" />
          <span class="text-sm text-gray-500">{{ payment.studentName }}</span>
        </div>
      </div>

      <!-- Summary row -->
      <div class="flex items-center justify-between p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <div class="flex items-center gap-4">
          <VaIcon name="calculate" color="primary" size="small" />
          <div>
            <div class="font-semibold text-blue-800">Tổng cộng</div>
            <div class="text-sm text-blue-600">{{ paymentHistory.length }} giao dịch</div>
          </div>
        </div>

        <div class="flex flex-col items-end gap-2">
          <div class="text-lg font-bold text-blue-800">{{ formatMoney(totalAmount) }} VNĐ</div>
          <div class="text-sm text-blue-600">{{ totalLessons }} buổi học</div>
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
      <p>Total Payment Records: {{ totalPaymentRecords }}</p>
      <p>Filtered Payments: {{ paymentHistory.length }}</p>
      <p>Loading: {{ loading }}</p>
      <p>Data Source: DongHoc</p>
      <p>Sample Data: {{ paymentHistory.length > 0 ? JSON.stringify(paymentHistory[0]) : 'No data' }}</p>
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

const totalPaymentRecords = computed(() => store.allData?.length || 0)

// Helper functions
const formatDate = (dateString) => {
  if (!dateString) return 'Chưa có ngày'
  return dateString
}

const formatMoney = (amount) => {
  if (!amount && amount !== 0) return '0'

  // Convert to string first
  const amountStr = amount.toString()

  // If the amount already contains dots (thousand separators), just return it
  if (amountStr.includes('.')) {
    return amountStr
  }

  // Convert to number if it's a string without dots
  let num = amount
  if (typeof amount === 'string') {
    // Remove any non-numeric characters except dots and commas
    num = parseFloat(amount.replace(/[^\d.,]/g, '').replace(',', '.'))
  } else {
    num = parseFloat(amount)
  }

  // Check if it's a valid number
  if (isNaN(num)) return '0'

  // Format as Vietnamese currency
  return num.toLocaleString('vi-VN')
}

// Load payment data
const loadPaymentData = async () => {
  if (!props.studentCode) return

  loading.value = true
  try {
    console.log('Loading payment data for student:', props.studentCode)
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
  console.log('Total payment records:', paymentData.length)

  // Filter by student code - check studentCode field
  const filteredPayments = paymentData.filter((payment) => {
    const studentCodeLower = props.studentCode.toLowerCase()
    const paymentStudentCode = (payment.studentCode || '').toLowerCase()

    return paymentStudentCode === studentCodeLower
  })

  console.log('Filtered payment records:', filteredPayments.length)
  return filteredPayments
})

// Calculate total amount
const totalAmount = computed(() => {
  return paymentHistory.value.reduce((sum, payment) => {
    let amount = 0

    if (payment.money) {
      const moneyStr = payment.money.toString()

      // If the money already contains dots (thousand separators), remove them first
      if (moneyStr.includes('.')) {
        amount = parseFloat(moneyStr.replace(/\./g, ''))
      } else {
        // Remove any non-numeric characters except dots and commas
        amount = parseFloat(moneyStr.replace(/[^\d.,]/g, '').replace(',', '.'))
      }
    }

    return sum + (isNaN(amount) ? 0 : amount)
  }, 0)
})

// Calculate total lessons
const totalLessons = computed(() => {
  return paymentHistory.value.reduce((sum, payment) => {
    const lessons = parseInt(payment.lesson || '0')
    return sum + (isNaN(lessons) ? 0 : lessons)
  }, 0)
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
  (newCode) => {
    if (newCode) {
      currentPage.value = 1
      loadPaymentData()
    }
  },
  { immediate: true },
)
</script>
