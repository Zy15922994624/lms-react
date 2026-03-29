// 通用类型
export interface PaginationParams {
  pageNum: number
  pageSize: number
}

export interface ApiResponse<T = unknown> {
  code: number
  message: string
  data: T
}

export interface PagedResult<T> {
  list: T[]
  total: number
}

export type LoadingState = 'idle' | 'loading' | 'success' | 'error'

export interface SelectOption {
  label: string
  value: string | number
}
