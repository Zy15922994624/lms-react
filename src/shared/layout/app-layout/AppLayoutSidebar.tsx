import { Menu, Typography, type MenuProps } from 'antd'

interface AppLayoutSidebarProps {
  showCompactNav: boolean
  selectedKey: string
  menuItems: MenuProps['items']
  onMenuClick: ({ key }: { key: string }) => void
  roleLabel: string
  workspaceLabel: string
}

export default function AppLayoutSidebar({
  showCompactNav,
  selectedKey,
  menuItems,
  onMenuClick,
  roleLabel,
  workspaceLabel,
}: AppLayoutSidebarProps) {
  return (
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
          onClick={onMenuClick}
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
          <div className="mt-3 text-base font-semibold text-stone-900">{roleLabel}</div>
          <div className="mt-1 text-sm text-stone-500">{workspaceLabel}</div>
        </div>
      </div>
    </div>
  )
}
