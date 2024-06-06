import { defineConfig } from 'vite'
import { svelte } from '@sveltejs/vite-plugin-svelte'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  base: '/hdx-hapi-example/',
  plugins: [
    svelte()
  ],
  resolve: {
    alias: {
      "pages": path.resolve("./src/pages")
    }
  }
})
