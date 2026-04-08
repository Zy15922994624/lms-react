import { useNavigate } from 'react-router-dom'
import { useMutation, useQuery } from '@tanstack/react-query'
import { courseService } from '@/features/courses/services/course.service'
import TaskFormCard from '@/features/tasks/components/TaskFormCard'
import { taskService } from '@/features/tasks/services/task.service'
import type { TaskFormValues } from '@/features/tasks/types/task'
import PageLoading from '@/shared/components/feedback/PageLoading'
import { uiMessage } from '@/shared/components/feedback/message'
import WorkspaceLayout from '@/shared/layout/WorkspaceLayout'

export default function TaskCreatePage() {
  const navigate = useNavigate()

  const { data: coursesPage, isLoading } = useQuery({
    queryKey: ['task-form-courses'],
    queryFn: () => courseService.getCourses(true, 1, 100),
  })

  const createMutation = useMutation({
    mutationFn: (values: TaskFormValues) => taskService.createTask(values),
    onSuccess: (task) => {
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
      <WorkspaceLayout
        preset="dashboard"
        aside={
          <section className="app-panel px-5 py-5 text-sm leading-7 text-stone-500">
            <div className="app-section-heading">
              <h2 className="app-section-title">创建说明</h2>
            </div>
            <p>首阶段支持教师创建任务、分配学生、上传附件、关联阅读资源，并直接进入提交流程。</p>
            <p>题目抽取和自动判分会在后续增强阶段补上，这一轮先确保主链路可用且边界清晰。</p>
          </section>
        }
      >
        <section className="app-panel px-5 py-5 sm:px-6 xl:px-7">
          <div className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-400">
            任务中心
          </div>
          <h1 className="mt-3 text-[clamp(28px,3vw,42px)] font-semibold tracking-[-0.04em] text-stone-900">
            创建新任务
          </h1>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-stone-500">
            先确定课程、任务类型和截止时间，再补充分配范围、推荐资源与附件要求。
          </p>
        </section>

        <TaskFormCard
          mode="create"
          courses={coursesPage?.items ?? []}
          submitting={createMutation.isPending}
          onSubmit={async (values) => {
            await createMutation.mutateAsync(values)
          }}
          onCancel={() => navigate('/tasks')}
        />
      </WorkspaceLayout>
    </div>
  )
}
