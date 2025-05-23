export interface INavigationRoute {
  name: string
  displayName: string
  meta: { icon: string }
  children?: INavigationRoute[]
}

export default {
  root: {
    name: '/',
    displayName: 'navigationRoutes.home',
  },
  routes: [
    // {
    //   name: 'dashboard',
    //   displayName: 'menu.dashboard',
    //   meta: {
    //     icon: 'vuestic-iconset-dashboard',
    //   },
    // },
    {
      name: 'students',
      displayName: 'menu.students',
      meta: {
        icon: 'group',
      },
    },
    {
      name: 'teachers',
      displayName: 'menu.teachers',
      meta: {
        icon: 'face',
      },
      children: [
        {
          name: 'teacher-list',
          displayName: 'menu.teacher-list',
        },
      ],
    },
    {
      name: 'teacher-salary',
      displayName: 'menu.teacher-salary',
      meta: {
        icon: 'payments',
      },
    },
    {
      name: 'attendances',
      displayName: 'menu.attendances',
      meta: {
        icon: 'group',
      },
    },
    {
      name: 'attendances-student-missing',
      displayName: 'menu.attendances-student-missing',
      meta: {
        icon: 'free_cancellation',
      },
    },

    {
      name: 'calendars',
      displayName: 'menu.calendars',
      meta: {
        icon: 'calendar_month',
      },
    },
    {
      name: 'reports',
      displayName: 'menu.reports',
      meta: {
        icon: 'summarize',
      },
    },
    {
      name: 'update-class-month',
      displayName: 'menu.update-class-month',
      meta: {
        icon: 'calendar_today',
      },
    },
    // {
    //   name: 'projects',
    //   displayName: 'menu.projects',
    //   meta: {
    //     icon: 'folder_shared',
    //   },
    // },
    // {
    //   name: 'payments',
    //   displayName: 'menu.payments',
    //   meta: {
    //     icon: 'credit_card',
    //   },
    //   children: [
    //     {
    //       name: 'payment-methods',
    //       displayName: 'menu.payment-methods',
    //     },
    //     {
    //       name: 'pricing-plans',
    //       displayName: 'menu.pricing-plans',
    //     },
    //     {
    //       name: 'billing',
    //       displayName: 'menu.billing',
    //     },
    //   ],
    // },
    // {
    //   name: 'auth',
    //   displayName: 'menu.auth',
    //   meta: {
    //     icon: 'login',
    //   },
    //   children: [
    //     {
    //       name: 'login',
    //       displayName: 'menu.login',
    //     },
    //     {
    //       name: 'signup',
    //       displayName: 'menu.signup',
    //     },
    //     {
    //       name: 'recover-password',
    //       displayName: 'menu.recover-password',
    //     },
    //   ],
    // },

    // {
    //   name: 'faq',
    //   displayName: 'menu.faq',
    //   meta: {
    //     icon: 'quiz',
    //   },
    // },
    // {
    //   name: '404',
    //   displayName: 'menu.404',
    //   meta: {
    //     icon: 'vuestic-iconset-files',
    //   },
    // },
    // {
    //   name: 'preferences',
    //   displayName: 'menu.preferences',
    //   meta: {
    //     icon: 'manage_accounts',
    //   },
    // },
    // {
    //   name: 'settings',
    //   displayName: 'menu.settings',
    //   meta: {
    //     icon: 'settings',
    //   },
    // },
  ] as INavigationRoute[],
}
