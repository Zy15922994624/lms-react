import { useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { io } from 'socket.io-client'
import { useAuthStore } from '@/features/auth/store/auth.store'
import type {
  NotificationItem,
  NotificationsPage,
  NotificationUnreadCount,
} from '@/features/notifications/types/notification'

function resolveSocketBaseUrl() {
  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || '/api'

  if (apiBaseUrl.startsWith('/')) {
    return window.location.origin
  }

  return apiBaseUrl.endsWith('/api') ? apiBaseUrl.slice(0, -4) : apiBaseUrl
}

export function useNotificationRealtime(enabled: boolean) {
  const queryClient = useQueryClient()
  const token = useAuthStore((state) => state.token)

  useEffect(() => {
    if (!enabled || !token) {
      return
    }

    const socket = io(resolveSocketBaseUrl(), {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      timeout: 5000,
    })

    socket.on('notification', (notification: NotificationItem) => {
      queryClient.setQueryData<NotificationUnreadCount | undefined>(
        ['notifications', 'unread-count'],
        (current) => ({
          unreadCount: (current?.unreadCount ?? 0) + 1,
        }),
      )

      queryClient.setQueryData<NotificationsPage | undefined>(
        ['notifications', 'preview', 8],
        (current) => {
          if (!current || current.items.some((item) => item.id === notification.id)) {
            return current
          }

          return {
            ...current,
            items: [notification, ...current.items].slice(0, 8),
            total: current.total + 1,
          }
        },
      )

      queryClient.invalidateQueries({ queryKey: ['notifications'] })
    })

    return () => {
      socket.disconnect()
    }
  }, [enabled, queryClient, token])
}
