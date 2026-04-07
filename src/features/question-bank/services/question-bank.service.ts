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
    return (await client.get<QuestionBankPage>('/question-bank', {
      params: query,
    })) as unknown as QuestionBankPage
  },

  async getQuestionById(questionId: string) {
    return (await client.get<QuestionBankItem>(`/question-bank/${questionId}`)) as unknown as QuestionBankItem
  },

  async createQuestion(payload: QuestionBankPayload) {
    return (await client.post<QuestionBankItem>('/question-bank', payload)) as unknown as QuestionBankItem
  },

  async updateQuestion(questionId: string, payload: Partial<QuestionBankPayload>) {
    return (await client.patch<QuestionBankItem>(`/question-bank/${questionId}`, payload)) as unknown as QuestionBankItem
  },

  async deleteQuestion(questionId: string) {
    return (await client.delete(`/question-bank/${questionId}`)) as unknown as null
  },

  async importByExcel(file: File, courseId: string) {
    const formData = new FormData()
    formData.append('courseId', courseId)
    formData.append('file', file)

    return (await client.post<QuestionBankImportResult>('/question-bank/import', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })) as unknown as QuestionBankImportResult
  },

  async downloadTemplate() {
    return (await client.get<Blob>('/question-bank/template/download', {
      responseType: 'blob',
    })) as unknown as Blob
  },
}
