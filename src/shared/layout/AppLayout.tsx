import { useMemo, useState } from 'react'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import { Avatar, Drawer, Dropdown, Grid, Layout, Menu, Typography } from 'antd'
import {
  BookOutlined,
  CheckSquareOutlined,
  DashboardOutlined,
  MenuOutlined,
  UserOutlined,
} from '@ant-design/icons'
import { ROUTES } from '@/shared/constants/routes'
import { useAuthStore } from '@/features/auth/store/auth.store'
import NotificationBell from '@/features/notifications/components/NotificationBell'
import { uiMessage } from '@/shared/components/feedback/message'
import PageContainer from '@/shared/layout/PageContainer'
import { resolvePageWidthMode } from '@/shared/layout/page-width'
import type { UserRole } from '@/shared/types/user'

const { Content, Header, Sider } = Layout
const { useBreakpoint } = Grid

const roleText: Record<UserRole, string> = {
  admin: '管理员',
  teacher: '教师',
  student: '学生',
}

const roleWorkspaceText: Record<UserRole, string> = {
  admin: '系统工作台',
  teacher: '教学工作台',
  student: '学习工作台',
}

const menuKeyToRoute: Record<string, string> = {
  dashboard: ROUTES.STUDENT_HOME,
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
  const contentWidthMode = resolvePageWidthMode(location.pathname)

  const menuItems = useMemo(
    () =>
      [
        hasRole(['student'])
          ? { key: 'dashboard', icon: <DashboardOutlined />, label: '学习总览' }
          : null,
        hasRole(['teacher', 'admin'])
          ? { key: 'teacher-home', icon: <DashboardOutlined />, label: '教学工作台' }
          : null,
        hasRole(['teacher', 'student'])
          ? { key: 'tasks', icon: <CheckSquareOutlined />, label: '任务中心' }
          : null,
        hasRole(['teacher', 'student', 'admin'])
          ? { key: 'courses', icon: <BookOutlined />, label: '课程空间' }
          : null,
        hasRole(['teacher', 'admin'])
          ? { key: 'question-bank', icon: <BookOutlined />, label: '题库管理' }
          : null,
        hasRole(['admin']) ? { key: 'users', icon: <UserOutlined />, label: '用户管理' } : null,
      ].filter(Boolean),
    [hasRole],
  )

  const userMenuItems = [
    { key: 'profile', label: '个人资料' },
    { type: 'divider' as const },
    { key: 'logout', label: '退出登录' },
  ]

  const handleMenuClick = ({ key }: { key: string }) => {
    if (key === 'logout') {
      logout()
      uiMessage.success('已退出登录')
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
      <div className="flex h-[var(--lms-layout-header-height)] items-center border-b border-[var(--lms-color-border)] px-5">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-[20px] bg-[linear-gradient(135deg,#ff6b35_0%,#ff9a3c_100%)] text-xl font-bold text-white shadow-[0_10px_24px_rgba(255,107,53,0.24)]">
            L
          </div>
          <div className="min-w-0">
            <Typography.Text strong className="block text-[15px] text-stone-900">
              LMS 学习任务系统
            </Typography.Text>
          </div>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-3 py-5">
        <Menu
          mode="inline"
          theme="light"
          selectedKeys={[selectedKey]}
          onClick={handleMenuClick}
          style={{ border: 'none', background: 'transparent' }}
          items={menuItems}
        />
      </div>

      <div className="px-4 pb-4">
        <div className="rounded-[24px] border border-[rgba(255,107,53,0.12)] bg-white/92 px-4 py-4 shadow-[0_16px_36px_rgba(28,25,23,0.05)]">
          <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-stone-400">
            <span className="app-status-dot" />
            当前身份
          </div>
          <div className="mt-3 text-base font-semibold text-stone-900">
            {role ? roleText[role] : '未登录'}
          </div>
          <div className="mt-1 text-sm text-stone-500">
            {role ? roleWorkspaceText[role] : '请先登录'}
          </div>
        </div>
      </div>
    </div>
  )

  return (
    <Layout className="app-shell">
      {isDesktop ? (
        <Sider
          width={280}
          theme="light"
          style={{
            height: '100vh',
            background: 'transparent',
            borderRight: '1px solid var(--lms-color-border)',
            overflow: 'hidden',
            flex: '0 0 280px',
            maxWidth: 280,
            minWidth: 280,
            width: 280,
          }}
        >
          {menuNode}
        </Sider>
      ) : (
        <Drawer
          placement="left"
          size="default"
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
            height: 'var(--lms-layout-header-height)',
            padding: 0,
            background: 'rgba(255,250,246,0.9)',
            borderBottom: '1px solid var(--lms-color-border)',
            backdropFilter: 'blur(16px)',
          }}
        >
          <div className="flex h-full w-full items-center justify-between gap-4 px-4 sm:px-6">
            <div className="flex items-center gap-3">
              {!isDesktop ? (
                <button
                  type="button"
                  className="flex h-11 w-11 items-center justify-center rounded-2xl border border-[var(--lms-color-border)] bg-white text-stone-700 shadow-[0_10px_24px_rgba(28,25,23,0.06)]"
                  onClick={() => setMobileMenuOpen(true)}
                  aria-label="打开菜单"
                >
                  <MenuOutlined />
                </button>
              ) : null}

              <div className="flex items-center gap-3">
                <span className="hidden h-8 w-px bg-[var(--lms-color-border)] sm:block" />
                <div className="text-lg font-semibold tracking-[-0.02em] text-stone-900">
                  {role ? roleWorkspaceText[role] : '学习工作台'}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <NotificationBell />
              <Dropdown
                menu={{ items: userMenuItems, onClick: handleMenuClick }}
                trigger={['click']}
              >
                <button
                  type="button"
                  className="flex items-center gap-3 rounded-[20px] border border-[var(--lms-color-border)] bg-white/95 px-2 py-2 text-left shadow-[0_12px_30px_rgba(28,25,23,0.06)] transition hover:border-[rgba(255,107,53,0.18)] hover:shadow-[0_14px_34px_rgba(28,25,23,0.08)]"
                >
                  <Avatar
                    size={40}
                    src={currentUser?.avatar ? currentUser.avatar : undefined}
                    icon={<UserOutlined />}
                  />
                  <div className="hidden sm:block">
                    <div className="text-sm font-medium text-stone-900">
                      {currentUser?.fullName || currentUser?.username || '用户'}
                    </div>
                    <div className="text-xs text-stone-500">{role ? roleText[role] : '访客'}</div>
                  </div>
                </button>
              </Dropdown>
            </div>
          </div>
        </Header>

        <Content className="overflow-hidden">
          <div className="app-content-scroll">
            <PageContainer mode={contentWidthMode}>
              <Outlet />
            </PageContainer>
          </div>
        </Content>
      </Layout>
    </Layout>
  )
}
