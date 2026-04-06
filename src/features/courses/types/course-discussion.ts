export interface CourseDiscussionAuthor {
  id: string
  username: string
  fullName?: string
}

export interface CourseDiscussionReply {
  id: string
  content: string
  authorId: string
  author?: CourseDiscussionAuthor
  createdAt: string
  updatedAt: string
}

export interface CourseDiscussionListItem {
  id: string
  courseId: string
  title: string
  content: string
  authorId: string
  author?: CourseDiscussionAuthor
  replyCount: number
  lastReplyAt?: string
  createdAt: string
  updatedAt: string
}

export interface CourseDiscussionDetail extends CourseDiscussionListItem {
  content: string
}

export interface CourseDiscussionsPage {
  items: CourseDiscussionListItem[]
  total: number
}

export interface CourseDiscussionRepliesPage {
  items: CourseDiscussionReply[]
  total: number
}

export interface CourseDiscussionQuery {
  page?: number
  pageSize?: number
  search?: string
}

export interface CreateCourseDiscussionPayload {
  title: string
  content: string
}

export interface CreateCourseDiscussionReplyPayload {
  content: string
}

export interface CourseDiscussionFormValues {
  title: string
  content: string
}
