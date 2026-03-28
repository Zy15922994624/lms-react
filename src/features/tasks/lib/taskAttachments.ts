export function getAttachmentName(url: string): string {
  try {
    const parsed = new URL(url)
    const segments = parsed.pathname.split('/')
    return segments.pop() || parsed.hostname
  } catch {
    return url
  }
}

export function extractAttachmentUrls(fileList: { url?: string; status?: string }[]): string[] {
  return fileList
    .filter((file) => file.status === 'done' && file.url)
    .map((file) => file.url as string)
}

export function buildUploadFileList(urls: string[]): {
  uid: string
  name: string
  status: 'done'
  url: string
}[] {
  return urls.map((url, index) => ({
    uid: `existing-${index}`,
    name: url.split('/').pop() || `附件${index + 1}`,
    status: 'done',
    url,
  }))
}
