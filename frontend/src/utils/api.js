import axios from 'axios'

// Uses VITE_API_URL env var when deployed; falls back to /api proxy locally
const baseURL = import.meta.env.VITE_API_URL
  ? import.meta.env.VITE_API_URL + '/api'
  : '/api'

const api = axios.create({ baseURL, timeout: 15000 })

api.interceptors.request.use(config => {
  const token = localStorage.getItem('hrms_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

api.interceptors.response.use(
  res => res,
  err => {
    if (err.response?.status === 401) {
      localStorage.removeItem('hrms_token')
      localStorage.removeItem('hrms_user')
      window.location.href = '/login'
    }
    return Promise.reject(err)
  }
)

export default api
