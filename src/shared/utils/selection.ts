export function hasActiveTextSelection() {
  if (typeof window === 'undefined' || !window.getSelection) {
    return false
  }

  const selection = window.getSelection()
  if (!selection || selection.type !== 'Range') {
    return false
  }

  return selection.toString().trim().length > 0
}
