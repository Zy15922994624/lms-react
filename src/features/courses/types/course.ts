export interface CourseSummary {
  id: string
  title: string
  description: string
  courseCode?: string
  coverImage?: string
  semester?: string
  credits?: number
  maxStudents?: number | null
  teacherId: string
  teacherName: string
  studentCount: number
  taskCount: number
  isArchived: boolean
  archivedAt: string | null
  createdAt: string
  updatedAt: string
}

export type CourseDetail = CourseSummary

export interface CoursesPage {
  items: CourseSummary[]
  total: number
}

export interface CourseMemberUser {
  id: string
  username: string
  email: string
  role: string
  fullName?: string
  avatar?: string
}

export interface CourseMember {
  id: string
  courseId: string
  userId: string
  joinDate: string
  createdAt: string
  updatedAt: string
  user?: CourseMemberUser
}

export interface CourseMembersPage {
  items: CourseMember[]
  total: number
}

export interface CourseFormValues {
  title: string
  description?: string
  courseCode?: string
  semester?: string
  credits?: number
  maxStudents?: number | null
}
