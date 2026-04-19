import { lazy, Suspense, useMemo, useState, type ReactNode } from 'react'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import { Avatar, Drawer, Dropdown, Grid, Layout, Menu, Typography } from 'antd'
import {
  BookOutlined,
  CheckSquareOutlined,
  MenuOutlined,
  NotificationOutlined,
  UserOutlined,
} from '@ant-design/icons'
import { ROUTES } from '@/shared/constants/routes'
import { useAuthStore } from '@/features/auth/store/auth.store'
import { uiMessage } from '@/shared/components/feedback/message'
import PageContainer from '@/shared/layout/PageContainer'
import { resolvePageWidthMode } from '@/shared/layout/page-width'
import type { UserRole } from '@/shared/types/user'

const { Content, Header, Sider } = Layout
const { useBreakpoint } = Grid
const NotificationBell = lazy(
  () => import('@/features/notifications/components/NotificationBell'),
)

const roleLabelMap: Record<UserRole, string> = {
  admin: '管理员',
  teacher: '教师',
  student: '学生',
}

const workspaceLabelMap: Record<UserRole, string> = {
  admin: '系统管理',
  teacher: '教学工作区',
  student: '学习工作区',
}

const menuRouteMap: Record<string, string> = {
  tasks: ROUTES.TASKS,
  courses: ROUTES.COURSES,
  notifications: ROUTES.NOTIFICATIONS,
  'question-bank': ROUTES.QUESTION_BANK,
  users: ROUTES.USERS,
}

function resolveSelectedKey(pathname: string) {
  const firstSegment = pathname.split('/')[1]
  if (firstSegment === 'question-bank') {
    return 'question-bank'
  }

  if (firstSegment === 'notifications') {
    return 'notifications'
  }

  if (firstSegment === 'users') {
    return 'users'
  }

  if (firstSegment === 'courses') {
    return 'courses'
  }

  if (firstSegment === 'tasks') {
    return 'tasks'
  }

  return ''
}

export default function AppLayout() {
  const navigate = useNavigate()
  const location = useLocation()
  const screens = useBreakpoint()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const { currentUser, userRole, hasRole, logout } = useAuthStore()

  const role = userRole()
  const isTabletNav = (screens.md ?? false) && !(screens.lg ?? false)
  const isDesktopNav = screens.lg ?? false
  const hasPersistentNav = isTabletNav || isDesktopNav
  const showCompactNav = isTabletNav
  const siderWidth = screens.xxl ? 300 : screens.xl ? 280 : isDesktopNav ? 248 : 96
  const mobileDrawerWidth = screens.sm
    ? 320
    : 'calc(100vw - 16px - env(safe-area-inset-left) - env(safe-area-inset-right))'
  const selectedKey = resolveSelectedKey(location.pathname)
  const contentWidthMode = resolvePageWidthMode(location.pathname)

  const menuItems = useMemo(() => {
    const items: Array<{ key: string; icon: ReactNode; label: string }> = []

    if (role === 'student') {
      items.push({ key: 'tasks', icon: <CheckSquareOutlined />, label: '任务中心' })
      items.push({ key: 'courses', icon: <BookOutlined />, label: '课程空间' })
      items.push({ key: 'notifications', icon: <NotificationOutlined />, label: '通知中心' })
    }

    if (role === 'teacher') {
      items.push({ key: 'tasks', icon: <CheckSquareOutlined />, label: '任务中心' })
      items.push({ key: 'courses', icon: <BookOutlined />, label: '课程空间' })
      items.push({ key: 'question-bank', icon: <BookOutlined />, label: '题库管理' })
    }

    if (role === 'admin') {
      items.push({ key: 'users', icon: <UserOutlined />, label: '用户管理' })
      items.push({ key: 'courses', icon: <BookOutlined />, label: '课程空间' })
      items.push({ key: 'question-bank', icon: <BookOutlined />, label: '题库管理' })
    }

    return items
  }, [role])

  const userMenuItems = [{ key: 'logout', label: '退出登录' }]

  const handleMenuClick = ({ key }: { key: string }) => {
    if (key === 'logout') {
      logout()
      uiMessage.success('已退出登录')
      navigate(ROUTES.LOGIN, { replace: true })
      return
    }

    const targetPath = menuRouteMap[key]
    if (targetPath) {
      navigate(targetPath)
      setMobileMenuOpen(false)
    }
  }

  const menuNode = (
    <div className="flex h-full flex-col bg-[linear-gradient(180deg,#fffaf7_0%,#fffdfb_100%)]">
      <div
        className={[
          'flex h-[var(--lms-layout-header-height)] items-center border-b border-[var(--lms-color-border)]',
          showCompactNav ? 'justify-center px-3' : 'px-5',
        ].join(' ')}
      >
        <div className={['flex items-center', showCompactNav ? '' : 'gap-3'].join(' ')}>
          <div className="flex h-11 w-11 items-center justify-center rounded-[20px] bg-[linear-gradient(135deg,#ff6b35_0%,#ff9a3c_100%)] text-xl font-bold text-white shadow-[0_10px_24px_rgba(255,107,53,0.24)]">
            L
          </div>
          <div className={showCompactNav ? 'hidden' : 'min-w-0'}>
            <Typography.Text strong className="block text-[15px] text-stone-900">
              学习任务系统
            </Typography.Text>
          </div>
        </div>
      </div>

      <div
        className={['min-h-0 flex-1 overflow-y-auto py-5', showCompactNav ? 'px-2' : 'px-3'].join(
          ' ',
        )}
      >
        <Menu
          mode="inline"
          theme="light"
          inlineCollapsed={showCompactNav}
          selectedKeys={selectedKey ? [selectedKey] : []}
          onClick={handleMenuClick}
          style={{ border: 'none', background: 'transparent' }}
          items={menuItems}
        />
      </div>

      <div className={showCompactNav ? 'hidden px-4 pb-4' : 'px-4 pb-4'}>
        <div className="rounded-[24px] border border-[rgba(255,107,53,0.12)] bg-white/92 px-4 py-4 shadow-[0_16px_36px_rgba(28,25,23,0.05)]">
          <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-stone-400">
            <span className="app-status-dot" />
            当前身份
          </div>
          <div className="mt-3 text-base font-semibold text-stone-900">
            {role ? roleLabelMap[role] : '未登录'}
          </div>
          <div className="mt-1 text-sm text-stone-500">
            {role ? workspaceLabelMap[role] : '请先登录'}
          </div>
        </div>
      </div>
    </div>
  )

  return (
    <Layout className="app-shell">
      {hasPersistentNav ? (
        <Sider
          width={siderWidth}
          theme="light"
          style={{
            height: 'var(--lms-viewport-height)',
            background: 'transparent',
            borderRight: '1px solid var(--lms-color-border)',
            overflow: 'hidden',
            flex: `0 0 ${siderWidth}px`,
            maxWidth: siderWidth,
            minWidth: siderWidth,
            width: siderWidth,
          }}
        >
          {menuNode}
        </Sider>
      ) : (
        <Drawer
          placement="left"
          width={mobileDrawerWidth}
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
          <div className="app-safe-inline flex h-full w-full items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              {!hasPersistentNav ? (
                <button
                  type="button"
                  className="flex h-11 w-11 items-center justify-center rounded-2xl border border-[var(--lms-color-border)] bg-white text-stone-700 shadow-[0_10px_24px_rgba(28,25,23,0.06)]"
                  onClick={() => setMobileMenuOpen(true)}
                  aria-label="打开菜单"
                >
                  <MenuOutlined />
                </button>
              ) : null}
            </div>

            <div className="flex items-center gap-3">
              {hasRole(['student']) ? (
                <Suspense fallback={null}>
                  <NotificationBell />
                </Suspense>
              ) : null}
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
                    <div className="text-xs text-stone-500">
                      {role ? roleLabelMap[role] : '访客'}
                    </div>
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
