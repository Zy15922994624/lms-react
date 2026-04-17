import type { TaskItem, TaskType } from '@/features/tasks/types/task'

export const taskTypeLabelMap: Record<TaskType, string> = {
  homework: '作业',
  quiz: '测验',
  project: '项目',
  reading: '阅读',
}

export const taskTypeColorMap: Record<TaskType, string> = {
  homework: 'green',
  quiz: 'orange',
  project: 'blue',
  reading: 'purple',
}

export function getStudentTaskStatus(task: TaskItem) {
  if (task.currentUserSubmissionStatus === 'graded') {
    return task.currentUserScore !== undefined ? `已评分 ${task.currentUserScore} 分` : '已评分'
  }

  if (task.currentUserSubmissionStatus === 'submitted') {
    return '已提交'
  }

  return '未提交'
}

export function isStudentTaskPending(task: TaskItem) {
  return !task.currentUserSubmissionStatus || task.currentUserSubmissionStatus === 'not_submitted'
}

export function getStudentActionLabel(task: TaskItem) {
  if (task.currentUserSubmissionStatus === 'graded') {
    return '查看评分'
  }

  if (task.currentUserSubmissionStatus === 'submitted') {
    return '查看提交'
  }

  return '去完成'
}
