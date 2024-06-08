<template>
  <div id="app">
    <h1>Send Data to Google Apps Script</h1>
    <form @submit.prevent="sendData">
      <input v-model="formData.id" placeholder="Enter ID" />
      <input v-model="formData.username" placeholder="Enter Username" />
      <input v-model="formData.email" placeholder="Enter Email" />
      <button type="submit">Send</button>
    </form>
    <p v-if="response">Response: {{ response }}</p>
  </div>
</template>

<script>
export default {
  data() {
    return {
      formData: {
        id: '',
        username: '',
        email: '',
      },
      response: null,
    }
  },
  methods: {
    async sendData() {
      const dataToSend = {
        id: this.formData.id,
        username: this.formData.username,
        email: this.formData.email,
      }
      const scriptUrl =
        'https://script.google.com/macros/s/AKfycby0_EvfFeMRcRkelOS6qP_tEoD7wWYxyxDmYNv4Vv_vmXnebYYGXWipSerivXuPdYY/exec'
      const queryParams = new URLSearchParams({
        action: 'addData',
        param: JSON.stringify(dataToSend),
      }).toString()

      try {
        const response = await fetch(`${scriptUrl}?${queryParams}`)
        const data = await response.json()
        this.response = data
      } catch (error) {
        console.error('Error sending data:', error)
        this.response = 'Error sending data'
      }
    },
  },
}
</script>

<style>
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  text-align: center;
  color: #2c3e50;
  margin-top: 60px;
}

input {
  display: block;
  margin: 10px auto;
  padding: 10px;
}

button {
  padding: 10px 20px;
}
</style>
