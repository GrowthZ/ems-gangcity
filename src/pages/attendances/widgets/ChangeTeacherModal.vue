<template>
  <div>
    <h5 class="page-title">Đổi giáo viên</h5>
  </div>
  <VaCard stripe stripe-color="primary" class="p-1" outlined>
    <VaCardContent>
      <div class="grid md:grid-cols-2 sm:grid-cols-2 xs:grid-cols-2 gap-2">
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
          {{ calendar.attendanceTime }}
        </div>
      </div>
      <VaDivider class="my-3" />
      <VaSelect v-model="selectedTeacher" label="Giáo viên" placeholder="Chọn giáo viên" :options="uniqueTeachers" />
      <VaSelect
        v-model="selectedSubTeacher"
        label="Trợ giảng"
        placeholder="Chọn Trợ giảng"
        :options="uniqueSubTeachers"
        class="mt-4"
      />
      <p class="va-text-secondary opacity-70 pt-2">* Chọn giáo viên mới để thay thế</p>
    </VaCardContent>
  </VaCard>
  <VaForm class="flex flex-col gap-2 pt-3">
    <div class="flex justify-end flex-col-reverse sm:flex-row xs:flex-row gap-2">
      <VaButton preset="secondary" color="secondary" @click="$emit('close')">Huỷ</VaButton>
      <VaButton color="primary" @click="onSave">Cập nhật</VaButton>
    </div>
  </VaForm>
</template>
<script lang="ts" setup>
import { ref, computed, watch, onMounted } from 'vue'

const props = defineProps<{
  calendar: any
  teachers: any
}>()

const calendar = ref<any>(props.calendar)
const teachers = ref<any[]>(props.teachers)
const selectedTeacher = ref<any>('')
const selectedSubTeacher = ref<any>('')
const teacherSelected = ref('')

onMounted(() => {
  selectedTeacher.value = findTeacher(calendar.value.teacher)
  selectedSubTeacher.value = findTeacher(calendar.value.subTeacher)
})

const uniqueTeachers = computed(() => {
  const teacherOthers = teachers.value.filter((teacher) => teacher)
  const uniqueTeachersArray = Array.from(teacherOthers).map((teacher) => ({
    value: teacher.nickname,
    text: teacher.nickname + ' - ' + teacher.fullname,
  }))
  return teachers.value ? uniqueTeachersArray : []
})

const uniqueSubTeachers = computed(() => {
  const teacherOthers = teachers.value.filter((teacher) => teacher)
  const uniqueTeachersArray = Array.from(teacherOthers).map((teacher) => ({
    value: teacher.nickname,
    text: teacher.nickname + ' - ' + teacher.fullname,
  }))
  uniqueTeachersArray.push({ value: '', text: 'Chưa có' })
  return teachers.value ? uniqueTeachersArray : []
})

const findTeacher = (nickname: string) => {
  const teacher = teachers.value.find((teacher) => teacher.nickname === nickname)
  if (!teacher) {
    return { value: '', text: 'Chưa có' }
  }
  return {
    value: teacher.nickname,
    text: teacher.nickname + ' - ' + teacher.fullname,
  }
}

const emit = defineEmits(['close', 'save'])
const onSave = () => {
  emit('save', [calendar.value.attendanceCode, teacherSelected.value, selectedSubTeacher.value.value])
}

watch(
  uniqueTeachers,
  (newTeachers: any) => {
    if (newTeachers.length > 0 && !selectedTeacher.value) {
      selectedTeacher.value = newTeachers[0]
      teacherSelected.value = newTeachers[0].value
    }
  },
  { immediate: true },
)

// Watcher để cập nhật teacherSelected khi selectedTeacher thay đổi
watch(selectedTeacher, (newTeacher: any) => {
  if (newTeacher) {
    teacherSelected.value = newTeacher.value
  }
})
</script>
