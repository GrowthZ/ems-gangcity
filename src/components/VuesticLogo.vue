<template>
  <img
    :src="baseUrl + '/gangcity-admin.jpg'"
    :height="height"
    style="max-height: 20px; width: auto"
    alt="GangCity Admin"
    :color="colorsComputed.start"
  />
</template>

<script lang="ts" setup>
import { computed } from 'vue'
import { useColors } from 'vuestic-ui'

const { getColor } = useColors()

const props = withDefaults(
  defineProps<{
    height?: number
    start?: string
    end?: string
  }>(),
  {
    height: 18,
    start: 'primary',
    end: undefined,
  },
)

const colorsComputed = computed(() => {
  return {
    start: getColor(props.start),
    end: getColor(props.end || props.start),
  }
})

const baseUrl = window.location.origin
</script>
