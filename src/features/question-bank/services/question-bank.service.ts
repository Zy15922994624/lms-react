import client from '@/shared/api/client'
import type {
  QuestionBankImportResult,
  QuestionBankItem,
  QuestionBankPage,
  QuestionBankPayload,
  QuestionBankQuery,
} from '@/features/question-bank/types/question-bank'

export const questionBankService = {
  async getQuestionBank(query: QuestionBankQuery = {}) {
    return client.get<QuestionBankPage>('/question-bank', {
      params: query,
    })
  },

  async getQuestionById(questionId: string) {
    return client.get<QuestionBankItem>(`/question-bank/${questionId}`)
  },

  async createQuestion(payload: QuestionBankPayload) {
    return client.post<QuestionBankItem>('/question-bank', payload)
  },

  async updateQuestion(questionId: string, payload: Partial<QuestionBankPayload>) {
    return client.patch<QuestionBankItem>(`/question-bank/${questionId}`, payload)
  },

  async deleteQuestion(questionId: string) {
    return client.delete<null>(`/question-bank/${questionId}`)
  },

  async importByExcel(file: File, courseId: string) {
    const formData = new FormData()
    formData.append('courseId', courseId)
    formData.append('file', file)

    return client.post<QuestionBankImportResult>('/question-bank/import', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
  },

  async downloadTemplate() {
    return client.get<Blob>('/question-bank/template/download', {
      responseType: 'blob',
    })
  },
}
