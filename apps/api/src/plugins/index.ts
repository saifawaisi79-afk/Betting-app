import type { FastifyInstance } from 'fastify';
import fastifyCors from '@fastify/cors';
import fastifyHelmet from '@fastify/helmet';
import fastifyCookie from '@fastify/cookie';
import fastifyJwt from '@fastify/jwt';
import fastifyRateLimit from '@fastify/rate-limit';
import { env } from '../env.js';
import { prisma } from '@betting/db';
import { Redis } from 'ioredis';
import { LiveKitProvider } from '@betting/audio-sdk';

// Extend Fastify type declarations
declare module 'fastify' {
  interface FastifyInstance {
    redis: Redis;
    audioProvider: LiveKitProvider;
  }
  interface FastifyRequest {
    userId?: string;
    userRole?: string;
  }
}

export async function registerPlugins(app: FastifyInstance) {
  // CORS
  await app.register(fastifyCors, {
    origin: env.CORS_ORIGINS.split(','),
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  });

  // Security headers
  await app.register(fastifyHelmet, {
    contentSecurityPolicy: false, // managed by Next.js apps
  });

  // Cookies (for httpOnly refresh token)
  await app.register(fastifyCookie, {
    secret: env.JWT_REFRESH_SECRET,
  });

  // JWT (access token in Authorization header)
  await app.register(fastifyJwt, {
    secret: env.JWT_ACCESS_SECRET,
    sign: { expiresIn: env.JWT_ACCESS_EXPIRES_IN },
  });

  // Rate limiting (backed by Redis)
  const redis = new Redis(env.REDIS_URL, { lazyConnect: true });
  await redis.connect();

  await app.register(fastifyRateLimit, {
    global: true,
    max: 100,
    timeWindow: '1 minute',
    redis,
  });

  // Decorate app with shared services
  app.decorate('redis', redis);
  app.decorate('audioProvider', new LiveKitProvider());

  // Decorate with Prisma (for use in route handlers)
  app.decorate('prisma', prisma);

  // Auth hook — verify JWT on protected routes
  app.addHook('onRequest', async (request) => {
    const path = request.routeOptions?.url ?? '';
    const isPublic =
      path.startsWith('/auth') ||
      path.startsWith('/health') ||
      path.startsWith('/livekit-webhook');

    if (isPublic) return;

    try {
      const payload = await request.jwtVerify<{ sub: string; role: string }>();
      request.userId = payload.sub;
      request.userRole = payload.role;
    } catch {
      // non-public routes will return 401 automatically from fastify-jwt
    }
  });

  // Health check
  app.get('/health', async () => ({ status: 'ok', ts: new Date().toISOString() }));

  app.log.info('✅ All plugins registered');
}
