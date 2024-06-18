<template>
  <div v-if="loading" class="fullscreen-loading">
    <VaInnerLoading :loading="loading" :size="60" />
  </div>
</template>
<script setup>
import { ref } from 'vue'

const props = defineProps({
  loading: boolean,
})

const loading = ref(props.loading)
</script>
<style scoped>
.fullscreen-loading {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 9999;
}
</style>
