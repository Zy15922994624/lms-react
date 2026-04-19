import type { QuestionType } from '@/features/question-bank/types/question-bank'
import type { TaskType } from '@/features/tasks/types/task'

export const taskTypeOptions: Array<{ label: string; value: TaskType }> = [
  { label: '作业', value: 'homework' },
  { label: '测验', value: 'quiz' },
  { label: '项目', value: 'project' },
  { label: '阅读', value: 'reading' },
]

export const questionTypeLabelMap: Record<QuestionType, string> = {
  single_choice: '单选题',
  multi_choice: '多选题',
  fill_text: '填空题',
  rich_text: '简答题',
}

export function supportsQuestionSelection(taskType: TaskType) {
  return taskType === 'homework' || taskType === 'quiz'
}
