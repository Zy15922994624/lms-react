import { Button, Empty, Input } from 'antd'
import type { CourseSummary } from '@/features/courses/types/course'
import { workspacePanelPadding } from '@/shared/layout/workspace-tokens'
import { formatUpdatedAt } from '@/features/courses/components/courses-page/utils'

interface CoursesFocusAsideProps {
  canManageCourses: boolean
  recentCourses: CourseSummary[]
  availableCourses: CourseSummary[]
  joinKeyword: string
  isAvailableCoursesLoading: boolean
  joiningCourseId?: string
  onJoinKeywordChange: (value: string) => void
  onOpenCourse: (courseId: string) => void
  onJoinCourse: (courseId: string) => void
}

export default function CoursesFocusAside({
  canManageCourses,
  recentCourses,
  availableCourses,
  joinKeyword,
  isAvailableCoursesLoading,
  joiningCourseId,
  onJoinKeywordChange,
  onOpenCourse,
  onJoinCourse,
}: CoursesFocusAsideProps) {
  if (canManageCourses) {
    return (
      <div className={`app-panel ${workspacePanelPadding.asideWarm}`}>
        <div className="app-section-heading">
          <h2 className="app-section-title">最近更新</h2>
        </div>
        <div className="max-h-[560px] space-y-3 overflow-y-auto pr-1">
          {recentCourses.map((course) => (
            <button
              type="button"
              key={course.id}
              onClick={() => onOpenCourse(course.id)}
              className="w-full rounded-[18px] border border-[rgba(28,25,23,0.06)] bg-white/94 px-4 py-3 text-left transition hover:border-[rgba(255,107,53,0.18)]"
            >
              <div className="text-sm font-medium leading-6 text-stone-900">{course.title}</div>
              <div className="mt-1 text-xs leading-5 text-stone-500">
                {course.teacherName} · 更新于 {formatUpdatedAt(course.updatedAt)}
              </div>
            </button>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className={`app-panel ${workspacePanelPadding.asideWarm}`}>
      <div className="app-section-heading">
        <h2 className="app-section-title">可加入课程</h2>
      </div>
      <Input.Search
        placeholder="搜索课程名或课程代码"
        allowClear
        value={joinKeyword}
        onChange={(event) => onJoinKeywordChange(event.target.value)}
        className="mb-4"
      />
      <div className="max-h-[560px] space-y-3 overflow-y-auto pr-1">
        {!isAvailableCoursesLoading && availableCourses.length === 0 ? (
          <Empty description="暂无可加入课程" image={Empty.PRESENTED_IMAGE_SIMPLE} />
        ) : null}

        {availableCourses.map((course) => (
          <div
            key={course.id}
            className="rounded-[18px] border border-[rgba(28,25,23,0.06)] bg-white/94 px-4 py-3"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="truncate text-sm font-medium leading-6 text-stone-900">
                  {course.title}
                </div>
                <div className="mt-1 text-xs leading-5 text-stone-500">
                  {course.teacherName}
                  {course.courseCode ? ` · ${course.courseCode}` : ''}
                </div>
              </div>
              <Button
                type="primary"
                size="small"
                loading={joiningCourseId === course.id}
                onClick={() => onJoinCourse(course.id)}
              >
                加入
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
