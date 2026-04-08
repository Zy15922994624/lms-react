import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Button, Descriptions, Empty, Pagination, Popconfirm, Table, Tag } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import { useAuthStore } from '@/features/auth/store/auth.store'
import TaskQuestionList from '@/features/tasks/components/TaskQuestionList'
import TaskGradingModal from '@/features/tasks/components/TaskGradingModal'
import TaskSubmissionPanel from '@/features/tasks/components/TaskSubmissionPanel'
import { taskService } from '@/features/tasks/services/task.service'
import type { GradeTaskSubmissionPayload, TaskDetail, TaskSubmission } from '@/features/tasks/types/task'
import PageLoading from '@/shared/components/feedback/PageLoading'
import { uiMessage } from '@/shared/components/feedback/message'
import WorkspaceLayout from '@/shared/layout/WorkspaceLayout'
import { formatDateTime, getDueDateClass } from '@/shared/utils/date'

function supportsQuestionPreview(taskType: TaskDetail['type']) {
  return taskType === 'homework' || taskType === 'quiz'
}

export default function TaskDetailPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { id = '' } = useParams()
  const currentUser = useAuthStore((state) => state.currentUser)
  const isTeacherView = currentUser?.role === 'teacher' || currentUser?.role === 'admin'

  const [submissionPage, setSubmissionPage] = useState(1)
  const [submissionPageSize, setSubmissionPageSize] = useState(10)
  const [gradingTarget, setGradingTarget] = useState<TaskSubmission | null>(null)

  const { data: task, isLoading: isTaskLoading } = useQuery({
    queryKey: ['task', id],
    queryFn: () => taskService.getTaskById(id),
    enabled: Boolean(id),
  })

  const shouldLoadQuestions = Boolean(task && supportsQuestionPreview(task.type))

  const { data: taskQuestions = [], isLoading: isQuestionsLoading } = useQuery({
    queryKey: ['task-questions', id],
    queryFn: () => taskService.getTaskQuestions(id),
    enabled: shouldLoadQuestions,
  })

  const { data: submission, isLoading: isSubmissionLoading } = useQuery({
    queryKey: ['task-submission', id],
    queryFn: () => taskService.getCurrentSubmission(id),
    enabled: Boolean(id) && !isTeacherView,
  })

  const { data: submissionsPage, isLoading: isSubmissionsLoading } = useQuery({
    queryKey: ['task-submissions', id, submissionPage, submissionPageSize],
    queryFn: () => taskService.getTaskSubmissions(id, submissionPage, submissionPageSize),
    enabled: Boolean(id) && isTeacherView,
  })

  const gradeMutation = useMutation({
    mutationFn: (payload: GradeTaskSubmissionPayload) => taskService.gradeSubmission(id, payload),
    onSuccess: async () => {
      uiMessage.success('评分已保存')
      setGradingTarget(null)
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['task', id] }),
        queryClient.invalidateQueries({ queryKey: ['task-submissions', id] }),
        queryClient.invalidateQueries({ queryKey: ['tasks'] }),
      ])
    },
    onError: () => {
      uiMessage.error('评分失败')
    },
  })

  const deleteMutation = useMutation({
    mutationFn: () => taskService.deleteTask(id),
    onSuccess: async () => {
      uiMessage.success('任务已删除')
      await queryClient.invalidateQueries({ queryKey: ['tasks'] })
      navigate('/tasks', { replace: true })
    },
    onError: () => {
      uiMessage.error('删除任务失败')
    },
  })

  const teacherSubmissionColumns = useMemo<ColumnsType<TaskSubmission>>(
    () => [
      {
        title: '学生',
        dataIndex: 'user',
        key: 'user',
        render: (_value, record) => record.user?.fullName || record.user?.username || '未命名学生',
      },
      {
        title: '提交时间',
        dataIndex: 'submittedAt',
        key: 'submittedAt',
        render: (value: string) => formatDateTime(value),
      },
      {
        title: '状态',
        dataIndex: 'status',
        key: 'status',
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
        render: (_value, record) => (record.score !== undefined ? `${record.score}/${record.maxScore}` : '-'),
      },
      {
        title: '操作',
        key: 'actions',
        render: (_value, record) => (
          <Button type="link" onClick={() => setGradingTarget(record)}>
            {record.status === 'graded' ? '查看评分' : '去评分'}
          </Button>
        ),
      },
    ],
    [],
  )

  if (
    (isTaskLoading || (!isTeacherView && isSubmissionLoading) || (isTeacherView && isSubmissionsLoading)) &&
    !task
  ) {
    return <PageLoading />
  }

  if (!task) {
    return <Navigate to="/tasks" replace />
  }

  return (
    <div className="space-y-6 lg:space-y-8">
      <WorkspaceLayout
        preset="course"
        aside={
          <section className="app-panel px-5 py-5">
            <div className="app-section-heading">
              <h2 className="app-section-title">任务信息</h2>
            </div>
            <Descriptions column={1} size="small" labelStyle={{ color: '#78716c' }}>
              <Descriptions.Item label="所属课程">{task.course?.title || '-'}</Descriptions.Item>
              <Descriptions.Item label="任务类型">
                <Tag color={task.type === 'reading' ? 'purple' : task.type === 'project' ? 'blue' : 'green'}>
                  {task.type === 'homework'
                    ? '作业任务'
                    : task.type === 'quiz'
                      ? '测验任务'
                      : task.type === 'project'
                        ? '项目任务'
                        : '阅读任务'}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="截止日期">
                <span className={getDueDateClass(task.dueDate)}>{formatDateTime(task.dueDate)}</span>
              </Descriptions.Item>
              <Descriptions.Item label="总分">{task.totalScore}</Descriptions.Item>
              <Descriptions.Item label="及格分">{task.passingScore}</Descriptions.Item>
              <Descriptions.Item label="分配范围">
                {task.assignmentMode === 'selected' ? '定向任务' : '全班任务'}
              </Descriptions.Item>
            </Descriptions>

            <div className="mt-5 rounded-[22px] bg-stone-50 px-4 py-4 text-sm text-stone-600">
              <div>目标学生：{task.assignedStudentCount}</div>
              <div className="mt-2">已提交：{task.submittedCount}</div>
              <div className="mt-2">已评分：{task.gradedCount}</div>
            </div>

            {task.relatedResources.length ? (
              <div className="mt-5">
                <div className="mb-3 text-sm font-medium text-stone-900">推荐资源</div>
                <div className="space-y-2">
                  {task.relatedResources.map((resource) => (
                    <a
                      key={resource.id}
                      href={resource.fileUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="block rounded-2xl border border-[var(--lms-color-border)] px-4 py-3 text-sm text-stone-600 transition hover:border-[rgba(255,107,53,0.18)] hover:text-stone-900"
                    >
                      {resource.title}
                    </a>
                  ))}
                </div>
              </div>
            ) : null}

            {task.attachments.length ? (
              <div className="mt-5">
                <div className="mb-3 text-sm font-medium text-stone-900">任务附件</div>
                <div className="space-y-2">
                  {task.attachments.map((attachment) => (
                    <a
                      key={attachment.key}
                      href={attachment.url}
                      target="_blank"
                      rel="noreferrer"
                      className="block rounded-2xl border border-[var(--lms-color-border)] px-4 py-3 text-sm text-stone-600 transition hover:border-[rgba(255,107,53,0.18)] hover:text-stone-900"
                    >
                      {attachment.name || attachment.originalName}
                    </a>
                  ))}
                </div>
              </div>
            ) : null}
          </section>
        }
      >
        <section className="app-panel px-5 py-5 sm:px-6 xl:px-7">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
            <div className="min-w-0 flex-1">
              <button
                type="button"
                onClick={() => navigate('/tasks')}
                className="text-sm font-medium text-stone-400 transition hover:text-stone-700"
              >
                返回任务中心
              </button>
              <h1 className="mt-4 text-[clamp(28px,3vw,42px)] font-semibold tracking-[-0.04em] text-stone-900">
                {task.title}
              </h1>
              <p className="mt-3 max-w-4xl whitespace-pre-wrap text-sm leading-7 text-stone-500">
                {task.description || '暂无任务说明。'}
              </p>
            </div>

            {isTeacherView ? (
              <div className="flex flex-wrap gap-3">
                <Button onClick={() => navigate(`/tasks/${id}/edit`)}>编辑任务</Button>
                <Popconfirm
                  title="确定删除这条任务吗？"
                  okText="删除"
                  cancelText="取消"
                  onConfirm={() => deleteMutation.mutate()}
                >
                  <Button danger loading={deleteMutation.isPending}>
                    删除任务
                  </Button>
                </Popconfirm>
              </div>
            ) : null}
          </div>
        </section>

        {isTeacherView && shouldLoadQuestions ? (
          <section className="app-panel px-5 py-5 sm:px-6 xl:px-7">
            <div className="app-section-heading">
              <h2 className="app-section-title">题目预览</h2>
            </div>
            <div className="mt-4">
              <TaskQuestionList
                questions={taskQuestions}
                loading={isQuestionsLoading}
                showAnswer
                emptyText="当前还没有配置题目。"
              />
            </div>
          </section>
        ) : null}

        {isTeacherView ? (
          <section className="app-panel px-5 py-5 sm:px-6 xl:px-7">
            <div className="app-section-heading">
              <h2 className="app-section-title">学生提交</h2>
            </div>

            {submissionsPage && submissionsPage.items.length > 0 ? (
              <>
                <Table<TaskSubmission>
                  rowKey="id"
                  dataSource={submissionsPage.items}
                  columns={teacherSubmissionColumns}
                  pagination={false}
                  scroll={{ x: 720 }}
                />
                <div className="mt-5 flex justify-end">
                  <Pagination
                    current={submissionPage}
                    pageSize={submissionPageSize}
                    total={submissionsPage.total}
                    showSizeChanger
                    onChange={(nextPage, nextPageSize) => {
                      setSubmissionPage(nextPage)
                      setSubmissionPageSize(nextPageSize)
                    }}
                  />
                </div>
              </>
            ) : (
              <Empty description="当前还没有学生提交。" />
            )}
          </section>
        ) : (
          <TaskSubmissionPanel
            key={`${submission?.updatedAt ?? 'draft'}-${taskQuestions.map((item) => item.id).join(',')}`}
            task={task}
            submission={submission}
            taskQuestions={taskQuestions}
            onSubmit={async (values) => {
              await taskService.submitTask(id, values)
              uiMessage.success('任务提交成功')
              await Promise.all([
                queryClient.invalidateQueries({ queryKey: ['task', id] }),
                queryClient.invalidateQueries({ queryKey: ['task-submission', id] }),
                queryClient.invalidateQueries({ queryKey: ['tasks'] }),
              ])
            }}
          />
        )}
      </WorkspaceLayout>

      <TaskGradingModal
        open={Boolean(gradingTarget)}
        task={task}
        submission={gradingTarget}
        taskQuestions={taskQuestions}
        loading={gradeMutation.isPending}
        onCancel={() => setGradingTarget(null)}
        onSubmit={(payload) => gradeMutation.mutate(payload)}
      />
    </div>
  )
}
