import type { Task, TaskQuestion, TaskSubmission } from '@/types/task'

// ==================== 任务类型 ====================

export type TaskType = NonNullable<Task['type']>

export const TASK_TYPE_LABELS: Record<TaskType, string> = {
  homework: '作业',
  quiz: '测验',
  project: '项目',
  reading: '阅读',
}

export const TASK_TYPE_COLORS: Record<TaskType, string> = {
  homework: 'geekblue',
  quiz: 'blue',
  project: 'purple',
  reading: 'green',
}

export const getTaskTypeLabel = (type?: TaskType): string => {
  return type ? TASK_TYPE_LABELS[type] ?? type : '作业'
}

export const getTaskTypeColor = (type?: TaskType): string => {
  return type ? TASK_TYPE_COLORS[type] ?? 'default' : 'geekblue'
}

// ==================== 任务状态 ====================

export const ASSIGNMENT_MODE_LABELS: Record<string, string> = {
  all: '全班',
  selected: '定向',
}

export const getAssignmentModeText = (mode?: string): string => {
  return mode === 'selected' ? '定向任务（仅指定学生）' : '全班任务'
}

// ==================== 题目类型 ====================

export type QuestionType = NonNullable<TaskQuestion['type']>

export const QUESTION_TYPE_LABELS: Record<QuestionType, string> = {
  single_choice: '单选题',
  multi_choice: '多选题',
  fill_text: '填空题',
  rich_text: '简答题',
}

export const getQuestionTypeLabel = (type?: QuestionType): string => {
  return type ? QUESTION_TYPE_LABELS[type] ?? type : '题目'
}

// ==================== 进度状态 ====================

export const PROGRESS_STATUS_LABELS: Record<string, string> = {
  not_started: '未开始',
  in_progress: '进行中',
  completed: '已完成',
}

export const PROGRESS_STATUS_COLORS: Record<string, string> = {
  not_started: 'orange',
  in_progress: 'blue',
  completed: 'green',
}

export const getProgressText = (status?: string): string => {
  return status ? PROGRESS_STATUS_LABELS[status] ?? '未开始' : '未开始'
}

export const getProgressColor = (status?: string): string => {
  return status ? PROGRESS_STATUS_COLORS[status] ?? 'default' : 'default'
}

// ==================== 提交状态 ====================

export const SUBMISSION_STATUS_LABELS: Record<string, string> = {
  submitted: '已提交',
  graded: '已评分',
}

export const SUBMISSION_STATUS_COLORS: Record<string, string> = {
  submitted: 'orange',
  graded: 'green',
}

export const getSubmissionStatusText = (status?: TaskSubmission['status']): string => {
  return status ? SUBMISSION_STATUS_LABELS[status] ?? '-' : '-'
}

export const getSubmissionStatusColor = (status?: TaskSubmission['status']): string => {
  return status ? SUBMISSION_STATUS_COLORS[status] ?? 'default' : 'default'
}

// ==================== 日期处理 ====================

/** 格式化日期 (YYYY-MM-DD) */
export const formatDate = (dateString: string): string => {
  if (!dateString) return '-'
  return new Date(dateString).toLocaleDateString('zh-CN')
}

/** 格式化日期时间 (YYYY-MM-DD HH:mm:ss) */
export const formatDateTime = (dateString: string): string => {
  if (!dateString) return '-'
  return new Date(dateString).toLocaleString('zh-CN')
}

/** 获取截止日期样式类 */
export const getDueDateClass = (dueDate: string): string => {
  if (!dueDate) return 'text-gray-700'
  const due = new Date(dueDate)
  const now = new Date()
  const diffDays = Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))

  if (diffDays < 0) return 'text-red-500'
  if (diffDays <= 3) return 'text-orange-500'
  return 'text-gray-700'
}

/** 判断是否已逾期 */
export const isOverdue = (dueDate: string): boolean => {
  if (!dueDate) return false
  return new Date(dueDate) < new Date()
}

// ==================== 文件处理 ====================

/** 从 URL 提取附件名称 */
export const getAttachmentName = (url: string): string => {
  try {
    const parsed = new URL(url)
    const segments = parsed.pathname.split('/')
    return segments.pop() || parsed.hostname
  } catch {
    return url
  }
}

// ==================== 附件处理 ====================

/** Ant Design UploadFile 转 URL 数组 */
export const extractAttachmentUrls = (fileList: { url?: string; status?: string }[]): string[] => {
  return fileList
    .filter((file) => file.status === 'done' && file.url)
    .map((file) => file.url as string)
}

/** URL 数组转 Ant Design UploadFile 数组 */
export const buildUploadFileList = (urls: string[]): { uid: string; name: string; status: 'done'; url: string }[] => {
  return urls.map((url, index) => ({
    uid: `existing-${index}`,
    name: url.split('/').pop() || `附件${index + 1}`,
    status: 'done' as const,
    url,
  }))
}
