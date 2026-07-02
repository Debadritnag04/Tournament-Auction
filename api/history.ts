import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.VITE_SUPABASE_ANON_KEY!
);

/**
 * GET /api/history
 * 
 * Returns squad_history — immutable snapshots from completed seasons.
 * 
 * Query params:
 *   ?season_id=<uuid>  — Filter by season (required)
 *   ?team_id=<uuid>    — Filter by team (optional)
 *   ?player_id=<uuid>  — Get player career across seasons (optional)
 * 
 * Response: Array of squad_history records with team names
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-api-key');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const apiKey = req.headers['x-api-key'] || req.query.api_key;
  const validKey = process.env.API_SECRET_KEY;
  if (validKey && apiKey !== validKey) {
    return res.status(401).json({ error: 'Invalid or missing API key' });
  }

  try {
    const { season_id, team_id, player_id } = req.query;

    // Player career history across all seasons
    if (player_id) {
      const { data, error } = await supabase
        .from('squad_history')
        .select('*, teams(name, short_name), seasons(name, season_number)')
        .eq('player_id', player_id as string)
        .order('snapshotted_at', { ascending: false });
      if (error) throw error;
      return res.status(200).json({ career: data });
    }

    // Season-specific history
    if (!season_id) {
      return res.status(400).json({ error: 'season_id or player_id is required' });
    }

    let query = supabase
      .from('squad_history')
      .select('*, teams(name, short_name)')
      .eq('season_id', season_id as string)
      .order('purchase_price', { ascending: false });

    if (team_id) {
      query = query.eq('team_id', team_id as string);
    }

    const { data, error } = await query;
    if (error) throw error;

    return res.status(200).json({ history: data, count: data?.length || 0 });
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
}
