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
      <WorkspaceLayout
        preset="dashboard"
        aside={
          <section className="app-panel px-5 py-5 text-sm leading-7 text-stone-500">
            <div className="app-section-heading">
              <h2 className="app-section-title">编辑说明</h2>
            </div>
            <p>这里会同步调整任务基础信息、分配范围、推荐资源和附件。</p>
            <p>作业和测验类型支持继续配置题目，题目顺序会直接影响学生端展示顺序。</p>
            <p>如果任务已经开始评分，建议优先调整说明和资料，尽量避免频繁修改评分结构。</p>
          </section>
        }
      >
        <section className="app-panel px-5 py-5 sm:px-6 xl:px-7">
          <div className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-400">
            任务中心
          </div>
          <h1 className="mt-3 text-[clamp(28px,3vw,42px)] font-semibold tracking-[-0.04em] text-stone-900">
            编辑任务
          </h1>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-stone-500">
            当前正在编辑“{task.title}”。保存后，任务详情页和任务中心列表会立即同步更新。
          </p>
        </section>

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

        <TaskQuestionManager task={task} />
      </WorkspaceLayout>
    </div>
  )
}
