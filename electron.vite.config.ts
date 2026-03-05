import { resolve } from 'path'
import { defineConfig } from 'electron-vite'
import solid from 'vite-plugin-solid'

export default defineConfig({
  main: {
    define: {
      __BUILD_PASSWORD__: JSON.stringify(process.env.INIT_BUILD_PASSWORD),
      __CLIENT_ID__: JSON.stringify(process.env.CLIENT_ID),
    },
  },

  preload: {
    define: {
      __BUILD_PASSWORD__: JSON.stringify(process.env.INIT_BUILD_PASSWORD),
      __CLIENT_ID__: JSON.stringify(process.env.CLIENT_ID),
    },
  },

  renderer: {
    define: {
      __BUILD_PASSWORD__: JSON.stringify(process.env.INIT_BUILD_PASSWORD),
      __CLIENT_ID__: JSON.stringify(process.env.CLIENT_ID),
    },
    resolve: {
      alias: {
        '@renderer': resolve('src/renderer/src')
      }
    },
    plugins: [solid()]
  }
})
