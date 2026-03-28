export interface TaskAttachment {
  url: string
  name: string
  size?: number
  mimetype?: string
}

export interface TaskRelatedResource {
  id: string
  title: string
  type: 'document' | 'video' | 'image' | 'other'
  fileUrl: string
  originalFileName?: string
}

export type TaskType = 'homework' | 'quiz' | 'project' | 'reading'
export type TaskProgressStatus = 'not_started' | 'in_progress' | 'completed'
export type TaskAssignmentMode = 'all' | 'selected'

export interface Task {
  id: string
  courseId: string
  title: string
  description: string
  type: TaskType
  dueDate: string
  totalScore: number
  passingScore: number
  attachments: TaskAttachment[]
  isPublished: boolean
  publishedAt: string | null
  assignmentMode?: TaskAssignmentMode
  relatedResourceIds?: string[]
  relatedResources?: TaskRelatedResource[]
  creatorId: string
  createdAt: string
  updatedAt: string
  course?: {
    id: string
    title: string
    description?: string
  }
  creator?: {
    id: string
    username: string
    fullName?: string
  }
  assignedStudentsCount?: number
  completedCount?: number
  completionRate?: number
  myProgress?: {
    status: TaskProgressStatus
    updatedAt: string | null
  }
}

export interface TaskProgress {
  id: string
  taskId: string
  userId: string
  status: TaskProgressStatus
  updatedAt: string
  task?: {
    id: string
    title: string
    description?: string
    dueDate?: string
  }
  user?: {
    id: string
    username: string
    fullName?: string
  }
}

export interface CreateTaskRequest {
  courseId: string
  title: string
  description: string
  type: TaskType
  dueDate: string
  totalScore?: number
  passingScore?: number
  attachments?: TaskAttachment[]
  isPublished?: boolean
  publishedAt?: string | null
  assignmentMode?: TaskAssignmentMode
  assignedStudents?: string[]
  relatedResourceIds?: string[]
}

export interface UpdateTaskRequest {
  title?: string
  description?: string
  type?: TaskType
  dueDate?: string
  totalScore?: number
  passingScore?: number
  attachments?: TaskAttachment[]
  isPublished?: boolean
  publishedAt?: string | null
  assignmentMode?: TaskAssignmentMode
  relatedResourceIds?: string[]
}

export interface UpdateTaskProgressRequest {
  status: TaskProgressStatus
}

export interface AssignStudentsRequest {
  studentIds: string[]
}

export interface TaskAssignment {
  id: string
  taskId: string
  userId: string
  assignedAt: string
  user?: {
    id: string
    username: string
    fullName?: string
    email?: string
  }
}

export type TaskQuestionType =
  | 'single_choice'
  | 'multi_choice'
  | 'fill_text'
  | 'rich_text'

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
  options?: TaskQuestionOption[]
  answer?: TaskAnswerValue
  score: number
  order: number
  attachments: string[]
  analysis?: string
  bankVersion?: number
  createdAt?: string
  updatedAt?: string
}

export interface CreateTaskQuestionRequest {
  taskId: string
  type: TaskQuestionType
  title: string
  description?: string
  options?: TaskQuestionOption[]
  answer?: TaskAnswerValue
  score?: number
  order?: number
  attachments?: string[]
  analysis?: string
  questionBankId?: string
  bankVersion?: number
}

export type UpdateTaskQuestionRequest = Partial<
  Omit<CreateTaskQuestionRequest, 'taskId'>
>

export interface TaskAnswer {
  questionId: string
  answer: TaskAnswerValue
  autoScore?: number
  manualScore?: number
  comments?: string
}

export type TaskAnswerValue = string | string[] | null | undefined

export type TaskSubmissionStatus = 'submitted' | 'graded'

export interface TaskSubmissionRevision {
  gradedBy: string
  score: number
  feedback?: string
  gradedAt: string
}

export interface TaskSubmission {
  id: string
  taskId: string
  userId: string
  answers: TaskAnswer[]
  content?: string
  attachments: TaskAttachment[]
  submittedAt?: string | null
  status: TaskSubmissionStatus
  score?: number
  maxScore: number
  feedback?: string
  gradedBy?: string
  gradedAt?: string | null
  revisionHistory?: TaskSubmissionRevision[]
  createdAt?: string
  updatedAt?: string
  user?: {
    id: string
    username: string
    fullName?: string
    email?: string
  }
}

export interface SubmitTaskRequest {
  taskId: string
  answers: TaskAnswer[]
  content?: string
  attachments?: TaskAttachment[]
  status?: TaskSubmissionStatus
}

export interface GradeTaskSubmissionRequest {
  score: number
  feedback?: string
  answers?: TaskAnswer[]
  status?: TaskSubmissionStatus
}
