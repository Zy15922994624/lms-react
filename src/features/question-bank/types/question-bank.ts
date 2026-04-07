export type QuestionType = 'single_choice' | 'multi_choice' | 'fill_text' | 'rich_text'

export interface QuestionBankOwner {
  id: string
  username: string
  fullName?: string
}

export interface QuestionBankCourse {
  id: string
  title: string
  courseCode?: string
}

export interface QuestionBankOption {
  key: string
  label: string
}

export interface QuestionBankItem {
  id: string
  courseId: string
  course?: QuestionBankCourse
  ownerId: string
  owner?: QuestionBankOwner
  title: string
  description?: string
  type: QuestionType
  options: QuestionBankOption[]
  answer: unknown
  analysis?: string
  score: number
  version: number
  useCount: number
  createdAt: string
  updatedAt: string
}

export interface QuestionBankPage {
  items: QuestionBankItem[]
  total: number
}

export interface QuestionBankImportError {
  index: number
  title?: string
  reason: string
}

export interface QuestionBankImportResult {
  total: number
  successCount: number
  errorCount: number
  items: QuestionBankItem[]
  errors: QuestionBankImportError[]
}

export interface QuestionBankQuery {
  page?: number
  pageSize?: number
  search?: string
  type?: QuestionType
  courseId?: string
}

export interface QuestionBankFormValues {
  title: string
  description?: string
  type: QuestionType
  courseId: string
  options?: QuestionBankOption[]
  answer: string | string[]
  analysis?: string
  score: number
}

export interface QuestionBankPayload {
  title: string
  description?: string
  type: QuestionType
  courseId: string
  options?: QuestionBankOption[]
  answer: unknown
  analysis?: string
  score: number
}
