import { useCallback } from 'react'
import { hasActiveTextSelection } from '@/shared/utils/selection'

export function useSelectionSafeAction() {
  return useCallback((action: () => void) => {
    if (hasActiveTextSelection()) {
      return
    }

    action()
  }, [])
}
