import type { MessageInstance } from 'antd/es/message/interface'

let messageApi: MessageInstance | null = null

export function bindMessageApi(api: MessageInstance) {
  messageApi = api
}

function ensureMessageApi() {
  if (!messageApi) {
    if (import.meta.env.DEV) {
      console.warn('Ant Design message 实例尚未绑定，将回退为静默处理。')
    }
    return null
  }

  return messageApi
}

export const uiMessage = {
  success(content: string) {
    ensureMessageApi()?.success(content)
  },
  error(content: string) {
    ensureMessageApi()?.error(content)
  },
  info(content: string) {
    ensureMessageApi()?.info(content)
  },
  warning(content: string) {
    ensureMessageApi()?.warning(content)
  },
}
