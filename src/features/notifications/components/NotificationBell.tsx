import { Badge, Button, Popover } from 'antd'
import { BellOutlined } from '@ant-design/icons'
import NotificationBellContent from '@/features/notifications/components/NotificationBellContent'
import { useNotificationBellModel } from '@/features/notifications/hooks/useNotificationBellModel'

export default function NotificationBell() {
  const {
    isStudent,
    open,
    setOpen,
    unreadCount,
    notifications,
    isLoading,
    isFetching,
    isMarkAllPending,
    handleMarkAllAsRead,
    handleOpenNotification,
    handleDeleteNotification,
    handleViewAll,
  } = useNotificationBellModel()

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
        <NotificationBellContent
          unreadCount={unreadCount}
          notifications={notifications}
          isLoading={isLoading}
          isFetching={isFetching}
          isMarkAllPending={isMarkAllPending}
          onMarkAllAsRead={handleMarkAllAsRead}
          onOpenNotification={handleOpenNotification}
          onDeleteNotification={handleDeleteNotification}
          onViewAll={handleViewAll}
        />
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
