// ============================================================
// SUPABASE BACKEND API LAYER
// Single source of truth — NO CSV fallback
// All data flows through these functions → Supabase
// ============================================================

import { supabase } from './supabase';
import type { Database, AuctionType, PlayerPosition, PlayerTier } from './database.types';

type Season = Database['public']['Tables']['seasons']['Row'];
type SeasonInsert = Database['public']['Tables']['seasons']['Insert'];
type Team = Database['public']['Tables']['teams']['Row'];
type TeamInsert = Database['public']['Tables']['teams']['Insert'];
type Player = Database['public']['Tables']['players']['Row'];

// ============================================================
// SEASON APIs — Multi-season tournament management
// ============================================================
export const seasonApi = {
  /** Create a new season via RPC (handles team registration + linking) */
  async create(params: {
    name: string;
    seasonNumber: number;
    auctionType: AuctionType;
    basePurse?: number;
    maxRetentions?: number;
    autoTimer?: number;
    minSquad?: number;
    maxSquad?: number;
  }) {
    const { data, error } = await supabase.rpc('create_new_season', {
      p_name: params.name,
      p_season_number: params.seasonNumber,
      p_auction_type: params.auctionType,
      p_base_purse: params.basePurse ?? 200,
      p_max_retentions: params.maxRetentions ?? 7,
      p_auto_timer: params.autoTimer ?? 15,
      p_min_squad: params.minSquad ?? 8,
      p_max_squad: params.maxSquad ?? 12,
    });
    if (error) throw error;
    return data as { success: boolean; season_id: string; auction_type: string; teams_registered: number; previous_season_id: string | null; initial_status: string };
  },

  /** Get current active season */
  async getActive() {
    const { data, error } = await supabase
      .from('seasons')
      .select('*')
      .in('status', ['draft', 'retention', 'live'])
      .order('season_number', { ascending: false })
      .limit(1)
      .maybeSingle();
    if (error) throw error;
    return data;
  },

  /** Get season by ID */
  async getById(id: string) {
    const { data, error } = await supabase
      .from('seasons')
      .select('*')
      .eq('id', id)
      .single();
    if (error) throw error;
    return data;
  },

  /** Get all seasons (history) */
  async getAll() {
    const { data, error } = await supabase
      .from('seasons')
      .select('*')
      .order('season_number', { ascending: false });
    if (error) throw error;
    return data;
  },

  /** Get season history view with stats */
  async getHistory() {
    const { data, error } = await supabase
      .from('v_season_history')
      .select('*');
    if (error) throw error;
    return data;
  },

  /** Update season config */
  async update(id: string, updates: Partial<SeasonInsert>) {
    const { data, error } = await supabase
      .from('seasons')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  /** Start the auction (moves status to 'live') */
  async startAuction(seasonId: string) {
    const { data, error } = await supabase.rpc('start_auction', {
      p_season_id: seasonId,
    });
    if (error) throw error;
    return data as { success: boolean; season_id: string; status: string };
  },

  /** End auction (snapshot squads, mark completed) */
  async endAuction(seasonId: string) {
    const { data, error } = await supabase.rpc('end_auction', {
      p_season_id: seasonId,
    });
    if (error) throw error;
    return data as { success: boolean; season_id: string; players_snapshotted: number; status: string };
  },
};

// ============================================================
// TEAM APIs — Franchise management (persists across seasons)
// ============================================================
export const teamApi = {
  /** Create a team */
  async create(data: TeamInsert) {
    const { data: team, error } = await supabase
      .from('teams')
      .insert(data)
      .select()
      .single();
    if (error) throw error;
    return team;
  },

  /** Create multiple teams */
  async createMany(teams: TeamInsert[]) {
    const { data, error } = await supabase
      .from('teams')
      .insert(teams)
      .select();
    if (error) throw error;
    return data;
  },

  /** Get all teams */
  async getAll() {
    const { data, error } = await supabase
      .from('teams')
      .select('*')
      .order('name');
    if (error) throw error;
    return data;
  },

  /** Get team by ID */
  async getById(id: string) {
    const { data, error } = await supabase
      .from('teams')
      .select('*')
      .eq('id', id)
      .single();
    if (error) throw error;
    return data;
  },

  /** Update team */
  async update(id: string, data: Partial<TeamInsert>) {
    const { data: team, error } = await supabase
      .from('teams')
      .update(data)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return team;
  },

  /** Get team dashboard for a season (with purse + squad composition) */
  async getDashboard(seasonId: string) {
    const { data, error } = await supabase
      .from('v_team_dashboard')
      .select('*')
      .eq('season_id', seasonId);
    if (error) throw error;
    return data;
  },

  /** Get a team's purse info for a specific season */
  async getPurse(seasonId: string, teamId: string) {
    const { data, error } = await supabase
      .from('tournaments')
      .select('*')
      .eq('season_id', seasonId)
      .eq('team_id', teamId)
      .single();
    if (error) throw error;
    return data;
  },

  /** Get all teams with purse for a season */
  async getTeamsForSeason(seasonId: string) {
    const { data, error } = await supabase
      .from('tournaments')
      .select('*, teams(*)')
      .eq('season_id', seasonId);
    if (error) throw error;
    return data;
  },
};

// ============================================================
// PLAYER APIs — Master player database
// ============================================================
export const playerApi = {
  /** Import players via RPC (bulk insert, idempotent) */
  async importBulk(players: {
    name: string;
    position: PlayerPosition;
    tier?: PlayerTier;
    rating?: number;
    nationality?: string;
    image_url?: string;
    base_price?: number;
    retention_price?: number;
  }[]) {
    const { data, error } = await supabase.rpc('import_players', {
      p_players: JSON.stringify(players),
    });
    if (error) throw error;
    return data as { success: boolean; processed: number };
  },

  /** Get all players */
  async getAll() {
    const { data, error } = await supabase
      .from('players')
      .select('*')
      .order('tier')
      .order('rating', { ascending: false });
    if (error) throw error;
    return data;
  },

  /** Get auction pool for a season (available players minus retained) */
  async getAuctionPool(seasonId: string) {
    const { data, error } = await supabase.rpc('get_auction_pool', {
      p_season_id: seasonId,
    });
    if (error) throw error;
    return data;
  },

  /** Get players by position */
  async getByPosition(position: PlayerPosition) {
    const { data, error } = await supabase
      .from('players')
      .select('*')
      .eq('position', position)
      .order('tier')
      .order('rating', { ascending: false });
    if (error) throw error;
    return data;
  },

  /** Get a player by ID */
  async getById(id: string) {
    const { data, error } = await supabase
      .from('players')
      .select('*')
      .eq('id', id)
      .single();
    if (error) throw error;
    return data;
  },
};

// ============================================================
// AUCTION APIs — Live auction operations
// ============================================================
export const auctionApi = {
  /** Sell player to a team (atomic RPC) */
  async sellPlayer(
    seasonId: string,
    playerId: string,
    teamId: string,
    price: number,
    auctionRound: number = 1
  ) {
    const { data, error } = await supabase.rpc('sell_player', {
      p_season_id: seasonId,
      p_player_id: playerId,
      p_team_id: teamId,
      p_price: price,
      p_auction_round: auctionRound,
    });
    if (error) throw error;
    return data as { success: boolean; purchase_id: string; remaining_purse: number };
  },

  /** Mark player as unsold */
  async markUnsold(seasonId: string, playerId: string) {
    const { data, error } = await supabase.rpc('mark_unsold', {
      p_season_id: seasonId,
      p_player_id: playerId,
    });
    if (error) throw error;
    return data as { success: boolean; player_id: string; status: string };
  },

  /** Record a bid (for history/analytics) */
  async recordBid(seasonId: string, playerId: string, teamId: string, amount: number) {
    const { data, error } = await supabase
      .from('auction_bids')
      .insert({
        season_id: seasonId,
        player_id: playerId,
        team_id: teamId,
        bid_amount: amount,
      })
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  /** Get bid history for a player in current auction */
  async getBidHistory(seasonId: string, playerId: string) {
    const { data, error } = await supabase
      .from('auction_bids')
      .select('*, teams(name, short_name)')
      .eq('season_id', seasonId)
      .eq('player_id', playerId)
      .order('bid_at', { ascending: false });
    if (error) throw error;
    return data;
  },

  /** Get auction activity feed */
  async getActivityFeed(seasonId: string, limit: number = 50) {
    const { data, error } = await supabase
      .from('v_auction_feed')
      .select('*')
      .eq('season_id', seasonId)
      .limit(limit);
    if (error) throw error;
    return data;
  },

  /** Get all purchases for a season */
  async getPurchases(seasonId: string) {
    const { data, error } = await supabase
      .from('auction_purchases')
      .select('*, players(name, position, tier, rating, image_url), teams(name, short_name)')
      .eq('season_id', seasonId)
      .order('bought_at', { ascending: false });
    if (error) throw error;
    return data;
  },
};

// ============================================================
// RETENTION APIs — Mini Auction retention phase
// Database is the retention helper (no CSV!)
// ============================================================
export const retentionApi = {
  /** Get retention candidates from previous season squad_history */
  async getCandidates(seasonId: string, teamId: string) {
    const { data, error } = await supabase.rpc('get_retention_candidates', {
      p_season_id: seasonId,
      p_team_id: teamId,
    });
    if (error) throw error;
    return data;
  },

  /** Retain a player (atomic RPC) */
  async retainPlayer(
    seasonId: string,
    playerId: string,
    teamId: string,
    originalPrice: number,
    retentionPrice: number
  ) {
    const { data, error } = await supabase.rpc('retain_player', {
      p_season_id: seasonId,
      p_player_id: playerId,
      p_team_id: teamId,
      p_original_price: originalPrice,
      p_retention_price: retentionPrice,
    });
    if (error) throw error;
    return data as { success: boolean; retention_id: string; remaining_purse: number };
  },

  /** Get all retentions for a season */
  async getBySeason(seasonId: string) {
    const { data, error } = await supabase
      .from('retentions')
      .select('*, players(name, position, tier, rating, image_url), teams(name, short_name)')
      .eq('season_id', seasonId)
      .order('retained_at');
    if (error) throw error;
    return data;
  },

  /** Get retentions for a specific team */
  async getByTeam(seasonId: string, teamId: string) {
    const { data, error } = await supabase
      .from('retentions')
      .select('*, players(name, position, tier, rating, image_url)')
      .eq('season_id', seasonId)
      .eq('team_id', teamId);
    if (error) throw error;
    return data;
  },
};

// ============================================================
// SQUAD APIs — Current and historical squad data
// ============================================================
export const squadApi = {
  /** Get current squad for a team in a season */
  async getCurrentSquad(seasonId: string, teamId: string) {
    const { data, error } = await supabase
      .from('current_squads')
      .select('*, players(name, position, tier, rating, nationality, image_url)')
      .eq('season_id', seasonId)
      .eq('team_id', teamId)
      .in('status', ['sold', 'retained'])
      .order('purchase_price', { ascending: false });
    if (error) throw error;
    return data;
  },

  /** Get historical squad for a team from a specific season */
  async getHistoricalSquad(seasonId: string, teamId: string) {
    const { data, error } = await supabase
      .from('squad_history')
      .select('*')
      .eq('season_id', seasonId)
      .eq('team_id', teamId)
      .order('purchase_price', { ascending: false });
    if (error) throw error;
    return data;
  },

  /** Get all squad_history for a season (all teams) */
  async getSeasonSnapshot(seasonId: string) {
    const { data, error } = await supabase
      .from('squad_history')
      .select('*, teams(name, short_name)')
      .eq('season_id', seasonId)
      .order('team_id')
      .order('purchase_price', { ascending: false });
    if (error) throw error;
    return data;
  },

  /** Get player career history (which teams across seasons) */
  async getPlayerCareer(playerId: string) {
    const { data, error } = await supabase
      .from('squad_history')
      .select('*, seasons(name, season_number), teams(name, short_name)')
      .eq('player_id', playerId)
      .order('snapshotted_at', { ascending: false });
    if (error) throw error;
    return data;
  },
};

// ============================================================
// PURSE HISTORY APIs — Financial audit trail
// ============================================================
export const purseApi = {
  /** Get purse transaction history for a team in a season */
  async getHistory(seasonId: string, teamId: string) {
    const { data, error } = await supabase
      .from('team_purse_history')
      .select('*')
      .eq('season_id', seasonId)
      .eq('team_id', teamId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data;
  },

  /** Get all purse transactions for a season */
  async getSeasonTransactions(seasonId: string) {
    const { data, error } = await supabase
      .from('team_purse_history')
      .select('*, teams(name, short_name)')
      .eq('season_id', seasonId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data;
  },
};
