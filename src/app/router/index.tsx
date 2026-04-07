import { lazy, Suspense } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { ROUTES, getRoleHomePath } from '@/shared/constants/routes'
import { useAuthStore } from '@/features/auth/store/auth.store'
import StudentDashboardPage from '@/features/dashboard/pages/StudentDashboardPage'
import TeacherDashboardPage from '@/features/dashboard/pages/TeacherDashboardPage'
import CoursesPage from '@/features/courses/pages/CoursesPage'
import CourseOverviewPage from '@/features/courses/pages/CourseOverviewPage'
import CourseMembersPage from '@/features/courses/pages/CourseMembersPage'
import CourseResourcesPage from '@/features/courses/pages/CourseResourcesPage'
import CourseDiscussionsPage from '@/features/courses/pages/CourseDiscussionsPage'
import QuestionBankPage from '@/features/question-bank/pages/QuestionBankPage'
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
          <Route
            path="courses"
            element={
              <ProtectedRoute roles={['teacher', 'student', 'admin']}>
                <CoursesPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="courses/:courseId"
            element={
              <ProtectedRoute roles={['teacher', 'student', 'admin']}>
                <CourseOverviewPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="courses/:courseId/members"
            element={
              <ProtectedRoute roles={['teacher', 'student', 'admin']}>
                <CourseMembersPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="courses/:courseId/resources"
            element={
              <ProtectedRoute roles={['teacher', 'student', 'admin']}>
                <CourseResourcesPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="courses/:courseId/discussions"
            element={
              <ProtectedRoute roles={['teacher', 'student', 'admin']}>
                <CourseDiscussionsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="question-bank"
            element={
              <ProtectedRoute roles={['teacher', 'admin']}>
                <QuestionBankPage />
              </ProtectedRoute>
            }
          />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  )
}
