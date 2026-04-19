import type { NotificationType } from '@/features/notifications/types/notification'

export type NotificationReadFilter = 'all' | 'unread' | 'read'

export const notificationPreviewPageSize = 8

export const notificationQueryKeys = {
  all: ['notifications'] as const,
  unreadCount: () => [...notificationQueryKeys.all, 'unread-count'] as const,
  preview: (pageSize = notificationPreviewPageSize) =>
    [...notificationQueryKeys.all, 'preview', pageSize] as const,
  list: (params: {
    page: number
    pageSize: number
    type?: NotificationType
    readFilter: NotificationReadFilter
  }) =>
    [
      ...notificationQueryKeys.all,
      'list',
      params.page,
      params.pageSize,
      params.type ?? 'all',
      params.readFilter,
    ] as const,
}
