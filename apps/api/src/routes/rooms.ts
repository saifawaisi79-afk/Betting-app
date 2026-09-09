import type { FastifyInstance } from 'fastify';
import { prisma } from '@betting/db';
import { CreateRoomInputSchema } from '@betting/types';
import { v4 as uuidv4 } from 'uuid';

export async function roomRoutes(app: FastifyInstance) {
  // POST /rooms — create a match room (admin only)
  app.post('/', async (request, reply) => {
    if (request.userRole !== 'ADMIN' && request.userRole !== 'SUPERADMIN') {
      return reply.status(403).send({ statusCode: 403, error: 'Forbidden', message: 'Admin only' });
    }
    const userId = request.userId!;
    const body = CreateRoomInputSchema.parse(request.body);

    const match = await prisma.match.findUnique({ where: { id: body.matchId } });
    if (!match) return reply.status(404).send({ statusCode: 404, error: 'Not Found', message: 'Match not found' });

    const livekitRoomName = `match-${body.matchId}-${uuidv4().slice(0, 8)}`;

    const room = await prisma.matchRoom.create({
      data: {
        matchId: body.matchId,
        hostId: userId,
        livekitRoomName,
        status: 'SCHEDULED',
      },
    });
    return reply.status(201).send(room);
  });

  // GET /rooms/:id
  app.get('/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    const room = await prisma.matchRoom.findUnique({
      where: { id },
      include: { match: { include: { sport: true } }, host: { select: { id: true, displayName: true, avatarUrl: true } } },
    });
    if (!room) return reply.status(404).send({ statusCode: 404, error: 'Not Found', message: 'Room not found' });
    return reply.send(room);
  });

  // POST /rooms/:id/go-live — start broadcast (admin only)
  app.post('/:id/go-live', async (request, reply) => {
    if (request.userRole !== 'ADMIN' && request.userRole !== 'SUPERADMIN') {
      return reply.status(403).send({ statusCode: 403, error: 'Forbidden', message: 'Admin only' });
    }
    const { id } = request.params as { id: string };
    const room = await prisma.matchRoom.findUnique({ where: { id } });
    if (!room) return reply.status(404).send({ statusCode: 404, error: 'Not Found', message: 'Room not found' });
    if (room.status === 'LIVE') return reply.status(400).send({ statusCode: 400, error: 'Bad Request', message: 'Room is already live' });

    // Create LiveKit room
    await app.audioProvider.createRoom({
      roomName: room.livekitRoomName,
      emptyTimeoutSeconds: 300,
      metadata: JSON.stringify({ roomId: id, matchId: room.matchId }),
    });

    // Update match status to LIVE
    await prisma.$transaction([
      prisma.matchRoom.update({ where: { id }, data: { status: 'LIVE', startedAt: new Date() } }),
      prisma.match.update({ where: { id: room.matchId }, data: { status: 'LIVE' } }),
    ]);

    // Emit room started event
    const { getIO } = await import('../gateways/socket.gateway.js');
    getIO()?.to(`room:${id}`).emit('room:started', { roomId: id, timestamp: Date.now() });

    return reply.send({ message: 'Room is now live', roomId: id });
  });

  // POST /rooms/:id/end — end broadcast (admin only)
  app.post('/:id/end', async (request, reply) => {
    if (request.userRole !== 'ADMIN' && request.userRole !== 'SUPERADMIN') {
      return reply.status(403).send({ statusCode: 403, error: 'Forbidden', message: 'Admin only' });
    }
    const { id } = request.params as { id: string };
    const room = await prisma.matchRoom.findUnique({ where: { id } });
    if (!room) return reply.status(404).send({ statusCode: 404, error: 'Not Found', message: 'Room not found' });

    try {
      await app.audioProvider.deleteRoom(room.livekitRoomName);
    } catch {
      // Room may already be gone — continue
    }

    await prisma.matchRoom.update({
      where: { id },
      data: { status: 'ENDED', endedAt: new Date() },
    });

    const { getIO } = await import('../gateways/socket.gateway.js');
    getIO()?.to(`room:${id}`).emit('room:ended', { roomId: id, timestamp: Date.now() });

    return reply.send({ message: 'Room ended', roomId: id });
  });

  // GET /rooms/:id/token — mint a scoped LiveKit token
  app.get('/:id/token', async (request, reply) => {
    const userId = request.userId;
    if (!userId) return reply.status(401).send({ statusCode: 401, error: 'Unauthorized', message: 'Not authenticated' });

    const { id } = request.params as { id: string };
    const room = await prisma.matchRoom.findUnique({ where: { id } });
    if (!room) return reply.status(404).send({ statusCode: 404, error: 'Not Found', message: 'Room not found' });
    if (room.status !== 'LIVE') {
      return reply.status(400).send({ statusCode: 400, error: 'Bad Request', message: 'Room is not live' });
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return reply.status(404).send({ statusCode: 404, error: 'Not Found', message: 'User not found' });

    // Role determined SERVER-SIDE — client cannot choose their own role
    const isHost = room.hostId === userId;
    const role = isHost ? 'HOST' as const : 'LISTENER' as const;

    const minted = await app.audioProvider.mintToken({
      roomName: room.livekitRoomName,
      participantIdentity: userId,
      participantName: user.displayName ?? userId,
      role,
    });

    // Record participant join
    await prisma.roomParticipant.upsert({
      where: { roomId_userId: { roomId: id, userId } },
      update: { joinedAt: new Date(), leftAt: null },
      create: { roomId: id, userId, role },
    });

    return reply.send({
      token: minted.token,
      roomName: minted.roomName,
      url: minted.url,
      role,
    });
  });
}
