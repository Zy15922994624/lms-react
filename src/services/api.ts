import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios'
import { message } from 'antd'
import type { ApiResponse } from '@/types/common'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api'

const requests = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// 请求拦截器：注入 token
requests.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // 从 zustand store 直接获取 token（不依赖 hook）
    const raw = localStorage.getItem('lms-auth')
    if (raw) {
      try {
        const { state } = JSON.parse(raw)
        const token = state?.token
        if (token && config.headers) {
          config.headers.Authorization = `Bearer ${token}`
        }
      } catch {
        // ignore parse error
      }
    }
    return config
  },
  (error: AxiosError) => Promise.reject(error),
)

// 响应拦截器
requests.interceptors.response.use(
  (response) => {
    if (response.config.responseType === 'blob') {
      return response.data
    }
    return response.data.data
  },
  (error: AxiosError<ApiResponse>) => {
    const skipErrorHandler = (error.config as any)?.skipErrorHandler

    if (import.meta.env.DEV) {
      console.error('API Error:', {
        url: error.config?.url,
        status: error.response?.status,
        message: error.response?.data?.message || error.message,
      })
    }

    if (skipErrorHandler) {
      return Promise.reject(error)
    }

    if (!error.response) {
      const msg = error.message.includes('timeout')
        ? '请求超时，请稍后重试'
        : '网络连接失败，请检查网络设置'
      message.error(msg)
      return Promise.reject(error)
    }

    const { status, data } = error.response
    const errorMessage = data?.message || '请求失败'

    switch (status) {
      case 401:
        // 清除本地 token，跳转登录
        localStorage.removeItem('lms-auth')
        window.location.href = '/login'
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
        message.error(errorMessage || '服务器错误，请稍后重试')
        break
      default:
        message.error(errorMessage)
    }

    return Promise.reject(error)
  },
)

export default requests
