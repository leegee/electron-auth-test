import { type JSX, Match, onMount, Switch } from 'solid-js'

import { initUpdateHandlers } from './lib/auto-updates'
import { AuthProvider, useAuth } from './contexts/AuthContext'

import LoggedIn from './components/LoggedIn'
import NotLoggedIn from './components/NotLoggedIn'
import AuthButton from './components/AuthButton'
import { ToastRoot } from './components/Toast'

export default function App(): JSX.Element {

  onMount(initUpdateHandlers);

  return (
    <>
      <ToastRoot />

      <AuthProvider>
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
    </>
  )
}
