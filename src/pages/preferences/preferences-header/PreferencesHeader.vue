<template>
  <VaAvatar size="large" color="warning"
    ><span class="text-4xl"> <img :src="baseUrl + '/logo.jpg'" alt="avatar" class="rounded-full w-20 h-20" /> </span
  ></VaAvatar>
  <div class="flex flex-col justify-center">
    <h2 class="text-[28px] md:text-[32px] leading-10 font-bold">{{ capitalize(user.userName) }}</h2>
    <div class="flex space-x-1 text-[13px] leading-4">
      <!-- <p>Member since</p> -->
      <p class="text-primary font-bold">{{ user.role.toUpperCase() }}</p>
    </div>
  </div>
</template>
<script lang="ts" setup>
import { useUserStore } from '../../../stores/user-store'

const user = useUserStore()
const baseUrl = window.location.origin

const capitalize = (str: string) => {
  if (!str) return ''
  return str.charAt(0).toUpperCase() + str.slice(1)
}
</script>
