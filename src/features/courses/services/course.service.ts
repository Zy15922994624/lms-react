import client from '@/shared/api/client'
import type { CourseDetail, CourseFormValues, CourseMembersPage, CoursesPage } from '@/features/courses/types/course'

const COURSE_MEMBERS_FETCH_PAGE_SIZE = 100

export const courseService = {
  async getCourses(includeArchived = true, page = 1, pageSize = 10) {
    return (await client.get<CoursesPage>('/courses', {
      params: { includeArchived, page, pageSize },
    })) as unknown as CoursesPage
  },

  async getCourseById(courseId: string) {
    return (await client.get<CourseDetail>(`/courses/${courseId}`)) as unknown as CourseDetail
  },

  async getCourseMembers(courseId: string, page = 1, pageSize = 20) {
    return (await client.get<CourseMembersPage>(`/courses/${courseId}/members`, {
      params: { page, pageSize },
    })) as unknown as CourseMembersPage
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
    return (await client.delete(`/courses/${courseId}/members/${userId}`)) as unknown as null
  },

  async createCourse(payload: CourseFormValues) {
    return (await client.post<CourseDetail>('/courses', payload)) as unknown as CourseDetail
  },

  async updateCourse(courseId: string, payload: CourseFormValues) {
    return (await client.patch<CourseDetail>(`/courses/${courseId}`, payload)) as unknown as CourseDetail
  },

  async setCourseArchiveStatus(courseId: string, isArchived: boolean) {
    return (await client.patch(`/courses/${courseId}/archive`, { isArchived })) as unknown as null
  },

  async deleteCourse(courseId: string) {
    return (await client.delete(`/courses/${courseId}`)) as unknown as null
  },
}
