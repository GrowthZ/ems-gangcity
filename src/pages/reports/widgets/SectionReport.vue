<template>
  <div class="grid grid-cols-1 sm:grid-cols-3 md:grid-cols-3 xs:grid-cols-2 gap-4 mb-4">
    <SectionTeacherItem
      v-for="metric in dashboardMetrics"
      :key="metric.id"
      :title="metric.title"
      :value="metric.value"
      :icon-background="metric.iconBackground"
      :icon-color="metric.iconColor"
    >
      <template #icon>
        <VaIcon :name="metric.icon" size="medium" />
      </template>
    </SectionTeacherItem>
  </div>
</template>

<script lang="ts" setup>
import { computed, ref, watch } from 'vue'
import { useColors } from 'vuestic-ui'
import SectionTeacherItem from './SectionReportItem.vue'

interface DashboardMetric {
  id: string
  title: string
  value: string
  icon: string
  iconBackground: string
  iconColor: string
}

const { getColor } = useColors()

const props = defineProps<{
  data: any
}>()

const data = ref<any[]>(props.data)

const totalLesson = ref<number>(0)
const totalNumber = ref<number>(0)
const avgPerLesson = ref<string>('0')

const calculateTotalLesson = () => {
  totalLesson.value = data.value.length
}

const calculateTotalNumber = () => {
  totalNumber.value = data.value.reduce((sum, item) => {
    if (item && item.total) {
      const numberStudent = parseInt(item.total.replace(/,/g, ''), 10) || 0
      return sum + numberStudent
    } else {
      return sum
    }
  }, 0)
}

const calculateAvgPerLesson = () => {
  avgPerLesson.value = (totalNumber.value / totalLesson.value).toFixed(2)
}
watch(
  () => props.data,
  (newValue) => {
    data.value = newValue

    calculateTotalLesson()
    calculateTotalNumber()
    calculateAvgPerLesson()
  },
  { immediate: true },
)

const dashboardMetrics = computed<DashboardMetric[]>(() => [
  {
    id: 'salary',
    title: 'Số tiết',
    value: totalLesson.value.toLocaleString('vi-VN'),
    icon: 'mso-local_library',
    iconBackground: getColor('success'),
    iconColor: getColor('on-success'),
  },
  {
    id: 'subSalary',
    title: 'Tổng sĩ số',
    value: totalNumber.value.toLocaleString('vi-VN'),
    icon: 'mso-group',
    iconBackground: getColor('warning'),
    iconColor: getColor('on-success'),
  },
  {
    id: 'lessonCount',
    title: 'Sĩ số / Tiết dạy',
    value: avgPerLesson.value,
    icon: 'mso-safety_divider',
    iconBackground: getColor('info'),
    iconColor: getColor('on-info'),
  },
])
</script>
