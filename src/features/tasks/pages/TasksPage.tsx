import { useMemo } from 'react'
import { Button, Dropdown, Empty, Input, Modal, Pagination, Select, Table, Tag } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { MoreOutlined, PlusOutlined } from '@ant-design/icons'
import { useTasksPageModel } from '@/features/tasks/hooks/useTasksPageModel'
import {
  getStudentActionLabel,
  getStudentTaskStatus,
  isStudentTaskPending,
  taskTypeColorMap,
  taskTypeLabelMap,
} from '@/features/tasks/constants/task-ui'
import type { PendingGradingItem, TaskItem } from '@/features/tasks/types/task'
import PageLoading from '@/shared/components/feedback/PageLoading'
import useResponsiveLayout from '@/shared/layout/useResponsiveLayout'
import WorkspaceLayout from '@/shared/layout/WorkspaceLayout'
import { formatDateTime, getDueDateClass } from '@/shared/utils/date'

export default function TasksPage() {
  const { isMobile } = useResponsiveLayout()
  const {
    isTeacherView,
    searchText,
    setSearchText,
    selectedCourseId,
    selectedType,
    page,
    pageSize,
    pendingDeleteTask,
    taskPage,
    tasks,
    total,
    focusTasks,
    pendingGradingItems,
    isLoading,
    isFetching,
    deleteMutation,
    courseOptions,
    taskTypeOptions,
    actionItems,
    handleSearch,
    handleCourseChange,
    handleTypeChange,
    handleTaskTableChange,
    handlePageChange,
    openTaskDetail,
    openTaskCreate,
    closeDeleteModal,
    confirmDeleteTask,
  } = useTasksPageModel()

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
            onClick={() => openTaskDetail(record.taskId)}
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
    [openTaskDetail],
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
            onClick={() => openTaskDetail(record.id)}
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
        align: 'center' as const,
        render: (_value, record) => (
          <Button
            type={isStudentTaskPending(record) ? 'primary' : 'link'}
            onClick={() => openTaskDetail(record.id)}
          >
            {getStudentActionLabel(record)}
          </Button>
        ),
      },
    ],
    [openTaskDetail],
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
              onClick={() => openTaskDetail(record.id)}
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
        : [
            {
              title: '操作',
              key: 'actions',
              width: 120,
              align: 'center' as const,
              render: (_value: unknown, record: TaskItem) => (
                <Button
                  type={isStudentTaskPending(record) ? 'primary' : 'link'}
                  onClick={() => openTaskDetail(record.id)}
                >
                  {getStudentActionLabel(record)}
                </Button>
              ),
            },
          ]),
    ],
    [actionItems, isTeacherView, openTaskDetail],
  )

  if (isLoading && !taskPage) {
    return <PageLoading />
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
                        onClick={() => openTaskDetail(item.taskId)}
                      >
                        {item.taskTitle}
                      </button>
                      <div className="mt-1 text-xs text-stone-500">{item.studentName}</div>
                      <div className="mt-1 text-xs text-stone-400">
                        {formatDateTime(item.submittedAt)}
                      </div>
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
          ) : (
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
                        onClick={() => openTaskDetail(item.id)}
                      >
                        {item.title}
                      </button>
                      <div className="mt-1 text-xs text-stone-400">
                        {formatDateTime(item.dueDate)}
                      </div>
                      <div className="mt-2">
                        <Button
                          size="small"
                          type={isStudentTaskPending(item) ? 'primary' : 'default'}
                          onClick={() => openTaskDetail(item.id)}
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
              onSearch={handleSearch}
              placeholder="搜索任务标题"
              className="xl:w-[280px] 2xl:w-[320px]"
            />
            <Select
              allowClear
              placeholder="全部课程"
              value={selectedCourseId}
              className="xl:w-[200px]"
              options={courseOptions}
              onChange={handleCourseChange}
            />
            <Select
              allowClear
              placeholder="全部类型"
              value={selectedType}
              className="xl:w-[160px]"
              options={taskTypeOptions}
              onChange={handleTypeChange}
            />
            {isTeacherView ? (
              <Button type="primary" icon={<PlusOutlined />} onClick={openTaskCreate}>
                创建任务
              </Button>
            ) : null}
          </div>
        </div>

        <section className="px-5 py-5 sm:px-6 xl:px-7 2xl:px-8">
          {isFetching ? (
            <div className="mb-4 text-right text-sm text-stone-400">正在刷新…</div>
          ) : null}

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
                      onClick={() => openTaskDetail(task.id)}
                    >
                      {task.title}
                    </button>
                    <div className="mt-1 text-xs text-stone-500">{task.course?.title || '-'}</div>
                    <div className="mt-2 text-xs">
                      <span className={getDueDateClass(task.dueDate)}>
                        {formatDateTime(task.dueDate)}
                      </span>
                    </div>
                    <div className="mt-2 text-xs text-stone-500">
                      {isTeacherView
                        ? `${task.submittedCount}/${task.assignedStudentCount}`
                        : getStudentTaskStatus(task)}
                    </div>
                    <div className="mt-3 flex items-center gap-2">
                      {isTeacherView ? (
                        <Button size="small" onClick={() => openTaskDetail(task.id)}>
                          查看详情
                        </Button>
                      ) : (
                        <Button
                          size="small"
                          type={isStudentTaskPending(task) ? 'primary' : 'default'}
                          onClick={() => openTaskDetail(task.id)}
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
          )}
          {isMobile && total > 0 ? (
            <div className="mt-5 flex justify-center">
              <Pagination
                current={page}
                pageSize={pageSize}
                total={total}
                size="small"
                showSizeChanger={false}
                onChange={handlePageChange}
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
        onCancel={closeDeleteModal}
        onOk={confirmDeleteTask}
      >
        <p className="text-sm leading-7 text-stone-500">是否删除任务</p>
      </Modal>
    </div>
  )
}
