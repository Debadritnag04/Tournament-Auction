import { useMemo, useState } from 'react';
import { useStore } from '../store';
import { cn } from '../lib/utils';
import { Player, Position, Tier, Team } from '../types';
import { Brain, Target, Coins, ChevronDown, Sparkles, TrendingUp, RotateCcw } from 'lucide-react';

const POS_COLORS: Record<Position, string> = { GK: '#f59e0b', DEF: '#3b82f6', MID: '#10b981', ATT: '#ef4444' };
const TIER_COLORS: Record<Tier, string> = { S: '#fbbf24', A: '#a78bfa', B: '#60a5fa', C: '#34d399', D: '#9ca3af' };

const IDEAL_SQUAD: Record<Position, { min: number; max: number }> = {
  GK: { min: 1, max: 1 },
  DEF: { min: 3, max: 4 },
  MID: { min: 3, max: 4 },
  ATT: { min: 2, max: 3 },
};

interface Suggestion {
  player: Player;
  score: number;
  reasons: string[];
  maxBid: number;
}

interface BidderPrediction {
  team: Team;
  interest: number; // 0-10
  reasons: string[];
}

// ─── Scoring helpers ───

function getChemistryScore(player: Player, teamPlayers: Player[]): number {
  return Math.min(teamPlayers.filter(p => p.country === player.country).length * 2, 6);
}

function getPositionNeed(position: Position, teamPlayers: Player[]): number {
  const count = teamPlayers.filter(p => p.position === position).length;
  const ideal = IDEAL_SQUAD[position];
  if (count >= ideal.max) return -5;
  if (count < ideal.min) return 5;
  if (count < ideal.max) return 2;
  return 0;
}

function getValueScore(player: Player): number {
  const ratio = player.rating / player.basePrice;
  if (ratio > 20) return 4;
  if (ratio > 14) return 3;
  if (ratio > 10) return 2;
  return 1;
}

function suggestMaxBid(player: Player, budget: number, urgency: number): number {
  const mult: Record<Tier, number> = { S: 2.0, A: 1.7, B: 1.5, C: 1.3, D: 1.2 };
  let maxBid = Math.round(player.basePrice * mult[player.tier]);
  if (urgency >= 4) maxBid = Math.round(maxBid * 1.3);
  maxBid = Math.min(maxBid, Math.round(budget * 0.4));
  return Math.max(maxBid, player.basePrice);
}

// ─── Predict which teams will bid on a player ───

function predictBidders(player: Player, teams: Team[], allPlayers: Player[], config: { maxPlayers: number }): BidderPrediction[] {
  const predictions: BidderPrediction[] = [];

  for (const team of teams) {
    const budget = team.startingPurse - team.spent;
    if (budget < player.basePrice) continue;

    const tp = allPlayers.filter(p => p.teamId === team.id && (p.status === 'sold' || p.status === 'retained'));
    const squadSize = tp.length;
    if (squadSize >= config.maxPlayers) continue;

    const reasons: string[] = [];
    let interest = 0;

    // Position need
    const posNeed = getPositionNeed(player.position, tp);
    if (player.position === 'GK' && tp.filter(p => p.position === 'GK').length >= 1) continue;
    if (posNeed >= 4) { interest += 4; reasons.push(`Needs ${player.position}`); }
    else if (posNeed >= 2) { interest += 2; reasons.push(`${player.position} slot open`); }
    else if (posNeed === -5) continue;

    // Chemistry
    const chem = getChemistryScore(player, tp);
    if (chem >= 4) { interest += 3; reasons.push(`Chem: ${player.country}`); }
    else if (chem >= 2) { interest += 1; reasons.push('Nation link'); }

    // Budget fit
    const slotsLeft = config.maxPlayers - squadSize;
    const avgPerSlot = budget / slotsLeft;
    if (player.basePrice <= avgPerSlot * 0.8) { interest += 2; reasons.push('Within budget'); }
    else if (player.basePrice > avgPerSlot * 1.5) { interest -= 1; }

    // Rating need — if team avg rating is low, they want high-rated players more
    const avgRating = tp.length > 0 ? tp.reduce((s, p) => s + p.rating, 0) / tp.length : 0;
    if (player.rating > avgRating + 2) { interest += 1; reasons.push('Upgrades squad'); }

    // Tier appeal
    if (player.tier === 'S' || player.tier === 'A') { interest += 1; }

    if (interest > 0) predictions.push({ team, interest, reasons });
  }

  return predictions.sort((a, b) => b.interest - a.interest).slice(0, 4);
}

// ─── Main Component ───

export default function SquadAdvisor({ teamId }: { teamId: string }) {
  const { players, teams, config, currentPlayerId } = useStore();
  const [expanded, setExpanded] = useState(true);

  const team = teams.find(t => t.id === teamId);
  if (!team) return null;

  const budget = team.startingPurse - team.spent;
  const teamPlayers = players.filter(p => p.teamId === teamId && (p.status === 'sold' || p.status === 'retained'));
  const available = players.filter(p => p.status === 'available');
  const squadSize = teamPlayers.length;
  const slotsLeft = config.maxPlayers - squadSize;

  const posCounts: Record<Position, number> = {
    GK: teamPlayers.filter(p => p.position === 'GK').length,
    DEF: teamPlayers.filter(p => p.position === 'DEF').length,
    MID: teamPlayers.filter(p => p.position === 'MID').length,
    ATT: teamPlayers.filter(p => p.position === 'ATT').length,
  };

  const nationCounts: Record<string, number> = {};
  teamPlayers.forEach(p => { nationCounts[p.country] = (nationCounts[p.country] || 0) + 1; });
  const topNations = Object.entries(nationCounts).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([n]) => n);

  // Current player bidder prediction
  const currentPlayer = currentPlayerId ? players.find(p => p.id === currentPlayerId) : null;
  const bidderPredictions = useMemo(() => {
    if (!currentPlayer) return [];
    return predictBidders(currentPlayer, teams, players, config);
  }, [currentPlayer, teams, players, config]);

  // Suggestions for selected team
  const suggestions = useMemo(() => {
    const scored: Suggestion[] = [];
    for (const player of available) {
      if (player.basePrice > budget) continue;
      let score = 0;
      const reasons: string[] = [];

      const posNeed = getPositionNeed(player.position, teamPlayers);
      if (player.position === 'GK' && posCounts.GK >= 1) continue;
      if (posNeed === -5) continue;

      if (posNeed >= 4) { score += 10; reasons.push(`🎯 ${player.position} needed`); }
      else if (posNeed >= 2) { score += 5; reasons.push(`📋 ${player.position} open`); }

      const chem = getChemistryScore(player, teamPlayers);
      if (chem >= 4) { score += 6; reasons.push(`🔗 ${player.country} chem`); }
      else if (chem >= 2) { score += 3; reasons.push(`🔗 Nation link`); }
      else if (topNations.includes(player.country)) { score += 2; reasons.push(`🌍 Synergy`); }

      const val = getValueScore(player);
      score += val;
      if (val >= 3) reasons.push(`💰 Value pick`);

      if (player.rating >= 88) { score += 4; reasons.push(`⭐ Elite`); }
      else if (player.rating >= 85) { score += 2; }

      if (player.tier === 'S') score += 3;
      else if (player.tier === 'A') score += 2;

      if ((player.basePrice / budget) > 0.3 && slotsLeft > 3) score -= 3;
      if (squadSize < config.minPlayers && posNeed > 0) score += 3;

      const maxBid = suggestMaxBid(player, budget, posNeed);
      if (score > 0) scored.push({ player, score, reasons, maxBid });
    }
    return scored.sort((a, b) => b.score - a.score).slice(0, 5);
  }, [available, teamPlayers, budget, posCounts, topNations, slotsLeft, squadSize, config.minPlayers]);

  // Unsold player suggestions (top 2 best fits from unsold pool)
  const unsoldPlayers = players.filter(p => p.status === 'unsold');
  const unsoldPicks = useMemo(() => {
    if (unsoldPlayers.length === 0 || slotsLeft <= 0) return [];
    const scored: { player: Player; score: number; reason: string }[] = [];
    for (const player of unsoldPlayers) {
      if (player.basePrice > budget) continue;
      let score = 0;
      let reason = '';

      // Position need
      const posNeed = getPositionNeed(player.position, teamPlayers);
      if (player.position === 'GK' && posCounts.GK >= 1) continue;
      if (posNeed === -5) continue;
      if (posNeed >= 4) { score += 8; reason = `Fills ${player.position} gap`; }
      else if (posNeed >= 2) { score += 4; reason = `${player.position} depth`; }

      // Chemistry
      const chem = getChemistryScore(player, teamPlayers);
      if (chem >= 2) { score += 3; if (!reason) reason = `${player.country} chem link`; }

      // Value — unsold players are bargains
      score += 3; // Bonus for being unsold (cheaper acquisition)
      if (player.rating >= 85) { score += 2; if (!reason) reason = 'High rated bargain'; }

      if (!reason) reason = 'Squad depth';
      if (score > 0) scored.push({ player, score, reason });
    }
    return scored.sort((a, b) => b.score - a.score).slice(0, 2);
  }, [unsoldPlayers, teamPlayers, budget, posCounts, slotsLeft]);

  const needs: string[] = [];
  if (posCounts.GK < 1) needs.push('GK');
  if (posCounts.DEF < 3) needs.push(`${3 - posCounts.DEF} DEF`);
  if (posCounts.MID < 3) needs.push(`${3 - posCounts.MID} MID`);
  if (posCounts.ATT < 2) needs.push(`${2 - posCounts.ATT} ATT`);

  return (
    <div className="h-full bg-white/[0.02] border border-white/5 rounded flex flex-col overflow-hidden">
      <button onClick={() => setExpanded(!expanded)}
        className="px-2 py-1 border-b border-white/5 flex items-center justify-between cursor-pointer hover:bg-white/[0.03] transition-colors shrink-0">
        <div className="flex items-center gap-1.5">
          <Brain className="w-3 h-3 text-purple-400" />
          <span className="text-[7px] uppercase font-bold tracking-widest text-purple-300">Advisor · {team.shortName}</span>
        </div>
        <ChevronDown className={cn('w-3 h-3 text-white/30 transition-transform', expanded && 'rotate-180')} />
      </button>

      {expanded && (
        <div className="flex-1 min-h-0 overflow-y-auto hide-scrollbar p-1.5 space-y-1.5">
          {/* Bidder Prediction — shows when a player is on stage */}
          {currentPlayer && bidderPredictions.length > 0 && (
            <div className="bg-amber-500/5 border border-amber-500/20 rounded-sm p-1.5">
              <div className="flex items-center gap-1 mb-1">
                <TrendingUp className="w-2.5 h-2.5 text-amber-400" />
                <span className="text-[7px] text-amber-300 font-bold uppercase tracking-wider">Likely Bidders</span>
              </div>
              <div className="space-y-0.5">
                {bidderPredictions.map(({ team: t, interest, reasons }) => (
                  <div key={t.id} className="flex items-center gap-1.5">
                    <div className="w-1.5 h-3 rounded-sm" style={{ backgroundColor: t.primaryColor }} />
                    <span className="text-[8px] font-bold flex-1 truncate">{t.shortName}</span>
                    <div className="flex gap-0.5">
                      {Array.from({ length: Math.min(interest, 5) }).map((_, i) => (
                        <div key={i} className="w-1 h-2.5 rounded-sm bg-amber-400" style={{ opacity: 0.4 + (i * 0.15) }} />
                      ))}
                    </div>
                    <span className="text-[6px] text-white/25 truncate max-w-[60px]">{reasons[0]}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Squad status */}
          <div className="bg-black/30 border border-white/5 rounded-sm p-1.5">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[7px] text-white/25 uppercase tracking-widest font-bold">Status</span>
              <span className="text-[8px] font-mono text-white/40">{squadSize}/{config.maxPlayers} · {budget}Cr</span>
            </div>
            <div className="grid grid-cols-4 gap-1">
              {(['GK', 'DEF', 'MID', 'ATT'] as Position[]).map(pos => {
                const count = posCounts[pos];
                const full = count >= IDEAL_SQUAD[pos].max;
                return (
                  <div key={pos} className="text-center">
                    <div className="text-[7px] font-bold" style={{ color: full ? POS_COLORS[pos] + '60' : POS_COLORS[pos] }}>{pos}</div>
                    <div className={cn('text-[9px] font-black', full ? 'text-white/30' : 'text-white')}>{count}<span className="text-white/20">/{IDEAL_SQUAD[pos].max}</span></div>
                  </div>
                );
              })}
            </div>
            {needs.length > 0 && (
              <div className="mt-1 flex flex-wrap gap-0.5">
                {needs.map(n => <span key={n} className="text-[6px] bg-amber-400/10 text-amber-400/80 px-1 py-px rounded-sm font-bold">Need {n}</span>)}
              </div>
            )}
          </div>

          {/* Chemistry */}
          {topNations.length > 0 && (
            <div className="flex items-center gap-1 px-0.5 flex-wrap">
              <Sparkles className="w-2.5 h-2.5 text-cyan-400 shrink-0" />
              {topNations.map(n => (
                <span key={n} className="text-[6px] bg-cyan-400/10 text-cyan-300 px-1 py-px rounded-sm font-bold">{n}({nationCounts[n]})</span>
              ))}
            </div>
          )}

          {/* Recommendations */}
          <div className="space-y-0.5">
            <div className="flex items-center gap-1 px-0.5">
              <Target className="w-2.5 h-2.5 text-emerald-400" />
              <span className="text-[7px] text-emerald-300/70 font-bold uppercase tracking-wider">Picks for {team.shortName}</span>
            </div>
            {suggestions.map(({ player, reasons, maxBid }) => (
              <div key={player.id} className="bg-white/[0.02] border border-white/[0.04] rounded-sm p-1.5 hover:border-white/10 transition-colors">
                <div className="flex items-center gap-1.5">
                  <div className="w-5 h-5 rounded-sm overflow-hidden bg-white/5 shrink-0 flex items-center justify-center">
                    {player.image ? <img src={player.image} alt="" className="w-full h-full object-cover" /> :
                      <span className="text-[6px] font-bold" style={{ color: POS_COLORS[player.position] }}>{player.position}</span>}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[8px] font-bold truncate">{player.name}</div>
                    <div className="flex items-center gap-0.5">
                      <span className="text-[6px] font-black px-0.5 rounded-sm" style={{ backgroundColor: TIER_COLORS[player.tier] + '20', color: TIER_COLORS[player.tier] }}>{player.tier}</span>
                      <span className="text-[6px] text-white/20">{player.rating}·{player.country}</span>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-[8px] font-mono font-bold text-emerald-400">{player.basePrice}</div>
                    <div className="text-[5px] text-white/20">max {maxBid}</div>
                  </div>
                </div>
                <div className="flex flex-wrap gap-0.5 mt-0.5">
                  {reasons.slice(0, 3).map((r, i) => (
                    <span key={i} className="text-[5px] bg-white/[0.04] text-white/40 px-1 py-px rounded-sm">{r}</span>
                  ))}
                </div>
              </div>
            ))}
            {suggestions.length === 0 && (
              <div className="text-[7px] text-white/15 text-center py-2 italic">Squad full or budget low</div>
            )}
          </div>

          {/* Unsold Picks — revive suggestions */}
          {unsoldPicks.length > 0 && (
            <div className="bg-orange-500/5 border border-orange-500/15 rounded-sm p-1.5">
              <div className="flex items-center gap-1 mb-1">
                <RotateCcw className="w-2.5 h-2.5 text-orange-400" />
                <span className="text-[7px] text-orange-300 font-bold uppercase tracking-wider">Revive from Unsold</span>
              </div>
              <div className="space-y-1">
                {unsoldPicks.map(({ player, reason }) => (
                  <div key={player.id} className="flex items-center gap-1.5">
                    <div className="w-4 h-4 rounded-sm overflow-hidden bg-white/5 shrink-0 flex items-center justify-center">
                      {player.image ? <img src={player.image} alt="" className="w-full h-full object-cover" /> :
                        <span className="text-[5px] font-bold" style={{ color: POS_COLORS[player.position] }}>{player.position}</span>}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-[8px] font-bold truncate">{player.name}</div>
                      <div className="text-[6px] text-orange-300/60">{reason}</div>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="text-[7px] font-mono font-bold text-orange-400">{player.basePrice}Cr</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Budget tip */}
          {slotsLeft > 0 && (
            <div className="bg-white/[0.02] border border-white/[0.03] rounded-sm p-1.5 flex items-center gap-1">
              <Coins className="w-2.5 h-2.5 text-amber-400/50 shrink-0" />
              <span className="text-[7px] text-white/30">
                <span className="text-amber-400 font-bold">{Math.round(budget / slotsLeft)}Cr</span> avg/slot ({slotsLeft} left)
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
