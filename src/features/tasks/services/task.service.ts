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
    return (await client.get<TasksPage>('/tasks', {
      params: query,
    })) as unknown as TasksPage
  },

  async getTaskById(taskId: string) {
    return (await client.get<TaskDetail>(`/tasks/${taskId}`)) as unknown as TaskDetail
  },

  async downloadTaskAttachment(taskId: string, attachment: TaskFile) {
    const blob = (await client.get<Blob>(`/tasks/${taskId}/attachments/download`, {
      params: { key: attachment.key },
      responseType: 'blob',
    })) as unknown as Blob

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
    return (await client.post<TaskDetail>('/tasks', payload)) as unknown as TaskDetail
  },

  async updateTask(taskId: string, payload: Partial<TaskFormValues>) {
    return (await client.patch<TaskDetail>(`/tasks/${taskId}`, payload)) as unknown as TaskDetail
  },

  async deleteTask(taskId: string) {
    return (await client.delete(`/tasks/${taskId}`)) as unknown as null
  },

  async getTaskQuestions(taskId: string) {
    return (await client.get<TaskQuestion[]>(`/tasks/${taskId}/questions`)) as unknown as TaskQuestion[]
  },

  async addTaskQuestionsFromBank(taskId: string, payload: AddTaskQuestionsFromBankPayload) {
    return (await client.post<TaskQuestion[]>(
      `/tasks/${taskId}/questions/from-bank`,
      payload,
    )) as unknown as TaskQuestion[]
  },

  async reorderTaskQuestions(taskId: string, payload: ReorderTaskQuestionsPayload) {
    return (await client.patch(`/tasks/${taskId}/questions/reorder`, payload)) as unknown as null
  },

  async deleteTaskQuestion(questionId: string) {
    return (await client.delete(`/tasks/questions/${questionId}`)) as unknown as null
  },

  async getCurrentSubmission(taskId: string) {
    return (await client.get<TaskSubmission | null>(`/tasks/${taskId}/submission`)) as unknown as TaskSubmission | null
  },

  async submitTask(taskId: string, payload: TaskSubmissionValues) {
    return (await client.post<TaskSubmission>(`/tasks/${taskId}/submission`, payload)) as unknown as TaskSubmission
  },

  async getTaskSubmissions(taskId: string, page = 1, pageSize = 10) {
    return (await client.get<TaskSubmissionsPage>(`/tasks/${taskId}/submissions`, {
      params: { page, pageSize },
    })) as unknown as TaskSubmissionsPage
  },

  async gradeSubmission(taskId: string, payload: GradeTaskSubmissionPayload) {
    return (await client.post<TaskSubmission>(
      `/tasks/${taskId}/submissions/grade`,
      payload,
    )) as unknown as TaskSubmission
  },

  async getPendingGrading() {
    return (await client.get<PendingGradingItem[]>('/tasks/pending-grading')) as unknown as PendingGradingItem[]
  },
}
