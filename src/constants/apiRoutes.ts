export const API_ROUTES = {
  AUTH: {
    LOGIN: '/api/users/login/',
    SIGNUP: '/api/users/register/',
    LOGOUT: '/api/users/logout/',
    VERIFY_EMAIL: '/api/users/verify-otp/',
    RESEND_VERIFICATION: '/api/users/resend-otp/',
    RESET_PASSWORD: '/api/users/reset-password/',
    CHANGE_PASSWORD: '/api/users/reset-password/',
    FORGOT_PASSWORD: '/api/users/request-password-reset/',
    VERIFY_TOKEN: '/api/token/verify/',
    REFRESH_TOKEN: '/api/token/refresh/',
    GOOGLE_LOGIN: '/api/users/google-auth/',
  },
  USER: {
    GET_USER_DATA: '/api/users/profile/',
    GET_TOKENS_SUMMARY: '/api/users/tokens/',
    GET_TOKENS_HISTORY: '/api/users/tokens-history/',
    UPDATE_PROFILE_IMAGE: '/api/users/add-profile-picture/',
    ADD_COMPANY_PICTURE: '/api/users/add-company-picture/',
  },
  CHAT: {
    GET_INTERACTION_HISTORY: '/api/chats/token-usage/',
    GET_TOKEN_STATISTICS: '/api/chats/token-usage/statistics/',
    GET_CREDITS_HISTORY: '/api/chats/token-usage/credits-history/',
    GET_USER_CHATS: '/api/chats/user/',
    CREATE: '/api/chats/create/',
    ADD_MESSAGE: (chatId: string) => `/api/chats/${chatId}/messages/add/`,
    ADD_MESSAGE_STREAM: (chatId: string) =>
      `/api/chats/${chatId}/messages/add-stream/`,
    GET_MESSAGES: (chatId: string) => `/api/chats/${chatId}/messages/`,
    DELETE: (chatId: string) => `/api/chats/${chatId}/delete/`,
    SEARCH_CHATS: (search: string) => `/api/search/elastic/?q=${search}`,
  },
  DOC_COMPLIANCE: {
    CHECK_DOC: '/api/checker/check-document/',
  },
  COMPLAINTS: {
    LIST: '/api/complaints/complaintlist',
    CREATE: '/api/complaints/',
    UPLOAD_DOCS: (contextId: string) =>
      `/api/complaints/${contextId}/reference-documents/`,
    ADD_MESSAGE: (complaintId: string) =>
      `/api/complaints/${complaintId}/messages/`,
    GET_KEY_POINTS: (complaintId: string) =>
      `/api/complaints/${complaintId}/key-points/`,
    GET_DETAILS: (complaintId: string) => `/api/complaints/${complaintId}/`,
    GET_MESSAGES_LIST: (complaintId: string) =>
      `/api/complaints/${complaintId}/messageslist/`,
  },
  BILLING: {
    ADD_CARD: '/api/billing/add-card/',
    DEFAULT_CARD: '/api/billing/default-card/',
    EDIT_CARD: '/api/billing/edit-card/',
    DELETE_CARD: '/api/billing/delete-card/',
    STRIPE_CUSTOMER: '/api/billing/stripe-customer/',
    LIST_CARDS: '/api/billing/list-cards/',
    SUBSCRIBE: '/api/billing/subscribe/',
    ITEMS: '/api/billing/items/',
    CREATE_ONE_TIME_PAYMENT_INTENT:
      '/api/billing/create-one-time-payment-intent/',
    INVOICES: '/api/billing/transactions/',
    CANCEL_SUBSCRIPTION: '/api/billing/cancel-subscription/',
    RENEW_SUBSCRIPTION: '/api/billing/renew-subscription/',
    USER_SUBSCRIPTIONS: '/api/billing/detailed-subscription/',
    MONTHLY_BILLING_PROCESS: '/api/billing/create-subscription-checkout/',
    ONE_TIME_PAYMENT_BILLING_PROCESS: '/api/billing/create-onetime-checkout/',
  },
  TUTORIALS: {
    GET: '/api/videos/',
  },
  SUPPORT: {
    HELP: '/api/support',
  },
} as const;
