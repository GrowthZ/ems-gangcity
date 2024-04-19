<script setup lang="ts">
import { PropType, computed, ref, watch } from 'vue'
import { useForm } from 'vuestic-ui'
import { validators } from '../../../services/utils'
import { Student } from '../types'

const props = defineProps({
  student: {
    type: Object as PropType<Student | null>,
    default: null,
  },
  saveButtonLabel: {
    type: String,
    default: 'Thêm mới',
  },
})

const defaultNewStudent: Student = {
  id: -1,
  code: '',
  location: '',
  fullname: '',
  nickname: '',
  group: '',
  gender: '',
  birthday: '',
  phone: '',
  dateStart: new Date().toISOString().substr(0, 10),
  lanDongTien: 0,
  tongSoBuoi: 0,
  buoiDaHoc: 0,
  buoiConLai: 0,
  status: '',
  notes: '',
  active: true,
}
const newStudent = ref<Student>({ ...defaultNewStudent })

const isFormHasUnsavedChanges = computed(() => {
  return Object.keys(newStudent.value).some((key) => {
    return newStudent.value[key as keyof Student] !== (props.student ?? defaultNewStudent)?.[key as keyof Student]
  })
})

defineExpose({
  isFormHasUnsavedChanges,
})

watch(
  () => props.student,
  () => {
    if (!props.student) {
      return
    }

    newStudent.value = {
      ...props.student,
      dateStart: props.student.dateStart || new Date().toISOString().substr(0, 10),
    }
  },
  { immediate: true },
)

const form = useForm('add-student-form')

const emit = defineEmits(['close', 'save'])

const onSave = () => {
  if (form.validate()) {
    emit('save', newStudent.value)
  }
}
</script>
<template>
  <VaForm
    v-slot="{ isValid }"
    ref="add-student-form"
    class="flex-col justify-start items-start gap-4 inline-flex w-full"
  >
    <div class="self-stretch flex-col justify-start items-start gap-4 flex">
      <div class="flex gap-4 flex-col sm:flex-row w-full">
        <VaInput
          v-model="newStudent.fullname"
          label="Tên đầy đủ"
          class="w-full sm:w-1/2"
          :rules="[validators.required]"
          name="fullname"
        />
        <VaInput
          v-model="newStudent.phone"
          label="Số điện thoại"
          class="w-full sm:w-1/2"
          :rules="[validators.required]"
          name="phone"
        />
      </div>
      <div class="flex gap-4 flex-col sm:flex-row w-full">
        <VaInput
          v-model="newStudent.birthday"
          label="Ngày sinh"
          class="w-full sm:w-1/2"
          :rules="[validators.required]"
          name="birthday"
        />

        <div class="flex items-center w-1/2 mt-4">
          <VaCheckbox v-model="newStudent.active" label="Active" class="w-full" name="active" />
        </div>
      </div>

      <VaTextarea v-model="newStudent.notes" label="Ghi chú" class="w-full" name="notes" />
      <div class="flex gap-2 flex-col-reverse items-stretch justify-end w-full sm:flex-row sm:items-center">
        <VaButton preset="secondary" color="secondary" @click="$emit('close')">Huỷ</VaButton>
        <VaButton :disabled="!isValid" @click="onSave">{{ saveButtonLabel }}</VaButton>
      </div>
    </div>
  </VaForm>
</template>
