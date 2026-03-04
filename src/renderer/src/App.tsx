// src/App.tsx
import { Show } from 'solid-js'
import MainApp from './components/MainApp'
import AuthPanel from './components/AuthPanel'
import { ToastRoot } from './components/Toast'
import { AuthProvider, useAuth } from './contexts/AuthContext'

function AppContent() {
  const auth = useAuth()

  return (
    <>
      <nav class="top">
        <Show when={auth.authorised()} fallback={<AuthPanel />}>
          <button onClick={auth.logout}>
            <i>logout</i> Log out
          </button>
        </Show>
      </nav>

      <main class="responsive">
        <ToastRoot />
        <Show when={auth.authorised()}>
          <MainApp />
        </Show>
      </main>
    </>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  )
}
