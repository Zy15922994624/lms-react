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

const taskTypeLabelMap: Record<TaskType, string> = {
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

function getStudentTaskStatus(task: TaskItem) {
  if (task.currentUserSubmissionStatus === 'graded') {
    return task.currentUserScore !== undefined ? `已评分 ${task.currentUserScore} 分` : '已评分'
  }

  if (task.currentUserSubmissionStatus === 'submitted') {
    return '已提交'
  }

  return '未提交'
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

  const {
    data: taskPage,
    isLoading,
    isFetching,
  } = useQuery({
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
        .sort((left, right) => new Date(left.dueDate).getTime() - new Date(right.dueDate).getTime())
        .slice(0, 5),
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
        align: 'center',
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
    [navigate],
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
        width: 172,
        align: 'center',
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
        render: (value: string) => (
          <span className={getDueDateClass(value)}>{formatDateTime(value)}</span>
        ),
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
        mainClassName="app-panel overflow-hidden"
        aside={
          isTeacherView ? (
            <section className="app-panel px-5 py-5 xl:px-6 xl:py-6 2xl:px-7 2xl:py-7">
              <div className="app-section-heading">
                <h2 className="app-section-title">待批改</h2>
              </div>
              {pendingGradingItems.length === 0 ? (
                <div className="mt-4">
                  <Empty description="暂无待批改提交" image={Empty.PRESENTED_IMAGE_SIMPLE} />
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
            <section className="app-panel px-5 py-5 xl:px-6 xl:py-6 2xl:px-7 2xl:py-7">
              <div className="app-section-heading">
                <h2 className="app-section-title">优先处理</h2>
              </div>
              {focusTasks.length === 0 ? (
                <div className="mt-4">
                  <Empty description="暂无任务" image={Empty.PRESENTED_IMAGE_SIMPLE} />
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
        <div className="flex flex-col gap-4 border-b border-[var(--lms-color-border)] px-6 py-5 sm:px-8 xl:flex-row xl:items-center xl:justify-between xl:px-9 xl:py-6 2xl:px-10">
          <div className="min-w-0">
            <h1 className="text-2xl font-semibold tracking-[-0.03em] text-stone-900">
              {isTeacherView ? '任务' : '我的任务'}
            </h1>
            <div className="mt-1 text-sm text-stone-500">共 {total} 条</div>
          </div>

          <div className="flex flex-col gap-3 xl:w-auto xl:flex-row xl:items-center">
            <Input.Search
              value={searchText}
              onChange={(event) => setSearchText(event.target.value)}
              onSearch={(value) => {
                setPage(1)
                setSearchKeyword(value.trim())
              }}
              placeholder="搜索任务标题"
              className="xl:w-[280px] 2xl:w-[320px]"
            />
            <Select
              allowClear
              placeholder="全部课程"
              value={selectedCourseId}
              className="xl:w-[200px]"
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
              className="xl:w-[160px]"
              options={Object.entries(taskTypeLabelMap).map(([value, label]) => ({
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

        <section className="px-5 py-5 sm:px-6 xl:px-7 2xl:px-8">
          {isFetching ? (
            <div className="mb-4 text-right text-sm text-stone-400">正在刷新…</div>
          ) : null}

          <Table<TaskItem>
            size="middle"
            rowKey="id"
            dataSource={tasks}
            columns={taskColumns}
            loading={isFetching && Boolean(taskPage)}
            locale={{ emptyText: '暂无任务' }}
            scroll={{ x: 980 }}
            pagination={{
              current: page,
              pageSize,
              total,
              showSizeChanger: true,
            }}
            onChange={handleTaskTableChange}
          />
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
        <p className="text-sm leading-7 text-stone-500">是否删除任务</p>
      </Modal>
    </div>
  )
}
