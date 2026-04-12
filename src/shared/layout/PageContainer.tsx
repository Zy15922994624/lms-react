import type { PropsWithChildren } from 'react'
import type { PageWidthMode } from '@/shared/layout/page-width'

interface PageContainerProps extends PropsWithChildren {
  mode?: PageWidthMode
  className?: string
}

export default function PageContainer({
  mode = 'standard',
  className,
  children,
}: PageContainerProps) {
  return (
    <div
      className={['app-content-container', `app-content-container--${mode}`, className]
        .filter(Boolean)
        .join(' ')}
    >
      {children}
    </div>
  )
}
