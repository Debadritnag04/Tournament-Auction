import { useEffect, useState } from 'react';
import { useStore } from '../store';
import { motion, AnimatePresence } from 'motion/react';
import { Trophy, Gavel, Timer, Search, Filter, Hash, Eye } from 'lucide-react';
import { cn } from '../lib/utils';
import TeamView from './TeamView';

export default function LiveAuction() {
  const { 
    players, teams, config, 
    currentPlayerId, currentBid, currentLeadingTeamId, timer, history, setStep,
    startAuctionForPlayer, placeBid, sellPlayer, markUnsold, tickTimer, resetTimer
  } = useStore();
  
  const [showTeamView, setShowTeamView] = useState(false);
  const [search, setSearch] = useState('');
  const [filterPot, setFilterPot] = useState('ALL');

  const availablePlayers = players.filter(p => p.status === 'available');
  const pots = ['ALL', ...Array.from(new Set(availablePlayers.map(p => p.position)))];
  
  const filteredQueue = availablePlayers.filter(p => {
    if (filterPot !== 'ALL' && p.position !== filterPot) return false;
    if (search && !p.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const currentPlayer = players.find(p => p.id === currentPlayerId);
  const leadingTeam = teams.find(t => t.id === currentLeadingTeamId);

  useEffect(() => {
    if (!currentPlayerId) return;
    const interval = setInterval(() => {
      tickTimer();
    }, 1000);
    return () => clearInterval(interval);
  }, [currentPlayerId, tickTimer]);

  useEffect(() => {
    if (timer === 0 && currentPlayerId && currentLeadingTeamId) {
      sellPlayer();
    }
  }, [timer, currentPlayerId, currentLeadingTeamId, sellPlayer]);

  const handleRandomPot = () => {
    if (filterPot === 'ALL') return alert("Select a specific pot first.");
    const potPlayers = availablePlayers.filter(p => p.position === filterPot);
    if (potPlayers.length === 0) return alert("Pot is empty.");
    const randomPlayer = potPlayers[Math.floor(Math.random() * potPlayers.length)];
    startAuctionForPlayer(randomPlayer.id);
  };


  const handleRandomAny = () => {
    if (availablePlayers.length === 0) return alert("No players left!");
    const randomPlayer = availablePlayers[Math.floor(Math.random() * availablePlayers.length)];
    startAuctionForPlayer(randomPlayer.id);
  };

  return (
    <div className="h-full w-full bg-transparent text-white flex flex-col font-sans overflow-hidden p-6 relative">
      {/* Top Bar */}
      <header className="relative z-10 flex items-center justify-between mb-4 border-b border-white/10 pb-4">
        <div className="flex items-center gap-4">
          <div className="bg-[#f27d26] px-3 py-1 text-black font-black text-xs uppercase tracking-widest">Live Auction</div>
          <h1 className="text-xl font-bold tracking-tight italic">SOCCER MEGA AUCTION <span className="text-white/40 font-normal">/ LIVE DRAFT</span></h1>
        </div>
        <div className="flex items-center gap-8">
          <div className="text-right">
            <div className="text-[10px] uppercase text-white/40 tracking-wider">Next Pot</div>
            <div className="text-sm font-semibold">{filterPot}</div>
          </div>
          <button onClick={() => setShowTeamView(true)} className="flex items-center gap-2 bg-white/10 border border-white/20 px-4 py-2 hover:bg-white/20 transition-colors">
            <div className="w-2 h-2 rounded-full bg-green-500"></div>
            <span className="text-xs font-bold uppercase tracking-widest">Tactical Team View</span>
          </button>
          <button onClick={() => setStep('results')} className="flex items-center gap-2 bg-red-950/40 border border-red-900/50 px-4 py-2 hover:bg-red-900/40 text-red-400 transition-colors">
            <span className="text-xs font-bold uppercase tracking-widest">End Auction</span>
          </button>
        </div>
      </header>

      {/* Main Auction Section */}
      <main className="relative z-10 grid grid-cols-12 gap-4 flex-1 overflow-hidden">
        
        {/* Left: Player Queue */}
        <div className="col-span-2 flex flex-col gap-3 h-full overflow-hidden">
          <div className="text-[10px] uppercase text-white/40 font-bold tracking-widest">Upcoming</div>
          
          <div className="flex flex-col gap-2 mb-2 shrink-0">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
              <input 
                type="text" placeholder="Search queue..."
                value={search} onChange={e => setSearch(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded pl-9 pr-3 py-2 text-xs focus:border-[#f27d26] outline-none placeholder:text-white/40 transition-colors"
              />
            </div>
            <div className="relative">
               <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
               <select 
                 value={filterPot} onChange={e => setFilterPot(e.target.value)}
                 className="w-full bg-white/5 border border-white/10 rounded pl-9 pr-3 py-2 text-xs focus:border-[#f27d26] outline-none appearance-none transition-colors"
               >
                 {pots.map(p => <option key={p} className="bg-black" value={p}>{p}</option>)}
               </select>
            </div>
          </div>

          <div className="space-y-2 overflow-y-auto hide-scrollbar flex-1">
            {filteredQueue.map((p, idx) => (
              <div 
                key={p.id} 
                className={cn(
                  "bg-white/5 border-l-2 p-2 flex flex-col gap-2 group transition-all",
                  idx === 0 ? "border-white/20" : "border-transparent opacity-80 hover:opacity-100"
                )}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white/10 rounded flex-shrink-0 flex items-center justify-center font-bold text-xs uppercase text-white/80">
                    {p.position}
                  </div>
                  <div className="overflow-hidden flex-1">
                    <div className="text-xs font-bold truncate">{p.name}</div>
                    <div className="text-[9px] text-white/40">{p.position} • {p.rating} OVR</div>
                  </div>
                </div>
                <div className="flex justify-between items-center px-1">
                   <div className="text-[10px] font-mono text-[#f27d26] font-bold">₹{p.basePrice} Cr</div>
                   <button 
                     onClick={() => startAuctionForPlayer(p.id)}
                     disabled={currentPlayerId !== null}
                     className="text-[9px] uppercase font-bold tracking-wider bg-white text-black px-2 py-0.5 rounded opacity-0 group-hover:opacity-100 disabled:hidden hover:bg-[#f27d26] transition-all"
                   >
                     Nominate
                   </button>
                </div>
              </div>
            ))}
            {filteredQueue.length === 0 && <div className="text-[10px] text-white/40 text-center mt-4">Queue empty.</div>}
          </div>

          <div className="mt-auto p-4 bg-white/5 border border-white/10 rounded flex-shrink-0">
            <div className="text-[10px] uppercase text-white/40 mb-2 font-bold tracking-widest">Pot Stats</div>
            <div className="flex justify-between text-xs font-bold">
              <span>Remaining</span>
              <span className="font-mono">{filteredQueue.length} / {availablePlayers.length}</span>
            </div>
            <div className="w-full bg-white/10 h-1 mt-1 rounded-full overflow-hidden">
              <div className="bg-[#f27d26] h-full transition-all" style={{ width: `${(1 - (filteredQueue.length / Math.max(1, availablePlayers.length))) * 100}%` }}></div>
            </div>
          </div>
        </div>

        {/* Center: Stage */}
        <div className="col-span-7 flex flex-col h-full overflow-hidden">
          {currentPlayer ? (
            <>
              <div className="flex-1 flex flex-col justify-center gap-2">
               <div className="bg-white/[0.03] border border-white/10 rounded-xl relative flex items-center justify-center overflow-hidden py-3 shrink-0">
                {/* Background Player Number Glow */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[180px] font-black text-white/[0.02] italic select-none">
                  {currentPlayer.rating}
                </div>
                
                <div className="flex w-full px-5 gap-5 items-center relative z-10">
                  {/* Player Card Area */}
                  <div className="w-40 bg-gradient-to-br from-[#1a1a1a] to-[#0a0a0a] border border-[#f27d26]/50 p-2.5 rounded-lg flex flex-col relative shrink-0">
                    <div className="absolute -top-2 -right-2 bg-[#f27d26] text-black text-[9px] font-black px-2 py-0.5 transform rotate-3">{currentPlayer.category}</div>
                    <div className="h-24 bg-white/5 rounded-md mb-2 flex items-end justify-center overflow-hidden relative">
                      <div className="w-20 h-20 bg-[#222] rounded-full blur-xl absolute opacity-30"></div>
                      <div className="text-white/20 font-bold mb-3 uppercase text-xs tracking-widest">{currentPlayer.position}</div>
                    </div>
                    <div className="text-center">
                      <div className="text-[9px] text-white/40 uppercase tracking-widest truncate">{currentPlayer.country}</div>
                      <div className="text-base font-black italic uppercase truncate leading-none mt-1" title={currentPlayer.name}>{currentPlayer.name}</div>
                      <div className="flex justify-center gap-3 mt-1.5">
                        <div className="text-center"><div className="text-[7px] text-white/40">OVR</div><div className="font-bold text-xs leading-none mt-0.5">{currentPlayer.rating}</div></div>
                        <div className="text-center"><div className="text-[7px] text-white/40">BASE</div><div className="font-bold text-xs text-[#f27d26] leading-none mt-0.5">{currentPlayer.basePrice}</div></div>
                      </div>
                    </div>
                  </div>

                  {/* Bid Info Area */}
                  <div className="flex-1 flex flex-col items-center">
                    <div className="text-[9px] uppercase tracking-[0.3em] text-white/40 mb-1 font-bold">Current Highest Bid</div>
                    <AnimatePresence mode="popLayout">
                      <motion.div 
                        key={currentBid}
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        className="text-5xl lg:text-6xl font-black italic tracking-tighter text-white tabular-nums drop-shadow-[0_0_30px_rgba(255,255,255,0.1)] flex items-baseline justify-center"
                      >
                         ₹{currentBid.toFixed(1)}<span className="text-xl font-normal ml-2 opacity-60 uppercase">Cr</span>
                      </motion.div>
                    </AnimatePresence>
                    
                    <div className="mt-2 h-8 w-full flex justify-center">
                      {leadingTeam ? (
                         <div className="px-5 py-1.5 bg-white/5 border border-white/20 rounded-full flex items-center gap-2">
                           <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: leadingTeam.primaryColor }}></div>
                           <div className="text-xs font-bold uppercase tracking-widest italic">{leadingTeam.name} <span className="font-normal opacity-50 px-1 italic">Leading</span></div>
                         </div>
                      ) : (
                         <div className="text-[9px] text-white/40 uppercase tracking-[0.2em] font-bold mt-1">Awaiting initial bid...</div>
                      )}
                    </div>
                    
                    {/* Timer progress bars style */}
                    <div className="mt-4 flex gap-2 items-center">
                      <div className={cn("h-1 transition-all", timer <= config.autoTimer * 0.66 ? "w-10 bg-[#f27d26]" : "w-10 bg-white/10")}></div>
                      <div className={cn("h-1 transition-all", timer <= config.autoTimer * 0.33 ? "w-10 bg-[#f27d26]" : "w-10 bg-white/10")}></div>
                      <div className={cn("h-1 transition-all", timer === 0 ? "w-10 bg-[#f27d26]" : "w-10 bg-white/10")}></div>
                      <div className="text-[9px] font-bold uppercase tracking-widest ml-2 w-20 text-center leading-none">
                        {timer <= config.autoTimer * 0.33 ? 'Going Twice' : timer <= config.autoTimer * 0.66 ? 'Going Once' : 'Bidding Open'}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Timer Overlay Loop */}
                <div className="absolute bottom-3 right-3">
                  <div className={cn(
                    "w-12 h-12 border-2 rounded-full flex items-center justify-center bg-black transition-colors duration-1000",
                    timer <= 5 ? "border-red-500 text-red-500" : "border-[#f27d26] text-white"
                  )}>
                    <span className="text-xl font-black tabular-nums tracking-tighter italic">{timer}</span>
                  </div>
                </div>
              </div>

              {/* Bidding Action Bar */}
              <div className="grid grid-cols-5 gap-2 shrink-0">
                {teams.map(team => {
                   const remaining = team.startingPurse - team.spent;
                   const bidIncrement = currentBid < 5 ? 0.5 : currentBid < 10 ? 1 : 2;
                   const nextBid = currentLeadingTeamId === null ? currentBid : (currentBid + bidIncrement);
                   const canBid = remaining >= nextBid && currentLeadingTeamId !== team.id;
                   const isLeading = currentLeadingTeamId === team.id;
                   
                   if (!canBid && !isLeading) {
                     return (
                        <div key={team.id} className="bg-white/5 border border-white/10 p-3 rounded-lg flex flex-col items-center opacity-40 grayscale pointer-events-none">
                          <div className="text-[9px] uppercase font-bold text-center truncate w-full">{team.shortName}</div>
                          <div className="text-lg font-black italic">₹{nextBid.toFixed(1)}</div>
                          <div className="text-[8px] font-bold uppercase text-red-400 tracking-tighter">Low Purse</div>
                        </div>
                     )
                   }
                   
                   return (
                     <button 
                       key={team.id}
                       onClick={() => placeBid(team.id)}
                       disabled={isLeading || !canBid}
                       className={cn(
                         "bg-white/5 border p-3 rounded-lg flex flex-col items-center transition-colors group text-center cursor-pointer",
                         isLeading ? "border-[#f27d26]/50 bg-[#f27d26]/10" : "border-white/10 hover:bg-[#f27d26] hover:text-black",
                         (!canBid && !isLeading) ? "opacity-50 cursor-not-allowed" : ""
                       )}
                     >
                       <div className={cn("text-[9px] uppercase font-bold truncate w-full", isLeading ? "opacity-100 text-[#f27d26]" : "opacity-60 group-hover:opacity-100")}>{team.shortName}</div>
                       <div className="text-lg font-black italic">₹{isLeading ? currentBid.toFixed(1) : nextBid.toFixed(1)}</div>
                       <div className={cn("text-[8px] font-bold uppercase tracking-tighter", isLeading ? "opacity-100 text-[#f27d26]" : "opacity-40 group-hover:opacity-100")}>
                         {isLeading ? 'Leading' : 'Next Bid'}
                       </div>
                     </button>
                   );
                })}
              </div>
              
              <div className="flex gap-2 w-full shrink-0">
                 <button onClick={sellPlayer} disabled={!leadingTeam} className="flex-1 py-2.5 bg-[#f27d26] hover:bg-[#d96a1a] text-black font-black uppercase text-xs tracking-widest disabled:opacity-30 rounded transition-colors block">Sell to {leadingTeam?.shortName || '...'}</button>
                 <button onClick={markUnsold} className="px-5 py-2.5 bg-red-950/40 hover:bg-red-900 border border-red-900/50 text-red-400 font-bold uppercase text-xs tracking-widest rounded transition-colors block">Unsold</button>
              </div>
             </div>
            </>
          ) : (
            <div className="flex-1 bg-white/[0.03] border border-white/10 rounded-xl flex flex-col items-center justify-center relative overflow-hidden">
               <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[160px] font-black text-white/[0.02] italic select-none text-center leading-none">STANDBY</div>
               <div className="w-24 h-24 rounded-full border border-white/10 bg-white/5 flex items-center justify-center mb-6 relative z-10">
                 <Gavel className="w-10 h-10 text-white/40" />
               </div>
               <h2 className="text-2xl font-bold text-white/40 mb-8 tracking-wider uppercase italic relative z-10">Awaiting Nomination</h2>
               
               <div className="flex gap-4 z-10">
                 <button onClick={handleRandomAny} className="px-6 py-3 bg-white/5 hover:bg-white/10 border border-white/10 transition-colors font-bold uppercase text-xs tracking-widest flex items-center gap-2 rounded">
                   Random Any
                 </button>
                 <button onClick={handleRandomPot} disabled={filterPot === 'ALL'} className="px-6 py-3 bg-[#f27d26]/20 hover:bg-[#f27d26]/30 text-[#f27d26] border border-[#f27d26]/30 transition-colors font-bold uppercase text-xs tracking-widest flex items-center gap-2 rounded disabled:opacity-50 disabled:cursor-not-allowed">
                   Random From {filterPot === 'ALL' ? 'Pot' : filterPot}
                 </button>
               </div>
            </div>
          )}
        </div>

        {/* Right: Team Purses & Live Feed */}
        <div className="col-span-3 flex flex-col gap-4 h-full overflow-hidden">
          <div className="flex-1 bg-white/5 border border-white/10 rounded-xl flex flex-col overflow-hidden min-h-0">
            <div className="p-3 border-b border-white/10 text-[10px] uppercase font-bold tracking-widest shrink-0">Purse Standings</div>
            <div className="flex-1 overflow-y-auto p-3 space-y-3 hide-scrollbar">
               {teams.map(team => {
                 const remaining = team.startingPurse - team.spent;
                 return (
                   <div key={team.id} className="flex justify-between items-center bg-white/5 p-2 rounded">
                     <div className="flex items-center gap-2">
                       <div className="w-1 h-6 rounded bg-[#f27d26]" style={{ backgroundColor: team.primaryColor }}></div>
                       <div className="flex flex-col">
                         <span className="text-xs font-bold truncate max-w-[80px]">{team.shortName}</span>
                         <span className="text-[9px] text-white/40 font-mono">{team.startingPurse} Cr Budget</span>
                       </div>
                     </div>
                     <span className="text-[13px] font-mono font-bold">₹{remaining.toFixed(1)} Cr</span>
                   </div>
                 )
               })}
            </div>
          </div>

          <div className="h-56 bg-white/5 border border-white/10 rounded-xl flex flex-col overflow-hidden shrink-0">
            <div className="p-3 border-b border-white/10 text-[10px] uppercase font-bold tracking-widest shrink-0">Auction History</div>
            <div className="flex-1 p-3 space-y-2 font-mono text-[9px] uppercase overflow-y-auto hide-scrollbar">
              {history.slice(-15).reverse().map((h, i) => {
                 const hTeam = teams.find(t => t.id === h.teamId);
                 return (
                   <div key={h.id} className="flex justify-between text-white/40">
                     <span>{hTeam?.shortName} Bid</span>
                     <span>₹{h.amount.toFixed(1)} Cr</span>
                   </div>
                 )
              })}
              {players.filter(p => p.status === 'sold').slice(-5).reverse().map(p => (
                 <div key={`sold-${p.id}`} className="flex justify-between text-green-400 mt-2 pt-2 border-t border-white/5">
                   <span className="truncate max-w-[120px]">{p.name} SOLD</span>
                   <span className="font-bold">₹{p.soldPrice} Cr</span>
                 </div>
              ))}
              {history.length === 0 && players.filter(p=>p.status==='sold').length === 0 && (
                <div className="text-white/20 text-center italic mt-4 normal-case">No history yet.</div>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Bottom Tactical Preview Area */}
      <div className="mt-4 h-16 bg-white/[0.02] border border-white/5 rounded-lg flex items-center px-4 gap-6 relative z-10 shrink-0">
        <div className="text-[10px] uppercase font-bold text-white/40 tracking-wider">Auction Status</div>
        {currentPlayer ? (
          <div className="flex items-center gap-2">
            <div className="px-2 py-1 bg-white/10 rounded text-[10px] font-bold">BASE: ₹{currentPlayer.basePrice.toFixed(1)} Cr</div>
            <div className="text-white/20 italic">→</div>
            <div className={cn("px-2 py-1 rounded text-[10px] font-bold transition-colors", currentBid > currentPlayer.basePrice ? "bg-[#f27d26] text-black" : "bg-white/10 text-white")}>
              LAST BID: ₹{currentBid.toFixed(1)} Cr
            </div>
          </div>
        ) : (
          <div className="text-white/20 italic text-[10px]">Awaiting next player...</div>
        )}
        <div className="flex-1"></div>
        <div className="flex items-center gap-4">
          <div className="flex -space-x-2">
             {teams.slice(0, 4).map((team, idx) => (
                <div key={team.id} className="w-8 h-8 rounded-full border-2 border-black flex items-center justify-center text-[10px] font-bold overflow-hidden bg-neutral-800" style={{ backgroundColor: team.primaryColor, color: '#fff' }}>
                  {team.shortName.substring(0,1)}
                </div>
             ))}
             {teams.length > 4 && (
                <div className="w-8 h-8 rounded-full border-2 border-black flex items-center justify-center text-[10px] font-bold bg-white/10">
                  +{teams.length - 4}
                </div>
             )}
          </div>
          <span className="text-[10px] text-white/40 uppercase font-bold tracking-widest">Active Bidders</span>
        </div>
      </div>

      {showTeamView && <TeamView onClose={() => setShowTeamView(false)} />}
    </div>
  );
}
