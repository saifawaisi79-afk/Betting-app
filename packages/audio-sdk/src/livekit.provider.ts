import {
  AccessToken,
  RoomServiceClient,
  type VideoGrant,
} from 'livekit-server-sdk';
import type { IAudioRoomProvider, MintedToken, RoomCreateOptions, TokenGrant } from './provider.interface.js';

function getEnv(key: string): string {
  const val = process.env[key];
  if (!val) throw new Error(`Missing env var: ${key}`);
  return val;
}

export class LiveKitProvider implements IAudioRoomProvider {
  private readonly apiKey: string;
  private readonly apiSecret: string;
  private readonly url: string;
  private readonly roomService: RoomServiceClient;

  constructor() {
    this.apiKey = getEnv('LIVEKIT_API_KEY');
    this.apiSecret = getEnv('LIVEKIT_API_SECRET');
    this.url = getEnv('LIVEKIT_URL');
    this.roomService = new RoomServiceClient(
      this.url.replace(/^ws/, 'http'), // LiveKit REST uses http(s)
      this.apiKey,
      this.apiSecret,
    );
  }

  async mintToken(grant: TokenGrant): Promise<MintedToken> {
    const { roomName, participantIdentity, participantName, role, ttl = 3600 } = grant;

    // ── Server-side permission enforcement ────────────────────────────────────
    // HOST → canPublish: true  (admin mic)
    // LISTENER → canPublish: false, canSubscribe: true (clients only listen)
    const videoGrant: VideoGrant =
      role === 'HOST'
        ? {
            roomJoin: true,
            room: roomName,
            canPublish: true,
            canSubscribe: true,
            canPublishData: true,
            canUpdateOwnMetadata: true,
          }
        : {
            roomJoin: true,
            room: roomName,
            canPublish: false,       // ← NEVER publish — enforced server-side
            canSubscribe: true,
            canPublishData: false,
            canUpdateOwnMetadata: false,
          };

    const token = new AccessToken(this.apiKey, this.apiSecret, {
      identity: participantIdentity,
      name: participantName,
      ttl,
    });
    token.addGrant(videoGrant);

    return {
      token: await token.toJwt(),
      url: this.url,
      roomName,
    };
  }

  async createRoom(options: RoomCreateOptions): Promise<void> {
    const { roomName, maxParticipants, emptyTimeoutSeconds = 300, metadata } = options;
    await this.roomService.createRoom({
      name: roomName,
      emptyTimeout: emptyTimeoutSeconds,
      maxParticipants,
      metadata,
    });
  }

  async deleteRoom(roomName: string): Promise<void> {
    await this.roomService.deleteRoom(roomName);
  }

  async listParticipants(roomName: string): Promise<{ identity: string; joinedAt: Date }[]> {
    const participants = await this.roomService.listParticipants(roomName);
    return participants.map((p) => ({
      identity: p.identity,
      joinedAt: new Date(Number(p.joinedAt) * 1000),
    }));
  }

  async removeParticipant(roomName: string, participantIdentity: string): Promise<void> {
    await this.roomService.removeParticipant(roomName, participantIdentity);
  }
}
