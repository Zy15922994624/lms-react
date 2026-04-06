export type CourseResourceType = 'document' | 'video' | 'image' | 'other'

export interface CourseResourceUploader {
  id: string
  username: string
  fullName?: string
}

export interface CourseResource {
  id: string
  courseId: string
  title: string
  description?: string
  type: CourseResourceType
  fileKey: string
  fileUrl: string
  originalFileName: string
  mimeType: string
  size: number
  uploaderId: string
  uploader?: CourseResourceUploader
  createdAt: string
  updatedAt: string
}

export interface CourseResourcesPage {
  items: CourseResource[]
  total: number
}

export interface CourseResourceQuery {
  page?: number
  pageSize?: number
  search?: string
  type?: CourseResourceType
}

export interface CreateCourseResourcePayload {
  title: string
  description?: string
  type: CourseResourceType
  fileKey: string
  fileUrl: string
  originalFileName: string
  mimeType: string
  size: number
}

export interface UpdateCourseResourcePayload {
  title?: string
  description?: string
  type?: CourseResourceType
}

export interface CourseResourceFormValues {
  title: string
  description?: string
  type: CourseResourceType
}
