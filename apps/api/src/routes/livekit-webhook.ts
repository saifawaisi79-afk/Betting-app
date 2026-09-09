import type { FastifyInstance } from 'fastify';
import { prisma } from '@betting/db';
import { WebhookReceiver } from 'livekit-server-sdk';
import { env } from '../env.js';

export async function livekitWebhookRoute(app: FastifyInstance) {
  app.post('/', async (request, reply) => {
    const receiver = new WebhookReceiver(env.LIVEKIT_API_KEY, env.LIVEKIT_API_SECRET);

    let event;
    try {
      const body = JSON.stringify(request.body);
      const authHeader = request.headers['authorization'];
      event = await receiver.receive(body, authHeader as string);
    } catch {
      return reply.status(400).send({ error: 'Invalid webhook signature' });
    }

    const { getIO } = await import('../gateways/socket.gateway.js');
    const io = getIO();

    switch (event.event) {
      case 'participant_joined': {
        const roomName = event.room?.name;
        const identity = event.participant?.identity;
        if (!roomName || !identity) break;

        const room = await prisma.matchRoom.findUnique({ where: { livekitRoomName: roomName } });
        if (!room) break;

        // Update participant count
        const count = await prisma.matchRoom.update({
          where: { id: room.id },
          data: { participantCount: { increment: 1 } },
        });

        io?.to(`room:${room.id}`).emit('room:presence', {
          roomId: room.id,
          participantCount: count.participantCount,
          event: 'JOINED',
          userId: identity,
          timestamp: Date.now(),
        });
        break;
      }

      case 'participant_left': {
        const roomName = event.room?.name;
        const identity = event.participant?.identity;
        if (!roomName || !identity) break;

        const room = await prisma.matchRoom.findUnique({ where: { livekitRoomName: roomName } });
        if (!room) break;

        await prisma.roomParticipant.updateMany({
          where: { roomId: room.id, userId: identity, leftAt: null },
          data: { leftAt: new Date() },
        });

        const count = await prisma.matchRoom.update({
          where: { id: room.id },
          data: { participantCount: { decrement: 1 } },
        });

        io?.to(`room:${room.id}`).emit('room:presence', {
          roomId: room.id,
          participantCount: Math.max(0, count.participantCount),
          event: 'LEFT',
          userId: identity,
          timestamp: Date.now(),
        });
        break;
      }

      case 'track_published': {
        // Host started speaking (audio track published)
        const roomName = event.room?.name;
        if (!roomName) break;
        const room = await prisma.matchRoom.findUnique({ where: { livekitRoomName: roomName } });
        if (!room) break;
        io?.to(`room:${room.id}`).emit('room:presence', {
          roomId: room.id,
          participantCount: room.participantCount,
          event: 'HOST_SPEAKING',
          timestamp: Date.now(),
        });
        break;
      }

      case 'room_finished': {
        const roomName = event.room?.name;
        if (!roomName) break;
        const room = await prisma.matchRoom.findUnique({ where: { livekitRoomName: roomName } });
        if (!room) break;

        await prisma.matchRoom.update({
          where: { id: room.id },
          data: { status: 'ENDED', endedAt: new Date() },
        });

        io?.to(`room:${room.id}`).emit('room:presence', {
          roomId: room.id,
          participantCount: 0,
          event: 'ROOM_ENDED',
          timestamp: Date.now(),
        });
        break;
      }
    }

    return reply.status(200).send({ received: true });
  });
}
