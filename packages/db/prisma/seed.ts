import { PrismaClient } from '@prisma/client';
import { hash } from 'argon2';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // ── Sports ─────────────────────────────────────────────────────────────────
  const sports = await Promise.all([
    prisma.sport.upsert({
      where: { slug: 'football' },
      update: {},
      create: { name: 'Football', slug: 'football', iconUrl: null },
    }),
    prisma.sport.upsert({
      where: { slug: 'basketball' },
      update: {},
      create: { name: 'Basketball', slug: 'basketball', iconUrl: null },
    }),
    prisma.sport.upsert({
      where: { slug: 'tennis' },
      update: {},
      create: { name: 'Tennis', slug: 'tennis', iconUrl: null },
    }),
    prisma.sport.upsert({
      where: { slug: 'cricket' },
      update: {},
      create: { name: 'Cricket', slug: 'cricket', iconUrl: null },
    }),
  ]);
  console.log(`✅ Upserted ${sports.length} sports`);

  // ── Admin User ─────────────────────────────────────────────────────────────
  const adminPassword = await hash('Admin@123456!');
  const admin = await prisma.user.upsert({
    where: { email: 'admin@bettingplatform.com' },
    update: {},
    create: {
      email: 'admin@bettingplatform.com',
      passwordHash: adminPassword,
      role: 'ADMIN',
      kycStatus: 'APPROVED',
      displayName: 'Platform Admin',
    },
  });
  console.log(`✅ Admin user: ${admin.email}`);

  // ── Demo Client User ────────────────────────────────────────────────────────
  const clientPassword = await hash('Client@123456!');
  const client = await prisma.user.upsert({
    where: { email: 'demo@bettingplatform.com' },
    update: {},
    create: {
      email: 'demo@bettingplatform.com',
      passwordHash: clientPassword,
      role: 'USER',
      kycStatus: 'APPROVED',
      displayName: 'Demo User',
      wallet: {
        create: {
          balance: 1000.00,
          currency: 'USD',
        },
      },
    },
  });
  console.log(`✅ Demo client: ${client.email} (wallet: $1000)`);

  // Admin wallet
  await prisma.wallet.upsert({
    where: { userId: admin.id },
    update: {},
    create: { userId: admin.id, balance: 0, currency: 'USD' },
  });

  // ── Matches ─────────────────────────────────────────────────────────────────
  const football = sports.find((s) => s.slug === 'football')!;
  const basketball = sports.find((s) => s.slug === 'basketball')!;

  const now = new Date();
  const inOneHour = new Date(now.getTime() + 60 * 60 * 1000);
  const inThreeHours = new Date(now.getTime() + 3 * 60 * 60 * 1000);
  const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);

  const match1 = await prisma.match.create({
    data: {
      sportId: football.id,
      teamA: 'Manchester City',
      teamB: 'Arsenal',
      startTime: inOneHour,
      status: 'LIVE',
      streamUrl: 'https://www.youtube.com/embed/live_stream?channel=UCxxxxxx',
      streamType: 'YOUTUBE',
      venue: 'Etihad Stadium',
      markets: {
        create: [
          {
            type: 'MATCH_WINNER',
            label: 'Match Winner',
            status: 'OPEN',
            odds: {
              create: [
                { selection: 'Manchester City', price: 1.85 },
                { selection: 'Draw', price: 3.50 },
                { selection: 'Arsenal', price: 4.20 },
              ],
            },
          },
          {
            type: 'OVER_UNDER',
            label: 'Over / Under 2.5 Goals',
            status: 'OPEN',
            odds: {
              create: [
                { selection: 'Over 2.5', price: 1.72 },
                { selection: 'Under 2.5', price: 2.10 },
              ],
            },
          },
        ],
      },
    },
  });
  console.log(`✅ Match: ${match1.teamA} vs ${match1.teamB}`);

  const match2 = await prisma.match.create({
    data: {
      sportId: basketball.id,
      teamA: 'LA Lakers',
      teamB: 'Golden State Warriors',
      startTime: inThreeHours,
      status: 'UPCOMING',
      venue: 'Crypto.com Arena',
      markets: {
        create: [
          {
            type: 'MATCH_WINNER',
            label: 'Match Winner',
            status: 'OPEN',
            odds: {
              create: [
                { selection: 'LA Lakers', price: 2.10 },
                { selection: 'Golden State Warriors', price: 1.75 },
              ],
            },
          },
        ],
      },
    },
  });
  console.log(`✅ Match: ${match2.teamA} vs ${match2.teamB}`);

  const match3 = await prisma.match.create({
    data: {
      sportId: football.id,
      teamA: 'Real Madrid',
      teamB: 'Barcelona',
      startTime: yesterday,
      status: 'COMPLETED',
      scoreA: 2,
      scoreB: 1,
      venue: 'Santiago Bernabéu',
    },
  });
  console.log(`✅ Match (completed): ${match3.teamA} vs ${match3.teamB}`);

  // ── Match Room for live match ────────────────────────────────────────────────
  await prisma.matchRoom.create({
    data: {
      matchId: match1.id,
      hostId: admin.id,
      livekitRoomName: `room-${match1.id}`,
      status: 'LIVE',
      startedAt: new Date(),
    },
  });
  console.log(`✅ Match room created for ${match1.teamA} vs ${match1.teamB}`);

  console.log('\n🎉 Seeding complete!');
  console.log('\n--- Demo Credentials ---');
  console.log('Admin: admin@bettingplatform.com / Admin@123456!');
  console.log('Client: demo@bettingplatform.com / Client@123456!');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(() => {
    void prisma.$disconnect();
  });
