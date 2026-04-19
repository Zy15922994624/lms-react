import { Modal } from 'antd'
import { useTasksPageModel } from '@/features/tasks/hooks/useTasksPageModel'
import PageLoading from '@/shared/components/feedback/PageLoading'
import useResponsiveLayout from '@/shared/layout/useResponsiveLayout'
import WorkspaceLayout from '@/shared/layout/WorkspaceLayout'
import TasksToolbar from '@/features/tasks/components/tasks-page/TasksToolbar'
import TasksAsidePanel from '@/features/tasks/components/tasks-page/TasksAsidePanel'
import TasksContentPanel from '@/features/tasks/components/tasks-page/TasksContentPanel'

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

  if (isLoading && !taskPage) {
    return <PageLoading />
  }

  return (
    <div className="space-y-6 lg:space-y-8">
      <WorkspaceLayout
        preset="dashboard"
        mainClassName="app-panel overflow-hidden"
        aside={
          <TasksAsidePanel
            isTeacherView={isTeacherView}
            isMobile={isMobile}
            pendingGradingItems={pendingGradingItems}
            focusTasks={focusTasks}
            onOpenTaskDetail={openTaskDetail}
          />
        }
      >
        <TasksToolbar
          isTeacherView={isTeacherView}
          total={total}
          searchText={searchText}
          selectedCourseId={selectedCourseId}
          selectedType={selectedType}
          courseOptions={courseOptions}
          taskTypeOptions={taskTypeOptions}
          onSearchTextChange={setSearchText}
          onSearch={handleSearch}
          onCourseChange={handleCourseChange}
          onTypeChange={handleTypeChange}
          onOpenTaskCreate={openTaskCreate}
        />

        <TasksContentPanel
          isMobile={isMobile}
          isTeacherView={isTeacherView}
          isFetching={isFetching}
          tableLoading={isFetching && Boolean(taskPage)}
          tasks={tasks}
          total={total}
          page={page}
          pageSize={pageSize}
          actionItems={actionItems}
          onOpenTaskDetail={openTaskDetail}
          onTaskTableChange={handleTaskTableChange}
          onMobilePageChange={handlePageChange}
        />
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
