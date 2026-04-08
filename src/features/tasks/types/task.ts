import type { CourseMember, CourseSummary } from '@/features/courses/types/course'
import type { CourseResource } from '@/features/courses/types/course-resource'

export type TaskType = 'homework' | 'quiz' | 'project' | 'reading'
export type TaskAssignmentMode = 'all' | 'selected'
export type TaskSubmissionStatus = 'submitted' | 'graded'
export type TaskQuestionType = 'single_choice' | 'multi_choice' | 'fill_text' | 'rich_text'

export interface TaskFile {
  key: string
  url: string
  originalName: string
  size: number
  mimeType: string
  name?: string
}

export interface TaskUserBrief {
  id: string
  username: string
  fullName?: string
}

export interface TaskCourseBrief {
  id: string
  title: string
  courseCode?: string
}

export interface TaskResourceBrief {
  id: string
  title: string
  type: CourseResource['type']
  fileUrl: string
  originalFileName: string
}

export interface TaskItem {
  id: string
  courseId: string
  title: string
  description?: string
  type: TaskType
  dueDate: string
  totalScore: number
  passingScore: number
  attachments: TaskFile[]
  relatedResourceIds: string[]
  isPublished: boolean
  publishedAt: string | null
  assignmentMode: TaskAssignmentMode
  creatorId: string
  assignedStudentCount: number
  submittedCount: number
  gradedCount: number
  course?: TaskCourseBrief
  creator?: TaskUserBrief
  currentUserSubmissionStatus?: TaskSubmissionStatus | 'not_submitted'
  currentUserScore?: number
  createdAt: string
  updatedAt: string
}

export interface TaskDetail extends TaskItem {
  relatedResources: TaskResourceBrief[]
}

export interface TaskSubmissionAnswer {
  questionId: string
  answer?: unknown
  autoScore: number
  manualScore?: number | null
  comments?: string
}

export interface TaskSubmissionRevision {
  gradedBy?: string
  score: number
  feedback?: string
  gradedAt: string
}

export interface PendingGradingItem {
  submissionId: string
  taskId: string
  taskTitle: string
  taskType: TaskType
  courseId: string
  courseTitle: string
  studentId: string
  studentName: string
  submittedAt: string
  dueDate: string
  maxScore: number
}

export interface TaskSubmission {
  id: string
  taskId: string
  userId: string
  content?: string
  attachments: TaskFile[]
  answers: TaskSubmissionAnswer[]
  submittedAt: string
  status: TaskSubmissionStatus
  score?: number
  maxScore: number
  feedback?: string
  gradedBy?: string
  gradedAt?: string | null
  revisionHistory?: TaskSubmissionRevision[]
  user?: TaskUserBrief
  createdAt: string
  updatedAt: string
}

export interface TaskQuestionOption {
  key: string
  label: string
}

export interface TaskQuestion {
  id: string
  taskId: string
  questionBankId?: string
  type: TaskQuestionType
  title: string
  description?: string
  options: TaskQuestionOption[]
  answer?: unknown
  score: number
  order: number
  analysis?: string
  bankVersion?: number
  createdAt: string
  updatedAt: string
}

export interface TasksPage {
  items: TaskItem[]
  total: number
}

export interface TaskSubmissionsPage {
  items: TaskSubmission[]
  total: number
}

export interface TaskQuery {
  page?: number
  pageSize?: number
  courseId?: string
  search?: string
  type?: TaskType
}

export interface TaskFormValues {
  courseId: string
  title: string
  description?: string
  type: TaskType
  dueDate: string
  totalScore: number
  passingScore: number
  assignmentMode: TaskAssignmentMode
  assignedStudentIds: string[]
  relatedResourceIds: string[]
  isPublished: boolean
  attachments: TaskFile[]
}

export interface TaskSubmissionAnswerPayload {
  questionId: string
  answer?: unknown
}

export interface TaskSubmissionValues {
  content?: string
  attachments: TaskFile[]
  answers?: TaskSubmissionAnswerPayload[]
}

export interface GradeTaskSubmissionAnswerPayload {
  questionId: string
  answer?: unknown
  manualScore?: number
  comments?: string
}

export interface GradeTaskSubmissionPayload {
  studentId: string
  score?: number
  feedback?: string
  answers?: GradeTaskSubmissionAnswerPayload[]
}

export interface AddTaskQuestionsFromBankPayload {
  questionBankIds: string[]
}

export interface ReorderTaskQuestionsPayload {
  questionOrders: Array<{
    questionId: string
    order: number
  }>
}

export interface TaskFormContext {
  courses: CourseSummary[]
  members: CourseMember[]
  resources: CourseResource[]
}
