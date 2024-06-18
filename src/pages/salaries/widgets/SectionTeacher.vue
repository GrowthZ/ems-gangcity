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
import SectionTeacherItem from './SectionTeacherItem.vue'

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
const totalSalary = ref<number>(0)
const totalSubSalary = ref<number>(0)

const calculateTotalSalary = () => {
  totalSalary.value = data.value.reduce((sum, item) => {
    if (item && item.salary) {
      const salary = parseInt(item.salary.replace(/,/g, ''), 10) || 0
      return sum + salary
    } else {
      return sum
    }
  }, 0)
}
const calculateTotalSubSalary = () => {
  totalSubSalary.value = data.value.reduce((sum, item) => {
    if (item && item.subSalary) {
      const salary = parseInt(item.subSalary.replace(/,/g, ''), 10) || 0
      return sum + salary
    } else {
      return sum
    }
  }, 0)
}

watch(
  () => props.data,
  (newValue) => {
    data.value = newValue
    // Log the updated data
    calculateTotalSalary()
    calculateTotalSubSalary()
  },
  { immediate: true },
)

const dashboardMetrics = computed<DashboardMetric[]>(() => [
  {
    id: 'salary',
    title: 'Lương giáo viên',
    value: totalSalary.value.toLocaleString('vi-VN', { style: 'currency', currency: 'VND' }).toString(),
    icon: 'mso-attach_money',
    iconBackground: getColor('success'),
    iconColor: getColor('on-success'),
  },
  {
    id: 'subSalary',
    title: 'Lương trợ giảng',
    value: totalSubSalary.value.toLocaleString('vi-VN', { style: 'currency', currency: 'VND' }).toString(),
    icon: 'mso-attach_money',
    iconBackground: getColor('warning'),
    iconColor: getColor('on-success'),
  },
  {
    id: 'lessonCount',
    title: 'Số tiết dạy',
    value: data.value.length.toString(),
    icon: 'mso-folder_open',
    iconBackground: getColor('info'),
    iconColor: getColor('on-info'),
  },
])
</script>
