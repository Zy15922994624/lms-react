import { useState } from 'react'
import { Button, Form, Input } from 'antd'
import { useMutation } from '@tanstack/react-query'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { getRoleHomePath, ROUTES } from '@/shared/constants/routes'
import { queryClient } from '@/app/providers/queryClient'
import { authService } from '@/features/auth/services/auth.service'
import { useAuthStore } from '@/features/auth/store/auth.store'
import { uiMessage } from '@/shared/components/feedback/message'
import type { UserRole } from '@/shared/types/user'

const roles: { key: UserRole; icon: string; label: string }[] = [
  { key: 'student', icon: '学习', label: '学生' },
  { key: 'teacher', icon: '教学', label: '教师' },
  { key: 'admin', icon: '管理', label: '管理员' },
]

export default function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { isLoggedIn, userRole, setToken, setUser, clearAuth } = useAuthStore()
  const [activeRole, setActiveRole] = useState<UserRole>('student')

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

      if (user.role !== activeRole) {
        setActiveRole(user.role)
        uiMessage.info(`当前账号角色为 ${roles.find((item) => item.key === user.role)?.label}`)
      } else {
        uiMessage.success('登录成功')
      }

      const fromPath = (location.state as { from?: { pathname?: string } } | null)?.from?.pathname
      const nextPath =
        fromPath && fromPath !== ROUTES.LOGIN ? fromPath : getRoleHomePath(user.role)

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
        <div className="ll-stripe" />
        <div className="ll-stripe2" />
        <span className="ll-icon">课</span>
        <span className="ll-icon">任</span>
        <span className="ll-icon">学</span>
        <span className="ll-icon">评</span>
        <span className="ll-icon">协</span>
        <span className="ll-icon">进</span>
        <div className="ll-brand">
          <span className="ll-brand-emoji">L</span>
          <div className="ll-brand-name">学习任务管理系统</div>
        </div>
      </div>

      <div className="ll-right">
        <div className="ll-card">
          <div className="ll-hi">欢迎回来</div>

          <div className="ll-tabs">
            {roles.map((role) => (
              <button
                key={role.key}
                type="button"
                className={`ll-tab${activeRole === role.key ? ' ll-tab-on' : ''}`}
                onClick={() => setActiveRole(role.key)}
              >
                <span>{role.icon}</span>
                {role.label}
              </button>
            ))}
          </div>

          <Form className="ll-form" layout="vertical" onFinish={onFinish}>
            <Form.Item
              label="用户名"
              name="username"
              rules={[{ required: true, message: '请输入用户名' }]}
            >
              <Input placeholder="输入你的用户名" autoComplete="username" />
            </Form.Item>
            <Form.Item
              label="密码"
              name="password"
              rules={[{ required: true, message: '请输入密码' }]}
            >
              <Input.Password placeholder="输入你的密码" autoComplete="current-password" />
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
            <div className="font-medium text-stone-800">测试账号</div>
            <div className="mt-2 space-y-1 text-xs sm:text-sm">
              <div>管理员：admin / 123456</div>
              <div>教师：teacher002 / 123456</div>
              <div>学生：stu003 / 123456</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
