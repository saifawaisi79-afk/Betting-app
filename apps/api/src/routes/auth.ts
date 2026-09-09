import type { FastifyInstance } from 'fastify';
import { hash, verify as argonVerify } from 'argon2';
import { prisma } from '@betting/db';
import { RegisterInputSchema, LoginInputSchema } from '@betting/types';
import { env } from '../env.js';
import { authenticator } from 'otplib';
import { v4 as uuidv4 } from 'uuid';

export async function authRoutes(app: FastifyInstance) {
  // POST /auth/register
  app.post('/register', {
    config: { rateLimit: { max: 5, timeWindow: '1 minute' } },
  }, async (request, reply) => {
    const body = RegisterInputSchema.parse(request.body);

    // Check uniqueness
    const existing = await prisma.user.findFirst({
      where: {
        OR: [
          body.email ? { email: body.email } : {},
          body.phone ? { phone: body.phone } : {},
        ],
      },
    });
    if (existing) {
      return reply.status(409).send({ statusCode: 409, error: 'Conflict', message: 'User already exists' });
    }

    const passwordHash = await hash(body.password, { type: 2 }); // argon2id
    const user = await prisma.user.create({
      data: {
        email: body.email,
        phone: body.phone,
        passwordHash,
        displayName: body.displayName,
        wallet: { create: { balance: 0, currency: 'USD' } },
      },
    });

    const { accessToken, refreshToken } = await mintTokens(app, user.id, user.role);
    setRefreshCookie(reply, refreshToken);

    return reply.status(201).send({
      accessToken,
      user: { id: user.id, email: user.email, displayName: user.displayName, role: user.role, kycStatus: user.kycStatus },
    });
  });

  // POST /auth/login
  app.post('/login', {
    config: { rateLimit: { max: 10, timeWindow: '1 minute' } },
  }, async (request, reply) => {
    const body = LoginInputSchema.parse(request.body);

    const user = await prisma.user.findFirst({
      where: {
        OR: [{ email: body.identifier }, { phone: body.identifier }],
      },
    });

    if (!user || !(await argonVerify(user.passwordHash, body.password))) {
      return reply.status(401).send({ statusCode: 401, error: 'Unauthorized', message: 'Invalid credentials' });
    }

    if (user.isFrozen) {
      return reply.status(403).send({ statusCode: 403, error: 'Forbidden', message: 'Account is frozen' });
    }

    // 2FA required for ADMIN / SUPERADMIN
    if ((user.role === 'ADMIN' || user.role === 'SUPERADMIN') && user.totpSecret) {
      if (!body.totpCode) {
        return reply.status(200).send({ requiresTwoFactor: true });
      }
      const valid = authenticator.verify({ token: body.totpCode, secret: user.totpSecret });
      if (!valid) {
        return reply.status(401).send({ statusCode: 401, error: 'Unauthorized', message: 'Invalid 2FA code' });
      }
    }

    const { accessToken, refreshToken } = await mintTokens(app, user.id, user.role);
    setRefreshCookie(reply, refreshToken);

    return reply.send({
      accessToken,
      user: { id: user.id, email: user.email, displayName: user.displayName, role: user.role, kycStatus: user.kycStatus },
    });
  });

  // POST /auth/refresh
  app.post('/refresh', async (request, reply) => {
    const refreshToken = request.cookies['refresh_token'];
    if (!refreshToken) {
      return reply.status(401).send({ statusCode: 401, error: 'Unauthorized', message: 'No refresh token' });
    }

    try {
      // Verify using refresh secret directly via jose
      const { jwtVerify, SignJWT } = await import('jose');
      const secret = new TextEncoder().encode(env.JWT_REFRESH_SECRET);
      const { payload } = await jwtVerify(refreshToken, secret);
      const userId = payload['sub'] as string;
      const role = payload['role'] as string;

      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (!user || user.isFrozen) throw new Error('User not found or frozen');

      const { accessToken, refreshToken: newRefreshToken } = await mintTokens(app, userId, role);
      setRefreshCookie(reply, newRefreshToken);

      return reply.send({ accessToken });
    } catch {
      clearRefreshCookie(reply);
      return reply.status(401).send({ statusCode: 401, error: 'Unauthorized', message: 'Invalid refresh token' });
    }
  });

  // POST /auth/logout
  app.post('/logout', async (_request, reply) => {
    clearRefreshCookie(reply);
    return reply.send({ message: 'Logged out' });
  });

  // POST /auth/setup-totp (admin only — sets up 2FA)
  app.post('/setup-totp', async (request, reply) => {
    const userId = request.userId;
    if (!userId) return reply.status(401).send({ statusCode: 401, error: 'Unauthorized', message: 'Not authenticated' });

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user || (user.role !== 'ADMIN' && user.role !== 'SUPERADMIN')) {
      return reply.status(403).send({ statusCode: 403, error: 'Forbidden', message: 'Admin only' });
    }

    const secret = authenticator.generateSecret();
    const otpauthUrl = authenticator.keyuri(user.email ?? userId, env.TOTP_ISSUER, secret);

    // Store secret temporarily — must be confirmed with /auth/verify-totp before it's activated
    await app.redis.setex(`totp:pending:${userId}`, 300, secret);

    return reply.send({ secret, otpauthUrl });
  });

  // POST /auth/verify-totp
  app.post('/verify-totp', async (request, reply) => {
    const userId = request.userId;
    if (!userId) return reply.status(401).send({ statusCode: 401, error: 'Unauthorized', message: 'Not authenticated' });

    const { code } = request.body as { code: string };
    const secret = await app.redis.get(`totp:pending:${userId}`);
    if (!secret) return reply.status(400).send({ statusCode: 400, error: 'Bad Request', message: 'No pending TOTP setup' });

    const valid = authenticator.verify({ token: code, secret });
    if (!valid) return reply.status(400).send({ statusCode: 400, error: 'Bad Request', message: 'Invalid TOTP code' });

    await prisma.user.update({ where: { id: userId }, data: { totpSecret: secret } });
    await app.redis.del(`totp:pending:${userId}`);

    return reply.send({ message: '2FA enabled successfully' });
  });
}

// ── Helpers ──────────────────────────────────────────────────────────────────

async function mintTokens(app: FastifyInstance, userId: string, role: string) {
  const { SignJWT } = await import('jose');

  const accessSecret = new TextEncoder().encode(env.JWT_ACCESS_SECRET);
  const refreshSecret = new TextEncoder().encode(env.JWT_REFRESH_SECRET);

  const accessToken = await new SignJWT({ sub: userId, role })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(env.JWT_ACCESS_EXPIRES_IN)
    .sign(accessSecret);

  const refreshToken = await new SignJWT({ sub: userId, role })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(env.JWT_REFRESH_EXPIRES_IN)
    .sign(refreshSecret);

  return { accessToken, refreshToken };
}

function setRefreshCookie(reply: Parameters<typeof authRoutes>[0]['initialConfig'] extends never ? never : ReturnType<FastifyInstance['server']['on']> extends never ? never : Parameters<FastifyInstance['addHook']>[1] extends never ? never : unknown, refreshToken: string) {
  // @ts-expect-error reply typing
  void reply.setCookie('refresh_token', refreshToken, {
    httpOnly: true,
    secure: env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
    maxAge: 7 * 24 * 60 * 60, // 7 days
  });
}

function clearRefreshCookie(reply: unknown) {
  // @ts-expect-error reply typing
  void reply.clearCookie('refresh_token', { path: '/' });
}
