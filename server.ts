import express from 'express';
import http from 'http';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { initWhatsAppServer } from './server/whatsappService.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function startServer() {
  const app = express();
  app.use(express.json());
  app.use('/downloads', express.static(path.join(__dirname, 'release')));

  // Initialize Baileys WhatsApp backend service
  await initWhatsAppServer(app);

  const server = http.createServer(app);

  // Vite middleware for development with HMR disabled for cloud container stability
  const vite = await createViteServer({
    server: {
      middlewareMode: true,
      hmr: false,
    },
    appType: 'spa',
  });

  app.use(vite.middlewares);

  const port = process.env.PORT || 3000;
  server.listen(Number(port), '0.0.0.0', () => {
    console.log(`🚀 CSC Kiosk Full-Stack Server running at http://localhost:${port}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
});
