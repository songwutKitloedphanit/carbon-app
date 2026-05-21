import axios from 'axios'

export const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
  timeout: 30_000,
})

// Request interceptor — attach JWT token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// Response interceptor — unwrap data / handle errors
api.interceptors.response.use(
  (res) => res,
  (err) => {
    const message = err.response?.data?.message ?? err.message ?? 'เกิดข้อผิดพลาด'
    return Promise.reject(new Error(message))
  },
)

// Generic helpers
export const get  = <T>(url: string, params?: Record<string, unknown>) =>
  api.get<T>(url, { params }).then((r) => r.data)

export const post = <T>(url: string, data?: unknown) =>
  api.post<T>(url, data).then((r) => r.data)

export const put  = <T>(url: string, data?: unknown) =>
  api.put<T>(url, data).then((r) => r.data)

export const del  = <T>(url: string) =>
  api.delete<T>(url).then((r) => r.data)
