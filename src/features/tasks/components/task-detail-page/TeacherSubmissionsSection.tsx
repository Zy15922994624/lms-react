import { useMemo } from 'react'
import { Button, Empty, Pagination, Table, Tag } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import type { TaskSubmission, TaskSubmissionsPage } from '@/features/tasks/types/task'
import { formatDateTime } from '@/shared/utils/date'

interface TeacherSubmissionsSectionProps {
  isMobile: boolean
  submissionsPage?: TaskSubmissionsPage
  submissionPage: number
  submissionPageSize: number
  onOpenGrading: (submission: TaskSubmission) => void
  onPageChange: (nextPage: number, nextPageSize: number) => void
}

export default function TeacherSubmissionsSection({
  isMobile,
  submissionsPage,
  submissionPage,
  submissionPageSize,
  onOpenGrading,
  onPageChange,
}: TeacherSubmissionsSectionProps) {
  const columns = useMemo<ColumnsType<TaskSubmission>>(
    () => [
      {
        title: '学生',
        dataIndex: 'user',
        key: 'user',
        width: 140,
        render: (_value, record) => record.user?.fullName || record.user?.username || '未命名学生',
      },
      {
        title: '提交时间',
        dataIndex: 'submittedAt',
        key: 'submittedAt',
        width: 180,
        render: (value: string) => formatDateTime(value),
      },
      {
        title: '状态',
        dataIndex: 'status',
        key: 'status',
        width: 100,
        render: (value: TaskSubmission['status']) => (
          <Tag color={value === 'graded' ? 'green' : 'orange'}>
            {value === 'graded' ? '已评分' : '待评分'}
          </Tag>
        ),
      },
      {
        title: '得分',
        dataIndex: 'score',
        key: 'score',
        width: 110,
        render: (_value, record) =>
          record.score !== undefined ? `${record.score}/${record.maxScore}` : '-',
      },
      {
        title: '操作',
        key: 'actions',
        width: 120,
        render: (_value, record) => (
          <Button type="link" onClick={() => onOpenGrading(record)}>
            {record.status === 'graded' ? '查看评分' : '去评分'}
          </Button>
        ),
      },
    ],
    [onOpenGrading],
  )

  return (
    <section className="app-panel px-4 py-4 sm:px-6 xl:px-7">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-stone-950">提交记录</h2>
        <span className="text-sm text-stone-400">{submissionsPage?.total ?? 0} 条</span>
      </div>

      {submissionsPage && submissionsPage.items.length > 0 ? (
        <>
          {isMobile ? (
            <div className="space-y-3">
              {submissionsPage.items.map((record) => (
                <article
                  key={record.id}
                  className="rounded-[14px] border border-[var(--lms-color-border)] bg-white/95 px-4 py-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="text-sm font-medium text-stone-900">
                        {record.user?.fullName || record.user?.username || '未命名学生'}
                      </div>
                      <div className="mt-1 text-xs text-stone-500">{formatDateTime(record.submittedAt)}</div>
                    </div>
                    <Tag color={record.status === 'graded' ? 'green' : 'orange'}>
                      {record.status === 'graded' ? '已评分' : '待评分'}
                    </Tag>
                  </div>
                  <div className="mt-2 text-sm text-stone-600">
                    得分：
                    <span className="font-medium text-stone-900">
                      {record.score !== undefined ? `${record.score}/${record.maxScore}` : '-'}
                    </span>
                  </div>
                  <div className="mt-2">
                    <Button type="link" className="px-0" onClick={() => onOpenGrading(record)}>
                      {record.status === 'graded' ? '查看评分' : '去评分'}
                    </Button>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <Table<TaskSubmission>
              rowKey="id"
              dataSource={submissionsPage.items}
              columns={columns}
              pagination={false}
              scroll={{ x: 760 }}
            />
          )}
          <div className={['mt-5 flex', isMobile ? 'justify-center' : 'justify-end'].join(' ')}>
            <Pagination
              current={submissionPage}
              pageSize={submissionPageSize}
              total={submissionsPage.total}
              size={isMobile ? 'small' : undefined}
              showSizeChanger={!isMobile}
              onChange={onPageChange}
            />
          </div>
        </>
      ) : (
        <Empty description="当前还没有学生提交" />
      )}
    </section>
  )
}
