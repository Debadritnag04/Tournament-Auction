import { create } from 'zustand';
import { Player, Team, AuctionConfig, BidHistory, AppStep } from './types';

interface AppState {
  step: AppStep;
  config: AuctionConfig;
  teams: Team[];
  players: Player[];
  history: BidHistory[];
  
  // Auction Live Data
  currentPlayerId: string | null;
  currentBid: number;
  currentLeadingTeamId: string | null;
  timer: number;
  
  // Actions
  setStep: (step: AppStep) => void;
  updateConfig: (config: Partial<AuctionConfig>) => void;
  setTeams: (teams: Team[]) => void;
  updateTeam: (id: string, diff: Partial<Team>) => void;
  setPlayers: (players: Player[]) => void;
  updatePlayer: (id: string, diff: Partial<Player>) => void;
  
  // Auction Actions
  startAuctionForPlayer: (playerId: string) => void;
  placeBid: (teamId: string) => void;
  sellPlayer: () => void;
  markUnsold: () => void;
  retainPlayer: (playerId: string, teamId: string, price: number) => void;
  revivePlayers: (playerIds: string[]) => void;
  tickTimer: () => void;
  resetTimer: () => void;
}

const DEFAULT_CONFIG: AuctionConfig = {
  minPlayers: 15,
  maxPlayers: 25,
  autoTimer: 15,
  defaultStartingBid: 0.5, // 0.5 Cr
};

export const useStore = create<AppState>((set, get) => ({
  step: 'landing',
  config: DEFAULT_CONFIG,
  teams: [],
  players: [],
  history: [],
  
  currentPlayerId: null,
  currentBid: 0,
  currentLeadingTeamId: null,
  timer: 0,
  
  setStep: (step) => set({ step }),
  
  updateConfig: (config) => set((state) => ({ config: { ...state.config, ...config } })),
  
  setTeams: (teams) => set({ teams }),
  
  updateTeam: (id, diff) => set((state) => ({
    teams: state.teams.map(t => t.id === id ? { ...t, ...diff } : t)
  })),
  
  setPlayers: (players) => set({ players }),
  
  updatePlayer: (id, diff) => set((state) => ({
    players: state.players.map(p => p.id === id ? { ...p, ...diff } : p)
  })),
  
  startAuctionForPlayer: (playerId) => set((state) => {
    const player = state.players.find(p => p.id === playerId);
    return {
      currentPlayerId: playerId,
      currentBid: player?.basePrice || state.config.defaultStartingBid,
      currentLeadingTeamId: null,
      timer: state.config.autoTimer,
    };
  }),
  
  placeBid: (teamId) => set((state) => {
    const { currentBid, currentLeadingTeamId } = state;
    let nextBid = currentBid;
    
    if (currentLeadingTeamId !== null) {
      if (currentBid < 5) {
        nextBid += 0.5;
      } else if (currentBid < 10) {
        nextBid += 1;
      } else {
        nextBid += 2;
      }
    }
    
    // Ensure accurate floating point arithmetic
    nextBid = Math.round(nextBid * 10) / 10;
    
    return {
      currentBid: nextBid,
      currentLeadingTeamId: teamId,
      timer: state.config.autoTimer,
      history: [...state.history, {
        id: crypto.randomUUID(),
        playerId: state.currentPlayerId!,
        teamId: teamId,
        amount: nextBid,
        timestamp: new Date().toISOString()
      }]
    };
  }),

  sellPlayer: () => set((state) => {
    const { currentPlayerId, currentBid, currentLeadingTeamId, players, teams } = state;
    if (!currentPlayerId || !currentLeadingTeamId) return state;

    return {
      players: players.map(p => p.id === currentPlayerId ? { ...p, status: 'sold', teamId: currentLeadingTeamId, soldPrice: currentBid } : p),
      teams: teams.map(t => t.id === currentLeadingTeamId ? { ...t, spent: t.spent + currentBid } : t),
      currentPlayerId: null,
      currentBid: 0,
      currentLeadingTeamId: null,
      timer: 0,
    };
  }),

  markUnsold: () => set((state) => {
    const { currentPlayerId, players } = state;
    if (!currentPlayerId) return state;

    return {
      players: players.map(p => p.id === currentPlayerId ? { ...p, status: 'unsold' } : p),
      currentPlayerId: null,
      currentBid: 0,
      currentLeadingTeamId: null,
      timer: 0,
    };
  }),

  retainPlayer: (playerId, teamId, price) => set((state) => {
    const { players, teams } = state;
    return {
      players: players.map(p => p.id === playerId ? { ...p, status: 'retained', teamId, soldPrice: price } : p),
      teams: teams.map(t => t.id === teamId ? { ...t, spent: t.spent + price } : t),
    };
  }),

  revivePlayers: (playerIds) => set((state) => ({
    players: state.players.map(p => playerIds.includes(p.id) ? { ...p, status: 'available' } : p)
  })),

  tickTimer: () => set((state) => ({
    timer: Math.max(0, state.timer - 1)
  })),

  resetTimer: () => set((state) => ({
    timer: state.config.autoTimer
  }))
}));
