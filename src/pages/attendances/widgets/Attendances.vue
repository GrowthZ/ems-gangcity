<template>
  <VaInput v-model="searchValue" class="mb-4" placeholder="Tìm kiếm nhanh...">
    <template #appendInner>
      <VaIcon color="secondary" name="mso-search" />
    </template>
  </VaInput>
  <VaInnerLoading :loading="loading">
    <section
      v-if="filteredCalendars?.length && !loading"
      class="grid grid-cols-3 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-5"
    >
      <template v-for="(calendar, index) in filteredCalendars" :key="`${calendar.id}-${index}`">
        <VaCard
          class="col-span-3 md:col-span-1 min-h-[146px]"
          href="#"
          stripe
          outlined
          :stripe-color="calendar.attendanceCode == '' ? 'rgba(255, 193, 7, 0.5)' : 'success'"
        >
          <VaCardTitle class="flex justify-between">
            <span class="text-dark text-lg leading-7 font-bold">{{ calendar.location }}</span>
            <span class="text-secondary text-xs"
              ><VaIcon :name="`mso-calendar_month`" class="font-light mb-1 pr-1" color="warning" size="1.3rem" />{{
                calendar.dateTime
              }}</span
            >
          </VaCardTitle>
          <VaCardContent class="leading-5 text-sm">
            <div class="flex justify-between">
              <span
                ><VaIcon :name="`mso-school`" class="font-light mb-2 pr-2" color="primary" size="2rem" /><span
                  class="text-primary mb-2 text-primary text-lg leading-8 font-bold"
                  >{{ calendar.group }}</span
                ></span
              >
              <span class="pl-5"
                ><VaIcon :name="`mso-person`" class="mb-1 pr-1" color="info" size="1.6rem" /><span
                  class="text-info mb-2 text-primary text-lg leading-7"
                  >{{ calendar.teacher }}</span
                ></span
              >
            </div>
            <p>
              <VaIcon :name="`mso-schedule`" class="font-light mb-1 pr-4" color="warning" size="1.6rem" />{{
                calendar.turnTime
              }}
            </p>
            <VaDivider class="my-3" />
            <div class="flex justify-between">
              <VaButton v-if="calendar.attendanceCode !== ''" preset="secondary" icon="mso-edit" color="info"
                >Sửa điểm danh</VaButton
              >
              <VaButton v-if="calendar.attendanceCode == ''" preset="secondary" icon="mso-sync_alt" color="secondary"
                >Đổi giáo viên
              </VaButton>
              <VaButton
                v-if="calendar.attendanceCode == ''"
                preset="primary"
                icon="mso-checklist"
                color="primary"
                class="gap-2"
                @click="showAttendanceModal(calendar)"
                >Điểm danh</VaButton
              >
              <VaButton
                v-if="calendar.attendanceCode !== ''"
                preset="info"
                icon="mso-check"
                color="success"
                class="gap-2"
                disabled
                >Hoàn thành</VaButton
              >
            </div>
          </VaCardContent>
        </VaCard>
      </template>
    </section>
    <VaAlert v-else-if="!loading" class="mb-4 leading-5" color="info" outline>
      Không có lịch dạy nào. Hãy thêm lịch dạy mới.
    </VaAlert>
  </VaInnerLoading>
  <VaModal
    ref="modal"
    v-model="doShowAttendanceModal"
    size="small"
    mobile-fullscreen
    close-button
    stateful
    hide-default-actions
  >
    <AttendanceModal
      :calendar="attendanceToEdit"
      :save-button-label="isUpdateAttendance ? 'Cập nhật' : 'Điểm danh'"
      :students="students"
    />
  </VaModal>
</template>

<script lang="ts" setup>
import { ref, computed, watch } from 'vue'
import AttendanceModal from './AttendanceModal.vue'

const searchValue = ref('')
const props = defineProps<{
  calendars: any
  students: any
  loading: boolean
}>()

const calendars = ref<any[]>(props.calendars)
const loading = ref(props.loading)

const doShowAttendanceModal = ref(false)
const attendanceToEdit = ref(undefined)
const isUpdateAttendance = ref(false)

const showAttendanceModal = (attendance: any) => {
  attendanceToEdit.value = attendance
  doShowAttendanceModal.value = true
  isUpdateAttendance.value = attendance.attendanceCode !== ''
}

watch(
  () => props.calendars,
  (newValue) => {
    calendars.value = newValue
  },
  { immediate: true },
)
watch(
  () => props.loading,
  (newValue) => {
    loading.value = newValue
  },
  { immediate: true },
)

const filteredCalendars = computed(() => {
  const value = searchValue.value.trim().toLowerCase()
  if (value.length === 0) {
    return calendars.value
  }
  return calendars.value.filter((calendar) => {
    return (
      calendar.group.toLowerCase().includes(value) ||
      calendar.teacher.toLowerCase().includes(value) ||
      calendar.location.toLowerCase().includes(value)
    )
  })
})
</script>
<style scoped>
.va-button .icon {
  margin-right: 8px; /* Điều chỉnh khoảng cách giữa biểu tượng và văn bản */
}
</style>