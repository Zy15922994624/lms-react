import { Navigate, useNavigate, useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Button } from 'antd'
import CourseWorkspaceFrame from '@/features/courses/components/CourseWorkspaceFrame'
import { courseService } from '@/features/courses/services/course.service'
import { ROUTES } from '@/shared/constants/routes'
import PageLoading from '@/shared/components/feedback/PageLoading'
import WorkspaceLayout from '@/shared/layout/WorkspaceLayout'
import { workspacePanelPadding } from '@/shared/layout/workspace-tokens'

export default function CourseDiscussionsPage() {
  const navigate = useNavigate()
  const { courseId = '' } = useParams()
  const { data: course, isLoading } = useQuery({
    queryKey: ['course', courseId],
    queryFn: () => courseService.getCourseById(courseId),
  })

  if (isLoading) {
    return <PageLoading />
  }

  if (!course) {
    return <Navigate to={ROUTES.COURSES} replace />
  }

  const statusAside = (
    <section className={`app-panel ${workspacePanelPadding.aside}`}>
      <div className="app-section-heading">
        <h2 className="app-section-title">当前状态</h2>
      </div>
      <div className="space-y-4 text-sm text-stone-500">
        <div className="flex items-center justify-between gap-4">
          <span>模块状态</span>
          <span className="font-medium text-stone-900">待实现</span>
        </div>
        <div className="flex items-center justify-between gap-4">
          <span>页面宽度</span>
          <span className="font-medium text-stone-900">已接入宽屏规则</span>
        </div>
      </div>
    </section>
  )

  return (
    <CourseWorkspaceFrame course={course}>
      <WorkspaceLayout preset="course" aside={statusAside}>
        <div className={`app-panel ${workspacePanelPadding.sectionWide}`}>
          <div className="max-w-4xl 2xl:max-w-6xl">
            <div className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-400">
              课程讨论
            </div>
            <h2 className="mt-3 text-3xl font-semibold tracking-[-0.03em] text-stone-900">
              讨论工作区
            </h2>
            <p className="mt-4 text-sm leading-7 text-stone-500">
              当前先保留讨论入口和课程上下文，后续会在这里接入讨论列表、发帖与回复能力。
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Button onClick={() => navigate(ROUTES.COURSES)}>返回课程列表</Button>
            </div>
          </div>
        </div>
      </WorkspaceLayout>
    </CourseWorkspaceFrame>
  )
}
