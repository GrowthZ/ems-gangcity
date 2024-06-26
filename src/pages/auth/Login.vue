<template>
  <VaForm ref="form" @submit.prevent="submit">
    <!-- <h1 class="text-center font-semibold text-2xl mb-2 mt-4">Đăng nhập</h1> -->
    <p class="va-text-secondary opacity-80 text-center font-light text-sm mb-4">Hiphop save my life</p>
    <!-- <p class="text-base mb-4 leading-5">
      New to Vuestic?
      <RouterLink :to="{ name: 'signup' }" class="font-semibold text-primary">Sign up</RouterLink>
    </p> -->
    <VaInput
      v-model="formData.username"
      :rules="[validators.required]"
      class="mb-4"
      label="Tên đăng nhập"
      type="text"
      error-messages="Vui lòng nhập tên đăng nhập"
      :disabled="loading"
    />
    <VaValue v-slot="isPasswordVisible" :default-value="false">
      <VaInput
        v-model="formData.password"
        :rules="[validators.required]"
        :type="isPasswordVisible.value ? 'text' : 'password'"
        class="mb-4"
        label="Mật khẩu"
        error-messages="Vui lòng nhập mật khẩu"
        :disabled="loading"
        @clickAppendInner.stop="isPasswordVisible.value = !isPasswordVisible.value"
      >
        <template #appendInner>
          <VaIcon
            :name="isPasswordVisible.value ? 'mso-visibility_off' : 'mso-visibility'"
            class="cursor-pointer"
            color="secondary"
          />
        </template>
      </VaInput>
    </VaValue>

    <div class="auth-layout__options flex flex-col sm:flex-row items-start sm:items-center justify-between">
      <VaCheckbox v-model="formData.keepLoggedIn" class="mb-2 sm:mb-0" label="Đăng nhập tự động lần sau" />
      <!-- <RouterLink :to="{ name: 'recover-password' }" class="mt-2 sm:mt-0 sm:ml-1 font-semibold text-primary">
        Forgot password?
      </RouterLink> -->
    </div>

    <div class="flex justify-center mt-4">
      <VaButton :loading="loading" class="w-full" @click="submit"> Đăng nhập </VaButton>
    </div>
  </VaForm>
</template>

<script lang="ts" setup>
import { reactive, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useForm, useToast } from 'vuestic-ui'
import { validators } from '../../services/utils'
import { Action, sendRequest } from '../../stores/data-from-sheet'

const { validate } = useForm('form')
const { push } = useRouter()
const { init } = useToast()

const formData = reactive({
  username: '',
  password: '',
  keepLoggedIn: true,
})

const loading = ref(false)

onMounted(() => {
  if (localStorage.getItem('user')) {
    push({ name: page() })
  }
})

const submit = () => {
  if (validate()) {
    checkLogin(formData.username, formData.password)
  }
}

const page = () => {
  const user = JSON.parse(localStorage.getItem('user')!)
  if (user.role == 'admin') {
    return 'teacher-salary'
  } else if (user.role == 'teacher' || user.role == 'manager') {
    return 'attendances'
  } else {
    return 'students'
  }
}

const checkLogin = async (username: string, password: string) => {
  loading.value = true
  const data: any = {
    username: username,
    password: password,
  }
  const res = await sendRequest(Action.login, data)
  console.log(res)
  if (res.data.data != '') {
    localStorage.setItem('user', JSON.stringify(res.data.data))
    init({ message: 'Đăng nhập thành công', color: 'success' })
    loading.value = false
    push({ name: page() })
  } else {
    init({ message: 'Sai tài khoản. Đăng nhập thất bại', color: 'danger' })
    loading.value = false
  }
}
</script>
