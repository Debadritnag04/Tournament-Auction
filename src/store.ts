import { create } from 'zustand';
import { Player, Team, AuctionConfig, BidHistory, AppStep, AuctionPot, AuctionMode } from './types';
import { saveAuctionState, loadAuctionState, clearAuctionState, PersistedState } from './lib/persistence';

// Bid increment logic per spec
function getNextBid(currentBid: number): number {
  let increment: number;
  if (currentBid <= 20) increment = 1;
  else if (currentBid <= 40) increment = 2;
  else if (currentBid <= 70) increment = 5;
  else increment = 10;
  return Math.round((currentBid + increment) * 10) / 10;
}

interface AppState {
  step: AppStep;
  config: AuctionConfig;
  auctionMode: AuctionMode;
  teams: Team[];
  players: Player[];
  history: BidHistory[];
  currentPot: AuctionPot;

  // Auction Live State
  currentPlayerId: string | null;
  currentBid: number;
  currentLeadingTeamId: string | null;
  timer: number;

  // Actions
  setStep: (step: AppStep) => void;
  updateConfig: (config: Partial<AuctionConfig>) => void;
  setAuctionMode: (mode: AuctionMode) => void;
  setTeams: (teams: Team[]) => void;
  updateTeam: (id: string, diff: Partial<Team>) => void;
  setPlayers: (players: Player[]) => void;
  updatePlayer: (id: string, diff: Partial<Player>) => void;
  setCurrentPot: (pot: AuctionPot) => void;

  // Auction Actions
  startAuctionForPlayer: (playerId: string) => void;
  placeBid: (teamId: string) => void;
  sellPlayer: () => void;
  markUnsold: () => void;
  retainPlayer: (playerId: string, teamId: string, price?: number) => void;
  revivePlayers: (playerIds: string[]) => void;
  tickTimer: () => void;
  resetTimer: () => void;

  // Persistence Actions
  loadState: () => Promise<boolean>;
  resetForNewAuction: () => Promise<void>;
}

const DEFAULT_CONFIG: AuctionConfig = {
  minPlayers: 8,
  maxPlayers: 12,
  maxRetentions: 7,
  autoTimer: 15,
};

export const useStore = create<AppState>((set, get) => ({
  step: 'landing',
  config: DEFAULT_CONFIG,
  auctionMode: 'mini',
  teams: [],
  players: [],
  history: [],
  currentPot: 'GK',

  currentPlayerId: null,
  currentBid: 0,
  currentLeadingTeamId: null,
  timer: 0,

  setStep: (step) => set({ step }),
  updateConfig: (config) => set((s) => ({ config: { ...s.config, ...config } })),
  setAuctionMode: (mode) => set({ auctionMode: mode }),
  setTeams: (teams) => set({ teams }),
  updateTeam: (id, diff) => set((s) => ({
    teams: s.teams.map(t => t.id === id ? { ...t, ...diff } : t),
  })),
  setPlayers: (players) => set({ players }),
  updatePlayer: (id, diff) => set((s) => ({
    players: s.players.map(p => p.id === id ? { ...p, ...diff } : p),
  })),
  setCurrentPot: (pot) => set({ currentPot: pot }),

  startAuctionForPlayer: (playerId) => set((s) => {
    const player = s.players.find(p => p.id === playerId);
    return {
      currentPlayerId: playerId,
      currentBid: player?.basePrice || 1,
      currentLeadingTeamId: null,
      timer: s.config.autoTimer,
    };
  }),

  placeBid: (teamId) => set((s) => {
    const { currentBid, currentLeadingTeamId } = s;
    // First bid stays at base price, subsequent bids increment
    const nextBid = currentLeadingTeamId === null ? currentBid : getNextBid(currentBid);

    return {
      currentBid: nextBid,
      currentLeadingTeamId: teamId,
      timer: s.config.autoTimer, // Reset timer by full duration on each bid
      history: [...s.history, {
        id: crypto.randomUUID(),
        playerId: s.currentPlayerId!,
        teamId,
        amount: nextBid,
        timestamp: new Date().toISOString(),
      }],
    };
  }),

  sellPlayer: () => set((s) => {
    const { currentPlayerId, currentBid, currentLeadingTeamId, players, teams } = s;
    if (!currentPlayerId || !currentLeadingTeamId) return s;
    return {
      players: players.map(p => p.id === currentPlayerId
        ? { ...p, status: 'sold' as const, teamId: currentLeadingTeamId, soldPrice: currentBid }
        : p),
      teams: teams.map(t => t.id === currentLeadingTeamId
        ? { ...t, spent: Math.round((t.spent + currentBid) * 10) / 10 }
        : t),
      currentPlayerId: null,
      currentBid: 0,
      currentLeadingTeamId: null,
      timer: 0,
    };
  }),

  markUnsold: () => set((s) => {
    const { currentPlayerId, players } = s;
    if (!currentPlayerId) return s;
    return {
      players: players.map(p => p.id === currentPlayerId
        ? { ...p, status: 'unsold' as const }
        : p),
      currentPlayerId: null,
      currentBid: 0,
      currentLeadingTeamId: null,
      timer: 0,
    };
  }),

  retainPlayer: (playerId, teamId, price?) => set((s) => {
    const player = s.players.find(p => p.id === playerId);
    if (!player) return s;
    const retPrice = price ?? player.retentionPrice;
    return {
      players: s.players.map(p => p.id === playerId
        ? { ...p, status: 'retained' as const, teamId, soldPrice: retPrice }
        : p),
      teams: s.teams.map(t => t.id === teamId
        ? { ...t, spent: Math.round((t.spent + retPrice) * 10) / 10 }
        : t),
    };
  }),

  revivePlayers: (playerIds) => set((s) => ({
    players: s.players.map(p => playerIds.includes(p.id)
      ? { ...p, status: 'available' as const }
      : p),
  })),

  tickTimer: () => set((s) => ({ timer: Math.max(0, s.timer - 1) })),
  resetTimer: () => set((s) => ({ timer: s.config.autoTimer })),

  // Persistence: Load state from Supabase
  loadState: async () => {
    const saved = await loadAuctionState();
    if (saved && saved.players && saved.players.length > 0) {
      set({
        step: saved.step as AppStep,
        config: saved.config || DEFAULT_CONFIG,
        auctionMode: saved.auctionMode as AuctionMode,
        teams: saved.teams || [],
        players: saved.players || [],
        history: saved.history || [],
        currentPot: (saved.currentPot as AuctionPot) || 'GK',
        currentPlayerId: null, // Don't restore mid-bid state (timer-sensitive)
        currentBid: 0,
        currentLeadingTeamId: null,
        timer: 0,
      });
      return true; // State was restored
    }
    return false; // No saved state
  },

  // Persistence: Clear state for new auction
  resetForNewAuction: async () => {
    await clearAuctionState();
    set({
      step: 'setup',
      config: DEFAULT_CONFIG,
      auctionMode: 'mini',
      teams: [],
      players: [],
      history: [],
      currentPot: 'GK',
      currentPlayerId: null,
      currentBid: 0,
      currentLeadingTeamId: null,
      timer: 0,
    });
  },
}));

// Auto-save: Subscribe to store changes and persist to Supabase
let saveTimeout: ReturnType<typeof setTimeout> | null = null;

useStore.subscribe((state) => {
  // Only save if there's meaningful data (players loaded = auction in progress)
  if (state.players.length === 0) return;
  // Don't save timer ticks (too frequent), debounce at 1 second
  if (saveTimeout) clearTimeout(saveTimeout);
  saveTimeout = setTimeout(() => {
    const { step, config, auctionMode, teams, players, history, currentPot,
      currentPlayerId, currentBid, currentLeadingTeamId, timer } = state;
    saveAuctionState({
      step, config, auctionMode, teams, players, history, currentPot,
      currentPlayerId, currentBid, currentLeadingTeamId, timer,
    });
  }, 1000);
});
