export type Position = 'GK' | 'DEF' | 'MID' | 'ATT';
export type Tier = 'S' | 'A' | 'B' | 'C' | 'D';
export type PlayerStatus = 'available' | 'retained' | 'sold' | 'unsold';
export type AuctionPot = 'GK' | 'DEF' | 'MID' | 'ATT';

export interface Player {
  id: string;
  name: string;
  position: Position;
  tier: Tier;
  country: string;
  rating: number;
  basePrice: number;
  retentionPrice: number;
  image?: string;
  status: PlayerStatus;
  teamId?: string;
  soldPrice?: number;
}

export interface Team {
  id: string;
  name: string;
  shortName: string;
  primaryColor: string;
  secondaryColor: string;
  startingPurse: number;
  spent: number;
  logo?: string;
}

export interface AuctionConfig {
  minPlayers: number;
  maxPlayers: number;
  maxRetentions: number;
  autoTimer: number;
}

export interface BidHistory {
  id: string;
  playerId: string;
  teamId: string;
  amount: number;
  timestamp: string;
}

export type AppStep =
  | 'landing'
  | 'setup'
  | 'teams'
  | 'import'
  | 'retention'
  | 'auction'
  | 'results';
