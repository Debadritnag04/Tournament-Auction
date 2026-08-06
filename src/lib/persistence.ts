/**
 * AUCTION STATE PERSISTENCE
 * 
 * Saves the full Zustand store state to Supabase on every meaningful change.
 * On app load, restores the state from the database.
 * State survives refresh, tab close, and device shutdown.
 * Only killed when user explicitly starts a "New Auction".
 */

import { supabase } from './supabase';

const STATE_ID = 'current';

export interface PersistedState {
  step: string;
  config: any;
  auctionMode: string;
  teams: any[];
  players: any[];
  history: any[];
  currentPot: string;
  currentPlayerId: string | null;
  currentBid: number;
  currentLeadingTeamId: string | null;
  timer: number;
  squadLayouts?: Record<string, any>;
}

/** Save auction state to Supabase (upsert) */
export async function saveAuctionState(state: PersistedState): Promise<void> {
  try {
    const { error } = await supabase
      .from('auction_state')
      .upsert({
        id: STATE_ID,
        state: state as any,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'id' });

    if (error) {
      console.error('[Persistence] Save failed:', error.message);
    }
  } catch (err) {
    console.error('[Persistence] Save error:', err);
  }
}

/** Load auction state from Supabase */
export async function loadAuctionState(): Promise<PersistedState | null> {
  try {
    const { data, error } = await supabase
      .from('auction_state')
      .select('state')
      .eq('id', STATE_ID)
      .maybeSingle();

    if (error) {
      console.error('[Persistence] Load failed:', error.message);
      return null;
    }

    if (!data || !data.state) return null;

    return data.state as PersistedState;
  } catch (err) {
    console.error('[Persistence] Load error:', err);
    return null;
  }
}

/** Delete auction state (on "New Auction") */
export async function clearAuctionState(): Promise<void> {
  try {
    const { error } = await supabase
      .from('auction_state')
      .delete()
      .eq('id', STATE_ID);

    if (error) {
      console.error('[Persistence] Clear failed:', error.message);
    }
  } catch (err) {
    console.error('[Persistence] Clear error:', err);
  }
}
