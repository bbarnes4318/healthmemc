import base44 from "@base44/vite-plugin"
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

export default defineConfig(({ mode }) => {
  const isDev = mode === "development";
  return {
    plugins: [
      base44({
        legacySDKImports: process.env.BASE44_LEGACY_SDK_IMPORTS === "true",
        hmrNotifier: isDev,
        navigationNotifier: isDev,
        analyticsTracker: isDev,
        visualEditAgent: isDev,
      }),
      react(),
    ],
  };
});
