import AppBootstrap from '@/features/auth/components/AppBootstrap'
import AppRouter from '@/app/router'

export default function App() {
  return (
    <AppBootstrap>
      <AppRouter />
    </AppBootstrap>
  )
}
