// 课程相关类型定义
export interface Course {
  id: string
  title: string
  description: string
  createdAt: string
  updatedAt: string
  teacherName: string
  courseCode?: string
  semester?: string
  coverImage?: string
  credits?: number
  maxStudents?: number
  studentCount?: number
  taskCount?: number
  progress?: number
  isArchived?: boolean
  archivedAt?: string
}

// 课程成员类型
export interface CourseMember {
  id: string
  courseId: string
  userId: string
  role: 'student' | 'teacher'
  joinedAt: string
  fullName?: string
  user?: {
    id: string
    username: string
    fullName: string
    email: string
    role: string
    avatar?: string
  }
}

// 创建课程请求
export interface CreateCourseRequest {
  title: string
  description: string
  courseCode?: string
  semester?: string
  coverImage?: string
  credits?: number | null
  maxStudents?: number | null
}

// 更新课程请求
export type UpdateCourseRequest = Partial<CreateCourseRequest>

// 加入课程请求
export interface JoinCourseRequest {
  courseId: string
}
