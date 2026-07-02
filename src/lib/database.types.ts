// ============================================================
// SUPABASE DATABASE TYPES - Tournament Auction System
// Auto-aligned with the Supabase schema
// ============================================================

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

// Custom Enums
export type AuctionType = 'mega' | 'mini';
export type SeasonStatus = 'draft' | 'retention' | 'live' | 'completed';
export type PlayerPosition = 'GK' | 'DEF' | 'MID' | 'ATT';
export type PlayerTier = 'S' | 'A' | 'B' | 'C' | 'D';
export type PlayerStatus = 'available' | 'retained' | 'sold' | 'unsold';
export type PurseTransactionType = 'PURCHASE' | 'RETENTION' | 'TRANSFER' | 'REFUND';

export interface Database {
  public: {
    Tables: {
      seasons: {
        Row: {
          id: string;
          name: string;
          season_number: number;
          auction_type: AuctionType;
          base_purse: number;
          max_retentions: number;
          auto_timer: number;
          min_squad_size: number;
          max_squad_size: number;
          status: SeasonStatus;
          previous_season_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          season_number: number;
          auction_type?: AuctionType;
          base_purse?: number;
          max_retentions?: number;
          auto_timer?: number;
          min_squad_size?: number;
          max_squad_size?: number;
          status?: SeasonStatus;
          previous_season_id?: string | null;
        };
        Update: Partial<Database['public']['Tables']['seasons']['Insert']>;
      };
      teams: {
        Row: {
          id: string;
          name: string;
          short_name: string;
          logo: string | null;
          owner_name: string | null;
          primary_color: string;
          secondary_color: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          short_name: string;
          logo?: string | null;
          owner_name?: string | null;
          primary_color?: string;
          secondary_color?: string;
        };
        Update: Partial<Database['public']['Tables']['teams']['Insert']>;
      };
      tournaments: {
        Row: {
          id: string;
          season_id: string;
          team_id: string;
          starting_purse: number;
          current_purse: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          season_id: string;
          team_id: string;
          starting_purse?: number;
          current_purse?: number;
        };
        Update: {
          starting_purse?: number;
          current_purse?: number;
        };
      };
      players: {
        Row: {
          id: string;
          name: string;
          position: PlayerPosition;
          tier: PlayerTier;
          rating: number;
          nationality: string | null;
          image_url: string | null;
          base_price: number;
          retention_price: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          position: PlayerPosition;
          tier?: PlayerTier;
          rating?: number;
          nationality?: string | null;
          image_url?: string | null;
          base_price?: number;
          retention_price?: number;
        };
        Update: Partial<Database['public']['Tables']['players']['Insert']>;
      };
      auction_purchases: {
        Row: {
          id: string;
          season_id: string;
          team_id: string;
          player_id: string;
          purchase_price: number;
          auction_round: number;
          bought_at: string;
        };
        Insert: {
          id?: string;
          season_id: string;
          team_id: string;
          player_id: string;
          purchase_price: number;
          auction_round?: number;
        };
        Update: Partial<Database['public']['Tables']['auction_purchases']['Insert']>;
      };
      retentions: {
        Row: {
          id: string;
          season_id: string;
          team_id: string;
          player_id: string;
          original_price: number;
          retention_price: number;
          retained_at: string;
        };
        Insert: {
          id?: string;
          season_id: string;
          team_id: string;
          player_id: string;
          original_price: number;
          retention_price: number;
        };
        Update: Partial<Database['public']['Tables']['retentions']['Insert']>;
      };
      squad_history: {
        Row: {
          id: string;
          season_id: string;
          team_id: string;
          player_id: string;
          purchase_price: number;
          acquisition_type: 'auction' | 'retention' | 'transfer';
          player_name: string;
          player_position: PlayerPosition;
          player_tier: PlayerTier;
          player_rating: number;
          snapshotted_at: string;
        };
        Insert: {
          id?: string;
          season_id: string;
          team_id: string;
          player_id: string;
          purchase_price: number;
          acquisition_type: 'auction' | 'retention' | 'transfer';
          player_name: string;
          player_position: PlayerPosition;
          player_tier: PlayerTier;
          player_rating: number;
        };
        Update: Partial<Database['public']['Tables']['squad_history']['Insert']>;
      };
      current_squads: {
        Row: {
          id: string;
          season_id: string;
          team_id: string;
          player_id: string;
          purchase_price: number;
          status: PlayerStatus;
          acquired_at: string;
        };
        Insert: {
          id?: string;
          season_id: string;
          team_id: string;
          player_id: string;
          purchase_price: number;
          status?: PlayerStatus;
        };
        Update: {
          team_id?: string;
          purchase_price?: number;
          status?: PlayerStatus;
        };
      };
      auction_bids: {
        Row: {
          id: string;
          season_id: string;
          player_id: string;
          team_id: string;
          bid_amount: number;
          bid_at: string;
        };
        Insert: {
          id?: string;
          season_id: string;
          player_id: string;
          team_id: string;
          bid_amount: number;
        };
        Update: Partial<Database['public']['Tables']['auction_bids']['Insert']>;
      };
      team_purse_history: {
        Row: {
          id: string;
          season_id: string;
          team_id: string;
          amount: number;
          type: PurseTransactionType;
          reference_id: string | null;
          description: string | null;
          balance_after: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          season_id: string;
          team_id: string;
          amount: number;
          type: PurseTransactionType;
          reference_id?: string | null;
          description?: string | null;
          balance_after: number;
        };
        Update: Partial<Database['public']['Tables']['team_purse_history']['Insert']>;
      };
    };
    Views: {
      v_team_dashboard: {
        Row: {
          season_id: string;
          team_id: string;
          team_name: string;
          short_name: string;
          logo: string | null;
          primary_color: string;
          secondary_color: string;
          starting_purse: number;
          current_purse: number;
          total_spent: number;
          squad_size: number;
          gk_count: number;
          def_count: number;
          mid_count: number;
          att_count: number;
        };
      };
      v_auction_feed: {
        Row: {
          id: string;
          season_id: string;
          bid_amount: number;
          bid_at: string;
          player_name: string;
          player_position: PlayerPosition;
          player_tier: PlayerTier;
          team_name: string;
          team_short_name: string;
        };
      };
      v_season_history: {
        Row: {
          season_id: string;
          name: string;
          season_number: number;
          auction_type: AuctionType;
          base_purse: number;
          status: SeasonStatus;
          created_at: string;
          teams_count: number;
          total_players_acquired: number;
          total_money_spent: number;
        };
      };
    };
    Functions: {
      create_new_season: {
        Args: {
          p_name: string;
          p_season_number: number;
          p_auction_type: AuctionType;
          p_base_purse?: number;
          p_max_retentions?: number;
          p_auto_timer?: number;
          p_min_squad?: number;
          p_max_squad?: number;
        };
        Returns: Json;
      };
      start_auction: {
        Args: { p_season_id: string };
        Returns: Json;
      };
      end_auction: {
        Args: { p_season_id: string };
        Returns: Json;
      };
      sell_player: {
        Args: {
          p_season_id: string;
          p_player_id: string;
          p_team_id: string;
          p_price: number;
          p_auction_round?: number;
        };
        Returns: Json;
      };
      retain_player: {
        Args: {
          p_season_id: string;
          p_player_id: string;
          p_team_id: string;
          p_original_price: number;
          p_retention_price: number;
        };
        Returns: Json;
      };
      import_players: {
        Args: { p_players: Json };
        Returns: Json;
      };
      get_auction_pool: {
        Args: { p_season_id: string };
        Returns: {
          player_id: string;
          player_name: string;
          player_position: PlayerPosition;
          player_tier: PlayerTier;
          player_rating: number;
          nationality: string | null;
          image_url: string | null;
          base_price: number;
        }[];
      };
      get_retention_candidates: {
        Args: { p_season_id: string; p_team_id: string };
        Returns: {
          player_id: string;
          player_name: string;
          player_position: PlayerPosition;
          player_tier: PlayerTier;
          player_rating: number;
          nationality: string | null;
          image_url: string | null;
          purchase_price: number;
          acquisition_type: string;
        }[];
      };
      mark_unsold: {
        Args: { p_season_id: string; p_player_id: string };
        Returns: Json;
      };
    };
  };
}
