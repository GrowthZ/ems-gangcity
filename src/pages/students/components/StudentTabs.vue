<template>
  <VaCard class="student-tabs-card">
    <VaCardContent class="tabs-container">
      <!-- Tabs tối ưu mobile -->
      <VaTabs v-model="activeTab" class="student-tabs">
        <template v-for="tab in tabs" :key="tab.name">
          <VaTab :name="tab.name">
            <div class="tab-content">
              <VaIcon :name="tab.icon" size="small" class="tab-icon" />
              <span class="tab-label">{{ tab.label }}</span>
              <span class="tab-label-short">{{ tab.shortLabel }}</span>
            </div>
          </VaTab>
        </template>
      </VaTabs>

      <!-- Tab content -->
      <div class="tab-panel">
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

const tabs = [
  { name: 'info', label: 'Thông tin', shortLabel: 'Info', icon: 'person' },
  { name: 'history', label: 'Lịch sử học', shortLabel: 'Học', icon: 'history' },
  { name: 'payments', label: 'Thanh toán', shortLabel: 'Tiền', icon: 'payments' },
  { name: 'adjustments', label: 'Điều chỉnh', shortLabel: 'Sửa', icon: 'swap_vert' },
]

const activeTab = ref('info')

// Watch for student code changes to reset tab
watch(
  () => props.studentCode,
  () => {
    activeTab.value = 'info'
  },
)
</script>

<style lang="scss" scoped>
.student-tabs-card {
  margin-bottom: 0;
}

.tabs-container {
  padding: 0;
}

.student-tabs {
  border-bottom: 1px solid var(--va-background-border);

  :deep(.va-tabs__container) {
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;

    &::-webkit-scrollbar {
      height: 4px;
    }

    &::-webkit-scrollbar-thumb {
      background-color: var(--va-background-border);
      border-radius: 4px;
    }
  }
}

.tab-content {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.5rem 0.75rem;

  @media (min-width: 640px) {
    gap: 0.5rem;
    padding: 0.75rem 1rem;
  }
}

.tab-icon {
  flex-shrink: 0;
}

.tab-label {
  display: none;

  @media (min-width: 640px) {
    display: inline;
    font-size: 0.875rem;
  }

  @media (min-width: 768px) {
    font-size: 1rem;
  }
}

.tab-label-short {
  display: inline;
  font-size: 0.75rem;

  @media (min-width: 640px) {
    display: none;
  }
}

.tab-panel {
  padding: 1rem;

  @media (min-width: 768px) {
    padding: 1.5rem;
  }
}
</style>
