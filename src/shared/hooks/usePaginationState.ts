import { useCallback, useState } from 'react'
import type { TablePaginationConfig } from 'antd/es/table'

interface UsePaginationStateOptions {
  initialPage?: number
  initialPageSize?: number
}

export function usePaginationState({
  initialPage = 1,
  initialPageSize = 10,
}: UsePaginationStateOptions = {}) {
  const [page, setPage] = useState(initialPage)
  const [pageSize, setPageSize] = useState(initialPageSize)

  const resetPage = useCallback(() => {
    setPage(initialPage)
  }, [initialPage])

  const handleTableChange = useCallback(
    (pagination: TablePaginationConfig) => {
      setPage(pagination.current ?? initialPage)
      setPageSize(pagination.pageSize ?? initialPageSize)
    },
    [initialPage, initialPageSize],
  )

  const handlePageChange = useCallback((nextPage: number, nextPageSize: number) => {
    setPage(nextPage)
    setPageSize(nextPageSize)
  }, [])

  const handlePageSizeChange = useCallback(
    (nextPageSize: number) => {
      setPage(initialPage)
      setPageSize(nextPageSize)
    },
    [initialPage],
  )

  return {
    page,
    setPage,
    pageSize,
    setPageSize,
    resetPage,
    handleTableChange,
    handlePageChange,
    handlePageSizeChange,
  }
}
