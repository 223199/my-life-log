import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// ★ GitHub Pages のサブパス対応：リポジトリ名に必ず置き換えてください
const base = '/my-life-log/'

export default defineConfig({
  plugins: [react()],
  base,
})
