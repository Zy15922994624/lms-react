import { useEffect, useMemo, useRef, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Modal } from 'antd'
import type { MenuProps } from 'antd'
import { useNavigate } from 'react-router-dom'
import CourseFormModal from '@/features/courses/components/CourseFormModal'
import CoursesToolbar, {
  type FilterValue,
} from '@/features/courses/components/courses-page/CoursesToolbar'
import CoursesListPanel from '@/features/courses/components/courses-page/CoursesListPanel'
import CoursesFocusAside from '@/features/courses/components/courses-page/CoursesFocusAside'
import { courseService } from '@/features/courses/services/course.service'
import type { CourseDetail, CourseFormValues, CourseSummary } from '@/features/courses/types/course'
import { useAuthStore } from '@/features/auth/store/auth.store'
import { uiMessage } from '@/shared/components/feedback/message'
import useResponsiveLayout from '@/shared/layout/useResponsiveLayout'
import WorkspaceLayout from '@/shared/layout/WorkspaceLayout'
import { invalidateQueryKeys } from '@/shared/utils/invalidate-query-keys'

const EMPTY_COURSES: CourseSummary[] = []

export default function CoursesPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { isMobile, mobileModalWidth } = useResponsiveLayout()
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
      await invalidateQueryKeys(queryClient, [
        ['courses'],
        ['course', variables.courseId],
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
      await invalidateQueryKeys(queryClient, [
        ['courses'],
        ['course', variables.courseId],
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
      await invalidateQueryKeys(queryClient, [
        ['courses'],
        ['available-courses'],
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
          (left, right) => new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime(),
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

  return (
    <div className="app-page">
      <WorkspaceLayout
        preset="dashboard"
        aside={
          <CoursesFocusAside
            canManageCourses={canManageCourses}
            recentCourses={recentCourses}
            availableCourses={availableCourses}
            joinKeyword={joinKeyword}
            isAvailableCoursesLoading={isAvailableCoursesLoading}
            joiningCourseId={
              joinCourseMutation.isPending ? String(joinCourseMutation.variables ?? '') : undefined
            }
            onJoinKeywordChange={setJoinKeyword}
            onOpenCourse={(courseId) => navigate(`/courses/${courseId}`)}
            onJoinCourse={(courseId) => joinCourseMutation.mutate(courseId)}
          />
        }
        mainClassName="app-panel overflow-hidden"
      >
        <CoursesToolbar
          isStudentView={isStudentView}
          coursesCount={courses.length}
          searchKeyword={searchKeyword}
          filter={filter}
          canManageCourses={canManageCourses}
          onSearchKeywordChange={(value) => {
            setSearchKeyword(value)
            setVisibleCount(10)
          }}
          onFilterChange={(value) => {
            setFilter(value)
            setVisibleCount(10)
          }}
          onOpenCreateModal={openCreateModal}
        />

        <CoursesListPanel
          isLoading={isLoading}
          visibleCourses={visibleCourses}
          displayedCourses={displayedCourses}
          hasMoreCourses={hasMoreCourses}
          canManageCourses={canManageCourses}
          listScrollRef={listScrollRef}
          listSentinelRef={listSentinelRef}
          onOpenCourse={(courseId) => navigate(`/courses/${courseId}`)}
          actionItems={actionItems}
        />
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
        width={isMobile ? mobileModalWidth : undefined}
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
        <p className="text-sm leading-7 text-stone-500">确定要删除课程吗?</p>
      </Modal>
    </div>
  )
}
