import './assets/main.css'
import 'beercss'

import { render } from 'solid-js/web'
import App from './App'

console.log(window.api.config.CUSTOM_URL_PROTOCOL)

render(() => <App />, document.getElementById('root') as HTMLElement)
