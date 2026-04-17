import client from '@/shared/api/client'
import type {
  CourseDetail,
  CourseFormValues,
  CourseMembersPage,
  CourseSummary,
  CoursesPage,
} from '@/features/courses/types/course'

const COURSE_MEMBERS_FETCH_PAGE_SIZE = 100

export const courseService = {
  async getCourses(includeArchived = true, page = 1, pageSize = 10) {
    return client.get<CoursesPage>('/courses', {
      params: { includeArchived, page, pageSize },
    })
  },

  async getCourseById(courseId: string) {
    return client.get<CourseDetail>(`/courses/${courseId}`)
  },

  async getAvailableCourses(keyword?: string) {
    return client.get<CourseSummary[]>('/courses/available', {
      params: keyword ? { keyword } : undefined,
    })
  },

  async getCourseMembers(courseId: string, page = 1, pageSize = 20) {
    return client.get<CourseMembersPage>(`/courses/${courseId}/members`, {
      params: { page, pageSize },
    })
  },

  async getAllCourseStudents(courseId: string) {
    const firstPage = await this.getCourseMembers(
      courseId,
      1,
      COURSE_MEMBERS_FETCH_PAGE_SIZE,
    )

    if (firstPage.total <= firstPage.items.length) {
      return firstPage.items
    }

    const totalPages = Math.ceil(firstPage.total / COURSE_MEMBERS_FETCH_PAGE_SIZE)
    const remainingPages = await Promise.all(
      Array.from({ length: totalPages - 1 }, (_value, index) =>
        this.getCourseMembers(courseId, index + 2, COURSE_MEMBERS_FETCH_PAGE_SIZE),
      ),
    )

    return [
      ...firstPage.items,
      ...remainingPages.flatMap((pageData) => pageData.items),
    ]
  },

  async removeCourseMember(courseId: string, userId: string) {
    return client.delete<null>(`/courses/${courseId}/members/${userId}`)
  },

  async createCourse(payload: CourseFormValues) {
    return client.post<CourseDetail>('/courses', payload)
  },

  async updateCourse(courseId: string, payload: CourseFormValues) {
    return client.patch<CourseDetail>(`/courses/${courseId}`, payload)
  },

  async setCourseArchiveStatus(courseId: string, isArchived: boolean) {
    return client.patch<null>(`/courses/${courseId}/archive`, { isArchived })
  },

  async deleteCourse(courseId: string) {
    return client.delete<null>(`/courses/${courseId}`)
  },

  async joinCourse(courseId: string) {
    return client.post<null>(`/courses/${courseId}/join`)
  },
}
