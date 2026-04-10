import { ROUTES } from '@/shared/constants/routes'
import type {
  NotificationItem,
  NotificationType,
} from '@/features/notifications/types/notification'

const notificationTypeLabelMap: Record<NotificationType, string> = {
  task_due_soon: '即将截止',
  task_overdue: '已过期',
  task_graded: '已评分',
}

const notificationTypeColorMap: Record<NotificationType, string> = {
  task_due_soon: 'orange',
  task_overdue: 'red',
  task_graded: 'green',
}

export function getNotificationTypeLabel(type: NotificationType) {
  return notificationTypeLabelMap[type]
}

export function getNotificationTypeColor(type: NotificationType) {
  return notificationTypeColorMap[type]
}

export function resolveNotificationTargetPath(notification: NotificationItem) {
  if (notification.relatedType === 'task' && notification.relatedId) {
    return ROUTES.TASK_DETAIL(notification.relatedId)
  }

  return null
}
