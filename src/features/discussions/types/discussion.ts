// 讨论系统类型定义

// 用户信息（populate 后的格式）
export interface UserInfo {
  id: string
  username: string
  fullName?: string
}

// 课程信息（populate 后的格式）
export interface CourseInfo {
  id: string
  title: string
}

export interface DiscussionReply {
  id: string
  content: string
  authorId: UserInfo | string
  createdAt: string
  updatedAt: string
  replies?: DiscussionReply[]
  authorName?: string
}

export interface Discussion {
  id: string
  courseId: CourseInfo | string
  courseName?: string
  title: string
  content: string
  authorId: UserInfo | string
  replies?: DiscussionReply[]
  replyCount?: number
  createdAt: string
  updatedAt: string
  authorName?: string
}

export interface CreateDiscussionRequest {
  courseId: string
  title: string
  content: string
}

export interface CreateReplyRequest {
  discussionId: string
  content: string
}

export interface DiscussionQuery {
  courseId?: string
  authorId?: string
  cursor?: string
  limit?: number
}

export interface DiscussionListResponse {
  discussions: Discussion[]
  nextCursor?: string | null
  limit?: number
}
