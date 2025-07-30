<template>
  <div v-if="student" class="student-detail-page">
    <!-- Header với nút back -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
      <div class="flex items-center gap-3">
        <VaButton icon="arrow_back" preset="secondary" class="mb-0" @click="$router.go(-1)">
          <span class="hidden sm:inline">Quay lại</span>
        </VaButton>
        <h1 class="page-title mb-0 text-lg sm:text-xl">Chi tiết học viên</h1>
      </div>
      <div class="flex gap-2 w-full sm:w-auto">
        <VaButton icon="edit" color="info" class="flex-1 sm:flex-none" @click="showUpdateStudentModal">
          <span class="hidden sm:inline">Cập nhật</span>
          <span class="sm:hidden">Sửa</span>
        </VaButton>
        <VaButton icon="currency_exchange" color="success" class="flex-1 sm:flex-none" @click="showPayModal">
          <span class="hidden sm:inline">Đóng học</span>
          <span class="sm:hidden">Thanh toán</span>
        </VaButton>
      </div>
    </div>

    <StudentTabs :student-code="student.code" :student="student">
      <template #info="{ student: studentInfo }">
        <!-- Thông tin cá nhân -->
        <VaCard class="mb-6">
          <VaCardTitle class="flex items-center gap-2 text-base sm:text-lg">
            <VaIcon name="person" color="primary" />
            Thông tin cá nhân
          </VaCardTitle>
          <VaCardContent class="p-4 sm:p-6">
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
              <div class="space-y-3 sm:space-y-4">
                <div class="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                  <VaIcon name="badge" color="secondary" size="small" class="mt-0.5" />
                  <div class="flex-1 min-w-0">
                    <div class="text-xs sm:text-sm text-secondary mb-1">Mã học viên</div>
                    <div class="font-semibold text-sm sm:text-base break-all">{{ studentInfo.code }}</div>
                  </div>
                </div>

                <div class="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                  <VaIcon name="person" color="secondary" size="small" class="mt-0.5" />
                  <div class="flex-1 min-w-0">
                    <div class="text-xs sm:text-sm text-secondary mb-1">Họ và tên</div>
                    <div class="font-semibold text-sm sm:text-base break-words">{{ studentInfo.fullname }}</div>
                  </div>
                </div>

                <div class="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                  <VaIcon name="face" color="secondary" size="small" class="mt-0.5" />
                  <div class="flex-1 min-w-0">
                    <div class="text-xs sm:text-sm text-secondary mb-1">Biệt danh</div>
                    <div class="font-semibold text-sm sm:text-base">{{ studentInfo.nickname || 'Chưa có' }}</div>
                  </div>
                </div>

                <div class="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                  <VaIcon name="wc" color="secondary" size="small" class="mt-0.5" />
                  <div class="flex-1 min-w-0">
                    <div class="text-xs sm:text-sm text-secondary mb-1">Giới tính</div>
                    <div class="font-semibold text-sm sm:text-base">{{ studentInfo.gender || 'Chưa cập nhật' }}</div>
                  </div>
                </div>
              </div>

              <div class="space-y-3 sm:space-y-4">
                <div class="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                  <VaIcon name="cake" color="secondary" size="small" class="mt-0.5" />
                  <div class="flex-1 min-w-0">
                    <div class="text-xs sm:text-sm text-secondary mb-1">Ngày sinh</div>
                    <div class="font-semibold text-sm sm:text-base">{{ studentInfo.birthday || 'Chưa cập nhật' }}</div>
                  </div>
                </div>

                <div class="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                  <VaIcon name="phone" color="secondary" size="small" class="mt-0.5" />
                  <div class="flex-1 min-w-0">
                    <div class="text-xs sm:text-sm text-secondary mb-1">Số điện thoại</div>
                    <div class="font-semibold text-sm sm:text-base">
                      <button
                        v-if="studentInfo.phone"
                        class="text-primary hover:underline break-all"
                        @click="callStudent(studentInfo.phone)"
                      >
                        {{ studentInfo.phone }}
                      </button>
                      <span v-else class="text-gray-500">Chưa cập nhật</span>
                    </div>
                  </div>
                </div>

                <div class="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                  <VaIcon name="location_on" color="secondary" size="small" class="mt-0.5" />
                  <div class="flex-1 min-w-0">
                    <div class="text-xs sm:text-sm text-secondary mb-1">Cơ sở</div>
                    <div class="font-semibold text-sm sm:text-base break-words">
                      {{ studentInfo.location || 'Chưa cập nhật' }}
                    </div>
                  </div>
                </div>

                <div class="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                  <VaIcon name="event" color="secondary" size="small" class="mt-0.5" />
                  <div class="flex-1 min-w-0">
                    <div class="text-xs sm:text-sm text-secondary mb-1">Ngày bắt đầu</div>
                    <div class="font-semibold text-sm sm:text-base">{{ studentInfo.dateStart || 'Chưa cập nhật' }}</div>
                  </div>
                </div>
              </div>
            </div>
          </VaCardContent>
        </VaCard>

        <!-- Thông tin học tập -->
        <VaCard class="mb-6">
          <VaCardTitle class="flex items-center gap-2 text-base sm:text-lg">
            <VaIcon name="school" color="primary" />
            Thông tin học tập
          </VaCardTitle>
          <VaCardContent class="p-4 sm:p-6">
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
              <div class="space-y-3 sm:space-y-4">
                <div class="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                  <VaIcon name="group" color="secondary" size="small" class="mt-0.5" />
                  <div class="flex-1 min-w-0">
                    <div class="text-xs sm:text-sm text-secondary mb-1">Lớp học</div>
                    <div class="font-semibold text-sm sm:text-base break-words">
                      {{ studentInfo.group || 'Chưa phân lớp' }}
                    </div>
                  </div>
                </div>

                <div class="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                  <VaIcon name="schedule" color="secondary" size="small" class="mt-0.5" />
                  <div class="flex-1 min-w-0">
                    <div class="text-xs sm:text-sm text-secondary mb-1">Tổng số buổi</div>
                    <div class="font-semibold text-sm sm:text-base">{{ studentInfo.tongSoBuoi || 0 }} buổi</div>
                  </div>
                </div>

                <div class="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                  <VaIcon name="check_circle" color="secondary" size="small" class="mt-0.5" />
                  <div class="flex-1 min-w-0">
                    <div class="text-xs sm:text-sm text-secondary mb-1">Buổi đã học</div>
                    <div class="font-semibold text-sm sm:text-base text-success">
                      {{ studentInfo.buoiDaHoc || 0 }} buổi
                    </div>
                  </div>
                </div>
              </div>

              <div class="space-y-3 sm:space-y-4">
                <div class="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                  <VaIcon name="pending" color="secondary" size="small" class="mt-0.5" />
                  <div class="flex-1 min-w-0">
                    <div class="text-xs sm:text-sm text-secondary mb-1">Buổi còn lại</div>
                    <div class="font-semibold text-sm sm:text-base">
                      <VaChip :color="getBuoiConLaiColor(studentInfo.buoiConLai)" size="small">
                        {{ studentInfo.buoiConLai || 0 }} buổi
                      </VaChip>
                    </div>
                  </div>
                </div>

                <div class="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                  <VaIcon name="payments" color="secondary" size="small" class="mt-0.5" />
                  <div class="flex-1 min-w-0">
                    <div class="text-xs sm:text-sm text-secondary mb-1">Lần đóng tiền</div>
                    <div class="font-semibold text-sm sm:text-base">{{ studentInfo.lanDongTien || 0 }} lần</div>
                  </div>
                </div>

                <div class="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                  <VaIcon name="info" color="secondary" size="small" class="mt-0.5" />
                  <div class="flex-1 min-w-0">
                    <div class="text-xs sm:text-sm text-secondary mb-1">Trạng thái</div>
                    <div class="font-semibold text-sm sm:text-base">
                      <VaBadge
                        :text="studentInfo.status || 'Không xác định'"
                        :color="getStatusColor(studentInfo.status)"
                        class="rounded"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </VaCardContent>
        </VaCard>

        <!-- Ghi chú -->
        <VaCard v-if="studentInfo.notes" class="mb-6">
          <VaCardTitle class="flex items-center gap-2 text-base sm:text-lg">
            <VaIcon name="note" color="primary" />
            Ghi chú
          </VaCardTitle>
          <VaCardContent class="p-4 sm:p-6">
            <p class="text-gray-700 text-sm sm:text-base leading-relaxed">{{ studentInfo.notes }}</p>
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
    await store.load(DataSheet.student, [DataSheet.location, DataSheet.group, DataSheet.followStudent])

    // Tìm học viên theo ID
    const foundStudent = store.allData.find((s) => s.id == studentId.value || s.code === studentId.value)

    if (foundStudent) {
      // Merge với dữ liệu followStudent để có thông tin buổi học
      const followStudentData = store.allAnotherData[2] || []
      const followStudent = followStudentData.find((fs) => fs.code === foundStudent.code)

      if (followStudent) {
        student.value = {
          ...foundStudent,
          tongSoBuoi: parseInt(followStudent.tongSoBuoi) || 0,
          buoiDaHoc: parseInt(followStudent.buoiDaHoc) || 0,
          buoiConLai: parseInt(followStudent.buoiConLai) || 0,
        }
      } else {
        student.value = foundStudent
      }

      items.value = store.allData
      locations.value = store.allAnotherData[0] || []
      groups.value = store.allAnotherData[1] || []
    } else {
      student.value = null
    }
  } catch (error) {
    console.error('Lỗi khi tải dữ liệu học viên:', error)
    student.value = null
  } finally {
    loading.value = false
  }
}

const callStudent = (phone) => {
  if (!phone) return
  window.location.href = `tel:${phone}`
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
  padding: 0 1rem;

  @media (min-width: 640px) {
    padding: 0 1.5rem;
  }

  @media (min-width: 1024px) {
    padding: 0 2rem;
  }
}

.page-title {
  margin-bottom: 0;
}

// Tối ưu cho mobile
@media (max-width: 640px) {
  .va-card {
    margin-bottom: 1rem;
  }

  .va-card-content {
    padding: 1rem;
  }

  .va-button {
    min-height: 2.5rem;
  }
}

// Cải thiện hiển thị trên tablet
@media (min-width: 641px) and (max-width: 1023px) {
  .student-detail-page {
    padding: 0 1rem;
  }
}
</style>
