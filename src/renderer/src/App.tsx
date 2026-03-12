import { type JSX, Match, onMount, Show, Switch } from 'solid-js'

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
        <Show when={useAuth().authorised()}>
          <nav class="top">
            <div class="max row right-align">
              <AuthButton />
            </div>
          </nav>
        </Show>

        <main class="responsive">
          <Switch>
            <Match when={useAuth().authorised()}>
              <LoggedIn />
            </Match>

            <Match when={!useAuth().authorised()}>
              <article class="absolute center middle border padding center-align middle-align ">
                <div class="large-padding">
                  <NotLoggedIn />
                  <footer class="top-margin">
                    <AuthButton />
                  </footer>
                </div>
              </article>
            </Match>

          </Switch>
        </main>
      </AuthProvider>
    </>
  )
}
