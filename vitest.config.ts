import { defineConfig } from "vitest/config"
import path from "path"

export default defineConfig({
  test: {
    environment: "node",
    globals: true,
    include: ["src/__tests__/**/*.test.{ts,tsx}"],
    server: {
      deps: {
        inline: ["next-auth", "@auth/prisma-adapter"],
      },
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@prisma/client": path.resolve(__dirname, "./node_modules/@prisma/client"),
      "next-auth/react": path.resolve(__dirname, "./node_modules/next-auth/react/index.js"),
    },
  },
})
