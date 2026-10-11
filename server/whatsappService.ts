import express from 'express';
import { makeWASocket, useMultiFileAuthState, DisconnectReason } from '@whiskeysockets/baileys';
import pino from 'pino';
import path from 'path';
import fs from 'fs';

const router = express.Router();
let sock: any = null;
let qrCodeData = '';
let connectionState = 'disconnected';
let reconnectAttempts = 0;

const authDir = path.join(process.env.HOME || '/tmp', '.csc_whatsapp_auth');

export async function initWhatsAppServer(app: express.Application) {
  try {
    if (!fs.existsSync(authDir)) {
      fs.mkdirSync(authDir, { recursive: true });
    }

    const { state, saveCreds } = await useMultiFileAuthState(authDir);

    async function connectToWhatsApp() {
      try {
        sock = makeWASocket({
          auth: state,
          printQRInTerminal: false,
          logger: pino({ level: 'silent' }),
        });

        sock.ev.on('creds.update', saveCreds);

        sock.ev.on('connection.update', (update: any) => {
          const { connection, lastDisconnect, qr } = update;
          if (qr) {
            qrCodeData = qr;
            connectionState = 'qr_ready';
            reconnectAttempts = 0;
            console.log('[WhatsApp] QR Code generated successfully.');
          }
          if (connection === 'close') {
            connectionState = 'disconnected';
            const statusCode = lastDisconnect?.error?.output?.statusCode;
            const shouldReconnect = statusCode !== DisconnectReason.loggedOut && reconnectAttempts < 5;
            
            if (shouldReconnect) {
              reconnectAttempts++;
              const delay = Math.min(reconnectAttempts * 3000, 15000);
              console.log(`[WhatsApp] Connection closed. Reconnecting in ${delay/1000}s (attempt ${reconnectAttempts})...`);
              setTimeout(() => {
                connectToWhatsApp().catch(() => {});
              }, delay);
            } else {
              console.log('[WhatsApp] Connection suspended or logged out. Falling back to wa.me direct links.');
            }
          } else if (connection === 'open') {
            connectionState = 'connected';
            qrCodeData = '';
            reconnectAttempts = 0;
            console.log('[WhatsApp] Connected successfully to WhatsApp network!');
          }
        });
      } catch (err: any) {
        console.warn('[WhatsApp] Connection warning:', err?.message || err);
      }
    }

    // Start connection attempt in background safely
    connectToWhatsApp().catch(() => {});
  } catch (err: any) {
    console.warn('[WhatsApp] Service initialization notice:', err?.message || err);
  }

  // Status endpoint
  router.get('/status', (req, res) => {
    res.json({
      success: true,
      state: connectionState,
      hasQr: !!qrCodeData,
      qr: qrCodeData,
    });
  });

  // Send message endpoint
  router.post('/send', async (req, res) => {
    if (connectionState !== 'connected' || !sock) {
      return res.status(503).json({
        success: false,
        error: 'WhatsApp is not connected in background. Using wa.me click-to-chat fallback.',
      });
    }

    const { phone, message } = req.body;
    if (!phone || !message) {
      return res.status(400).json({ success: false, error: 'Phone and message are required.' });
    }

    try {
      const cleanPhone = phone.replace(/\D/g, '').slice(-10);
      const jid = `91${cleanPhone}@s.whatsapp.net`;
      await sock.sendMessage(jid, { text: message });
      res.json({ success: true, message: 'Message sent silently via Baileys WhatsApp!' });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message || 'Failed to send message' });
    }
  });

  app.use('/api/whatsapp', router);
  console.log('🚀 Baileys WhatsApp backend service mounted at /api/whatsapp');
}
