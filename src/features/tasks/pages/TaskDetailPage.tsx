import { useRef, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import { useAuthStore } from '@/features/auth/store/auth.store'
import TaskGradingModal from '@/features/tasks/components/TaskGradingModal'
import TaskQuestionList from '@/features/tasks/components/TaskQuestionList'
import TaskSubmissionPanel from '@/features/tasks/components/TaskSubmissionPanel'
import TaskDetailHeroSection from '@/features/tasks/components/task-detail-page/TaskDetailHeroSection'
import TaskResourcesAside from '@/features/tasks/components/task-detail-page/TaskResourcesAside'
import TeacherSubmissionsSection from '@/features/tasks/components/task-detail-page/TeacherSubmissionsSection'
import { taskService } from '@/features/tasks/services/task.service'
import type { GradeTaskSubmissionPayload, TaskDetail, TaskSubmission } from '@/features/tasks/types/task'
import PageLoading from '@/shared/components/feedback/PageLoading'
import { uiMessage } from '@/shared/components/feedback/message'
import { ROUTES } from '@/shared/constants/routes'
import WorkspaceLayout from '@/shared/layout/WorkspaceLayout'
import useResponsiveLayout from '@/shared/layout/useResponsiveLayout'

function supportsQuestionPreview(taskType: TaskDetail['type']) {
  return taskType === 'homework' || taskType === 'quiz'
}

export default function TaskDetailPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { id = '' } = useParams()
  const currentUser = useAuthStore((state) => state.currentUser)
  const isTeacherView = currentUser?.role === 'teacher' || currentUser?.role === 'admin'
  const { isMobile } = useResponsiveLayout()

  const [submissionPage, setSubmissionPage] = useState(1)
  const [submissionPageSize, setSubmissionPageSize] = useState(10)
  const [gradingTarget, setGradingTarget] = useState<TaskSubmission | null>(null)
  const submissionPanelRef = useRef<HTMLDivElement | null>(null)

  const { data: task, isLoading: isTaskLoading } = useQuery({
    queryKey: ['task', id],
    queryFn: () => taskService.getTaskById(id),
    enabled: Boolean(id),
  })

  const shouldLoadQuestions = Boolean(task && supportsQuestionPreview(task.type))

  const { data: taskQuestions = [], isLoading: isQuestionsLoading } = useQuery({
    queryKey: ['task-questions', id],
    queryFn: () => taskService.getTaskQuestions(id),
    enabled: shouldLoadQuestions,
  })

  const { data: submission, isLoading: isSubmissionLoading } = useQuery({
    queryKey: ['task-submission', id],
    queryFn: () => taskService.getCurrentSubmission(id),
    enabled: Boolean(id) && !isTeacherView,
  })

  const { data: submissionsPage, isLoading: isSubmissionsLoading } = useQuery({
    queryKey: ['task-submissions', id, submissionPage, submissionPageSize],
    queryFn: () => taskService.getTaskSubmissions(id, submissionPage, submissionPageSize),
    enabled: Boolean(id) && isTeacherView,
  })

  const gradeMutation = useMutation({
    mutationFn: (payload: GradeTaskSubmissionPayload) => taskService.gradeSubmission(id, payload),
    onSuccess: async () => {
      uiMessage.success('评分已保存')
      setGradingTarget(null)
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['task', id] }),
        queryClient.invalidateQueries({ queryKey: ['task-submissions', id] }),
        queryClient.invalidateQueries({ queryKey: ['tasks'] }),
      ])
    },
    onError: () => {
      uiMessage.error('评分失败')
    },
  })

  const deleteMutation = useMutation({
    mutationFn: () => taskService.deleteTask(id),
    onSuccess: async () => {
      uiMessage.success('任务已删除')
      await queryClient.invalidateQueries({ queryKey: ['tasks'] })
      navigate('/tasks', { replace: true })
    },
    onError: () => {
      uiMessage.error('删除任务失败')
    },
  })

  if (
    (isTaskLoading || (!isTeacherView && isSubmissionLoading) || (isTeacherView && isSubmissionsLoading)) &&
    !task
  ) {
    return <PageLoading />
  }

  if (!task) {
    return <Navigate to="/tasks" replace />
  }

  const studentActionText =
    submission?.status === 'graded' ? '查看评分' : submission?.status === 'submitted' ? '查看提交' : '去完成'

  return (
    <div className="space-y-6 lg:space-y-8">
      <TaskDetailHeroSection
        task={task}
        isTeacherView={isTeacherView}
        studentActionText={studentActionText}
        deleting={deleteMutation.isPending}
        onBackToList={() => navigate('/tasks')}
        onEditTask={() => navigate(`/tasks/${id}/edit`)}
        onDeleteTask={() => deleteMutation.mutate()}
        onScrollToSubmission={() =>
          submissionPanelRef.current?.scrollIntoView({
            behavior: 'smooth',
            block: 'start',
          })
        }
      />

      <WorkspaceLayout
        preset="course"
        mainClassName="w-full space-y-5"
        aside={
          <TaskResourcesAside
            task={task}
            onDownloadAttachment={(attachment) => void taskService.downloadTaskAttachment(task.id, attachment)}
            onOpenRelatedResource={(resourceId) =>
              navigate(`${ROUTES.COURSE_RESOURCES(task.courseId)}?resourceId=${encodeURIComponent(resourceId)}`)
            }
          />
        }
      >
        {isTeacherView && shouldLoadQuestions ? (
          <section className="app-panel px-4 py-4 sm:px-6 xl:px-7">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-stone-950">题目列表</h2>
              <span className="text-sm text-stone-400">{taskQuestions.length} 题</span>
            </div>
            <TaskQuestionList
              questions={taskQuestions}
              loading={isQuestionsLoading}
              showAnswer={isTeacherView}
              emptyText="当前还没有配置题目"
            />
          </section>
        ) : null}

        {isTeacherView ? (
          <TeacherSubmissionsSection
            isMobile={isMobile}
            submissionsPage={submissionsPage}
            submissionPage={submissionPage}
            submissionPageSize={submissionPageSize}
            onOpenGrading={(target) => setGradingTarget(target)}
            onPageChange={(nextPage, nextPageSize) => {
              setSubmissionPage(nextPage)
              setSubmissionPageSize(nextPageSize)
            }}
          />
        ) : (
          <div ref={submissionPanelRef}>
            <TaskSubmissionPanel
              key={`${submission?.updatedAt ?? 'draft'}-${taskQuestions.map((item) => item.id).join(',')}`}
              task={task}
              submission={submission}
              taskQuestions={taskQuestions}
              onSubmit={async (values) => {
                await taskService.submitTask(id, values)
                uiMessage.success('任务提交成功')
                await Promise.all([
                  queryClient.invalidateQueries({ queryKey: ['task', id] }),
                  queryClient.invalidateQueries({ queryKey: ['task-submission', id] }),
                  queryClient.invalidateQueries({ queryKey: ['tasks'] }),
                ])
              }}
            />
          </div>
        )}
      </WorkspaceLayout>

      <TaskGradingModal
        open={Boolean(gradingTarget)}
        task={task}
        submission={gradingTarget}
        taskQuestions={taskQuestions}
        loading={gradeMutation.isPending}
        onCancel={() => setGradingTarget(null)}
        onSubmit={(payload) => gradeMutation.mutate(payload)}
      />
    </div>
  )
}
