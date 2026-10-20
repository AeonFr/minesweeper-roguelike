import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'

/** 98.css ships `@media (not(hover))`, which lightningcss rejects; the valid form has a space. */
const fixMediaNot: Plugin = {
  name: 'fix-98css-media-not',
  enforce: 'pre',
  transform(code, id) {
    if (id.includes('98.css') && id.endsWith('.css')) return code.replace(/\(not\(/g, '(not (')
  },
}

export default defineConfig({ plugins: [fixMediaNot, react()], base: './' })
