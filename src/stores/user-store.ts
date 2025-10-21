import { defineStore } from 'pinia'

export const useUserStore = defineStore('user', {
  state: () => {
    // Safely parse user from localStorage with error handling
    let user = null
    try {
      const userStr = localStorage.getItem('user')
      if (userStr) {
        user = JSON.parse(userStr)
      }
    } catch (error) {
      console.error('Error parsing user from localStorage:', error)
      user = null
    }

    return {
      userName: user?.username || '',
      role: user?.role || 'guest',
      token: user?.token || '',
      email: 'gangcity@gmail.com',
      memberSince: '8/12/2020',
      pfp: 'https://picsum.photos/id/22/200/300',
      is2FAEnabled: false,
    }
  },

  actions: {
    toggle2FA() {
      this.is2FAEnabled = !this.is2FAEnabled
    },

    changeUserName(userName: string) {
      this.userName = userName
    },

    setUser(user: { username: string; role: string; token: string }) {
      this.userName = user.username
      this.role = user.role
      this.token = user.token
      // Save to localStorage
      localStorage.setItem('user', JSON.stringify(user))
    },

    logout() {
      this.userName = ''
      this.role = 'guest'
      this.token = ''
      localStorage.removeItem('user')
    },
  },
})

export const useStore = defineStore('demo', {
  state: () => {
    return {
      userName: 'Vasili Savitski',
      email: 'vasili@gmail.com',
      memberSince: '8/12/2020',
      pfp: 'https://picsum.photos/id/22/200/300',
      is2FAEnabled: false,
    }
  },

  actions: {
    toggle2FA() {
      this.is2FAEnabled = !this.is2FAEnabled
    },

    changeUserName(userName: string) {
      this.userName = userName
    },
  },
})
