import { Spin } from 'antd'

interface Props {
  tip?: string
}

export default function PageLoading({ tip = '加载中...' }: Props) {
  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '12px',
        background: '#fff9f5',
      }}
    >
      <Spin size="large" />
      <span style={{ color: '#78716c', fontSize: '0.875rem' }}>{tip}</span>
    </div>
  )
}
