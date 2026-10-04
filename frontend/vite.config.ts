import { existsSync, readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import basicSsl from '@vitejs/plugin-basic-ssl'

const certificatePath = fileURLToPath(new URL('./certs/jacob.home.arpa.crt', import.meta.url))
const privateKeyPath = fileURLToPath(new URL('./certs/jacob.home.arpa.key', import.meta.url))
const hasCertificate = existsSync(certificatePath)
const hasPrivateKey = existsSync(privateKeyPath)

if (hasCertificate !== hasPrivateKey) {
  throw new Error('Le certificat HTTPS et sa clé privée doivent être présents ensemble dans frontend/certs.')
}

const localCertificate = hasCertificate
  ? {
      cert: readFileSync(certificatePath),
      key: readFileSync(privateKeyPath),
    }
  : undefined

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), ...(!localCertificate ? [basicSsl()] : [])],
  server: {
    https: localCertificate ?? {},
    allowedHosts: ['jacob.local', 'macbook-pro-de-david.local'],
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
    },
  },
})
