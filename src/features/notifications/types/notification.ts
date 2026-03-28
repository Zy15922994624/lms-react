// 通知类型枚举
export type NotificationType = 'task_due_soon' | 'task_overdue' | 'task_graded'

// 通知数据结构
export interface Notification {
  id: string
  recipientId: string
  type: NotificationType
  title: string
  content: string
  relatedId?: string
  relatedType?: string
  isRead: boolean
  readAt?: string
  createdAt: string
  updatedAt: string
}

// 通知列表查询参数
export interface NotificationQuery {
  type?: NotificationType
  isRead?: boolean
  page?: number
  limit?: number
}

// 通知列表响应
export interface NotificationListResponse {
  list: Notification[]
  total: number
  page: number
  limit: number
}

// 未读数量响应
export interface UnreadCountResponse {
  unreadCount: number
}
