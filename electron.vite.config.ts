import { resolve } from 'path'
import { defineConfig } from 'electron-vite'
import solid from 'vite-plugin-solid'

import { electronUpdateServer } from './scripts/vite-update-server';

const UPDATE_DIR = resolve('electron-updates');
const PORT = 8123;

export default defineConfig({
  main: {
    resolve: {
      alias: {
        '@shared': resolve('src/shared')
      }
    },
  },

  preload: {
    resolve: {
      alias: {
        '@shared': resolve('src/shared')
      }
    },
  },

  renderer: {
    resolve: {
      alias: {
        '@renderer': resolve('src/renderer/src'),
        '@shared': resolve('src/shared')
      }
    },
    plugins: [
      solid(),
      electronUpdateServer({
        dir: UPDATE_DIR,
        port: PORT,
      })
    ]
  }
})
