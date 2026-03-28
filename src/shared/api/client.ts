import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios'
import { message } from 'antd'
import { useAuthStore } from '@/features/auth/store/auth.store'
import type { ApiResponse } from '@/shared/types/common'

declare module 'axios' {
  interface InternalAxiosRequestConfig {
    skipErrorHandler?: boolean
  }
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api'

const client = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
})

client.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = useAuthStore.getState().token

    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`
    }

    return config
  },
  (error: AxiosError) => Promise.reject(error),
)

client.interceptors.response.use(
  (response) => {
    if (response.config.responseType === 'blob') {
      return response.data
    }

    return response.data.data
  },
  (error: AxiosError<ApiResponse>) => {
    if (import.meta.env.DEV) {
      console.error('API Error:', {
        url: error.config?.url,
        status: error.response?.status,
        message: error.response?.data?.message || error.message,
      })
    }

    if (error.config?.skipErrorHandler) {
      return Promise.reject(error)
    }

    if (!error.response) {
      const errorText = error.message.includes('timeout')
        ? '请求超时，请稍后重试'
        : '网络连接失败，请检查网络设置'

      message.error(errorText)
      return Promise.reject(error)
    }

    const { status, data } = error.response
    const errorMessage = data?.message || '请求失败'

    switch (status) {
      case 401:
        useAuthStore.getState().logout()
        message.error(errorMessage || '登录已过期，请重新登录')
        break
      case 403:
        message.error(errorMessage || '权限不足，无法执行此操作')
        break
      case 404:
        message.error(errorMessage || '请求的资源不存在')
        break
      case 409:
        message.error(errorMessage || '操作冲突，请检查后重试')
        break
      case 500:
      case 502:
      case 503:
      case 504:
        message.error(errorMessage || '服务器异常，请稍后再试')
        break
      default:
        message.error(errorMessage)
    }

    return Promise.reject(error)
  },
)

export default client
