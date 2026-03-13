export type QuestionBankVisibility = 'private' | 'course' | 'public';
export type QuestionBankDifficulty = 'easy' | 'medium' | 'hard';

export interface QuestionBankItem {
  id: string;
  title: string;
  type: 'single_choice' | 'multi_choice' | 'fill_text' | 'rich_text';
  description?: string;
  options?: {
    key: string;
    label: string;
  }[];
  answer?: any;
  analysis?: string;
  score: number;
  tags: string[];
  difficulty?: QuestionBankDifficulty;
  subject?: string;
  courseId?: string;
  attachments: string[];
  ownerId?: string;
  visibility: QuestionBankVisibility;
  version: number;
  useCount: number;
  lastUsedAt?: string;
  createdAt?: string;
  updatedAt?: string;
}

