import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from '@/stores/auth'
import ProtectedRoute from './ProtectedRoute'
import AppLayout from '@/components/Layout/AppLayout'

// 页面懒加载
import { lazy, Suspense } from 'react'
import { Spin } from 'antd'

const Login = lazy(() => import('@/views/Login/index'))
const Dashboard = lazy(() => import('@/views/dashboard/Dashboard'))
const TeacherDashboard = lazy(() => import('@/views/dashboard/TeacherDashboard'))

function Loading() {
  return (
    <div className="flex items-center justify-center h-full">
      <Spin size="large" />
    </div>
  )
}

export default function AppRouter() {
  const { isLoggedIn, userRole } = useAuthStore()

  return (
    <Suspense fallback={<Loading />}>
      <Routes>
        <Route path="/login" element={<Login />} />

        <Route
          path="/"
          element={
            <ProtectedRoute>
              <AppLayout />
            </ProtectedRoute>
          }
        >
          {/* 根路径按角色重定向 */}
          <Route
            index
            element={
              isLoggedIn
                ? (userRole() === 'teacher' || userRole() === 'admin'
                    ? <Navigate to="/teacher-home" replace />
                    : <Dashboard />)
                : <Navigate to="/login" replace />
            }
          />
          <Route
            path="teacher-home"
            element={
              <ProtectedRoute roles={['teacher', 'admin']}>
                <TeacherDashboard />
              </ProtectedRoute>
            }
          />
          {/* 后续页面在此添加 */}
        </Route>

        {/* 未匹配路由 */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  )
}
