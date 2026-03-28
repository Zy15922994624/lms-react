import { lazy, Suspense } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { ROUTES, getRoleHomePath } from '@/shared/constants/routes'
import { useAuthStore } from '@/features/auth/store/auth.store'
import StudentDashboardPage from '@/features/dashboard/pages/StudentDashboardPage'
import TeacherDashboardPage from '@/features/dashboard/pages/TeacherDashboardPage'
import ProtectedRoute from './ProtectedRoute'
import AppLayout from '@/shared/layout/AppLayout'
import PageLoading from '@/shared/components/feedback/PageLoading'

const LoginPage = lazy(() => import('@/features/auth/pages/LoginPage'))

export default function AppRouter() {
  const { isLoggedIn, userRole } = useAuthStore()

  return (
    <Suspense fallback={<PageLoading />}>
      <Routes>
        <Route path={ROUTES.LOGIN} element={<LoginPage />} />

        <Route
          path="/"
          element={
            <ProtectedRoute>
              <AppLayout />
            </ProtectedRoute>
          }
        >
          <Route
            index
            element={
              isLoggedIn
                ? <Navigate to={getRoleHomePath(userRole())} replace />
                : <Navigate to={ROUTES.LOGIN} replace />
            }
          />
          <Route
            path="teacher-home"
            element={
              <ProtectedRoute roles={['teacher', 'admin']}>
                <TeacherDashboardPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="dashboard"
            element={
              <ProtectedRoute>
                <StudentDashboardPage />
              </ProtectedRoute>
            }
          />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  )
}
