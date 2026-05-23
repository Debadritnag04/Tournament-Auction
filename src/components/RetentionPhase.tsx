import { useState } from 'react';
import { useStore } from '../store';
import { motion, AnimatePresence } from 'motion/react';
import { Search, ArrowRight, ShieldCheck, Play, ArrowLeft, X } from 'lucide-react';

export default function RetentionPhase() {
  const { teams, players, retainPlayer, setStep } = useStore();
  const [selectedTeamId, setSelectedTeamId] = useState<string>(teams[0]?.id || '');
  const [search, setSearch] = useState('');
  
  const [retainingPlayer, setRetainingPlayer] = useState<any | null>(null);
  const [retentionPrice, setRetentionPrice] = useState<string>('');
  const [retentionError, setRetentionError] = useState<string>('');

  const availablePlayers = players.filter(p => p.status === 'available' && p.name.toLowerCase().includes(search.toLowerCase()));
  const currentTeam = teams.find(t => t.id === selectedTeamId);
  const teamRetentions = players.filter(p => p.teamId === selectedTeamId && p.status === 'retained');

  const initiateRetain = (player: any) => {
    if (!currentTeam) return;
    setRetainingPlayer(player);
    setRetentionPrice(player.basePrice.toString());
    setRetentionError('');
  };

  const confirmRetain = () => {
    if (!currentTeam || !retainingPlayer) return;
    const price = parseFloat(retentionPrice);
    if (isNaN(price) || price < 0) {
      setRetentionError("Please enter a valid amount.");
      return;
    }
    if (price > (currentTeam.startingPurse - currentTeam.spent)) {
      setRetentionError("Insufficient purse remaining.");
      return;
    }
    retainPlayer(retainingPlayer.id, currentTeam.id, price);
    setRetainingPlayer(null);
  };

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-transparent text-white font-sans">
      <header className="flex-none p-6 border-b border-white/10 relative z-10 flex justify-between items-center bg-black/50 backdrop-blur-md">
        <div>
           <div className="inline-block bg-[#f27d26] px-3 py-1 text-black font-black text-xs uppercase tracking-widest mb-2">Phase 04</div>
           <h1 className="text-3xl font-black italic uppercase tracking-tight">Retention Phase</h1>
           <p className="text-[10px] uppercase text-white/40 tracking-widest mt-1 font-bold">Assign pre-auction retained players.</p>
        </div>
        <div className="flex items-center gap-4">
           <button 
            onClick={() => setStep('import')}
            className="px-6 py-3 text-white/40 hover:text-white flex items-center gap-2 transition-colors font-bold text-xs uppercase tracking-widest border border-white/10 bg-white/5"
          >
            <ArrowLeft className="w-4 h-4" /> Go Back
          </button>
          <button 
            onClick={() => setStep('auction')}
            className="px-8 py-3 bg-[#f27d26] hover:bg-[#d96a1a] text-black font-black uppercase tracking-widest transition-colors flex items-center gap-2"
          >
            <Play className="w-4 h-4 fill-current" /> Start Live Auction
          </button>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* Left: Team Selector & Status */}
        <div className="w-80 border-r border-white/10 bg-black/40 flex flex-col hide-scrollbar overflow-y-auto">
          {teams.map(team => {
             const teamPlayers = players.filter(p => p.teamId === team.id && p.status === 'retained');
             const remaining = team.startingPurse - team.spent;
             return (
              <button
                key={team.id}
                onClick={() => setSelectedTeamId(team.id)}
                className={`p-6 text-left transition-colors border-b border-white/5 relative group ${selectedTeamId === team.id ? 'bg-[#f27d26]/10' : 'hover:bg-white/5'}`}
              >
                {selectedTeamId === team.id && (
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#f27d26]"></div>
                )}
                <div className="absolute right-0 top-0 bottom-0 w-1 opacity-50" style={{ backgroundColor: team.primaryColor }}></div>
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-black text-lg uppercase italic tracking-tighter truncate pr-2">{team.name}</h3>
                  <span className="text-[9px] bg-black px-2 py-1 border border-white/10 font-bold uppercase tracking-widest whitespace-nowrap">
                    {teamPlayers.length} Retained
                  </span>
                </div>
                <div className="flex justify-between items-end">
                  <span className="text-[10px] text-white/40 uppercase tracking-widest font-bold">Purse Remaining</span>
                  <span className="font-mono text-[#f27d26] font-bold text-lg leading-none">₹{remaining.toFixed(1)} <span className="text-xs">Cr</span></span>
                </div>
              </button>
             )
          })}
        </div>

        {/* Center: Available Players */}
        <div className="flex-1 flex flex-col p-6 overflow-hidden bg-transparent relative">
            <div className="relative mb-6 shrink-0 z-10">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
              <input 
                type="text"
                placeholder="Search database..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full bg-white/5 border border-white/10 pl-12 pr-4 py-4 focus:border-[#f27d26] outline-none text-sm placeholder:text-white/40 uppercase tracking-wider font-bold transition-colors"
              />
            </div>
            
            <div className="flex-1 overflow-y-auto pr-4 hide-scrollbar grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 auto-rows-max relative z-10">
               {availablePlayers.map(player => (
                 <div key={player.id} className="bg-white/5 border border-white/10 p-4 flex flex-col gap-4 relative overflow-hidden group hover:border-[#f27d26] transition-colors">
                    <div className="absolute -right-6 top-8 text-[#f27d26] opacity-[0.03] text-8xl font-black italic select-none group-hover:opacity-[0.08] transition-opacity">{player.rating}</div>
                    <div className="flex justify-between items-start relative z-10">
                      <div className="overflow-hidden pr-2">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="bg-[#f27d26] text-black px-2 py-0.5 text-[9px] font-black uppercase tracking-widest">{player.position}</span>
                          <span className="text-[9px] text-white/40 uppercase tracking-widest truncate">{player.country}</span>
                        </div>
                        <h4 className="font-black text-xl italic uppercase truncate" title={player.name}>{player.name}</h4>
                      </div>
                      <div className="text-right shrink-0">
                         <div className="text-xl font-mono font-bold text-[#f27d26] leading-none">₹{player.basePrice}</div>
                         <div className="text-[8px] text-white/40 uppercase tracking-widest mt-1">Base Cr</div>
                      </div>
                    </div>
                    <button 
                      onClick={() => initiateRetain(player)}
                      disabled={!currentTeam}
                      className="mt-auto w-full py-3 bg-white/5 hover:bg-[#f27d26] hover:text-black border border-white/10 hover:border-[#f27d26] transition-colors font-bold text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 group/btn disabled:opacity-30 disabled:hover:bg-white/5 disabled:hover:text-white disabled:hover:border-white/10 cursor-pointer relative z-10"
                    >
                      <ShieldCheck className="w-4 h-4 opacity-50 group-hover/btn:opacity-100" /> 
                      {currentTeam ? `Retain to ${currentTeam.shortName}` : 'Select a team first'}
                    </button>
                 </div>
               ))}
               
               {availablePlayers.length === 0 && (
                 <div className="col-span-full py-20 text-center text-white/20 uppercase tracking-widest text-[10px] font-bold">
                    No matching players found.
                 </div>
               )}
            </div>
        </div>

        {/* Right: Current Team's Retained Players */}
        <div className="w-80 border-l border-white/10 bg-black/60 flex flex-col hide-scrollbar relative overflow-hidden">
          {currentTeam && (
            <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ background: `linear-gradient(to bottom, ${currentTeam.primaryColor}, transparent)` }}></div>
          )}
          <div className="p-6 border-b border-white/10 flex flex-col gap-1 relative z-10">
             <div className="text-[10px] uppercase tracking-widest text-white/40 font-bold mb-2">Squad Preview</div>
             <h3 className="font-black text-2xl italic uppercase tracking-tighter" style={{ color: currentTeam?.primaryColor || '#fff' }}>{currentTeam?.name || 'No Team Selected'}</h3>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-2 relative z-10">
             <AnimatePresence>
              {teamRetentions.map((player, idx) => (
                <motion.div 
                  key={player.id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="bg-white/5 border-l-2 p-3 group"
                  style={{ borderLeftColor: currentTeam?.primaryColor || '#f27d26' }}
                >
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-bold text-sm tracking-tight truncate pr-2 uppercase">{player.name}</span>
                    <span className="text-[9px] font-black bg-white/10 text-white/80 px-2 py-0.5 uppercase tracking-widest">
                      {player.position}
                    </span>
                  </div>
                  <div className="flex justify-between items-end">
                    <span className="text-[9px] text-white/40 uppercase tracking-widest font-bold">Retained For</span>
                    <span className="font-mono text-[#f27d26] text-sm font-bold">₹{player.soldPrice} Cr</span>
                  </div>
                </motion.div>
              ))}
             </AnimatePresence>
             {teamRetentions.length === 0 && currentTeam && (
               <div className="text-center py-10 text-white/20 text-[10px] uppercase tracking-widest font-bold">
                 No retained players yet.
               </div>
             )}
          </div>
        </div>
      </div>

      {retainingPlayer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-6">
          <div className="bg-[#111] border border-white/10 max-w-sm w-full shadow-2xl">
             <div className="flex justify-between items-center p-4 border-b border-white/10">
               <h3 className="font-black italic uppercase tracking-widest">Confirm Retention</h3>
               <button onClick={() => setRetainingPlayer(null)} className="text-white/40 hover:text-white transition-colors">
                 <X className="w-5 h-5" />
               </button>
             </div>
             <div className="p-6">
                <div className="mb-4">
                  <div className="text-[10px] uppercase tracking-widest text-white/40 font-bold mb-1">Player</div>
                  <div className="text-xl font-black uppercase italic">{retainingPlayer.name}</div>
                </div>
                <div className="mb-6">
                  <div className="text-[10px] uppercase tracking-widest text-white/40 font-bold mb-1">Team</div>
                  <div className="text-lg font-bold uppercase">{currentTeam?.name}</div>
                </div>
                <div className="mb-6">
                  <label className="block text-[10px] uppercase tracking-widest text-[#f27d26] font-bold mb-2">Retention Price (Cr)</label>
                  <input 
                    type="number"
                    step="0.1"
                    min="0"
                    value={retentionPrice}
                    onChange={(e) => {
                      setRetentionPrice(e.target.value);
                      setRetentionError('');
                    }}
                    onKeyDown={(e) => e.key === 'Enter' && confirmRetain()}
                    className="w-full bg-black/50 border border-white/20 px-4 py-3 text-lg focus:border-[#f27d26] outline-none font-mono text-white"
                    autoFocus
                  />
                  {retentionError && <div className="text-red-500 text-[10px] mt-2 font-bold uppercase tracking-widest">{retentionError}</div>}
                  <div className="text-[10px] text-white/40 mt-2 uppercase tracking-widest">Default Base: ₹{retainingPlayer.basePrice} Cr</div>
                </div>
                <div className="flex gap-3">
                  <button onClick={() => setRetainingPlayer(null)} className="flex-1 py-3 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold text-xs uppercase tracking-widest transition-colors">
                    Cancel
                  </button>
                  <button onClick={confirmRetain} className="flex-1 py-3 bg-[#f27d26] hover:bg-[#d96a1a] text-black font-black text-xs uppercase tracking-widest transition-colors">
                    Confirm
                  </button>
                </div>
             </div>
          </div>
        </div>
      )}
    </div>
  );
}
