import react, { reactCompilerPreset } from '@vitejs/plugin-react'
import babel from '@rolldown/plugin-babel'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  server: { proxy: { "/api/catalog": "http://localhost:8080", "/api/v1/orders": "http://localhost:8081" } },
  base: "/frontend",
  plugins: [
    react(),
    babel({ presets: [reactCompilerPreset()] })
  ],
})
