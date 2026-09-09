import type { RoomParticipantRole } from '@betting/types';

// ─────────────────────────────────────────────────────────────────────────────
// PROVIDER INTERFACE — swap LiveKit for Agora/100ms by implementing this
// ─────────────────────────────────────────────────────────────────────────────

export interface TokenGrant {
  roomName: string;
  participantIdentity: string;
  participantName: string;
  role: RoomParticipantRole;
  /** token TTL in seconds (default: 3600) */
  ttl?: number;
}

export interface MintedToken {
  token: string;
  url: string;
  roomName: string;
}

export interface RoomCreateOptions {
  roomName: string;
  maxParticipants?: number;
  emptyTimeoutSeconds?: number;
  metadata?: string;
}

export interface IAudioRoomProvider {
  /** Mint a scoped JWT for a participant */
  mintToken(grant: TokenGrant): Promise<MintedToken>;
  /** Create or ensure a room exists */
  createRoom(options: RoomCreateOptions): Promise<void>;
  /** Terminate and remove a room */
  deleteRoom(roomName: string): Promise<void>;
  /** List active participants in a room */
  listParticipants(roomName: string): Promise<{ identity: string; joinedAt: Date }[]>;
  /** Remove a participant from a room (admin moderation) */
  removeParticipant(roomName: string, participantIdentity: string): Promise<void>;
}
