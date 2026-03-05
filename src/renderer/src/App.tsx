import { type JSX, Match, Switch } from 'solid-js'
import LoggedIn from './components/LoggedIn'
import AuthButton from './components/AuthButton'
import { ToastRoot } from './components/Toast'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import NotLoggedIn from './components/NotLoggedIn'

export default function App(): JSX.Element {
  return (
    <AuthProvider>
      <ToastRoot />
      <nav class="top">
        <AuthButton />
      </nav>

      <main class="responsive">
        <Switch>
          <Match when={useAuth().authorised()}>
            <LoggedIn />
          </Match>
          <Match when={!useAuth().authorised()}>
            <NotLoggedIn />
          </Match>
        </Switch>
      </main>
    </AuthProvider>
  )
}
