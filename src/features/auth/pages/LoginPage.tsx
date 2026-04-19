import { CopyOutlined, LoginOutlined } from '@ant-design/icons'
import { useMutation } from '@tanstack/react-query'
import { Button, Form, Input } from 'antd'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { queryClient } from '@/app/providers/queryClient'
import { authService } from '@/features/auth/services/auth.service'
import { useAuthStore } from '@/features/auth/store/auth.store'
import { uiMessage } from '@/shared/components/feedback/message'
import { getRoleHomePath, ROUTES } from '@/shared/constants/routes'

interface LoginFormValues {
  username: string
  password: string
}

interface DemoAccount {
  label: string
  username: string
  password: string
}

const DEMO_ACCOUNTS: DemoAccount[] = [
  { label: '教师', username: 'teacher001', password: 'Teacher@123456' },
  { label: '学生', username: 'student001', password: 'Student@123456' },
]

async function copyText(value: string) {
  if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText && window.isSecureContext) {
    await navigator.clipboard.writeText(value)
    return
  }

  const textarea = document.createElement('textarea')
  textarea.value = value
  textarea.setAttribute('readonly', 'true')
  textarea.style.position = 'fixed'
  textarea.style.top = '-9999px'
  textarea.style.opacity = '0'

  document.body.appendChild(textarea)
  textarea.select()

  const isSuccess = document.execCommand('copy')
  document.body.removeChild(textarea)

  if (!isSuccess) {
    throw new Error('copy failed')
  }
}

export default function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { isLoggedIn, userRole, setToken, setUser, clearAuth } = useAuthStore()
  const [form] = Form.useForm<LoginFormValues>()

  const loginMutation = useMutation({
    mutationFn: authService.login,
  })

  if (isLoggedIn) {
    return <Navigate to={getRoleHomePath(userRole())} replace />
  }

  const onFinish = async (values: LoginFormValues) => {
    try {
      const { token } = await loginMutation.mutateAsync(values)
      setToken(token)

      const user = await authService.getMe()
      setUser(user)
      queryClient.setQueryData(['auth', 'me'], user)
      uiMessage.success('登录成功')

      const fromPath = (location.state as { from?: { pathname?: string } } | null)?.from?.pathname
      const nextPath = fromPath && fromPath !== ROUTES.LOGIN ? fromPath : getRoleHomePath(user.role)

      navigate(nextPath, { replace: true })
    } catch {
      clearAuth()
    }
  }

  const handleCopyUsername = async (username: string) => {
    try {
      await copyText(username)
      uiMessage.success('账号已复制')
    } catch {
      uiMessage.error('复制失败，请手动输入')
    }
  }

  const handleFillAccount = (account: DemoAccount) => {
    form.setFieldsValue({
      username: account.username,
      password: account.password,
    })
    uiMessage.success(`${account.label}账号已填入`)
  }

  return (
    <div className="ll-root">
      <div className="ll-left">
        <div className="ll-blob ll-blob-1" />
        <div className="ll-blob ll-blob-2" />
        <div className="ll-blob ll-blob-3" />
        <div className="ll-brand">
          <div className="ll-brand-name">学习任务管理系统</div>
        </div>
      </div>

      <div className="ll-right">
        <div className="ll-card">
          <div className="ll-hi">账号登录</div>

          <Form form={form} className="ll-form" layout="vertical" onFinish={onFinish}>
            <Form.Item label="用户名" name="username" rules={[{ required: true, message: '请输入用户名' }]}>
              <Input placeholder="输入用户名" autoComplete="username" />
            </Form.Item>
            <Form.Item label="密码" name="password" rules={[{ required: true, message: '请输入密码' }]}>
              <Input.Password placeholder="输入密码" autoComplete="current-password" />
            </Form.Item>
            <Form.Item style={{ marginBottom: 0 }}>
              <Button
                type="primary"
                htmlType="submit"
                className="ll-btn"
                loading={loginMutation.isPending}
              >
                登录
              </Button>
            </Form.Item>
          </Form>

          <div className="ll-demo">
            <div className="ll-demo-title">演示账号</div>
            <div className="ll-demo-list">
              {DEMO_ACCOUNTS.map((account) => (
                <div key={account.username} className="ll-demo-item">
                  <div className="ll-demo-info">
                    <div className="ll-demo-role">{account.label}</div>
                    <div className="ll-demo-value">{account.username}</div>
                  </div>
                  <div className="ll-demo-actions">
                    <Button
                      size="small"
                      type="default"
                      icon={<CopyOutlined />}
                      onClick={() => void handleCopyUsername(account.username)}
                    >
                      复制账号
                    </Button>
                    <Button
                      size="small"
                      type="link"
                      icon={<LoginOutlined />}
                      onClick={() => handleFillAccount(account)}
                    >
                      一键填入
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
