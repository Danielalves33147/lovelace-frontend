import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    host: true,  // Permite que o Railway acesse o frontend externamente
    port: process.env.PORT || 3000,  // Usa a porta definida pelo Railway
    strictPort: true, // Garante que use a porta correta
  },
  preview: {
    host: true, // Permite acesso externo na pré-visualização do Vite
    port: process.env.PORT || 3000,
    strictPort: true,
  },
});
