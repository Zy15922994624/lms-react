// 讨论系统类型定义

// 用户信息（populate后的格式）
export interface UserInfo {
  id: string
  username: string
  fullName?: string
}

// 课程信息（populate后的格式）
export interface CourseInfo {
  id: string
  title: string
}

export interface DiscussionReply {
  id: string
  content: string
  authorId: UserInfo | string // populate后是UserInfo对象，未populate是string
  createdAt: string
  updatedAt: string
  replies?: DiscussionReply[] // 保留但不再使用嵌套回复
  authorName?: string // 辅助字段：作者姓名
}

export interface Discussion {
  id: string
  courseId: CourseInfo | string // populate后是CourseInfo对象，未populate是string
  courseName?: string // 额外添加的字段
  title: string
  content: string
  authorId: UserInfo | string // populate后是UserInfo对象，未populate是string
  replies?: DiscussionReply[] // 简化的回复数组（只支持一级回复）
  replyCount?: number
  createdAt: string
  updatedAt: string
  authorName?: string // 辅助字段：作者姓名

}

// API 请求/响应类型
export interface CreateDiscussionRequest {
  courseId: string
  title: string
  content: string
}


export interface CreateReplyRequest {
  discussionId: string
  content: string
}

// 查询参数
export interface DiscussionQuery {
  courseId?: string
  authorId?: string
  cursor?: string
  limit?: number
}

// 列表响应
export interface DiscussionListResponse {
  discussions: Discussion[]
  nextCursor?: string | null
  limit?: number
}

