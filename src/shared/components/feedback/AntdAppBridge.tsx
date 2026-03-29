import { useEffect } from 'react'
import { App as AntdApp } from 'antd'
import { bindMessageApi } from './message'

export default function AntdAppBridge() {
  const { message } = AntdApp.useApp()

  useEffect(() => {
    bindMessageApi(message)
  }, [message])

  return null
}
