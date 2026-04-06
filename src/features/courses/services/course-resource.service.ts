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
    return (await client.get<CourseResourcesPage>(`/courses/${courseId}/resources`, {
      params: query,
    })) as unknown as CourseResourcesPage
  },

  async createCourseResource(courseId: string, payload: CreateCourseResourcePayload) {
    return (await client.post<CourseResource>(`/courses/${courseId}/resources`, payload)) as unknown as CourseResource
  },

  async updateCourseResource(
    courseId: string,
    resourceId: string,
    payload: UpdateCourseResourcePayload,
  ) {
    return (await client.patch<CourseResource>(
      `/courses/${courseId}/resources/${resourceId}`,
      payload,
    )) as unknown as CourseResource
  },

  async deleteCourseResource(courseId: string, resourceId: string) {
    return (await client.delete(`/courses/${courseId}/resources/${resourceId}`)) as unknown as null
  },

  async downloadCourseResource(courseId: string, resource: CourseResource) {
    const blob = (await client.get<Blob>(`/courses/${courseId}/resources/${resource.id}/download`, {
      responseType: 'blob',
    })) as unknown as Blob

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
