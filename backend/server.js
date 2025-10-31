import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { config } from './config/env.js';
import { errorHandler } from './middleware/errorHandler.js';

// Import routes
import portfolioRoutes from './routes/portfolio.routes.js';
import analysisRoutes from './routes/analysis.routes.js';
import profileRoutes from './routes/profile.routes.js';
import feedRoutes from './routes/feed.routes.js';
import discoverRoutes from './routes/discover.routes.js';
import webhookRoutes from './routes/webhook.routes.js';
import subscriptionRoutes from './routes/subscription.routes.js';
import nftRoutes from './routes/nft.routes.js';
import tokenRoutes from './routes/token.routes.js';
import comparisonRoutes from './routes/comparison.routes.js';
import recommendationsRoutes from './routes/recommendations.routes.js';

// Initialize Express app
const app = express();
const httpServer = createServer(app);

// Initialize Socket.IO
const io = new Server(httpServer, {
  cors: {
    origin: config.frontendUrl,
    methods: ['GET', 'POST'],
  },
});

// Make io accessible in routes
app.set('io', io);

// Middleware
app.use(cors({
  origin: config.frontendUrl,
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API Routes
app.use('/api/portfolio', portfolioRoutes);
app.use('/api/analysis', analysisRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/feed', feedRoutes);
app.use('/api/discover', discoverRoutes);
app.use('/api/webhooks', webhookRoutes);
app.use('/api/subscriptions', subscriptionRoutes);
app.use('/api/nfts', nftRoutes);
app.use('/api/tokens', tokenRoutes);
app.use('/api/comparison', comparisonRoutes);
app.use('/api/recommendations', recommendationsRoutes);

// WebSocket connection handling
io.on('connection', (socket) => {
  console.log('✅ Client connected:', socket.id);

  socket.on('subscribe', (address) => {
    console.log(`📡 ${socket.id} subscribed to ${address}`);
    socket.join(`user:${address}`);
  });

  socket.on('disconnect', () => {
    console.log('❌ Client disconnected:', socket.id);
  });
});

// Error handling middleware (must be last)
app.use(errorHandler);

// Start server
httpServer.listen(config.port, () => {
  console.log(`🚀 Server running on port ${config.port}`);
  console.log(`📡 WebSocket server ready`);
  console.log(`🌍 Environment: ${config.nodeEnv}`);
});