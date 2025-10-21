<template>
  <div class="financial-report-page">
    <!-- Header -->
    <div class="page-header">
      <div class="header-left">
        <h1 class="page-title">Báo cáo tài chính - Tình hình đóng học</h1>
        <p class="page-subtitle">Thống kê doanh thu và tình hình thanh toán học phí</p>
      </div>
      <div class="header-actions">
        <VaButton icon="refresh" color="primary" @click="loadData">Làm mới</VaButton>
        <VaButton icon="download" color="success" @click="exportToExcel">Xuất Excel</VaButton>
      </div>
    </div>

    <!-- Filters -->
    <VaCard class="filter-card">
      <VaCardContent>
        <div class="filter-grid">
          <VaDateInput
            v-model="dateRange"
            mode="range"
            label="Khoảng thời gian"
            placeholder="Chọn khoảng thời gian"
            clearable
          />
          <VaSelect
            v-model="selectedLocation"
            label="Cơ sở"
            placeholder="Tất cả cơ sở"
            :options="locationOptions"
            clearable
          />
          <VaSelect
            v-model="selectedGroup"
            label="Lớp học"
            placeholder="Tất cả lớp"
            :options="groupOptions"
            clearable
          />
          <VaSelect
            v-model="selectedPaymentType"
            label="Loại thanh toán"
            placeholder="Tất cả loại"
            :options="paymentTypeOptions"
            clearable
          />
        </div>
      </VaCardContent>
    </VaCard>

    <!-- Loading State -->
    <div v-if="loading" class="loading-container">
      <VaProgressCircle indeterminate />
      <p>Đang tải dữ liệu...</p>
    </div>

    <!-- Statistics Cards -->
    <div v-else class="stats-section">
      <div class="stats-grid">
        <!-- Tổng doanh thu -->
        <VaCard class="stat-card revenue">
          <VaCardContent>
            <div class="stat-icon">
              <VaIcon name="payments" size="large" />
            </div>
            <div class="stat-content">
              <div class="stat-label">Tổng doanh thu</div>
              <div class="stat-value">{{ formatMoney(statistics.totalRevenue) }}</div>
              <div class="stat-unit">VNĐ</div>
            </div>
          </VaCardContent>
        </VaCard>

        <!-- Số giao dịch -->
        <VaCard class="stat-card transactions">
          <VaCardContent>
            <div class="stat-icon">
              <VaIcon name="receipt" size="large" />
            </div>
            <div class="stat-content">
              <div class="stat-label">Số giao dịch</div>
              <div class="stat-value">{{ formatNumber(statistics.totalTransactions) }}</div>
              <div class="stat-unit">giao dịch</div>
            </div>
          </VaCardContent>
        </VaCard>

        <!-- Số học viên đóng tiền -->
        <VaCard class="stat-card students">
          <VaCardContent>
            <div class="stat-icon">
              <VaIcon name="people" size="large" />
            </div>
            <div class="stat-content">
              <div class="stat-label">Học viên đóng tiền</div>
              <div class="stat-value">{{ formatNumber(statistics.totalStudents) }}</div>
              <div class="stat-unit">học viên</div>
            </div>
          </VaCardContent>
        </VaCard>

        <!-- Tổng số buổi -->
        <VaCard class="stat-card lessons">
          <VaCardContent>
            <div class="stat-icon">
              <VaIcon name="event" size="large" />
            </div>
            <div class="stat-content">
              <div class="stat-label">Tổng số buổi</div>
              <div class="stat-value">{{ formatNumber(statistics.totalLessons) }}</div>
              <div class="stat-unit">buổi</div>
            </div>
          </VaCardContent>
        </VaCard>
      </div>

      <!-- Chart Section -->
      <div v-if="showChart" class="chart-section">
        <VaCard>
          <VaCardTitle>
            <div class="card-title-with-toggle">
              <span>Biểu đồ doanh thu theo thời gian</span>
              <VaButton preset="plain" icon="close" size="small" @click="showChart = false" />
            </div>
          </VaCardTitle>
          <VaCardContent>
            <div class="chart-container">
              <canvas ref="revenueChart"></canvas>
            </div>
          </VaCardContent>
        </VaCard>
      </div>

      <!-- Payment Type Distribution -->
      <div v-if="showDistribution" class="distribution-section">
        <VaCard>
          <VaCardTitle>
            <div class="card-title-with-toggle">
              <span>Phân bổ theo loại thanh toán</span>
              <VaButton preset="plain" icon="close" size="small" @click="showDistribution = false" />
            </div>
          </VaCardTitle>
          <VaCardContent>
            <div class="distribution-grid">
              <div v-for="(item, index) in paymentTypeDistribution" :key="index" class="distribution-item">
                <div class="distribution-label">
                  <VaBadge :color="item.color" />
                  <span>{{ item.type }}</span>
                </div>
                <div class="distribution-stats">
                  <div class="distribution-amount">{{ formatMoney(item.amount) }} VNĐ</div>
                  <div class="distribution-count">{{ formatNumber(item.count) }} giao dịch</div>
                  <VaProgressBar :model-value="item.percentage" :color="item.color" />
                  <div class="distribution-percentage">{{ item.percentage.toFixed(1) }}%</div>
                </div>
              </div>
            </div>
          </VaCardContent>
        </VaCard>
      </div>

      <!-- Toggle buttons for Chart and Distribution -->
      <!-- <div class="toggle-section">
        <VaButton v-if="!showChart" icon="show_chart" color="primary" @click="showChart = true">
          Hiển thị biểu đồ
        </VaButton>
        <VaButton v-if="!showDistribution" icon="pie_chart" color="info" @click="showDistribution = true">
          Hiển thị phân bổ
        </VaButton>
      </div> -->

      <!-- Data Table -->
      <VaCard class="table-card">
        <VaCardTitle>
          <div class="table-header">
            <span>Chi tiết giao dịch</span>
            <VaInput v-model="searchQuery" placeholder="Tìm kiếm..." class="search-input">
              <template #prependInner>
                <VaIcon name="search" size="small" />
              </template>
            </VaInput>
          </div>
        </VaCardTitle>
        <VaCardContent>
          <VaDataTable
            :items="filteredPayments"
            :columns="columns"
            :per-page="perPage"
            :current-page="currentPage"
            striped
            hoverable
            @row-click="handleRowClick"
          >
            <template #cell(datePayment)="{ rowData }">
              <div class="cell-date">
                <VaIcon name="calendar_today" size="small" />
                {{ formatDate(rowData.datePayment) }}
              </div>
            </template>

            <template #cell(studentCode)="{ rowData }">
              <div class="cell-student">
                <VaBadge color="info" :text="rowData.studentCode" />
                <div class="student-name">{{ rowData.studentName || rowData.fullname }}</div>
              </div>
            </template>

            <template #cell(type)="{ rowData }">
              <VaChip :color="getPaymentTypeColor(rowData.type)" size="small">
                {{ getPaymentTypeLabel(rowData.type) }}
              </VaChip>
            </template>

            <template #cell(money)="{ rowData }">
              <div class="cell-money">{{ formatMoney(rowData.money) }} VNĐ</div>
            </template>

            <template #cell(lesson)="{ rowData }">
              <VaBadge color="success" :text="`${formatNumber(rowData.lesson)} buổi`" />
            </template>

            <template #cell(actions)="{ rowData }">
              <div class="cell-actions">
                <VaButton preset="plain" icon="visibility" size="small" @click.stop="viewDetail(rowData)" />
                <VaButton preset="plain" icon="edit" size="small" color="info" @click.stop="editPayment(rowData)" />
                <VaButton preset="plain" icon="delete" size="small" color="danger" @click.stop="deletePayment(rowData)" />
              </div>
            </template>
          </VaDataTable>

          <!-- Pagination -->
          <div class="pagination-container">
            <VaPagination
              v-model="currentPage"
              :pages="totalPages"
              :visible-pages="5"
              buttons-preset="secondary"
            />
          </div>
        </VaCardContent>
      </VaCard>
    </div>

    <!-- Detail Modal -->
    <VaModal v-model="showDetailModal" size="small" hide-default-actions>
      <template #header>
        <h3 class="modal-title">Chi tiết giao dịch</h3>
      </template>
      
      <div v-if="selectedPayment" class="detail-modal-content">
        <div class="detail-row">
          <span class="detail-label">Mã học viên:</span>
          <VaBadge :text="selectedPayment.studentCode" color="info" />
        </div>
        <div class="detail-row">
          <span class="detail-label">Tên học viên:</span>
          <span class="detail-value">{{ selectedPayment.studentName || selectedPayment.fullname || 'N/A' }}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Lớp học:</span>
          <span class="detail-value">{{ selectedPayment.group || 'N/A' }}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Ngày đóng:</span>
          <span class="detail-value">{{ formatDate(selectedPayment.datePayment) }}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Loại thanh toán:</span>
          <VaChip :color="getPaymentTypeColor(selectedPayment.type)" size="small">
            {{ getPaymentTypeLabel(selectedPayment.type) }}
          </VaChip>
        </div>
        <div class="detail-row">
          <span class="detail-label">Số buổi:</span>
          <VaBadge :text="`${formatNumber(selectedPayment.lesson)} buổi`" color="success" />
        </div>
        <div class="detail-row">
          <span class="detail-label">Số tiền:</span>
          <span class="detail-value amount">{{ formatMoney(selectedPayment.money) }} VNĐ</span>
        </div>
        <div v-if="selectedPayment.note" class="detail-row">
          <span class="detail-label">Ghi chú:</span>
          <span class="detail-value">{{ selectedPayment.note }}</span>
        </div>
        <div v-if="selectedPayment.location" class="detail-row">
          <span class="detail-label">Cơ sở:</span>
          <span class="detail-value">{{ selectedPayment.location }}</span>
        </div>
      </div>

      <template #footer>
        <VaButton color="secondary" @click="showDetailModal = false">Đóng</VaButton>
      </template>
    </VaModal>

    <!-- Edit Modal -->
    <VaModal v-model="showEditModal" size="small" hide-default-actions>
      <template #header>
        <h3 class="modal-title">Chỉnh sửa giao dịch</h3>
      </template>
      
      <div v-if="editingPayment" class="edit-modal-content">
        <VaInput
          v-model="editingPayment.studentCode"
          label="Mã học viên"
          readonly
          disabled
        />
        <VaInput
          v-model="editingPayment.studentName"
          label="Tên học viên"
          readonly
          disabled
        />
        <VaDateInput
          v-model="editingPayment.datePayment"
          label="Ngày đóng"
          required-mark
        />
        <VaSelect
          v-model="editingPayment.type"
          label="Loại thanh toán"
          :options="['Le', 'Khoa']"
          required-mark
        />
        <VaInput
          v-model="editingPayment.lesson"
          label="Số buổi"
          type="number"
          required-mark
        />
        <VaInput
          v-model="editingPayment.money"
          label="Số tiền"
          type="text"
          required-mark
        />
        <VaTextarea
          v-model="editingPayment.note"
          label="Ghi chú"
          :max-rows="3"
        />
      </div>

      <template #footer>
        <VaButton color="secondary" @click="cancelEdit">Hủy</VaButton>
        <VaButton color="primary" :loading="saving" @click="savePayment">Lưu</VaButton>
      </template>
    </VaModal>

    <!-- Delete Confirm Modal -->
    <VaModal v-model="showDeleteModal" size="small" hide-default-actions>
      <template #header>
        <h3 class="modal-title">Xác nhận xóa</h3>
      </template>
      
      <div class="delete-modal-content">
        <VaIcon name="warning" color="danger" size="large" class="warning-icon" />
        <p class="delete-message">Bạn có chắc chắn muốn xóa giao dịch này không?</p>
        <div v-if="selectedPayment" class="delete-info">
          <p><strong>Học viên:</strong> {{ selectedPayment.studentCode }} - {{ selectedPayment.studentName }}</p>
          <p><strong>Số tiền:</strong> {{ formatMoney(selectedPayment.money) }} VNĐ</p>
          <p><strong>Ngày:</strong> {{ formatDate(selectedPayment.datePayment) }}</p>
        </div>
      </div>

      <template #footer>
        <VaButton color="secondary" @click="showDeleteModal = false">Hủy</VaButton>
        <VaButton color="danger" :loading="deleting" @click="confirmDelete">Xóa</VaButton>
      </template>
    </VaModal>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useData } from '../../stores/use-data'
import { DataSheet, Action, sendRequest, showMessageBox } from '../../stores/data-from-sheet'
import { Chart, registerables } from 'chart.js'
import { toCSV } from '../../services/toCSV'

Chart.register(...registerables)

const store = useData()
const loading = ref(true)

// UI State
const showChart = ref(false)
const showDistribution = ref(false)
const showDetailModal = ref(false)
const showEditModal = ref(false)
const showDeleteModal = ref(false)
const saving = ref(false)
const deleting = ref(false)

// Selected/Editing Data
const selectedPayment = ref(null)
const editingPayment = ref(null)

// Filters
const dateRange = ref(null)
const selectedLocation = ref(null)
const selectedGroup = ref(null)
const selectedPaymentType = ref(null)
const searchQuery = ref('')

// Pagination
const currentPage = ref(1)
const perPage = ref(20)

// Data
const payments = ref([])
const students = ref([])
const locations = ref([])
const groups = ref([])

// Chart
const revenueChart = ref(null)
let chartInstance = null

// Filter Options
const locationOptions = computed(() => {
  return ['Tất cả', ...new Set(locations.value.map((l) => l.name || l.location).filter(Boolean))]
})

const groupOptions = computed(() => {
  return ['Tất cả', ...new Set(groups.value.map((g) => g.name || g.group).filter(Boolean))]
})

const paymentTypeOptions = computed(() => ['Tất cả', 'Lẻ', 'Khóa'])

// Filtered Payments
const filteredPayments = computed(() => {
  let result = [...payments.value]

  // Filter by date range
  if (dateRange.value && dateRange.value.start && dateRange.value.end) {
    result = result.filter((p) => {
      const paymentDate = parseDate(p.datePayment)
      return paymentDate >= dateRange.value.start && paymentDate <= dateRange.value.end
    })
  }

  // Filter by location
  if (selectedLocation.value && selectedLocation.value !== 'Tất cả') {
    result = result.filter((p) => p.location === selectedLocation.value)
  }

  // Filter by group
  if (selectedGroup.value && selectedGroup.value !== 'Tất cả') {
    result = result.filter((p) => p.group === selectedGroup.value)
  }

  // Filter by payment type
  if (selectedPaymentType.value && selectedPaymentType.value !== 'Tất cả') {
    result = result.filter((p) => getPaymentTypeLabel(p.type) === selectedPaymentType.value)
  }

  // Search
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    result = result.filter(
      (p) =>
        (p.studentCode || '').toLowerCase().includes(query) ||
        (p.studentName || p.fullname || '').toLowerCase().includes(query) ||
        (p.note || '').toLowerCase().includes(query),
    )
  }

  return result
})

// Check if any filter is active (MUST be before statistics)
const hasActiveFilters = computed(() => {
  const hasDateFilter = !!(dateRange.value?.start && dateRange.value?.end)
  const hasLocationFilter = !!(selectedLocation.value && selectedLocation.value !== 'Tất cả')
  const hasGroupFilter = !!(selectedGroup.value && selectedGroup.value !== 'Tất cả')
  const hasTypeFilter = !!(selectedPaymentType.value && selectedPaymentType.value !== 'Tất cả')
  const hasSearchFilter = !!(searchQuery.value && searchQuery.value.trim())
  
  return hasDateFilter || hasLocationFilter || hasGroupFilter || hasTypeFilter || hasSearchFilter
})

// Statistics - Use all data when no filters, filtered data when filters active
const statistics = computed(() => {
  // Choose data source
  const dataToUse = hasActiveFilters.value ? filteredPayments.value : payments.value
  
  console.log('📊 Statistics Debug:')
  console.log('  - Total payments:', payments.value.length)
  console.log('  - Has active filters:', hasActiveFilters.value)
  console.log('  - Data to use:', dataToUse.length)
  
  // Calculate with error handling
  let totalRevenue = 0
  let totalLessons = 0
  
  dataToUse.forEach((p) => {
    const money = parseMoney(p.money)
    const lesson = parseInt(p.lesson || 0)
    
    if (!isNaN(money)) {
      totalRevenue += money
    } else {
      console.warn('⚠️ Invalid money value:', p.money, 'for student:', p.studentCode)
    }
    
    if (!isNaN(lesson)) {
      totalLessons += lesson
    }
  })
  
  const totalTransactions = dataToUse.length
  const uniqueStudents = new Set(dataToUse.map((p) => p.studentCode).filter(Boolean))
  const totalStudents = uniqueStudents.size
  
  console.log('  - Total revenue:', totalRevenue)
  console.log('  - Total transactions:', totalTransactions)
  console.log('  - Total students:', totalStudents)
  console.log('  - Total lessons:', totalLessons)

  return {
    totalRevenue,
    totalTransactions,
    totalStudents,
    totalLessons,
  }
})

// Payment Type Distribution
const paymentTypeDistribution = computed(() => {
  const types = {}
  let total = 0

  filteredPayments.value.forEach((p) => {
    const type = getPaymentTypeLabel(p.type)
    const amount = parseFloat(parseMoney(p.money))
    
    if (!types[type]) {
      types[type] = { amount: 0, count: 0 }
    }
    
    types[type].amount += amount
    types[type].count += 1
    total += amount
  })

  return Object.entries(types).map(([type, data], index) => ({
    type,
    amount: data.amount,
    count: data.count,
    percentage: total > 0 ? (data.amount / total) * 100 : 0,
    color: index === 0 ? 'success' : 'primary',
  }))
})

// Table Columns
const columns = [
  { key: 'datePayment', label: 'Ngày đóng', sortable: true },
  { key: 'studentCode', label: 'Học viên', sortable: true },
  { key: 'group', label: 'Lớp', sortable: true },
  { key: 'type', label: 'Loại', sortable: true },
  { key: 'lesson', label: 'Số buổi', sortable: true },
  { key: 'money', label: 'Số tiền', sortable: true },
  { key: 'note', label: 'Ghi chú', sortable: false },
  { key: 'actions', label: 'Thao tác', width: 120 },
]

// Pagination
const totalPages = computed(() => Math.ceil(filteredPayments.value.length / perPage.value))

// Helper Functions
const formatDate = (dateString) => {
  if (!dateString) return 'Chưa có'
  
  try {
    let date
    
    if (dateString.includes('/')) {
      const parts = dateString.split('/')
      date = new Date(parts[2], parts[1] - 1, parts[0])
    } else if (dateString.includes('-')) {
      date = new Date(dateString)
    } else {
      date = new Date(dateString)
    }
    
    if (isNaN(date.getTime())) return dateString
    
    return date.toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    })
  } catch {
    return dateString
  }
}

const parseDate = (dateString) => {
  if (!dateString) return null
  
  try {
    if (dateString.includes('/')) {
      const parts = dateString.split('/')
      return new Date(parts[2], parts[1] - 1, parts[0])
    } else if (dateString.includes('-')) {
      return new Date(dateString)
    }
    return new Date(dateString)
  } catch {
    return null
  }
}

const formatMoney = (amount) => {
  if (!amount && amount !== 0) return '0'
  
  const num = parseFloat(parseMoney(amount))
  if (isNaN(num)) return '0'
  
  // Format with thousand separators: 1.000.000
  return num.toLocaleString('vi-VN')
}

const formatNumber = (num) => {
  if (!num && num !== 0) return '0'
  
  const number = parseInt(num)
  if (isNaN(number)) return '0'
  
  // Format with thousand separators: 1.000.000
  return number.toLocaleString('vi-VN')
}

const parseMoney = (amount) => {
  // Handle null, undefined, empty string
  if (!amount && amount !== 0) return 0
  
  // Convert to string
  let amountStr = amount.toString().trim()
  
  // Handle empty string after trim
  if (!amountStr) return 0
  
  try {
    // QUAN TRỌNG: Tiền luôn là số nguyên dương
    // Chỉ giữ lại các CHỮ SỐ, loại bỏ TẤT CẢ ký tự khác (dấu chấm, phấy, chữ, khoảng trắng...)
    const cleanedStr = amountStr.replace(/[^\d]/g, '')
    
    // Nếu không còn số nào sau khi clean
    if (!cleanedStr || cleanedStr === '') return 0
    
    // Parse thành số nguyên
    const result = parseInt(cleanedStr, 10)
    
    // Kiểm tra kết quả hợp lệ
    if (isNaN(result) || result < 0) {
      console.warn('⚠️ Invalid money value after parsing:', amount, '→', cleanedStr, '→', result)
      return 0
    }
    
    return result
    
  } catch (error) {
    console.error('❌ Parse money error:', error, 'for amount:', amount)
    return 0
  }
}

const getPaymentTypeLabel = (type) => {
  const typeMap = {
    Le: 'Lẻ',
    Khoa: 'Khóa',
  }
  return typeMap[type] || type || 'Chưa rõ'
}

const getPaymentTypeColor = (type) => {
  const colorMap = {
    Le: 'success',
    Khoa: 'primary',
  }
  return colorMap[type] || 'info'
}

// Methods
const loadData = async () => {
  loading.value = true
  try {
    console.log('📊 Loading financial report data...')
    
    // Load payment, student, location, group data
    await store.load(DataSheet.payment, [DataSheet.student, DataSheet.location, DataSheet.group])
    
    payments.value = store.allData || []
    students.value = store.allAnotherData[0] || []
    locations.value = store.allAnotherData[1] || []
    groups.value = store.allAnotherData[2] || []
    
    console.log('📦 Raw data loaded:')
    console.log('  - Payments:', payments.value.length)
    console.log('  - Students:', students.value.length)
    console.log('  - Locations:', locations.value.length)
    console.log('  - Groups:', groups.value.length)
    
    // Debug: Check first few payments
    if (payments.value.length > 0) {
      console.log('🔍 Sample payment data:', payments.value.slice(0, 3))
    }
    
    // Merge student names
    payments.value = payments.value.map((p) => {
      const student = students.value.find((s) => s.code === p.studentCode)
      return {
        ...p,
        studentName: student?.fullname || student?.name || '',
        location: student?.location || '',
        group: p.group || student?.group || '',
      }
    })
    
    console.log('✅ Loaded and merged payments:', payments.value.length)
    
    // Debug: Check money values and parsing
    console.log('🔍 Checking money parsing (first 5 records):')
    payments.value.slice(0, 5).forEach((p, index) => {
      const originalMoney = p.money
      const parsedMoney = parseMoney(p.money)
      console.log(`  [${index + 1}] Original: "${originalMoney}" → Parsed: ${parsedMoney.toLocaleString('vi-VN')}`)
    })
    
    // Debug: Calculate initial total
    const initialTotal = payments.value.reduce((sum, p) => {
      const money = parseMoney(p.money)
      return sum + (isNaN(money) ? 0 : money)
    }, 0)
    console.log('💰 Initial total revenue:', initialTotal.toLocaleString('vi-VN'), 'VNĐ')
    
    // Create chart after data loaded
    createRevenueChart()
  } catch (error) {
    console.error('❌ Error loading financial report:', error)
  } finally {
    loading.value = false
  }
}

const createRevenueChart = () => {
  if (!revenueChart.value) return
  
  // Destroy existing chart
  if (chartInstance) {
    chartInstance.destroy()
  }
  
  // Group by month
  const monthlyData = {}
  
  filteredPayments.value.forEach((p) => {
    const date = parseDate(p.datePayment)
    if (!date) return
    
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
    
    if (!monthlyData[monthKey]) {
      monthlyData[monthKey] = { revenue: 0, count: 0 }
    }
    
    monthlyData[monthKey].revenue += parseFloat(parseMoney(p.money))
    monthlyData[monthKey].count += 1
  })
  
  const sortedMonths = Object.keys(monthlyData).sort()
  const labels = sortedMonths.map((m) => {
    const [year, month] = m.split('-')
    return `${month}/${year}`
  })
  const revenueData = sortedMonths.map((m) => monthlyData[m].revenue)
  const countData = sortedMonths.map((m) => monthlyData[m].count)
  
  const ctx = revenueChart.value.getContext('2d')
  chartInstance = new Chart(ctx, {
    type: 'bar',
    data: {
      labels,
      datasets: [
        {
          label: 'Doanh thu (VNĐ)',
          data: revenueData,
          backgroundColor: 'rgba(52, 211, 153, 0.7)',
          borderColor: 'rgba(52, 211, 153, 1)',
          borderWidth: 1,
          yAxisID: 'y',
        },
        {
          label: 'Số giao dịch',
          data: countData,
          backgroundColor: 'rgba(59, 130, 246, 0.7)',
          borderColor: 'rgba(59, 130, 246, 1)',
          borderWidth: 1,
          yAxisID: 'y1',
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: {
          type: 'linear',
          position: 'left',
          title: {
            display: true,
            text: 'Doanh thu (VNĐ)',
          },
        },
        y1: {
          type: 'linear',
          position: 'right',
          title: {
            display: true,
            text: 'Số giao dịch',
          },
          grid: {
            drawOnChartArea: false,
          },
        },
      },
    },
  })
}

const handleRowClick = (event) => {
  console.log('Row clicked:', event.item)
  viewDetail(event.item)
}

const viewDetail = (payment) => {
  console.log('View detail:', payment)
  selectedPayment.value = payment
  showDetailModal.value = true
}

const editPayment = (payment) => {
  console.log('Edit payment:', payment)
  selectedPayment.value = payment
  editingPayment.value = { ...payment }
  
  // Convert date to Date object if needed
  if (editingPayment.value.datePayment) {
    const dateStr = editingPayment.value.datePayment
    if (dateStr.includes('/')) {
      const parts = dateStr.split('/')
      editingPayment.value.datePayment = new Date(parts[2], parts[1] - 1, parts[0])
    }
  }
  
  showEditModal.value = true
}

const cancelEdit = () => {
  showEditModal.value = false
  editingPayment.value = null
}

const savePayment = async () => {
  if (!editingPayment.value) return
  
  saving.value = true
  try {
    console.log('💾 Saving payment:', editingPayment.value)
    
    // Format date back to DD/MM/YYYY
    let formattedDate = editingPayment.value.datePayment
    if (formattedDate instanceof Date) {
      const day = String(formattedDate.getDate()).padStart(2, '0')
      const month = String(formattedDate.getMonth() + 1).padStart(2, '0')
      const year = formattedDate.getFullYear()
      formattedDate = `${day}/${month}/${year}`
    }
    
    const paymentData = {
      ...editingPayment.value,
      datePayment: formattedDate,
      // Ensure money is in correct format
      money: parseMoney(editingPayment.value.money).toString(),
    }
    
    // Call AppScript to update payment
    const result = await sendRequest(Action.updatePayment, paymentData)
    
    if (result.status === 'success') {
      showMessageBox('Cập nhật giao dịch thành công!', 'success')
      showEditModal.value = false
      editingPayment.value = null
      
      // Reload data
      await loadData()
    } else {
      showMessageBox('Cập nhật thất bại: ' + (result.message || 'Lỗi không xác định'), 'danger')
    }
  } catch (error) {
    console.error('❌ Error saving payment:', error)
    showMessageBox('Lỗi khi cập nhật giao dịch: ' + error.message, 'danger')
  } finally {
    saving.value = false
  }
}

const deletePayment = (payment) => {
  console.log('Delete payment:', payment)
  selectedPayment.value = payment
  showDeleteModal.value = true
}

const confirmDelete = async () => {
  if (!selectedPayment.value) return
  
  deleting.value = true
  try {
    console.log('🗑️ Deleting payment:', selectedPayment.value)
    
    // Call AppScript to delete payment
    const result = await sendRequest(Action.deletePayment, {
      studentCode: selectedPayment.value.studentCode,
      datePayment: selectedPayment.value.datePayment,
    })
    
    if (result.status === 'success') {
      showMessageBox('Xóa giao dịch thành công!', 'success')
      showDeleteModal.value = false
      selectedPayment.value = null
      
      // Reload data
      await loadData()
    } else {
      showMessageBox('Xóa thất bại: ' + (result.message || 'Lỗi không xác định'), 'danger')
    }
  } catch (error) {
    console.error('❌ Error deleting payment:', error)
    showMessageBox('Lỗi khi xóa giao dịch: ' + error.message, 'danger')
  } finally {
    deleting.value = false
  }
}

const exportToExcel = () => {
  console.log('📥 Export to Excel')
  
  try {
    // Prepare data for export
    const exportData = filteredPayments.value.map((p) => ({
      'Ngày đóng': formatDate(p.datePayment),
      'Mã học viên': p.studentCode,
      'Tên học viên': p.studentName || p.fullname || '',
      'Lớp': p.group || '',
      'Loại': getPaymentTypeLabel(p.type),
      'Số buổi': p.lesson,
      'Số tiền': formatMoney(p.money),
      'Ghi chú': p.note || '',
      'Cơ sở': p.location || '',
    }))
    
    // Add summary row
    exportData.push({})
    exportData.push({
      'Ngày đóng': 'TỔNG CỘNG',
      'Mã học viên': '',
      'Tên học viên': '',
      'Lớp': '',
      'Loại': '',
      'Số buổi': statistics.value.totalLessons,
      'Số tiền': formatMoney(statistics.value.totalRevenue),
      'Ghi chú': `${statistics.value.totalTransactions} giao dịch`,
      'Cơ sở': '',
    })
    
    // Convert to CSV and download
    const csv = toCSV(exportData)
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    
    const filename = `BaoCaoTaiChinh_${new Date().toISOString().slice(0, 10)}.csv`
    link.setAttribute('href', url)
    link.setAttribute('download', filename)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    
    showMessageBox('Xuất Excel thành công!', 'success')
  } catch (error) {
    console.error('❌ Error exporting:', error)
    showMessageBox('Lỗi khi xuất Excel: ' + error.message, 'danger')
  }
}

// Watch filters to update chart
watch([dateRange, selectedLocation, selectedGroup, selectedPaymentType, searchQuery], () => {
  if (!loading.value) {
    createRevenueChart()
  }
})

// Lifecycle
onMounted(() => {
  loadData()
})
</script>

<style lang="scss" scoped>
.financial-report-page {
  padding: 1rem;
  
  @media (min-width: 768px) {
    padding: 1.5rem;
  }
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1.5rem;
  gap: 1rem;
  
  @media (max-width: 768px) {
    flex-direction: column;
  }
}

.header-left {
  flex: 1;
}

.page-title {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--va-text-primary);
  margin: 0 0 0.5rem 0;
  
  @media (min-width: 768px) {
    font-size: 1.75rem;
  }
}

.page-subtitle {
  color: var(--va-text-secondary);
  font-size: 0.875rem;
  margin: 0;
}

.header-actions {
  display: flex;
  gap: 0.75rem;
  
  @media (max-width: 768px) {
    width: 100%;
    
    .va-button {
      flex: 1;
    }
  }
}

.filter-card {
  margin-bottom: 1.5rem;
}

.filter-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 1rem;
  
  @media (min-width: 640px) {
    grid-template-columns: repeat(2, 1fr);
  }
  
  @media (min-width: 1024px) {
    grid-template-columns: repeat(4, 1fr);
  }
}

.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4rem 1rem;
  gap: 1rem;
}

.stats-section {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.stats-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 1rem;
  
  @media (min-width: 640px) {
    grid-template-columns: repeat(2, 1fr);
  }
  
  @media (min-width: 1024px) {
    grid-template-columns: repeat(4, 1fr);
  }
}

.stat-card {
  &.revenue {
    .stat-icon {
      background: linear-gradient(135deg, rgba(var(--va-success-rgb), 0.2), rgba(var(--va-success-rgb), 0.05));
      color: var(--va-success);
    }
  }
  
  &.transactions {
    .stat-icon {
      background: linear-gradient(135deg, rgba(var(--va-primary-rgb), 0.2), rgba(var(--va-primary-rgb), 0.05));
      color: var(--va-primary);
    }
  }
  
  &.students {
    .stat-icon {
      background: linear-gradient(135deg, rgba(var(--va-info-rgb), 0.2), rgba(var(--va-info-rgb), 0.05));
      color: var(--va-info);
    }
  }
  
  &.lessons {
    .stat-icon {
      background: linear-gradient(135deg, rgba(var(--va-warning-rgb), 0.2), rgba(var(--va-warning-rgb), 0.05));
      color: var(--va-warning);
    }
  }
  
  .va-card__content {
    display: flex;
    gap: 1rem;
  }
}

.stat-icon {
  flex-shrink: 0;
  width: 3.5rem;
  height: 3.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 0.75rem;
}

.stat-content {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.stat-label {
  font-size: 0.875rem;
  color: var(--va-text-secondary);
  margin-bottom: 0.25rem;
}

.stat-value {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--va-text-primary);
  line-height: 1.2;
}

.stat-unit {
  font-size: 0.75rem;
  color: var(--va-text-secondary);
  margin-top: 0.125rem;
}

.chart-section {
  margin: 1.5rem 0;
}

.chart-container {
  height: 300px;
  
  @media (min-width: 768px) {
    height: 400px;
  }
}

.distribution-section {
  margin: 1.5rem 0;
}

.distribution-grid {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.distribution-item {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.distribution-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 600;
  color: var(--va-text-primary);
}

.distribution-stats {
  display: grid;
  grid-template-columns: auto auto 1fr auto;
  gap: 1rem;
  align-items: center;
}

.distribution-amount {
  font-weight: 700;
  color: var(--va-success);
}

.distribution-count {
  font-size: 0.875rem;
  color: var(--va-text-secondary);
}

.distribution-percentage {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--va-text-primary);
}

.table-card {
  margin-top: 1.5rem;
}

.table-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
  flex-wrap: wrap;
}

.search-input {
  max-width: 300px;
}

.cell-date {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
}

.cell-student {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.student-name {
  font-size: 0.875rem;
  color: var(--va-text-secondary);
}

.cell-money {
  font-weight: 700;
  color: var(--va-success);
}

.cell-actions {
  display: flex;
  gap: 0.5rem;
}

.pagination-container {
  display: flex;
  justify-content: center;
  margin-top: 1.5rem;
}

.card-title-with-toggle {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
}

.toggle-section {
  display: flex;
  gap: 1rem;
  justify-content: center;
  margin: 1rem 0;
  
  @media (max-width: 640px) {
    flex-direction: column;
    
    .va-button {
      width: 100%;
    }
  }
}

// Modal Styles
.modal-title {
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--va-text-primary);
  margin: 0;
}

.detail-modal-content {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding: 0.5rem 0;
}

.detail-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem;
  background-color: var(--va-background-element);
  border-radius: 0.375rem;
  gap: 1rem;
  
  @media (max-width: 640px) {
    flex-direction: column;
    align-items: flex-start;
  }
}

.detail-label {
  font-weight: 600;
  color: var(--va-text-secondary);
  min-width: 120px;
}

.detail-value {
  color: var(--va-text-primary);
  text-align: right;
  
  &.amount {
    font-size: 1.125rem;
    font-weight: 700;
    color: var(--va-success);
  }
  
  @media (max-width: 640px) {
    text-align: left;
  }
}

.edit-modal-content {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding: 0.5rem 0;
}

.delete-modal-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  padding: 1rem 0;
  text-align: center;
}

.warning-icon {
  margin-bottom: 0.5rem;
}

.delete-message {
  font-size: 1rem;
  color: var(--va-text-primary);
  margin: 0;
}

.delete-info {
  background-color: var(--va-background-element);
  padding: 1rem;
  border-radius: 0.5rem;
  width: 100%;
  text-align: left;
  
  p {
    margin: 0.5rem 0;
    
    &:first-child {
      margin-top: 0;
    }
    
    &:last-child {
      margin-bottom: 0;
    }
  }
  
  strong {
    color: var(--va-text-secondary);
  }
}
</style>
