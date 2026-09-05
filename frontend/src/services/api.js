import axios from 'axios'
import { clearSession, getToken } from './authStore'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? 'http://127.0.0.1:8000/api',
  headers: {
    Accept: 'application/json',
  },
})

api.interceptors.request.use((config) => {
  const token = getToken()

  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }

  return config
})

api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Token kedaluwarsa atau dicabut: bersihkan sesi agar UI kembali ke status keluar.
    if (error.response?.status === 401) {
      clearSession()
    }

    return Promise.reject(error)
  },
)

export default api
