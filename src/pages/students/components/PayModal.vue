<template>
  <div class="flex justify-between items-center">
    <div class="va-h6">{{ isPaymentModal ? 'Đóng học' : 'Diều chỉnh buổi học' }}</div>
    <div>
      <VaChip :color="getColor(student.buoiConLai)" class="va-text-white font-bold">{{ student.buoiConLai }}</VaChip>
    </div>
  </div>
  <VaCard stripe stripe-color="primary" class="p-1" outlined>
    <VaCardContent>
      <div class="grid md:grid-cols-2 sm:grid-cols-2 xs:grid-cols-2 gap-2">
        <div class="font-bold text-info">
          <VaIcon :name="`mso-person`" class="mb-1 pr-2" color="info" size="1.5rem" />
          {{ student.fullname }}
        </div>
        <div class="font-light">
          <VaIcon :name="`mso-school`" class="mb-1 pr-2" color="primary" size="1.5rem" />
          <span :class="student.group ? '' : 'va-text-secondary opacity-70'">{{
            student.group ? student.group : 'Chưa có lớp học'
          }}</span>
        </div>
        <div class="font-light">
          <VaIcon :name="`mso-calendar_month`" class="mb-1 pr-2" color="warning" size="1.3rem" />
          <span :class="student.birthday ? '' : 'va-text-secondary opacity-70'">{{
            student.birthday ? student.birthday : 'Chưa có ngày sinh'
          }}</span>
        </div>
        <div class="font-light">
          <VaIcon :name="`mso-phone`" class="mb-1 pr-2" color="success" size="1.3rem" />
          <span :class="student.phoneNumber ? '' : 'va-text-secondary opacity-70'">{{
            student.phoneNumber ? student.phoneNumber : 'Chưa có SĐT'
          }}</span>
        </div>
      </div>
      <VaDivider class="my-3" />

      <VaSelect
        v-if="isPaymentModal"
        v-model="selectedStatus"
        label="Hình thức đóng"
        placeholder="Chọn hình thức đóng học"
        :options="statusOptions"
        required-mark
      >
        <template #content="{ value }">
          <VaBadge :text="value.text" :color="value.color" class="--va-badge-font-size" />
        </template>
      </VaSelect>
      <VaInput
        v-if="isPaymentModal"
        v-model="newPayment.money"
        label="Số tiền"
        placeholder="Nhập số tiền"
        class="pt-4"
        type="number"
        required-mark
      >
        <template #prependInner>
          <VaIcon :name="`mso-payments`" color="primary" />
        </template>
      </VaInput>
      <VaInput
        v-model="newPayment.lesson"
        type="number"
        label="Số buổi học"
        placeholder="Nhập số buổi học"
        class="pt-4"
        required-mark
      >
        <template #prependInner>
          <VaIcon :name="`mso-import_contacts`" color="primary" />
        </template>
      </VaInput>
      <!-- <p class="va-text-secondary opacity-70 pt-2">* Chọn giáo viên mới để thay thế</p> -->
      <!-- <VaDivider class="my-3" /> -->
      <VaTextarea
        v-model="newPayment.note"
        label="Ghi chú"
        :placeholder="placeholderText"
        name="notes"
        class="w-full pt-4"
      />
      <p class="va-text-secondary opacity-70 pt-2">* Vui lòng ghi đủ thông tin</p>
    </VaCardContent>
  </VaCard>
  <VaForm class="flex flex-col gap-2 pt-3">
    <div class="flex justify-end flex-col-reverse sm:flex-row xs:flex-row gap-2">
      <VaButton preset="secondary" color="secondary" :disabled="isLoading" @click="emit('close')">Huỷ</VaButton>
      <VaButton :disabled="isValidated || isLoading" :loading="isLoading" color="primary" @click="onSave">{{
        btnLabel
      }}</VaButton>
    </div>
  </VaForm>
</template>
<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { VaInput } from 'vuestic-ui'

const today = new Date()
const todayDate = new Date(today.getFullYear(), today.getMonth(), today.getDate())

const props = defineProps<{
  studentToUpdate: any
  isPaymentModal: boolean
}>()

const student = ref<any>(props.studentToUpdate)
const isPayment = ref<boolean>(props.isPaymentModal)
const isLoading = ref<boolean>(false) // ✅ Thêm loading state
const btnLabel = computed(() => (isPayment.value ? 'Đóng học' : 'Cập nhật'))
const placeholderText = computed(() => (isPayment.value ? 'Thông tin đóng học...' : 'Thông tin điều chỉnh...'))

const typeOptions = ref<any>([
  { value: 'Khoa', text: 'Đóng theo khoá', color: 'success' },
  { value: 'Le', text: 'Đóng gói lẻ', color: 'warning' },
])
const selectedStatus = ref<any>('')
const currentNote = ref<any>('')

const payment: any = {
  studentCode: student.value.code,
  studentName: student.value.fullname,
  datePayment: formatDate(todayDate),
  type: '', // Đóng theo khoá / Đóng gói lẻ
  money: '', // Số tiền (cho payment)
  lesson: '', // Số buổi học
  note: '',
}

const newPayment = ref<any>({ ...payment })

const statusOptions = computed(() => {
  const statusArray = Array.from(typeOptions.value)
    .filter((status: any) => status.value !== '')
    .map((status: any) => ({
      value: status.value,
      text: status.text,
      color: status.color,
    }))
  return typeOptions.value ? statusArray : []
})

const isValidated = computed(() => {
  return student.value.note == currentNote.value || student.value.note == ''
})

const emit = defineEmits(['close', 'save', 'updateLesson'])

const onSave = () => {
  // ✅ Ngăn double-click
  if (isLoading.value) {
    console.log('⚠️ Request đang xử lý, bỏ qua click này')
    return
  }

  isLoading.value = true

  if (isPayment.value) {
    newPayment.value.money = parseInt(newPayment.value.money).toLocaleString()
    emit('save', newPayment.value)
  } else {
    emit('updateLesson', newPayment.value)
  }

  // Reset loading sau khi emit (component cha sẽ xử lý)
  // Timeout nhỏ để tránh double-click trong khoảng thời gian ngắn
  setTimeout(() => {
    isLoading.value = false
  }, 1000)
}

const getOptionByText = (text: string) => {
  return statusOptions.value.find((option: any) => option.text === text)
}

function formatDate(date: any) {
  const day = String(date.getDate()).padStart(2, '0')
  const month = String(date.getMonth() + 1).padStart(2, '0') // Tháng bắt đầu từ 0
  const year = date.getFullYear()
  return `${day}/${month}/${year}`
}

const getColor = (value: any) => {
  if (value > 3 || value == 'Đang học') {
    return 'success'
  } else if ((value <= 3 && value > 0) || value == 'Tạm nghỉ') {
    return 'warning'
  } else {
    return 'danger'
  }
}

watch(selectedStatus, (newStatus: any) => {
  if (newStatus) {
    newPayment.value.type = newStatus.value
    student.value.status = newStatus.text
  }
})

onMounted(() => {
  selectedStatus.value = getOptionByText(student.value.status)
})
</script>
