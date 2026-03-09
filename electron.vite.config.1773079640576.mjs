// electron.vite.config.ts
import { resolve } from "path";
import { defineConfig } from "electron-vite";
import solid from "vite-plugin-solid";
var electron_vite_config_default = defineConfig({
  main: {
    resolve: {
      alias: {
        "@shared": resolve("src/shared")
      }
    }
  },
  preload: {
    resolve: {
      alias: {
        "@shared": resolve("src/shared")
      }
    }
  },
  renderer: {
    resolve: {
      alias: {
        "@renderer": resolve("src/renderer/src"),
        "@shared": resolve("src/shared")
      }
    },
    plugins: [solid()]
  }
});
export {
  electron_vite_config_default as default
};
