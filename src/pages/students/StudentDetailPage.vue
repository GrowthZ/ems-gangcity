<template>
  <div v-if="student" class="student-detail-page">
    <!-- Header với nút back - Tối ưu mobile -->
    <div class="page-header">
      <div class="header-left">
        <VaButton icon="arrow_back" preset="secondary" size="small" @click="$router.go(-1)">
          <span class="hidden sm:inline">Quay lại</span>
        </VaButton>
        <h1 class="page-title">Chi tiết học viên</h1>
      </div>
      <div class="header-actions">
        <VaButton icon="edit" color="info" size="small" @click="showUpdateStudentModal">
          <span class="hidden md:inline">Cập nhật</span>
        </VaButton>
        <VaButton icon="currency_exchange" color="success" size="small" @click="showPayModal">
          <span class="hidden md:inline">Đóng học</span>
        </VaButton>
      </div>
    </div>

    <StudentTabs :student-code="student.code" :student="student">
      <template #info="{ student: studentInfo }">
        <!-- Thông tin cá nhân - Tối ưu mobile -->
        <VaCard class="info-card">
          <VaCardTitle>
            <div class="card-title">
              <VaIcon name="person" color="primary" />
              <span>Thông tin cá nhân</span>
            </div>
          </VaCardTitle>
          <VaCardContent>
            <div class="info-grid">
              <!-- Left column -->
              <div class="info-column">
                <div class="info-item">
                  <VaIcon name="badge" color="secondary" size="small" />
                  <div class="info-content">
                    <div class="info-label">Mã học viên</div>
                    <div class="info-value">{{ studentInfo.code }}</div>
                  </div>
                </div>

                <div class="info-item">
                  <VaIcon name="person" color="secondary" size="small" />
                  <div class="info-content">
                    <div class="info-label">Họ và tên</div>
                    <div class="info-value">{{ studentInfo.fullname }}</div>
                  </div>
                </div>

                <div class="info-item">
                  <VaIcon name="face" color="secondary" size="small" />
                  <div class="info-content">
                    <div class="info-label">Biệt danh</div>
                    <div class="info-value">{{ studentInfo.nickname || 'Chưa có' }}</div>
                  </div>
                </div>

                <div class="info-item">
                  <VaIcon name="wc" color="secondary" size="small" />
                  <div class="info-content">
                    <div class="info-label">Giới tính</div>
                    <div class="info-value">{{ studentInfo.gender || 'Chưa cập nhật' }}</div>
                  </div>
                </div>
              </div>

              <!-- Right column -->
              <div class="info-column">
                <div class="info-item">
                  <VaIcon name="cake" color="secondary" size="small" />
                  <div class="info-content">
                    <div class="info-label">Ngày sinh</div>
                    <div class="info-value">{{ studentInfo.birthday || 'Chưa cập nhật' }}</div>
                  </div>
                </div>

                <div class="info-item">
                  <VaIcon name="phone" color="secondary" size="small" />
                  <div class="info-content">
                    <div class="info-label">Số điện thoại</div>
                    <div class="info-value">
                      <a v-if="studentInfo.phoneNumber" :href="`tel:${studentInfo.phoneNumber}`" class="phone-link">
                        {{ studentInfo.phoneNumber }}
                      </a>
                      <span v-else class="text-muted">Chưa cập nhật</span>
                    </div>
                  </div>
                </div>

                <div class="info-item">
                  <VaIcon name="location_on" color="secondary" size="small" />
                  <div class="info-content">
                    <div class="info-label">Cơ sở</div>
                    <div class="info-value">{{ studentInfo.location || 'Chưa cập nhật' }}</div>
                  </div>
                </div>

                <div class="info-item">
                  <VaIcon name="event" color="secondary" size="small" />
                  <div class="info-content">
                    <div class="info-label">Ngày bắt đầu</div>
                    <div class="info-value">{{ studentInfo.dateStart || 'Chưa cập nhật' }}</div>
                  </div>
                </div>
              </div>
            </div>
          </VaCardContent>
        </VaCard>

        <!-- Thông tin học tập - Tối ưu mobile -->
        <VaCard class="info-card">
          <VaCardTitle>
            <div class="card-title">
              <VaIcon name="school" color="primary" />
              <span>Thông tin học tập</span>
            </div>
          </VaCardTitle>
          <VaCardContent>
            <div class="info-grid">
              <div class="info-column">
                <div class="info-item">
                  <VaIcon name="group" color="secondary" size="small" />
                  <div class="info-content">
                    <div class="info-label">Lớp học</div>
                    <div class="info-value">{{ studentInfo.group || 'Chưa phân lớp' }}</div>
                  </div>
                </div>

                <div class="info-item">
                  <VaIcon name="schedule" color="secondary" size="small" />
                  <div class="info-content">
                    <div class="info-label">Tổng số buổi</div>
                    <div class="info-value">{{ studentInfo.tongSoBuoi || 0 }} buổi</div>
                  </div>
                </div>

                <div class="info-item">
                  <VaIcon name="check_circle" color="success" size="small" />
                  <div class="info-content">
                    <div class="info-label">Buổi đã học</div>
                    <div class="info-value text-success">{{ studentInfo.buoiDaHoc || 0 }} buổi</div>
                  </div>
                </div>
              </div>

              <div class="info-column">
                <div class="info-item">
                  <VaIcon name="pending" color="secondary" size="small" />
                  <div class="info-content">
                    <div class="info-label">Buổi còn lại</div>
                    <div class="info-value">
                      <VaChip :color="getBuoiConLaiColor(studentInfo.buoiConLai)" size="small">
                        {{ studentInfo.buoiConLai || 0 }} buổi
                      </VaChip>
                    </div>
                  </div>
                </div>

                <div class="info-item">
                  <VaIcon name="payments" color="secondary" size="small" />
                  <div class="info-content">
                    <div class="info-label">Lần đóng tiền</div>
                    <div class="info-value">{{ studentInfo.lanDongTien || 0 }} lần</div>
                  </div>
                </div>

                <div class="info-item">
                  <VaIcon name="info" color="secondary" size="small" />
                  <div class="info-content">
                    <div class="info-label">Trạng thái</div>
                    <div class="info-value">
                      <VaBadge
                        :text="studentInfo.status || 'Không xác định'"
                        :color="getStatusColor(studentInfo.status)"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </VaCardContent>
        </VaCard>

        <!-- Ghi chú -->
        <VaCard v-if="studentInfo.notes" class="info-card">
          <VaCardTitle>
            <div class="card-title">
              <VaIcon name="note" color="primary" />
              <span>Ghi chú</span>
            </div>
          </VaCardTitle>
          <VaCardContent>
            <p class="note-text">{{ studentInfo.notes }}</p>
          </VaCardContent>
        </VaCard>
      </template>
    </StudentTabs>

    <!-- Modals -->
    <VaModal v-slot="{ cancel, ok }" v-model="doShowPayModal" size="small" hide-default-actions>
      <PayModal
        :student-to-update="student"
        :is-payment-modal="isPaymentModal"
        @close="cancel"
        @save="
          (data) => {
            sendPayment(data)
            ok()
          }
        "
        @updateLesson="
          (data) => {
            sendUpdateLesson(data)
            ok()
          }
        "
      />
    </VaModal>

    <VaModal v-slot="{ cancel, ok }" v-model="doShowStudentModal" size="small" hide-default-actions mobile-fullscreen>
      <NewStudentModal
        :student-to-update="student"
        :locations="locations"
        :groups="groups"
        :students="items"
        @close="cancel"
        @save="
          (data) => {
            sendNewStudent(data)
            ok()
          }
        "
        @update="
          (data) => {
            sendUpdateStudent(data)
            ok()
          }
        "
      />
    </VaModal>
  </div>

  <!-- Loading state -->
  <div v-else-if="loading" class="flex justify-center items-center h-64">
    <VaProgressCircle indeterminate />
  </div>

  <!-- Error state -->
  <div v-else class="flex justify-center items-center h-64">
    <div class="text-center px-4">
      <VaIcon name="error" color="danger" size="large" class="mb-4" />
      <h3 class="text-lg font-semibold text-gray-700 mb-2">Không tìm thấy học viên</h3>
      <p class="text-gray-500 mb-4 text-sm sm:text-base">Học viên này có thể đã bị xóa hoặc không tồn tại.</p>
      <VaButton @click="$router.go(-1)">Quay lại</VaButton>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useData } from '../../stores/use-data'
import { DataSheet, Action, sendRequest, showMessageBox } from '../../stores/data-from-sheet'
import PayModal from './components/PayModal.vue'
import NewStudentModal from './components/NewStudentModal.vue'
import StudentTabs from './components/StudentTabs.vue'

const route = useRoute()
const store = useData()

// State
const loading = ref(true)
const student = ref(null)
const locations = ref([])
const groups = ref([])
const items = ref([])

// Modal states
const doShowPayModal = ref(false)
const isPaymentModal = ref(false)
const doShowStudentModal = ref(false)

// Computed
const studentId = computed(() => route.params.id)

// Methods
const loadStudentData = async () => {
  loading.value = true
  try {
    await store.load(DataSheet.student, [
      DataSheet.location,
      DataSheet.group,
      DataSheet.followStudent,
      DataSheet.payment,
    ])

    // Tìm học viên theo ID
    const foundStudent = store.allData.find((s) => s.id == studentId.value || s.code === studentId.value)

    if (foundStudent) {
      console.log('📖 Found student:', foundStudent)

      // Merge với dữ liệu followStudent để có thông tin buổi học
      const followStudentData = store.allAnotherData[2] || []
      const followStudent = followStudentData.find((fs) => fs.code === foundStudent.code)

      // Load payment data to get actual payment count
      const paymentData = store.allAnotherData[3] || []
      const studentPayments = paymentData.filter(
        (p) => (p.studentCode || '').toLowerCase() === foundStudent.code.toLowerCase(),
      )

      console.log('📊 Follow student data:', followStudent)
      console.log('💰 Student payments:', studentPayments.length)

      if (followStudent) {
        student.value = {
          ...foundStudent,
          tongSoBuoi: parseInt(followStudent.tongSoBuoi) || 0,
          buoiDaHoc: parseInt(followStudent.buoiDaHoc) || 0,
          buoiConLai: parseInt(followStudent.buoiConLai) || 0,
          // Use actual payment count instead of followStudent data
          lanDongTien: studentPayments.length || parseInt(followStudent.lanDongTien) || 0,
        }
        console.log('✅ Merged student data:', student.value)
      } else {
        console.warn('⚠️ No follow student data found for:', foundStudent.code)
        student.value = {
          ...foundStudent,
          lanDongTien: studentPayments.length || 0,
        }
      }

      items.value = store.allData
      locations.value = store.allAnotherData[0] || []
      groups.value = store.allAnotherData[1] || []
    } else {
      console.error('❌ Student not found:', studentId.value)
      student.value = null
    }
  } catch (error) {
    console.error('❌ Lỗi khi tải dữ liệu học viên:', error)
    student.value = null
  } finally {
    loading.value = false
  }
}

const showPayModal = () => {
  isPaymentModal.value = true
  doShowPayModal.value = true
}

const showUpdateStudentModal = () => {
  doShowStudentModal.value = true
}

const getBuoiConLaiColor = (buoiConLai) => {
  const remaining = parseInt(buoiConLai) || 0
  if (remaining <= 0) return 'danger'
  if (remaining <= 2) return 'warning'
  return 'success'
}

const getStatusColor = (status) => {
  switch (status?.toLowerCase()) {
    case 'active':
    case 'hoạt động':
      return 'success'
    case 'inactive':
    case 'không hoạt động':
      return 'danger'
    case 'pending':
    case 'chờ':
      return 'warning'
    default:
      return 'info'
  }
}

// API calls
const sendPayment = async (dataJson) => {
  store.loading = true
  const res = await sendRequest(Action.createPayment, dataJson)

  if (res.status == 'success') {
    showMessageBox(`Đóng học thành công!`, 'success')
    await loadStudentData() // Reload data
  } else {
    showMessageBox(`Đóng học thất bại!`, 'danger')
  }
  store.loading = false
}

const sendUpdateLesson = async (dataJson) => {
  store.loading = true
  const res = await sendRequest(Action.updateLesson, dataJson)

  if (res.status == 'success') {
    showMessageBox(`Điều chỉnh thành công!`, 'success')
    await loadStudentData() // Reload data
  } else {
    showMessageBox(`Điều chỉnh thất bại!`, 'danger')
  }
  store.loading = false
}

const sendUpdateStudent = async (dataJson) => {
  store.loading = true
  const res = await sendRequest(Action.updateStudent, dataJson)

  if (res.status == 'success') {
    showMessageBox(`Cập nhật thông tin thành công!`, 'success')
    await loadStudentData() // Reload data
  } else {
    showMessageBox(`Cập nhật thông tin thất bại!`, 'danger')
  }
  store.loading = false
}

// Lifecycle
onMounted(() => {
  loadStudentData()
})

// Watch for route changes
watch(
  () => route.params.id,
  () => {
    loadStudentData()
  },
)
</script>

<style lang="scss" scoped>
.student-detail-page {
  max-width: 1200px;
  margin: 0 auto;
  padding: 1rem;

  @media (min-width: 768px) {
    padding: 1.5rem;
  }
}

// Header tối ưu
.page-header {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-bottom: 1.5rem;

  @media (min-width: 640px) {
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
  }
}

.header-left {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.page-title {
  font-size: 1.125rem;
  font-weight: 600;
  margin: 0;

  @media (min-width: 640px) {
    font-size: 1.25rem;
  }
}

.header-actions {
  display: flex;
  gap: 0.5rem;

  .va-button {
    flex: 1;

    @media (min-width: 640px) {
      flex: 0 0 auto;
    }
  }
}

// Card styles
.info-card {
  margin-bottom: 1rem;

  @media (min-width: 768px) {
    margin-bottom: 1.5rem;
  }
}

.card-title {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 1rem;
  font-weight: 600;

  @media (min-width: 640px) {
    font-size: 1.125rem;
  }
}

// Info grid - responsive
.info-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 1rem;

  @media (min-width: 768px) {
    grid-template-columns: repeat(2, 1fr);
    gap: 1.5rem;
  }
}

.info-column {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.info-item {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  padding: 0.75rem;
  background-color: var(--va-background-element);
  border-radius: 0.5rem;
  transition: background-color 0.2s;

  &:hover {
    background-color: var(--va-background-border);
  }

  .va-icon {
    flex-shrink: 0;
    margin-top: 0.125rem;
  }
}

.info-content {
  flex: 1;
  min-width: 0;
}

.info-label {
  font-size: 0.75rem;
  color: var(--va-secondary);
  margin-bottom: 0.25rem;

  @media (min-width: 640px) {
    font-size: 0.875rem;
  }
}

.info-value {
  font-size: 0.875rem;
  font-weight: 600;
  word-wrap: break-word;
  overflow-wrap: break-word;

  @media (min-width: 640px) {
    font-size: 1rem;
  }
}

.phone-link {
  color: var(--va-primary);
  text-decoration: none;
  word-break: break-all;

  &:hover {
    text-decoration: underline;
  }
}

.text-muted {
  color: var(--va-secondary);
  font-weight: normal;
}

.text-success {
  color: var(--va-success);
}

.note-text {
  color: var(--va-text-primary);
  line-height: 1.6;
  font-size: 0.875rem;

  @media (min-width: 640px) {
    font-size: 1rem;
  }
}

// Mobile optimizations
@media (max-width: 640px) {
  .student-detail-page {
    padding: 0.75rem;
  }

  .page-header {
    margin-bottom: 1rem;
  }

  .info-card {
    margin-bottom: 0.75rem;
  }

  .info-item {
    padding: 0.625rem;
  }
}
</style>
