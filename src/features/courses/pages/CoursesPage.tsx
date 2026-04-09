import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect, useRef } from 'react'
import { Button, Dropdown, Empty, Input, Modal, Segmented } from 'antd'
import type { MenuProps } from 'antd'
import { MoreOutlined, PlusOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import CourseFormModal from '@/features/courses/components/CourseFormModal'
import { courseService } from '@/features/courses/services/course.service'
import type { CourseDetail, CourseFormValues, CourseSummary } from '@/features/courses/types/course'
import { useAuthStore } from '@/features/auth/store/auth.store'
import { uiMessage } from '@/shared/components/feedback/message'
import WorkspaceLayout from '@/shared/layout/WorkspaceLayout'
import { workspacePanelPadding } from '@/shared/layout/workspace-tokens'

type FilterValue = 'all' | 'active' | 'archived'
const EMPTY_COURSES: CourseSummary[] = []

function formatUpdatedAt(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return '-'
  }

  return new Intl.DateTimeFormat('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(date)
}

export default function CoursesPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const currentUser = useAuthStore((state) => state.currentUser)
  const canManageCourses = currentUser?.role === 'teacher' || currentUser?.role === 'admin'
  const isStudentView = currentUser?.role === 'student'

  const [filter, setFilter] = useState<FilterValue>('all')
  const [searchKeyword, setSearchKeyword] = useState('')
  const [joinKeyword, setJoinKeyword] = useState('')
  const [visibleCount, setVisibleCount] = useState(10)
  const [formMode, setFormMode] = useState<'create' | 'edit'>('create')
  const [formOpen, setFormOpen] = useState(false)
  const [currentCourse, setCurrentCourse] = useState<CourseDetail | CourseSummary | null>(null)
  const [pendingDeleteCourse, setPendingDeleteCourse] = useState<CourseSummary | null>(null)
  const listScrollRef = useRef<HTMLDivElement | null>(null)
  const listSentinelRef = useRef<HTMLDivElement | null>(null)

  const { data: coursesPage, isLoading } = useQuery({
    queryKey: ['courses'],
    queryFn: () => courseService.getCourses(true, 1, 100),
  })
  const courses = useMemo(() => coursesPage?.items ?? EMPTY_COURSES, [coursesPage])

  const { data: availableCourses = [], isLoading: isAvailableCoursesLoading } = useQuery({
    queryKey: ['available-courses', joinKeyword],
    queryFn: () => courseService.getAvailableCourses(joinKeyword.trim() || undefined),
    enabled: isStudentView,
  })

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

  const joinCourseMutation = useMutation({
    mutationFn: (courseId: string) => courseService.joinCourse(courseId),
    onSuccess: async () => {
      uiMessage.success('已加入课程')
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['courses'] }),
        queryClient.invalidateQueries({ queryKey: ['available-courses'] }),
      ])
    },
    onError: () => {
      uiMessage.error('加入课程失败')
    },
  })

  const visibleCourses = useMemo(() => {
    const normalizedKeyword = searchKeyword.trim().toLowerCase()
    const filteredByStatus =
      filter === 'all'
        ? courses
        : courses.filter((course) => (filter === 'active' ? !course.isArchived : course.isArchived))

    if (!normalizedKeyword) {
      return filteredByStatus
    }

    return filteredByStatus.filter((course) =>
      [course.title, course.teacherName, course.courseCode ?? '']
        .join(' ')
        .toLowerCase()
        .includes(normalizedKeyword),
    )
  }, [courses, filter, searchKeyword])

  const recentCourses = useMemo(
    () =>
      [...courses]
        .sort(
          (left, right) =>
            new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime(),
        )
        .slice(0, 3),
    [courses],
  )

  const displayedCourses = useMemo(
    () => visibleCourses.slice(0, visibleCount),
    [visibleCourses, visibleCount],
  )

  const hasMoreCourses = displayedCourses.length < visibleCourses.length

  useEffect(() => {
    const root = listScrollRef.current
    const target = listSentinelRef.current

    if (!root || !target || !hasMoreCourses) {
      return
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries
        if (!entry?.isIntersecting) {
          return
        }

        setVisibleCount((current) => Math.min(current + 10, visibleCourses.length))
      },
      {
        root,
        rootMargin: '0px 0px 120px 0px',
        threshold: 0.1,
      },
    )

    observer.observe(target)

    return () => observer.disconnect()
  }, [hasMoreCourses, visibleCourses.length])

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

  const submitForm = async (values: CourseFormValues) => {
    if (formMode === 'create') {
      await createCourseMutation.mutateAsync(values)
      return
    }

    if (!currentCourse) return

    await updateCourseMutation.mutateAsync({
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

  const focusAside = canManageCourses ? (
    <div className={`app-panel ${workspacePanelPadding.asideWarm}`}>
      <div className="app-section-heading">
        <h2 className="app-section-title">最近更新</h2>
      </div>
      <div className="max-h-[560px] space-y-3 overflow-y-auto pr-1">
        {recentCourses.map((course) => (
          <button
            type="button"
            key={course.id}
            onClick={() => navigate(`/courses/${course.id}`)}
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
  ) : (
    <div className={`app-panel ${workspacePanelPadding.asideWarm}`}>
      <div className="app-section-heading">
        <h2 className="app-section-title">可加入课程</h2>
      </div>
      <Input.Search
        placeholder="搜索课程名或课程代码"
        allowClear
        value={joinKeyword}
        onChange={(event) => setJoinKeyword(event.target.value)}
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
                loading={joinCourseMutation.isPending && joinCourseMutation.variables === course.id}
                onClick={() => joinCourseMutation.mutate(course.id)}
              >
                加入
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )

  return (
    <div className="app-page">
      <WorkspaceLayout
        preset="dashboard"
        aside={focusAside}
        mainClassName="app-panel overflow-hidden"
      >
        <div className="flex flex-col gap-4 border-b border-[var(--lms-color-border)] px-6 py-5 sm:px-8 xl:flex-row xl:items-center xl:justify-between xl:px-9 xl:py-6 2xl:px-10">
          <div className="min-w-0">
            <h1 className="text-2xl font-semibold tracking-[-0.03em] text-stone-900">课程</h1>
            <div className="mt-1 text-sm text-stone-500">
              {isStudentView ? `已加入 ${courses.length} 门课程` : `共 ${courses.length} 门课程`}
            </div>
          </div>

          <div className="flex flex-col gap-3 xl:w-auto xl:flex-row xl:items-center">
            <Input
              allowClear
              value={searchKeyword}
              onChange={(event) => {
                setSearchKeyword(event.target.value)
                setVisibleCount(10)
              }}
              placeholder="搜索课程名、教师或课程代码"
              className="xl:w-[280px] 2xl:w-[320px]"
            />
            <Segmented
              value={filter}
              onChange={(value) => {
                setFilter(value as FilterValue)
                setVisibleCount(10)
              }}
              options={[
                { label: '全部', value: 'all' },
                { label: '进行中', value: 'active' },
                { label: '已归档', value: 'archived' },
              ]}
            />
            {canManageCourses ? (
              <Button type="primary" icon={<PlusOutlined />} onClick={openCreateModal}>
                创建课程
              </Button>
            ) : null}
          </div>
        </div>

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
                onClick={() => navigate(`/courses/${course.id}`)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault()
                    navigate(`/courses/${course.id}`)
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
                    <div onClick={(event) => event.stopPropagation()} onKeyDown={(event) => event.stopPropagation()}>
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
                      <div onClick={(event) => event.stopPropagation()} onKeyDown={(event) => event.stopPropagation()}>
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
      </WorkspaceLayout>

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
