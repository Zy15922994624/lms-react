import { useMemo } from 'react'
import { Button, Empty, Table } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import {
  getStudentActionLabel,
  isStudentTaskPending,
} from '@/features/tasks/constants/task-ui'
import type { PendingGradingItem, TaskItem } from '@/features/tasks/types/task'
import { formatDateTime, getDueDateClass } from '@/shared/utils/date'

interface TasksAsidePanelProps {
  isTeacherView: boolean
  isMobile: boolean
  pendingGradingItems: PendingGradingItem[]
  focusTasks: TaskItem[]
  onOpenTaskDetail: (taskId: string) => void
}

export default function TasksAsidePanel({
  isTeacherView,
  isMobile,
  pendingGradingItems,
  focusTasks,
  onOpenTaskDetail,
}: TasksAsidePanelProps) {
  const pendingGradingColumns = useMemo<ColumnsType<PendingGradingItem>>(
    () => [
      {
        title: '任务',
        dataIndex: 'taskTitle',
        key: 'taskTitle',
        align: 'center',
        render: (value: string, record) => (
          <button
            type="button"
            className="text-left text-sm font-medium text-stone-900 transition hover:text-orange-600"
            onClick={() => onOpenTaskDetail(record.taskId)}
          >
            {value}
          </button>
        ),
      },
      {
        title: '学生',
        dataIndex: 'studentName',
        key: 'studentName',
        width: 120,
        align: 'center',
      },
      {
        title: '提交时间',
        dataIndex: 'submittedAt',
        key: 'submittedAt',
        align: 'center',
        width: 172,
        render: (value: string) => formatDateTime(value),
      },
    ],
    [onOpenTaskDetail],
  )

  const focusTaskColumns = useMemo<ColumnsType<TaskItem>>(
    () => [
      {
        title: '任务',
        dataIndex: 'title',
        key: 'title',
        align: 'center',
        render: (value: string, record) => (
          <button
            type="button"
            className="text-left text-sm font-medium text-stone-900 transition hover:text-orange-600"
            onClick={() => onOpenTaskDetail(record.id)}
          >
            {value}
          </button>
        ),
      },
      {
        title: '截止时间',
        dataIndex: 'dueDate',
        key: 'dueDate',
        width: 172,
        align: 'center',
        render: (value: string) => (
          <span className={getDueDateClass(value)}>{formatDateTime(value)}</span>
        ),
      },
      {
        title: '操作',
        key: 'actions',
        width: 120,
        align: 'center',
        render: (_value, record) => (
          <Button
            type={isStudentTaskPending(record) ? 'primary' : 'link'}
            onClick={() => onOpenTaskDetail(record.id)}
          >
            {getStudentActionLabel(record)}
          </Button>
        ),
      },
    ],
    [onOpenTaskDetail],
  )

  if (isTeacherView) {
    return (
      <section className="app-panel px-5 py-5 xl:px-6 xl:py-6 2xl:px-7 2xl:py-7">
        <div className="app-section-heading">
          <h2 className="app-section-title">待批改</h2>
        </div>
        {pendingGradingItems.length === 0 ? (
          <div className="mt-4">
            <Empty description="暂无待批改提交" image={Empty.PRESENTED_IMAGE_SIMPLE} />
          </div>
        ) : isMobile ? (
          <div className="mt-4 space-y-2">
            {pendingGradingItems.map((item) => (
              <article
                key={item.submissionId}
                className="rounded-[14px] border border-[var(--lms-color-border)] bg-white/95 px-4 py-3"
              >
                <button
                  type="button"
                  className="text-left text-sm font-medium text-stone-900"
                  onClick={() => onOpenTaskDetail(item.taskId)}
                >
                  {item.taskTitle}
                </button>
                <div className="mt-1 text-xs text-stone-500">{item.studentName}</div>
                <div className="mt-1 text-xs text-stone-400">{formatDateTime(item.submittedAt)}</div>
              </article>
            ))}
          </div>
        ) : (
          <Table<PendingGradingItem>
            className="mt-4"
            size="small"
            rowKey="submissionId"
            dataSource={pendingGradingItems}
            columns={pendingGradingColumns}
            pagination={false}
            scroll={{ x: 360 }}
          />
        )}
      </section>
    )
  }

  return (
    <section className="app-panel px-5 py-5 xl:px-6 xl:py-6 2xl:px-7 2xl:py-7">
      <div className="app-section-heading">
        <h2 className="app-section-title">优先处理</h2>
      </div>
      {focusTasks.length === 0 ? (
        <div className="mt-4">
          <Empty description="暂无任务" image={Empty.PRESENTED_IMAGE_SIMPLE} />
        </div>
      ) : isMobile ? (
        <div className="mt-4 space-y-2">
          {focusTasks.map((item) => (
            <article
              key={item.id}
              className="rounded-[14px] border border-[var(--lms-color-border)] bg-white/95 px-4 py-3"
            >
              <button
                type="button"
                className="text-left text-sm font-medium text-stone-900"
                onClick={() => onOpenTaskDetail(item.id)}
              >
                {item.title}
              </button>
              <div className="mt-1 text-xs text-stone-400">{formatDateTime(item.dueDate)}</div>
              <div className="mt-2">
                <Button
                  size="small"
                  type={isStudentTaskPending(item) ? 'primary' : 'default'}
                  onClick={() => onOpenTaskDetail(item.id)}
                >
                  {getStudentActionLabel(item)}
                </Button>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <Table<TaskItem>
          className="mt-4"
          size="small"
          rowKey="id"
          dataSource={focusTasks}
          columns={focusTaskColumns}
          pagination={false}
          scroll={{ x: 360 }}
        />
      )}
    </section>
  )
}
