import { create } from 'zustand';

export interface BetSlipItem {
  matchId: string;
  matchTitle: string;
  marketId: string;
  marketName: string;
  outcomeId: string;
  outcomeName: string;
  odds: number;
  stake: number;
}

interface BetSlipState {
  items: BetSlipItem[];
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  addItem: (item: Omit<BetSlipItem, 'stake'>, defaultStake?: number) => void;
  removeItem: (outcomeId: string) => void;
  updateStake: (outcomeId: string, stake: number) => void;
  clearSlip: () => void;
  totalStake: () => number;
  totalPotentialPayout: () => number;
}

export const useBetSlipStore = create<BetSlipState>((set, get) => ({
  items: [],
  isOpen: false,
  setIsOpen: (isOpen) => set({ isOpen }),
  addItem: (item, defaultStake = 10) => {
    set((state) => {
      // Check if already in slip
      const exists = state.items.find((i) => i.outcomeId === item.outcomeId);
      if (exists) {
        // Toggle remove if clicked again
        return {
          items: state.items.filter((i) => i.outcomeId !== item.outcomeId),
        };
      }
      return {
        items: [...state.items, { ...item, stake: defaultStake }],
        isOpen: true,
      };
    });
  },
  removeItem: (outcomeId) => {
    set((state) => ({
      items: state.items.filter((i) => i.outcomeId !== outcomeId),
    }));
  },
  updateStake: (outcomeId, stake) => {
    set((state) => ({
      items: state.items.map((i) =>
        i.outcomeId === outcomeId ? { ...i, stake: Math.max(0, stake) } : i
      ),
    }));
  },
  clearSlip: () => set({ items: [] }),
  totalStake: () => {
    return get().items.reduce((acc, item) => acc + (Number(item.stake) || 0), 0);
  },
  totalPotentialPayout: () => {
    return get().items.reduce((acc, item) => acc + (Number(item.stake) || 0) * item.odds, 0);
  },
}));
