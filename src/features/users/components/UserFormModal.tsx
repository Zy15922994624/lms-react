import { useEffect } from 'react'
import { Form, Input, Modal, Select } from 'antd'
import type { UserRole } from '@/shared/types/user'
import type { UserFormValues, UserManagementItem } from '@/features/users/types/user-management'
import useResponsiveLayout from '@/shared/layout/useResponsiveLayout'

interface UserFormModalProps {
  open: boolean
  loading?: boolean
  currentUserId?: string
  user?: UserManagementItem | null
  onCancel: () => void
  onSubmit: (values: UserFormValues) => Promise<unknown> | void
}

const roleOptions: Array<{ label: string; value: UserRole }> = [
  { label: '学生', value: 'student' },
  { label: '教师', value: 'teacher' },
]

export default function UserFormModal({
  open,
  loading = false,
  currentUserId,
  user,
  onCancel,
  onSubmit,
}: UserFormModalProps) {
  const [form] = Form.useForm<UserFormValues>()
  const { isMobile } = useResponsiveLayout()
  const isEditMode = Boolean(user)
  const isEditingCurrentUser = Boolean(user?.id && currentUserId && user.id === currentUserId)

  useEffect(() => {
    if (!open) {
      form.resetFields()
      return
    }

    if (user) {
      form.setFieldsValue({
        username: user.username,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        password: '',
      })
      return
    }

    form.resetFields()
    form.setFieldsValue({
      role: 'student',
    })
  }, [form, open, user])

  const handleFinish = async (values: UserFormValues) => {
    const nextValues: UserFormValues = {
      ...values,
      username: values.username.trim(),
      email: values.email.trim(),
      fullName: values.fullName?.trim() || undefined,
      password: values.password?.trim() || undefined,
    }

    await onSubmit(nextValues)
  }

  return (
    <Modal
      title={isEditMode ? '编辑用户' : '新建用户'}
      open={open}
      onCancel={onCancel}
      onOk={() => form.submit()}
      okText={isEditMode ? '保存' : '创建'}
      cancelText="取消"
      confirmLoading={loading}
      destroyOnHidden
      width={isMobile ? 'calc(100vw - 20px)' : undefined}
    >
      <Form<UserFormValues> form={form} layout="vertical" onFinish={handleFinish}>
        <div className="grid gap-4 sm:grid-cols-2">
          <Form.Item
            label="用户名"
            name="username"
            rules={[
              { required: true, message: '请输入用户名' },
              { min: 3, message: '用户名至少 3 个字符' },
              { max: 30, message: '用户名不能超过 30 个字符' },
            ]}
          >
            <Input placeholder="输入用户名" disabled={isEditMode} />
          </Form.Item>

          <Form.Item
            label="姓名"
            name="fullName"
            rules={[{ max: 50, message: '姓名不能超过 50 个字符' }]}
          >
            <Input placeholder="输入姓名" />
          </Form.Item>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Form.Item
            label="邮箱"
            name="email"
            rules={[
              { required: true, message: '请输入邮箱' },
              { type: 'email', message: '邮箱格式不正确' },
            ]}
          >
            <Input placeholder="输入邮箱" />
          </Form.Item>

          <Form.Item label="角色" name="role" rules={[{ required: true, message: '请选择角色' }]}>
            <Select options={roleOptions} disabled={isEditingCurrentUser} />
          </Form.Item>
        </div>

        <Form.Item
          label={isEditMode ? '新密码' : '密码'}
          name="password"
          rules={[
            ...(isEditMode ? [] : [{ required: true, message: '请输入密码' }]),
            {
              validator: async (_rule, value?: string) => {
                if (!value) {
                  return
                }

                if (value.length < 6) {
                  throw new Error('密码至少 6 个字符')
                }

                if (value.length > 50) {
                  throw new Error('密码不能超过 50 个字符')
                }
              },
            },
          ]}
          extra={isEditMode ? '留空表示不修改密码' : undefined}
        >
          <Input.Password placeholder={isEditMode ? '留空则不修改' : '输入密码'} />
        </Form.Item>
      </Form>
    </Modal>
  )
}
