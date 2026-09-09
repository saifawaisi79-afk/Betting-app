import { Server as SocketIOServer } from 'socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import { Redis } from 'ioredis';
import type { Server as HTTPServer } from 'node:http';
import { env } from '../env.js';

let io: SocketIOServer | null = null;

export function getIO() {
  return io;
}

export async function createSocketGateway(httpServer: HTTPServer): Promise<SocketIOServer> {
  const pubClient = new Redis(env.REDIS_URL, { lazyConnect: true });
  const subClient = pubClient.duplicate();
  await Promise.all([pubClient.connect(), subClient.connect()]);

  io = new SocketIOServer(httpServer, {
    cors: {
      origin: env.CORS_ORIGINS.split(','),
      credentials: true,
    },
    transports: ['websocket', 'polling'],
  });

  // Redis adapter for horizontal scaling — all API instances share the same pub/sub
  io.adapter(createAdapter(pubClient, subClient));

  // ── Namespaces ─────────────────────────────────────────────────────────────

  // /odds namespace — subscribe to a match's odds updates
  const oddsNs = io.of('/odds');
  oddsNs.on('connection', (socket) => {
    socket.on('subscribe:match', (matchId: string) => {
      void socket.join(`match:${matchId}`);
    });
    socket.on('unsubscribe:match', (matchId: string) => {
      void socket.leave(`match:${matchId}`);
    });
  });

  // /room namespace — room presence + host speaking status
  const roomNs = io.of('/room');
  roomNs.on('connection', (socket) => {
    socket.on('join:room', (roomId: string) => {
      void socket.join(`room:${roomId}`);
    });
    socket.on('leave:room', (roomId: string) => {
      void socket.leave(`room:${roomId}`);
    });
  });

  // /bets namespace — personal bet status updates
  const betsNs = io.of('/bets');
  betsNs.on('connection', (socket) => {
    socket.on('subscribe:user', (userId: string) => {
      void socket.join(`user:${userId}`);
    });
  });

  // ── Redis pub/sub subscriber for odds updates ──────────────────────────────
  // The main API publishes to 'odds:update' channel after admin pushes odds
  const oddsSubClient = pubClient.duplicate();
  await oddsSubClient.connect();
  await oddsSubClient.subscribe('odds:update');

  oddsSubClient.on('message', (_channel, message) => {
    try {
      const data = JSON.parse(message) as { matchId: string };
      // Broadcast to all clients watching this match
      oddsNs.to(`match:${data.matchId}`).emit('odds:update', data);
    } catch {
      // malformed message — ignore
    }
  });

  console.log('🔌 Socket.IO gateway initialized with Redis adapter');
  return io;
}
