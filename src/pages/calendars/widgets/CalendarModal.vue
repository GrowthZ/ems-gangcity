<template>
  <VaForm ref="add-calendar-form" class="flex-col justify-center items-center gap-4 inline-flex w-full">
    <div v-if="!isReview" class="self-stretch flex-col justify-center items-center gap-4 flex">
      <div class="grid md:grid-cols-2 xs:grid-cols-2 gap-4">
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
          v-model="selectedLocation"
          :rules="[(v) => typeof v !== 'undefined' || 'Fulfill the condition']"
          label="Trung tâm"
          placeholder="Chọn trung tâm"
          :options="centerOptions"
          value-by="value"
          :disabled="selectedGroup == ''"
        />
        <VaSelect
          v-model="selectedTeacher"
          label="Giáo viên"
          placeholder="Chọn giáo viên"
          :options="teacherOptions"
          value-by="value"
          :disabled="selectedGroup == ''"
        />
        <VaSelect
          v-model="selectedSubTeacher"
          label="Trợ giảng"
          placeholder="Chọn trợ giảng"
          :options="teacherOptions"
          value-by="value"
          :disabled="selectedGroup == ''"
        />
        <VaDateInput v-model="startDate" :parse="parseDate" :format="formatDate" label="Ngày bắt đầu" />
        <VaDateInput v-model="endDate" :parse="parseDate" :format="formatDate" label="Ngày kết thúc" />
      </div>
      <div class="flex gap-4 flex-col sm:flex-row w-full"></div>
      <div class="checkbox-container">
        <div class="checkbox-group grid grid-col-4 mx-auto">
          <div class="flex justify-center items-center">
            <VaCheckbox
              v-for="(day, index) in days"
              :key="index"
              v-model="selection"
              :array-value="day.value"
              :label="day.label"
              checked-icon="none"
              unchecked-icon="none"
              color="success"
              class="circle-checkbox checkbox-item"
              :class="{
                'selected-checkbox': selection.includes(day.value),
                'default-checkbox': !selection.includes(day.value),
              }"
              @click="toggleSelection(day.value)"
            />
          </div>
        </div>
        <div class="mb-2 mt-4">
          <div v-if="selectedDays.length === 0">Chưa có lịch nào được chọn.</div>
          <div v-else>
            <p class="mb-2">Lịch học được chọn:</p>
            <ul>
              <li v-for="(dayObj, index) in dayObjects" :key="index" class="mb-2">
                <div class="grid md:grid-cols-2 items-center gap-2">
                  <div class="text-success font-bold">{{ getTextDay(dayObj.day) }}</div>
                  <div>
                    <VaTimeInput
                      v-model="dayObj.startTime"
                      :hours-filter="(h) => h >= 6 && h <= 22"
                      :minutes-filter="(m) => m % 15 === 0"
                      label="Giờ bắt đầu"
                      class="w-28"
                    />
                    -
                    <VaTimeInput
                      v-model="dayObj.endTime"
                      :hours-filter="(h) => h >= 6 && h <= 22"
                      :minutes-filter="(m) => m % 15 === 0"
                      label="Giờ kết thúc"
                      class="w-28"
                    />
                  </div>
                </div>
                <VaDivider class="my-2" />
              </li>
            </ul>
          </div>
        </div>
      </div>
      <div class="flex gap-2 flex-col-reverse items-stretch justify-end w-full sm:flex-row sm:items-center">
        <VaButton preset="secondary" color="secondary" @click="$emit('close')">Huỷ</VaButton>
        <VaButton :disabled="isValid" @click="onSave">Xác nhận</VaButton>
      </div>
    </div>
    <div v-if="isReview">
      <div class="flex justify-between items-center mb-2 mt-4">
        <div color="info">
          Tổng số:
          <strong class="text-primary">{{ getDaysInRange(startDate, endDate).length }}</strong>
        </div>
        <div>
          Từ <strong>{{ startDate.toLocaleDateString('vi-VN') }}</strong> đến
          <strong>{{ endDate.toLocaleDateString('vi-VN') }}</strong>
        </div>
      </div>
      <VaDataTable
        :items="getDaysInRange(startDate, endDate)"
        :columns="columns"
        animation="fade-in-up"
        class="va-data-table"
      />
      <div class="flex gap-2 flex-col-reverse items-stretch justify-end w-full sm:flex-row sm:items-center">
        <VaButton preset="secondary" color="secondary" @click="isReview = !isReview">Huỷ</VaButton>
        <VaButton :disabled="isValid" @click="onSave">{{ saveButtonLabel }}</VaButton>
      </div>
    </div>
  </VaForm>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { VaTimeInput } from 'vuestic-ui'

const props = defineProps({
  calendarToEdit: { type: Object, default: () => ({}) },
  teachers: { type: Array, default: () => [] },
  centers: { type: Array, default: () => [] },
  groups: { type: Array, default: () => [] },
  tkb: { type: Array, default: () => [] },
  saveButtonLabel: { type: String, default: '' },
})

const teacherOptions = computed(() => {
  const teachers = props.teachers.map((teacher) => ({ value: teacher.nickname, text: teacher.nickname }))
  teachers.unshift({ value: '', text: '' })
  return teachers
})

const centerOptions = computed(() => {
  return props.centers.map((center) => ({ value: center.code, text: center.name }))
})

const groupOptions = computed(() => {
  return props.groups.map((group) => ({ value: group.name, text: group.name }))
})

const getTextLocation = (location) => {
  return props.centers.find((center) => center.code == location).name
}

const selectedTeacher = ref('')
const selectedSubTeacher = ref('')
const selectedLocation = ref('')
const selectedGroup = ref('')
const selectedDate = ref(new Date().toISOString().substr(0, 10))
const selectedDateConvert = ref('')

const today = new Date()
const todayDate = new Date(today.getFullYear(), today.getMonth(), today.getDate())
const startDate = ref(todayDate)
const endDate = ref(todayDate)
const isReview = ref(false)

const selection = ref([])
const selectedDays = ref([])
const dayObjects = ref([])
const days = [
  { label: 'T2', value: 'T2', text: 'Thứ 2' },
  { label: 'T3', value: 'T3', text: 'Thứ 3' },
  { label: 'T4', value: 'T4', text: 'Thứ 4' },
  { label: 'T5', value: 'T5', text: 'Thứ 5' },
  { label: 'T6', value: 'T6', text: 'Thứ 6' },
  { label: 'T7', value: 'T7', text: 'Thứ 7' },
  { label: 'CN', value: 'CN', text: 'Chủ nhật' },
]

const columns = [
  { key: 'location', label: 'Trung tâm' },
  { key: 'dateTime', label: 'Ngày tháng' },
  { key: 'attendanceTime', label: 'Thời gian' },
  { key: 'group', label: 'Lớp học' },
  { key: 'teacher', label: 'Giáo viên' },
  { key: 'subTeacher', label: 'Trợ giảng' },
]

const toggleSelection = (day) => {
  if (selectedDays.value.includes(day)) {
    selectedDays.value = selectedDays.value.filter((selectedDay) => selectedDay !== day)
    dayObjects.value = dayObjects.value.filter((dayObject) => dayObject.day !== day)
  } else {
    selectedDays.value.push(day)
    const dayObject = {
      day: day,
      startTime: getDate('08:00'),
      endTime: getDate('9:30'),
    }
    dayObjects.value.push(dayObject)
  }
  dayObjects.value.sort((a, b) => {
    const dayOrder = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN']
    return dayOrder.indexOf(a.day) - dayOrder.indexOf(b.day)
  })
}

const getDate = (time) => {
  const arrTime = time.split(':')
  const timeObject = new Date()
  timeObject.setHours(arrTime[0])
  timeObject.setMinutes(arrTime[1])
  return timeObject
}

const getTextDay = (day) => {
  return days.find((d) => d.value == day).text
}

const getDaysInRange = (startDate, endDate) => {
  const days = []
  const start = new Date(startDate)
  const end = new Date(endDate)
  // Convert selectedDays to an array of day indices
  const dayOfSelection = selection.value.map((day) => getDayOfWeek(day))

  while (start <= end) {
    const currentDay = start.getDay()
    const dayText = reverseDayOfWeek(currentDay)

    if (dayOfSelection.includes(currentDay)) {
      const dayObject = getDayObject(dayText)
      const startTime =
        String(dayObject.startTime?.getHours()).padStart(2, '0') +
        ':' +
        String(dayObject.startTime?.getMinutes()).padStart(2, '0')
      const endTime =
        String(dayObject.endTime?.getHours()).padStart(2, '0') +
        ':' +
        String(dayObject.endTime?.getMinutes()).padStart(2, '0')
      const formattedDate = start.toLocaleDateString('vi-VN')
      days.push({
        dateTime: formattedDate,
        location: getTextLocation(selectedLocation.value),
        group: selectedGroup.value,
        teacher: selectedTeacher.value,
        subTeacher: selectedSubTeacher.value,
        startTime: startTime,
        endTime: endTime,
        attendanceTime: startTime + ' - ' + endTime,
        attendanceCode:
          'GC' +
          selectedGroup.value +
          formattedDate.split('/').join('') +
          startTime.split(':').join('') +
          endTime.split(':').join(''),
        note: '',
        status: 0,
      })
    }
    start.setDate(start.getDate() + 1)
  }
  return days
}

const getDayObject = (day) => {
  return dayObjects.value.find((dayObject) => dayObject.day == day)
}

const getDayOfWeek = (day) => {
  const daysOfWeek = {
    CN: 0,
    T2: 1,
    T3: 2,
    T4: 3,
    T5: 4,
    T6: 5,
    T7: 6,
  }
  return daysOfWeek[day]
}

const reverseDayOfWeek = (day) => {
  const daysOfWeek = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7']
  return daysOfWeek[day]
}

const isValid = computed(() => {
  return selection.value.length < 1 || dayObjects.value.length < 1 || selectedGroup.value == ''
})

// const newCalendar = ref(defaultNewCalendar)

// const emit = defineEmits(['close', 'save'])
// const { confirm } = useModal()

const onSave = () => {
  isReview.value = true
  // getDaysInRange(startDate.value, endDate.value)
  // if (validate()) {
  //   emit('save', newCalendar.value)
  // } else {
  //   const agreed = confirm({
  //     title: 'Vui lòng điền đầy đủ thông tin',
  //     message: `Bạn hãy điền đầy đủ thông tin lịch học`,
  //     okText: 'Thử lại',
  //     cancelText: 'Đã hiểu',
  //     size: 'small',
  //     maxWidth: '380px',
  //   })

  //   if (agreed) {
  //     console.log('Thử lại')
  //   }
  // }
}

function formatDate(date) {
  const day = String(date.getDate()).padStart(2, '0')
  const month = String(date.getMonth() + 1).padStart(2, '0') // Tháng bắt đầu từ 0
  const year = date.getFullYear()
  return `${day}/${month}/${year}`
}

function parseDate(dateString) {
  if (!dateString) return new Date()
  const [day, month, year] = dateString.split('/').map(Number)
  return new Date(year, month - 1, day)
}

const convertSelectedDate = (newValue) => {
  const date = new Date(newValue)
  const formattedDate = date.toLocaleDateString('vi-VN') // Sử dụng 'vi-VN' để đảm bảo định dạng ngày là "dd/mm/yyyy" trong múi giờ của Việt Nam
  selectedDateConvert.value = formattedDate
}

watch(selectedDate, (newValue) => {
  convertSelectedDate(newValue)
})

watch([startDate, endDate], () => {
  if (startDate.value > endDate.value) {
    endDate.value = startDate.value
  }
})

const selectGroupData = (group) => {
  const groupTKB = props.tkb.filter((tkb) => tkb.group == group)
  if (groupTKB.length > 0) {
    // selectedLocation = { value: groupTKB[0].location, text: getTextLocation(groupTKB[0].location) }
    selectedLocation.value = groupTKB[0].location
    // selectedLocation.text = getTextLocation(groupTKB[0].location)
    selectedTeacher.value = groupTKB[0].teacher
    // selectedTeacher.text = groupTKB[0].teacher
    selectedSubTeacher.value = groupTKB[0].subTeacher
    // selectedSubTeacher.text = groupTKB[0].subTeacher
    // selectedTeacher = { value: groupTKB[0].teacher, text: groupTKB[0].teacher }
    // selectedSubTeacher = { value: groupTKB[0].subTeacher, text: groupTKB[0].subTeacher }

    dayObjects.value = groupTKB.map((tkb) => {
      return {
        day: tkb.dayOfWeek,
        startTime: getDate(tkb.startTime),
        endTime: getDate(tkb.endTime),
      }
    })
    dayObjects.value.sort((a, b) => {
      const dayOrder = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN']
      return dayOrder.indexOf(a.day) - dayOrder.indexOf(b.day)
    })
    selection.value = groupTKB.map((tkb) => tkb.dayOfWeek)
    selectedDays.value = groupTKB.map((tkb) => tkb.dayOfWeek)
  }
}

watch([selectedGroup], () => {
  selectGroupData(selectedGroup.value)
})

// watch([selectedLocation, selectedTeacher, selectedSubTeacher], () => {
//   defaultNewCalendar.location = selectedLocation.value.text
//   defaultNewCalendar.teacher = selectedTeacher.value.text
//   defaultNewCalendar.subTeacher = selectedSubTeacher.value.text
//   // Cập nhật các trường dữ liệu khác nếu cần
//   console.log(defaultNewCalendar)
// })

// Thực hiện lệnh khi component được mount
onMounted(() => {
  convertSelectedDate(selectedDate.value)
})
</script>
<style lang="scss" scoped>
.checkbox-container {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.checkbox-group {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.checkbox-item {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border: 1px solid #ccc;
  border-radius: 50%;
  transition:
    color 0.3s,
    background-color 0.3s;
  margin-left: 10px;
}

.checkbox-item.selected-checkbox {
  color: white;
  background-color: var(--va-success);
}

.checkbox-item.default-checkbox {
  color: black;
  background-color: #ffffff;
}

.checkbox-item .va-checkbox__label {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
}

.circle-checkbox {
  --va-checkbox-square-border-radius: 50%;
  --va-checkbox-font-size: 18px;

  --va-checkbox-square-min-width: 0rem;
  --va-checkbox-square-min-height: 0rem;
  --va-checkbox-square-width: 0;
  --va-checkbox-square-height: 0;
  --va-checkbox-square-border: none;
}
</style>
