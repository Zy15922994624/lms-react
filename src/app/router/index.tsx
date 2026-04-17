import { lazy, Suspense } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { ROUTES, getRoleHomePath } from '@/shared/constants/routes'
import { useAuthStore } from '@/features/auth/store/auth.store'
import ProtectedRoute from './ProtectedRoute'
import AppLayout from '@/shared/layout/AppLayout'
import PageLoading from '@/shared/components/feedback/PageLoading'

const LoginPage = lazy(() => import('@/features/auth/pages/LoginPage'))
const TasksPage = lazy(() => import('@/features/tasks/pages/TasksPage'))
const TaskCreatePage = lazy(() => import('@/features/tasks/pages/TaskCreatePage'))
const TaskDetailPage = lazy(() => import('@/features/tasks/pages/TaskDetailPage'))
const TaskEditPage = lazy(() => import('@/features/tasks/pages/TaskEditPage'))
const CoursesPage = lazy(() => import('@/features/courses/pages/CoursesPage'))
const CourseOverviewPage = lazy(() => import('@/features/courses/pages/CourseOverviewPage'))
const CourseMembersPage = lazy(() => import('@/features/courses/pages/CourseMembersPage'))
const CourseResourcesPage = lazy(() => import('@/features/courses/pages/CourseResourcesPage'))
const CourseDiscussionsPage = lazy(() => import('@/features/courses/pages/CourseDiscussionsPage'))
const QuestionBankPage = lazy(() => import('@/features/question-bank/pages/QuestionBankPage'))
const NotificationsPage = lazy(() => import('@/features/notifications/pages/NotificationsPage'))
const UsersPage = lazy(() => import('@/features/users/pages/UsersPage'))

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
