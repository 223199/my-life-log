import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { fileURLToPath } from 'url'

// ESM 形式の Vite 設定で __dirname を使うためのおまじない
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// 🚩 リポジトリ名に合わせて base を設定（ここはそのまま my-life-log でOK）
const base = '/my-life-log/'

export default defineConfig({
  plugins: [react()],
  base,
  resolve: {
    alias: {
      // 「@」を src フォルダに対応させる
      '@': path.resolve(__dirname, 'src'),
    },
  },
})
