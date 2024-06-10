<template>
  <div>
    <p class="va-h6">Cập nhật trạng thái</p>
  </div>
  <VaCard stripe stripe-color="primary" class="p-1" outlined>
    <VaCardContent>
      <div class="grid md:grid-cols-2 sm:grid-cols-2 xs:grid-cols-2 gap-2">
        <div class="font-bold text-info">
          <VaIcon :name="`mso-person`" class="mb-1 pr-2" color="info" size="1.5rem" />
          {{ studentMissing.fullName }}
        </div>
        <div class="font-light">
          <VaIcon :name="`mso-school`" class="mb-1 pr-2" color="primary" size="1.5rem" />
          {{ studentMissing.group }}
        </div>
        <div class="font-light">
          <VaIcon :name="`mso-calendar_month`" class="mb-1 pr-2" color="warning" size="1.3rem" />
          {{ studentMissing.dateTime }}
        </div>
        <div class="font-light">
          <VaIcon :name="`mso-phone`" class="mb-1 pr-2" color="success" size="1.3rem" />
          {{ studentMissing.phoneNumber }}
        </div>
      </div>
      <VaDivider class="my-3" />

      <VaSelect v-model="selectedStatus" label="Trạng thái" placeholder="Trạng thái" :options="statusOptions">
        <template #content="{ value }">
          <VaBadge :text="value.text" :color="value.color" class="--va-badge-font-size" />
        </template>
      </VaSelect>
      <!-- <p class="va-text-secondary opacity-70 pt-2">* Chọn giáo viên mới để thay thế</p> -->
      <!-- <VaDivider class="my-3" /> -->
      <VaTextarea
        v-model="studentMissing.note"
        label="Ghi chú"
        placeholder="Thông tin chăm sóc ..."
        name="notes"
        class="w-full pt-4"
      />
    </VaCardContent>
  </VaCard>
  <VaForm class="flex flex-col gap-2 pt-3">
    <div class="flex justify-end flex-col-reverse sm:flex-row xs:flex-row gap-2">
      <VaButton preset="secondary" color="secondary" @click="emit('close')">Huỷ</VaButton>
      <VaButton color="primary" @click="onSave">Cập nhật</VaButton>
    </div>
  </VaForm>
</template>
<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'

const props = defineProps<{
  studentMissing: any
  statusList: any
}>()

const studentMissing = ref<any>(props.studentMissing)
const statusList = ref<any>(props.statusList)
const selectedStatus = ref<any>('')

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

const emit = defineEmits(['close', 'save'])

const onSave = () => {
  emit('save', studentMissing.value)
}

const getOptionByText = (text: string) => {
  return statusOptions.value.find((option: any) => option.text === text)
}

watch(selectedStatus, (newStatus: any) => {
  if (newStatus) {
    studentMissing.value.status = newStatus.text
  }
})

onMounted(() => {
  selectedStatus.value = getOptionByText(studentMissing.value.status)
})
</script>
