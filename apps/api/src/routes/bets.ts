import type { FastifyInstance } from 'fastify';
import { prisma } from '@betting/db';
import { PlaceBetInputSchema } from '@betting/types';
import { v4 as uuidv4 } from 'uuid';

export async function betRoutes(app: FastifyInstance) {
  // GET /bets — user's bets
  app.get('/', async (request, reply) => {
    const userId = request.userId;
    if (!userId) return reply.status(401).send({ statusCode: 401, error: 'Unauthorized', message: 'Not authenticated' });

    const { status, page = 1, limit = 20 } = request.query as { status?: string; page?: number; limit?: number };
    const skip = (page - 1) * limit;

    const where = { userId, ...(status ? { status: status as never } : {}) };
    const [bets, total] = await Promise.all([
      prisma.bet.findMany({
        where,
        include: { market: { include: { match: true } } },
        orderBy: { placedAt: 'desc' },
        skip,
        take: Number(limit),
      }),
      prisma.bet.count({ where }),
    ]);

    return reply.send({ data: bets, total, page: Number(page), limit: Number(limit), totalPages: Math.ceil(total / limit) });
  });

  // POST /bets — place a bet
  app.post('/', {
    config: { rateLimit: { max: 20, timeWindow: '1 minute' } },
  }, async (request, reply) => {
    const userId = request.userId;
    if (!userId) return reply.status(401).send({ statusCode: 401, error: 'Unauthorized', message: 'Not authenticated' });

    const body = PlaceBetInputSchema.parse(request.body);

    // Check KYC
    const user = await prisma.user.findUnique({ where: { id: userId }, include: { wallet: true } });
    if (!user) return reply.status(404).send({ statusCode: 404, error: 'Not Found', message: 'User not found' });
    if (user.kycStatus !== 'APPROVED') {
      return reply.status(403).send({ statusCode: 403, error: 'Forbidden', message: 'KYC verification required before placing bets' });
    }

    // Idempotency — prevent double-submit
    const existing = await prisma.bet.findUnique({ where: { idempotencyKey: body.idempotencyKey } });
    if (existing) return reply.status(200).send(existing); // Return existing bet

    // Fetch odds
    const odds = await prisma.odds.findUnique({
      where: { id: body.oddsId },
      include: { market: true },
    });
    if (!odds || !odds.isActive) {
      return reply.status(400).send({ statusCode: 400, error: 'Bad Request', message: 'Odds not available' });
    }
    if (odds.market.status !== 'OPEN') {
      return reply.status(400).send({ statusCode: 400, error: 'Bad Request', message: 'Market is not open' });
    }
    if (odds.selection !== body.selection) {
      return reply.status(400).send({ statusCode: 400, error: 'Bad Request', message: 'Selection mismatch' });
    }

    const oddsPrice = Number(odds.price);
    const stake = body.stake;
    const potentialPayout = parseFloat((stake * oddsPrice).toFixed(2));
    const wallet = user.wallet;
    if (!wallet) return reply.status(400).send({ statusCode: 400, error: 'Bad Request', message: 'Wallet not found' });

    const availableBalance = Number(wallet.balance) - Number(wallet.lockedBalance);
    if (availableBalance < stake) {
      return reply.status(400).send({ statusCode: 400, error: 'Bad Request', message: 'Insufficient balance' });
    }

    // Atomic: lock balance + create bet
    const bet = await prisma.$transaction(async (tx) => {
      await tx.wallet.update({
        where: { userId },
        data: { lockedBalance: { increment: stake } },
      });

      await tx.transaction.create({
        data: {
          walletId: wallet.id,
          type: 'BET',
          amount: stake,
          status: 'PENDING',
          reference: body.idempotencyKey,
          idempotencyKey: body.idempotencyKey,
        },
      });

      return tx.bet.create({
        data: {
          userId,
          marketId: body.marketId,
          oddsId: body.oddsId,
          selection: body.selection,
          oddsPrice,
          stake,
          potentialPayout,
          idempotencyKey: body.idempotencyKey,
        },
      });
    });

    // Emit bet placed event via Socket.IO
    const { getIO } = await import('../gateways/socket.gateway.js');
    getIO()?.to(`user:${userId}`).emit('bet:placed', {
      betId: bet.id,
      userId,
      status: 'PENDING',
      potentialPayout,
      timestamp: Date.now(),
    });

    return reply.status(201).send(bet);
  });

  // POST /bets/:id/cashout
  app.post('/:id/cashout', async (request, reply) => {
    const userId = request.userId;
    if (!userId) return reply.status(401).send({ statusCode: 401, error: 'Unauthorized', message: 'Not authenticated' });

    const { id } = request.params as { id: string };
    const bet = await prisma.bet.findUnique({ where: { id }, include: { market: true } });

    if (!bet || bet.userId !== userId) {
      return reply.status(404).send({ statusCode: 404, error: 'Not Found', message: 'Bet not found' });
    }
    if (bet.status !== 'PENDING') {
      return reply.status(400).send({ statusCode: 400, error: 'Bad Request', message: 'Bet cannot be cashed out' });
    }
    if (bet.market.status !== 'OPEN') {
      return reply.status(400).send({ statusCode: 400, error: 'Bad Request', message: 'Market is not open for cash out' });
    }

    // Stub: cash-out value = 80% of potential payout
    const cashOutAmount = parseFloat((Number(bet.potentialPayout) * 0.8).toFixed(2));
    const stake = Number(bet.stake);

    const wallet = await prisma.wallet.findUnique({ where: { userId } });
    if (!wallet) return reply.status(400).send({ statusCode: 400, error: 'Bad Request', message: 'Wallet not found' });

    await prisma.$transaction(async (tx) => {
      await tx.bet.update({
        where: { id },
        data: { status: 'CASHED_OUT', cashOutAmount, settledAt: new Date() },
      });

      // Release locked balance + add cashout amount
      await tx.wallet.update({
        where: { userId },
        data: {
          lockedBalance: { decrement: stake },
          balance: { increment: cashOutAmount },
        },
      });

      await tx.transaction.create({
        data: {
          walletId: wallet.id,
          type: 'PAYOUT',
          amount: cashOutAmount,
          status: 'COMPLETED',
          reference: `cashout:${id}`,
          idempotencyKey: `cashout:${id}`,
        },
      });
    });

    return reply.send({ cashOutAmount, betId: id, status: 'CASHED_OUT' });
  });
}
