import { z } from 'zod';

// ─────────────────────────────────────────────────────────────────────────────
// ENUMS
// ─────────────────────────────────────────────────────────────────────────────

export const UserRole = z.enum(['USER', 'ADMIN', 'SUPERADMIN']);
export type UserRole = z.infer<typeof UserRole>;

export const KycStatus = z.enum(['PENDING', 'SUBMITTED', 'APPROVED', 'REJECTED']);
export type KycStatus = z.infer<typeof KycStatus>;

export const TransactionType = z.enum(['DEPOSIT', 'WITHDRAW', 'BET', 'PAYOUT', 'REFUND', 'ADJUSTMENT']);
export type TransactionType = z.infer<typeof TransactionType>;

export const TransactionStatus = z.enum(['PENDING', 'COMPLETED', 'FAILED', 'REVERSED']);
export type TransactionStatus = z.infer<typeof TransactionStatus>;

export const MatchStatus = z.enum(['UPCOMING', 'LIVE', 'COMPLETED', 'CANCELLED', 'POSTPONED']);
export type MatchStatus = z.infer<typeof MatchStatus>;

export const StreamType = z.enum(['YOUTUBE', 'HLS', 'IFRAME', 'RTMP']);
export type StreamType = z.infer<typeof StreamType>;

export const RoomStatus = z.enum(['SCHEDULED', 'LIVE', 'ENDED']);
export type RoomStatus = z.infer<typeof RoomStatus>;

export const RoomParticipantRole = z.enum(['HOST', 'LISTENER']);
export type RoomParticipantRole = z.infer<typeof RoomParticipantRole>;

export const MarketType = z.enum([
  'MATCH_WINNER',
  'OVER_UNDER',
  'HANDICAP',
  'BOTH_TEAMS_TO_SCORE',
  'CORRECT_SCORE',
  'FIRST_GOALSCORER',
  'ASIAN_HANDICAP',
]);
export type MarketType = z.infer<typeof MarketType>;

export const MarketStatus = z.enum(['OPEN', 'SUSPENDED', 'SETTLED', 'CANCELLED']);
export type MarketStatus = z.infer<typeof MarketStatus>;

export const BetStatus = z.enum(['PENDING', 'WON', 'LOST', 'VOID', 'CASHED_OUT']);
export type BetStatus = z.infer<typeof BetStatus>;

// ─────────────────────────────────────────────────────────────────────────────
// CORE ENTITY SCHEMAS
// ─────────────────────────────────────────────────────────────────────────────

export const UserSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email().nullable(),
  phone: z.string().nullable(),
  role: UserRole,
  kycStatus: KycStatus,
  displayName: z.string().nullable(),
  avatarUrl: z.string().url().nullable(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});
export type User = z.infer<typeof UserSchema>;

export const PublicUserSchema = UserSchema.pick({
  id: true,
  email: true,
  displayName: true,
  avatarUrl: true,
  role: true,
  kycStatus: true,
});
export type PublicUser = z.infer<typeof PublicUserSchema>;

export const WalletSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  balance: z.number().nonnegative(),
  lockedBalance: z.number().nonnegative(),
  currency: z.string().length(3).default('USD'),
  updatedAt: z.coerce.date(),
});
export type Wallet = z.infer<typeof WalletSchema>;

export const TransactionSchema = z.object({
  id: z.string().uuid(),
  walletId: z.string().uuid(),
  type: TransactionType,
  amount: z.number().positive(),
  status: TransactionStatus,
  reference: z.string().nullable(),
  metadata: z.record(z.unknown()).nullable(),
  createdAt: z.coerce.date(),
});
export type Transaction = z.infer<typeof TransactionSchema>;

export const SportSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1),
  slug: z.string().min(1),
  iconUrl: z.string().url().nullable(),
});
export type Sport = z.infer<typeof SportSchema>;

export const MatchSchema = z.object({
  id: z.string().uuid(),
  sportId: z.string().uuid(),
  teamA: z.string().min(1),
  teamB: z.string().min(1),
  startTime: z.coerce.date(),
  status: MatchStatus,
  streamUrl: z.string().url().nullable(),
  streamType: StreamType.nullable(),
  scoreA: z.number().int().nullable(),
  scoreB: z.number().int().nullable(),
  venue: z.string().nullable(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
  sport: SportSchema.optional(),
});
export type Match = z.infer<typeof MatchSchema>;

export const MatchRoomSchema = z.object({
  id: z.string().uuid(),
  matchId: z.string().uuid(),
  hostId: z.string().uuid(),
  livekitRoomName: z.string(),
  status: RoomStatus,
  startedAt: z.coerce.date().nullable(),
  endedAt: z.coerce.date().nullable(),
  participantCount: z.number().int().nonnegative().default(0),
  createdAt: z.coerce.date(),
  match: MatchSchema.optional(),
});
export type MatchRoom = z.infer<typeof MatchRoomSchema>;

export const RoomParticipantSchema = z.object({
  id: z.string().uuid(),
  roomId: z.string().uuid(),
  userId: z.string().uuid(),
  role: RoomParticipantRole,
  joinedAt: z.coerce.date(),
  leftAt: z.coerce.date().nullable(),
});
export type RoomParticipant = z.infer<typeof RoomParticipantSchema>;

export const OddsSchema = z.object({
  id: z.string().uuid(),
  marketId: z.string().uuid(),
  selection: z.string().min(1),
  price: z.number().positive().multipleOf(0.01),
  isActive: z.boolean().default(true),
  updatedAt: z.coerce.date(),
});
export type Odds = z.infer<typeof OddsSchema>;

export const MarketSchema = z.object({
  id: z.string().uuid(),
  matchId: z.string().uuid(),
  type: MarketType,
  label: z.string().min(1),
  status: MarketStatus,
  settledAt: z.coerce.date().nullable(),
  winningSelection: z.string().nullable(),
  odds: z.array(OddsSchema).optional(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});
export type Market = z.infer<typeof MarketSchema>;

export const BetSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  marketId: z.string().uuid(),
  oddsId: z.string().uuid(),
  selection: z.string(),
  oddsPrice: z.number().positive(),
  stake: z.number().positive().multipleOf(0.01),
  potentialPayout: z.number().positive(),
  status: BetStatus,
  cashOutAmount: z.number().nullable(),
  placedAt: z.coerce.date(),
  settledAt: z.coerce.date().nullable(),
  idempotencyKey: z.string(),
  market: MarketSchema.optional(),
});
export type Bet = z.infer<typeof BetSchema>;

export const AuditLogSchema = z.object({
  id: z.string().uuid(),
  actorId: z.string().uuid(),
  action: z.string(),
  entityType: z.string(),
  entityId: z.string(),
  metadata: z.record(z.unknown()),
  createdAt: z.coerce.date(),
});
export type AuditLog = z.infer<typeof AuditLogSchema>;

// ─────────────────────────────────────────────────────────────────────────────
// AUTH SCHEMAS
// ─────────────────────────────────────────────────────────────────────────────

export const RegisterInputSchema = z.object({
  email: z.string().email().optional(),
  phone: z.string().min(10).optional(),
  password: z.string().min(8).max(128),
  displayName: z.string().min(2).max(50),
}).refine((d) => d.email ?? d.phone, {
  message: 'Either email or phone is required',
});
export type RegisterInput = z.infer<typeof RegisterInputSchema>;

export const LoginInputSchema = z.object({
  identifier: z.string().min(1), // email or phone
  password: z.string().min(1),
  totpCode: z.string().length(6).optional(), // for admin 2FA
});
export type LoginInput = z.infer<typeof LoginInputSchema>;

export const AuthTokensSchema = z.object({
  accessToken: z.string(),
  expiresIn: z.number(),
});
export type AuthTokens = z.infer<typeof AuthTokensSchema>;

export const JwtPayloadSchema = z.object({
  sub: z.string().uuid(),       // userId
  role: UserRole,
  iat: z.number(),
  exp: z.number(),
});
export type JwtPayload = z.infer<typeof JwtPayloadSchema>;

// ─────────────────────────────────────────────────────────────────────────────
// API REQUEST / RESPONSE SCHEMAS
// ─────────────────────────────────────────────────────────────────────────────

// Matches
export const CreateMatchInputSchema = z.object({
  sportId: z.string().uuid(),
  teamA: z.string().min(1),
  teamB: z.string().min(1),
  startTime: z.coerce.date(),
  streamUrl: z.string().url().optional(),
  venue: z.string().optional(),
});
export type CreateMatchInput = z.infer<typeof CreateMatchInputSchema>;

export const UpdateMatchInputSchema = CreateMatchInputSchema.partial().extend({
  status: MatchStatus.optional(),
  scoreA: z.number().int().nonnegative().optional(),
  scoreB: z.number().int().nonnegative().optional(),
});
export type UpdateMatchInput = z.infer<typeof UpdateMatchInputSchema>;

// Markets & Odds
export const CreateMarketInputSchema = z.object({
  matchId: z.string().uuid(),
  type: MarketType,
  label: z.string().min(1),
  odds: z.array(z.object({
    selection: z.string().min(1),
    price: z.number().positive().multipleOf(0.01),
  })).min(2),
});
export type CreateMarketInput = z.infer<typeof CreateMarketInputSchema>;

export const UpdateOddsInputSchema = z.object({
  selections: z.array(z.object({
    oddsId: z.string().uuid(),
    price: z.number().positive().multipleOf(0.01),
  })),
});
export type UpdateOddsInput = z.infer<typeof UpdateOddsInputSchema>;

export const SettleMarketInputSchema = z.object({
  winningSelection: z.string().min(1),
});
export type SettleMarketInput = z.infer<typeof SettleMarketInputSchema>;

// Bets
export const PlaceBetInputSchema = z.object({
  marketId: z.string().uuid(),
  oddsId: z.string().uuid(),
  selection: z.string().min(1),
  stake: z.number().positive().multipleOf(0.01).max(100_000),
  idempotencyKey: z.string().uuid(),
});
export type PlaceBetInput = z.infer<typeof PlaceBetInputSchema>;

// Wallet
export const DepositInputSchema = z.object({
  amount: z.number().positive().multipleOf(0.01).max(50_000),
  currency: z.string().length(3).default('USD'),
  paymentMethodId: z.string().optional(), // Stripe PM id
});
export type DepositInput = z.infer<typeof DepositInputSchema>;

export const WithdrawInputSchema = z.object({
  amount: z.number().positive().multipleOf(0.01),
  bankAccountId: z.string().optional(),
});
export type WithdrawInput = z.infer<typeof WithdrawInputSchema>;

// Rooms
export const CreateRoomInputSchema = z.object({
  matchId: z.string().uuid(),
});
export type CreateRoomInput = z.infer<typeof CreateRoomInputSchema>;

export const LiveKitTokenResponseSchema = z.object({
  token: z.string(),
  roomName: z.string(),
  url: z.string(),
  role: RoomParticipantRole,
});
export type LiveKitTokenResponse = z.infer<typeof LiveKitTokenResponseSchema>;

// ─────────────────────────────────────────────────────────────────────────────
// SOCKET.IO EVENT PAYLOADS
// ─────────────────────────────────────────────────────────────────────────────

export const OddsUpdateEventSchema = z.object({
  marketId: z.string().uuid(),
  matchId: z.string().uuid(),
  updates: z.array(z.object({
    oddsId: z.string().uuid(),
    selection: z.string(),
    oldPrice: z.number(),
    newPrice: z.number(),
    direction: z.enum(['UP', 'DOWN', 'UNCHANGED']),
  })),
  timestamp: z.number(),
});
export type OddsUpdateEvent = z.infer<typeof OddsUpdateEventSchema>;

export const RoomPresenceEventSchema = z.object({
  roomId: z.string().uuid(),
  participantCount: z.number().int().nonnegative(),
  event: z.enum(['JOINED', 'LEFT', 'HOST_SPEAKING', 'HOST_MUTED', 'ROOM_STARTED', 'ROOM_ENDED']),
  userId: z.string().uuid().optional(),
  timestamp: z.number(),
});
export type RoomPresenceEvent = z.infer<typeof RoomPresenceEventSchema>;

export const BetStatusEventSchema = z.object({
  betId: z.string().uuid(),
  userId: z.string().uuid(),
  status: BetStatus,
  payout: z.number().optional(),
  timestamp: z.number(),
});
export type BetStatusEvent = z.infer<typeof BetStatusEventSchema>;

// ─────────────────────────────────────────────────────────────────────────────
// PAGINATION
// ─────────────────────────────────────────────────────────────────────────────

export const PaginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});
export type Pagination = z.infer<typeof PaginationSchema>;

export const PaginatedResponseSchema = <T extends z.ZodTypeAny>(itemSchema: T) =>
  z.object({
    data: z.array(itemSchema),
    total: z.number().int(),
    page: z.number().int(),
    limit: z.number().int(),
    totalPages: z.number().int(),
  });

// ─────────────────────────────────────────────────────────────────────────────
// API RESPONSE ENVELOPE
// ─────────────────────────────────────────────────────────────────────────────

export const ApiErrorSchema = z.object({
  statusCode: z.number().int(),
  error: z.string(),
  message: z.string(),
});
export type ApiError = z.infer<typeof ApiErrorSchema>;
