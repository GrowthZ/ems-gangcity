<template>
  <VaCard class="mb-6">
    <VaCardContent class="p-0">
      <VaTabs v-model="activeTab" class="w-full">
        <VaTab name="info" label="Thông tin cá nhân" icon="person" />
        <VaTab name="history" label="Lịch sử học tập" icon="history" />
        <VaTab name="payments" label="Lịch sử thanh toán" icon="payments" />
        <VaTab name="adjustments" label="Lịch sử điều chỉnh" icon="swap_vert" />
      </VaTabs>
      <div class="p-6">
        <template v-if="activeTab === 'info'">
          <slot name="info" :student="student" />
        </template>
        <template v-else-if="activeTab === 'history'">
          <StudentHistory :student-code="studentCode" />
        </template>
        <template v-else-if="activeTab === 'payments'">
          <StudentPayments :student-code="studentCode" />
        </template>
        <template v-else-if="activeTab === 'adjustments'">
          <StudentAdjustments :student-code="studentCode" />
        </template>
      </div>
    </VaCardContent>
  </VaCard>
</template>

<script setup>
import { ref, watch } from 'vue'
import StudentHistory from './StudentHistory.vue'
import StudentPayments from './StudentPayments.vue'
import StudentAdjustments from './StudentAdjustments.vue'

const props = defineProps({
  studentCode: {
    type: String,
    required: true,
  },
  student: {
    type: Object,
    required: true,
  },
})

const activeTab = ref('info')

// Watch for student code changes to reset tab
watch(
  () => props.studentCode,
  () => {
    activeTab.value = 'info'
  },
)
</script>
