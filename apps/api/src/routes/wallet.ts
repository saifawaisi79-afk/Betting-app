import type { FastifyInstance } from 'fastify';
import { prisma } from '@betting/db';
import { DepositInputSchema, WithdrawInputSchema } from '@betting/types';
import Stripe from 'stripe';
import { env } from '../env.js';
import { v4 as uuidv4 } from 'uuid';

function getStripe() {
  if (!env.STRIPE_SECRET_KEY) throw new Error('Stripe not configured');
  return new Stripe(env.STRIPE_SECRET_KEY);
}

export async function walletRoutes(app: FastifyInstance) {
  // GET /wallet — current user's wallet + balance
  app.get('/', async (request, reply) => {
    const userId = request.userId;
    if (!userId) return reply.status(401).send({ statusCode: 401, error: 'Unauthorized', message: 'Not authenticated' });

    const wallet = await prisma.wallet.findUnique({
      where: { userId },
      include: { transactions: { orderBy: { createdAt: 'desc' }, take: 10 } },
    });
    if (!wallet) return reply.status(404).send({ statusCode: 404, error: 'Not Found', message: 'Wallet not found' });

    return reply.send({
      id: wallet.id,
      balance: Number(wallet.balance),
      lockedBalance: Number(wallet.lockedBalance),
      availableBalance: Number(wallet.balance) - Number(wallet.lockedBalance),
      currency: wallet.currency,
      recentTransactions: wallet.transactions,
    });
  });

  // GET /wallet/transactions — paginated transaction history
  app.get('/transactions', async (request, reply) => {
    const userId = request.userId;
    if (!userId) return reply.status(401).send({ statusCode: 401, error: 'Unauthorized', message: 'Not authenticated' });

    const { page = 1, limit = 20 } = request.query as { page?: number; limit?: number };
    const skip = (Number(page) - 1) * Number(limit);

    const wallet = await prisma.wallet.findUnique({ where: { userId } });
    if (!wallet) return reply.status(404).send({ statusCode: 404, error: 'Not Found', message: 'Wallet not found' });

    const [transactions, total] = await Promise.all([
      prisma.transaction.findMany({
        where: { walletId: wallet.id },
        orderBy: { createdAt: 'desc' },
        skip,
        take: Number(limit),
      }),
      prisma.transaction.count({ where: { walletId: wallet.id } }),
    ]);

    return reply.send({ data: transactions, total, page: Number(page), limit: Number(limit), totalPages: Math.ceil(total / Number(limit)) });
  });

  // POST /wallet/deposit — create Stripe Payment Intent (stub)
  app.post('/deposit', async (request, reply) => {
    const userId = request.userId;
    if (!userId) return reply.status(401).send({ statusCode: 401, error: 'Unauthorized', message: 'Not authenticated' });

    const body = DepositInputSchema.parse(request.body);
    const wallet = await prisma.wallet.findUnique({ where: { userId } });
    if (!wallet) return reply.status(404).send({ statusCode: 404, error: 'Not Found', message: 'Wallet not found' });

    const idempotencyKey = uuidv4();

    try {
      const stripe = getStripe();
      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(body.amount * 100), // cents
        currency: body.currency.toLowerCase(),
        metadata: { userId, walletId: wallet.id, idempotencyKey },
      });

      // Create pending transaction — completed by webhook
      await prisma.transaction.create({
        data: {
          walletId: wallet.id,
          type: 'DEPOSIT',
          amount: body.amount,
          status: 'PENDING',
          reference: paymentIntent.id,
          idempotencyKey,
        },
      });

      return reply.status(201).send({
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
        amount: body.amount,
        currency: body.currency,
      });
    } catch (err) {
      if (env.NODE_ENV === 'development') {
        // Dev mode: directly credit wallet (no Stripe needed)
        await prisma.$transaction(async (tx) => {
          await tx.wallet.update({
            where: { userId },
            data: { balance: { increment: body.amount } },
          });
          await tx.transaction.create({
            data: {
              walletId: wallet.id,
              type: 'DEPOSIT',
              amount: body.amount,
              status: 'COMPLETED',
              reference: `dev:${idempotencyKey}`,
              idempotencyKey,
            },
          });
        });
        return reply.status(201).send({ message: 'DEV MODE: Balance added directly', amount: body.amount });
      }
      throw err;
    }
  });

  // POST /wallet/withdraw — request withdrawal
  app.post('/withdraw', async (request, reply) => {
    const userId = request.userId;
    if (!userId) return reply.status(401).send({ statusCode: 401, error: 'Unauthorized', message: 'Not authenticated' });

    const body = WithdrawInputSchema.parse(request.body);
    const wallet = await prisma.wallet.findUnique({ where: { userId } });
    if (!wallet) return reply.status(404).send({ statusCode: 404, error: 'Not Found', message: 'Wallet not found' });

    const available = Number(wallet.balance) - Number(wallet.lockedBalance);
    if (available < body.amount) {
      return reply.status(400).send({ statusCode: 400, error: 'Bad Request', message: 'Insufficient available balance' });
    }

    const idempotencyKey = uuidv4();
    await prisma.$transaction(async (tx) => {
      await tx.wallet.update({
        where: { userId },
        data: { balance: { decrement: body.amount } },
      });
      await tx.transaction.create({
        data: {
          walletId: wallet.id,
          type: 'WITHDRAW',
          amount: body.amount,
          status: 'PENDING', // processed by ops team in production
          idempotencyKey,
        },
      });
    });

    return reply.send({ message: 'Withdrawal request submitted', amount: body.amount });
  });
}
