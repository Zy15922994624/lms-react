import { Navigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '@/stores/auth'
import type { UserRole } from '@/types/user'

interface Props {
  children: React.ReactNode
  roles?: UserRole[]
}

export default function ProtectedRoute({ children, roles }: Props) {
  const { isLoggedIn, userRole } = useAuthStore()
  const location = useLocation()

  if (!isLoggedIn) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  if (roles && roles.length > 0) {
    const role = userRole()
    if (!role || !roles.includes(role)) {
      const redirect = role === 'teacher' || role === 'admin' ? '/teacher-home' : '/'
      return <Navigate to={redirect} replace />
    }
  }

  return <>{children}</>
}
