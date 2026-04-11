import { lazy, Suspense } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { ROUTES, getRoleHomePath } from '@/shared/constants/routes'
import { useAuthStore } from '@/features/auth/store/auth.store'
import CoursesPage from '@/features/courses/pages/CoursesPage'
import CourseOverviewPage from '@/features/courses/pages/CourseOverviewPage'
import CourseMembersPage from '@/features/courses/pages/CourseMembersPage'
import CourseResourcesPage from '@/features/courses/pages/CourseResourcesPage'
import CourseDiscussionsPage from '@/features/courses/pages/CourseDiscussionsPage'
import NotificationsPage from '@/features/notifications/pages/NotificationsPage'
import QuestionBankPage from '@/features/question-bank/pages/QuestionBankPage'
import TasksPage from '@/features/tasks/pages/TasksPage'
import TaskCreatePage from '@/features/tasks/pages/TaskCreatePage'
import TaskDetailPage from '@/features/tasks/pages/TaskDetailPage'
import TaskEditPage from '@/features/tasks/pages/TaskEditPage'
import UsersPage from '@/features/users/pages/UsersPage'
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
              isLoggedIn ? (
                <Navigate to={getRoleHomePath(userRole())} replace />
              ) : (
                <Navigate to={ROUTES.LOGIN} replace />
              )
            }
          />
          <Route
            path="tasks"
            element={
              <ProtectedRoute roles={['teacher', 'student']}>
                <TasksPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="tasks/create"
            element={
              <ProtectedRoute roles={['teacher', 'admin']}>
                <TaskCreatePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="tasks/:id"
            element={
              <ProtectedRoute roles={['teacher', 'student', 'admin']}>
                <TaskDetailPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="tasks/:id/edit"
            element={
              <ProtectedRoute roles={['teacher', 'admin']}>
                <TaskEditPage />
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
          <Route
            path="notifications"
            element={
              <ProtectedRoute roles={['student']}>
                <NotificationsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="users"
            element={
              <ProtectedRoute roles={['admin']}>
                <UsersPage />
              </ProtectedRoute>
            }
          />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  )
}
