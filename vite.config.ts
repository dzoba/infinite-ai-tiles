import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ command }) => {
  const base = command === 'build' && process.env.GITHUB_PAGES === 'true' 
    ? '/infinite-ai-tiles/' 
    : '/'
    
  return {
    plugins: [react()],
    base,
  }
})
