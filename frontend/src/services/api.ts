import axios, { type AxiosError } from 'axios'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api'

export const api = axios.create({
  baseURL: API_URL,
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('agrisense_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }

  // Let the browser set multipart boundary for FormData
  if (config.data instanceof FormData) {
    if (config.headers && typeof config.headers.set === 'function') {
      config.headers.set('Content-Type', undefined as unknown as string)
    }
    delete config.headers['Content-Type']
  } else if (!config.headers['Content-Type']) {
    config.headers['Content-Type'] = 'application/json'
  }

  return config
})

api.interceptors.response.use(
  (response) => {
    const body = response.data
    if (body && typeof body === 'object' && 'success' in body && 'data' in body) {
      response.data = body.data
    }
    return response
  },
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('agrisense_token')
      localStorage.removeItem('agrisense_user')
      if (!window.location.pathname.startsWith('/login') && !window.location.pathname.startsWith('/register')) {
        window.location.href = '/login'
      }
    }
    return Promise.reject(error)
  }
)

export function getApiErrorMessage(error: unknown, fallback = 'Something went wrong'): string {
  const ax = error as AxiosError<{
    message?: string
    error?: string
    details?: string[]
    data?: unknown
  }>
  const data = ax.response?.data
  if (data && typeof data === 'object') {
    if (Array.isArray(data.details) && data.details.length) {
      return data.details.join(', ')
    }
    if (typeof data.message === 'string' && data.message.trim()) return data.message
    if (typeof data.error === 'string' && data.error.trim()) return data.error
  }
  if (ax.message === 'Network Error') return 'Cannot reach the server. Is the backend running?'
  return fallback
}

export function asPercent(confidence: number): number {
  if (confidence == null || Number.isNaN(confidence)) return 0
  return confidence <= 1 ? confidence * 100 : confidence
}
