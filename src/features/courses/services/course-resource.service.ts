import client from '@/shared/api/client'
import type {
  CourseResource,
  CourseResourceQuery,
  CourseResourcesPage,
  CreateCourseResourcePayload,
  UpdateCourseResourcePayload,
} from '@/features/courses/types/course-resource'

function buildDownloadFileName(resource: CourseResource) {
  return resource.originalFileName || `${resource.title}.file`
}

export const courseResourceService = {
  async getCourseResources(courseId: string, query: CourseResourceQuery = {}) {
    return client.get<CourseResourcesPage>(`/courses/${courseId}/resources`, {
      params: query,
    })
  },

  async createCourseResource(courseId: string, payload: CreateCourseResourcePayload) {
    return client.post<CourseResource>(`/courses/${courseId}/resources`, payload)
  },

  async updateCourseResource(
    courseId: string,
    resourceId: string,
    payload: UpdateCourseResourcePayload,
  ) {
    return client.patch<CourseResource>(
      `/courses/${courseId}/resources/${resourceId}`,
      payload,
    )
  },

  async deleteCourseResource(courseId: string, resourceId: string) {
    return client.delete<null>(`/courses/${courseId}/resources/${resourceId}`)
  },

  async downloadCourseResource(courseId: string, resource: CourseResource) {
    const blob = await client.get<Blob>(`/courses/${courseId}/resources/${resource.id}/download`, {
      responseType: 'blob',
    })

    const fileName = buildDownloadFileName(resource)
    const blobUrl = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = blobUrl
    link.download = fileName
    document.body.appendChild(link)
    link.click()
    link.remove()
    window.URL.revokeObjectURL(blobUrl)
  },
}
