import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Button, Dropdown, Empty, Input, Modal, Pagination, Select, Tag } from 'antd'
import type { MenuProps } from 'antd'
import { MoreOutlined, PlusOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/features/auth/store/auth.store'
import { courseService } from '@/features/courses/services/course.service'
import { taskService } from '@/features/tasks/services/task.service'
import type { PendingGradingItem, TaskItem, TaskType } from '@/features/tasks/types/task'
import PageLoading from '@/shared/components/feedback/PageLoading'
import { uiMessage } from '@/shared/components/feedback/message'
import WorkspaceLayout from '@/shared/layout/WorkspaceLayout'
import { formatDateTime, getDueDateClass, isOverdue } from '@/shared/utils/date'

const taskTypeTextMap: Record<TaskType, string> = {
  homework: '作业',
  quiz: '测验',
  project: '项目',
  reading: '阅读',
}

const taskTypeColorMap: Record<TaskType, string> = {
  homework: 'green',
  quiz: 'orange',
  project: 'blue',
  reading: 'purple',
}

function PendingGradingCard({ item, onOpen }: { item: PendingGradingItem; onOpen: (taskId: string) => void }) {
  return (
    <button
      type="button"
      onClick={() => onOpen(item.taskId)}
      className="w-full rounded-[22px] border border-[rgba(28,25,23,0.06)] bg-white/94 px-4 py-4 text-left transition hover:border-[rgba(255,107,53,0.18)]"
    >
      <div className="flex items-center gap-2">
        <Tag color={taskTypeColorMap[item.taskType]}>{taskTypeTextMap[item.taskType]}</Tag>
        <span className="text-xs text-stone-400">待批改</span>
      </div>
      <div className="mt-3 text-sm font-medium text-stone-900">{item.taskTitle}</div>
      <div className="mt-2 text-xs leading-5 text-stone-500">
        {item.courseTitle || '未命名课程'} · {item.studentName}
      </div>
      <div className="mt-1 text-xs leading-5 text-stone-400">
        提交于 {formatDateTime(item.submittedAt)}
      </div>
    </button>
  )
}

export default function TasksPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const currentUser = useAuthStore((state) => state.currentUser)
  const isTeacherView = currentUser?.role === 'teacher' || currentUser?.role === 'admin'

  const [searchText, setSearchText] = useState('')
  const [searchKeyword, setSearchKeyword] = useState('')
  const [selectedCourseId, setSelectedCourseId] = useState<string | undefined>()
  const [selectedType, setSelectedType] = useState<TaskType | undefined>()
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [pendingDeleteTask, setPendingDeleteTask] = useState<TaskItem | null>(null)

  const { data: coursesPage } = useQuery({
    queryKey: ['task-courses'],
    queryFn: () => courseService.getCourses(true, 1, 100),
  })

  const { data: taskPage, isLoading, isFetching } = useQuery({
    queryKey: ['tasks', page, pageSize, selectedCourseId, selectedType, searchKeyword],
    queryFn: () =>
      taskService.getTasks({
        page,
        pageSize,
        courseId: selectedCourseId,
        type: selectedType,
        search: searchKeyword || undefined,
      }),
  })

  const { data: pendingGradingItems = [] } = useQuery({
    queryKey: ['tasks', 'pending-grading'],
    queryFn: () => taskService.getPendingGrading(),
    enabled: isTeacherView,
  })

  const deleteMutation = useMutation({
    mutationFn: (taskId: string) => taskService.deleteTask(taskId),
    onSuccess: async () => {
      uiMessage.success('任务已删除')
      setPendingDeleteTask(null)
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['tasks'] }),
        queryClient.invalidateQueries({ queryKey: ['tasks', 'pending-grading'] }),
      ])
    },
    onError: () => {
      uiMessage.error('删除任务失败')
    },
  })

  const tasks = useMemo(() => taskPage?.items ?? [], [taskPage])
  const total = taskPage?.total ?? 0

  const metrics = useMemo(() => {
    const publishedCount = tasks.filter((task) => task.isPublished).length
    const overdueCount = tasks.filter((task) => isOverdue(task.dueDate)).length
    const waitingGradeCount = tasks.reduce(
      (sum, task) => sum + Math.max(task.submittedCount - task.gradedCount, 0),
      0,
    )
    const gradedForStudent = tasks.filter((task) => task.currentUserSubmissionStatus === 'graded').length

    return isTeacherView
      ? [
          { label: '当前结果数', value: total || tasks.length },
          { label: '已发布', value: publishedCount },
          { label: '待批改', value: waitingGradeCount },
          { label: '已过期', value: overdueCount },
        ]
      : [
          { label: '当前结果数', value: total || tasks.length },
          { label: '已提交', value: tasks.filter((task) => task.currentUserSubmissionStatus !== 'not_submitted').length },
          { label: '已评分', value: gradedForStudent },
          { label: '已过期', value: overdueCount },
        ]
  }, [isTeacherView, tasks, total])

  const focusTasks = useMemo(
    () =>
      [...tasks]
        .sort(
          (left, right) =>
            right.submittedCount - right.gradedCount - (left.submittedCount - left.gradedCount),
        )
        .slice(0, 4),
    [tasks],
  )

  const actionItems = (task: TaskItem): MenuProps['items'] => [
    {
      key: 'detail',
      label: '查看详情',
      onClick: () => navigate(`/tasks/${task.id}`),
    },
    {
      key: 'edit',
      label: '编辑任务',
      onClick: () => navigate(`/tasks/${task.id}/edit`),
    },
    {
      key: 'delete',
      label: '删除任务',
      danger: true,
      onClick: () => setPendingDeleteTask(task),
    },
  ]

  if (isLoading && !taskPage) {
    return <PageLoading />
  }

  return (
    <div className="space-y-6 lg:space-y-8">
      <WorkspaceLayout
        preset="dashboard"
        aside={
          isTeacherView ? (
            <section className="app-panel px-5 py-5">
              <div className="app-section-heading">
                <h2 className="app-section-title">待批改</h2>
              </div>
              <div className="space-y-3">
                {pendingGradingItems.length === 0 ? (
                  <div className="text-sm text-stone-500">当前没有待批改的提交。</div>
                ) : (
                  pendingGradingItems.map((item) => (
                    <PendingGradingCard key={item.submissionId} item={item} onOpen={(taskId) => navigate(`/tasks/${taskId}`)} />
                  ))
                )}
              </div>
            </section>
          ) : (
            <section className="app-panel px-5 py-5">
              <div className="app-section-heading">
                <h2 className="app-section-title">优先关注</h2>
              </div>
              <div className="space-y-3">
                {focusTasks.length === 0 ? (
                  <div className="text-sm text-stone-500">当前暂无可关注任务。</div>
                ) : (
                  focusTasks.map((task) => (
                    <button
                      key={task.id}
                      type="button"
                      onClick={() => navigate(`/tasks/${task.id}`)}
                      className="w-full rounded-[22px] border border-[rgba(28,25,23,0.06)] bg-white/94 px-4 py-4 text-left transition hover:border-[rgba(255,107,53,0.18)]"
                    >
                      <div className="text-sm font-medium text-stone-900">{task.title}</div>
                      <div className="mt-1 text-xs leading-5 text-stone-500">
                        {task.course?.title || '未命名课程'} · 截止 {formatDateTime(task.dueDate)}
                      </div>
                    </button>
                  ))
                )}
              </div>
            </section>
          )
        }
      >
        <section className="app-panel px-5 py-5 sm:px-6 xl:px-7">
          <div className="flex flex-col gap-5 2xl:flex-row 2xl:items-start 2xl:justify-between">
            <div className="min-w-0 flex-1">
              <div className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-400">
                任务中心
              </div>
              <h1 className="mt-3 text-[clamp(28px,3vw,42px)] font-semibold tracking-[-0.04em] text-stone-900">
                {isTeacherView ? '管理任务与批改进度' : '查看任务与提交状态'}
              </h1>
              <p className="mt-3 max-w-3xl text-sm leading-7 text-stone-500">
                {isTeacherView
                  ? '这里会汇总课程任务、待批改提交和整体进度，你可以直接进入详情页继续评分。'
                  : '这里会汇总你的课程任务、提交状态和评分结果，点击任务即可继续作答或查看反馈。'}
              </p>
            </div>

            <div className="flex w-full flex-col gap-3 2xl:w-[340px]">
              <Input.Search
                value={searchText}
                onChange={(event) => setSearchText(event.target.value)}
                onSearch={(value) => {
                  setPage(1)
                  setSearchKeyword(value.trim())
                }}
                placeholder="搜索任务标题或描述"
              />
              <div className="grid gap-3 sm:grid-cols-2">
                <Select
                  allowClear
                  placeholder="全部课程"
                  value={selectedCourseId}
                  options={(coursesPage?.items ?? []).map((course) => ({
                    label: course.title,
                    value: course.id,
                  }))}
                  onChange={(value) => {
                    setPage(1)
                    setSelectedCourseId(value)
                  }}
                />
                <Select
                  allowClear
                  placeholder="全部类型"
                  value={selectedType}
                  options={Object.entries(taskTypeTextMap).map(([value, label]) => ({
                    label,
                    value,
                  }))}
                  onChange={(value) => {
                    setPage(1)
                    setSelectedType(value)
                  }}
                />
              </div>
              {isTeacherView ? (
                <Button type="primary" size="large" icon={<PlusOutlined />} onClick={() => navigate('/tasks/create')}>
                  创建任务
                </Button>
              ) : null}
            </div>
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {metrics.map((item) => (
              <div
                key={item.label}
                className="rounded-[24px] border border-[var(--lms-color-border)] bg-white/92 px-5 py-5 shadow-[0_12px_30px_rgba(28,25,23,0.05)]"
              >
                <div className="text-sm text-stone-500">{item.label}</div>
                <div className="mt-3 text-3xl font-semibold tracking-[-0.03em] text-stone-900">
                  {item.value}
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="app-panel overflow-hidden">
          <div className="flex items-center justify-between px-5 py-5 sm:px-6 xl:px-7">
            <h2 className="text-xl font-semibold tracking-[-0.02em] text-stone-900">任务列表</h2>
            {isFetching ? <span className="text-sm text-stone-400">刷新中…</span> : null}
          </div>

          {tasks.length === 0 ? (
            <div className="px-5 py-10 sm:px-6 xl:px-7">
              <Empty description="当前筛选下暂无任务" />
            </div>
          ) : (
            <div className="divide-y divide-[var(--lms-color-border)]">
              {tasks.map((task) => (
                <div
                  key={task.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => navigate(`/tasks/${task.id}`)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault()
                      navigate(`/tasks/${task.id}`)
                    }
                  }}
                  className="group grid cursor-pointer gap-5 px-5 py-5 transition hover:bg-[#fffaf6] focus-visible:bg-[#fffaf6] focus-visible:outline-none sm:px-6 xl:grid-cols-[minmax(0,1.4fr)_minmax(320px,0.9fr)] xl:px-7"
                >
                  <div className="min-w-0">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <Tag color={taskTypeColorMap[task.type]}>{taskTypeTextMap[task.type]}</Tag>
                          <span className="rounded-full border border-[var(--lms-color-border)] px-3 py-1 text-[11px] font-medium text-stone-500">
                            {task.assignmentMode === 'selected' ? '定向任务' : '全班任务'}
                          </span>
                          <span
                            className={[
                              'rounded-full px-3 py-1 text-[11px] font-medium',
                              task.isPublished ? 'bg-emerald-50 text-emerald-600' : 'bg-stone-100 text-stone-500',
                            ].join(' ')}
                          >
                            {task.isPublished ? '已发布' : '未发布'}
                          </span>
                        </div>
                        <div className="mt-3 text-2xl font-semibold tracking-[-0.03em] text-stone-900 transition group-hover:text-orange-600">
                          {task.title}
                        </div>
                        <div className="mt-2 max-w-3xl text-sm leading-6 text-stone-500">
                          {task.description || '暂无任务说明'}
                        </div>
                      </div>

                      {isTeacherView ? (
                        <div onClick={(event) => event.stopPropagation()}>
                          <Dropdown menu={{ items: actionItems(task) }} trigger={['click']}>
                            <Button
                              icon={<MoreOutlined />}
                              type="text"
                              shape="circle"
                              className="h-10 w-10 rounded-full border border-[rgba(28,25,23,0.06)] bg-white/88 text-stone-500"
                            />
                          </Dropdown>
                        </div>
                      ) : null}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-sm text-stone-500 sm:grid-cols-4 xl:grid-cols-2">
                    <div>
                      <div className="text-xs uppercase tracking-[0.16em] text-stone-400">课程</div>
                      <div className="mt-2 font-medium text-stone-900">{task.course?.title || '-'}</div>
                    </div>
                    <div>
                      <div className="text-xs uppercase tracking-[0.16em] text-stone-400">截止</div>
                      <div className={`mt-2 font-medium ${getDueDateClass(task.dueDate)}`}>
                        {formatDateTime(task.dueDate)}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs uppercase tracking-[0.16em] text-stone-400">提交</div>
                      <div className="mt-2 font-medium text-stone-900">
                        {task.submittedCount}/{task.assignedStudentCount}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs uppercase tracking-[0.16em] text-stone-400">
                        {isTeacherView ? '已评分' : '我的状态'}
                      </div>
                      <div className="mt-2 font-medium text-stone-900">
                        {isTeacherView
                          ? `${task.gradedCount} 份`
                          : task.currentUserSubmissionStatus === 'not_submitted'
                            ? '未提交'
                            : task.currentUserSubmissionStatus === 'graded'
                              ? `已评分 ${task.currentUserScore ?? 0}`
                              : '已提交'}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {total > 0 ? (
            <div className="flex justify-end px-5 py-5 sm:px-6 xl:px-7">
              <Pagination
                current={page}
                pageSize={pageSize}
                total={total}
                showSizeChanger
                onChange={(nextPage, nextPageSize) => {
                  setPage(nextPage)
                  setPageSize(nextPageSize)
                }}
              />
            </div>
          ) : null}
        </section>
      </WorkspaceLayout>

      <Modal
        open={Boolean(pendingDeleteTask)}
        title="删除任务"
        okText="删除"
        cancelText="取消"
        okButtonProps={{ danger: true, loading: deleteMutation.isPending }}
        onCancel={() => setPendingDeleteTask(null)}
        onOk={() => {
          if (!pendingDeleteTask) return
          deleteMutation.mutate(pendingDeleteTask.id)
        }}
      >
        <p className="text-sm leading-7 text-stone-500">
          删除后任务、定向分配和学生提交都会一起移除，请确认是否继续。
        </p>
      </Modal>
    </div>
  )
}
