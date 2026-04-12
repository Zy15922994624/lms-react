import { useMemo, useRef, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Button, Empty, Pagination, Popconfirm, Table, Tag } from 'antd'
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
import { ROUTES } from '@/shared/constants/routes'
import WorkspaceLayout from '@/shared/layout/WorkspaceLayout'
import useResponsiveLayout from '@/shared/layout/useResponsiveLayout'
import { formatDateTime, getDueDateClass } from '@/shared/utils/date'

function supportsQuestionPreview(taskType: TaskDetail['type']) {
  return taskType === 'homework' || taskType === 'quiz'
}

const taskTypeLabelMap: Record<TaskDetail['type'], string> = {
  homework: '作业',
  quiz: '测验',
  project: '项目',
  reading: '阅读',
}

function getTaskTypeColor(taskType: TaskDetail['type']) {
  if (taskType === 'reading') return 'purple'
  if (taskType === 'project') return 'blue'
  if (taskType === 'quiz') return 'orange'
  return 'green'
}

export default function TaskDetailPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { id = '' } = useParams()
  const currentUser = useAuthStore((state) => state.currentUser)
  const isTeacherView = currentUser?.role === 'teacher' || currentUser?.role === 'admin'
  const { isMobile } = useResponsiveLayout()

  const [submissionPage, setSubmissionPage] = useState(1)
  const [submissionPageSize, setSubmissionPageSize] = useState(10)
  const [gradingTarget, setGradingTarget] = useState<TaskSubmission | null>(null)
  const submissionPanelRef = useRef<HTMLDivElement | null>(null)

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

  const submissionCountText = `${task.submittedCount}/${task.assignedStudentCount}`
  const studentActionText =
    submission?.status === 'graded'
      ? '查看评分'
      : submission?.status === 'submitted'
        ? '查看提交'
        : '去完成'

  return (
    <div className="space-y-6 lg:space-y-8">
      <section className="app-panel overflow-hidden">
        <div className="border-b border-[var(--lms-color-border)] px-6 py-5 sm:px-8 xl:px-9 xl:py-6 2xl:px-10">
          <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
            <div className="min-w-0 flex-1">
              <button
                type="button"
                onClick={() => navigate('/tasks')}
                className="text-sm font-medium text-stone-400 transition hover:text-stone-700"
              >
                返回任务列表
              </button>

              <div className="mt-3 flex flex-wrap items-center gap-2">
                <Tag color={getTaskTypeColor(task.type)}>{taskTypeLabelMap[task.type]}</Tag>
                {isTeacherView && !task.isPublished ? <Tag>未发布</Tag> : null}
              </div>

              <h1 className="mt-3 text-[clamp(28px,3vw,40px)] font-semibold tracking-[-0.04em] text-stone-950">
                {task.title}
              </h1>

              <dl className="mt-5 grid gap-x-6 gap-y-3 text-sm sm:grid-cols-2 xl:grid-cols-4">
                <div>
                  <dt className="text-stone-400">所属课程</dt>
                  <dd className="mt-1 font-medium text-stone-900">{task.course?.title || '-'}</dd>
                </div>
                <div>
                  <dt className="text-stone-400">截止时间</dt>
                  <dd className={`mt-1 font-medium ${getDueDateClass(task.dueDate)}`}>
                    {formatDateTime(task.dueDate)}
                  </dd>
                </div>
                <div>
                  <dt className="text-stone-400">总分</dt>
                  <dd className="mt-1 font-medium text-stone-900">{task.totalScore} 分</dd>
                </div>
                <div>
                  <dt className="text-stone-400">分配范围</dt>
                  <dd className="mt-1 font-medium text-stone-900">
                    {task.assignmentMode === 'selected' ? '定向任务' : '全班任务'}
                  </dd>
                </div>
              </dl>

              {task.description ? (
                <div className="mt-4 rounded-[16px] bg-stone-50 px-4 py-3 text-sm leading-7 text-stone-600">
                  {task.description}
                </div>
              ) : null}
            </div>

            {isTeacherView ? (
              <div className="flex flex-wrap gap-3">
                <Button onClick={() => navigate(`/tasks/${id}/edit`)}>编辑任务</Button>
                <Popconfirm
                  title="确认删除这条任务吗？"
                  okText="删除"
                  cancelText="取消"
                  onConfirm={() => deleteMutation.mutate()}
                >
                  <Button danger loading={deleteMutation.isPending}>
                    删除任务
                  </Button>
                </Popconfirm>
              </div>
            ) : (
              <Button
                type="primary"
                onClick={() =>
                  submissionPanelRef.current?.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start',
                  })
                }
              >
                {studentActionText}
              </Button>
            )}
          </div>
        </div>

        <div className="grid gap-4 px-6 py-5 sm:px-8 xl:grid-cols-4 xl:px-9 2xl:px-10">
          <div className="rounded-[18px] border border-[rgba(28,25,23,0.06)] bg-white/92 px-4 py-4">
            <div className="text-sm text-stone-500">提交情况</div>
            <div className="mt-2 text-2xl font-semibold text-stone-900">{submissionCountText}</div>
          </div>
          <div className="rounded-[18px] border border-[rgba(28,25,23,0.06)] bg-white/92 px-4 py-4">
            <div className="text-sm text-stone-500">已评分</div>
            <div className="mt-2 text-2xl font-semibold text-stone-900">{task.gradedCount}</div>
          </div>
          <div className="rounded-[18px] border border-[rgba(28,25,23,0.06)] bg-white/92 px-4 py-4">
            <div className="text-sm text-stone-500">及格分</div>
            <div className="mt-2 text-2xl font-semibold text-stone-900">{task.passingScore}</div>
          </div>
          <div className="rounded-[18px] border border-[rgba(28,25,23,0.06)] bg-white/92 px-4 py-4">
            <div className="text-sm text-stone-500">发布时间</div>
            <div className="mt-2 text-sm font-medium text-stone-900">
              {task.publishedAt ? formatDateTime(task.publishedAt) : '未发布'}
            </div>
          </div>
        </div>
      </section>

      <WorkspaceLayout
        preset="course"
        mainClassName="w-full space-y-5"
        aside={
          <section className="app-panel px-4 py-4 sm:px-5 sm:py-5 xl:px-6 xl:py-6 2xl:px-7 2xl:py-7">
            <div className="app-section-heading">
              <h2 className="app-section-title">附件与资源</h2>
            </div>

            {!task.attachments.length && !task.relatedResources.length ? (
              <div className="mt-4">
                <Empty description="暂无附件或资源" image={Empty.PRESENTED_IMAGE_SIMPLE} />
              </div>
            ) : (
              <div className="mt-4 space-y-4">
                {task.attachments.length ? (
                  <div>
                    <div className="mb-2 text-sm font-medium text-stone-900">任务附件</div>
                    <div className="space-y-2">
                      {task.attachments.map((attachment) => (
                        <button
                          key={attachment.key}
                          type="button"
                          onClick={() => void taskService.downloadTaskAttachment(task.id, attachment)}
                          className="block w-full break-all rounded-[16px] border border-[rgba(28,25,23,0.06)] px-4 py-3 text-left text-sm text-stone-700 transition hover:border-[rgba(255,107,53,0.18)] hover:text-orange-600"
                        >
                          {attachment.name || attachment.originalName}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : null}

                {task.relatedResources.length ? (
                  <div>
                    <div className="mb-2 text-sm font-medium text-stone-900">关联资源</div>
                    <div className="space-y-2">
                      {task.relatedResources.map((resource) => (
                        <button
                          key={resource.id}
                          type="button"
                          onClick={() =>
                            navigate(
                              `${ROUTES.COURSE_RESOURCES(task.courseId)}?resourceId=${encodeURIComponent(resource.id)}`,
                            )
                          }
                          className="block w-full break-all rounded-[16px] border border-[rgba(28,25,23,0.06)] px-4 py-3 text-left text-sm text-stone-700 transition hover:border-[rgba(255,107,53,0.18)] hover:text-orange-600"
                        >
                          {resource.title}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : null}
              </div>
            )}
          </section>
        }
      >
        {isTeacherView && shouldLoadQuestions ? (
          <section className="app-panel px-4 py-4 sm:px-6 xl:px-7">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-stone-950">题目列表</h2>
              <span className="text-sm text-stone-400">{taskQuestions.length} 题</span>
            </div>
            <TaskQuestionList
              questions={taskQuestions}
              loading={isQuestionsLoading}
              showAnswer={isTeacherView}
              emptyText="当前还没有配置题目"
            />
          </section>
        ) : null}

        {isTeacherView ? (
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
                            <div className="mt-1 text-xs text-stone-500">
                              {formatDateTime(record.submittedAt)}
                            </div>
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
                          <Button type="link" className="px-0" onClick={() => setGradingTarget(record)}>
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
                    columns={teacherSubmissionColumns}
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
                    onChange={(nextPage, nextPageSize) => {
                      setSubmissionPage(nextPage)
                      setSubmissionPageSize(nextPageSize)
                    }}
                  />
                </div>
              </>
            ) : (
              <Empty description="当前还没有学生提交" />
            )}
          </section>
        ) : (
          <div ref={submissionPanelRef}>
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
          </div>
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
