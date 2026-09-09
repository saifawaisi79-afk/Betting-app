import type { FastifyInstance } from 'fastify';
import { prisma } from '@betting/db';

export async function adminRoutes(app: FastifyInstance) {
  // Guard: all admin routes require ADMIN or SUPERADMIN role
  app.addHook('onRequest', async (request, reply) => {
    if (request.userRole !== 'ADMIN' && request.userRole !== 'SUPERADMIN') {
      return reply.status(403).send({ statusCode: 403, error: 'Forbidden', message: 'Admin access required' });
    }
  });

  // GET /admin/dashboard — live stats
  app.get('/dashboard', async (_request, reply) => {
    const [
      totalUsers,
      activeRooms,
      pendingBets,
      todayBetVolume,
      totalPendingBetsValue,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.matchRoom.count({ where: { status: 'LIVE' } }),
      prisma.bet.count({ where: { status: 'PENDING' } }),
      prisma.bet.aggregate({
        where: { placedAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } },
        _sum: { stake: true },
      }),
      prisma.bet.aggregate({
        where: { status: 'PENDING' },
        _sum: { potentialPayout: true },
      }),
    ]);

    return reply.send({
      totalUsers,
      activeRooms,
      pendingBets,
      todayBetVolume: Number(todayBetVolume._sum.stake ?? 0),
      totalExposure: Number(totalPendingBetsValue._sum.potentialPayout ?? 0),
    });
  });

  // GET /admin/users — paginated user list
  app.get('/users', async (request, reply) => {
    const { page = 1, limit = 50, search } = request.query as { page?: number; limit?: number; search?: string };
    const skip = (Number(page) - 1) * Number(limit);
    const where = search
      ? { OR: [{ email: { contains: search } }, { displayName: { contains: search } }] }
      : {};

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true, email: true, phone: true, displayName: true, role: true,
          kycStatus: true, isFrozen: true, createdAt: true,
          wallet: { select: { balance: true, currency: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: Number(limit),
      }),
      prisma.user.count({ where }),
    ]);

    return reply.send({ data: users, total, page: Number(page), limit: Number(limit), totalPages: Math.ceil(total / Number(limit)) });
  });

  // PATCH /admin/users/:id/freeze — freeze / unfreeze user
  app.patch('/users/:id/freeze', async (request, reply) => {
    const { id } = request.params as { id: string };
    const { frozen } = request.body as { frozen: boolean };

    const user = await prisma.user.update({ where: { id }, data: { isFrozen: frozen } });

    await prisma.auditLog.create({
      data: {
        actorId: request.userId!,
        action: frozen ? 'FREEZE_USER' : 'UNFREEZE_USER',
        entityType: 'User',
        entityId: id,
        metadata: {},
      },
    });

    return reply.send({ id: user.id, isFrozen: user.isFrozen });
  });

  // PATCH /admin/users/:id/kyc — approve/reject KYC
  app.patch('/users/:id/kyc', async (request, reply) => {
    const { id } = request.params as { id: string };
    const { status, note } = request.body as { status: 'APPROVED' | 'REJECTED'; note?: string };

    await prisma.user.update({ where: { id }, data: { kycStatus: status } });
    await prisma.kycDocument.updateMany({
      where: { userId: id, status: 'SUBMITTED' },
      data: { status, reviewedAt: new Date(), reviewNote: note },
    });

    await prisma.auditLog.create({
      data: {
        actorId: request.userId!,
        action: `KYC_${status}`,
        entityType: 'User',
        entityId: id,
        metadata: { note },
      },
    });

    return reply.send({ userId: id, kycStatus: status });
  });

  // PATCH /admin/wallet/:userId/adjust — manual balance adjustment
  app.patch('/wallet/:userId/adjust', async (request, reply) => {
    if (request.userRole !== 'SUPERADMIN') {
      return reply.status(403).send({ statusCode: 403, error: 'Forbidden', message: 'Superadmin only' });
    }
    const { userId } = request.params as { userId: string };
    const { amount, reason } = request.body as { amount: number; reason: string };

    const wallet = await prisma.wallet.findUnique({ where: { userId } });
    if (!wallet) return reply.status(404).send({ statusCode: 404, error: 'Not Found', message: 'Wallet not found' });

    await prisma.$transaction(async (tx) => {
      await tx.wallet.update({ where: { userId }, data: { balance: { increment: amount } } });
      await tx.transaction.create({
        data: {
          walletId: wallet.id,
          type: 'ADJUSTMENT',
          amount: Math.abs(amount),
          status: 'COMPLETED',
          reference: reason,
        },
      });
    });

    await prisma.auditLog.create({
      data: {
        actorId: request.userId!,
        action: 'WALLET_ADJUSTMENT',
        entityType: 'Wallet',
        entityId: wallet.id,
        metadata: { amount, reason },
      },
    });

    return reply.send({ userId, adjustment: amount, reason });
  });

  // GET /admin/audit — audit log
  app.get('/audit', async (request, reply) => {
    const { page = 1, limit = 50 } = request.query as { page?: number; limit?: number };
    const skip = (Number(page) - 1) * Number(limit);

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        include: { actor: { select: { id: true, email: true, displayName: true } } },
        orderBy: { createdAt: 'desc' },
        skip,
        take: Number(limit),
      }),
      prisma.auditLog.count(),
    ]);

    return reply.send({ data: logs, total, page: Number(page), limit: Number(limit), totalPages: Math.ceil(total / Number(limit)) });
  });

  // GET /admin/bets — all bets for admin view
  app.get('/bets', async (request, reply) => {
    const { status, page = 1, limit = 50 } = request.query as { status?: string; page?: number; limit?: number };
    const skip = (Number(page) - 1) * Number(limit);
    const where = status ? { status: status as never } : {};

    const [bets, total] = await Promise.all([
      prisma.bet.findMany({
        where,
        include: {
          user: { select: { id: true, email: true, displayName: true } },
          market: { include: { match: { include: { sport: true } } } },
        },
        orderBy: { placedAt: 'desc' },
        skip,
        take: Number(limit),
      }),
      prisma.bet.count({ where }),
    ]);

    return reply.send({ data: bets, total, page: Number(page), limit: Number(limit), totalPages: Math.ceil(total / Number(limit)) });
  });
}
