import dayjs from 'dayjs'

/** 格式化日期（YYYY-MM-DD） */
export const formatDate = (dateString: string): string => {
  if (!dateString) return '-'
  return dayjs(dateString).format('YYYY-MM-DD')
}

/** 格式化日期时间（YYYY-MM-DD HH:mm:ss） */
export const formatDateTime = (dateString: string): string => {
  if (!dateString) return '-'
  return dayjs(dateString).format('YYYY-MM-DD HH:mm:ss')
}

/** 获取截止日期样式类 */
export const getDueDateClass = (dueDate: string): string => {
  if (!dueDate) return 'text-gray-700'
  const diffDays = dayjs(dueDate).diff(dayjs(), 'day')
  if (diffDays < 0) return 'text-red-500'
  if (diffDays <= 3) return 'text-orange-500'
  return 'text-gray-700'
}

/** 判断是否已逾期 */
export const isOverdue = (dueDate: string): boolean => {
  if (!dueDate) return false
  return dayjs(dueDate).isBefore(dayjs())
}