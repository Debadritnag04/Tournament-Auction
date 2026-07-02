import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.VITE_SUPABASE_ANON_KEY!
);

/**
 * GET /api/squads
 * 
 * Returns all teams with their purchased players, prices, and full player info.
 * 
 * Query params:
 *   ?season_id=<uuid>  — Filter by specific season (optional, defaults to latest)
 *   ?team_id=<uuid>    — Filter by specific team (optional)
 * 
 * Response shape:
 * {
 *   season: { id, name, season_number, auction_type, status },
 *   teams: [
 *     {
 *       team: { id, name, short_name, logo, primary_color, secondary_color },
 *       purse: { starting_purse, current_purse, total_spent },
 *       players: [
 *         {
 *           player_id, name, position, tier, rating, nationality, image_url,
 *           purchase_price, status, acquired_at
 *         }
 *       ]
 *     }
 *   ]
 * }
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-api-key');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // API Key check
  const apiKey = req.headers['x-api-key'] || req.query.api_key;
  const validKey = process.env.API_SECRET_KEY;

  if (validKey && apiKey !== validKey) {
    return res.status(401).json({ error: 'Invalid or missing API key' });
  }

  try {
    const { season_id, team_id } = req.query;

    // Get the season (specific or latest active/completed)
    let seasonQuery = supabase.from('seasons').select('*');
    
    if (season_id) {
      seasonQuery = seasonQuery.eq('id', season_id as string);
    } else {
      seasonQuery = seasonQuery
        .in('status', ['live', 'completed'])
        .order('season_number', { ascending: false })
        .limit(1);
    }

    const { data: seasons, error: seasonError } = await seasonQuery;
    if (seasonError) throw seasonError;
    
    if (!seasons || seasons.length === 0) {
      return res.status(404).json({ error: 'No season found' });
    }

    const season = seasons[0];

    // Get team purse data for this season
    let tournamentsQuery = supabase
      .from('tournaments')
      .select('*, teams(*)')
      .eq('season_id', season.id);

    if (team_id) {
      tournamentsQuery = tournamentsQuery.eq('team_id', team_id as string);
    }

    const { data: tournaments, error: tournError } = await tournamentsQuery;
    if (tournError) throw tournError;

    // Get all current squads for this season with player details
    let squadsQuery = supabase
      .from('current_squads')
      .select('*, players(id, name, position, tier, rating, nationality, image_url)')
      .eq('season_id', season.id)
      .in('status', ['sold', 'retained']);

    if (team_id) {
      squadsQuery = squadsQuery.eq('team_id', team_id as string);
    }

    const { data: squads, error: squadsError } = await squadsQuery;
    if (squadsError) throw squadsError;

    // Build response grouped by team
    const teamsResponse = (tournaments || []).map((t: any) => {
      const teamPlayers = (squads || [])
        .filter((s: any) => s.team_id === t.team_id)
        .map((s: any) => ({
          player_id: s.players?.id,
          name: s.players?.name,
          position: s.players?.position,
          tier: s.players?.tier,
          rating: s.players?.rating,
          nationality: s.players?.nationality,
          image_url: s.players?.image_url,
          purchase_price: s.purchase_price,
          status: s.status,
          acquired_at: s.acquired_at,
        }))
        .sort((a: any, b: any) => b.purchase_price - a.purchase_price);

      return {
        team: {
          id: t.teams?.id,
          name: t.teams?.name,
          short_name: t.teams?.short_name,
          logo: t.teams?.logo,
          primary_color: t.teams?.primary_color,
          secondary_color: t.teams?.secondary_color,
        },
        purse: {
          starting_purse: t.starting_purse,
          current_purse: t.current_purse,
          total_spent: t.starting_purse - t.current_purse,
        },
        players: teamPlayers,
        player_count: teamPlayers.length,
      };
    });

    return res.status(200).json({
      season: {
        id: season.id,
        name: season.name,
        season_number: season.season_number,
        auction_type: season.auction_type,
        status: season.status,
      },
      teams: teamsResponse,
      total_players_bought: teamsResponse.reduce((acc: number, t: any) => acc + t.player_count, 0),
    });
  } catch (error: any) {
    console.error('API Error:', error);
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
}
