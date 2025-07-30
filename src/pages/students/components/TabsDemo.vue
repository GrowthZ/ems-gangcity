<template>
  <div class="tabs-demo">
    <h2 class="text-xl font-bold mb-4">Demo Tabs - Student History</h2>

    <VaCard class="mb-6">
      <VaCardContent class="p-0">
        <VaTabs v-model="activeTab" class="w-full">
          <VaTab name="history" label="Lịch sử học tập" icon="history">
            <div class="p-6">
              <div class="flex items-center gap-2 mb-4">
                <VaIcon name="history" color="primary" />
                <h3 class="text-lg font-semibold">Lịch sử học tập</h3>
              </div>

              <div class="space-y-4">
                <div class="flex items-center justify-between p-4 border rounded-lg">
                  <div class="flex items-center gap-4">
                    <VaIcon name="check_circle" color="success" size="small" />
                    <div>
                      <div class="font-semibold">15/12/2024</div>
                      <div class="text-sm text-gray-600">Cô Mai - Lớp A1</div>
                    </div>
                  </div>
                  <div class="flex items-center gap-2">
                    <VaChip text="Có mặt" color="success" size="small" />
                    <span class="text-sm text-gray-500">14:30</span>
                  </div>
                </div>

                <div class="flex items-center justify-between p-4 border rounded-lg">
                  <div class="flex items-center gap-4">
                    <VaIcon name="cancel" color="danger" size="small" />
                    <div>
                      <div class="font-semibold">12/12/2024</div>
                      <div class="text-sm text-gray-600">Thầy Nam - Lớp A1</div>
                    </div>
                  </div>
                  <div class="flex items-center gap-2">
                    <VaChip text="Vắng" color="danger" size="small" />
                    <span class="text-sm text-gray-500">14:30</span>
                  </div>
                </div>
              </div>
            </div>
          </VaTab>

          <VaTab name="payments" label="Lịch sử thanh toán" icon="payments">
            <div class="p-6">
              <div class="flex items-center gap-2 mb-4">
                <VaIcon name="payments" color="primary" />
                <h3 class="text-lg font-semibold">Lịch sử thanh toán</h3>
              </div>

              <div class="space-y-4">
                <div class="flex items-center justify-between p-4 border rounded-lg">
                  <div class="flex items-center gap-4">
                    <VaIcon name="currency_exchange" color="success" size="small" />
                    <div>
                      <div class="font-semibold">10/12/2024</div>
                      <div class="text-sm text-gray-600">2,000,000 VNĐ</div>
                    </div>
                  </div>
                  <div class="flex items-center gap-2">
                    <VaChip text="Đã thanh toán" color="success" size="small" />
                    <span class="text-sm text-gray-500">09:15</span>
                  </div>
                </div>

                <div class="flex items-center justify-between p-4 border rounded-lg">
                  <div class="flex items-center gap-4">
                    <VaIcon name="currency_exchange" color="success" size="small" />
                    <div>
                      <div class="font-semibold">01/12/2024</div>
                      <div class="text-sm text-gray-600">1,500,000 VNĐ</div>
                    </div>
                  </div>
                  <div class="flex items-center gap-2">
                    <VaChip text="Đã thanh toán" color="success" size="small" />
                    <span class="text-sm text-gray-500">16:45</span>
                  </div>
                </div>
              </div>
            </div>
          </VaTab>

          <VaTab name="adjustments" label="Lịch sử điều chỉnh" icon="swap_vert">
            <div class="p-6">
              <div class="flex items-center gap-2 mb-4">
                <VaIcon name="swap_vert" color="primary" />
                <h3 class="text-lg font-semibold">Lịch sử điều chỉnh</h3>
              </div>

              <div class="space-y-4">
                <div class="flex items-center justify-between p-4 border rounded-lg">
                  <div class="flex items-center gap-4">
                    <VaIcon name="swap_vert" color="warning" size="small" />
                    <div>
                      <div class="font-semibold">08/12/2024</div>
                      <div class="text-sm text-gray-600">Đổi lịch học do nghỉ lễ</div>
                      <div class="text-xs text-gray-500 mt-1">Cô Mai - Lớp A1</div>
                    </div>
                  </div>
                  <div class="flex items-center gap-2">
                    <VaChip text="Đã điều chỉnh" color="warning" size="small" />
                    <span class="text-sm text-gray-500">10:30</span>
                  </div>
                </div>

                <div class="flex items-center justify-between p-4 border rounded-lg">
                  <div class="flex items-center gap-4">
                    <VaIcon name="swap_vert" color="warning" size="small" />
                    <div>
                      <div class="font-semibold">01/12/2024</div>
                      <div class="text-sm text-gray-600">Bù buổi học bị hủy</div>
                      <div class="text-xs text-gray-500 mt-1">Thầy Nam - Lớp A1</div>
                    </div>
                  </div>
                  <div class="flex items-center gap-2">
                    <VaChip text="Đã điều chỉnh" color="warning" size="small" />
                    <span class="text-sm text-gray-500">14:20</span>
                  </div>
                </div>
              </div>
            </div>
          </VaTab>
        </VaTabs>
      </VaCardContent>
    </VaCard>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const activeTab = ref(0)
</script>

<style scoped>
.tabs-demo {
  max-width: 800px;
  margin: 0 auto;
}
</style>
