/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly MODE: string
  readonly VITE_API_BASE_URL: string
  readonly VITE_DEV_AUTH?: string
  // more env variables...
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
