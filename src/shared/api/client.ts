import axios, {
  type AxiosError,
  type AxiosRequestConfig,
  type AxiosResponse,
  type InternalAxiosRequestConfig,
} from 'axios'
import { useAuthStore } from '@/features/auth/store/auth.store'
import { uiMessage } from '@/shared/components/feedback/message'
import type { ApiResponse } from '@/shared/types/common'

declare module 'axios' {
  interface InternalAxiosRequestConfig {
    skipErrorHandler?: boolean
  }

  interface AxiosRequestConfig {
    skipErrorHandler?: boolean
  }
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api'

const rawClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
})

rawClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = useAuthStore.getState().token

    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`
    }

    return config
  },
  (error: AxiosError) => Promise.reject(error),
)

rawClient.interceptors.response.use(
  (response) => response,
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

      uiMessage.error(errorText)
      return Promise.reject(error)
    }

    const { status, data } = error.response
    const errorMessage = data?.message || '请求失败'

    switch (status) {
      case 401:
        useAuthStore.getState().logout()
        uiMessage.error(errorMessage || '登录已过期，请重新登录')
        break
      case 403:
        uiMessage.error(errorMessage || '权限不足，无法执行此操作')
        break
      case 404:
        uiMessage.error(errorMessage || '请求的资源不存在')
        break
      case 409:
        uiMessage.error(errorMessage || '操作冲突，请检查后重试')
        break
      case 500:
      case 502:
      case 503:
      case 504:
        uiMessage.error(errorMessage || '服务器异常，请稍后再试')
        break
      default:
        uiMessage.error(errorMessage)
    }

    return Promise.reject(error)
  },
)

function isApiResponse<T>(payload: unknown): payload is ApiResponse<T> {
  if (!payload || typeof payload !== 'object') {
    return false
  }

  const record = payload as Record<string, unknown>
  return 'code' in record && 'message' in record && 'data' in record
}

function unwrapPayload<T>(payload: unknown): T {
  if (!isApiResponse<T>(payload)) {
    throw new Error('接口响应格式不符合约定，应为 { code, message, data }')
  }

  return payload.data
}

async function requestData<T = unknown, D = unknown>(
  config: AxiosRequestConfig<D>,
): Promise<T> {
  if (config.responseType === 'blob') {
    const response = await rawClient.request<Blob, AxiosResponse<Blob, D>>(config)
    return response.data as T
  }

  const response = await rawClient.request<ApiResponse<T>, AxiosResponse<ApiResponse<T>, D>>(
    config,
  )
  return unwrapPayload(response.data)
}

const client = {
  request<T = unknown, D = unknown>(config: AxiosRequestConfig<D>) {
    return requestData<T, D>(config)
  },

  get<T = unknown, D = unknown>(url: string, config?: AxiosRequestConfig<D>) {
    return requestData<T, D>({ ...(config ?? {}), method: 'get', url })
  },

  delete<T = unknown, D = unknown>(url: string, config?: AxiosRequestConfig<D>) {
    return requestData<T, D>({ ...(config ?? {}), method: 'delete', url })
  },

  post<T = unknown, D = unknown>(url: string, data?: D, config?: AxiosRequestConfig<D>) {
    return requestData<T, D>({ ...(config ?? {}), method: 'post', url, data })
  },

  put<T = unknown, D = unknown>(url: string, data?: D, config?: AxiosRequestConfig<D>) {
    return requestData<T, D>({ ...(config ?? {}), method: 'put', url, data })
  },

  patch<T = unknown, D = unknown>(url: string, data?: D, config?: AxiosRequestConfig<D>) {
    return requestData<T, D>({ ...(config ?? {}), method: 'patch', url, data })
  },
}

export default client
