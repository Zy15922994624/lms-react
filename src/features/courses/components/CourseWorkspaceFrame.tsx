import { LeftOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import CourseWorkspaceNav from '@/features/courses/components/CourseWorkspaceNav'
import type { CourseDetail } from '@/features/courses/types/course'
import { ROUTES } from '@/shared/constants/routes'

interface CourseWorkspaceFrameProps {
  course: CourseDetail
  children: React.ReactNode
  headerActions?: React.ReactNode
}

function normalizeCoverImageUrl(rawUrl?: string | null) {
  const value = rawUrl?.trim()
  if (!value) {
    return null
  }

  if (value.startsWith('/uploads/')) {
    return value
  }

  if (value.startsWith('uploads/')) {
    return `/${value}`
  }

  const uploadsPathIndex = value.lastIndexOf('/uploads/')
  if (uploadsPathIndex >= 0) {
    return value.slice(uploadsPathIndex)
  }

  return value
}

export default function CourseWorkspaceFrame({
  course,
  children,
  headerActions,
}: CourseWorkspaceFrameProps) {
  const navigate = useNavigate()
  const coverImageUrl = normalizeCoverImageUrl(course.coverImage)

  return (
    <div className="app-page">
      <section className="app-panel px-5 py-5 sm:px-8 sm:py-6 xl:px-9 xl:py-8 2xl:px-10">
        <div className="flex flex-col gap-6 2xl:flex-row 2xl:items-start 2xl:justify-between 2xl:gap-10">
          <div className="min-w-0 flex-1 2xl:max-w-[min(100%,1320px)]">
            <button
              type="button"
              onClick={() => navigate(ROUTES.COURSES)}
              className="inline-flex items-center gap-2 text-sm font-medium text-stone-400 transition hover:text-stone-700"
            >
              <LeftOutlined className="text-xs" />
              返回课程列表
            </button>

            <div className="mt-5 flex flex-wrap items-center gap-3">
              {course.courseCode ? (
                <span className="rounded-full bg-[var(--lms-color-primary-soft)] px-3 py-1 text-xs font-semibold text-orange-600">
                  {course.courseCode}
                </span>
              ) : null}
              {course.semester ? (
                <span className="rounded-full border border-[var(--lms-color-border)] px-3 py-1 text-xs font-medium text-stone-500">
                  {course.semester}
                </span>
              ) : null}
              <span
                className={[
                  'rounded-full px-3 py-1 text-xs font-medium',
                  course.isArchived
                    ? 'bg-stone-100 text-stone-500'
                    : 'bg-emerald-50 text-emerald-600',
                ].join(' ')}
              >
                {course.isArchived ? '已归档' : '进行中'}
              </span>
            </div>

            <h1 className="mt-4 text-[clamp(30px,3vw,46px)] font-semibold tracking-[-0.04em] text-stone-900">
              {course.title}
            </h1>
            <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-stone-500 2xl:gap-x-6">
              <span>教师：{course.teacherName}</span>
              <span>成员：{course.studentCount} 人</span>
              <span>任务：{course.taskCount} 个</span>
              <span>学分：{course.credits ?? '-'}</span>
            </div>
            {course.description ? (
              <p className="mt-4 max-w-4xl text-sm leading-7 text-stone-500 2xl:max-w-6xl">
                {course.description}
              </p>
            ) : null}
          </div>

          {(headerActions || coverImageUrl) && (
            <div className="flex w-full flex-col gap-3 2xl:w-[420px] 2xl:min-w-[360px] 2xl:max-w-[440px] 2xl:items-end">
              {headerActions ? (
                <div className="self-stretch 2xl:self-auto 2xl:min-w-[240px]">{headerActions}</div>
              ) : null}
              {coverImageUrl ? (
                <div className="overflow-hidden rounded-[28px] border border-[rgba(28,25,23,0.06)] bg-[linear-gradient(180deg,#fff7f2_0%,#fffdfb_100%)] shadow-[0_18px_42px_rgba(28,25,23,0.08)]">
                  <img
                    src={coverImageUrl}
                    alt={`${course.title} 课程封面`}
                    className="h-[220px] w-full object-cover sm:h-[240px] 2xl:h-[280px]"
                  />
                </div>
              ) : null}
            </div>
          )}
        </div>

        <div className="mt-6">
          <CourseWorkspaceNav courseId={course.id} />
        </div>
      </section>

      {children}
    </div>
  )
}
