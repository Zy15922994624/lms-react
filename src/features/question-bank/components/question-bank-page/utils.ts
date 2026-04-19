import type { QuestionBankFormValues, QuestionBankItem, QuestionType } from '@/features/question-bank/types/question-bank'

export const questionTypeTextMap: Record<QuestionType, string> = {
  single_choice: '单选题',
  multi_choice: '多选题',
  fill_text: '填空题',
  rich_text: '简答题',
}

export const questionTypeColorMap: Record<QuestionType, string> = {
  single_choice: 'green',
  multi_choice: 'orange',
  fill_text: 'purple',
  rich_text: 'blue',
}

export function summarizeTypeCount(items: QuestionBankItem[]) {
  return items.reduce(
    (acc, item) => {
      acc[item.type] += 1
      return acc
    },
    {
      single_choice: 0,
      multi_choice: 0,
      fill_text: 0,
      rich_text: 0,
    } satisfies Record<QuestionType, number>,
  )
}

export function mapFormValuesToPayload(values: QuestionBankFormValues) {
  return {
    title: values.title,
    description: values.description,
    type: values.type,
    courseId: values.courseId,
    options: values.options,
    answer: values.answer,
    analysis: values.analysis,
    score: values.score,
  }
}
