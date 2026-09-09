import type { FastifyInstance } from 'fastify';
import { prisma } from '@betting/db';
import { CreateMarketInputSchema, UpdateOddsInputSchema, SettleMarketInputSchema } from '@betting/types';
import { Queue } from 'bullmq';
import { env } from '../env.js';

let settlementQueue: Queue | null = null;
function getSettlementQueue() {
  if (!settlementQueue) {
    settlementQueue = new Queue('settlement', {
      connection: { url: env.REDIS_URL },
    });
  }
  return settlementQueue;
}

export async function marketRoutes(app: FastifyInstance) {
  // GET /markets/:matchId — all markets for a match
  app.get('/match/:matchId', async (request, reply) => {
    const { matchId } = request.params as { matchId: string };
    const markets = await prisma.market.findMany({
      where: { matchId },
      include: { odds: { where: { isActive: true } } },
      orderBy: { createdAt: 'asc' },
    });
    return reply.send(markets);
  });

  // POST /markets — create market (admin only)
  app.post('/', async (request, reply) => {
    if (request.userRole !== 'ADMIN' && request.userRole !== 'SUPERADMIN') {
      return reply.status(403).send({ statusCode: 403, error: 'Forbidden', message: 'Admin only' });
    }
    const body = CreateMarketInputSchema.parse(request.body);

    const market = await prisma.market.create({
      data: {
        matchId: body.matchId,
        type: body.type,
        label: body.label,
        odds: { create: body.odds },
      },
      include: { odds: true },
    });
    return reply.status(201).send(market);
  });

  // PATCH /markets/:id/odds — update live odds (admin only)
  app.patch('/:id/odds', async (request, reply) => {
    if (request.userRole !== 'ADMIN' && request.userRole !== 'SUPERADMIN') {
      return reply.status(403).send({ statusCode: 403, error: 'Forbidden', message: 'Admin only' });
    }
    const { id } = request.params as { id: string };
    const body = UpdateOddsInputSchema.parse(request.body);

    const market = await prisma.market.findUnique({ where: { id }, include: { odds: true, match: true } });
    if (!market) return reply.status(404).send({ statusCode: 404, error: 'Not Found', message: 'Market not found' });
    if (market.status !== 'OPEN') return reply.status(400).send({ statusCode: 400, error: 'Bad Request', message: 'Market is not open' });

    // Build update event payload
    const updates = [];
    for (const update of body.selections) {
      const existing = market.odds.find((o) => o.id === update.oddsId);
      if (!existing) continue;
      const oldPrice = Number(existing.price);
      const newPrice = update.price;
      await prisma.odds.update({ where: { id: update.oddsId }, data: { price: newPrice } });
      updates.push({
        oddsId: update.oddsId,
        selection: existing.selection,
        oldPrice,
        newPrice,
        direction: newPrice > oldPrice ? 'UP' : newPrice < oldPrice ? 'DOWN' : 'UNCHANGED',
      });
    }

    // Publish odds update to Redis pub/sub → Socket.IO broadcast
    const event = JSON.stringify({
      marketId: id,
      matchId: market.matchId,
      updates,
      timestamp: Date.now(),
    });
    await app.redis.publish('odds:update', event);

    // Audit log
    await prisma.auditLog.create({
      data: {
        actorId: request.userId!,
        action: 'UPDATE_ODDS',
        entityType: 'Market',
        entityId: id,
        metadata: { updates },
      },
    });

    return reply.send({ marketId: id, updates });
  });

  // PATCH /markets/:id/suspend — suspend/reopen market (admin only)
  app.patch('/:id/suspend', async (request, reply) => {
    if (request.userRole !== 'ADMIN' && request.userRole !== 'SUPERADMIN') {
      return reply.status(403).send({ statusCode: 403, error: 'Forbidden', message: 'Admin only' });
    }
    const { id } = request.params as { id: string };
    const { suspended } = request.body as { suspended: boolean };

    const market = await prisma.market.update({
      where: { id },
      data: { status: suspended ? 'SUSPENDED' : 'OPEN' },
    });

    // Notify clients
    const { getIO } = await import('../gateways/socket.gateway.js');
    getIO()?.to(`match:${market.matchId}`).emit('market:status', {
      marketId: id,
      status: market.status,
      timestamp: Date.now(),
    });

    return reply.send(market);
  });

  // POST /markets/:id/settle — settle market (admin only)
  app.post('/:id/settle', async (request, reply) => {
    if (request.userRole !== 'ADMIN' && request.userRole !== 'SUPERADMIN') {
      return reply.status(403).send({ statusCode: 403, error: 'Forbidden', message: 'Admin only' });
    }
    const { id } = request.params as { id: string };
    const body = SettleMarketInputSchema.parse(request.body);

    const market = await prisma.market.findUnique({ where: { id } });
    if (!market) return reply.status(404).send({ statusCode: 404, error: 'Not Found', message: 'Market not found' });
    if (market.status !== 'OPEN' && market.status !== 'SUSPENDED') {
      return reply.status(400).send({ statusCode: 400, error: 'Bad Request', message: 'Market cannot be settled' });
    }

    await prisma.market.update({
      where: { id },
      data: { status: 'SETTLED', settledAt: new Date(), winningSelection: body.winningSelection },
    });

    // Enqueue settlement job
    await getSettlementQueue().add('settle-market', { marketId: id, winningSelection: body.winningSelection });

    // Audit log
    await prisma.auditLog.create({
      data: {
        actorId: request.userId!,
        action: 'SETTLE_MARKET',
        entityType: 'Market',
        entityId: id,
        metadata: { winningSelection: body.winningSelection },
      },
    });

    return reply.send({ message: 'Market settled — payouts processing', marketId: id });
  });
}
