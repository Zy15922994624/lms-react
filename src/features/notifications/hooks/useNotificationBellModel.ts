import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/features/auth/store/auth.store'
import { useNotificationRealtime } from '@/features/notifications/hooks/useNotificationRealtime'
import { notificationService } from '@/features/notifications/services/notification.service'
import type { NotificationItem } from '@/features/notifications/types/notification'
import { resolveNotificationTargetPath } from '@/features/notifications/utils/notification'
import { uiMessage } from '@/shared/components/feedback/message'

const previewPageSize = 8

export function useNotificationBellModel() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [open, setOpen] = useState(false)
  const currentUser = useAuthStore((state) => state.currentUser)
  const isStudent = currentUser?.role === 'student'

  useNotificationRealtime(isStudent)

  const { data: unreadData } = useQuery({
    queryKey: ['notifications', 'unread-count'],
    queryFn: () => notificationService.getUnreadCount(),
    enabled: isStudent,
    refetchInterval: 60_000,
  })

  const {
    data: previewPage,
    isLoading,
    isFetching,
  } = useQuery({
    queryKey: ['notifications', 'preview', previewPageSize],
    queryFn: () =>
      notificationService.getNotifications({
        page: 1,
        pageSize: previewPageSize,
      }),
    enabled: isStudent && open,
    refetchInterval: open ? 60_000 : false,
  })

  const markAsReadMutation = useMutation({
    mutationFn: (notificationId: string) => notificationService.markAsRead(notificationId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['notifications'] })
    },
  })

  const markAllAsReadMutation = useMutation({
    mutationFn: () => notificationService.markAllAsRead(),
    onSuccess: async () => {
      uiMessage.success('已将全部通知标记为已读')
      await queryClient.invalidateQueries({ queryKey: ['notifications'] })
    },
    onError: () => {
      uiMessage.error('全部已读操作失败')
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (notificationId: string) => notificationService.deleteNotification(notificationId),
    onSuccess: async () => {
      uiMessage.success('通知已删除')
      await queryClient.invalidateQueries({ queryKey: ['notifications'] })
    },
    onError: () => {
      uiMessage.error('删除通知失败')
    },
  })

  const unreadCount = unreadData?.unreadCount ?? 0
  const notifications = useMemo(() => previewPage?.items ?? [], [previewPage])

  const handleOpenNotification = async (notification: NotificationItem) => {
    if (!notification.isRead) {
      await markAsReadMutation.mutateAsync(notification.id)
    }

    const targetPath = resolveNotificationTargetPath(notification)
    setOpen(false)

    if (targetPath) {
      navigate(targetPath)
      return
    }

    navigate('/notifications')
  }

  const handleViewAll = () => {
    setOpen(false)
    navigate('/notifications')
  }

  return {
    isStudent,
    open,
    setOpen,
    unreadCount,
    notifications,
    isLoading,
    isFetching,
    isMarkAllPending: markAllAsReadMutation.isPending,
    handleMarkAllAsRead: () => markAllAsReadMutation.mutate(),
    handleOpenNotification,
    handleDeleteNotification: (notificationId: string) => deleteMutation.mutate(notificationId),
    handleViewAll,
  }
}
