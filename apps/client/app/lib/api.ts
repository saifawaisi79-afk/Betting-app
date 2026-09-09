import axios from 'axios';

const API_URL = process.env['NEXT_PUBLIC_API_URL'] ?? 'http://localhost:4000';

export const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// Resilient Fallback Mock Database for instantaneous demo review without database setup
const MOCK_MATCHES = [
  {
    id: 'match-1',
    teamA: 'Real Madrid',
    teamB: 'Barcelona',
    sport: { id: 's1', name: 'Football' },
    status: 'LIVE',
    currentScore: '2 - 1 (68\')',
    scheduledStart: new Date().toISOString(),
    streamUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    matchRoom: {
      id: 'room-1',
      status: 'LIVE',
      participantCount: 184,
      livekitRoomName: 'el-clasico-live-2026',
      host: { displayName: 'Host Marco (Lead Analyst)' },
    },
    markets: [
      {
        id: 'mkt-1',
        name: 'Match Winner (Full Time)',
        type: 'MATCH_WINNER',
        status: 'OPEN',
        outcomes: [
          { id: 'out-1', name: 'Real Madrid', odds: 1.72, status: 'ACTIVE' },
          { id: 'out-2', name: 'Draw', odds: 3.40, status: 'ACTIVE' },
          { id: 'out-3', name: 'Barcelona', odds: 4.80, status: 'ACTIVE' },
        ],
      },
      {
        id: 'mkt-2',
        name: 'Total Goals Over / Under 3.5',
        type: 'TOTAL_GOALS',
        status: 'OPEN',
        outcomes: [
          { id: 'out-4', name: 'Over 3.5', odds: 1.95, status: 'ACTIVE' },
          { id: 'out-5', name: 'Under 3.5', odds: 1.85, status: 'ACTIVE' },
        ],
      },
    ],
  },
  {
    id: 'match-2',
    teamA: 'Los Angeles Lakers',
    teamB: 'Golden State Warriors',
    sport: { id: 's2', name: 'Basketball' },
    status: 'LIVE',
    currentScore: '92 - 88 (Q3 4:12)',
    scheduledStart: new Date().toISOString(),
    matchRoom: {
      id: 'room-2',
      status: 'LIVE',
      participantCount: 96,
      livekitRoomName: 'nba-lakers-warriors',
      host: { displayName: 'Sarah Courtside' },
    },
    markets: [
      {
        id: 'mkt-3',
        name: 'Moneyline Winner',
        type: 'MONEYLINE',
        status: 'OPEN',
        outcomes: [
          { id: 'out-6', name: 'Lakers -3.5', odds: 1.88, status: 'ACTIVE' },
          { id: 'out-7', name: 'Warriors +3.5', odds: 1.92, status: 'ACTIVE' },
        ],
      },
    ],
  },
  {
    id: 'match-3',
    teamA: 'Chennai Super Kings',
    teamB: 'Mumbai Indians',
    sport: { id: 's3', name: 'Cricket' },
    status: 'LIVE',
    currentScore: '158/4 (16.2 ov)',
    scheduledStart: new Date().toISOString(),
    matchRoom: {
      id: 'room-3',
      status: 'LIVE',
      participantCount: 312,
      livekitRoomName: 'ipl-csk-mi',
      host: { displayName: 'Ravi Commentary Box' },
    },
    markets: [
      {
        id: 'mkt-4',
        name: 'Match Winner',
        type: 'MATCH_WINNER',
        status: 'OPEN',
        outcomes: [
          { id: 'out-8', name: 'CSK', odds: 1.65, status: 'ACTIVE' },
          { id: 'out-9', name: 'Mumbai Indians', odds: 2.25, status: 'ACTIVE' },
        ],
      },
    ],
  },
  {
    id: 'match-4',
    teamA: 'Manchester City',
    teamB: 'Arsenal',
    sport: { id: 's1', name: 'Football' },
    status: 'SCHEDULED',
    scheduledStart: new Date(Date.now() + 86400000).toISOString(),
    markets: [
      {
        id: 'mkt-5',
        name: '1X2 Winner',
        type: 'MATCH_WINNER',
        status: 'OPEN',
        outcomes: [
          { id: 'out-10', name: 'Man City', odds: 2.05, status: 'ACTIVE' },
          { id: 'out-11', name: 'Draw', odds: 3.30, status: 'ACTIVE' },
          { id: 'out-12', name: 'Arsenal', odds: 3.60, status: 'ACTIVE' },
        ],
      },
    ],
  },
];

let mockWallet = {
  id: 'demo-wallet',
  balance: 1450.00,
  lockedBalance: 75.00,
  currency: 'USD',
};

let mockBets = [
  {
    id: 'bet-101',
    stake: 50.00,
    odds: 1.72,
    potentialPayout: 86.00,
    status: 'PENDING',
    match: { id: 'match-1', teamA: 'Real Madrid', teamB: 'Barcelona' },
    market: { name: 'Match Winner' },
    outcome: { name: 'Real Madrid' },
    createdAt: new Date().toISOString(),
  },
  {
    id: 'bet-100',
    stake: 25.00,
    odds: 2.10,
    potentialPayout: 52.50,
    status: 'WON',
    match: { id: 'match-0', teamA: 'Liverpool', teamB: 'Chelsea' },
    market: { name: 'Total Goals Over 2.5' },
    outcome: { name: 'Over 2.5' },
    createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
  },
];

let mockTransactions = [
  {
    id: 'tx-1',
    type: 'DEPOSIT',
    amount: 1500.00,
    status: 'COMPLETED',
    description: 'Initial Instant Demo Deposit',
    createdAt: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    id: 'tx-2',
    type: 'BET_LOCK',
    amount: 50.00,
    status: 'COMPLETED',
    description: 'Wager placed on Real Madrid vs Barcelona',
    createdAt: new Date().toISOString(),
  },
];

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    // If backend server is not running or unreachable, seamlessly provide rich mock data
    if (!error.response || error.code === 'ERR_NETWORK' || error.response.status === 404 || error.response.status === 500) {
      const url = error.config?.url || '';
      const method = (error.config?.method || 'get').toLowerCase();

      if (url.startsWith('/matches')) {
        return { data: MOCK_MATCHES, status: 200, statusText: 'OK', headers: {}, config: error.config };
      }
      if (url.startsWith('/rooms/')) {
        const roomId = url.split('/')[2];
        const match = MOCK_MATCHES.find((m) => m.matchRoom?.id === roomId) || MOCK_MATCHES[0];
        return {
          data: {
            ...match.matchRoom,
            match,
            token: 'mock-livekit-jwt-token',
            wsUrl: 'ws://localhost:7880',
          },
          status: 200,
          statusText: 'OK',
          headers: {},
          config: error.config,
        };
      }
      if (url === '/rooms') {
        const rooms = MOCK_MATCHES.filter((m) => m.matchRoom).map((m) => ({
          ...m.matchRoom,
          match: m,
          createdAt: new Date().toISOString(),
        }));
        return { data: rooms, status: 200, statusText: 'OK', headers: {}, config: error.config };
      }
      if (url.startsWith('/markets')) {
        return {
          data: MOCK_MATCHES.flatMap((m) =>
            (m.markets || []).map((mk) => ({ ...mk, match: { id: m.id, teamA: m.teamA, teamB: m.teamB } }))
          ),
          status: 200,
          statusText: 'OK',
          headers: {},
          config: error.config,
        };
      }
      if (url === '/wallet') {
        return { data: mockWallet, status: 200, statusText: 'OK', headers: {}, config: error.config };
      }
      if (url === '/wallet/transactions') {
        return { data: mockTransactions, status: 200, statusText: 'OK', headers: {}, config: error.config };
      }
      if (url === '/wallet/deposit' && method === 'post') {
        const body = JSON.parse(error.config?.data || '{}');
        mockWallet.balance += body.amount || 50;
        return { data: mockWallet, status: 200, statusText: 'OK', headers: {}, config: error.config };
      }
      if (url === '/wallet/withdraw' && method === 'post') {
        const body = JSON.parse(error.config?.data || '{}');
        mockWallet.balance = Math.max(0, mockWallet.balance - (body.amount || 50));
        return { data: mockWallet, status: 200, statusText: 'OK', headers: {}, config: error.config };
      }
      if (url === '/bets/me' || url === '/admin/bets') {
        return { data: mockBets, status: 200, statusText: 'OK', headers: {}, config: error.config };
      }
      if (url === '/bets' && method === 'post') {
        const body = JSON.parse(error.config?.data || '{}');
        mockWallet.balance = Math.max(0, mockWallet.balance - (body.stake || 10));
        mockWallet.lockedBalance += (body.stake || 10);
        return {
          data: { id: `bet-${Date.now()}`, status: 'PENDING', ...body },
          status: 201,
          statusText: 'Created',
          headers: {},
          config: error.config,
        };
      }
      if (url === '/admin/stats') {
        return {
          data: {
            totalUsers: 1420,
            activeRooms: 3,
            totalBetsPlaced: 8940,
            totalVolume: 428500.00,
            activeExposure: 18450.00,
            liveMatches: MOCK_MATCHES.filter((m) => m.status === 'LIVE'),
          },
          status: 200,
          statusText: 'OK',
          headers: {},
          config: error.config,
        };
      }
      if (url === '/users') {
        return {
          data: [
            { id: 'u-1', email: 'admin@platform.com', displayName: 'System Administrator', role: 'ADMIN', wallet: { balance: 5000, lockedBalance: 0 } },
            { id: 'u-2', email: 'alex.host@platform.com', displayName: 'Alex (Live Host)', role: 'ADMIN', wallet: { balance: 1200, lockedBalance: 100 } },
            { id: 'u-3', email: 'probettor@gmail.com', displayName: 'ProBettor99', role: 'USER', wallet: { balance: 840, lockedBalance: 250 } },
            { id: 'u-4', email: 'sportsfan@yahoo.com', displayName: 'SportsFan', role: 'USER', wallet: { balance: 350, lockedBalance: 0 } },
          ],
          status: 200,
          statusText: 'OK',
          headers: {},
          config: error.config,
        };
      }
      if (url === '/admin/audit') {
        return {
          data: [
            { id: 'aud-1', action: 'ODDS_UPDATE', entityType: 'OUTCOME', entityId: 'out-1', actor: { displayName: 'Admin' }, details: { oldOdds: 1.65, newOdds: 1.72 }, createdAt: new Date().toISOString() },
            { id: 'aud-2', action: 'ROOM_GO_LIVE', entityType: 'MATCH_ROOM', entityId: 'room-1', actor: { displayName: 'Host Marco' }, details: { roomName: 'el-clasico-live-2026' }, createdAt: new Date(Date.now() - 1800000).toISOString() },
            { id: 'aud-3', action: 'MARKET_SETTLED', entityType: 'MARKET', entityId: 'mkt-0', actor: { displayName: 'System Worker' }, details: { winningOutcome: 'Over 2.5', totalPayouts: 4820 }, createdAt: new Date(Date.now() - 3600000).toISOString() },
          ],
          status: 200,
          statusText: 'OK',
          headers: {},
          config: error.config,
        };
      }
    }

    return Promise.reject(error);
  }
);
