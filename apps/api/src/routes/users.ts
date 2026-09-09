import type { FastifyInstance } from 'fastify';
import { prisma } from '@betting/db';

export async function userRoutes(app: FastifyInstance) {
  // GET /users/me
  app.get('/me', async (request, reply) => {
    const userId = request.userId;
    if (!userId) return reply.status(401).send({ statusCode: 401, error: 'Unauthorized', message: 'Not authenticated' });

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true, email: true, phone: true, role: true, kycStatus: true,
        displayName: true, avatarUrl: true, isFrozen: true, createdAt: true,
      },
    });
    if (!user) return reply.status(404).send({ statusCode: 404, error: 'Not Found', message: 'User not found' });
    return reply.send(user);
  });

  // PATCH /users/me
  app.patch('/me', async (request, reply) => {
    const userId = request.userId;
    if (!userId) return reply.status(401).send({ statusCode: 401, error: 'Unauthorized', message: 'Not authenticated' });

    const { displayName, avatarUrl } = request.body as { displayName?: string; avatarUrl?: string };
    const user = await prisma.user.update({
      where: { id: userId },
      data: { ...(displayName ? { displayName } : {}), ...(avatarUrl ? { avatarUrl } : {}) },
      select: { id: true, email: true, displayName: true, avatarUrl: true, role: true, kycStatus: true },
    });
    return reply.send(user);
  });

  // POST /users/kyc — submit KYC documents
  app.post('/kyc', async (request, reply) => {
    const userId = request.userId;
    if (!userId) return reply.status(401).send({ statusCode: 401, error: 'Unauthorized', message: 'Not authenticated' });

    const { docType, fileUrl } = request.body as { docType: string; fileUrl: string };
    const doc = await prisma.kycDocument.create({
      data: { userId, docType, fileUrl, status: 'SUBMITTED' },
    });
    await prisma.user.update({ where: { id: userId }, data: { kycStatus: 'SUBMITTED' } });
    return reply.status(201).send(doc);
  });
}
