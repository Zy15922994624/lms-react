import { Component, type ErrorInfo, type ReactNode } from 'react'
import { Button, Result } from 'antd'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    if (import.meta.env.DEV) {
      console.error('ErrorBoundary caught:', error, info.componentStack)
    }
  }

  handleReset = () => {
    window.location.href = '/'
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            minHeight: 'var(--lms-viewport-height)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Result
            status="error"
            title="页面出现异常"
            subTitle={import.meta.env.DEV ? this.state.error?.message : '请刷新页面或返回首页重试'}
            extra={(
              <Button type="primary" onClick={this.handleReset}>
                返回首页
              </Button>
            )}
          />
        </div>
      )
    }

    return this.props.children
  }
}
