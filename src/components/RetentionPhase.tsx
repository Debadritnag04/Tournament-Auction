import { useState } from 'react';
import { useStore } from '../store';
import { motion, AnimatePresence } from 'motion/react';
import { Search, ArrowRight, ShieldCheck, Play, ArrowLeft, X } from 'lucide-react';
import { Tier } from '../types';

const TIER_COLORS: Record<Tier, string> = {
  S: '#fbbf24', A: '#a78bfa', B: '#60a5fa', C: '#34d399', D: '#9ca3af',
};

export default function RetentionPhase() {
  const { teams, players, config, retainPlayer, setStep } = useStore();
  const [selectedTeamId, setSelectedTeamId] = useState<string>(teams[0]?.id || '');
  const [search, setSearch] = useState('');
  const [confirmPlayer, setConfirmPlayer] = useState<string | null>(null);

  const availablePlayers = players.filter(p =>
    p.status === 'available' && p.name.toLowerCase().includes(search.toLowerCase())
  );
  const currentTeam = teams.find(t => t.id === selectedTeamId);
  const teamRetentions = players.filter(p => p.teamId === selectedTeamId && p.status === 'retained');
  const canRetain = teamRetentions.length < config.maxRetentions;
  const remaining = currentTeam ? currentTeam.startingPurse - currentTeam.spent : 0;

  const handleRetain = (playerId: string) => {
    const player = players.find(p => p.id === playerId);
    if (!player || !currentTeam) return;
    if (player.retentionPrice > remaining) return;
    retainPlayer(playerId, currentTeam.id);
    setConfirmPlayer(null);
  };

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-transparent text-white font-sans">
      <header className="flex-none p-6 border-b border-white/10 relative z-10 flex justify-between items-center bg-black/50 backdrop-blur-md">
        <div>
          <div className="inline-block bg-[#f27d26] px-3 py-1 text-black font-black text-xs uppercase tracking-widest mb-2">Phase 04</div>
          <h1 className="text-3xl font-black italic uppercase tracking-tight">Retention Phase</h1>
          <p className="text-[10px] uppercase text-white/40 tracking-widest mt-1 font-bold">Max {config.maxRetentions} retentions per team. Prices are fixed by tier.</p>
        </div>
        <div className="flex items-center gap-4">
          <button onClick={() => setStep('import')} className="px-6 py-3 text-white/40 hover:text-white flex items-center gap-2 transition-colors font-bold text-xs uppercase tracking-widest border border-white/10 bg-white/5 cursor-pointer">
            <ArrowLeft className="w-4 h-4" /> Go Back
          </button>
          <button onClick={() => setStep('auction')} className="px-8 py-3 bg-[#f27d26] hover:bg-[#d96a1a] text-black font-black uppercase tracking-widest transition-colors flex items-center gap-2 cursor-pointer">
            <Play className="w-4 h-4 fill-current" /> Start Live Auction
          </button>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* Left: Team Selector */}
        <div className="w-80 border-r border-white/10 bg-black/40 flex flex-col overflow-y-auto hide-scrollbar">
          {teams.map(team => {
            const tRetentions = players.filter(p => p.teamId === team.id && p.status === 'retained');
            const tRemaining = team.startingPurse - team.spent;
            return (
              <button key={team.id} onClick={() => setSelectedTeamId(team.id)}
                className={`p-6 text-left transition-colors border-b border-white/5 relative cursor-pointer ${selectedTeamId === team.id ? 'bg-[#f27d26]/10' : 'hover:bg-white/5'}`}>
                {selectedTeamId === team.id && <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#f27d26]" />}
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-black text-lg uppercase italic tracking-tighter truncate pr-2">{team.name}</h3>
                  <span className="text-[9px] bg-black px-2 py-1 border border-white/10 font-bold uppercase tracking-widest whitespace-nowrap">
                    {tRetentions.length}/{config.maxRetentions}
                  </span>
                </div>
                <div className="flex justify-between items-end">
                  <span className="text-[10px] text-white/40 uppercase tracking-widest font-bold">Purse</span>
                  <span className="font-mono text-[#f27d26] font-bold text-lg">{tRemaining} Cr</span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Center: Available Players */}
        <div className="flex-1 flex flex-col p-6 overflow-hidden">
          <div className="relative mb-4 shrink-0">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
            <input type="text" placeholder="Search players..." value={search} onChange={e => setSearch(e.target.value)}
              className="w-full bg-white/5 border border-white/10 pl-12 pr-4 py-3 focus:border-[#f27d26] outline-none text-sm placeholder:text-white/40 uppercase tracking-wider font-bold transition-colors" />
          </div>

          {!canRetain && (
            <div className="mb-4 px-4 py-3 bg-amber-500/10 border border-amber-500/30 text-amber-400 text-[10px] uppercase tracking-widest font-bold">
              Maximum retentions reached for {currentTeam?.name}
            </div>
          )}

          <div className="flex-1 overflow-y-auto hide-scrollbar grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 auto-rows-max">
            {availablePlayers.map(player => {
              const canAfford = player.retentionPrice <= remaining;
              const disabled = !canRetain || !canAfford;
              return (
                <div key={player.id} className="bg-white/5 border border-white/10 p-4 flex flex-col gap-3 relative overflow-hidden group hover:border-white/20 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      {player.image && <img src={player.image} alt="" className="w-10 h-10 rounded object-cover bg-white/5" />}
                      <div>
                        <div className="flex items-center gap-1.5 mb-0.5">
                          <span className="text-[8px] font-black px-1.5 py-0.5 rounded" style={{ backgroundColor: TIER_COLORS[player.tier] + '30', color: TIER_COLORS[player.tier] }}>{player.tier}</span>
                          <span className="text-[9px] text-white/40 uppercase">{player.position}</span>
                        </div>
                        <h4 className="font-bold text-sm truncate max-w-[120px]">{player.name}</h4>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-lg font-mono font-bold text-amber-400">{player.retentionPrice}</div>
                      <div className="text-[8px] text-white/30 uppercase">Cr</div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-[9px] text-white/40">
                    <span>{player.country} • {player.rating} OVR</span>
                  </div>
                  <button
                    onClick={() => setConfirmPlayer(player.id)}
                    disabled={disabled}
                    className="w-full py-2.5 bg-white/5 hover:bg-[#f27d26] hover:text-black border border-white/10 hover:border-[#f27d26] transition-colors font-bold text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 disabled:opacity-30 disabled:hover:bg-white/5 disabled:hover:text-white disabled:hover:border-white/10 cursor-pointer"
                  >
                    <ShieldCheck className="w-3.5 h-3.5" /> Retain ({player.retentionPrice} Cr)
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Retained Players */}
        <div className="w-72 border-l border-white/10 bg-black/60 flex flex-col overflow-hidden">
          <div className="p-4 border-b border-white/10">
            <div className="text-[10px] uppercase tracking-widest text-white/40 font-bold mb-1">Retained</div>
            <h3 className="font-black text-xl italic uppercase" style={{ color: currentTeam?.primaryColor }}>{currentTeam?.name}</h3>
          </div>
          <div className="flex-1 overflow-y-auto p-3 space-y-2 hide-scrollbar">
            <AnimatePresence>
              {teamRetentions.map(player => (
                <motion.div key={player.id} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
                  className="bg-white/5 border-l-2 p-3" style={{ borderLeftColor: currentTeam?.primaryColor }}>
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-bold text-sm truncate uppercase">{player.name}</span>
                    <span className="text-[8px] font-black px-1.5 py-0.5 rounded" style={{ backgroundColor: TIER_COLORS[player.tier] + '30', color: TIER_COLORS[player.tier] }}>{player.tier}</span>
                  </div>
                  <div className="flex justify-between text-[9px]">
                    <span className="text-white/40">{player.position} • {player.rating}</span>
                    <span className="font-mono text-amber-400 font-bold">{player.soldPrice} Cr</span>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
            {teamRetentions.length === 0 && (
              <div className="text-center py-10 text-white/20 text-[10px] uppercase tracking-widest font-bold">No retentions yet</div>
            )}
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      {confirmPlayer && (() => {
        const player = players.find(p => p.id === confirmPlayer);
        if (!player) return null;
        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-6">
            <div className="bg-[#111] border border-white/10 max-w-sm w-full shadow-2xl">
              <div className="flex justify-between items-center p-4 border-b border-white/10">
                <h3 className="font-black italic uppercase tracking-widest">Confirm Retention</h3>
                <button onClick={() => setConfirmPlayer(null)} className="text-white/40 hover:text-white cursor-pointer"><X className="w-5 h-5" /></button>
              </div>
              <div className="p-6">
                <div className="flex items-center gap-4 mb-6">
                  {player.image && <img src={player.image} alt="" className="w-16 h-16 rounded object-cover bg-white/5" />}
                  <div>
                    <div className="text-xl font-black uppercase italic">{player.name}</div>
                    <div className="text-[10px] text-white/40 uppercase tracking-widest">{player.position} • {player.country} • {player.rating} OVR</div>
                  </div>
                </div>
                <div className="bg-white/5 border border-white/10 p-4 mb-6 flex justify-between items-center">
                  <span className="text-[10px] uppercase tracking-widest text-white/40 font-bold">Retention Price</span>
                  <span className="text-2xl font-mono font-black text-amber-400">{player.retentionPrice} Cr</span>
                </div>
                <div className="text-[10px] text-white/40 uppercase tracking-widest mb-6">
                  Team: <span className="text-white font-bold">{currentTeam?.name}</span> • Purse after: <span className="text-[#f27d26] font-bold">{remaining - player.retentionPrice} Cr</span>
                </div>
                <div className="flex gap-3">
                  <button onClick={() => setConfirmPlayer(null)} className="flex-1 py-3 bg-white/5 hover:bg-white/10 border border-white/10 font-bold text-xs uppercase tracking-widest transition-colors cursor-pointer">Cancel</button>
                  <button onClick={() => handleRetain(player.id)} className="flex-1 py-3 bg-[#f27d26] hover:bg-[#d96a1a] text-black font-black text-xs uppercase tracking-widest transition-colors cursor-pointer">Confirm</button>
                </div>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
