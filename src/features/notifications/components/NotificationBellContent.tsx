import { Button, Empty, Popconfirm, Spin, Tag } from 'antd'
import { DeleteOutlined } from '@ant-design/icons'
import type { NotificationItem } from '@/features/notifications/types/notification'
import {
  getNotificationTypeColor,
  getNotificationTypeLabel,
} from '@/features/notifications/utils/notification'
import { formatDateTime } from '@/shared/utils/date'

interface NotificationBellContentProps {
  unreadCount: number
  notifications: NotificationItem[]
  isLoading: boolean
  isFetching: boolean
  isMarkAllPending: boolean
  onMarkAllAsRead: () => void
  onOpenNotification: (notification: NotificationItem) => Promise<void>
  onDeleteNotification: (notificationId: string) => void
  onViewAll: () => void
}

export default function NotificationBellContent({
  unreadCount,
  notifications,
  isLoading,
  isFetching,
  isMarkAllPending,
  onMarkAllAsRead,
  onOpenNotification,
  onDeleteNotification,
  onViewAll,
}: NotificationBellContentProps) {
  return (
    <div
      className="w-[360px]"
      style={{ maxWidth: 'calc(100vw - 32px - env(safe-area-inset-left) - env(safe-area-inset-right))' }}
    >
      <div className="flex items-center justify-between border-b border-[var(--lms-color-border)] px-1 pb-3">
        <div>
          <div className="text-sm font-semibold text-stone-900">通知中心</div>
          <div className="mt-1 text-xs text-stone-500">优先显示与你当前任务相关的提醒</div>
        </div>
        <Button
          type="link"
          size="small"
          disabled={unreadCount === 0}
          loading={isMarkAllPending}
          onClick={onMarkAllAsRead}
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
                    onClick={() => void onOpenNotification(notification)}
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <Tag color={getNotificationTypeColor(notification.type)}>
                        {getNotificationTypeLabel(notification.type)}
                      </Tag>
                      {!notification.isRead ? (
                        <span className="text-[11px] font-medium text-orange-600">未读</span>
                      ) : null}
                    </div>
                    <div className="mt-2 text-sm font-medium text-stone-900">{notification.title}</div>
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
                    onConfirm={() => onDeleteNotification(notification.id)}
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
        <Button type="link" className="px-0" onClick={onViewAll}>
          查看全部通知
        </Button>
      </div>
    </div>
  )
}
