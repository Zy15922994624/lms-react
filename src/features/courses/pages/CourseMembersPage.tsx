import { useState } from 'react'
import { Navigate, useParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Avatar, Button, Popconfirm, Table, Tag } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import CourseWorkspaceFrame from '@/features/courses/components/CourseWorkspaceFrame'
import { courseService } from '@/features/courses/services/course.service'
import type { CourseMember } from '@/features/courses/types/course'
import { useAuthStore } from '@/features/auth/store/auth.store'
import { ROUTES } from '@/shared/constants/routes'
import PageLoading from '@/shared/components/feedback/PageLoading'
import { uiMessage } from '@/shared/components/feedback/message'
import useResponsiveLayout from '@/shared/layout/useResponsiveLayout'
import { workspacePanelPadding } from '@/shared/layout/workspace-tokens'

const roleLabelMap: Record<string, string> = {
  teacher: '教师',
  assistant: '助教',
  student: '学生',
  admin: '管理员',
}

export default function CourseMembersPage() {
  const { courseId = '' } = useParams()
  const queryClient = useQueryClient()
  const currentUser = useAuthStore((state) => state.currentUser)
  const canManageMembers = currentUser?.role === 'teacher' || currentUser?.role === 'admin'
  const { isMobile, isTablet } = useResponsiveLayout()
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  const { data: course, isLoading: isCourseLoading } = useQuery({
    queryKey: ['course', courseId],
    queryFn: () => courseService.getCourseById(courseId),
    enabled: Boolean(courseId),
  })

  const { data: membersPage, isLoading: isMembersLoading, isFetching: isMembersFetching } = useQuery({
    queryKey: ['course-members', courseId, currentPage, pageSize],
    queryFn: () => courseService.getCourseMembers(courseId, currentPage, pageSize),
    enabled: Boolean(courseId),
  })

  const removeMemberMutation = useMutation({
    mutationFn: (userId: string) => courseService.removeCourseMember(courseId, userId),
    onSuccess: async () => {
      uiMessage.success('成员已移出课程')
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['course-members', courseId] }),
        queryClient.invalidateQueries({ queryKey: ['course', courseId] }),
        queryClient.invalidateQueries({ queryKey: ['courses'] }),
      ])
    },
    onError: () => {
      uiMessage.error('移除成员失败')
    },
  })

  if (isCourseLoading || isMembersLoading) {
    return <PageLoading />
  }

  if (!course) {
    return <Navigate to={ROUTES.COURSES} replace />
  }

  const members = membersPage?.items ?? []
  const totalMembers = membersPage?.total ?? 0
  const tableScrollX = isMobile ? 720 : isTablet ? 920 : 1180

  const columns: ColumnsType<CourseMember> = [
    {
      title: '成员',
      dataIndex: 'user',
      key: 'member',
      render: (_, member) => {
        const displayName =
          member.user?.fullName || member.user?.username || member.user?.email || member.userId
        const avatarText = displayName.trim().charAt(0).toUpperCase() || 'M'

        return (
          <div className="flex items-center gap-3">
            <Avatar className="bg-[var(--lms-color-primary)] text-white">{avatarText}</Avatar>
            <div className="min-w-0">
              <div className="truncate text-sm font-medium text-stone-900">{displayName}</div>
              <div className="truncate text-xs text-stone-500">
                {member.user?.email || '暂无邮箱信息'}
              </div>
            </div>
          </div>
        )
      },
    },
    {
      title: '角色',
      dataIndex: ['user', 'role'],
      key: 'role',
      width: 120,
      render: (roleValue: string | undefined) => {
        const roleLabel = roleLabelMap[roleValue || 'student'] || roleValue || '成员'
        return (
          <Tag className="rounded-full border-0 bg-[var(--lms-color-primary-soft)] px-3 py-1 text-orange-600">
            {roleLabel}
          </Tag>
        )
      },
    },
    {
      title: '加入时间',
      dataIndex: 'joinDate',
      key: 'joinDate',
      width: 180,
      render: (joinDate: string) => new Date(joinDate).toLocaleDateString('zh-CN'),
    },
    {
      title: '操作',
      key: 'actions',
      width: 120,
      align: 'right',
      render: (_, member) => {
        const canRemove =
          canManageMembers && member.user?.role === 'student' && member.userId !== currentUser?.id

        if (!canRemove) {
          return <span className="text-sm text-stone-300">-</span>
        }

        return (
          <Popconfirm
            title="确认移除这名学生吗？"
            okText="移除"
            cancelText="取消"
            onConfirm={() => removeMemberMutation.mutate(member.userId)}
          >
            <Button danger size="small" type="text" loading={removeMemberMutation.isPending}>
              移除
            </Button>
          </Popconfirm>
        )
      },
    },
  ]

  return (
    <CourseWorkspaceFrame course={course}>
      <section className="app-panel overflow-hidden">
        <div className={workspacePanelPadding.blockHeader}>
          <h2 className="text-xl font-semibold tracking-[-0.02em] text-stone-900">课程成员</h2>
        </div>

        <div className={workspacePanelPadding.blockBody}>
          <Table<CourseMember>
            rowKey="id"
            columns={columns}
            dataSource={members}
            loading={isMembersFetching}
            size={isMobile ? 'small' : 'middle'}
            scroll={{ x: tableScrollX }}
            locale={{ emptyText: '当前课程暂无成员信息' }}
            pagination={{
              current: currentPage,
              pageSize,
              total: totalMembers,
              showSizeChanger: true,
              showTotal: (total) => `共 ${total} 名成员`,
              onChange: (page, nextPageSize) => {
                setCurrentPage(page)
                if (nextPageSize !== pageSize) {
                  setPageSize(nextPageSize)
                }
              },
              onShowSizeChange: (_, nextPageSize) => {
                setCurrentPage(1)
                setPageSize(nextPageSize)
              },
            }}
          />
        </div>
      </section>
    </CourseWorkspaceFrame>
  )
}
