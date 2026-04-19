import { useCallback, useMemo } from 'react'
import { Button, Dropdown, Empty, Pagination, Table, Tag } from 'antd'
import type { MenuProps } from 'antd'
import type { TablePaginationConfig } from 'antd/es/table'
import type { ColumnsType } from 'antd/es/table'
import { MoreOutlined } from '@ant-design/icons'
import {
  getStudentActionLabel,
  getStudentTaskStatus,
  isStudentTaskPending,
  taskTypeColorMap,
  taskTypeLabelMap,
} from '@/features/tasks/constants/task-ui'
import type { TaskItem } from '@/features/tasks/types/task'
import { useSelectionSafeAction } from '@/shared/hooks/useSelectionSafeAction'
import { formatDateTime, getDueDateClass } from '@/shared/utils/date'

interface TasksContentPanelProps {
  isMobile: boolean
  isTeacherView: boolean
  isFetching: boolean
  tableLoading: boolean
  tasks: TaskItem[]
  total: number
  page: number
  pageSize: number
  actionItems: (task: TaskItem) => MenuProps['items']
  onOpenTaskDetail: (taskId: string) => void
  onTaskTableChange: (pagination: TablePaginationConfig) => void
  onMobilePageChange: (page: number, pageSize: number) => void
}

export default function TasksContentPanel({
  isMobile,
  isTeacherView,
  isFetching,
  tableLoading,
  tasks,
  total,
  page,
  pageSize,
  actionItems,
  onOpenTaskDetail,
  onTaskTableChange,
  onMobilePageChange,
}: TasksContentPanelProps) {
  const runSelectionSafe = useSelectionSafeAction()

  const handleOpenTaskDetail = useCallback(
    (taskId: string) => {
      runSelectionSafe(() => onOpenTaskDetail(taskId))
    },
    [onOpenTaskDetail, runSelectionSafe],
  )

  const taskColumns = useMemo<ColumnsType<TaskItem>>(
    () => [
      {
        title: '任务',
        dataIndex: 'title',
        key: 'title',
        width: 360,
        align: 'center',
        render: (value: string, record) => (
          <div className="min-w-0">
            <div className="mb-1 flex flex-wrap items-center gap-2">
              <Tag color={taskTypeColorMap[record.type]}>{taskTypeLabelMap[record.type]}</Tag>
              {isTeacherView && !record.isPublished ? <Tag>未发布</Tag> : null}
              {!isTeacherView && record.currentUserSubmissionStatus === 'graded' ? (
                <Tag color="green">已评分</Tag>
              ) : null}
            </div>
            <button
              type="button"
              className="line-clamp-1 text-left text-sm font-medium text-stone-900 transition hover:text-orange-600"
              onClick={() => handleOpenTaskDetail(record.id)}
            >
              {value}
            </button>
          </div>
        ),
      },
      {
        title: '所属课程',
        dataIndex: ['course', 'title'],
        key: 'course',
        width: 180,
        align: 'center',
        render: (_value, record) => record.course?.title || '-',
      },
      {
        title: '截止时间',
        dataIndex: 'dueDate',
        key: 'dueDate',
        width: 180,
        align: 'center',
        render: (value: string) => <span className={getDueDateClass(value)}>{formatDateTime(value)}</span>,
      },
      {
        title: isTeacherView ? '提交情况' : '状态',
        key: 'status',
        width: 150,
        align: 'center',
        render: (_value, record) =>
          isTeacherView
            ? `${record.submittedCount}/${record.assignedStudentCount}`
            : getStudentTaskStatus(record),
      },
      ...(isTeacherView
        ? [
            {
              title: '操作',
              key: 'actions',
              fixed: 'right' as const,
              width: 72,
              render: (_value: unknown, record: TaskItem) => (
                <div onClick={(event) => event.stopPropagation()}>
                  <Dropdown menu={{ items: actionItems(record) }} trigger={['click']}>
                    <Button
                      icon={<MoreOutlined />}
                      type="text"
                      shape="circle"
                      className="text-stone-500 transition hover:text-stone-900"
                    />
                  </Dropdown>
                </div>
              ),
            },
          ]
        : [
            {
              title: '操作',
              key: 'actions',
              width: 120,
              align: 'center' as const,
              render: (_value: unknown, record: TaskItem) => (
                <Button
                  type={isStudentTaskPending(record) ? 'primary' : 'link'}
                  onClick={() => handleOpenTaskDetail(record.id)}
                >
                  {getStudentActionLabel(record)}
                </Button>
              ),
            },
          ]),
    ],
    [actionItems, handleOpenTaskDetail, isTeacherView],
  )

  return (
    <section className="px-5 py-5 sm:px-6 xl:px-7 2xl:px-8">
      {isFetching ? <div className="mb-4 text-right text-sm text-stone-400">正在刷新…</div> : null}

      {isMobile ? (
        tasks.length ? (
          <div className="space-y-3">
            {tasks.map((task) => (
              <article
                key={task.id}
                className="rounded-[16px] border border-[var(--lms-color-border)] bg-white/95 px-4 py-3"
              >
                <div className="mb-2 flex flex-wrap items-center gap-2">
                  <Tag color={taskTypeColorMap[task.type]}>{taskTypeLabelMap[task.type]}</Tag>
                  {isTeacherView && !task.isPublished ? <Tag>未发布</Tag> : null}
                  {!isTeacherView && task.currentUserSubmissionStatus === 'graded' ? (
                    <Tag color="green">已评分</Tag>
                  ) : null}
                </div>
                <button
                  type="button"
                  className="text-left text-sm font-medium leading-6 text-stone-900"
                  onClick={() => handleOpenTaskDetail(task.id)}
                >
                  {task.title}
                </button>
                <div className="mt-1 text-xs text-stone-500">{task.course?.title || '-'}</div>
                <div className="mt-2 text-xs">
                  <span className={getDueDateClass(task.dueDate)}>{formatDateTime(task.dueDate)}</span>
                </div>
                <div className="mt-2 text-xs text-stone-500">
                  {isTeacherView
                    ? `${task.submittedCount}/${task.assignedStudentCount}`
                    : getStudentTaskStatus(task)}
                </div>
                <div className="mt-3 flex items-center gap-2">
                  {isTeacherView ? (
                    <Button size="small" onClick={() => handleOpenTaskDetail(task.id)}>
                      查看详情
                    </Button>
                  ) : (
                    <Button
                      size="small"
                      type={isStudentTaskPending(task) ? 'primary' : 'default'}
                      onClick={() => handleOpenTaskDetail(task.id)}
                    >
                      {getStudentActionLabel(task)}
                    </Button>
                  )}
                </div>
              </article>
            ))}
          </div>
        ) : (
          <Empty description="暂无任务" image={Empty.PRESENTED_IMAGE_SIMPLE} />
        )
      ) : (
        <Table<TaskItem>
          size="middle"
          rowKey="id"
          dataSource={tasks}
          columns={taskColumns}
          loading={tableLoading}
          locale={{ emptyText: '暂无任务' }}
          scroll={{ x: 980 }}
          pagination={{
            current: page,
            pageSize,
            total,
            showSizeChanger: true,
          }}
          onChange={onTaskTableChange}
        />
      )}
      {isMobile && total > 0 ? (
        <div className="mt-5 flex justify-center">
          <Pagination
            current={page}
            pageSize={pageSize}
            total={total}
            size="small"
            showSizeChanger={false}
            onChange={onMobilePageChange}
          />
        </div>
      ) : null}
    </section>
  )
}
