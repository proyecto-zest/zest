import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    // Honor PORT when the environment sets it; otherwise use Vite's default.
    port: process.env.PORT ? Number(process.env.PORT) : undefined,
  },
})
