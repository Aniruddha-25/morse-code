import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// GitHub Pages serves a project repository at /<repo-name>/ and a user/org
// site repository (<owner>.github.io) at /. In CI the repo name comes from
// GITHUB_REPOSITORY; locally it falls back to this project's repo name.
const repo = process.env.GITHUB_REPOSITORY?.split('/')[1] ?? 'morse-code'
const pagesBase = repo.endsWith('.github.io') ? '/' : `/${repo}/`

// https://vite.dev/config/
export default defineConfig(({ command, isPreview }) => ({
  // Dev server stays at '/'; production builds (and `vite preview`, which serves
  // them) use the Pages base path.
  base: command === 'build' || isPreview ? pagesBase : '/',
  plugins: [react()],
}))
