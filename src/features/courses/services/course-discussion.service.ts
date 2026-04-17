import client from '@/shared/api/client'
import type {
  CourseDiscussionDetail,
  CourseDiscussionQuery,
  CourseDiscussionsPage,
  CourseDiscussionRepliesPage,
  CourseDiscussionReply,
  CreateCourseDiscussionPayload,
  CreateCourseDiscussionReplyPayload,
} from '@/features/courses/types/course-discussion'

export const courseDiscussionService = {
  async getCourseDiscussions(courseId: string, query: CourseDiscussionQuery = {}) {
    return client.get<CourseDiscussionsPage>(`/courses/${courseId}/discussions`, {
      params: query,
    })
  },

  async getCourseDiscussionById(courseId: string, discussionId: string) {
    return client.get<CourseDiscussionDetail>(
      `/courses/${courseId}/discussions/${discussionId}`,
    )
  },

  async getCourseDiscussionReplies(
    courseId: string,
    discussionId: string,
    query: { page?: number; pageSize?: number } = {},
  ) {
    return client.get<CourseDiscussionRepliesPage>(
      `/courses/${courseId}/discussions/${discussionId}/replies`,
      {
        params: query,
      },
    )
  },

  async createCourseDiscussion(courseId: string, payload: CreateCourseDiscussionPayload) {
    return client.post<CourseDiscussionDetail>(
      `/courses/${courseId}/discussions`,
      payload,
    )
  },

  async deleteCourseDiscussion(courseId: string, discussionId: string) {
    return client.delete<null>(`/courses/${courseId}/discussions/${discussionId}`)
  },

  async createCourseDiscussionReply(
    courseId: string,
    discussionId: string,
    payload: CreateCourseDiscussionReplyPayload,
  ) {
    return client.post<CourseDiscussionReply>(
      `/courses/${courseId}/discussions/${discussionId}/replies`,
      payload,
    )
  },

  async deleteCourseDiscussionReply(courseId: string, discussionId: string, replyId: string) {
    return client.delete<null>(
      `/courses/${courseId}/discussions/${discussionId}/replies/${replyId}`,
    )
  },
}
