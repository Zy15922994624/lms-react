import { Navigate, useNavigate, useParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { courseService } from '@/features/courses/services/course.service'
import TaskFormCard from '@/features/tasks/components/TaskFormCard'
import TaskQuestionManager from '@/features/tasks/components/TaskQuestionManager'
import { taskService } from '@/features/tasks/services/task.service'
import type { TaskDetail, TaskFormValues } from '@/features/tasks/types/task'
import PageLoading from '@/shared/components/feedback/PageLoading'
import { uiMessage } from '@/shared/components/feedback/message'
import WorkspaceLayout from '@/shared/layout/WorkspaceLayout'

function supportsQuestionDesign(taskType: TaskDetail['type']) {
  return taskType === 'homework' || taskType === 'quiz'
}

export default function TaskEditPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { id = '' } = useParams()

  const { data: coursesPage, isLoading: isCoursesLoading } = useQuery({
    queryKey: ['task-form-courses'],
    queryFn: () => courseService.getCourses(true, 1, 100),
  })

  const { data: task, isLoading: isTaskLoading } = useQuery({
    queryKey: ['task', id],
    queryFn: () => taskService.getTaskById(id),
    enabled: Boolean(id),
  })

  const updateMutation = useMutation({
    mutationFn: (values: TaskFormValues) => taskService.updateTask(id, values),
    onSuccess: async (updatedTask) => {
      uiMessage.success('任务已更新')
      queryClient.setQueryData<TaskDetail>(['task', id], updatedTask)
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['tasks'] }),
        queryClient.invalidateQueries({ queryKey: ['task', id] }),
      ])
      navigate(`/tasks/${id}`)
    },
    onError: () => {
      uiMessage.error('任务更新失败')
    },
  })

  if ((isCoursesLoading || isTaskLoading) && (!coursesPage || !task)) {
    return <PageLoading />
  }

  if (!task) {
    return <Navigate to="/tasks" replace />
  }

  return (
    <div className="space-y-6">
      <WorkspaceLayout preset="dashboard" mainClassName="w-full space-y-5">
        <TaskFormCard
          mode="edit"
          task={task}
          courses={coursesPage?.items ?? []}
          submitting={updateMutation.isPending}
          onSubmit={async (values) => {
            await updateMutation.mutateAsync(values)
          }}
          onCancel={() => navigate(`/tasks/${id}`)}
        />

        {supportsQuestionDesign(task.type) ? <TaskQuestionManager task={task} /> : null}
      </WorkspaceLayout>
    </div>
  )
}
