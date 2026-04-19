import { Button, Dropdown, Empty } from 'antd'
import type { MenuProps } from 'antd'
import { MoreOutlined } from '@ant-design/icons'
import type { RefObject } from 'react'
import type { CourseSummary } from '@/features/courses/types/course'
import { formatUpdatedAt } from '@/features/courses/components/courses-page/utils'
import { hasActiveTextSelection } from '@/shared/utils/selection'

interface CoursesListPanelProps {
  isLoading: boolean
  visibleCourses: CourseSummary[]
  displayedCourses: CourseSummary[]
  hasMoreCourses: boolean
  canManageCourses: boolean
  listScrollRef: RefObject<HTMLDivElement | null>
  listSentinelRef: RefObject<HTMLDivElement | null>
  onOpenCourse: (courseId: string) => void
  actionItems: (course: CourseSummary) => MenuProps['items']
}

export default function CoursesListPanel({
  isLoading,
  visibleCourses,
  displayedCourses,
  hasMoreCourses,
  canManageCourses,
  listScrollRef,
  listSentinelRef,
  onOpenCourse,
  actionItems,
}: CoursesListPanelProps) {
  return (
    <section className="overflow-hidden">
      <div className="hidden grid-cols-[minmax(0,1.8fr)_140px_120px_120px_120px_120px_64px] gap-4 border-b border-[var(--lms-color-border)] px-6 py-3 text-xs font-medium tracking-[0.08em] text-stone-400 md:grid xl:px-9 2xl:px-10">
        <div>课程</div>
        <div>教师</div>
        <div>成员</div>
        <div>任务</div>
        <div>状态</div>
        <div>更新</div>
        <div />
      </div>

      <div
        ref={listScrollRef}
        className="max-h-[560px] overflow-y-auto overscroll-contain md:max-h-[620px]"
      >
        <div className="divide-y divide-[var(--lms-color-border)]">
          {!isLoading && visibleCourses.length === 0 ? (
            <div className="px-6 py-10 sm:px-8 xl:px-9 2xl:px-10">
              <Empty description="暂无课程" />
            </div>
          ) : null}

          {displayedCourses.map((course) => (
            <div
              key={course.id}
              role="button"
              tabIndex={0}
              onClick={() => {
                if (hasActiveTextSelection()) {
                  return
                }

                onOpenCourse(course.id)
              }}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault()
                  onOpenCourse(course.id)
                }
              }}
              className="group cursor-pointer px-6 py-5 transition hover:bg-[#fffaf6] focus-visible:bg-[#fffaf6] focus-visible:outline-none sm:px-8 xl:px-9 2xl:px-10"
            >
              <div className="flex items-start justify-between gap-3 md:hidden">
                <div className="min-w-0">
                  <div className="truncate text-base font-semibold text-stone-900">{course.title}</div>
                  <div className="mt-1 text-sm text-stone-500">
                    {course.teacherName}
                    {course.courseCode ? ` · ${course.courseCode}` : ''}
                  </div>
                  <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-stone-500">
                    <span>{course.studentCount} 人</span>
                    <span>{course.taskCount} 个任务</span>
                    <span>{course.isArchived ? '已归档' : '进行中'}</span>
                    <span>{formatUpdatedAt(course.updatedAt)}</span>
                  </div>
                </div>
                {canManageCourses ? (
                  <div
                    onClick={(event) => event.stopPropagation()}
                    onKeyDown={(event) => event.stopPropagation()}
                  >
                    <Dropdown menu={{ items: actionItems(course) }} trigger={['click']}>
                      <Button icon={<MoreOutlined />} type="text" shape="circle" />
                    </Dropdown>
                  </div>
                ) : null}
              </div>

              <div className="hidden items-center gap-4 md:grid md:grid-cols-[minmax(0,1.8fr)_140px_120px_120px_120px_120px_64px]">
                <div className="min-w-0">
                  <div className="truncate text-base font-semibold text-stone-900 transition group-hover:text-orange-600">
                    {course.title}
                  </div>
                  <div className="mt-1 truncate text-sm text-stone-500">
                    {course.courseCode ?? course.semester ?? '—'}
                  </div>
                </div>
                <div className="truncate text-sm text-stone-600">{course.teacherName}</div>
                <div className="text-sm text-stone-600">{course.studentCount} 人</div>
                <div className="text-sm text-stone-600">{course.taskCount} 个</div>
                <div>
                  <span
                    className={[
                      'rounded-full px-2.5 py-1 text-xs font-medium',
                      course.isArchived ? 'bg-stone-100 text-stone-500' : 'bg-emerald-50 text-emerald-600',
                    ].join(' ')}
                  >
                    {course.isArchived ? '已归档' : '进行中'}
                  </span>
                </div>
                <div className="text-sm text-stone-500">{formatUpdatedAt(course.updatedAt)}</div>
                <div className="flex justify-end">
                  {canManageCourses ? (
                    <div
                      onClick={(event) => event.stopPropagation()}
                      onKeyDown={(event) => event.stopPropagation()}
                    >
                      <Dropdown menu={{ items: actionItems(course) }} trigger={['click']}>
                        <Button
                          icon={<MoreOutlined />}
                          type="text"
                          shape="circle"
                          className="text-stone-500 transition hover:text-stone-900"
                        />
                      </Dropdown>
                    </div>
                  ) : null}
                </div>
              </div>
            </div>
          ))}

          {!isLoading && displayedCourses.length > 0 ? (
            <div className="flex items-center justify-center px-6 py-4 text-sm text-stone-400 sm:px-8 xl:px-9 2xl:px-10">
              {hasMoreCourses ? '继续向下滚动加载更多课程' : `已显示全部 ${visibleCourses.length} 门课程`}
            </div>
          ) : null}

          {hasMoreCourses ? <div ref={listSentinelRef} className="h-1 w-full" /> : null}
        </div>
      </div>
    </section>
  )
}
