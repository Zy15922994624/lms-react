import { MenuOutlined, UserOutlined } from '@ant-design/icons'
import { Avatar, Dropdown, type MenuProps } from 'antd'
import type { ReactNode } from 'react'

interface AppLayoutHeaderProps {
  hasPersistentNav: boolean
  notificationNode: ReactNode
  userMenuItems: MenuProps['items']
  onMenuClick: NonNullable<MenuProps['onClick']>
  onOpenMobileMenu: () => void
  displayName: string
  roleLabel: string
  avatarUrl?: string
}

export default function AppLayoutHeader({
  hasPersistentNav,
  notificationNode,
  userMenuItems,
  onMenuClick,
  onOpenMobileMenu,
  displayName,
  roleLabel,
  avatarUrl,
}: AppLayoutHeaderProps) {
  return (
    <div className="app-safe-inline flex h-full w-full items-center justify-between gap-4">
      <div className="flex items-center gap-3">
        {!hasPersistentNav ? (
          <button
            type="button"
            className="flex h-11 w-11 items-center justify-center rounded-2xl border border-[var(--lms-color-border)] bg-white text-stone-700 shadow-[0_10px_24px_rgba(28,25,23,0.06)]"
            onClick={onOpenMobileMenu}
            aria-label="打开菜单"
          >
            <MenuOutlined />
          </button>
        ) : null}
      </div>

      <div className="flex items-center gap-3">
        {notificationNode}
        <Dropdown menu={{ items: userMenuItems, onClick: onMenuClick }} trigger={['click']}>
          <button
            type="button"
            className="flex items-center gap-3 rounded-[20px] border border-[var(--lms-color-border)] bg-white/95 px-2 py-2 text-left shadow-[0_12px_30px_rgba(28,25,23,0.06)] transition hover:border-[rgba(255,107,53,0.18)] hover:shadow-[0_14px_34px_rgba(28,25,23,0.08)]"
          >
            <Avatar size={40} src={avatarUrl} icon={<UserOutlined />} />
            <div className="hidden sm:block">
              <div className="text-sm font-medium text-stone-900">{displayName}</div>
              <div className="text-xs text-stone-500">{roleLabel}</div>
            </div>
          </button>
        </Dropdown>
      </div>
    </div>
  )
}
