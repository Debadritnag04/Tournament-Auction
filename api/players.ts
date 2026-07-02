import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.VITE_SUPABASE_ANON_KEY!
);

/**
 * GET /api/players
 * 
 * Returns all players in the master database.
 * 
 * Query params:
 *   ?position=GK|DEF|MID|ATT  — Filter by position
 *   ?tier=S|A|B|C|D            — Filter by tier
 * 
 * Response: Array of player objects
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
    const { position, tier } = req.query;

    let query = supabase
      .from('players')
      .select('*')
      .order('tier')
      .order('rating', { ascending: false });

    if (position) query = query.eq('position', position as string);
    if (tier) query = query.eq('tier', tier as string);

    const { data, error } = await query;
    if (error) throw error;

    return res.status(200).json({ players: data, count: data?.length || 0 });
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
}
