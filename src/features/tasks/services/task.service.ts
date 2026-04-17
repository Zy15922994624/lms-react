import client from '@/shared/api/client'
import type {
  AddTaskQuestionsFromBankPayload,
  GradeTaskSubmissionPayload,
  PendingGradingItem,
  TaskDetail,
  TaskFile,
  TaskFormValues,
  TaskQuestion,
  TaskQuery,
  ReorderTaskQuestionsPayload,
  TaskSubmission,
  TaskSubmissionsPage,
  TaskSubmissionValues,
  TasksPage,
} from '@/features/tasks/types/task'

export const taskService = {
  async getTasks(query: TaskQuery = {}) {
    return client.get<TasksPage>('/tasks', {
      params: query,
    })
  },

  async getTaskById(taskId: string) {
    return client.get<TaskDetail>(`/tasks/${taskId}`)
  },

  async downloadTaskAttachment(taskId: string, attachment: TaskFile) {
    const blob = await client.get<Blob>(`/tasks/${taskId}/attachments/download`, {
      params: { key: attachment.key },
      responseType: 'blob',
    })

    const fileName = attachment.originalName || attachment.name || 'attachment.file'
    const blobUrl = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = blobUrl
    link.download = fileName
    document.body.appendChild(link)
    link.click()
    link.remove()
    window.URL.revokeObjectURL(blobUrl)
  },

  async createTask(payload: TaskFormValues) {
    return client.post<TaskDetail>('/tasks', payload)
  },

  async updateTask(taskId: string, payload: Partial<TaskFormValues>) {
    return client.patch<TaskDetail>(`/tasks/${taskId}`, payload)
  },

  async deleteTask(taskId: string) {
    return client.delete<null>(`/tasks/${taskId}`)
  },

  async getTaskQuestions(taskId: string) {
    return client.get<TaskQuestion[]>(`/tasks/${taskId}/questions`)
  },

  async addTaskQuestionsFromBank(taskId: string, payload: AddTaskQuestionsFromBankPayload) {
    return client.post<TaskQuestion[]>(
      `/tasks/${taskId}/questions/from-bank`,
      payload,
    )
  },

  async reorderTaskQuestions(taskId: string, payload: ReorderTaskQuestionsPayload) {
    return client.patch<null>(`/tasks/${taskId}/questions/reorder`, payload)
  },

  async deleteTaskQuestion(questionId: string) {
    return client.delete<null>(`/tasks/questions/${questionId}`)
  },

  async getCurrentSubmission(taskId: string) {
    return client.get<TaskSubmission | null>(`/tasks/${taskId}/submission`)
  },

  async submitTask(taskId: string, payload: TaskSubmissionValues) {
    return client.post<TaskSubmission>(`/tasks/${taskId}/submission`, payload)
  },

  async getTaskSubmissions(taskId: string, page = 1, pageSize = 10) {
    return client.get<TaskSubmissionsPage>(`/tasks/${taskId}/submissions`, {
      params: { page, pageSize },
    })
  },

  async gradeSubmission(taskId: string, payload: GradeTaskSubmissionPayload) {
    return client.post<TaskSubmission>(
      `/tasks/${taskId}/submissions/grade`,
      payload,
    )
  },

  async getPendingGrading() {
    return client.get<PendingGradingItem[]>('/tasks/pending-grading')
  },
}
