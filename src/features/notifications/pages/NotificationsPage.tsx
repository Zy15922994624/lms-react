import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Button, Empty, Popconfirm, Select, Table, Tag } from 'antd'
import type { ColumnsType, TablePaginationConfig } from 'antd/es/table'
import { DeleteOutlined, ReloadOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import { notificationService } from '@/features/notifications/services/notification.service'
import type {
  NotificationItem,
  NotificationType,
} from '@/features/notifications/types/notification'
import {
  getNotificationTypeColor,
  getNotificationTypeLabel,
  resolveNotificationTargetPath,
} from '@/features/notifications/utils/notification'
import { uiMessage } from '@/shared/components/feedback/message'
import PageLoading from '@/shared/components/feedback/PageLoading'
import WorkspaceLayout from '@/shared/layout/WorkspaceLayout'
import { formatDateTime } from '@/shared/utils/date'

type ReadFilter = 'all' | 'unread' | 'read'

export default function NotificationsPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [typeFilter, setTypeFilter] = useState<NotificationType | undefined>()
  const [readFilter, setReadFilter] = useState<ReadFilter>('all')

  const { data: unreadData } = useQuery({
    queryKey: ['notifications', 'unread-count'],
    queryFn: () => notificationService.getUnreadCount(),
    refetchInterval: 60_000,
  })

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ['notifications', page, pageSize, typeFilter, readFilter],
    queryFn: () =>
      notificationService.getNotifications({
        page,
        pageSize,
        type: typeFilter,
        isRead: readFilter === 'all' ? undefined : readFilter === 'read',
      }),
    refetchInterval: 60_000,
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

  const notifications = useMemo(() => data?.items ?? [], [data])
  const unreadCount = unreadData?.unreadCount ?? 0

  const handleOpenNotification = async (notification: NotificationItem) => {
    if (!notification.isRead) {
      await markAsReadMutation.mutateAsync(notification.id)
    }

    const targetPath = resolveNotificationTargetPath(notification)
    if (targetPath) {
      navigate(targetPath)
    }
  }

  const columns = useMemo<ColumnsType<NotificationItem>>(
    () => [
      {
        title: '通知',
        dataIndex: 'title',
        key: 'title',
        render: (value: string, record) => (
          <div className="min-w-0">
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <Tag color={getNotificationTypeColor(record.type)}>
                {getNotificationTypeLabel(record.type)}
              </Tag>
              {record.isRead ? <Tag>已读</Tag> : <Tag color="orange">未读</Tag>}
            </div>
            <button
              type="button"
              className="line-clamp-1 text-left text-sm font-medium text-stone-900 transition hover:text-orange-600"
              onClick={() => void handleOpenNotification(record)}
            >
              {value}
            </button>
            <div className="mt-1 line-clamp-2 text-sm leading-6 text-stone-500">
              {record.content}
            </div>
          </div>
        ),
      },
      {
        title: '时间',
        dataIndex: 'createdAt',
        key: 'createdAt',
        width: 188,
        render: (value: string) => formatDateTime(value),
      },
      {
        title: '操作',
        key: 'actions',
        width: 148,
        render: (_value, record) => (
          <div className="flex items-center gap-2">
            {!record.isRead ? (
              <Button
                type="link"
                className="px-0"
                loading={markAsReadMutation.isPending}
                onClick={() => markAsReadMutation.mutate(record.id)}
              >
                标记已读
              </Button>
            ) : null}
            <Popconfirm
              title="确定删除这条通知吗？"
              okText="删除"
              cancelText="取消"
              onConfirm={() => deleteMutation.mutate(record.id)}
            >
              <Button
                type="text"
                shape="circle"
                icon={<DeleteOutlined />}
                className="text-stone-400 hover:text-stone-900"
              />
            </Popconfirm>
          </div>
        ),
      },
    ],
    [deleteMutation, markAsReadMutation, navigate],
  )

  if (isLoading && !data) {
    return <PageLoading />
  }

  const handleTableChange = (pagination: TablePaginationConfig) => {
    setPage(pagination.current ?? 1)
    setPageSize(pagination.pageSize ?? 10)
  }

  return (
    <div className="space-y-6 lg:space-y-8">
      <WorkspaceLayout
        preset="dashboard"
        mainClassName="app-panel overflow-hidden"
        aside={
          <section className="app-panel px-5 py-5 xl:px-6 xl:py-6 2xl:px-7 2xl:py-7">
            <div className="app-section-heading">
              <h2 className="app-section-title">当前状态</h2>
            </div>
            <div className="mt-4 space-y-4">
              <div className="rounded-[22px] border border-[rgba(255,107,53,0.14)] bg-[rgba(255,249,244,0.92)] px-4 py-4">
                <div className="text-xs font-medium uppercase tracking-[0.16em] text-stone-400">
                  未读通知
                </div>
                <div className="mt-2 text-3xl font-semibold tracking-[-0.03em] text-stone-900">
                  {unreadCount}
                </div>
                <div className="mt-2 text-sm text-stone-500">
                  优先关注已过期和即将截止的任务提醒
                </div>
              </div>

              <Button
                block
                type="primary"
                disabled={unreadCount === 0}
                loading={markAllAsReadMutation.isPending}
                onClick={() => markAllAsReadMutation.mutate()}
              >
                全部标记为已读
              </Button>

              <Button
                block
                icon={<ReloadOutlined />}
                onClick={() => queryClient.invalidateQueries({ queryKey: ['notifications'] })}
              >
                刷新通知
              </Button>
            </div>
          </section>
        }
      >
        <div className="flex flex-col gap-4 border-b border-[var(--lms-color-border)] px-6 py-5 sm:px-8 xl:flex-row xl:items-center xl:justify-between xl:px-9 xl:py-6 2xl:px-10">
          <div className="min-w-0">
            <h1 className="text-2xl font-semibold tracking-[-0.03em] text-stone-900">通知中心</h1>
            <div className="mt-1 text-sm text-stone-500">
              共 {data?.total ?? 0} 条，当前未读 {unreadCount} 条
            </div>
          </div>

          <div className="flex flex-col gap-3 xl:w-auto xl:flex-row xl:items-center">
            <Select
              allowClear
              placeholder="全部类型"
              value={typeFilter}
              className="xl:w-[180px]"
              onChange={(value) => {
                setPage(1)
                setTypeFilter(value)
              }}
              options={[
                { label: '即将截止', value: 'task_due_soon' },
                { label: '已过期', value: 'task_overdue' },
                { label: '已评分', value: 'task_graded' },
              ]}
            />

            <Select<ReadFilter>
              value={readFilter}
              className="xl:w-[160px]"
              onChange={(value) => {
                setPage(1)
                setReadFilter(value)
              }}
              options={[
                { label: '全部状态', value: 'all' },
                { label: '仅未读', value: 'unread' },
                { label: '仅已读', value: 'read' },
              ]}
            />
          </div>
        </div>

        <div className="px-6 py-5 sm:px-8 xl:px-9 xl:py-6 2xl:px-10">
          <Table<NotificationItem>
            rowKey="id"
            loading={isFetching}
            dataSource={notifications}
            columns={columns}
            locale={{
              emptyText: <Empty description="暂无通知" image={Empty.PRESENTED_IMAGE_SIMPLE} />,
            }}
            pagination={{
              current: page,
              pageSize,
              total: data?.total ?? 0,
              showSizeChanger: true,
            }}
            onChange={handleTableChange}
            scroll={{ x: 720 }}
          />
        </div>
      </WorkspaceLayout>
    </div>
  )
}
