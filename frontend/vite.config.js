import path from "path";
import { defineConfig, transformWithEsbuild } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [
    {
      name: "load-js-files-as-jsx",
      enforce: "pre",
      async transform(code, id) {
        if (!id.match(/src\/.*\.js$/)) {
          return null;
        }
        return transformWithEsbuild(code, id, {
          loader: "jsx",
          jsx: "automatic",
        });
      },
    },
    react(),
  ],
  envPrefix: ["VITE_", "REACT_APP_"],
  esbuild: {
    loader: "jsx",
    include: /src\/.*\.[jt]sx?$/,
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
  build: {
    outDir: "build",
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes("node_modules")) {
            return undefined;
          }

          const moduleId = id.replace(/\\/g, "/");

          if (moduleId.includes("/node_modules/@tiptap/") || moduleId.includes("/node_modules/prosemirror-")) {
            return "vendor-editor";
          }

          if (
            moduleId.includes("/node_modules/react/") ||
            moduleId.includes("/node_modules/react-dom/") ||
            moduleId.includes("/node_modules/react-router/") ||
            moduleId.includes("/node_modules/react-router-dom/") ||
            moduleId.includes("/node_modules/scheduler/")
          ) {
            return "vendor-react";
          }

          if (moduleId.includes("/node_modules/@radix-ui/")) {
            return "vendor-radix";
          }

          if (moduleId.includes("/node_modules/framer-motion/")) {
            return "vendor-motion";
          }

          if (moduleId.includes("/node_modules/recharts/") || moduleId.includes("/node_modules/d3-")) {
            return "vendor-charts";
          }

          if (moduleId.includes("/node_modules/lucide-react/")) {
            return "vendor-icons";
          }

          if (moduleId.includes("/node_modules/axios/") || moduleId.includes("/node_modules/dompurify/")) {
            return "vendor-network";
          }

          return "vendor";
        },
      },
    },
  },
});
