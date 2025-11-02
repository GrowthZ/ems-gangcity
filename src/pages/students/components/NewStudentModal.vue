<template>
  <div class="flex justify-between items-center mb-4">
    <div class="va-h4">{{ !student ? 'Thêm mới học viên' : 'Cập nhật thông tin' }}</div>
  </div>
  <VaForm ref="add-student-form" class="flex-col justify-start items-start gap-4 inline-flex w-full">
    <div class="self-stretch flex-col justify-start items-start gap-4 flex">
      <div class="grid md:grid-cols-2 xs:grid-cols-2 gap-4 mb-4">
        <VaSelect
          v-model="newStudent.location"
          label="Cơ sở"
          placeholder="Chọn cơ sở"
          :options="locationOptions"
          value-by="value"
          class="w-full"
          required-mark
          name="location"
        />
        <VaSelect
          v-model="newStudent.group"
          label="Lớp học"
          placeholder="Chọn lớp"
          :options="groupOptions"
          value-by="value"
          class="w-full"
          name="group"
        />
        <VaInput
          v-model="newStudent.fullname"
          label="Tên đầy đủ"
          :rules="[validators.required]"
          name="fullname"
          required-mark
        />
        <VaInput v-model="newStudent.nickname" label="Biệt danh" :rules="[validators.required]" name="fullname" />
        <VaInput
          v-model="newStudent.phoneNumber"
          label="Số điện thoại"
          :rules="[validators.required]"
          name="phoneNumber"
        />
        <VaSelect
          v-model="newStudent.gender"
          label="Giới tính"
          placeholder="Chọn giới tính"
          :options="genderOptions"
          value-by="value"
          name="gender"
        />
      </div>
      <VaDateInput
        v-model="newStudent.birthday"
        label="Ngày sinh"
        :rules="[validators.required]"
        name="birthday"
        :parse="parseDate"
        :format="formatDate"
        class="w-full"
        manual-input
      />
      <VaDateInput
        v-model="newStudent.dateStart"
        label="Ngày bắt đầu"
        :rules="[validators.required]"
        name="dateStart"
        :parse="parseDate"
        :format="formatDate"
        class="w-full"
        manual-input
      />
      <VaSelect
        v-model="newStudent.status"
        label="Trạng thái"
        placeholder="Chọn trạng thái"
        :options="statusList"
        value-by="value"
        name="gender"
      >
        <template #content="{ value }">
          <VaBadge :text="value.text" :color="value.color" class="--va-badge-font-size" />
        </template>
      </VaSelect>
      <VaTextarea
        v-model="newStudent.note"
        label="Ghi chú"
        placeholder="Thông tin bổ sung..."
        name="notes"
        class="w-full pt-4"
      />
      <p class="va-text-secondary opacity-70 pt-2">* Vui lòng ghi đủ thông tin</p>
      <div class="flex gap-2 flex-col-reverse items-stretch justify-end w-full sm:flex-row sm:items-center">
        <VaButton preset="secondary" color="secondary" @click="$emit('close')">Huỷ</VaButton>
        <VaButton :disabled="isValidated" @click="onSave">{{ btnLabel }}</VaButton>
      </div>
    </div>
  </VaForm>
</template>
<script setup lang="ts">
import { ref, computed } from 'vue'
import { validators } from '../../../services/utils'

const props = defineProps<{
  studentToUpdate: any
  locations: any
  groups: any
  students: any // Giữ lại cho tương lai (có thể dùng để validate duplicate ở frontend)
}>()

const student = ref(props.studentToUpdate)
const locations = ref(props.locations)
const groups = ref(props.groups)
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const students = ref(props.students) // Backend sẽ generate code, không dùng ở frontend nữa

const today = new Date()
const todayDate = new Date(today.getFullYear(), today.getMonth(), today.getDate())
const btnLabel = computed(() => (student.value ? 'Cập nhật' : 'Thêm mới'))

const statusList = ref([
  { value: 'active', text: 'Đang học', color: 'success', colorText: 'white' },
  { value: 'pending', text: 'Tạm nghỉ', color: 'warning', colorText: '#000000' },
  { value: 'deactive', text: 'Đã nghỉ', color: 'danger', colorText: 'white' },
])

const genderOptions = ref([
  { value: 'boy', text: 'Nam', color: 'primary', colorText: 'white' },
  { value: 'girl', text: 'Nữ', color: 'info', colorText: 'white' },
])

const locationOptions = computed(() => {
  const uniqueLocationsArray = Array.from(locations.value).map((location: any) => ({
    value: location.code,
    text: location.name,
  }))
  // uniqueLocationsArray.unshift({ value: '', text: 'Tất cả' })
  return locations.value ? uniqueLocationsArray : []
})

const groupOptions = computed(() => {
  const uniqueGroups = groups.value.map((group: any) => ({ value: group.name, text: group.name }))
  uniqueGroups.unshift({ value: '', text: 'Chưa có lớp' })
  return groups.value ? uniqueGroups : []
})

// ❌ DEPRECATED: Không dùng frontend generate code nữa
// Backend sẽ tự động generate studentCode với logic an toàn hơn
// const generateStudentCode = () => {
//   const textLocation = getTextByValue(locationOptions, newStudent.value.location)
//   const codeList = students.value.filter((item: any) => item.location == textLocation)
//   return students.value
//     ? newStudent.value.location + (codeList.length + 1)
//     : newStudent.value.location + Math.floor(Math.random() * 1000)
// }

const defaultNewStudent: any = {
  code: student.value?.code ?? '',
  location: student.value?.location ? getValueByText(locationOptions, student.value.location) : '',
  fullname: student.value?.fullname ?? '',
  nickname: student.value?.nickname ?? '',
  group: student.value?.group ?? '',
  gender: student.value?.gender ? getValueByText(genderOptions, student.value?.gender) : 'boy',
  birthday: student.value?.birthday ? parseDate(student.value?.birthday) : todayDate,
  phoneNumber: student.value?.phoneNumber ?? '',
  dateStart: student.value?.dateStart ? parseDate(student.value?.dateStart) : todayDate,
  status: student.value?.status ? getValueByText(statusList, student.value.status) : 'active',
  notes: student.value?.note ?? '',
  lanDongTien: 0,
  tongSoBuoi: 0,
  buoiDaHoc: 0,
  buoiConLai: 0,
}
const newStudent = ref<any>({ ...defaultNewStudent })

function getValueByText(options: any, text: string) {
  const data = options.value.find((status: any) => status.text == text)
  return data ? data.value : ''
}

function getTextByValue(options: any, value: string) {
  const data = options.value.find((item: any) => item.value == value)
  return data ? data.text : ''
}

function formatDate(date: any) {
  const day = String(date.getDate()).padStart(2, '0')
  const month = String(date.getMonth() + 1).padStart(2, '0') // Tháng bắt đầu từ 0
  const year = date.getFullYear()
  return `${day}/${month}/${year}`
}

function parseDate(dateString: any) {
  const [day, month, year] = dateString ? dateString.split('/').map(Number) : [0, 0, 0]
  return new Date(year, month - 1, day)
}

const emit = defineEmits(['close', 'save', 'update'])

const onSave = () => {
  newStudent.value.status = getTextByValue(statusList, newStudent.value.status)
  newStudent.value.gender = getTextByValue(genderOptions, newStudent.value.gender)
  newStudent.value.birthday = formatDate(newStudent.value.birthday)
  newStudent.value.dateStart = formatDate(newStudent.value.dateStart)
  newStudent.value.location = getTextByValue(locationOptions, newStudent.value.location)

  if (!student.value) {
    // ✅ Để backend tự động generate studentCode
    // Không cần gọi generateStudentCode() nữa
    newStudent.value.code = '' // Backend sẽ tạo code tự động
    emit('save', newStudent.value)
  } else {
    // Khi update, giữ nguyên code cũ
    emit('update', newStudent.value)
  }
}
const isValidated = computed(() => {
  return newStudent.value.location == '' || newStudent.value.fullname == ''
})
</script>
