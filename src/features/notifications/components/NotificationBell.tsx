import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Badge, Button, Empty, Popconfirm, Popover, Spin, Tag } from 'antd'
import { BellOutlined, DeleteOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/features/auth/store/auth.store'
import { useNotificationRealtime } from '@/features/notifications/hooks/useNotificationRealtime'
import { notificationService } from '@/features/notifications/services/notification.service'
import type { NotificationItem } from '@/features/notifications/types/notification'
import {
  getNotificationTypeColor,
  getNotificationTypeLabel,
  resolveNotificationTargetPath,
} from '@/features/notifications/utils/notification'
import { uiMessage } from '@/shared/components/feedback/message'
import { formatDateTime } from '@/shared/utils/date'

const previewPageSize = 8

export default function NotificationBell() {
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

  if (!isStudent) {
    return null
  }

  return (
    <Popover
      trigger="click"
      placement="bottomRight"
      open={open}
      onOpenChange={setOpen}
      content={
        <div
          className="w-[360px]"
          style={{ maxWidth: 'calc(100vw - 32px - env(safe-area-inset-left) - env(safe-area-inset-right))' }}
        >
          <div className="flex items-center justify-between border-b border-[var(--lms-color-border)] px-1 pb-3">
            <div>
              <div className="text-sm font-semibold text-stone-900">通知中心</div>
              <div className="mt-1 text-xs text-stone-500">优先展示与你当前任务相关的提醒</div>
            </div>
            <Button
              type="link"
              size="small"
              disabled={unreadCount === 0}
              loading={markAllAsReadMutation.isPending}
              onClick={() => markAllAsReadMutation.mutate()}
            >
              全部已读
            </Button>
          </div>

          <div className="max-h-[420px] overflow-y-auto py-3">
            {isLoading || isFetching ? (
              <div className="flex justify-center py-10">
                <Spin size="small" />
              </div>
            ) : notifications.length === 0 ? (
              <div className="py-6">
                <Empty description="暂无通知" image={Empty.PRESENTED_IMAGE_SIMPLE} />
              </div>
            ) : (
              <div className="space-y-2">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`rounded-2xl border px-4 py-3 transition ${
                      notification.isRead
                        ? 'border-[var(--lms-color-border)] bg-white'
                        : 'border-[rgba(255,107,53,0.18)] bg-[rgba(255,248,242,0.92)]'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <button
                        type="button"
                        className="min-w-0 flex-1 text-left"
                        onClick={() => void handleOpenNotification(notification)}
                      >
                        <div className="flex flex-wrap items-center gap-2">
                          <Tag color={getNotificationTypeColor(notification.type)}>
                            {getNotificationTypeLabel(notification.type)}
                          </Tag>
                          {!notification.isRead ? (
                            <span className="text-[11px] font-medium text-orange-600">未读</span>
                          ) : null}
                        </div>
                        <div className="mt-2 text-sm font-medium text-stone-900">
                          {notification.title}
                        </div>
                        <div className="mt-1 line-clamp-2 text-xs leading-5 text-stone-500">
                          {notification.content}
                        </div>
                        <div className="mt-2 text-[11px] text-stone-400">
                          {formatDateTime(notification.createdAt)}
                        </div>
                      </button>

                      <Popconfirm
                        title="确定删除这条通知吗？"
                        okText="删除"
                        cancelText="取消"
                        onConfirm={() => deleteMutation.mutate(notification.id)}
                      >
                        <Button
                          type="text"
                          shape="circle"
                          icon={<DeleteOutlined />}
                          className="text-stone-400 hover:text-stone-900"
                        />
                      </Popconfirm>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="border-t border-[var(--lms-color-border)] pt-3">
            <Button
              type="link"
              className="px-0"
              onClick={() => {
                setOpen(false)
                navigate('/notifications')
              }}
            >
              查看全部通知
            </Button>
          </div>
        </div>
      }
    >
      <Button
        type="text"
        shape="circle"
        className="flex h-11 w-11 items-center justify-center rounded-2xl border border-[var(--lms-color-border)] bg-white text-stone-700 shadow-[0_10px_24px_rgba(28,25,23,0.06)] transition hover:border-[rgba(255,107,53,0.18)] hover:text-stone-900"
      >
        <Badge count={unreadCount} size="small">
          <BellOutlined className="text-base" />
        </Badge>
      </Button>
    </Popover>
  )
}
