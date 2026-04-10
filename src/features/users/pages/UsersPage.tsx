import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Button, Empty, Input, Pagination, Popconfirm, Select, Table, Tag } from 'antd'
import type { TableColumnsType } from 'antd'
import { PlusOutlined } from '@ant-design/icons'
import UserFormModal from '@/features/users/components/UserFormModal'
import { userManagementService } from '@/features/users/services/user-management.service'
import type { UserFormValues, UserManagementItem } from '@/features/users/types/user-management'
import { useAuthStore } from '@/features/auth/store/auth.store'
import { uiMessage } from '@/shared/components/feedback/message'
import PageLoading from '@/shared/components/feedback/PageLoading'
import WorkspaceLayout from '@/shared/layout/WorkspaceLayout'
import { formatDateTime } from '@/shared/utils/date'

const roleLabelMap = {
  admin: '管理员',
  teacher: '教师',
  student: '学生',
} as const

const roleColorMap = {
  admin: 'red',
  teacher: 'blue',
  student: 'green',
} as const

export default function UsersPage() {
  const queryClient = useQueryClient()
  const currentUser = useAuthStore((state) => state.currentUser)
  const [searchInput, setSearchInput] = useState('')
  const [searchKeyword, setSearchKeyword] = useState('')
  const [selectedRole, setSelectedRole] = useState<'all' | 'admin' | 'teacher' | 'student'>('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<UserManagementItem | null>(null)

  const {
    data: userPage,
    isLoading,
    isFetching,
  } = useQuery({
    queryKey: ['users', currentPage, pageSize, selectedRole, searchKeyword],
    queryFn: () =>
      userManagementService.getUsers({
        page: currentPage,
        pageSize,
        role: selectedRole === 'all' ? undefined : selectedRole,
        search: searchKeyword || undefined,
      }),
  })

  const { data: stats, isLoading: isStatsLoading } = useQuery({
    queryKey: ['user-stats'],
    queryFn: () => userManagementService.getUserStats(),
  })

  const createMutation = useMutation({
    mutationFn: (values: UserFormValues) => userManagementService.createUser(values),
    onSuccess: async () => {
      uiMessage.success('用户已创建')
      setIsModalOpen(false)
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['users'] }),
        queryClient.invalidateQueries({ queryKey: ['user-stats'] }),
      ])
    },
  })

  const updateMutation = useMutation({
    mutationFn: (values: UserFormValues) =>
      userManagementService.updateUser(editingUser!.id, values),
    onSuccess: async () => {
      uiMessage.success('用户已更新')
      setEditingUser(null)
      setIsModalOpen(false)
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['users'] }),
        queryClient.invalidateQueries({ queryKey: ['user-stats'] }),
      ])
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (userId: string) => userManagementService.deleteUser(userId),
    onSuccess: async () => {
      uiMessage.success('用户已删除')
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['users'] }),
        queryClient.invalidateQueries({ queryKey: ['user-stats'] }),
      ])
    },
  })

  const users = userPage?.items ?? []
  const total = userPage?.total ?? 0

  const columns: TableColumnsType<UserManagementItem> = [
    {
      title: '账号',
      dataIndex: 'username',
      key: 'username',
      align: 'center',
      render: (_value, record) => (
        <div className="min-w-0 space-y-1 py-1">
          <div className="truncate text-base font-semibold text-stone-950">{record.username}</div>
          <div className="truncate text-sm text-stone-500">{record.fullName || '未填写姓名'}</div>
        </div>
      ),
    },
    {
      title: '邮箱',
      dataIndex: 'email',
      key: 'email',
      width: 260,
      align: 'center',
      render: (value: string) => <span className="text-stone-600">{value}</span>,
    },
    {
      title: '角色',
      dataIndex: 'role',
      key: 'role',
      width: 120,
      align: 'center',
      render: (value: UserManagementItem['role']) => (
        <Tag color={roleColorMap[value]}>{roleLabelMap[value]}</Tag>
      ),
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 180,
      align: 'center',
      render: (value?: string) => (value ? formatDateTime(value) : '—'),
    },
    {
      title: '操作',
      key: 'actions',
      width: 160,
      align: 'center',
      render: (_value, record) => {
        const isCurrentUser = record.id === currentUser?.id
        const canDelete = !isCurrentUser && record.role !== 'admin'

        return (
          <div>
            <Button
              type="link"
              size="small"
              onClick={() => {
                setEditingUser(record)
                setIsModalOpen(true)
              }}
            >
              编辑
            </Button>
            <Popconfirm
              title="确定删除这个账号吗？"
              okText="删除"
              cancelText="取消"
              onConfirm={() => deleteMutation.mutate(record.id)}
              disabled={!canDelete}
            >
              <Button
                type="link"
                size="small"
                danger
                disabled={!canDelete}
                loading={deleteMutation.isPending}
              >
                删除
              </Button>
            </Popconfirm>
          </div>
        )
      },
    },
  ]

  const isBusy = isLoading || isStatsLoading

  if (isBusy && !userPage && !stats) {
    return <PageLoading />
  }

  return (
    <div className="space-y-6 lg:space-y-8">
      <WorkspaceLayout
        preset="dashboard"
        mainClassName="app-panel overflow-hidden"
        aside={
          <div className="space-y-4">
            <section className="app-panel px-5 py-5 xl:px-6 xl:py-6 2xl:px-7 2xl:py-7">
              <h2 className="app-section-title">账号统计</h2>
              <div className="mt-4 space-y-2.5">
                {[
                  { label: '全部账号', value: stats?.total ?? 0 },
                  { label: '管理员', value: stats?.adminCount ?? 0 },
                  { label: '教师', value: stats?.teacherCount ?? 0 },
                  { label: '学生', value: stats?.studentCount ?? 0 },
                ].map((item) => (
                  <div
                    key={item.label}
                    className="flex items-center justify-between rounded-[18px] border border-[rgba(28,25,23,0.06)] bg-white/94 px-4 py-3 text-sm"
                  >
                    <span className="text-stone-600">{item.label}</span>
                    <strong className="text-stone-900">{item.value}</strong>
                  </div>
                ))}
              </div>
            </section>
          </div>
        }
      >
        <div className="border-b border-[var(--lms-color-border)] px-6 py-5 sm:px-8 xl:px-9 xl:py-6 2xl:px-10">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div className="min-w-0">
              <h1 className="text-2xl font-semibold tracking-[-0.03em] text-stone-900">用户管理</h1>
              <div className="mt-1 text-sm text-stone-500">共 {total} 个账号</div>
            </div>

            <div className="flex flex-col gap-3 xl:flex-row xl:items-center">
              <Input.Search
                allowClear
                value={searchInput}
                onChange={(event) => setSearchInput(event.target.value)}
                onSearch={(value) => {
                  setCurrentPage(1)
                  setSearchKeyword(value.trim())
                }}
                placeholder="搜索用户名、姓名或邮箱"
                className="xl:w-[280px] 2xl:w-[320px]"
              />
              <Select
                value={selectedRole}
                onChange={(value) => {
                  setCurrentPage(1)
                  setSelectedRole(value)
                }}
                className="xl:w-[180px]"
                options={[
                  { label: '全部角色', value: 'all' },
                  { label: '管理员', value: 'admin' },
                  { label: '教师', value: 'teacher' },
                  { label: '学生', value: 'student' },
                ]}
              />
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => {
                  setEditingUser(null)
                  setIsModalOpen(true)
                }}
              >
                新建用户
              </Button>
            </div>
          </div>
        </div>

        <section className="px-5 py-5 sm:px-6 sm:py-5 xl:px-7 xl:py-6 2xl:px-8">
          {isFetching ? (
            <div className="mb-4 text-right text-sm text-stone-400">正在刷新…</div>
          ) : null}

          <Table<UserManagementItem>
            rowKey="id"
            dataSource={users}
            columns={columns}
            pagination={false}
            locale={{
              emptyText: <Empty description="暂无用户" image={Empty.PRESENTED_IMAGE_SIMPLE} />,
            }}
          />

          {total > 0 ? (
            <div className="mt-8 flex justify-end">
              <Pagination
                current={currentPage}
                pageSize={pageSize}
                total={total}
                showSizeChanger
                pageSizeOptions={[10, 20, 50]}
                onChange={(page, nextPageSize) => {
                  setCurrentPage(page)
                  setPageSize(nextPageSize)
                }}
              />
            </div>
          ) : null}
        </section>
      </WorkspaceLayout>

      <UserFormModal
        open={isModalOpen}
        user={editingUser}
        currentUserId={currentUser?.id}
        loading={createMutation.isPending || updateMutation.isPending}
        onCancel={() => {
          setIsModalOpen(false)
          setEditingUser(null)
        }}
        onSubmit={async (values) => {
          if (editingUser) {
            await updateMutation.mutateAsync(values)
            return
          }

          await createMutation.mutateAsync(values)
        }}
      />
    </div>
  )
}
