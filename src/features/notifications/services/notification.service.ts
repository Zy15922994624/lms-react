import client from '@/shared/api/client'
import type {
  NotificationQuery,
  NotificationsPage,
  NotificationUnreadCount,
} from '@/features/notifications/types/notification'

export const notificationService = {
  async getNotifications(query: NotificationQuery = {}) {
    return client.get<NotificationsPage>('/notifications', {
      params: query,
    })
  },

  async getUnreadCount() {
    return client.get<NotificationUnreadCount>(
      '/notifications/unread-count',
    )
  },

  async markAsRead(notificationId: string) {
    return client.patch<null>(`/notifications/${notificationId}/read`)
  },

  async markAllAsRead() {
    return client.patch<number | null>('/notifications/read-all')
  },

  async deleteNotification(notificationId: string) {
    return client.delete<null>(`/notifications/${notificationId}`)
  },
}
