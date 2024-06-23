<template>
  <div>
    <p class="va-h6">Đóng học</p>
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
            student.phoneNumber ? student.phoneNumber : 'Chưa có số điện thoại'
          }}</span>
        </div>
      </div>
      <VaDivider class="my-3" />

      <VaSelect
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
      <VaInput v-model="student.money" label="Số tiền" placeholder="Nhập số tiền" class="pt-4" required-mark>
        <template #prependInner>
          <VaIcon :name="`mso-payments`" color="primary" />
        </template>
      </VaInput>
      <VaInput
        v-model="payment.lesson"
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
        v-model="student.note"
        label="Ghi chú"
        placeholder="Thông tin đóng học..."
        name="notes"
        class="w-full pt-4"
        hidden
      />
      <p class="va-text-secondary opacity-70 pt-2">* Vui lòng ghi đủ thông tin</p>
    </VaCardContent>
  </VaCard>
  <VaForm class="flex flex-col gap-2 pt-3">
    <div class="flex justify-end flex-col-reverse sm:flex-row xs:flex-row gap-2">
      <VaButton preset="secondary" color="secondary" @click="emit('close')">Huỷ</VaButton>
      <VaButton :disabled="isValidated" color="primary" @click="onSave">Cập nhật</VaButton>
    </div>
  </VaForm>
</template>
<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'

const props = defineProps<{
  studentToUpdate: any
}>()

const student = ref<any>(props.studentToUpdate)
const statusList = ref<any>([
  { value: 'Khoa', text: 'Đóng theo khoá', color: 'success' },
  { value: 'Le', text: 'Đóng gói lẻ', color: 'warning' },
])
const selectedStatus = ref<any>('')
const currentNote = ref<any>('')

const payment = {
  type: '',
  money: '',
  lesson: '',
}

console.log('student', student)

const statusOptions = computed(() => {
  const statusArray = Array.from(statusList.value)
    .filter((status: any) => status.value !== '')
    .map((status: any) => ({
      value: status.value,
      text: status.text,
      color: status.color,
    }))
  return statusList.value ? statusArray : []
})

const isValidated = computed(() => {
  return student.value.note == currentNote.value || student.value.note == ''
})

const emit = defineEmits(['close', 'save'])

const onSave = () => {
  emit('save', student.value)
}

const getOptionByText = (text: string) => {
  return statusOptions.value.find((option: any) => option.text === text)
}

watch(selectedStatus, (newStatus: any) => {
  if (newStatus) {
    student.value.status = newStatus.text
  }
})

onMounted(() => {
  selectedStatus.value = getOptionByText(student.value.status)
})
</script>
