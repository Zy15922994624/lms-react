import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import { Layout, Menu, Avatar, Dropdown, message } from 'antd'
import {
  DashboardOutlined,
  CheckSquareOutlined,
  BookOutlined,
  UserOutlined,
} from '@ant-design/icons'
import { useAuthStore } from '@/stores/auth'
import type { UserRole } from '@/types/user'

const { Sider, Header, Content } = Layout

const roleText: Record<UserRole, string> = {
  admin: '管理员',
  teacher: '教师',
  student: '学生',
}

export default function AppLayout() {
  const navigate = useNavigate()
  const location = useLocation()
  const { currentUser, userRole, hasRole, logout } = useAuthStore()

  const role = userRole()

  // 当前选中菜单项（根据路径匹配）
  const selectedKey = location.pathname.split('/')[1] || 'dashboard'

  const handleMenuClick = ({ key }: { key: string }) => {
    if (key === 'logout') {
      logout()
      message.success('已退出登录')
      navigate('/login')
      return
    }
    navigate(`/${key === 'dashboard' ? '' : key}`)
  }

  const userMenuItems = [
    { key: 'profile', label: '个人资料' },
    { type: 'divider' as const },
    { key: 'logout', label: '退出登录' },
  ]

  return (
    <Layout className="h-screen">
      {/* 侧边栏 */}
      <Sider theme="dark" className="bg-slate-900">
        <div className="p-4">
          <h2 className="text-lg font-bold text-white text-center">学习任务管理系统</h2>
        </div>
        <Menu
          mode="inline"
          theme="dark"
          selectedKeys={[selectedKey]}
          onClick={handleMenuClick}
          items={[
            hasRole(['student'])
              ? { key: 'dashboard', icon: <DashboardOutlined />, label: '仪表盘' }
              : null,
            hasRole(['teacher'])
              ? { key: 'teacher-home', icon: <DashboardOutlined />, label: '首页' }
              : null,
            hasRole(['teacher', 'student'])
              ? { key: 'tasks', icon: <CheckSquareOutlined />, label: '任务管理' }
              : null,
            hasRole(['teacher', 'student'])
              ? { key: 'courses', icon: <BookOutlined />, label: '课程管理' }
              : null,
            hasRole(['teacher'])
              ? { key: 'question-bank', icon: <BookOutlined />, label: '题库管理' }
              : null,
            hasRole(['admin'])
              ? { key: 'users', icon: <UserOutlined />, label: '用户管理' }
              : null,
          ].filter(Boolean)}
        />
      </Sider>

      <Layout className="flex flex-col">
        {/* 顶部导航 */}
        <Header
          style={{ background: '#fff', borderBottom: '1px solid #e5e7eb', padding: '0' }}
          className="flex-shrink-0"
        >
          <div className="px-6 flex justify-end items-center h-14">
            <Dropdown menu={{ items: userMenuItems, onClick: handleMenuClick }}>
              <div className="flex items-center gap-2 cursor-pointer px-2 py-1 rounded-md hover:bg-slate-100">
                <Avatar size={36} src={currentUser?.avatar} icon={<UserOutlined />} />
                <div className="hidden sm:block">
                  <div className="text-sm font-medium">{currentUser?.fullName || '用户'}</div>
                  <div className="text-xs text-gray-500">{role ? roleText[role] : ''}</div>
                </div>
              </div>
            </Dropdown>
          </div>
        </Header>

        {/* 内容区域 */}
        <Content className="flex-1 overflow-hidden">
          <div className="h-full px-6 py-4 overflow-y-auto">
            <Outlet />
          </div>
        </Content>
      </Layout>
    </Layout>
  )
}
