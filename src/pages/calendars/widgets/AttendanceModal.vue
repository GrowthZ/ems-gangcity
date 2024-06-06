<template>
  <VaForm ref="add-calendar-form" class="flex-col justify-start items-start gap-4 inline-flex w-full">
    <div class="self-stretch flex-col justify-start items-start gap-4 flex">
      <div class="flex gap-4 flex-col sm:flex-row w-full">
        <VaSelect
          v-model="selectedLocation"
          :rules="[(v) => typeof v !== 'undefined' || 'Fulfill the condition']"
          label="Trung tâm"
          class="w-full sm:w-1/2"
          placeholder="Chọn trung tâm"
          :options="centerOptions"
          value-by="value"
        />
      </div>
      <div class="flex gap-4 flex-col sm:flex-row w-full">
        <VaDateInput
          v-model="selectedDate"
          label="Ngày tháng"
          class="w-full sm:w-1/2"
          :rules="[validators.required]"
          name="dateTime"
        />
        <VaSelect
          v-model="selectedTime"
          label="Thời gian"
          placeholder="Chọn thời gian"
          :options="timeOptions"
          value-by="value"
          :rules="[(v) => !!v || 'Payment System field is required']"
          :default="timeOptions[0]"
        />
      </div>
      <div class="flex gap-4 flex-col sm:flex-row w-full">
        <VaSelect
          v-model="selectedGroup"
          label="Lớp học"
          placeholder="Chọn lớp học"
          :options="groupOptions"
          :rules="[(v) => !!v || 'Payment System field is required']"
          value-by="value"
          name="group"
        />
        <VaSelect
          v-model="selectedTeacher"
          label="Giáo viên"
          placeholder="Chọn giáo viên"
          :options="teacherOptions"
          value-by="value"
        />
      </div>
      <div class="flex gap-2 flex-col-reverse items-stretch justify-end w-full sm:flex-row sm:items-center">
        <VaButton preset="secondary" color="secondary" @click="$emit('close')">Huỷ</VaButton>
        <VaButton :disabled="isValid" @click="onSave">{{ saveButtonLabel }}</VaButton>
      </div>
    </div>
  </VaForm>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { useForm, useModal } from 'vuestic-ui'
import { validators } from '../../../services/utils'

const props = defineProps({
  calendarToEdit: { type: Object, default: () => ({}) },
  teachers: { type: Array, default: () => [] },
  centers: { type: Array, default: () => [] },
  groups: { type: Array, default: () => [] },
  saveButtonLabel: { type: String, default: '' },
})

const Time = {
  c1: '8h - 9h30',
  c2: '9h30 - 11h',
  c3: '15h - 16h30',
  c4: '17h30 - 19h',
  c5: '20h - 21h30',
  c6: '16h30 - 17h30',
  c7: '17h - 18h30',
  c8: '19h30 - 20h30',
}
const timeOptions = computed(() => {
  return Object.entries(Time).map(([value]) => ({ value: value, text: value }))
})
const teacherOptions = computed(() => {
  return props.teachers.map((teacher) => ({ value: teacher.nickname, text: teacher.nickname }))
})

const centerOptions = computed(() => {
  return props.centers.map((center) => ({ value: center.name, text: center.name }))
})

const groupOptions = computed(() => {
  return props.groups.map((group) => ({ value: group.name, text: group.name }))
})

const selectedTime = ref('')
const selectedTeacher = ref('')
const selectedLocation = ref('')
const selectedGroup = ref('')
const selectedDate = ref(new Date().toISOString().substr(0, 10))
const selectedDateConvert = ref('')

const isValid = computed(() => {
  return (
    selectedTime.value == '' || selectedTeacher.value == '' || selectedLocation.value == '' || selectedGroup.value == ''
  )
})

const defaultNewCalendar = {
  dateTime: selectedDateConvert.value,
  turnTime: selectedTime.value.text,
  location: selectedLocation.value.text,
  group: selectedGroup.value.text,
  teacher: selectedTeacher.value.text,
  attendanceCode: '',
  active: true,
  notes: '',
}
const newCalendar = ref(defaultNewCalendar)

const { validate } = useForm('add-calendar-form')
const emit = defineEmits(['close', 'save'])
const { confirm } = useModal()

const onSave = () => {
  console.log(isValid)
  if (validate()) {
    console.log('newCalendar.value:', newCalendar.value)
    emit('save', newCalendar.value)
  } else {
    const agreed = confirm({
      title: 'Vui lòng điền đầy đủ thông tin',
      message: `Bạn hãy điền đầy đủ thông tin lịch học`,
      okText: 'Thử lại',
      cancelText: 'Đã hiểu',
      size: 'small',
      maxWidth: '380px',
    })

    if (agreed) {
      console.log('Thử lại')
    }
  }
}

const convertSelectedDate = (newValue) => {
  const date = new Date(newValue)
  const formattedDate = date.toLocaleDateString('vi-VN') // Sử dụng 'vi-VN' để đảm bảo định dạng ngày là "dd/mm/yyyy" trong múi giờ của Việt Nam
  selectedDateConvert.value = formattedDate
}

watch(selectedDate, (newValue) => {
  convertSelectedDate(newValue)
})

watch([selectedDateConvert, selectedTime, selectedLocation, selectedGroup, selectedTeacher], () => {
  defaultNewCalendar.dateTime = selectedDateConvert.value
  defaultNewCalendar.turnTime = selectedTime.value
  defaultNewCalendar.location = selectedLocation.value
  defaultNewCalendar.group = selectedGroup.value
  defaultNewCalendar.teacher = selectedTeacher.value
  // Cập nhật các trường dữ liệu khác nếu cần
  newCalendar.value = { ...defaultNewCalendar }
})

// Thực hiện lệnh khi component được mount
onMounted(() => {
  convertSelectedDate(selectedDate.value)
})
</script>
