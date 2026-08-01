import { useEffect, useState } from 'react';
import type React from 'react';
import { useStore } from '../store';
import { motion, AnimatePresence } from 'motion/react';
import { Gavel, Search, Eye, Zap, Trophy, Users, RefreshCw, X, AlertTriangle, Brain } from 'lucide-react';
import { cn } from '../lib/utils';
import { AuctionPot, Tier } from '../types';
import TeamView from './TeamView';
import SquadAdvisor from './SquadAdvisor';

const POT_ORDER: AuctionPot[] = ['GK', 'DEF', 'MID', 'ATT'];
const POT_LABELS: Record<AuctionPot, string> = { GK: 'Goalkeepers', DEF: 'Defenders', MID: 'Midfielders', ATT: 'Attackers' };
const POT_COLORS: Record<AuctionPot, string> = { GK: '#f59e0b', DEF: '#3b82f6', MID: '#10b981', ATT: '#ef4444' };
const TIER_COLORS: Record<Tier, string> = { S: '#fbbf24', A: '#a78bfa', B: '#60a5fa', C: '#34d399', D: '#9ca3af' };

function getNextBidAmount(currentBid: number): number {
  if (currentBid <= 20) return currentBid + 1;
  if (currentBid <= 40) return currentBid + 2;
  if (currentBid <= 70) return currentBid + 5;
  return currentBid + 10;
}

export default function LiveAuction() {
  const {
    players, teams, config, currentPot, history,
    currentPlayerId, currentBid, currentLeadingTeamId, timer,
    setStep, setCurrentPot,
    startAuctionForPlayer, placeBid, sellPlayer, markUnsold, tickTimer, revivePlayers,
  } = useStore();

  const [showTeamView, setShowTeamView] = useState(false);
  const [showRevive, setShowRevive] = useState(false);
  const [showAdvisor, setShowAdvisor] = useState(false);
  const [selectedToRevive, setSelectedToRevive] = useState<Set<string>>(new Set());
  const [reviveSearch, setReviveSearch] = useState('');
  const [search, setSearch] = useState('');
  const [advisorTeamId, setAdvisorTeamId] = useState<string>('');

  const potPlayers = players.filter(p => p.position === currentPot && p.status === 'available');
  const filteredQueue = potPlayers.filter(p =>
    !search || p.name.toLowerCase().includes(search.toLowerCase())
  ).sort((a, b) => {
    const tierOrder = { S: 0, A: 1, B: 2, C: 3, D: 4 };
    return tierOrder[a.tier] - tierOrder[b.tier] || b.rating - a.rating;
  });

  const currentPlayer = players.find(p => p.id === currentPlayerId);
  const leadingTeam = teams.find(t => t.id === currentLeadingTeamId);

  useEffect(() => {
    if (!currentPlayerId) return;
    const interval = setInterval(() => tickTimer(), 1000);
    return () => clearInterval(interval);
  }, [currentPlayerId, tickTimer]);

  useEffect(() => {
    if (timer === 0 && currentPlayerId && currentLeadingTeamId) sellPlayer();
  }, [timer, currentPlayerId, currentLeadingTeamId, sellPlayer]);

  const handleRandomFromPot = () => {
    if (potPlayers.length === 0) return;
    startAuctionForPlayer(potPlayers[Math.floor(Math.random() * potPlayers.length)].id);
  };

  const handleRandomAny = () => {
    const all = players.filter(p => p.status === 'available');
    if (all.length === 0) return;
    const rand = all[Math.floor(Math.random() * all.length)];
    setCurrentPot(rand.position);
    startAuctionForPlayer(rand.id);
  };

  const unsoldPlayers = players.filter(p => p.status === 'unsold');
  const filteredUnsoldPlayers = unsoldPlayers.filter(p => 
    !reviveSearch || p.name.toLowerCase().includes(reviveSearch.toLowerCase())
  );

  const handleRevive = () => {
    if (selectedToRevive.size === 0) return;
    revivePlayers(Array.from(selectedToRevive));
    setSelectedToRevive(new Set());
    setShowRevive(false);
  };

  const potCounts = POT_ORDER.map(pot => ({
    pot,
    available: players.filter(p => p.position === pot && p.status === 'available').length,
    total: players.filter(p => p.position === pot).length,
  }));

  return (
    <div className="fixed inset-0 bg-[#030305] text-white font-sans flex flex-col overflow-hidden">
      {/* Background glow */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[250px] rounded-full blur-[100px] opacity-[0.07]" style={{ backgroundColor: POT_COLORS[currentPot] }} />
      </div>

      {/* ── HEADER ── */}
      <header className="relative z-10 flex items-center justify-between px-3 h-9 border-b border-white/8 bg-black/70 backdrop-blur-md shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
          <span className="text-[8px] font-black uppercase tracking-[0.2em] text-red-400">LIVE</span>
          <div className="h-3 w-px bg-white/10 mx-1" />
          <span className="text-[11px] font-black italic uppercase tracking-tight">MEGA AUCTION</span>
          <span className="text-[9px] text-white/25 ml-1">/ {POT_LABELS[currentPot]}</span>
        </div>
        {/* Pot tabs */}
        <div className="flex items-center gap-px">
          {POT_ORDER.map((pot, idx) => (
            <button key={pot} onClick={() => !currentPlayerId && setCurrentPot(pot)} disabled={!!currentPlayerId}
              className={cn('flex items-center gap-1 px-2 py-0.5 text-[8px] font-bold uppercase tracking-wider rounded-sm cursor-pointer disabled:cursor-not-allowed transition-all',
                currentPot === pot ? 'bg-white/10 text-white' : 'text-white/30 hover:text-white/50')}>
              <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: POT_COLORS[pot], opacity: currentPot === pot ? 1 : 0.4 }} />
              {pot}<span className="text-[7px] font-mono text-white/20 ml-0.5">{potCounts[idx].available}</span>
            </button>
          ))}
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-[8px] font-bold mr-1 flex items-center gap-1.5"><span className="text-emerald-400">S:{players.filter(p => p.status === 'sold').length}</span><span className="text-red-400">U:{players.filter(p => p.status === 'unsold').length}</span></span>
          <button onClick={() => setShowTeamView(true)} className="px-2 py-0.5 bg-white/5 border border-white/8 text-[8px] font-bold uppercase tracking-wider hover:bg-white/10 cursor-pointer rounded-sm flex items-center gap-1">
            <Eye className="w-2.5 h-2.5" />Squads
          </button>
          <button onClick={() => setShowAdvisor(true)} className="px-2 py-0.5 bg-purple-950/50 border border-purple-700/30 text-[8px] font-bold uppercase tracking-wider text-purple-400 hover:bg-purple-900/40 cursor-pointer rounded-sm flex items-center gap-1">
            <Brain className="w-2.5 h-2.5" />Advisor
          </button>
          <button onClick={() => setStep('results')} className="px-2 py-0.5 bg-red-950/50 border border-red-900/30 text-[8px] font-bold uppercase tracking-wider text-red-400 hover:bg-red-900/40 cursor-pointer rounded-sm">End</button>
          {unsoldPlayers.length > 0 && (
            <button onClick={() => setShowRevive(true)} className="px-2 py-0.5 bg-amber-950/50 border border-amber-700/30 text-[8px] font-bold uppercase tracking-wider text-amber-400 hover:bg-amber-900/40 cursor-pointer rounded-sm flex items-center gap-0.5">
              <RefreshCw className="w-2.5 h-2.5" />{unsoldPlayers.length}
            </button>
          )}
        </div>
      </header>

      {/* ── BUDGET TICKER ── */}
      <div className="relative z-10 shrink-0 h-6 bg-black/80 border-b border-white/5 overflow-hidden">
        <div className="budget-ticker flex items-center h-full whitespace-nowrap">
          {[...teams, ...teams].map((team, i) => {
            const remaining = team.startingPurse - team.spent;
            return (
              <span key={`${team.id}-${i}`} className="inline-flex items-center gap-1.5 mx-4">
                <span className="text-[10px] font-black uppercase tracking-wider" style={{ color: '#D4A017' }}>{team.shortName}</span>
                <span className="text-[10px] font-mono font-bold" style={{ color: '#C0C0C0' }}>{remaining} Cr</span>
              </span>
            );
          })}
        </div>
      </div>

      {/* ── MAIN GRID ── */}
      <main className="relative z-10 flex-1 min-h-0 grid gap-1.5 p-1.5 overflow-hidden" style={{ gridTemplateColumns: '17% 1fr 22%' }}>

        {/* ── LEFT: Player Queue ── */}
        <div className="flex flex-col gap-1 overflow-hidden bg-white/[0.02] border border-white/5 rounded">
          <div className="px-2 pt-1.5 shrink-0 relative">
            <Search className="absolute left-3.5 top-1/2 mt-0.75 -translate-y-1/2 w-2.5 h-2.5 text-white/20" />
            <input type="text" placeholder="Search..." value={search} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearch(e.target.value)}
              className="w-full bg-black/40 border border-white/6 pl-6 pr-2 py-[3px] text-[9px] focus:border-white/15 outline-none placeholder:text-white/20 rounded-sm" />
          </div>
          <div className="text-[7px] uppercase tracking-widest text-white/20 font-bold px-2">Queue · {filteredQueue.length}</div>
          <div className="flex-1 min-h-0 overflow-y-auto hide-scrollbar px-1 pb-1 space-y-px">
            {filteredQueue.map(p => (
              <button key={p.id} onClick={() => !currentPlayerId && startAuctionForPlayer(p.id)} disabled={!!currentPlayerId}
                className="w-full text-left bg-white/[0.015] border border-white/[0.04] px-1.5 py-[3px] hover:border-white/10 hover:bg-white/[0.04] transition-all disabled:opacity-30 cursor-pointer rounded-sm flex items-center gap-1">
                <div className="w-5 h-5 rounded-sm bg-white/5 overflow-hidden shrink-0 flex items-center justify-center">
                  {p.image ? <img src={p.image} alt="" className="w-full h-full object-cover" /> : <span className="text-[6px] font-bold text-white/20">{p.tier}</span>}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[9px] font-semibold truncate leading-none">{p.name}</div>
                  <div className="flex items-center gap-0.5 mt-px">
                    <span className="text-[6px] font-black px-0.5 rounded-sm leading-none" style={{ backgroundColor: TIER_COLORS[p.tier] + '20', color: TIER_COLORS[p.tier] }}>{p.tier}</span>
                    <span className="text-[7px] text-white/20">{p.rating}</span>
                  </div>
                </div>
                <span className="text-[8px] font-mono font-bold text-white/30 shrink-0">{p.basePrice}</span>
              </button>
            ))}
          </div>
        </div>

        {/* ── CENTER: Auction Stage ── */}
        <div className="flex flex-col gap-1.5 overflow-hidden min-h-0">
          {currentPlayer ? (
            <>
              {/* Player Showcase */}
              <div className="flex-1 min-h-0 bg-gradient-to-br from-white/[0.025] to-transparent border border-white/6 rounded relative overflow-hidden flex items-center justify-center">
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <span className="text-[100px] font-black text-white/[0.012] italic select-none">{currentPlayer.rating}</span>
                </div>
                <div className="flex w-full px-5 gap-5 items-center relative z-10">
                  {/* Player Card */}
                  <div className="w-36 shrink-0">
                    <div className="bg-gradient-to-b from-[#1a1a2e]/70 to-[#0a0a15]/70 border border-white/6 rounded p-2 relative">
                      <div className="absolute top-1 right-1 w-4 h-4 rounded-full flex items-center justify-center text-[8px] font-black" style={{ backgroundColor: TIER_COLORS[currentPlayer.tier], color: '#000' }}>{currentPlayer.tier}</div>
                      <div className="h-20 flex items-end justify-center mb-1.5">
                        {currentPlayer.image ? (
                          <img src={currentPlayer.image} alt="" className="h-full object-contain drop-shadow-[0_0_10px_rgba(255,255,255,0.06)]" />
                        ) : (
                          <div className="w-14 h-14 rounded-full bg-white/5 flex items-center justify-center">
                            <span className="text-sm font-black text-white/15">{currentPlayer.position}</span>
                          </div>
                        )}
                      </div>
                      <div className="text-center">
                        <div className="text-[7px] text-white/30 uppercase tracking-widest">{currentPlayer.country}</div>
                        <div className="text-[11px] font-black italic uppercase truncate leading-tight">{currentPlayer.name}</div>
                        <div className="flex justify-center gap-2.5 mt-1">
                          <div className="text-center"><div className="text-[5px] text-white/20 uppercase">OVR</div><div className="text-[10px] font-black leading-none">{currentPlayer.rating}</div></div>
                          <div className="text-center"><div className="text-[5px] text-white/20 uppercase">POS</div><div className="text-[10px] font-black leading-none" style={{ color: POT_COLORS[currentPlayer.position] }}>{currentPlayer.position}</div></div>
                          <div className="text-center"><div className="text-[5px] text-white/20 uppercase">BASE</div><div className="text-[10px] font-black text-amber-400 leading-none">{currentPlayer.basePrice}</div></div>
                        </div>
                      </div>
                    </div>
                  </div>
                  {/* Bid Display */}
                  <div className="flex-1 flex flex-col items-center">
                    <div className="text-[7px] uppercase tracking-[0.3em] text-white/20 font-bold mb-1">Current Bid</div>
                    <AnimatePresence mode="popLayout">
                      <motion.div key={currentBid} initial={{ opacity: 0, scale: 0.85 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.85 }}
                        className="text-4xl font-black italic tracking-tighter tabular-nums flex items-baseline">
                        <span className="text-white drop-shadow-[0_0_20px_rgba(255,255,255,0.1)]">{currentBid}</span>
                        <span className="text-sm font-normal ml-1 text-white/30">Cr</span>
                      </motion.div>
                    </AnimatePresence>
                    <div className="mt-2 h-5">
                      {leadingTeam ? (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                          className="px-3 py-0.5 bg-white/5 border border-white/8 rounded-full flex items-center gap-1.5">
                          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: leadingTeam.primaryColor }} />
                          <span className="text-[9px] font-bold uppercase tracking-wider">{leadingTeam.shortName}</span>
                          <span className="text-[7px] text-white/25 italic">Leading</span>
                        </motion.div>
                      ) : <span className="text-[7px] text-white/20 uppercase tracking-[0.2em]">Awaiting bid...</span>}
                    </div>
                    {/* Timer */}
                    <div className="mt-3 flex items-center gap-2">
                      <div className="w-28 h-1 bg-white/5 rounded-full overflow-hidden">
                        <div className="h-full rounded-full transition-all duration-300" style={{ width: `${(timer / config.autoTimer) * 100}%`, backgroundColor: timer <= 5 ? '#ef4444' : timer <= 10 ? '#f59e0b' : '#10b981' }} />
                      </div>
                      <div className={cn('w-7 h-7 rounded-full border-2 flex items-center justify-center font-black text-xs tabular-nums',
                        timer <= 5 ? 'border-red-500 text-red-400' : 'border-white/12 text-white/70')}>{timer}</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Bidding Panel */}
              <div className="shrink-0 bg-black/50 border border-white/6 rounded p-1.5">
                <div className="grid gap-1" style={{ gridTemplateColumns: `repeat(${Math.min(teams.length, 7)}, 1fr)` }}>
                  {teams.map(team => {
                    const rem = team.startingPurse - team.spent;
                    const nextBid = currentLeadingTeamId === null ? currentBid : getNextBidAmount(currentBid);
                    const squadCount = players.filter(p => p.teamId === team.id && (p.status === 'sold' || p.status === 'retained')).length;
                    const full = squadCount >= config.maxPlayers;
                    const canAfford = rem >= nextBid;
                    const leading = currentLeadingTeamId === team.id;
                    const canBid = canAfford && !leading && !full;
                    return (
                      <button key={team.id} onClick={() => placeBid(team.id)} disabled={!canBid}
                        className={cn('py-1.5 px-1 rounded-sm border transition-all flex flex-col items-center cursor-pointer',
                          leading ? 'border-amber-500/40 bg-amber-500/10' : canBid ? 'border-white/6 bg-white/[0.015] hover:bg-white/6 hover:border-white/15' : 'border-white/[0.03] opacity-30 cursor-not-allowed')}>
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: team.primaryColor }} />
                        <span className="text-[7px] font-bold uppercase tracking-wider mt-px truncate w-full text-center">{team.shortName}</span>
                        <span className="text-[10px] font-black tabular-nums leading-tight">{leading ? currentBid : nextBid}</span>
                        <span className={cn('text-[6px] font-bold uppercase',
                          leading ? 'text-amber-400' : !canAfford ? 'text-red-400' : full ? 'text-orange-400' : 'text-white/20')}>
                          {leading ? 'Lead' : !canAfford ? 'Low' : full ? 'Full' : `${rem}`}
                        </span>
                      </button>
                    );
                  })}
                </div>
                <div className="flex gap-1 mt-1.5">
                  <button onClick={sellPlayer} disabled={!leadingTeam}
                    className="flex-1 py-1 bg-emerald-600 hover:bg-emerald-500 text-white font-black uppercase text-[8px] tracking-widest disabled:opacity-20 rounded-sm cursor-pointer">
                    SOLD → {leadingTeam?.shortName || '...'}
                  </button>
                  <button onClick={markUnsold}
                    className="px-3 py-1 bg-red-950/60 hover:bg-red-900 border border-red-900/30 text-red-400 font-bold uppercase text-[8px] tracking-widest rounded-sm cursor-pointer">
                    Unsold
                  </button>
                </div>
              </div>
            </>
          ) : (
            /* Standby */
            <div className="flex-1 min-h-0 bg-white/[0.01] border border-white/[0.04] rounded flex flex-col items-center justify-center relative overflow-hidden">
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <span className="text-[70px] font-black text-white/[0.015] italic select-none uppercase">{currentPot}</span>
              </div>
              <Gavel className="w-8 h-8 text-white/15 mb-2 relative z-10" />
              <h2 className="text-sm font-bold text-white/20 uppercase tracking-[0.15em] italic mb-0.5 relative z-10">{POT_LABELS[currentPot]} Pot</h2>
              <p className="text-[8px] text-white/12 uppercase tracking-widest mb-3 relative z-10">{potPlayers.length} remaining</p>
              <div className="flex gap-2 relative z-10">
                <button onClick={handleRandomFromPot} disabled={potPlayers.length === 0}
                  className="px-3 py-1.5 bg-white/5 hover:bg-white/8 border border-white/8 hover:border-white/15 font-bold uppercase text-[9px] tracking-wider flex items-center gap-1 rounded-sm disabled:opacity-20 cursor-pointer">
                  <Zap className="w-3 h-3" /> Draw {currentPot}
                </button>
                <button onClick={handleRandomAny} disabled={players.filter(p => p.status === 'available').length === 0}
                  className="px-3 py-1.5 bg-[#f27d26]/10 hover:bg-[#f27d26]/20 border border-[#f27d26]/25 hover:border-[#f27d26]/40 text-[#f27d26] font-bold uppercase text-[9px] tracking-wider flex items-center gap-1 rounded-sm disabled:opacity-20 cursor-pointer">
                  <Zap className="w-3 h-3" /> Random Any
                </button>
              </div>
            </div>
          )}
        </div>

        {/* ── RIGHT: Purse + Sales ── */}
        <div className="grid overflow-hidden min-h-0" style={{ gridTemplateRows: '1fr 35%', gap: '6px' }}>
          {/* Purse Standings */}
          <div className="bg-white/[0.015] border border-white/[0.04] rounded flex flex-col overflow-hidden min-h-0">
            <div className="px-2 py-1 border-b border-white/[0.04] text-[7px] uppercase font-bold tracking-widest text-white/25 flex items-center gap-1 shrink-0">
              <Users className="w-2.5 h-2.5" /> Purse Standings
            </div>
            <div className="flex-1 min-h-0 overflow-y-auto hide-scrollbar p-1 space-y-0.5">
              {[...teams].sort((a, b) => (b.startingPurse - b.spent) - (a.startingPurse - a.spent)).map(team => {
                const rem = team.startingPurse - team.spent;
                const pct = (rem / team.startingPurse) * 100;
                const sq = players.filter(p => p.teamId === team.id && (p.status === 'sold' || p.status === 'retained')).length;
                const isLow = rem < 50;
                const barColor = pct > 50 ? '#10b981' : pct > 25 ? '#f59e0b' : '#ef4444';
                return (
                  <div key={team.id} className={cn('border rounded-sm px-1.5 py-1 transition-all',
                    isLow ? 'bg-red-950/20 border-red-900/30' : 'bg-white/[0.02] border-white/[0.04]')}>
                    <div className="flex items-center gap-1.5">
                      <div className="w-1 h-4 rounded-sm shrink-0" style={{ backgroundColor: team.primaryColor }} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <div className="text-[8px] font-bold truncate leading-tight">{team.shortName}</div>
                          <span className="text-[7px] text-white/20 font-mono">{sq} players</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <span className="text-[9px] font-mono font-bold text-white/50">{team.spent}</span>
                        <span className="text-[6px] text-white/20">/</span>
                        <span className={cn('text-[10px] font-mono font-black', isLow ? 'text-red-400' : 'text-emerald-400')}>{rem}</span>
                      </div>
                      {isLow && <AlertTriangle className="w-2.5 h-2.5 text-red-400 animate-pulse shrink-0" />}
                    </div>
                    <div className="w-full h-[2px] bg-white/5 rounded-full overflow-hidden mt-0.5">
                      <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: barColor }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Last 5 Sales */}
          <div className="bg-white/[0.015] border border-white/[0.04] rounded flex flex-col overflow-hidden min-h-0">
            <div className="px-2 py-1 border-b border-white/[0.04] text-[7px] uppercase font-bold tracking-widest text-white/25 flex items-center gap-1 shrink-0">
              <Trophy className="w-2.5 h-2.5" /> Last 5 Sales
            </div>
            <div className="flex-1 min-h-0 overflow-y-auto hide-scrollbar p-1 space-y-0.5">
              {(() => {
                // Get sold players ordered by their last bid timestamp (actual sale order)
                const soldPlayers = players.filter(p => p.status === 'sold');
                // Find the last bid for each sold player to determine sale order
                const soldWithTime = soldPlayers.map(p => {
                  const lastBid = [...history].reverse().find(h => h.playerId === p.id);
                  return { ...p, soldAt: lastBid?.timestamp || '' };
                }).sort((a, b) => b.soldAt.localeCompare(a.soldAt));
                const lastFive = soldWithTime.slice(0, 5);
                return lastFive.length > 0 ? lastFive.map((p, idx) => {
                  const t = teams.find(t => t.id === p.teamId);
                  return (
                    <div key={p.id} className={cn('flex items-center justify-between text-[9px] py-1 px-1.5 border border-white/[0.03] rounded-sm', idx === 0 ? 'bg-emerald-950/20 border-emerald-700/20' : 'bg-white/[0.02]')}>
                      <div className="flex items-center gap-1.5 min-w-0">
                        <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: t?.primaryColor || '#666' }} />
                        <span className="truncate text-white/70 font-medium">{p.name}</span>
                        <span className="text-[7px] text-white/25 shrink-0">→ {t?.shortName}</span>
                      </div>
                      <span className="font-mono font-bold text-emerald-400 shrink-0 ml-1.5">{p.soldPrice} Cr</span>
                    </div>
                  );
                }) : (
                  <div className="text-[8px] text-white/12 text-center mt-4 italic">No sales yet</div>
                );
              })()}
            </div>
          </div>
        </div>
      </main>

      {showTeamView && <TeamView onClose={() => setShowTeamView(false)} />}

      {/* Squad Advisor Full Screen */}
      {showAdvisor && (
        <div className="fixed inset-0 z-50 flex flex-col bg-black/95 backdrop-blur-md">
          <div className="flex items-center justify-between px-5 py-3 border-b border-white/10 shrink-0">
            <div className="flex items-center gap-3">
              <Brain className="w-5 h-5 text-purple-400" />
              <h2 className="text-base font-black italic uppercase tracking-widest">Squad Advisor</h2>
              <p className="text-[9px] text-white/30 uppercase tracking-widest">AI-powered team recommendations</p>
            </div>
            <button onClick={() => setShowAdvisor(false)} className="text-white/40 hover:text-white cursor-pointer p-1"><X className="w-5 h-5" /></button>
          </div>
          <div className="flex-1 min-h-0 overflow-y-auto p-5">
            {/* Team selector */}
            <div className="flex flex-wrap gap-2 mb-5">
              {teams.map(team => (
                <button key={team.id} onClick={() => setAdvisorTeamId(team.id)}
                  className={cn('px-3 py-1.5 border rounded-sm text-[10px] font-bold uppercase tracking-wider cursor-pointer transition-all flex items-center gap-1.5',
                    advisorTeamId === team.id ? 'border-purple-500/60 bg-purple-500/10 text-purple-300' : 'border-white/8 bg-white/[0.02] text-white/50 hover:border-white/20')}>
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: team.primaryColor }} />
                  {team.shortName}
                </button>
              ))}
            </div>
            {advisorTeamId ? (
              <SquadAdvisor teamId={advisorTeamId} />
            ) : (
              <div className="text-center py-20">
                <Brain className="w-8 h-8 text-purple-400/30 mx-auto mb-3" />
                <p className="text-[10px] text-white/25 uppercase tracking-widest">Select a team above to get AI recommendations</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Revive Unsold Modal */}
      {showRevive && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md">
          <div className="bg-[#0a0a0f] border border-white/10 w-full max-w-3xl max-h-[80vh] flex flex-col rounded-lg overflow-hidden shadow-2xl">
            <div className="px-5 py-3 border-b border-white/10 flex justify-between items-center shrink-0">
              <div>
                <h2 className="text-base font-black italic uppercase tracking-widest">Revive Unsold Players</h2>
                <p className="text-[8px] text-white/30 uppercase tracking-widest mt-0.5">Select players to return to auction pool</p>
              </div>
              <div className="flex items-center gap-3">
                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/20" />
                  <input type="text" placeholder="Search player..." value={reviveSearch} onChange={e => setReviveSearch(e.target.value)} 
                    className="w-48 bg-black/40 border border-white/10 pl-8 pr-3 py-1.5 text-[10px] focus:border-white/20 outline-none placeholder:text-white/20 rounded-sm" />
                </div>
                <button onClick={() => setShowRevive(false)} className="text-white/40 hover:text-white cursor-pointer p-1"><X className="w-5 h-5" /></button>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-4 grid grid-cols-2 md:grid-cols-3 gap-2 min-h-0">
              {filteredUnsoldPlayers.map(p => {
                const isSelected = selectedToRevive.has(p.id);
                return (
                  <button key={p.id}
                    onClick={() => {
                      const s = new Set(selectedToRevive);
                      isSelected ? s.delete(p.id) : s.add(p.id);
                      setSelectedToRevive(s);
                    }}
                    className={cn('text-left p-3 border rounded-sm transition-all cursor-pointer flex items-center gap-2',
                      isSelected ? 'bg-[#f27d26]/10 border-[#f27d26]/50' : 'bg-white/[0.02] border-white/5 hover:border-white/15')}>
                    {/* Checkbox */}
                    <div className={cn('w-4 h-4 rounded-sm border-2 flex items-center justify-center shrink-0 transition-colors',
                      isSelected ? 'bg-[#f27d26] border-[#f27d26]' : 'border-white/20')}>
                      {isSelected && <span className="text-[9px] text-black font-black">✓</span>}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-[10px] font-bold truncate">{p.name}</div>
                      <div className="text-[8px] text-white/30">{p.position} • {p.tier} • {p.rating} OVR • {p.basePrice} Cr</div>
                    </div>
                  </button>
                );
              })}
              {filteredUnsoldPlayers.length === 0 && (
                <div className="col-span-full text-center py-8 text-[9px] text-white/20 italic uppercase tracking-widest">No unsold players found</div>
              )}
            </div>
            <div className="px-5 py-3 border-t border-white/10 flex justify-between items-center shrink-0 bg-black/40">
              <div className="flex items-center gap-3">
                <span className="text-[9px] text-white/40 uppercase tracking-widest"><span className="text-white font-bold">{selectedToRevive.size}</span> / {filteredUnsoldPlayers.length} selected</span>
                <button onClick={() => setSelectedToRevive(new Set(filteredUnsoldPlayers.map(p => p.id)))}
                  className="text-[8px] text-white/40 hover:text-white uppercase tracking-widest underline underline-offset-2 cursor-pointer">Select All</button>
              </div>
              <div className="flex gap-2">
                <button onClick={() => { setShowRevive(false); setSelectedToRevive(new Set()); }}
                  className="px-4 py-1.5 border border-white/10 text-[9px] font-bold uppercase tracking-widest hover:bg-white/5 cursor-pointer rounded-sm">Cancel</button>
                <button onClick={handleRevive} disabled={selectedToRevive.size === 0}
                  className="px-5 py-1.5 bg-[#f27d26] hover:bg-[#d96a1a] text-black font-black text-[9px] uppercase tracking-widest disabled:opacity-30 cursor-pointer rounded-sm flex items-center gap-1">
                  <RefreshCw className="w-3 h-3" /> Revive Selected
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
