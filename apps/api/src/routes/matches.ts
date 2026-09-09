import type { FastifyInstance } from 'fastify';
import { prisma } from '@betting/db';
import { CreateMatchInputSchema, UpdateMatchInputSchema } from '@betting/types';

function detectStreamType(url: string): 'YOUTUBE' | 'HLS' | 'IFRAME' | 'RTMP' {
  if (/youtube\.com|youtu\.be/i.test(url)) return 'YOUTUBE';
  if (url.endsWith('.m3u8')) return 'HLS';
  if (url.startsWith('rtmp://') || url.startsWith('rtmps://')) return 'RTMP';
  return 'IFRAME';
}

export async function matchRoutes(app: FastifyInstance) {
  // GET /matches — list matches (with filters)
  app.get('/', async (request, reply) => {
    const { status, sportId, page = 1, limit = 20 } = request.query as {
      status?: string; sportId?: string; page?: number; limit?: number;
    };
    const skip = (Number(page) - 1) * Number(limit);
    const where = {
      ...(status ? { status: status as never } : {}),
      ...(sportId ? { sportId } : {}),
    };

    const [matches, total] = await Promise.all([
      prisma.match.findMany({
        where,
        include: { sport: true, rooms: { where: { status: 'LIVE' }, take: 1 } },
        orderBy: { startTime: 'asc' },
        skip,
        take: Number(limit),
      }),
      prisma.match.count({ where }),
    ]);

    return reply.send({ data: matches, total, page: Number(page), limit: Number(limit), totalPages: Math.ceil(total / Number(limit)) });
  });

  // GET /matches/:id
  app.get('/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    const match = await prisma.match.findUnique({
      where: { id },
      include: {
        sport: true,
        markets: { include: { odds: { where: { isActive: true } } } },
        rooms: { where: { status: 'LIVE' }, take: 1 },
      },
    });
    if (!match) return reply.status(404).send({ statusCode: 404, error: 'Not Found', message: 'Match not found' });
    return reply.send(match);
  });

  // POST /matches — admin only
  app.post('/', async (request, reply) => {
    if (request.userRole !== 'ADMIN' && request.userRole !== 'SUPERADMIN') {
      return reply.status(403).send({ statusCode: 403, error: 'Forbidden', message: 'Admin only' });
    }
    const body = CreateMatchInputSchema.parse(request.body);
    const streamType = body.streamUrl ? detectStreamType(body.streamUrl) : null;

    const match = await prisma.match.create({
      data: { ...body, streamType },
    });
    return reply.status(201).send(match);
  });

  // PATCH /matches/:id — admin only
  app.patch('/:id', async (request, reply) => {
    if (request.userRole !== 'ADMIN' && request.userRole !== 'SUPERADMIN') {
      return reply.status(403).send({ statusCode: 403, error: 'Forbidden', message: 'Admin only' });
    }
    const { id } = request.params as { id: string };
    const body = UpdateMatchInputSchema.parse(request.body);
    const streamType = body.streamUrl ? detectStreamType(body.streamUrl) : undefined;

    const match = await prisma.match.update({
      where: { id },
      data: { ...body, ...(streamType ? { streamType } : {}) },
    });
    return reply.send(match);
  });

  // DELETE /matches/:id — admin only
  app.delete('/:id', async (request, reply) => {
    if (request.userRole !== 'ADMIN' && request.userRole !== 'SUPERADMIN') {
      return reply.status(403).send({ statusCode: 403, error: 'Forbidden', message: 'Admin only' });
    }
    const { id } = request.params as { id: string };
    await prisma.match.delete({ where: { id } });
    return reply.status(204).send();
  });
}
