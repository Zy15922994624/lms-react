import type { UIEvent } from 'react'

export const DISCUSSIONS_PAGE_SIZE = 5
export const REPLIES_PAGE_SIZE = 5
const SCROLL_THRESHOLD = 56

export function shouldFetchNextPage(event: UIEvent<HTMLDivElement>) {
  const target = event.currentTarget
  return target.scrollHeight - target.scrollTop - target.clientHeight <= SCROLL_THRESHOLD
}

export function formatDateLabel(value?: string) {
  if (!value) {
    return '刚刚'
  }

  return new Intl.DateTimeFormat('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value))
}

export function formatAuthorName(author?: { username: string; fullName?: string }) {
  if (!author) {
    return '未知成员'
  }

  return author.fullName || author.username || '未知成员'
}

export function canDeleteByRole(currentUserId?: string, role?: string, authorId?: string) {
  if (!currentUserId || !role) {
    return false
  }

  if (role === 'admin' || role === 'teacher') {
    return true
  }

  return currentUserId === authorId
}
