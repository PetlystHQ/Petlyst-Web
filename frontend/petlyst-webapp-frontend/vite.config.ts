import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Tüm çevresel değişkenleri yükle
  const env = loadEnv(mode, process.cwd(), "");
  
  return {
    plugins: [react()],
    css: {
      postcss: './postcss.config.js'
    },
    define: {
      // Çevresel değişkenleri client tarafında erişilebilir yapılandırma
      '__APP_ENV__': JSON.stringify(env),
      // process.env çevresel değişkenlerini destekle
      'process.env': JSON.stringify(process.env)
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    server: {
      // Hata ayıklama için ek loglar
      hmr: {
        overlay: true,
      },
      // Add proxy configuration for API requests
      proxy: {
        '/api': {
          target: 'http://localhost:3000',
          changeOrigin: true,
          secure: false
        }
      }
    }
  };
});
