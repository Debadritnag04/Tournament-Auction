import { useState, useMemo } from 'react';
import { useStore } from '../store';
import { motion, AnimatePresence } from 'motion/react';
import { Search, Play, ArrowLeft, ShieldCheck, X, AlertTriangle } from 'lucide-react';
import { cn } from '../lib/utils';
import retentionCsvRaw from '../retention_helper.csv?raw';

// Parse the retention CSV into structured data
interface RetentionEntry {
  playerName: string;
  position: string;
  soldPrice: number;
  soldTo: string; // team name uppercase
}

function parseRetentionCSV(): RetentionEntry[] {
  const lines = retentionCsvRaw.trim().split('\n');
  const entries: RetentionEntry[] = [];
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    const parts = line.split(',');
    if (parts.length < 4) continue;
    // Clean up any unicode artifacts in names
    const name = parts[0].replace(/[?\u200B\u200C\u200D\uFEFF]/g, '').trim();
    const position = parts[1].trim();
    const price = parseFloat(parts[2]) || 0;
    const team = parts[3].trim().toUpperCase();
    if (name && team) {
      entries.push({ playerName: name, position, soldPrice: price, soldTo: team });
    }
  }
  return entries;
}

export default function RetentionPhase() {
  const { teams, players, config, retainPlayer, setStep } = useStore();
  const [selectedTeamId, setSelectedTeamId] = useState<string>(teams[0]?.id || '');
  const [search, setSearch] = useState('');
  const [confirmEntry, setConfirmEntry] = useState<RetentionEntry | null>(null);

  const retentionData = useMemo(() => parseRetentionCSV(), []);

  const currentTeam = teams.find(t => t.id === selectedTeamId);
  const teamRetentions = players.filter(p => p.teamId === selectedTeamId && p.status === 'retained');
  const canRetain = teamRetentions.length < config.maxRetentions;
  const remaining = currentTeam ? currentTeam.startingPurse - currentTeam.spent : 0;

  // Filter retention CSV entries for the selected team
  const teamEntries = useMemo(() => {
    if (!currentTeam) return [];
    const teamNameUpper = currentTeam.name.toUpperCase();
    return retentionData.filter(e => e.soldTo === teamNameUpper);
  }, [currentTeam, retentionData]);

  // Filter by search
  const filteredEntries = teamEntries.filter(e =>
    !search || e.playerName.toLowerCase().includes(search.toLowerCase())
  );

  // Check if a player from the CSV is already retained
  const isAlreadyRetained = (entry: RetentionEntry) => {
    const matched = findPlayer(entry);
    if (!matched) return false;
    return matched.status === 'retained' && matched.teamId === selectedTeamId;
  };

  // Find matching player in the loaded players array
  // Uses strict matching: exact match first, then progressively looser
  const findPlayer = (entry: RetentionEntry) => {
    const cleanEntry = entry.playerName.toLowerCase().replace(/[^a-z\s]/g, '').trim();

    // 1. Exact match (after cleaning)
    const exact = players.find(p => {
      const pClean = p.name.toLowerCase().replace(/[^a-z\s]/g, '').trim();
      return pClean === cleanEntry;
    });
    if (exact) return exact;

    // 2. Match with position check (prevents Thiago MID matching Thiago Silva DEF)
    const withPos = players.find(p => {
      const pClean = p.name.toLowerCase().replace(/[^a-z\s]/g, '').trim();
      const posMatch = p.position === entry.position;
      return posMatch && (pClean.includes(cleanEntry) || cleanEntry.includes(pClean));
    });
    if (withPos) return withPos;

    // 3. Loose match — only if the entry name is long enough to be unambiguous (>8 chars)
    if (cleanEntry.length > 8) {
      const loose = players.find(p => {
        const pClean = p.name.toLowerCase().replace(/[^a-z\s]/g, '').trim();
        return pClean.includes(cleanEntry) || cleanEntry.includes(pClean);
      });
      if (loose) return loose;
    }

    return undefined;
  };

  const handleRetain = (entry: RetentionEntry) => {
    if (!currentTeam) return;
    const player = findPlayer(entry);
    if (!player) return;
    if (entry.soldPrice > remaining) return;
    retainPlayer(player.id, currentTeam.id, entry.soldPrice);
    setConfirmEntry(null);
  };

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-[#030305] text-white font-sans">
      {/* Header */}
      <header className="flex-none px-6 py-4 border-b border-white/10 flex justify-between items-center bg-black/50 backdrop-blur-md">
        <div>
          <div className="inline-block bg-[#f27d26] px-3 py-1 text-black font-black text-xs uppercase tracking-widest mb-2">Phase 04</div>
          <h1 className="text-2xl font-black italic uppercase tracking-tight">Retention Phase</h1>
          <p className="text-[9px] uppercase text-white/30 tracking-widest mt-0.5 font-bold">
            Max {config.maxRetentions} retentions per team · Prices from last season's bought price
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => setStep('import')} className="px-4 py-2 text-white/40 hover:text-white flex items-center gap-2 transition-colors font-bold text-[10px] uppercase tracking-widest border border-white/10 bg-white/5 cursor-pointer rounded-sm">
            <ArrowLeft className="w-3.5 h-3.5" /> Back
          </button>
          <button onClick={() => setStep('auction')} className="px-6 py-2 bg-[#f27d26] hover:bg-[#d96a1a] text-black font-black uppercase tracking-widest transition-colors flex items-center gap-2 cursor-pointer rounded-sm text-[11px]">
            <Play className="w-3.5 h-3.5 fill-current" /> Start Auction
          </button>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden min-h-0">
        {/* Left: Team Selector */}
        <div className="w-72 border-r border-white/10 bg-black/40 flex flex-col overflow-y-auto hide-scrollbar shrink-0">
          {teams.map(team => {
            const tRet = players.filter(p => p.teamId === team.id && p.status === 'retained');
            const tRem = team.startingPurse - team.spent;
            const tEntries = retentionData.filter(e => e.soldTo === team.name.toUpperCase()).length;
            return (
              <button key={team.id} onClick={() => setSelectedTeamId(team.id)}
                className={cn('p-4 text-left transition-colors border-b border-white/5 relative cursor-pointer',
                  selectedTeamId === team.id ? 'bg-[#f27d26]/10' : 'hover:bg-white/5')}>
                {selectedTeamId === team.id && <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#f27d26]" />}
                <div className="flex justify-between items-start mb-1.5">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-6 rounded-sm" style={{ backgroundColor: team.primaryColor }} />
                    <h3 className="font-bold text-[12px] uppercase tracking-tight truncate pr-2">{team.name}</h3>
                  </div>
                  <span className="text-[8px] bg-white/10 px-1.5 py-0.5 font-bold uppercase tracking-widest whitespace-nowrap">
                    {tRet.length}/{config.maxRetentions}
                  </span>
                </div>
                <div className="flex justify-between items-center pl-5">
                  <span className="text-[9px] text-white/30 font-mono">{tEntries} eligible</span>
                  <span className="font-mono text-[#f27d26] font-bold text-[12px]">{tRem} Cr</span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Center: Eligible Players from CSV */}
        <div className="flex-1 flex flex-col p-4 overflow-hidden min-h-0">
          <div className="relative mb-3 shrink-0">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
            <input type="text" placeholder="Search eligible players..." value={search} onChange={e => setSearch(e.target.value)}
              className="w-full bg-white/5 border border-white/10 pl-10 pr-4 py-2.5 focus:border-[#f27d26]/50 outline-none text-sm placeholder:text-white/30 font-bold transition-colors rounded-sm" />
          </div>

          {!canRetain && (
            <div className="mb-3 px-3 py-2 bg-amber-500/10 border border-amber-500/30 text-amber-400 text-[9px] uppercase tracking-widest font-bold flex items-center gap-2 rounded-sm">
              <AlertTriangle className="w-3.5 h-3.5" /> Maximum retentions reached for {currentTeam?.name}
            </div>
          )}

          <div className="text-[8px] uppercase tracking-widest text-white/25 font-bold mb-2 px-1">
            {currentTeam?.name} · {filteredEntries.length} players from last season
          </div>

          <div className="flex-1 overflow-y-auto hide-scrollbar grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-2 auto-rows-max min-h-0">
            {filteredEntries.map((entry, idx) => {
              const retained = isAlreadyRetained(entry);
              const canAfford = entry.soldPrice <= remaining;
              const disabled = retained || !canRetain || !canAfford;
              const matchedPlayer = findPlayer(entry);

              return (
                <div key={idx} className={cn('border rounded-sm p-3 relative transition-all',
                  retained ? 'bg-emerald-950/20 border-emerald-700/30 opacity-60' : 'bg-white/[0.02] border-white/8 hover:border-white/15')}>
                  {retained && <div className="absolute top-2 right-2 text-[7px] bg-emerald-500/20 text-emerald-400 px-1.5 py-0.5 font-bold uppercase tracking-widest rounded-sm">Retained</div>}
                  <div className="flex items-start gap-2.5 mb-2">
                    {matchedPlayer?.image && (
                      <img src={matchedPlayer.image} alt="" className="w-9 h-9 rounded-sm object-cover bg-white/5 shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="text-[12px] font-bold truncate leading-tight">{entry.playerName}</div>
                      <div className="text-[9px] text-white/30 mt-0.5">{entry.position} · Last season</div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-[7px] text-white/20 uppercase">Bought Price</div>
                      <div className="text-[14px] font-mono font-black text-amber-400 leading-none">{entry.soldPrice} Cr</div>
                    </div>
                    {!retained && (
                      <button onClick={() => setConfirmEntry(entry)} disabled={disabled}
                        className="px-3 py-1.5 bg-white/5 hover:bg-[#f27d26] hover:text-black border border-white/10 hover:border-[#f27d26] transition-colors font-bold text-[9px] uppercase tracking-widest flex items-center gap-1 disabled:opacity-25 disabled:hover:bg-white/5 disabled:hover:text-white disabled:hover:border-white/10 cursor-pointer rounded-sm">
                        <ShieldCheck className="w-3 h-3" /> Retain
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
            {filteredEntries.length === 0 && (
              <div className="col-span-full py-12 text-center text-white/15 text-[10px] uppercase tracking-widest italic">
                {currentTeam ? 'No eligible players found for this team' : 'Select a team'}
              </div>
            )}
          </div>
        </div>

        {/* Right: Retained Players */}
        <div className="w-64 border-l border-white/10 bg-black/60 flex flex-col overflow-hidden shrink-0">
          <div className="p-3 border-b border-white/10">
            <div className="text-[8px] uppercase tracking-widest text-white/30 font-bold mb-0.5">Retained</div>
            <h3 className="font-black text-[14px] italic uppercase truncate" style={{ color: currentTeam?.primaryColor }}>{currentTeam?.name}</h3>
            <div className="text-[9px] font-mono text-white/30 mt-1">
              Spent: <span className="text-red-400">{currentTeam?.spent || 0} Cr</span> · Left: <span className="text-emerald-400">{remaining} Cr</span>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto hide-scrollbar p-2 space-y-1.5">
            <AnimatePresence>
              {teamRetentions.map(player => (
                <motion.div key={player.id} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
                  className="bg-white/[0.03] border-l-2 p-2.5 rounded-sm" style={{ borderLeftColor: currentTeam?.primaryColor }}>
                  <div className="flex justify-between items-center mb-0.5">
                    <span className="font-bold text-[11px] truncate uppercase">{player.name}</span>
                    <span className="text-[8px] text-white/30">{player.position}</span>
                  </div>
                  <div className="flex justify-between text-[9px]">
                    <span className="text-white/25">Retained for</span>
                    <span className="font-mono text-amber-400 font-bold">{player.soldPrice} Cr</span>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
            {teamRetentions.length === 0 && (
              <div className="text-center py-8 text-white/15 text-[9px] uppercase tracking-widest italic">No retentions yet</div>
            )}
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      {confirmEntry && (() => {
        const matchedPlayer = findPlayer(confirmEntry);
        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
            <div className="bg-[#0a0a0f] border border-white/10 max-w-sm w-full shadow-2xl rounded-lg overflow-hidden">
              <div className="flex justify-between items-center px-5 py-3 border-b border-white/10">
                <h3 className="font-black italic uppercase tracking-widest text-sm">Confirm Retention</h3>
                <button onClick={() => setConfirmEntry(null)} className="text-white/40 hover:text-white cursor-pointer"><X className="w-5 h-5" /></button>
              </div>
              <div className="p-5">
                <div className="flex items-center gap-3 mb-5">
                  {matchedPlayer?.image && <img src={matchedPlayer.image} alt="" className="w-14 h-14 rounded object-cover bg-white/5" />}
                  <div>
                    <div className="text-lg font-black uppercase italic">{confirmEntry.playerName}</div>
                    <div className="text-[9px] text-white/30 uppercase tracking-widest">{confirmEntry.position} · Last Season</div>
                  </div>
                </div>
                <div className="bg-white/5 border border-white/10 p-4 mb-5 rounded-sm">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-[9px] uppercase tracking-widest text-white/40 font-bold">Retention Cost (Bought Price)</span>
                    <span className="text-2xl font-mono font-black text-amber-400">{confirmEntry.soldPrice} Cr</span>
                  </div>
                  <div className="text-[9px] text-white/30">
                    Team: <span className="text-white/60 font-bold">{currentTeam?.name}</span> · Purse after: <span className="text-emerald-400 font-bold">{remaining - confirmEntry.soldPrice} Cr</span>
                  </div>
                </div>
                <div className="flex gap-3">
                  <button onClick={() => setConfirmEntry(null)} className="flex-1 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 font-bold text-[10px] uppercase tracking-widest cursor-pointer rounded-sm">Cancel</button>
                  <button onClick={() => handleRetain(confirmEntry)} disabled={!findPlayer(confirmEntry)} className="flex-1 py-2.5 bg-[#f27d26] hover:bg-[#d96a1a] text-black font-black text-[10px] uppercase tracking-widest cursor-pointer rounded-sm disabled:opacity-30">Confirm</button>
                </div>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
