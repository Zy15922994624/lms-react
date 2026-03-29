import { Navigate, useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Button } from 'antd'
import CourseWorkspaceFrame from '@/features/courses/components/CourseWorkspaceFrame'
import { courseService } from '@/features/courses/services/course.service'
import { ROUTES } from '@/shared/constants/routes'
import PageLoading from '@/shared/components/feedback/PageLoading'

export default function CourseDiscussionsPage() {
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

  return (
    <CourseWorkspaceFrame course={course}>
      <section className="app-panel px-6 py-6 sm:px-8">
        <div className="max-w-2xl">
          <div className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-400">课程讨论</div>
          <h2 className="mt-3 text-3xl font-semibold tracking-[-0.03em] text-stone-900">讨论工作区</h2>
          <p className="mt-4 text-sm leading-7 text-stone-500">
            讨论模块后续会在这里接入。当前先保留课程上下文和入口位置。
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Button onClick={() => history.back()}>返回课程概览</Button>
          </div>
        </div>
      </section>
    </CourseWorkspaceFrame>
  )
}
