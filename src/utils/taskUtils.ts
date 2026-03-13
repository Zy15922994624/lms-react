/**
 * 任务模块工具函数
 * 统一封装任务相关的工具方法，减少重复代码
 */

import type { Task, TaskQuestion, TaskSubmission } from '@/types/task'
import type { QuestionBankItem } from '@/types/questionBank'

// ==================== 日期格式化 ====================

/**
 * 格式化日期（YYYY-MM-DD）
 */
export function formatDate(dateString: string): string {
  if (!dateString) return '-'
  return new Date(dateString).toLocaleDateString('zh-CN')
}

/**
 * 格式化日期时间（YYYY-MM-DD HH:mm:ss）
 */
export function formatDateTime(dateString: string): string {
  if (!dateString) return '-'
  return new Date(dateString).toLocaleString('zh-CN')
}

/**
 * 判断截止日期是否已逾期
 */
export function isOverdue(dueDate: string): boolean {
  if (!dueDate) return false
  return new Date(dueDate) < new Date()
}

/**
 * 获取截止日期样式类
 */
export function getDueDateClass(dueDate: string): string {
  const due = new Date(dueDate)
  const now = new Date()
  const diffDays = Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))

  if (diffDays < 0) return 'text-red-500'
  if (diffDays <= 3) return 'text-orange-500'
  return 'text-gray-700'
}

// ==================== 任务类型 ====================

/**
 * 获取任务类型标签
 */
export function getTaskTypeLabel(type?: Task['type']): string {
  switch (type) {
    case 'quiz':
      return '测验'
    case 'project':
      return '项目'
    case 'homework':
    default:
      return '作业'
  }
}

/**
 * 获取任务类型颜色
 */
export function getTaskTypeColor(type?: Task['type']): string {
  switch (type) {
    case 'quiz':
      return 'blue'
    case 'project':
      return 'purple'
    case 'homework':
    default:
      return 'geekblue'
  }
}

// ==================== 任务进度 ====================

/**
 * 获取进度状态颜色
 */
export function getProgressColor(status?: string): string {
  switch (status) {
    case 'completed':
      return 'green'
    case 'in_progress':
      return 'blue'
    case 'not_started':
      return 'orange'
    default:
      return 'default'
  }
}

/**
 * 获取进度状态文本
 */
export function getProgressText(status?: string): string {
  switch (status) {
    case 'completed':
      return '已完成'
    case 'in_progress':
      return '进行中'
    case 'not_started':
      return '未开始'
    default:
      return '未开始'
  }
}

// ==================== 任务提交状态 ====================

/**
 * 获取提交状态文本
 */
export function getSubmissionStatusText(status?: TaskSubmission['status']): string {
  switch (status) {
    case 'submitted':
      return '已提交'
    case 'graded':
      return '已评分'
    default:
      return '-'
  }
}

/**
 * 获取提交状态颜色
 */
export function getSubmissionStatusColor(status?: TaskSubmission['status']): string {
  switch (status) {
    case 'submitted':
      return 'orange'
    case 'graded':
      return 'green'
    default:
      return 'default'
  }
}

// ==================== 题目类型 ====================

/**
 * 获取题目类型标签（通用版本）
 */
export function getQuestionTypeLabel(type?: string): string {
  switch (type) {
    case 'single_choice':
      return '单选题'
    case 'multi_choice':
      return '多选题'
    case 'fill_text':
      return '填空题'
    case 'rich_text':
      return '简答题'
    default:
      return '题目'
  }
}

/**
 * 获取题目类型标签（TaskQuestion 版本）
 */
export function getTaskQuestionTypeLabel(type: TaskQuestion['type']): string {
  return getQuestionTypeLabel(type)
}

/**
 * 获取题目类型标签（QuestionBankItem 版本）
 */
export function getQuestionBankTypeLabel(type: QuestionBankItem['type']): string {
  return getQuestionTypeLabel(type)
}

// ==================== 其他工具 ====================

/**
 * 获取附件名称（从 URL 中提取文件名）
 */
export function getAttachmentName(url: string): string {
  if (!url) return ''
  try {
    const parsed = new URL(url)
    const segments = parsed.pathname.split('/')
    return segments.pop() || parsed.hostname
  } catch {
    return url
  }
}

/**
 * 获取分配范围文本
 */
export function getAssignmentModeText(mode?: Task['assignmentMode']): string {
  return mode === 'selected' ? '定向任务（仅指定学生）' : '全班任务'
}
