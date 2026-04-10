export type NotificationType = 'task_due_soon' | 'task_overdue' | 'task_graded'

export type NotificationRelatedType = 'task' | 'course' | 'submission'

export interface NotificationItem {
  id: string
  recipientId: string
  type: NotificationType
  title: string
  content: string
  relatedId: string | null
  relatedType: NotificationRelatedType | null
  isRead: boolean
  readAt: string | null
  createdAt: string
  updatedAt: string
}

export interface NotificationQuery {
  page?: number
  pageSize?: number
  type?: NotificationType
  isRead?: boolean
}

export interface NotificationsPage {
  items: NotificationItem[]
  total: number
}

export interface NotificationUnreadCount {
  unreadCount: number
}
