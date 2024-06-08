<template>
  <div>
    <h5 class="page-title">Điểm danh</h5>
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
      <VaSelect
        v-model="studentAdd"
        class="col-span-1"
        label="Thêm học viên"
        :options="studentOptions"
        autocomplete
        highlight-matched-text
        :no-options-text="'Không tìm thấy học viên'"
        @click="clearStudentAdd"
      />
      <VaScrollContainer class="max-h-[450px]" color="transparent" vertical>
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
              <VaIcon name="delete" size="24px" color="danger" class="mso-delete" @click="removeOtherStudent(index)" />
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
    </VaCardContent>
  </VaCard>
  <!-- <div class="flex flex-col md:flex-row gap-2 justify-start">
        <VaButtonToggle
            v-model="doShowNote"
            color="background-element"
            border-color="background-element"
            width="full"
            :options="[
                { label: 'Điểm danh', value: true },
                { label: 'Ghi chú', value: false },
            ]"
        />
    </div> -->

  <VaForm class="flex flex-col gap-2">
    <div class="flex justify-end flex-col-reverse sm:flex-row mt-4 gap-2">
      <VaButton preset="secondary" color="secondary">Huỷ</VaButton>
      <VaButton color="primary">{{ saveButtonLabel }}</VaButton>
    </div>
  </VaForm>
</template>

<script setup>
import { ref, computed, watch } from 'vue'

const props = defineProps({
  calendar: Object,
  students: Array,
  saveButtonLabel: String,
})

const calendar = ref(props.calendar)
const students = ref(props.students)
const saveButtonLabel = ref(props.saveButtonLabel)
const selection = ref([])
const studentAdd = ref('')
const otherStudents = ref([])
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

console.log(otherStudents.value)

const studentsOfGroup = computed(() => {
  return students.value.filter((student) => student.group === calendar.value.group)
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
    otherStudents.value.push(getStudent(newVal.value))
    selection.value.push(newVal.value)
  }
})

watch(otherStudents, () => {
  studentAdd.value = null
})

const clearStudentAdd = () => {
  studentAdd.value = null
}
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
</style>
