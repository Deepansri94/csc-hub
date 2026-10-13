import express from 'express';
import http from 'http';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { initWhatsAppServer } from './server/whatsappService.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function startServer() {
  const app = express();
  app.use(express.json());
  app.use('/downloads', express.static(path.join(__dirname, 'release')));

  // API: list built release files available for download
  app.get('/api/releases/latest', (req, res) => {
    const releaseDir = path.join(__dirname, 'release');
    const exts = ['.exe', '.AppImage', '.dmg', '.deb', '.zip'];
    try {
      if (!fs.existsSync(releaseDir)) {
        return res.json({ files: [] });
      }
      const files = fs.readdirSync(releaseDir)
        .filter(f => exts.some(e => f.endsWith(e)))
        .map(f => {
          const stat = fs.statSync(path.join(releaseDir, f));
          return {
            name: f,
            url: `/downloads/${f}`,
            size: stat.size,
            builtAt: stat.mtime.toISOString(),
          };
        });
      res.json({ files });
    } catch {
      res.json({ files: [] });
    }
  });

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
