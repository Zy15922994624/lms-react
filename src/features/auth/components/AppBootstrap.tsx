import { useEffect, type ReactNode } from 'react'
import { useQuery } from '@tanstack/react-query'
import { authService } from '@/features/auth/services/auth.service'
import { useAuthStore } from '@/features/auth/store/auth.store'
import PageLoading from '@/shared/components/feedback/PageLoading'

interface Props {
  children: ReactNode
}

export default function AppBootstrap({ children }: Props) {
  const { token, currentUser, setUser, logout, isLoading, setLoading } = useAuthStore()

  const hasToken = Boolean(token)

  const meQuery = useQuery({
    queryKey: ['auth', 'me'],
    queryFn: authService.getMe,
    enabled: hasToken,
    retry: false,
  })

  useEffect(() => {
    setLoading(hasToken && meQuery.isPending)
  }, [hasToken, meQuery.isPending, setLoading])

  useEffect(() => {
    if (meQuery.data) {
      setUser(meQuery.data)
    }
  }, [meQuery.data, setUser])

  useEffect(() => {
    if (meQuery.isError) {
      logout()
    }
  }, [logout, meQuery.isError])

  if (hasToken && (isLoading || (!currentUser && meQuery.isPending))) {
    return <PageLoading tip="正在恢复登录状态..." />
  }

  return <>{children}</>
}
