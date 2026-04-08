import { useCallback, useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Button, Dropdown, Empty, Input, Modal, Select, Table, Tag } from 'antd'
import type { MenuProps } from 'antd'
import type { ColumnsType, TablePaginationConfig } from 'antd/es/table'
import { MoreOutlined, PlusOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/features/auth/store/auth.store'
import { courseService } from '@/features/courses/services/course.service'
import { taskService } from '@/features/tasks/services/task.service'
import type { PendingGradingItem, TaskItem, TaskType } from '@/features/tasks/types/task'
import PageLoading from '@/shared/components/feedback/PageLoading'
import { uiMessage } from '@/shared/components/feedback/message'
import WorkspaceLayout from '@/shared/layout/WorkspaceLayout'
import { formatDateTime, getDueDateClass } from '@/shared/utils/date'

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

  const focusTasks = useMemo(
    () =>
      [...tasks]
        .sort(
          (left, right) =>
            right.submittedCount -
            right.gradedCount -
            (left.submittedCount - left.gradedCount),
        )
        .slice(0, 4),
    [tasks],
  )

  const actionItems = useCallback(
    (task: TaskItem): MenuProps['items'] => [
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
    ],
    [navigate],
  )

  const pendingGradingColumns = useMemo<ColumnsType<PendingGradingItem>>(
    () => [
      {
        title: '任务',
        dataIndex: 'taskTitle',
        key: 'taskTitle',
        render: (value: string, record) => (
          <button
            type="button"
            className="text-left text-sm font-medium text-stone-900 transition hover:text-orange-600"
            onClick={() => navigate(`/tasks/${record.taskId}`)}
          >
            {value}
          </button>
        ),
      },
      {
        title: '学生',
        dataIndex: 'studentName',
        key: 'studentName',
        width: 110,
      },
      {
        title: '提交时间',
        dataIndex: 'submittedAt',
        key: 'submittedAt',
        width: 168,
        render: (value: string) => formatDateTime(value),
      },
    ],
    [navigate],
  )

  const focusTaskColumns = useMemo<ColumnsType<TaskItem>>(
    () => [
      {
        title: '任务',
        dataIndex: 'title',
        key: 'title',
        render: (value: string, record) => (
          <button
            type="button"
            className="text-left text-sm font-medium text-stone-900 transition hover:text-orange-600"
            onClick={() => navigate(`/tasks/${record.id}`)}
          >
            {value}
          </button>
        ),
      },
      {
        title: '截止时间',
        dataIndex: 'dueDate',
        key: 'dueDate',
        width: 168,
        render: (value: string) => (
          <span className={getDueDateClass(value)}>{formatDateTime(value)}</span>
        ),
      },
    ],
    [navigate],
  )

  const taskColumns = useMemo<ColumnsType<TaskItem>>(
    () => [
      {
        title: '任务标题',
        dataIndex: 'title',
        key: 'title',
        width: 320,
        render: (value: string, record) => (
          <div className="min-w-0">
            <div className="mb-1 flex flex-wrap items-center gap-2">
              <Tag color={taskTypeColorMap[record.type]}>{taskTypeTextMap[record.type]}</Tag>
              {!isTeacherView && record.currentUserSubmissionStatus === 'graded' ? (
                <Tag color="green">已评分</Tag>
              ) : null}
              {isTeacherView && !record.isPublished ? <Tag>未发布</Tag> : null}
            </div>
            <button
              type="button"
              className="text-left text-sm font-medium text-stone-900 transition hover:text-orange-600"
              onClick={() => navigate(`/tasks/${record.id}`)}
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
        width: 160,
        render: (_value, record) => record.course?.title || '-',
      },
      {
        title: '截止时间',
        dataIndex: 'dueDate',
        key: 'dueDate',
        width: 170,
        render: (value: string) => (
          <span className={getDueDateClass(value)}>{formatDateTime(value)}</span>
        ),
      },
      {
        title: isTeacherView ? '提交' : '状态',
        key: 'statusSimple',
        width: 110,
        render: (_value, record) => {
          if (isTeacherView) {
            return `${record.submittedCount}/${record.assignedStudentCount}`
          }

          if (record.currentUserSubmissionStatus === 'not_submitted') {
            return '未提交'
          }

          if (record.currentUserSubmissionStatus === 'graded') {
            return `已评分 ${record.currentUserScore ?? 0}`
          }

          return '已提交'
        },
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
                      className="h-10 w-10 rounded-full border border-[rgba(28,25,23,0.06)] bg-white/88 text-stone-500"
                    />
                  </Dropdown>
                </div>
              ),
            },
          ]
        : []),
    ],
    [actionItems, isTeacherView, navigate],
  )

  if (isLoading && !taskPage) {
    return <PageLoading />
  }

  const handleTaskTableChange = (pagination: TablePaginationConfig) => {
    setPage(pagination.current ?? 1)
    setPageSize(pagination.pageSize ?? 10)
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
              {pendingGradingItems.length === 0 ? (
                <div className="mt-4">
                  <Empty description="当前没有待批改的提交。" image={Empty.PRESENTED_IMAGE_SIMPLE} />
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
          ) : (
            <section className="app-panel px-5 py-5">
              <div className="app-section-heading">
                <h2 className="app-section-title">优先关注</h2>
              </div>
              {focusTasks.length === 0 ? (
                <div className="mt-4">
                  <Empty description="当前暂无可关注任务。" image={Empty.PRESENTED_IMAGE_SIMPLE} />
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
      >
        <section className="app-panel px-5 py-5 sm:px-6 xl:px-7">
          <div className="flex flex-col gap-4 2xl:flex-row 2xl:items-center 2xl:justify-between">
            <div className="min-w-0 flex-1">
              <h1 className="text-[clamp(26px,2.7vw,36px)] font-semibold tracking-[-0.04em] text-stone-900">
                {isTeacherView ? '任务管理' : '我的任务'}
              </h1>
            </div>

            <div className="flex w-full flex-col gap-3 2xl:w-[720px]">
              <Input.Search
                value={searchText}
                onChange={(event) => setSearchText(event.target.value)}
                onSearch={(value) => {
                  setPage(1)
                  setSearchKeyword(value.trim())
                }}
                placeholder="搜索任务标题或描述"
              />
              <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto]">
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
                {isTeacherView ? (
                  <Button
                    type="primary"
                    icon={<PlusOutlined />}
                    onClick={() => navigate('/tasks/create')}
                  >
                    创建任务
                  </Button>
                ) : null}
              </div>
            </div>
          </div>
        </section>

        <section className="app-panel overflow-hidden">
          <div className="flex items-center justify-between px-5 py-5 sm:px-6 xl:px-7">
            <h2 className="text-xl font-semibold tracking-[-0.02em] text-stone-900">任务列表</h2>
            {isFetching ? <span className="text-sm text-stone-400">刷新中…</span> : null}
          </div>

          <div className="px-5 pb-5 sm:px-6 xl:px-7">
            <Table<TaskItem>
              size="middle"
              rowKey="id"
              dataSource={tasks}
              columns={taskColumns}
              loading={isFetching && Boolean(taskPage)}
              locale={{ emptyText: '当前筛选下暂无任务' }}
              scroll={{ x: 1180 }}
              pagination={{
                current: page,
                pageSize,
                total,
                showSizeChanger: true,
              }}
              onChange={handleTaskTableChange}
            />
          </div>
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
