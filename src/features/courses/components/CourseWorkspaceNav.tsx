import { NavLink } from 'react-router-dom'

interface CourseWorkspaceNavProps {
  courseId: string
}

const navItems = [
  { key: 'overview', label: '概览', to: '' },
  { key: 'members', label: '成员', to: 'members' },
  { key: 'resources', label: '资源', to: 'resources' },
  { key: 'discussions', label: '讨论', to: 'discussions' },
]

export default function CourseWorkspaceNav({ courseId }: CourseWorkspaceNavProps) {
  return (
    <nav className="overflow-x-auto">
      <div className="inline-flex min-w-full gap-2 rounded-[20px] border border-[var(--lms-color-border)] bg-white/88 p-2">
        {navItems.map((item) => (
          <NavLink
            key={item.key}
            to={item.to ? `/courses/${courseId}/${item.to}` : `/courses/${courseId}`}
            end={!item.to}
            className={({ isActive }) =>
              [
                'rounded-2xl px-4 py-2.5 text-sm font-medium transition',
                isActive
                  ? 'bg-[var(--lms-color-primary-soft)] text-orange-600 shadow-[0_10px_20px_rgba(255,107,53,0.08)]'
                  : 'text-stone-500 hover:bg-[#fff5ef] hover:text-stone-900',
              ].join(' ')
            }
          >
            {item.label}
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
