import client from '@/shared/api/client'
import type {
  NotificationQuery,
  NotificationsPage,
  NotificationUnreadCount,
} from '@/features/notifications/types/notification'

export const notificationService = {
  async getNotifications(query: NotificationQuery = {}) {
    return (await client.get<NotificationsPage>('/notifications', {
      params: query,
    })) as unknown as NotificationsPage
  },

  async getUnreadCount() {
    return (await client.get<NotificationUnreadCount>(
      '/notifications/unread-count',
    )) as unknown as NotificationUnreadCount
  },

  async markAsRead(notificationId: string) {
    return (await client.patch(`/notifications/${notificationId}/read`)) as unknown as null
  },

  async markAllAsRead() {
    return (await client.patch('/notifications/read-all')) as unknown as number | null
  },

  async deleteNotification(notificationId: string) {
    return (await client.delete(`/notifications/${notificationId}`)) as unknown as null
  },
}
