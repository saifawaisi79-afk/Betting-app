import type { FastifyInstance } from 'fastify';
import { authRoutes } from './auth.js';
import { userRoutes } from './users.js';
import { walletRoutes } from './wallet.js';
import { matchRoutes } from './matches.js';
import { roomRoutes } from './rooms.js';
import { marketRoutes } from './markets.js';
import { betRoutes } from './bets.js';
import { adminRoutes } from './admin.js';
import { livekitWebhookRoute } from './livekit-webhook.js';

export async function registerRoutes(app: FastifyInstance) {
  await app.register(authRoutes, { prefix: '/auth' });
  await app.register(userRoutes, { prefix: '/users' });
  await app.register(walletRoutes, { prefix: '/wallet' });
  await app.register(matchRoutes, { prefix: '/matches' });
  await app.register(roomRoutes, { prefix: '/rooms' });
  await app.register(marketRoutes, { prefix: '/markets' });
  await app.register(betRoutes, { prefix: '/bets' });
  await app.register(adminRoutes, { prefix: '/admin' });
  await app.register(livekitWebhookRoute, { prefix: '/livekit-webhook' });
  app.log.info('✅ All routes registered');
}
