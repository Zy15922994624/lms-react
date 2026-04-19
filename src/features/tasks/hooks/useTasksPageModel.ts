import { useCallback, useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { MenuProps } from 'antd'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/features/auth/store/auth.store'
import { courseService } from '@/features/courses/services/course.service'
import { uiMessage } from '@/shared/components/feedback/message'
import { usePaginationState } from '@/shared/hooks/usePaginationState'
import { taskService } from '@/features/tasks/services/task.service'
import { isStudentTaskPending, taskTypeLabelMap } from '@/features/tasks/constants/task-ui'
import type { TaskItem, TaskType } from '@/features/tasks/types/task'
import { invalidateQueryKeys } from '@/shared/utils/invalidate-query-keys'

export function useTasksPageModel() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const currentUser = useAuthStore((state) => state.currentUser)
  const isTeacherView = currentUser?.role === 'teacher' || currentUser?.role === 'admin'

  const [searchText, setSearchText] = useState('')
  const [searchKeyword, setSearchKeyword] = useState('')
  const [selectedCourseId, setSelectedCourseId] = useState<string | undefined>()
  const [selectedType, setSelectedType] = useState<TaskType | undefined>()
  const {
    page,
    setPage,
    pageSize,
    handleTableChange: handleTaskTableChange,
    handlePageChange,
  } = usePaginationState()
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
      await invalidateQueryKeys(queryClient, [['tasks'], ['tasks', 'pending-grading']])
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
        .sort((left, right) => {
          const pendingWeight =
            Number(isStudentTaskPending(left)) - Number(isStudentTaskPending(right))
          if (pendingWeight !== 0) {
            return pendingWeight > 0 ? -1 : 1
          }

          return new Date(left.dueDate).getTime() - new Date(right.dueDate).getTime()
        })
        .slice(0, 5),
    [tasks],
  )

  const courseOptions = useMemo(
    () =>
      (coursesPage?.items ?? []).map((course) => ({
        label: course.title,
        value: course.id,
      })),
    [coursesPage?.items],
  )

  const taskTypeOptions = useMemo(
    () =>
      Object.entries(taskTypeLabelMap).map(([value, label]) => ({
        label,
        value,
      })),
    [],
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

  const handleSearch = useCallback((value: string) => {
    setPage(1)
    setSearchKeyword(value.trim())
  }, [setPage])

  const handleCourseChange = useCallback((value?: string) => {
    setPage(1)
    setSelectedCourseId(value)
  }, [setPage])

  const handleTypeChange = useCallback((value?: TaskType) => {
    setPage(1)
    setSelectedType(value)
  }, [setPage])

  const openTaskDetail = useCallback(
    (taskId: string) => {
      navigate(`/tasks/${taskId}`)
    },
    [navigate],
  )

  const openTaskCreate = useCallback(() => {
    navigate('/tasks/create')
  }, [navigate])

  const closeDeleteModal = useCallback(() => {
    setPendingDeleteTask(null)
  }, [])

  const confirmDeleteTask = useCallback(() => {
    if (!pendingDeleteTask) return
    deleteMutation.mutate(pendingDeleteTask.id)
  }, [deleteMutation, pendingDeleteTask])

  return {
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
  }
}
