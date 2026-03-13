import { Form, Input, Button, Card, message } from 'antd'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/stores/auth'

export default function Login() {
  const navigate = useNavigate()
  const { isLoggedIn, userRole } = useAuthStore()

  // 已登录则重定向
  if (isLoggedIn) {
    const role = userRole()
    navigate(role === 'teacher' || role === 'admin' ? '/teacher-home' : '/', { replace: true })
  }

  const onFinish = (values: { username: string; password: string }) => {
    // 后续接入真实 API
    console.log('login', values)
    message.info('登录功能待接入')
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Card title="学习任务管理系统" className="w-96">
        <Form layout="vertical" onFinish={onFinish}>
          <Form.Item label="用户名" name="username" rules={[{ required: true }]}>
            <Input placeholder="请输入用户名" />
          </Form.Item>
          <Form.Item label="密码" name="password" rules={[{ required: true }]}>
            <Input.Password placeholder="请输入密码" />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" block>
              登录
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  )
}
