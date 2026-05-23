import { useState } from 'react';
import { useStore } from '../store';
import { motion, AnimatePresence } from 'motion/react';
import { X, ShieldHalf, Banknote, UserRound, ArrowRightLeft, LayoutGrid, FileText, Download, AlertTriangle } from 'lucide-react';
import { cn } from '../lib/utils';
import { Player } from '../types';
import Papa from 'papaparse';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export default function TeamView({ onClose }: { onClose: () => void }) {
  const { teams, players, config } = useStore();
  const [selectedTeamId, setSelectedTeamId] = useState(teams[0]?.id);
  const [filterPos, setFilterPos] = useState('ALL');
  const [formation, setFormation] = useState('4-3-3');

  const team = teams.find(t => t.id === selectedTeamId);
  const teamPlayers = players.filter(p => p.teamId === selectedTeamId && (p.status === 'sold' || p.status === 'retained'));

  const remaining = team ? team.startingPurse - team.spent : 0;
  const isPurseLow = team && remaining < (team.startingPurse * 0.15);
  const isSquadFull = teamPlayers.length >= config.maxPlayers - 2;
  const hasHealthWarning = isPurseLow || isSquadFull;
  
  // Tactical grouping (sorted by rating so best players start)
  const gkAll = teamPlayers.filter(p => p.position === 'GK').sort((a,b) => b.rating - a.rating);
  const defAll = teamPlayers.filter(p => p.position === 'DEF').sort((a,b) => b.rating - a.rating);
  const midAll = teamPlayers.filter(p => p.position === 'MID').sort((a,b) => b.rating - a.rating);
  const stAll = teamPlayers.filter(p => p.position === 'ST').sort((a,b) => b.rating - a.rating);

  let defC = 4, midC = 3, stC = 3, gkC = 1;
  const isCustomFormation = formation !== 'NONE';
  if (isCustomFormation) {
    const counts = formation.split('-');
    defC = parseInt(counts[0], 10);
    midC = parseInt(counts[1], 10);
    stC = parseInt(counts[2], 10);
  } else {
    // Default fallback sizes for computing best 11 if 'NONE'
    defC = 4; midC = 4; stC = 2;
  }

  const gk = gkAll.slice(0, gkC);
  const def = defAll.slice(0, defC);
  const mid = midAll.slice(0, midC);
  const st = stAll.slice(0, stC);

  const bench = [
    ...gkAll.slice(gkC),
    ...defAll.slice(defC),
    ...midAll.slice(midC),
    ...stAll.slice(stC)
  ].sort((a, b) => b.rating - a.rating);

  const handleExportCSV = () => {
    if (!team) return;
    const exportData = teamPlayers.map(p => ({
      Player: p.name,
      Position: p.position,
      Country: p.country,
      Rating: p.rating,
      Acquisition: p.status,
      Price: p.soldPrice
    }));
    const csv = Papa.unparse(exportData);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${team.name.replace(/\s+/g, '_')}_squad.csv`;
    link.click();
  };

  const handleExportPDF = () => {
    if (!team) return;
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;
    
    doc.setFontSize(22);
    doc.setTextColor(20, 20, 20);
    doc.text(`${team.name} - Squad List`, pageWidth / 2, 20, { align: "center" });
    
    doc.setFontSize(12);
    doc.setTextColor(100, 100, 100);
    doc.text(`Total Spent: ${team.spent.toFixed(1)} Cr | Remaining: ${(team.startingPurse - team.spent).toFixed(1)} Cr`, pageWidth / 2, 30, { align: "center" });

    const tableData = teamPlayers.map(p => [
      p.name,
      p.position,
      p.country,
      p.rating,
      p.status,
      p.soldPrice ? `₹${p.soldPrice} Cr` : '-'
    ]);

    autoTable(doc, {
      startY: 40,
      head: [['Player', 'Position', 'Country', 'Rating', 'Acq.', 'Price']],
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: [242, 125, 38], textColor: [0, 0, 0] },
      styles: { fontSize: 10 }
    });

    doc.save(`${team.name.replace(/\s+/g, '_')}_squad.pdf`);
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 z-50 bg-black/90 backdrop-blur-3xl flex flex-col font-sans"
    >
      <div className="h-16 px-6 flex items-center justify-between border-b border-white/10 bg-[#0a0a0a]">
        <div className="flex items-center gap-3">
          <LayoutGrid className="w-5 h-5 text-[#f27d26]" />
          <h2 className="text-xl font-black tracking-widest uppercase text-white italic">Tactical View</h2>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex bg-white/5 border border-white/10 rounded overflow-hidden">
             {teams.map(t => (
               <button
                 key={t.id}
                 onClick={() => setSelectedTeamId(t.id)}
                 className={cn(
                   "px-4 py-1.5 text-xs font-bold uppercase tracking-widest transition-colors",
                   selectedTeamId === t.id ? "bg-[#f27d26] text-black shadow-sm" : "text-white/40 hover:text-white hover:bg-white/5"
                 )}
               >
                 {t.shortName}
               </button>
             ))}
          </div>
          <button onClick={onClose} className="p-2 bg-white/5 border border-white/10 rounded text-white/40 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Left Stats Panel */}
        <div className="w-80 border-r border-white/10 bg-[#0a0a0a] p-6 flex flex-col hide-scrollbar overflow-y-auto shrink-0">
          {team && (
             <>
               <div className="flex items-center gap-4 mb-8">
                 <div className="w-16 h-16 rounded-full border-4 shadow-xl shrink-0" style={{ backgroundColor: team.primaryColor, borderColor: team.secondaryColor }} />
                 <div className="flex-1 min-w-0">
                   <div className="flex items-center gap-2">
                     <h1 className="text-2xl font-black uppercase tracking-tighter leading-none truncate">{team.name}</h1>
                     {hasHealthWarning && (
                       <div className="bg-red-500/20 text-red-400 p-1 rounded border border-red-500/30" title={isPurseLow ? "Low Purse Warning" : "Squad Size Limit Warning"}>
                         <AlertTriangle className="w-4 h-4" />
                       </div>
                     )}
                   </div>
                   <span className="text-white/40 text-[10px] font-bold tracking-widest uppercase">Team Analytics</span>
                 </div>
                 <div className="flex flex-col gap-1 shrink-0">
                   <button onClick={handleExportCSV} className="p-1.5 bg-white/5 hover:bg-[#f27d26] hover:text-black border border-white/10 hover:border-[#f27d26] rounded text-white/40 transition-colors" title="Export CSV">
                     <FileText className="w-4 h-4" />
                   </button>
                   <button onClick={handleExportPDF} className="p-1.5 bg-white/5 hover:bg-[#f27d26] hover:text-black border border-white/10 hover:border-[#f27d26] rounded text-white/40 transition-colors" title="Export PDF">
                     <Download className="w-4 h-4" />
                   </button>
                 </div>
               </div>

               <div className="grid grid-cols-2 gap-4 mb-8">
                 <div className="bg-white/5 border border-white/10 p-4 rounded min-w-0">
                   <div className="flex items-center gap-2 mb-2 text-white/40">
                     <Banknote className="w-4 h-4 shrink-0" />
                     <span className="text-[10px] uppercase tracking-widest font-bold truncate">Purse (L)</span>
                   </div>
                   <div className="text-xl font-mono font-bold text-[#f27d26] truncate">₹{remaining.toFixed(1)}</div>
                 </div>
                 <div className="bg-white/5 border border-white/10 p-4 rounded min-w-0">
                   <div className="flex items-center gap-2 mb-2 text-white/40">
                     <UserRound className="w-4 h-4 shrink-0" />
                     <span className="text-[10px] uppercase tracking-widest font-bold truncate">Coverage</span>
                   </div>
                   <div className="text-xl font-bold font-mono text-white truncate">
                     {teamPlayers.length}<span className="text-[10px] text-white/40">/{config.maxPlayers}</span>
                   </div>
                 </div>
                 <div className="bg-white/5 border border-white/10 p-4 rounded min-w-0">
                   <div className="flex items-center gap-2 mb-2 text-white/40">
                     <ArrowRightLeft className="w-4 h-4 shrink-0" />
                     <span className="text-[10px] uppercase tracking-widest font-bold truncate">Spent</span>
                   </div>
                   <div className="text-xl font-mono font-bold text-red-400 truncate">₹{team.spent.toFixed(1)}</div>
                 </div>
                 <div className="bg-white/5 border border-white/10 p-4 rounded min-w-0">
                   <div className="flex items-center gap-2 mb-2 text-white/40">
                     <ShieldHalf className="w-4 h-4 shrink-0" />
                     <span className="text-[10px] uppercase tracking-widest font-bold truncate">Avg Pay</span>
                   </div>
                   <div className="text-xl font-mono font-bold text-white truncate">
                      ₹{teamPlayers.length > 0 ? (team.spent / teamPlayers.length).toFixed(1) : '0.0'}
                   </div>
                 </div>
               </div>

               <h3 className="text-[10px] uppercase tracking-widest font-bold text-white/40 mb-4">Latest Signings</h3>
               <div className="space-y-2">
                 {[...teamPlayers].reverse().slice(0, 6).map(p => (
                   <div key={p.id} className="bg-white/5 p-3 flex justify-between items-center group border-l-2" style={{ borderLeftColor: team.primaryColor }}>
                      <div className="overflow-hidden pr-2">
                        <div className="font-bold text-sm tracking-tight truncate uppercase italic">{p.name}</div>
                        <div className="flex gap-2 items-center text-[9px] font-bold font-mono mt-1 uppercase tracking-widest">
                          <span className={cn(
                            "px-1.5 py-0.5",
                            p.status === 'retained' ? "bg-white/10 text-white/80" : "bg-[#f27d26]/20 text-[#f27d26]"
                          )}>
                            {p.status}
                          </span>
                          <span className="text-white/40">{p.position} • {p.rating} RTG</span>
                        </div>
                      </div>
                      <div className="font-mono font-bold text-white shrink-0 bg-white/10 px-2 py-1 select-none">₹{p.soldPrice}</div>
                   </div>
                 ))}
                 {teamPlayers.length === 0 && <span className="text-[10px] font-bold tracking-widest uppercase text-white/20 block text-center mt-8">No players signed yet.</span>}
               </div>
             </>
          )}
        </div>

        {/* Center Pitch View */}
        <div className="flex-1 bg-[#111] relative flex flex-col min-w-0">
          <div className="flex-1 relative overflow-hidden flex items-center justify-center p-8">
             {/* Position Filter */}
           <div className="absolute top-6 right-6 z-20 flex bg-white/5 border border-white/10 p-1 backdrop-blur-sm shadow-xl rounded">
             {['ALL', 'ST', 'MID', 'DEF', 'GK'].map(pos => (
               <button
                 key={pos}
                 onClick={() => setFilterPos(pos)}
                 className={cn(
                   "px-4 py-1.5 text-[10px] font-black tracking-widest uppercase transition-colors rounded-sm",
                   filterPos === pos ? "bg-[#f27d26] text-black" : "text-white/40 hover:text-white hover:bg-white/5"
                 )}
               >
                 {pos}
               </button>
             ))}
           </div>

           {/* Tactical Overlay Toggle */}
           <div className="absolute top-6 left-6 z-20 flex bg-white/5 border border-white/10 p-1 backdrop-blur-sm shadow-xl rounded">
             {['NONE', '4-3-3', '4-4-2', '3-5-2', '5-3-2'].map(fmt => (
               <button
                 key={fmt}
                 onClick={() => setFormation(fmt)}
                 className={cn(
                   "px-3 py-1.5 text-[10px] font-black tracking-widest uppercase transition-colors rounded-sm",
                   formation === fmt ? "bg-white/20 text-white" : "text-white/40 hover:text-white hover:bg-white/5"
                 )}
               >
                 {fmt}
               </button>
             ))}
           </div>

           {/* Abstract Pitch Background */}
           <div className="absolute inset-4 max-w-4xl mx-auto border-2 border-white/10 opacity-50 pointer-events-none overflow-hidden flex flex-col justify-between">
              {/* Halves */}
              <div className="w-full h-1/2 border-b-2 border-white/10 relative flex justify-center pt-8">
                 <div className="w-[40%] h-32 border-2 border-white/10 border-t-0 bg-white/[0.02]" />
              </div>
              <div className="w-full h-1/2 relative flex justify-center items-end pb-8">
                 <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-40 h-40 rounded-full border-2 border-white/10" />
                 <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-white/20" />
                 <div className="w-[40%] h-32 border-2 border-white/10 border-b-0 bg-white/[0.02]" />
              </div>
           </div>

           {/* Squad Layout */}
           <div className="relative z-10 w-full h-full max-w-4xl mx-auto flex flex-col justify-between py-12 px-8 isolate">
             <Row players={st} activeFilter={filterPos} label="ATT" requiredCount={stC} />
             <Row players={mid} activeFilter={filterPos} label="MID" requiredCount={midC} />
             <Row players={def} activeFilter={filterPos} label="DEF" requiredCount={defC} />
             <Row players={gk} isGK activeFilter={filterPos} label="GK" requiredCount={gkC} />
           </div>
        </div>

        {/* Substitute Bench */}
        <div className="h-40 bg-[#0a0a0a] border-t border-white/10 p-5 shrink-0 flex flex-col z-20 shadow-[0_-10px_40px_rgba(0,0,0,0.5)]">
           <div className="text-[10px] font-black tracking-[0.2em] uppercase text-white/40 mb-3 flex items-center justify-between">
             <span>Substitute Bench ({bench.length})</span>
           </div>
           <div className="flex-1 overflow-x-auto hide-scrollbar flex gap-6 items-start px-2 py-1">
              <AnimatePresence>
                {bench.filter(p => filterPos === 'ALL' || p.position === filterPos).map(p => (
                   <motion.div 
                     layoutId={p.id}
                     key={p.id}
                     initial={{ opacity: 0, scale: 0.8 }}
                     animate={{ opacity: 1, scale: 1 }}
                     exit={{ opacity: 0, scale: 0.8 }}
                     transition={{ layout: { type: "spring", stiffness: 300, damping: 30 } }}
                     className="relative group flex flex-col shrink-0 items-center cursor-crosshair transition-all duration-300 hover:-translate-y-2"
                   >
                     <div className="w-12 h-12 bg-white/5 border border-white/10 rounded flex justify-center items-center flex-col transition-colors group-hover:border-[#f27d26]/50 shadow-md">
                       <span className="text-sm font-black italic text-white uppercase mt-1">{p.name.substring(0, 2)}</span>
                       <span className="text-[7px] font-bold text-white/40 uppercase pb-1 leading-none">{p.position}</span>
                     </div>
                     <div className="mt-2 w-max max-w-[60px] text-center">
                       <div className="text-[9px] font-black italic text-white/80 tracking-widest uppercase truncate">{p.name.split(' ')[0]}</div>
                     </div>
                   </motion.div>
                ))}
                {bench.length === 0 && (
                  <div className="h-full flex items-center">
                    <span className="text-xs font-bold text-white/20 italic tracking-widest uppercase">Bench is empty</span>
                  </div>
                )}
              </AnimatePresence>
           </div>
        </div>
      </div>
     </div>
    </motion.div>
  );
}

function Row({ players, isGK, activeFilter = 'ALL', requiredCount, label }: { players: Player[], isGK?: boolean, activeFilter?: string, requiredCount?: number, label?: string }) {
  const visiblePlayers = activeFilter === 'ALL' ? players : players.filter(p => p.position === activeFilter);
  const placeholders = requiredCount !== undefined ? Math.max(0, requiredCount - players.length) : (players.length === 0 ? 1 : 0);

  return (
    <div className="w-full flex justify-center py-2 relative min-h-[80px]">
      {label && <div className="absolute left-0 top-1/2 -translate-y-1/2 text-[10px] font-black text-white/10 uppercase tracking-[0.3em] -rotate-90 select-none z-0">{label}</div>}
      <div className="flex justify-center flex-wrap gap-8 z-10">
        <AnimatePresence mode="popLayout">
          {visiblePlayers.map((p, i) => (
            <motion.div 
              layoutId={p.id}
              key={p.id}
              initial={{ opacity: 0, scale: 0.5, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.5, y: -20 }}
              transition={{ delay: i * 0.05, layout: { type: "spring", stiffness: 300, damping: 30 } }}
              className="relative group cursor-crosshair transition-all duration-300 hover:scale-110 z-20"
            >
              {/* Player Node / Marker */}
              <div className="w-14 h-14 bg-[#111] border-2 border-[#f27d26]/80 rounded flex justify-center items-center flex-col shrink-0 overflow-hidden shadow-[0_0_15px_rgba(242,125,38,0.2)]">
                <span className="text-xl font-black italic text-white uppercase mt-1">{p.name.substring(0, 2)}</span>
                <span className="text-[8px] font-bold text-[#f27d26] uppercase pb-1 leading-none">{p.position}</span>
              </div>
              
              {/* Hover Detailed Card */}
              <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-4 w-48 bg-black/90 backdrop-blur-md border border-[#f27d26]/30 rounded p-4 opacity-0 group-hover:opacity-100 transition-all pointer-events-none scale-95 group-hover:scale-100 z-50">
                 <div className="flex justify-between items-start mb-2">
                   <div className="font-black italic text-lg text-white leading-tight pr-2 uppercase">{p.name}</div>
                   <div className="text-[10px] font-black bg-[#f27d26] px-2 py-0.5 text-black uppercase tracking-widest">{p.position}</div>
                 </div>
                 <div className="flex justify-between items-center text-[10px] uppercase tracking-widest text-white/40 mb-2 font-bold">
                   <span>Rating</span>
                   <span className="font-mono text-white text-sm">{p.rating}</span>
                 </div>
                  <div className="flex justify-between items-center text-[10px] uppercase tracking-widest text-[#f27d26] font-bold">
                   <span>Sold For</span>
                   <span className="font-mono text-lg leading-none">₹{p.soldPrice}</span>
                 </div>
                 {/* Connecting triangle pointer */}
                 <div className="absolute top-full left-1/2 -translate-x-1/2 border-[6px] border-transparent border-t-[#f27d26]/30" />
              </div>

              {/* Always on label below marker if not hovered */}
              <div className="absolute top-full left-1/2 -translate-x-1/2 mt-3 w-max max-w-[80px] text-center opacity-100 group-hover:opacity-0 transition-opacity">
                <div className="text-[9px] font-black italic text-white tracking-widest uppercase truncate">{p.name.split(' ')[0]}</div>
                <div className="text-[10px] font-mono text-[#f27d26] font-bold">₹{p.soldPrice}</div>
              </div>
            </motion.div>
          ))}
          {Array.from({ length: placeholders }).map((_, i) => (
             <motion.div 
               layout
               key={`placeholder-${i}`}
               initial={{ opacity: 0, scale: 0.8 }}
               animate={{ opacity: 1, scale: 1 }}
               className="w-14 h-14 rounded border-2 border-dashed border-white/10 flex items-center justify-center shrink-0"
             >
                <div className="w-2 h-2 rounded bg-white/5" />
             </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  )
}
