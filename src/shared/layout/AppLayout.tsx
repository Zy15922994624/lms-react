import { useState } from 'react'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import { Avatar, Drawer, Dropdown, Grid, Layout, Menu, Typography, message } from 'antd'
import {
  BookOutlined,
  CheckSquareOutlined,
  DashboardOutlined,
  MenuOutlined,
  UserOutlined,
} from '@ant-design/icons'
import { ROUTES } from '@/shared/constants/routes'
import { useAuthStore } from '@/features/auth/store/auth.store'
import type { UserRole } from '@/shared/types/user'

const { Content, Header, Sider } = Layout
const { useBreakpoint } = Grid

const roleText: Record<UserRole, string> = {
  admin: '管理员',
  teacher: '教师',
  student: '学生',
}

const menuKeyToRoute: Record<string, string> = {
  dashboard: ROUTES.HOME,
  'teacher-home': ROUTES.TEACHER_HOME,
  tasks: ROUTES.TASKS,
  courses: ROUTES.COURSES,
  'question-bank': ROUTES.QUESTION_BANK,
  profile: ROUTES.PROFILE,
  users: ROUTES.USERS,
}

export default function AppLayout() {
  const navigate = useNavigate()
  const location = useLocation()
  const screens = useBreakpoint()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const { currentUser, userRole, hasRole, logout } = useAuthStore()

  const role = userRole()
  const isDesktop = Boolean(screens.lg)
  const selectedKey = location.pathname.split('/')[1] || 'dashboard'

  const menuItems = [
    hasRole(['student'])
      ? { key: 'dashboard', icon: <DashboardOutlined />, label: '学习概览' }
      : null,
    hasRole(['teacher', 'admin'])
      ? { key: 'teacher-home', icon: <DashboardOutlined />, label: '教学工作台' }
      : null,
    hasRole(['teacher', 'student'])
      ? { key: 'tasks', icon: <CheckSquareOutlined />, label: '任务中心' }
      : null,
    hasRole(['teacher', 'student'])
      ? { key: 'courses', icon: <BookOutlined />, label: '课程空间' }
      : null,
    hasRole(['teacher'])
      ? { key: 'question-bank', icon: <BookOutlined />, label: '题库管理' }
      : null,
    hasRole(['admin'])
      ? { key: 'users', icon: <UserOutlined />, label: '用户管理' }
      : null,
  ].filter(Boolean)

  const userMenuItems = [
    { key: 'profile', label: '个人资料' },
    { type: 'divider' as const },
    { key: 'logout', label: '退出登录' },
  ]

  const handleMenuClick = ({ key }: { key: string }) => {
    if (key === 'logout') {
      logout()
      message.success('已退出登录')
      navigate(ROUTES.LOGIN, { replace: true })
      return
    }

    const target = menuKeyToRoute[key]
    if (target) {
      navigate(target)
      setMobileMenuOpen(false)
    }
  }

  const menuNode = (
    <div className="flex h-full flex-col bg-[linear-gradient(180deg,#fffaf7_0%,#fffdfb_100%)]">
      <div className="flex items-center gap-3 border-b border-[rgba(28,25,23,0.08)] px-5 py-5">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,#ff6b35_0%,#ff9a3c_100%)] text-xl font-bold text-white shadow-[0_10px_24px_rgba(255,107,53,0.24)]">
          学
        </div>
        <div>
          <Typography.Text strong className="block text-[15px] text-stone-900">
            LMS 学习任务系统
          </Typography.Text>
          <Typography.Text className="text-xs text-stone-500">
            课程、任务与反馈协同工作台
          </Typography.Text>
        </div>
      </div>

      <div className="flex-1 px-3 py-4">
        <Menu
          mode="inline"
          theme="light"
          selectedKeys={[selectedKey]}
          onClick={handleMenuClick}
          style={{ border: 'none', background: 'transparent' }}
          items={menuItems}
        />
      </div>

      <div className="mx-4 mb-4 rounded-3xl border border-[rgba(255,107,53,0.12)] bg-white/85 px-4 py-4 shadow-[0_16px_40px_rgba(28,25,23,0.06)]">
        <div className="text-xs uppercase tracking-[0.18em] text-stone-400">当前身份</div>
        <div className="mt-2 text-sm font-semibold text-stone-900">
          {role ? roleText[role] : '未登录'}
        </div>
        <div className="mt-1 text-xs leading-5 text-stone-500">
          后续会在这里接入课程提醒、任务统计和角色快捷入口。
        </div>
      </div>
    </div>
  )

  return (
    <Layout className="min-h-screen bg-[#fffaf6]">
      {isDesktop ? (
        <Sider
          width={288}
          theme="light"
          style={{
            background: 'transparent',
            borderRight: '1px solid rgba(28,25,23,0.08)',
          }}
        >
          {menuNode}
        </Sider>
      ) : (
        <Drawer
          placement="left"
          width={304}
          open={mobileMenuOpen}
          onClose={() => setMobileMenuOpen(false)}
          closable={false}
          styles={{ body: { padding: 0 } }}
        >
          {menuNode}
        </Drawer>
      )}

      <Layout>
        <Header
          style={{
            height: 72,
            padding: 0,
            background: 'rgba(255,250,246,0.88)',
            borderBottom: '1px solid rgba(28,25,23,0.08)',
            backdropFilter: 'blur(16px)',
          }}
        >
          <div className="flex h-full items-center justify-between px-4 sm:px-6">
            <div className="flex items-center gap-3">
              {!isDesktop ? (
                <button
                  type="button"
                  className="flex h-11 w-11 items-center justify-center rounded-2xl border border-[rgba(28,25,23,0.08)] bg-white text-stone-700 shadow-[0_10px_24px_rgba(28,25,23,0.06)]"
                  onClick={() => setMobileMenuOpen(true)}
                  aria-label="打开菜单"
                >
                  <MenuOutlined />
                </button>
              ) : null}
              <div>
                <div className="text-xs uppercase tracking-[0.22em] text-stone-400">
                  Workspace
                </div>
                <div className="text-base font-semibold text-stone-900 sm:text-lg">
                  {role === 'teacher' || role === 'admin' ? '教学工作台' : '学习工作台'}
                </div>
              </div>
            </div>

            <Dropdown menu={{ items: userMenuItems, onClick: handleMenuClick }} trigger={['click']}>
              <button
                type="button"
                className="flex items-center gap-3 rounded-2xl border border-[rgba(28,25,23,0.08)] bg-white px-2 py-2 text-left shadow-[0_12px_30px_rgba(28,25,23,0.06)]"
              >
                <Avatar size={40} src={currentUser?.avatar} icon={<UserOutlined />} />
                <div className="hidden sm:block">
                  <div className="text-sm font-medium text-stone-900">
                    {currentUser?.fullName || currentUser?.username || '用户'}
                  </div>
                  <div className="text-xs text-stone-500">{role ? roleText[role] : ''}</div>
                </div>
              </button>
            </Dropdown>
          </div>
        </Header>

        <Content className="overflow-hidden">
          <div className="h-[calc(100vh-72px)] overflow-y-auto px-4 py-4 sm:px-6 sm:py-6">
            <div className="mx-auto min-h-full w-full max-w-[1440px]">
              <Outlet />
            </div>
          </div>
        </Content>
      </Layout>
    </Layout>
  )
}
