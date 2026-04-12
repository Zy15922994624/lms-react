import type { PropsWithChildren, ReactNode } from 'react'

export type WorkspaceLayoutPreset = 'dashboard' | 'course' | 'resource'

interface WorkspaceLayoutProps extends PropsWithChildren {
  preset?: WorkspaceLayoutPreset
  aside?: ReactNode
  className?: string
  mainClassName?: string
  asideClassName?: string
}

const presetClassMap: Record<WorkspaceLayoutPreset, string> = {
  dashboard:
    'grid gap-5 md:gap-6 lg:grid-cols-[minmax(0,1.45fr)_280px] xl:gap-7 xl:grid-cols-[minmax(0,1.65fr)_340px] 2xl:gap-8 2xl:grid-cols-[minmax(0,1.82fr)_380px]',
  course:
    'grid gap-5 md:gap-6 lg:grid-cols-[minmax(0,1.55fr)_320px] xl:gap-8 xl:grid-cols-[minmax(0,1.8fr)_380px] 2xl:gap-10 2xl:grid-cols-[minmax(0,2.05fr)_460px]',
  resource:
    'grid gap-5 md:gap-6 lg:grid-cols-[minmax(0,1.04fr)_320px] xl:gap-7 xl:grid-cols-[minmax(0,1.16fr)_400px] 2xl:gap-8 2xl:grid-cols-[minmax(0,1.24fr)_440px]',
}

function joinClassNames(...values: Array<string | undefined | false | null>) {
  return values.filter(Boolean).join(' ')
}

export default function WorkspaceLayout({
  preset = 'dashboard',
  aside,
  className,
  mainClassName,
  asideClassName,
  children,
}: WorkspaceLayoutProps) {
  return (
    <section className={joinClassNames(aside ? presetClassMap[preset] : undefined, className)}>
      <div className={joinClassNames(mainClassName)}>{children}</div>
      {aside ? (
        <aside
          className={joinClassNames(
            'lg:sticky lg:top-5 lg:self-start xl:top-6 2xl:top-8',
            asideClassName,
          )}
        >
          {aside}
        </aside>
      ) : null}
    </section>
  )
}
