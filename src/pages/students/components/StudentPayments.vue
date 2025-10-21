<template>
  <div class="student-payments">
    <!-- Loading state -->
    <div v-if="loading" class="loading-container">
      <VaProgressCircle indeterminate size="small" />
      <p class="loading-text">Đang tải dữ liệu...</p>
    </div>

    <!-- Empty state -->
    <div v-else-if="paymentHistory.length === 0" class="empty-state">
      <VaIcon name="account_balance_wallet" color="secondary" size="large" />
      <p class="empty-text">Chưa có lịch sử thanh toán</p>
    </div>

    <!-- Payment list -->
    <div v-else class="payment-content">
      <div class="payment-list">
        <div v-for="(payment, index) in paginatedPayments" :key="index" class="payment-item">
          <div class="payment-left">
            <div class="payment-icon">
              <VaIcon name="currency_exchange" color="success" size="small" />
            </div>
            <div class="payment-info">
              <div class="payment-date">{{ formatDate(payment.datePayment) }}</div>
              <div class="payment-details">
                <span class="payment-type">{{ getPaymentType(payment.type) }}</span>
                <span class="payment-lessons">{{ payment.lesson }} buổi</span>
              </div>
              <div v-if="payment.note" class="payment-note">{{ payment.note }}</div>
            </div>
          </div>

          <div class="payment-right">
            <div class="payment-amount">{{ formatMoney(payment.money) }}</div>
            <div class="payment-unit">VNĐ</div>
          </div>
        </div>
      </div>

      <!-- Summary -->
      <div class="payment-summary">
        <div class="summary-left">
          <VaIcon name="calculate" color="primary" />
          <div class="summary-info">
            <div class="summary-title">Tổng cộng</div>
            <div class="summary-count">{{ paymentHistory.length }} giao dịch</div>
          </div>
        </div>

        <div class="summary-right">
          <div class="summary-amount">{{ formatMoney(totalAmount) }}</div>
          <div class="summary-details">
            <span>VNĐ</span>
            <span class="summary-lessons">{{ totalLessons }} buổi</span>
          </div>
        </div>
      </div>

      <!-- Pagination -->
      <div v-if="totalPages > 1" class="payment-pagination">
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

// Helper functions
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
      console.warn('⚠️ Invalid payment date:', dateString)
      return dateString
    }

    return date.toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    })
  } catch (error) {
    console.error('❌ Error formatting payment date:', dateString, error)
    return dateString
  }
}

const formatMoney = (amount) => {
  if (!amount && amount !== 0) return '0'
  const amountStr = amount.toString()
  if (amountStr.includes('.')) return amountStr

  let num = amount
  if (typeof amount === 'string') {
    num = parseFloat(amount.replace(/[^\d.,]/g, '').replace(',', '.'))
  } else {
    num = parseFloat(amount)
  }

  if (isNaN(num)) return '0'
  return num.toLocaleString('vi-VN')
}

const getPaymentType = (type) => {
  const typeMap = {
    Le: 'Lẻ',
    Khoa: 'Khóa',
  }
  return typeMap[type] || type || 'Chưa rõ'
}

// Load payment data
const loadPaymentData = async () => {
  if (!props.studentCode) return

  loading.value = true
  try {
    await store.load(DataSheet.payment)
  } catch (error) {
    console.error('Lỗi khi tải dữ liệu thanh toán:', error)
  } finally {
    loading.value = false
  }
}

// Filter payment history for this student
const paymentHistory = computed(() => {
  const paymentData = store.allData || []
  const studentCodeLower = props.studentCode.toLowerCase()

  return paymentData.filter((payment) => {
    const paymentStudentCode = (payment.studentCode || '').toLowerCase()
    return paymentStudentCode === studentCodeLower
  })
})

// Calculate total amount
const totalAmount = computed(() => {
  return paymentHistory.value.reduce((sum, payment) => {
    let amount = 0
    if (payment.money) {
      const moneyStr = payment.money.toString()
      if (moneyStr.includes('.')) {
        amount = parseFloat(moneyStr.replace(/\./g, ''))
      } else {
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
  return paymentHistory.value.slice(startIndex, startIndex + pageSize)
})

const totalPages = computed(() => Math.ceil(paymentHistory.value.length / pageSize))

// Lifecycle
onMounted(() => {
  loadPaymentData()
})

watch(
  () => props.studentCode,
  (newCode) => {
    if (newCode) {
      currentPage.value = 1
      loadPaymentData()
    }
  },
)
</script>

<style lang="scss" scoped>
.student-payments {
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

.payment-content {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.payment-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.payment-item {
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

.payment-left {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex: 1;
  min-width: 0;
}

.payment-icon {
  flex-shrink: 0;
  width: 2rem;
  height: 2rem;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: rgba(var(--va-success-rgb), 0.1);
  border-radius: 0.375rem;
}

.payment-info {
  flex: 1;
  min-width: 0;
}

.payment-date {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--va-text-primary);
  margin-bottom: 0.25rem;

  @media (min-width: 640px) {
    font-size: 1rem;
  }
}

.payment-details {
  display: flex;
  gap: 0.5rem;
  font-size: 0.75rem;
  color: var(--va-secondary);
  margin-bottom: 0.125rem;

  @media (min-width: 640px) {
    font-size: 0.875rem;
  }
}

.payment-type,
.payment-lessons {
  display: inline-block;
}

.payment-note {
  font-size: 0.75rem;
  color: var(--va-text-secondary);
  margin-top: 0.25rem;
}

.payment-right {
  flex-shrink: 0;
  text-align: right;
}

.payment-amount {
  font-size: 1rem;
  font-weight: 700;
  color: var(--va-success);

  @media (min-width: 640px) {
    font-size: 1.125rem;
  }
}

.payment-unit {
  font-size: 0.75rem;
  color: var(--va-secondary);
}

.payment-summary {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem;
  background: linear-gradient(135deg, rgba(var(--va-primary-rgb), 0.1), rgba(var(--va-info-rgb), 0.05));
  border-radius: 0.5rem;
  border: 1px solid rgba(var(--va-primary-rgb), 0.2);

  @media (min-width: 640px) {
    padding: 1.25rem;
  }
}

.summary-left {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.summary-info {
  display: flex;
  flex-direction: column;
}

.summary-title {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--va-primary);

  @media (min-width: 640px) {
    font-size: 1rem;
  }
}

.summary-count {
  font-size: 0.75rem;
  color: var(--va-secondary);
}

.summary-right {
  text-align: right;
}

.summary-amount {
  font-size: 1.125rem;
  font-weight: 700;
  color: var(--va-primary);

  @media (min-width: 640px) {
    font-size: 1.25rem;
  }
}

.summary-details {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  justify-content: flex-end;
  font-size: 0.75rem;
  color: var(--va-secondary);
  margin-top: 0.25rem;

  @media (min-width: 640px) {
    font-size: 0.875rem;
  }
}

.summary-lessons {
  padding: 0.125rem 0.5rem;
  background-color: rgba(var(--va-info-rgb), 0.1);
  border-radius: 0.25rem;
  color: var(--va-info);
}

.payment-pagination {
  display: flex;
  justify-content: center;
  margin-top: 0.5rem;
}
</style>
