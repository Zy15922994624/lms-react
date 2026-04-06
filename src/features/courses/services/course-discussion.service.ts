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
    return (await client.get<CourseDiscussionsPage>(`/courses/${courseId}/discussions`, {
      params: query,
    })) as unknown as CourseDiscussionsPage
  },

  async getCourseDiscussionById(courseId: string, discussionId: string) {
    return (await client.get<CourseDiscussionDetail>(
      `/courses/${courseId}/discussions/${discussionId}`,
    )) as unknown as CourseDiscussionDetail
  },

  async getCourseDiscussionReplies(
    courseId: string,
    discussionId: string,
    query: { page?: number; pageSize?: number } = {},
  ) {
    return (await client.get<CourseDiscussionRepliesPage>(
      `/courses/${courseId}/discussions/${discussionId}/replies`,
      {
        params: query,
      },
    )) as unknown as CourseDiscussionRepliesPage
  },

  async createCourseDiscussion(courseId: string, payload: CreateCourseDiscussionPayload) {
    return (await client.post<CourseDiscussionDetail>(
      `/courses/${courseId}/discussions`,
      payload,
    )) as unknown as CourseDiscussionDetail
  },

  async deleteCourseDiscussion(courseId: string, discussionId: string) {
    return (await client.delete(`/courses/${courseId}/discussions/${discussionId}`)) as unknown as null
  },

  async createCourseDiscussionReply(
    courseId: string,
    discussionId: string,
    payload: CreateCourseDiscussionReplyPayload,
  ) {
    return (await client.post<CourseDiscussionReply>(
      `/courses/${courseId}/discussions/${discussionId}/replies`,
      payload,
    )) as unknown as CourseDiscussionReply
  },

  async deleteCourseDiscussionReply(courseId: string, discussionId: string, replyId: string) {
    return (await client.delete(
      `/courses/${courseId}/discussions/${discussionId}/replies/${replyId}`,
    )) as unknown as null
  },
}
