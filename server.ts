import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import apiRouter from './src/backend/routes/api.js';
import dbService from './src/backend/database/db.js';
import { responseHandlerMiddleware } from './src/backend/middlewares/responseHandler.js';
import { rateLimiterMiddleware } from './src/backend/middlewares/rateLimiterMiddleware.js';
import { errorHandlerMiddleware } from './src/backend/middlewares/errorHandlerMiddleware.js';

async function startServer() {
  const app = express();
  const PORT = parseInt(process.env.PORT || '3000', 10);

  // Render & Reverse Proxy Trust Settings
  app.set('trust proxy', 1);

  // Strict CORS configuration
  const allowedOrigins = [
    process.env.FRONTEND_URL,
    process.env.CORS_ORIGIN,
    'http://localhost:3000',
    'http://127.0.0.1:3000',
    'http://localhost:5173',
  ].filter(Boolean) as string[];

  app.use(cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin) || allowedOrigins.includes('*')) {
        callback(null, true);
      } else {
        callback(null, true); // Allow cross-origin requests for mobile/tablet apps
      }
    },
    credentials: true,
  }));

  // Payload limits to prevent Denial of Service (DoS)
  app.use(express.json({ limit: '5mb' }));
  app.use(express.urlencoded({ extended: true, limit: '5mb' }));

  // Security Headers Middleware
  app.use((req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    next();
  });

  app.use(responseHandlerMiddleware);
  app.use('/api', rateLimiterMiddleware);

  // Pre-initialize PostgreSQL Database Engine
  try {
    await dbService.getDb();
    console.log('[THEIAKSHI Backend] PostgreSQL Neon engine initialized successfully.');
  } catch (err) {
    console.error('[THEIAKSHI Backend Error] Database initialization failed:', err);
  }

  // Health check endpoint (for Render healthProbe)
  app.get('/api/health', async (req, res) => {
    let dbStatus = 'disconnected';
    let isConnected = false;
    try {
      await dbService.query('SELECT 1');
      dbStatus = 'connected';
      isConnected = true;
    } catch (e) {
      dbStatus = 'disconnected';
    }

    if (!isConnected) {
      return res.status(503).json({
        success: false,
        service: 'THEIAKSHI ENTERPRISE',
        status: 'unhealthy',
        database: dbStatus,
        timestamp: new Date().toISOString(),
      });
    }

    return res.json({
      success: true,
      service: 'THEIAKSHI ENTERPRISE',
      status: 'healthy',
      database: dbStatus,
      timestamp: new Date().toISOString(),
    });
  });

  // API Router Mount point
  app.use('/api/v1', apiRouter);

  // Global Error Handler Middleware
  app.use(errorHandlerMiddleware);

  // Vite middleware for development vs Production Static & SPA Fallback
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      if (req.path.startsWith('/api')) {
        return res.status(404).json({ success: false, message: `API route '${req.path}' not found` });
      }
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`====================================================`);
    console.log(`THEIAKSHI ONE Enterprise HRMS Server Active`);
    console.log(`Company: THEIAKSHI ENTERPRISES`);
    console.log(`Running on PORT: ${PORT}`);
    console.log(`====================================================`);
  });

  // Graceful Shutdown Handler
  const shutdown = async (signal: string) => {
    console.log(`[THEIAKSHI Server] Received ${signal}. Starting graceful shutdown...`);
    server.close(async () => {
      await dbService.close();
      console.log('[THEIAKSHI Server] Closed HTTP server & PostgreSQL connections.');
      process.exit(0);
    });
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

startServer();
