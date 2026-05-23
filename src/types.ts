export type Position = 'GK' | 'DEF' | 'MID' | 'ST';

export interface Player {
  id: string;
  name: string;
  position: Position;
  country: string;
  rating: number;
  basePrice: number;
  category: string;
  image?: string;
  status: 'available' | 'retained' | 'sold' | 'unsold';
  teamId?: string; // ID of the team that bought/retained them
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
  autoTimer: number; // seconds
  defaultStartingBid: number;
}

export interface BidHistory {
  id: string;
  playerId: string;
  teamId: string;
  amount: number;
  timestamp: string;
}

export type AppStep = 'landing' | 'setup' | 'teams' | 'import' | 'retention' | 'auction' | 'results';
