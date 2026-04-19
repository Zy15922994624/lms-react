import type { TaskDetail } from '@/features/tasks/types/task'

export const taskTypeLabelMap: Record<TaskDetail['type'], string> = {
  homework: '作业',
  quiz: '测验',
  project: '项目',
  reading: '阅读',
}

export function getTaskTypeColor(taskType: TaskDetail['type']) {
  if (taskType === 'reading') return 'purple'
  if (taskType === 'project') return 'blue'
  if (taskType === 'quiz') return 'orange'
  return 'green'
}
