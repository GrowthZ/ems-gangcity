<template>
  <div class="xs:pt-12">
    <h5 class="page-title">{{ isUpdate ? 'Sửa điểm danh' : 'Điểm danh' }}</h5>
  </div>
  <VaCard stripe stripe-color="primary" class="p-1" outlined>
    <VaCardContent>
      <div class="grid md:grid-cols-3 sm:grid-cols-2 xs:grid-cols-2 gap-2">
        <div class="font-bold text-primary">
          <VaIcon :name="`mso-school`" class="mb-1 pr-2" color="primary" size="1.5rem" />
          {{ calendar.group }}
        </div>
        <div class="font-light">
          <VaIcon :name="`mso-calendar_month`" class="mb-1 pr-2" color="success" size="1.3rem" />
          {{ calendar.dateTime }}
        </div>
        <div class="font-bold text-info">
          <VaIcon :name="`mso-person`" class="mb-1 pr-2" color="info" size="1.5rem" />
          {{ calendar.teacher }}
        </div>
        <div class="font-light">
          <VaIcon :name="`mso-schedule`" class="mb-1 pr-2" color="warning" size="1.3rem" />
          {{ calendar.turnTime }}
        </div>
        <div class="font-bold">
          <VaIcon :name="`mso-group`" class="mb-1 pr-2" color="success" size="1.5rem" />
          {{ selection.length }} / {{ studentsOfGroup.length }}
        </div>
        <div class="font-light">
          <VaIcon :name="`mso-location_on`" class="mb-1 pr-2" color="primary" size="1.5rem" />
          {{ calendar.location }}
        </div>
      </div>
      <VaDivider class="my-3" />
      <VaInnerLoading :loading="isLoading">
        <VaSelect
          v-if="!isLoading"
          v-model="studentAdd"
          class="col-span-1"
          label="Thêm học viên"
          :options="studentOptions"
          autocomplete
          highlight-matched-text
          :no-options-text="'Không tìm thấy học viên'"
          @click="clearStudentAdd"
        />
        <VaScrollContainer v-show="!isLoading" :class="scrollContainerClass" color="transparent" vertical>
          <div class="flex flex-col mt-4">
            <section v-if="otherStudents?.length">
              <div
                v-for="(student, index) in otherStudents"
                :key="student.code"
                class="student-item flex justify-between"
              >
                <VaCheckbox
                  :key="index"
                  v-model="selection"
                  :array-value="student.code"
                  class="mb-6 circle-checkbox"
                  color="success"
                >
                  <template #label>
                    <span :class="{ 'selected-text-other': selection.includes(student.code) }" class="pl-3">
                      {{ student.fullname }} -
                      <VaChip color="info" outline class="font-light text-info text-xs">{{ student.group }}</VaChip>
                    </span>
                  </template>
                </VaCheckbox>
                <VaIcon
                  name="delete"
                  size="24px"
                  color="danger"
                  class="mso-delete"
                  @click="removeOtherStudent(index)"
                />
              </div>
            </section>
            <div
              v-for="(student, index) in studentsOfGroup"
              :key="student.code"
              class="student-item flex justify-between"
            >
              <VaCheckbox :key="index" v-model="selection" :array-value="student.code" class="mb-6 circle-checkbox">
                <template #label>
                  <span :class="{ 'selected-text': selection.includes(student.code) }" class="pl-3">
                    {{ student.fullname }}
                  </span>
                </template>
              </VaCheckbox>
              <VaIcon
                name="phone_in_talk"
                size="24px"
                color="info"
                class="mso-phone_in_talk"
                @click="callStudent(student.phone)"
              />
            </div>
          </div>
        </VaScrollContainer>
      </VaInnerLoading>
    </VaCardContent>
  </VaCard>

  <div v-show="!isLoading" :class="fixedBottomClass">
    <VaForm class="flex flex-col gap-2">
      <div class="flex justify-end flex-col-reverse sm:flex-row gap-2">
        <VaButton preset="secondary" color="secondary" @click="$emit('close')">Huỷ</VaButton>
        <VaButton color="primary" @click="onSave">{{ isUpdate ? 'Cập nhật' : 'Điểm danh' }}</VaButton>
      </div>
    </VaForm>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { Action, sendRequest } from '../../../stores/data-from-sheet'

const props = defineProps({
  calendar: Object,
  students: Array,
  isUpdate: Boolean,
  //   saveButtonLabel: String,
})

const calendar = ref(props.calendar)
const students = ref(props.students)
const isUpdate = ref(props.isUpdate)

const selection = ref([])
const studentAdd = ref('')
const otherStudents = ref([])
const isLoading = ref(false)

const scrollContainerHeight = ref('')
// const doShowNote = ref(true)

const studentOthers = computed(() => {
  const codesInGroup = studentsOfGroup.value.map((student) => student.code)
  const selectedCodes = selection.value
  return students.value.filter(
    (student) => !codesInGroup.includes(student.code) && !selectedCodes.includes(student.code),
  )
})

const studentOptions = computed(() => {
  return studentOthers.value.map((student) => ({
    value: student.code,
    text: student.fullname + ' - ' + student.group,
  }))
})

const studentsOfGroup = computed(() => {
  return students.value.filter((student) => student.group === calendar.value.group)
})

const studentMarks = computed(() => {
  const selectedCodes = selection.value
  const sm = students.value.filter((student) => selectedCodes.includes(student.code))
  return sm.map((student) => [
    calendar.value.attendanceCode,
    student.code,
    student.fullname,
    calendar.value.dateTime,
    student.group,
    calendar.value.group,
  ])
})
const getStudent = (code) => {
  return students.value.find((student) => student.code === code)
}

const callStudent = (phone) => {
  window.location.href = `tel:${phone}`
}

const removeOtherStudent = (index) => {
  const removedStudent = otherStudents.value.splice(index, 1)[0]
  selection.value = selection.value.filter((code) => code !== removedStudent.code)
}

watch(studentAdd, (newVal) => {
  if (newVal) {
    otherStudents.value.unshift(getStudent(newVal.value))
    selection.value.push(newVal.value)
  }
})

watch(otherStudents, () => {
  studentAdd.value = null
})

const clearStudentAdd = () => {
  studentAdd.value = null
}

const emit = defineEmits(['close', 'save'])
const onSave = () => {
  emit('save', studentMarks.value)
}

const getMarkedStudents = async (attendanceCode) => {
  const res = await sendRequest(Action.getMarkedStudents, attendanceCode)
  return res
}

const fixedBottomClass =
  window.innerWidth < 768 ? 'fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-200' : 'mt-5'
// Hàm để tính toán chiều cao cần thiết cho VaScrollContainer
const calculateScrollContainerHeight = () => {
  const isMobile = window.innerWidth < 768 // Xác định xem màn hình có phải là thiết bị di động hay không
  // Nếu là thiết bị di động, sử dụng max-height cách bottom 200px, ngược lại sử dụng max-height 350px
  if (isMobile) {
    scrollContainerHeight.value = `calc(100vh - 200px)`
  } else {
    scrollContainerHeight.value = `400px`
  }
}

// Xác định class cho VaScrollContainer dựa trên điều kiện của màn hình
const scrollContainerClass = {
  'max-h-[400px]': !scrollContainerHeight.value, // Sử dụng max-height 350px nếu không phải là thiết bị di động
  'h-full': scrollContainerHeight.value, // Sử dụng chiều cao đã tính toán nếu là thiết bị di động
  'overflow-y-auto': true, // Đảm bảo nội dung có thể cuộn khi chiều cao vượt quá max-height
}

onMounted(() => {
  calculateScrollContainerHeight()
  if (isUpdate.value) {
    isLoading.value = true
    getMarkedStudents(calendar.value.attendanceCode).then((res) => {
      selection.value = res.data.data.map((item) => item[1])
      console.log(res)
      otherStudents.value = students.value.filter(
        (student) => selection.value.includes(student.code) && student.group !== calendar.value.group,
      )
      isLoading.value = false
    })
  }
})
</script>
<style lang="scss" scoped>
.va-select-content__autocomplete {
  flex: 1;
}

.va-input-wrapper__text {
  gap: 0.2rem;
}
.circle-checkbox {
  --va-checkbox-square-border-radius: 50%;
  --va-checkbox-font-size: 18px;
}
.selected-text {
  color: var(--va-primary);
  font-weight: bold;
}
.selected-text-other {
  color: var(--va-success);
  font-weight: bold;
}
.va-select__dropdown .va-select__dropdown-item {
  display: none;
}
.fixed {
  position: fixed;
  z-index: 1000; /* Đảm bảo nút ở trên cùng */
}
</style>
