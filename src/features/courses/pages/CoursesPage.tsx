import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Button, Dropdown, Empty, Modal, Segmented } from 'antd'
import type { MenuProps } from 'antd'
import { MoreOutlined, PlusOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import CourseFormModal from '@/features/courses/components/CourseFormModal'
import { courseService } from '@/features/courses/services/course.service'
import type { CourseDetail, CourseFormValues, CourseSummary } from '@/features/courses/types/course'
import { useAuthStore } from '@/features/auth/store/auth.store'
import { uiMessage } from '@/shared/components/feedback/message'

type FilterValue = 'all' | 'active' | 'archived'

export default function CoursesPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const currentUser = useAuthStore((state) => state.currentUser)
  const canManageCourses = currentUser?.role === 'teacher' || currentUser?.role === 'admin'

  const [filter, setFilter] = useState<FilterValue>('all')
  const [formMode, setFormMode] = useState<'create' | 'edit'>('create')
  const [formOpen, setFormOpen] = useState(false)
  const [currentCourse, setCurrentCourse] = useState<CourseDetail | CourseSummary | null>(null)
  const [pendingDeleteCourse, setPendingDeleteCourse] = useState<CourseSummary | null>(null)

  const { data: coursesPage, isLoading } = useQuery({
    queryKey: ['courses'],
    queryFn: () => courseService.getCourses(true, 1, 100),
  })
  const courses = coursesPage?.items ?? []

  const createCourseMutation = useMutation({
    mutationFn: (values: CourseFormValues) => courseService.createCourse(values),
    onSuccess: async (course) => {
      uiMessage.success('课程创建成功')
      setFormOpen(false)
      await queryClient.invalidateQueries({ queryKey: ['courses'] })
      navigate(`/courses/${course.id}`)
    },
    onError: () => {
      uiMessage.error('创建课程失败')
    },
  })

  const updateCourseMutation = useMutation({
    mutationFn: ({ courseId, values }: { courseId: string; values: CourseFormValues }) =>
      courseService.updateCourse(courseId, values),
    onSuccess: async (_, variables) => {
      uiMessage.success('课程更新成功')
      setFormOpen(false)
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['courses'] }),
        queryClient.invalidateQueries({ queryKey: ['course', variables.courseId] }),
      ])
    },
    onError: () => {
      uiMessage.error('更新课程失败')
    },
  })

  const archiveCourseMutation = useMutation({
    mutationFn: ({ courseId, isArchived }: { courseId: string; isArchived: boolean }) =>
      courseService.setCourseArchiveStatus(courseId, isArchived),
    onSuccess: async (_, variables) => {
      uiMessage.success(variables.isArchived ? '课程已归档' : '课程已恢复')
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['courses'] }),
        queryClient.invalidateQueries({ queryKey: ['course', variables.courseId] }),
      ])
    },
    onError: () => {
      uiMessage.error('更新归档状态失败')
    },
  })

  const deleteCourseMutation = useMutation({
    mutationFn: (courseId: string) => courseService.deleteCourse(courseId),
    onError: () => {
      uiMessage.error('删除课程失败')
    },
  })

  const visibleCourses = useMemo(() => {
    if (filter === 'all') return courses
    if (filter === 'active') return courses.filter((course) => !course.isArchived)
    return courses.filter((course) => course.isArchived)
  }, [courses, filter])

  const metrics = useMemo(() => {
    const activeCount = courses.filter((course) => !course.isArchived).length
    const archivedCount = courses.filter((course) => course.isArchived).length
    const taskCount = courses.reduce((total, course) => total + course.taskCount, 0)

    return [
      { label: '课程总数', value: courses.length },
      { label: '进行中课程', value: activeCount },
      { label: '已归档课程', value: archivedCount },
      { label: '课程任务总数', value: taskCount },
    ]
  }, [courses])

  const focusCourses = useMemo(
    () =>
      [...courses]
        .sort((left, right) => right.taskCount - left.taskCount || right.studentCount - left.studentCount)
        .slice(0, 3),
    [courses],
  )

  const openCreateModal = () => {
    setFormMode('create')
    setCurrentCourse(null)
    setFormOpen(true)
  }

  const openEditModal = (course: CourseSummary) => {
    setFormMode('edit')
    setCurrentCourse(course)
    setFormOpen(true)
  }

  const submitForm = (values: CourseFormValues) => {
    if (formMode === 'create') {
      createCourseMutation.mutate(values)
      return
    }

    if (!currentCourse) return

    updateCourseMutation.mutate({
      courseId: currentCourse.id,
      values,
    })
  }

  const actionItems = (course: CourseSummary): MenuProps['items'] => [
    {
      key: 'edit',
      label: '编辑课程',
      onClick: () => openEditModal(course),
    },
    {
      key: 'archive',
      label: course.isArchived ? '恢复课程' : '归档课程',
      onClick: () =>
        archiveCourseMutation.mutate({
          courseId: course.id,
          isArchived: !course.isArchived,
        }),
    },
    {
      key: 'delete',
      label: '删除课程',
      danger: true,
      onClick: () => setPendingDeleteCourse(course),
    },
  ]

  return (
    <div className="app-page">
      <section className="grid gap-6 xl:grid-cols-[minmax(0,1.6fr)_320px]">
        <div className="app-panel px-6 py-6 sm:px-8">
          <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
            <div className="min-w-0 flex-1">
              <div className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-400">
                课程空间
              </div>
              <h1 className="mt-3 text-[clamp(28px,3.8vw,40px)] font-semibold tracking-[-0.04em] text-stone-900">
                查看课程、成员与任务概况
              </h1>
            </div>

            <div className="flex w-full max-w-[320px] flex-col gap-3 rounded-[24px] border border-[rgba(255,107,53,0.1)] bg-[linear-gradient(180deg,#fff5ed_0%,#ffffff_100%)] p-4">
              <Segmented
                block
                value={filter}
                onChange={(value) => setFilter(value as FilterValue)}
                options={[
                  { label: '全部', value: 'all' },
                  { label: '进行中', value: 'active' },
                  { label: '已归档', value: 'archived' },
                ]}
              />
              {canManageCourses ? (
                <Button
                  type="primary"
                  size="large"
                  icon={<PlusOutlined />}
                  onClick={openCreateModal}
                >
                  创建课程
                </Button>
              ) : null}
            </div>
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {isLoading
              ? Array.from({ length: 4 }).map((_, index) => (
                  <div
                    key={index}
                    className="h-[118px] rounded-[24px] border border-[var(--lms-color-border)] bg-white/70"
                  />
                ))
              : metrics.map((item) => (
                  <div
                    key={item.label}
                    className="rounded-[24px] border border-[var(--lms-color-border)] bg-white/92 px-5 py-5 shadow-[0_12px_30px_rgba(28,25,23,0.05)]"
                  >
                    <div className="text-sm text-stone-500">{item.label}</div>
                    <div className="mt-3 text-3xl font-semibold tracking-[-0.03em] text-stone-900">
                      {item.value}
                    </div>
                  </div>
                ))}
          </div>
        </div>

        <aside className="app-panel bg-[linear-gradient(180deg,#fff4ec_0%,#fffdfb_100%)] px-5 py-5">
          <div className="app-section-heading">
            <h2 className="app-section-title">优先查看</h2>
          </div>
          <div className="space-y-3">
            {focusCourses.map((course) => (
              <button
                type="button"
                key={course.id}
                onClick={() => navigate(`/courses/${course.id}`)}
                className="w-full rounded-[22px] border border-[rgba(28,25,23,0.06)] bg-white/94 px-4 py-4 text-left transition hover:border-[rgba(255,107,53,0.18)]"
              >
                <div className="text-sm font-medium leading-6 text-stone-900">{course.title}</div>
                <div className="mt-1 text-xs leading-5 text-stone-500">
                  {course.teacherName} · {course.studentCount} 名成员 · {course.taskCount} 个任务
                </div>
              </button>
            ))}
          </div>
        </aside>
      </section>

      <section className="app-panel overflow-hidden">
        <div className="border-b border-[var(--lms-color-border)] px-6 py-5 sm:px-8">
          <h2 className="text-xl font-semibold tracking-[-0.02em] text-stone-900">课程列表</h2>
        </div>

        <div className="divide-y divide-[var(--lms-color-border)]">
          {!isLoading && visibleCourses.length === 0 ? (
            <div className="px-6 py-10 sm:px-8">
              <Empty description="当前筛选下暂无课程" />
            </div>
          ) : null}

          {visibleCourses.map((course) => (
            <div
              key={course.id}
              role="button"
              tabIndex={0}
              onClick={() => navigate(`/courses/${course.id}`)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault()
                  navigate(`/courses/${course.id}`)
                }
              }}
              className="group grid cursor-pointer gap-6 px-6 py-6 transition hover:bg-[#fffaf6] focus-visible:bg-[#fffaf6] focus-visible:outline-none sm:px-8 lg:grid-cols-[minmax(0,1.55fr)_minmax(320px,0.95fr)]"
            >
              <div className="min-w-0">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      {course.courseCode ? (
                        <span className="rounded-full bg-[var(--lms-color-primary-soft)] px-3 py-1 text-[11px] font-semibold text-orange-600">
                          {course.courseCode}
                        </span>
                      ) : null}
                      {course.semester ? (
                        <span className="rounded-full border border-[var(--lms-color-border)] px-3 py-1 text-[11px] font-medium text-stone-500">
                          {course.semester}
                        </span>
                      ) : null}
                      <span
                        className={[
                          'rounded-full px-3 py-1 text-[11px] font-medium',
                          course.isArchived ? 'bg-stone-100 text-stone-500' : 'bg-emerald-50 text-emerald-600',
                        ].join(' ')}
                      >
                        {course.isArchived ? '已归档' : '进行中'}
                      </span>
                    </div>

                    <div className="mt-3 text-2xl font-semibold tracking-[-0.03em] text-stone-900 transition group-hover:text-orange-600">
                      <span className="truncate">{course.title}</span>
                    </div>
                  </div>

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
                          className="h-10 w-10 rounded-full border border-[rgba(28,25,23,0.06)] bg-white/88 text-stone-500 shadow-none transition hover:border-[rgba(255,107,53,0.18)] hover:bg-white hover:text-stone-900 sm:opacity-0 sm:group-hover:opacity-100"
                        />
                      </Dropdown>
                    </div>
                  ) : null}
                </div>

                <div className="mt-2 line-clamp-2 text-sm leading-6 text-stone-500">
                  {course.description || '暂无课程说明'}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-sm text-stone-500 sm:grid-cols-4 lg:grid-cols-2">
                <div>
                  <div className="text-xs uppercase tracking-[0.16em] text-stone-400">教师</div>
                  <div className="mt-2 font-medium text-stone-900">{course.teacherName}</div>
                </div>
                <div>
                  <div className="text-xs uppercase tracking-[0.16em] text-stone-400">成员</div>
                  <div className="mt-2 font-medium text-stone-900">{course.studentCount} 人</div>
                </div>
                <div>
                  <div className="text-xs uppercase tracking-[0.16em] text-stone-400">任务</div>
                  <div className="mt-2 font-medium text-stone-900">{course.taskCount} 个</div>
                </div>
                <div>
                  <div className="text-xs uppercase tracking-[0.16em] text-stone-400">学分</div>
                  <div className="mt-2 font-medium text-stone-900">{course.credits ?? '-'}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <CourseFormModal
        open={formOpen}
        mode={formMode}
        loading={createCourseMutation.isPending || updateCourseMutation.isPending}
        initialValues={currentCourse}
        onCancel={() => setFormOpen(false)}
        onSubmit={submitForm}
      />

      <Modal
        open={Boolean(pendingDeleteCourse)}
        title="删除课程"
        okText="删除"
        cancelText="取消"
        okButtonProps={{ danger: true, loading: deleteCourseMutation.isPending }}
        onCancel={() => setPendingDeleteCourse(null)}
        onOk={() => {
          if (!pendingDeleteCourse) return
          deleteCourseMutation.mutate(pendingDeleteCourse.id, {
            onSuccess: async () => {
              setPendingDeleteCourse(null)
              uiMessage.success('课程已删除')
              await queryClient.invalidateQueries({ queryKey: ['courses'] })
            },
          })
        }}
      >
        <p className="text-sm leading-7 text-stone-500">
          删除后课程、成员关系与任务关联将一起移除，请确认是否继续。
        </p>
      </Modal>
    </div>
  )
}
