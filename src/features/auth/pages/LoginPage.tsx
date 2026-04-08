import { Button, Form, Input } from 'antd'
import { useMutation } from '@tanstack/react-query'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { getRoleHomePath, ROUTES } from '@/shared/constants/routes'
import { queryClient } from '@/app/providers/queryClient'
import { authService } from '@/features/auth/services/auth.service'
import { useAuthStore } from '@/features/auth/store/auth.store'
import { uiMessage } from '@/shared/components/feedback/message'

export default function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { isLoggedIn, userRole, setToken, setUser, clearAuth } = useAuthStore()

  const loginMutation = useMutation({
    mutationFn: authService.login,
  })

  if (isLoggedIn) {
    return <Navigate to={getRoleHomePath(userRole())} replace />
  }

  const onFinish = async (values: { username: string; password: string }) => {
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

  return (
    <div className="ll-root">
      <div className="ll-left">
        <div className="ll-blob ll-blob-1" />
        <div className="ll-blob ll-blob-2" />
        <div className="ll-blob ll-blob-3" />
        <div className="ll-brand">
          <span className="ll-brand-mark">LMS</span>
          <div className="ll-brand-name">学习任务管理系统</div>
          <p className="ll-brand-desc">登录后进入对应工作区。</p>
        </div>
      </div>

      <div className="ll-right">
        <div className="ll-card">
          <div className="ll-hi">账号登录</div>

          <Form className="ll-form" layout="vertical" onFinish={onFinish}>
            <Form.Item
              label="用户名"
              name="username"
              rules={[{ required: true, message: '请输入用户名' }]}
            >
              <Input placeholder="输入用户名" autoComplete="username" />
            </Form.Item>
            <Form.Item
              label="密码"
              name="password"
              rules={[{ required: true, message: '请输入密码' }]}
            >
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

          <div className="mt-5 rounded-2xl border border-[rgba(28,25,23,0.08)] bg-[#fff8f3] px-4 py-3 text-sm text-stone-600">
            <div className="font-medium text-stone-800">演示账号</div>
            <div className="mt-2 space-y-1 text-xs sm:text-sm">
              <div>管理员：admin001 / Admin@123456</div>
              <div>教师：teacher001 / Teacher@123456</div>
              <div>学生：student001 / Student@123456</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
