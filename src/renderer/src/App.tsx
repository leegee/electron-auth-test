import { type JSX, Show } from 'solid-js'
import MainApp from './components/MainApp'
import AuthPanel from './components/AuthPanel'
import { ToastRoot } from './components/Toast'
import { AuthProvider, useAuth } from './contexts/AuthContext'

export default function App(): JSX.Element {
  return (
    <AuthProvider>
      <ToastRoot />
      <nav class="top">
        <AuthPanel />
      </nav>

      <main class="responsive">
        <Show when={useAuth().authorised()}>
          <MainApp />
        </Show>
      </main>
    </AuthProvider>
  )
}
