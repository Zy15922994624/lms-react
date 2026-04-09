import { useNavigate } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { courseService } from '@/features/courses/services/course.service'
import TaskFormCard from '@/features/tasks/components/TaskFormCard'
import { taskService } from '@/features/tasks/services/task.service'
import type { TaskFormValues, TaskType } from '@/features/tasks/types/task'
import PageLoading from '@/shared/components/feedback/PageLoading'
import { uiMessage } from '@/shared/components/feedback/message'
import WorkspaceLayout from '@/shared/layout/WorkspaceLayout'

function supportsQuestionSelection(taskType: TaskType) {
  return taskType === 'homework' || taskType === 'quiz'
}

export default function TaskCreatePage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const { data: coursesPage, isLoading } = useQuery({
    queryKey: ['task-form-courses'],
    queryFn: () => courseService.getCourses(true, 1, 100),
  })

  const createMutation = useMutation({
    mutationFn: async ({
      values,
      questionBankIds,
    }: {
      values: TaskFormValues
      questionBankIds: string[]
    }) => {
      const task = await taskService.createTask(values)
      if (supportsQuestionSelection(values.type) && questionBankIds.length) {
        await taskService.addTaskQuestionsFromBank(task.id, { questionBankIds })
      }
      return task
    },
    onSuccess: async (task) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['tasks'] }),
        queryClient.invalidateQueries({ queryKey: ['task', task.id] }),
      ])
      uiMessage.success('任务创建成功')
      navigate(`/tasks/${task.id}`)
    },
    onError: () => {
      uiMessage.error('任务创建失败')
    },
  })

  if (isLoading && !coursesPage) {
    return <PageLoading />
  }

  return (
    <div className="space-y-6">
      <WorkspaceLayout preset="dashboard" mainClassName="w-full space-y-5">
        <TaskFormCard
          mode="create"
          courses={coursesPage?.items ?? []}
          submitting={createMutation.isPending}
          enableDraftQuestionSelection
          onSubmit={async (values, questionBankIds = []) => {
            await createMutation.mutateAsync({ values, questionBankIds })
          }}
          onCancel={() => navigate('/tasks')}
        />
      </WorkspaceLayout>
    </div>
  )
}
