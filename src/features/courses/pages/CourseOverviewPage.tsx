import { useState } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Button, Dropdown, Modal } from 'antd'
import type { MenuProps } from 'antd'
import { MoreOutlined } from '@ant-design/icons'
import CourseWorkspaceFrame from '@/features/courses/components/CourseWorkspaceFrame'
import CourseFormModal from '@/features/courses/components/CourseFormModal'
import { courseService } from '@/features/courses/services/course.service'
import type { CourseDetail, CourseFormValues, CoursesPage } from '@/features/courses/types/course'
import { useAuthStore } from '@/features/auth/store/auth.store'
import { ROUTES } from '@/shared/constants/routes'
import PageLoading from '@/shared/components/feedback/PageLoading'
import { uiMessage } from '@/shared/components/feedback/message'
import useResponsiveLayout from '@/shared/layout/useResponsiveLayout'
import WorkspaceLayout from '@/shared/layout/WorkspaceLayout'
import { workspacePanelPadding } from '@/shared/layout/workspace-tokens'
import { invalidateQueryKeys } from '@/shared/utils/invalidate-query-keys'

export default function CourseOverviewPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { isMobile, mobileModalWidth } = useResponsiveLayout()
  const { courseId = '' } = useParams()
  const currentUser = useAuthStore((state) => state.currentUser)
  const canManageCourse = currentUser?.role === 'teacher' || currentUser?.role === 'admin'
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false)

  const { data: course, isLoading } = useQuery({
    queryKey: ['course', courseId],
    queryFn: () => courseService.getCourseById(courseId),
    enabled: Boolean(courseId),
  })

  const syncCourseCaches = (updatedCourse: CourseDetail) => {
    queryClient.setQueryData<CourseDetail>(['course', courseId], updatedCourse)
    queryClient.setQueryData<CoursesPage>(['courses'], (previous) => {
      if (!previous) return previous

      return {
        ...previous,
        items: previous.items.map((item) => (item.id === updatedCourse.id ? updatedCourse : item)),
      }
    })
  }

  const updateCourseMutation = useMutation({
    mutationFn: (values: CourseFormValues) => courseService.updateCourse(courseId, values),
    onSuccess: async (updatedCourse) => {
      uiMessage.success('课程更新成功')
      setIsEditModalOpen(false)
      syncCourseCaches(updatedCourse)
    },
    onError: () => {
      uiMessage.error('课程更新失败')
    },
  })

  const archiveCourseMutation = useMutation({
    mutationFn: (isArchived: boolean) => courseService.setCourseArchiveStatus(courseId, isArchived),
    onSuccess: async (_, isArchived) => {
      uiMessage.success(isArchived ? '课程已归档' : '课程已恢复')
      await invalidateQueryKeys(queryClient, [
        ['course', courseId],
        ['courses'],
      ])
    },
    onError: () => {
      uiMessage.error('更新归档状态失败')
    },
  })

  const deleteCourseMutation = useMutation({
    mutationFn: () => courseService.deleteCourse(courseId),
    onSuccess: async () => {
      uiMessage.success('课程已删除')
      await queryClient.invalidateQueries({ queryKey: ['courses'] })
      navigate(ROUTES.COURSES, { replace: true })
    },
    onError: () => {
      uiMessage.error('删除课程失败')
    },
  })

  if (isLoading) {
    return <PageLoading />
  }

  if (!course) {
    return <Navigate to={ROUTES.COURSES} replace />
  }

  const managementMenuItems: MenuProps['items'] = [
    {
      key: 'edit',
      label: '编辑课程',
      onClick: () => setIsEditModalOpen(true),
    },
    {
      key: 'archive',
      label: course.isArchived ? '恢复课程' : '归档课程',
      onClick: () => archiveCourseMutation.mutate(!course.isArchived),
    },
    {
      key: 'delete',
      label: '删除课程',
      danger: true,
      onClick: () => setIsDeleteConfirmOpen(true),
    },
  ]

  const infoAside = (
    <section className={`app-panel ${workspacePanelPadding.aside}`}>
      <div className="app-section-heading">
        <h2 className="app-section-title">课程信息</h2>
      </div>
      <dl className="space-y-4 text-sm">
        <div className="flex items-center justify-between gap-4">
          <dt className="text-stone-500">课程编号</dt>
          <dd className="font-medium text-stone-900">{course.courseCode || '-'}</dd>
        </div>
        <div className="flex items-center justify-between gap-4">
          <dt className="text-stone-500">当前学期</dt>
          <dd className="font-medium text-stone-900">{course.semester || '-'}</dd>
        </div>
        <div className="flex items-center justify-between gap-4">
          <dt className="text-stone-500">课程学分</dt>
          <dd className="font-medium text-stone-900">{course.credits ?? '-'}</dd>
        </div>
        <div className="flex items-center justify-between gap-4">
          <dt className="text-stone-500">更新时间</dt>
          <dd className="font-medium text-stone-900">
            {new Date(course.updatedAt).toLocaleDateString('zh-CN')}
          </dd>
        </div>
      </dl>
    </section>
  )

  return (
    <CourseWorkspaceFrame
      course={course}
      headerActions={
        canManageCourse ? (
          <Dropdown menu={{ items: managementMenuItems }} trigger={['click']}>
            <Button
              type="text"
              icon={<MoreOutlined />}
              className="h-11 rounded-full border border-[rgba(28,25,23,0.06)] bg-white/90 px-4 text-stone-600 shadow-none transition hover:border-[rgba(255,107,53,0.18)] hover:bg-white hover:text-stone-900"
            >
              管理课程
            </Button>
          </Dropdown>
        ) : null
      }
    >
      <WorkspaceLayout preset="course" aside={infoAside}>
        <div className={`app-panel ${workspacePanelPadding.sectionWide}`}>
          <div className="app-section-heading">
            <h2 className="app-section-title">课程说明</h2>
          </div>
          <div className="max-w-4xl text-sm leading-7 text-stone-500 2xl:max-w-6xl">
            {course.description || '暂无课程说明。'}
          </div>
        </div>
      </WorkspaceLayout>

      <CourseFormModal
        open={isEditModalOpen}
        mode="edit"
        loading={updateCourseMutation.isPending}
        initialValues={course}
        onCancel={() => setIsEditModalOpen(false)}
        onSubmit={(values) => updateCourseMutation.mutateAsync(values)}
      />

      <Modal
        open={isDeleteConfirmOpen}
        title="删除课程"
        width={isMobile ? mobileModalWidth : undefined}
        okText="删除"
        cancelText="取消"
        okButtonProps={{ danger: true, loading: deleteCourseMutation.isPending }}
        onCancel={() => setIsDeleteConfirmOpen(false)}
        onOk={() => {
          deleteCourseMutation.mutate(undefined, {
            onSuccess: async () => {
              setIsDeleteConfirmOpen(false)
              uiMessage.success('课程已删除')
              await queryClient.invalidateQueries({ queryKey: ['courses'] })
              navigate(ROUTES.COURSES, { replace: true })
            },
          })
        }}
      >
        <p className="text-sm leading-7 text-stone-500">
          删除后课程、成员关系与任务关联将一起移除，请确认是否继续。
        </p>
      </Modal>
    </CourseWorkspaceFrame>
  )
}
