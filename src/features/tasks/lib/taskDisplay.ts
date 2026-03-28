import type {
  Task,
  TaskAssignmentMode,
  TaskProgressStatus,
  TaskQuestionType,
  TaskSubmissionStatus,
  TaskType,
} from '@/features/tasks/types/task'

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

export const QUESTION_TYPE_LABELS: Record<TaskQuestionType, string> = {
  single_choice: '单选题',
  multi_choice: '多选题',
  fill_text: '填空题',
  rich_text: '简答题',
}

export const PROGRESS_STATUS_LABELS: Record<TaskProgressStatus, string> = {
  not_started: '未开始',
  in_progress: '进行中',
  completed: '已完成',
}

export const PROGRESS_STATUS_COLORS: Record<TaskProgressStatus, string> = {
  not_started: 'orange',
  in_progress: 'blue',
  completed: 'green',
}

export const SUBMISSION_STATUS_LABELS: Record<TaskSubmissionStatus, string> = {
  submitted: '已提交',
  graded: '已批改',
}

export const SUBMISSION_STATUS_COLORS: Record<TaskSubmissionStatus, string> = {
  submitted: 'orange',
  graded: 'green',
}

export const ASSIGNMENT_MODE_LABELS: Record<TaskAssignmentMode, string> = {
  all: '全班',
  selected: '定向',
}

export function getTaskTypeLabel(type?: Task['type']): string {
  return type ? TASK_TYPE_LABELS[type] ?? type : '作业'
}

export function getTaskTypeColor(type?: Task['type']): string {
  return type ? TASK_TYPE_COLORS[type] ?? 'default' : 'geekblue'
}

export function getQuestionTypeLabel(type?: TaskQuestionType): string {
  return type ? QUESTION_TYPE_LABELS[type] ?? type : '题目'
}

export function getProgressText(status?: TaskProgressStatus): string {
  return status ? PROGRESS_STATUS_LABELS[status] ?? '未开始' : '未开始'
}

export function getProgressColor(status?: TaskProgressStatus): string {
  return status ? PROGRESS_STATUS_COLORS[status] ?? 'default' : 'default'
}

export function getSubmissionStatusText(status?: TaskSubmissionStatus): string {
  return status ? SUBMISSION_STATUS_LABELS[status] ?? '-' : '-'
}

export function getSubmissionStatusColor(status?: TaskSubmissionStatus): string {
  return status ? SUBMISSION_STATUS_COLORS[status] ?? 'default' : 'default'
}

export function getAssignmentModeText(mode?: TaskAssignmentMode): string {
  return mode === 'selected' ? '定向任务（仅指定学生）' : '全班任务'
}
