import { Worker, Queue } from 'bullmq';
import { prisma } from '@betting/db';
import { Redis } from 'ioredis';

const REDIS_URL = process.env['REDIS_URL'] ?? 'redis://localhost:6379';
const connection = new Redis(REDIS_URL, { maxRetriesPerRequest: null });

const payoutQueue = new Queue('payout', { connection });

// ── Settlement Worker ─────────────────────────────────────────────────────────
// Triggered when an admin settles a market
const settlementWorker = new Worker(
  'settlement',
  async (job) => {
    const { marketId, winningSelection } = job.data as { marketId: string; winningSelection: string };
    console.log(`[Settlement] Processing market ${marketId}, winner: ${winningSelection}`);

    // Find all PENDING bets for this market
    const bets = await prisma.bet.findMany({
      where: { marketId, status: 'PENDING' },
      include: { market: true },
    });

    console.log(`[Settlement] Found ${bets.length} pending bets`);

    for (const bet of bets) {
      const isWinner = bet.selection === winningSelection;
      const newStatus = isWinner ? 'WON' : 'LOST';

      await prisma.bet.update({
        where: { id: bet.id },
        data: { status: newStatus, settledAt: new Date() },
      });

      if (isWinner) {
        // Enqueue payout for winning bets
        await payoutQueue.add('process-payout', {
          betId: bet.id,
          userId: bet.userId,
          payout: Number(bet.potentialPayout),
          stake: Number(bet.stake),
        });
      } else {
        // Release locked balance for losing bets (no payout)
        const wallet = await prisma.wallet.findUnique({ where: { userId: bet.userId } });
        if (wallet) {
          await prisma.wallet.update({
            where: { userId: bet.userId },
            data: { lockedBalance: { decrement: Number(bet.stake) } },
          });
          // Mark the bet transaction as completed (stake is gone)
          await prisma.transaction.updateMany({
            where: { idempotencyKey: bet.idempotencyKey },
            data: { status: 'COMPLETED' },
          });
        }
      }
    }

    console.log(`[Settlement] Market ${marketId} settlement complete`);
  },
  { connection, concurrency: 5 },
);

// ── Payout Worker ─────────────────────────────────────────────────────────────
// Processes wallet credits for winning bets
const payoutWorker = new Worker(
  'payout',
  async (job) => {
    const { betId, userId, payout, stake } = job.data as {
      betId: string; userId: string; payout: number; stake: number;
    };
    console.log(`[Payout] Processing bet ${betId} for user ${userId}, payout: ${payout}`);

    const wallet = await prisma.wallet.findUnique({ where: { userId } });
    if (!wallet) {
      throw new Error(`Wallet not found for user ${userId}`);
    }

    await prisma.$transaction(async (tx) => {
      // Credit payout + release locked stake
      await tx.wallet.update({
        where: { userId },
        data: {
          balance: { increment: payout },
          lockedBalance: { decrement: stake },
        },
      });

      // Record payout transaction
      await tx.transaction.create({
        data: {
          walletId: wallet.id,
          type: 'PAYOUT',
          amount: payout,
          status: 'COMPLETED',
          reference: `bet:${betId}`,
          idempotencyKey: `payout:${betId}`,
          metadata: { betId },
        },
      });
    });

    console.log(`[Payout] Credited ${payout} to user ${userId}`);
  },
  { connection, concurrency: 10 },
);

// ── Error Handlers ─────────────────────────────────────────────────────────────
settlementWorker.on('failed', (job, err) => {
  console.error(`[Settlement] Job ${job?.id} failed:`, err);
});

payoutWorker.on('failed', (job, err) => {
  console.error(`[Payout] Job ${job?.id} failed:`, err);
});

console.log('🔧 BullMQ workers started');
console.log('   - settlement: listening for market settlement jobs');
console.log('   - payout: listening for winning bet payout jobs');

// Graceful shutdown
process.on('SIGTERM', async () => {
  await settlementWorker.close();
  await payoutWorker.close();
  await prisma.$disconnect();
  process.exit(0);
});
