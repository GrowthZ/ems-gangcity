<template>
  <div v-if="student" class="student-detail-page">
    <!-- Header với nút back -->
    <div class="flex items-center justify-between mb-6">
      <div class="flex items-center gap-4">
        <VaButton icon="arrow_back" preset="secondary" class="mb-0" @click="$router.go(-1)"> Quay lại </VaButton>
        <h1 class="page-title mb-0">Chi tiết học viên</h1>
      </div>
      <div class="flex gap-2">
        <VaButton icon="edit" color="info" @click="showUpdateStudentModal"> Cập nhật </VaButton>
        <VaButton icon="currency_exchange" color="success" @click="showPayModal"> Đóng học </VaButton>
      </div>
    </div>

    <StudentTabs :student-code="student.code" :student="student">
      <template #info="{ student: studentInfo }">
        <!-- Thông tin cá nhân -->
        <VaCard class="mb-6">
          <VaCardTitle class="flex items-center gap-2">
            <VaIcon name="person" color="primary" />
            Thông tin cá nhân
          </VaCardTitle>
          <VaCardContent>
            <div class="grid md:grid-cols-2 gap-6">
              <div class="space-y-4">
                <div class="flex items-center gap-3">
                  <VaIcon name="badge" color="secondary" size="small" />
                  <div>
                    <div class="text-sm text-secondary">Mã học viên</div>
                    <div class="font-semibold">{{ studentInfo.code }}</div>
                  </div>
                </div>

                <div class="flex items-center gap-3">
                  <VaIcon name="person" color="secondary" size="small" />
                  <div>
                    <div class="text-sm text-secondary">Họ và tên</div>
                    <div class="font-semibold">{{ studentInfo.fullname }}</div>
                  </div>
                </div>

                <div class="flex items-center gap-3">
                  <VaIcon name="face" color="secondary" size="small" />
                  <div>
                    <div class="text-sm text-secondary">Biệt danh</div>
                    <div class="font-semibold">{{ studentInfo.nickname || 'Chưa có' }}</div>
                  </div>
                </div>

                <div class="flex items-center gap-3">
                  <VaIcon name="wc" color="secondary" size="small" />
                  <div>
                    <div class="text-sm text-secondary">Giới tính</div>
                    <div class="font-semibold">{{ studentInfo.gender || 'Chưa cập nhật' }}</div>
                  </div>
                </div>
              </div>

              <div class="space-y-4">
                <div class="flex items-center gap-3">
                  <VaIcon name="cake" color="secondary" size="small" />
                  <div>
                    <div class="text-sm text-secondary">Ngày sinh</div>
                    <div class="font-semibold">{{ studentInfo.birthday || 'Chưa cập nhật' }}</div>
                  </div>
                </div>

                <div class="flex items-center gap-3">
                  <VaIcon name="phone" color="secondary" size="small" />
                  <div>
                    <div class="text-sm text-secondary">Số điện thoại</div>
                    <div class="font-semibold">
                      <button
                        v-if="studentInfo.phone"
                        class="text-primary hover:underline"
                        @click="callStudent(studentInfo.phone)"
                      >
                        {{ studentInfo.phone }}
                      </button>
                      <span v-else class="text-gray-500">Chưa cập nhật</span>
                    </div>
                  </div>
                </div>

                <div class="flex items-center gap-3">
                  <VaIcon name="location_on" color="secondary" size="small" />
                  <div>
                    <div class="text-sm text-secondary">Cơ sở</div>
                    <div class="font-semibold">{{ studentInfo.location || 'Chưa cập nhật' }}</div>
                  </div>
                </div>

                <div class="flex items-center gap-3">
                  <VaIcon name="event" color="secondary" size="small" />
                  <div>
                    <div class="text-sm text-secondary">Ngày bắt đầu</div>
                    <div class="font-semibold">{{ studentInfo.dateStart || 'Chưa cập nhật' }}</div>
                  </div>
                </div>
              </div>
            </div>
          </VaCardContent>
        </VaCard>

        <!-- Thông tin học tập -->
        <VaCard class="mb-6">
          <VaCardTitle class="flex items-center gap-2">
            <VaIcon name="school" color="primary" />
            Thông tin học tập
          </VaCardTitle>
          <VaCardContent>
            <div class="grid md:grid-cols-2 gap-6">
              <div class="space-y-4">
                <div class="flex items-center gap-3">
                  <VaIcon name="group" color="secondary" size="small" />
                  <div>
                    <div class="text-sm text-secondary">Lớp học</div>
                    <div class="font-semibold">{{ studentInfo.group || 'Chưa phân lớp' }}</div>
                  </div>
                </div>

                <div class="flex items-center gap-3">
                  <VaIcon name="schedule" color="secondary" size="small" />
                  <div>
                    <div class="text-sm text-secondary">Tổng số buổi</div>
                    <div class="font-semibold">{{ studentInfo.tongSoBuoi || 0 }} buổi</div>
                  </div>
                </div>

                <div class="flex items-center gap-3">
                  <VaIcon name="check_circle" color="secondary" size="small" />
                  <div>
                    <div class="text-sm text-secondary">Buổi đã học</div>
                    <div class="font-semibold text-success">{{ studentInfo.buoiDaHoc || 0 }} buổi</div>
                  </div>
                </div>
              </div>

              <div class="space-y-4">
                <div class="flex items-center gap-3">
                  <VaIcon name="pending" color="secondary" size="small" />
                  <div>
                    <div class="text-sm text-secondary">Buổi còn lại</div>
                    <div class="font-semibold">
                      <VaChip :color="getBuoiConLaiColor(studentInfo.buoiConLai)" size="small">
                        {{ studentInfo.buoiConLai || 0 }} buổi
                      </VaChip>
                    </div>
                  </div>
                </div>

                <div class="flex items-center gap-3">
                  <VaIcon name="payments" color="secondary" size="small" />
                  <div>
                    <div class="text-sm text-secondary">Lần đóng tiền</div>
                    <div class="font-semibold">{{ studentInfo.lanDongTien || 0 }} lần</div>
                  </div>
                </div>

                <div class="flex items-center gap-3">
                  <VaIcon name="info" color="secondary" size="small" />
                  <div>
                    <div class="text-sm text-secondary">Trạng thái</div>
                    <div class="font-semibold">
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
          <VaCardTitle class="flex items-center gap-2">
            <VaIcon name="note" color="primary" />
            Ghi chú
          </VaCardTitle>
          <VaCardContent>
            <p class="text-gray-700">{{ studentInfo.notes }}</p>
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
    <VaProgressCircular indeterminate />
  </div>

  <!-- Error state -->
  <div v-else class="flex justify-center items-center h-64">
    <div class="text-center">
      <VaIcon name="error" color="danger" size="large" class="mb-4" />
      <h3 class="text-lg font-semibold text-gray-700 mb-2">Không tìm thấy học viên</h3>
      <p class="text-gray-500 mb-4">Học viên này có thể đã bị xóa hoặc không tồn tại.</p>
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
}

.page-title {
  margin-bottom: 0;
}
</style>
