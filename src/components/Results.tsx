import { useStore } from '../store';
import { motion } from 'motion/react';
import { useState } from 'react';
import Papa from 'papaparse';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Download, FileText, Trophy, ArrowLeft, RefreshCw, X, Filter } from 'lucide-react';
import { Team, Player } from '../types';

export default function Results() {
  const { teams, players, setStep, revivePlayers } = useStore();
  const [showRevive, setShowRevive] = useState(false);
  const [selectedToRevive, setSelectedToRevive] = useState<Set<string>>(new Set());
  const [reviveFilter, setReviveFilter] = useState('ALL');

  const unsoldPlayers = players.filter(p => p.status === 'unsold');
  const revivePots = ['ALL', ...Array.from(new Set(unsoldPlayers.map(p => p.position)))];

  const filteredUnsold = unsoldPlayers.filter(p => reviveFilter === 'ALL' || p.position === reviveFilter);

  const toggleReviveSelection = (id: string) => {
    const newSet = new Set(selectedToRevive);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setSelectedToRevive(newSet);
  };

  const selectAllFiltered = () => {
    const newSet = new Set(selectedToRevive);
    filteredUnsold.forEach(p => newSet.add(p.id));
    setSelectedToRevive(newSet);
  };

  const handleExecuteRevive = () => {
    if (selectedToRevive.size === 0) return;
    revivePlayers(Array.from(selectedToRevive));
    setShowRevive(false);
    setSelectedToRevive(new Set());
    setStep('auction');
  };

  const handleExportCSV = () => {
    // Generate CSV for each team
    const exportData = players
      .filter(p => (p.status === 'sold' || p.status === 'retained') && p.teamId)
      .map(p => {
        const team = teams.find(t => t.id === p.teamId);
        return {
          Team: team?.name || 'Unknown',
          Player: p.name,
          Position: p.position,
          Country: p.country,
          Rating: p.rating,
          Acquisition: p.status,
          Price: p.soldPrice
        };
      })
      .sort((a, b) => a.Team.localeCompare(b.Team));

    const csv = Papa.unparse(exportData);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'auction_results.csv';
    link.click();
  };

  const handleExportPDF = () => {
    const doc = new jsPDF();
    
    // Config
    const pageWidth = doc.internal.pageSize.width;
    
    // Title
    doc.setFontSize(22);
    doc.setTextColor(20, 20, 20);
    doc.text("Live Auction Results", pageWidth / 2, 20, { align: "center" });

    let currentY = 35;

    teams.forEach((team, tIdx) => {
      // Check space, if less than 60, add page
      if (currentY > doc.internal.pageSize.height - 60) {
        doc.addPage();
        currentY = 20;
      }

      const teamPlayers = players.filter(p => p.teamId === team.id && (p.status === 'sold' || p.status === 'retained'));
      const remaining = team.startingPurse - team.spent;

      // Team Header
      doc.setFontSize(14);
      doc.setTextColor(0, 0, 0);
      doc.text(team.name, 14, currentY);
      
      doc.setFontSize(10);
      doc.setTextColor(100, 100, 100);
      doc.text(`Spent: ${team.spent.toFixed(1)} Cr | Remaining: ${remaining.toFixed(1)} Cr | Avg Rating: ${(teamPlayers.reduce((a,b)=>a+b.rating,0)/teamPlayers.length || 0).toFixed(1)}`, 14, currentY + 6);
      
      currentY += 10;

      // Players Table
      const tableData = teamPlayers.map(p => [
        p.name, p.position, p.rating.toString(), p.status.toUpperCase(), `${p.soldPrice} Cr`
      ]);

      autoTable(doc, {
        startY: currentY,
        head: [['Player Name', 'Position', 'Rating', 'Method', 'Price']],
        body: tableData,
        theme: 'striped',
        headStyles: { fillColor: team.primaryColor },
        margin: { left: 14, right: 14 },
        didDrawPage: (data) => {
          // In case table creates new pages itself
           currentY = data.cursor ? data.cursor.y + 15 : currentY;
        }
      });
      // @ts-ignore
      currentY = doc.lastAutoTable.finalY + 15;
    });

    doc.save('auction_summary.pdf');
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-6xl mx-auto pt-16 px-6 pb-20 font-sans text-white text-center"
    >
      <div className="mb-16">
        <div className="inline-flex items-center justify-center w-24 h-24 border border-white/10 bg-[#f27d26]/10 text-[#f27d26] mb-6 shadow-[0_0_50px_rgba(242,125,38,0.2)]">
          <Trophy className="w-12 h-12" />
        </div>
        <div className="inline-block bg-[#f27d26] px-3 py-1 text-black font-black text-xs uppercase tracking-widest mb-4 mx-auto block w-max">Final Phase</div>
        <h1 className="text-6xl font-black tracking-tight mb-2 uppercase italic text-transparent bg-clip-text bg-gradient-to-b from-white to-white/40">
          Auction Concluded
        </h1>
        <p className="text-[10px] text-white/40 tracking-[0.2em] uppercase font-bold mt-2">Export your final team rosters and spending history.</p>
      </div>

      <div className="flex justify-center gap-6 mb-16">
         <button 
           onClick={handleExportCSV}
           className="px-8 py-6 bg-white/5 border border-white/10 hover:border-[#f27d26] hover:bg-[#f27d26]/5 flex flex-col items-center gap-4 transition-colors group w-64"
         >
           <FileText className="w-10 h-10 text-white/20 group-hover:text-[#f27d26] transition-colors" />
           <div className="text-center">
             <div className="font-black italic uppercase text-lg mb-1 tracking-wider">Export CSV</div>
             <div className="text-[9px] uppercase tracking-widest text-white/40 font-bold">Raw data spreadsheet</div>
           </div>
         </button>

         <button 
           onClick={handleExportPDF}
           className="px-8 py-6 bg-white/5 border border-white/10 hover:border-[#f27d26] hover:bg-[#f27d26]/5 flex flex-col items-center gap-4 transition-colors group w-64"
         >
           <Download className="w-10 h-10 text-white/20 group-hover:text-[#f27d26] transition-colors" />
           <div className="text-center">
             <div className="font-black italic uppercase text-lg mb-1 tracking-wider">Export PDF</div>
             <div className="text-[9px] uppercase tracking-widest text-white/40 font-bold">Formatted summary report</div>
           </div>
         </button>
      </div>

      {/* Grid of basic results */}
      <div className="flex items-center gap-4 mb-8 before:h-px before:flex-1 before:bg-white/10 after:h-px after:flex-1 after:bg-white/10">
        <h2 className="text-lg font-black uppercase tracking-[0.2em] text-white/40 italic">Final Standings Overview</h2>
      </div>
      
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 text-left">
        {[...teams].sort((a,b) => b.spent - a.spent).map((team, idx) => {
          const tPlayers = players.filter(p => p.teamId === team.id && (p.status === 'sold' || p.status === 'retained'));
          const remaining = team.startingPurse - team.spent;
          const bgRank = idx === 0 ? "bg-[#f27d26]/10 border-[#f27d26]/50" : "bg-white/5 border-white/10";
          
          return (
            <div key={team.id} className={`border p-6 relative overflow-hidden flex flex-col gap-4 ${bgRank}`}>
               <div className="absolute top-0 left-0 w-1 h-full" style={{ backgroundColor: team.primaryColor }} />
               <div className="flex justify-between items-start align-top">
                 <h3 className="font-black text-xl italic uppercase tracking-tighter w-[60%] truncate">{team.name}</h3>
                 <div className="text-right">
                   <div className="font-mono font-bold text-[#f27d26] text-lg leading-none">₹{team.spent.toFixed(1)}</div>
                   <div className="text-[8px] uppercase text-white/40 tracking-widest font-bold mt-1">Spent (Cr)</div>
                 </div>
               </div>
               
               <div className="grid grid-cols-2 gap-4">
                 <div>
                   <div className="text-[9px] text-white/40 uppercase tracking-widest font-bold mb-1">Purse Remaining</div>
                   <div className="font-mono text-white text-sm font-bold bg-white/5 px-2 py-1 inline-block">₹{remaining.toFixed(1)}</div>
                 </div>
                 <div>
                   <div className="text-[9px] text-white/40 uppercase tracking-widest font-bold mb-1">Squad Size</div>
                   <div className="font-mono text-white text-sm font-bold bg-white/5 px-2 py-1 inline-block">{tPlayers.length} / 25</div>
                 </div>
               </div>

               <div className="space-y-4 pt-4 border-t border-white/10 mt-auto">
                 <div className="text-[10px] text-white/40 uppercase tracking-widest truncate font-bold">
                   Marquee: <span className="text-white/80">{tPlayers.reduce((max, p) => p.soldPrice && (!max || p.soldPrice > max.soldPrice) ? p : max, null as Player | null)?.name || 'None'}</span>
                 </div>
                 
                 {(() => {
                   // Calculate Bench (Defaulting to Best 11 4-3-3 split)
                   const gkAll = tPlayers.filter(p => p.position === 'GK').sort((a,b) => b.rating - a.rating);
                   const defAll = tPlayers.filter(p => p.position === 'DEF').sort((a,b) => b.rating - a.rating);
                   const midAll = tPlayers.filter(p => p.position === 'MID').sort((a,b) => b.rating - a.rating);
                   const stAll = tPlayers.filter(p => p.position === 'ST').sort((a,b) => b.rating - a.rating);
                   
                   const bench = [
                     ...gkAll.slice(1),
                     ...defAll.slice(4),
                     ...midAll.slice(3),
                     ...stAll.slice(3)
                   ].sort((a, b) => b.rating - a.rating);

                   return (
                     <div className="text-[9px] text-white/40 uppercase tracking-widest font-bold border-t border-white/5 pt-3">
                       <div className="mb-2">Bench ({bench.length}):</div>
                       <div className="flex flex-wrap gap-1">
                         {bench.length > 0 ? bench.map(p => (
                           <span key={p.id} className="bg-white/5 px-1.5 py-0.5 text-white/80 rounded">
                             {p.name.split(' ')[0]} ({p.position})
                           </span>
                         )) : <span className="text-white/20 italic">No substitutes available</span>}
                       </div>
                     </div>
                   );
                 })()}
               </div>
            </div>
          )
        })}
      </div>
      
      <div className="mt-20 flex justify-center gap-4 pb-20">
         <button onClick={() => setStep('auction')} className="text-[10px] uppercase font-bold tracking-widest text-white/40 hover:text-white flex items-center gap-2 hover:bg-white/5 border border-transparent hover:border-white/10 px-6 py-3 transition-colors">
           <ArrowLeft className="w-4 h-4" /> Back to Auction Board
         </button>
         
         {unsoldPlayers.length > 0 && (
           <button 
             onClick={() => setShowRevive(true)} 
             className="text-[10px] uppercase font-bold tracking-widest text-[#f27d26] hover:bg-[#f27d26]/10 px-6 py-3 transition-colors border border-[#f27d26]/30 hover:border-[#f27d26] flex items-center gap-2"
           >
             <RefreshCw className="w-4 h-4" /> Revive Unsold Players ({unsoldPlayers.length})
           </button>
         )}
      </div>

      {showRevive && (
        <div className="fixed inset-0 z-50 flex justify-center items-center bg-black/90 backdrop-blur-md p-6">
          <div className="bg-[#111] border border-white/10 w-full max-w-4xl flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-white/10 flex justify-between items-center shrink-0">
               <div>
                 <h2 className="text-2xl font-black italic uppercase tracking-widest text-white">Revive Unsold Players</h2>
                 <p className="text-[10px] text-white/40 uppercase tracking-widest font-bold mt-1">Select players to return to the active auction pool</p>
               </div>
               <button onClick={() => setShowRevive(false)} className="text-white/40 hover:text-white transition-colors p-2 hover:bg-white/5">
                 <X className="w-6 h-6" />
               </button>
            </div>
            
            <div className="p-4 border-b border-white/10 bg-white/[0.02] flex items-center justify-between shrink-0">
               <div className="flex gap-2">
                 <Filter className="w-4 h-4 text-white/40" />
                 {revivePots.map(pot => (
                   <button
                     key={pot}
                     onClick={() => setReviveFilter(pot)}
                     className={`text-[10px] uppercase tracking-widest font-bold px-3 py-1 transition-colors ${reviveFilter === pot ? 'bg-[#f27d26] text-black' : 'text-white/40 hover:text-white hover:bg-white/5'}`}
                   >
                     {pot}
                   </button>
                 ))}
               </div>
               <button 
                 onClick={selectAllFiltered}
                 className="text-[10px] uppercase tracking-widest font-bold text-white/60 hover:text-white border border-white/10 px-3 py-1 hover:bg-white/5 transition-colors"
               >
                 Select All from Current View
               </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
               {filteredUnsold.map(p => {
                 const isSelected = selectedToRevive.has(p.id);
                 return (
                   <button 
                     key={p.id}
                     onClick={() => toggleReviveSelection(p.id)}
                     className={`flex flex-col text-left p-4 border transition-colors relative group overflow-hidden ${isSelected ? 'bg-[#f27d26]/10 border-[#f27d26]' : 'bg-white/5 border-white/10 hover:border-white/30'}`}
                   >
                     {isSelected && <div className="absolute top-0 left-0 w-1 h-full bg-[#f27d26]" />}
                     <div className="flex justify-between items-start mb-2 w-full">
                       <h4 className="font-black italic uppercase tracking-tight text-white pr-2 truncate">{p.name}</h4>
                       <span className={`text-[9px] font-bold px-1.5 py-0.5 uppercase tracking-widest ${isSelected ? 'bg-[#f27d26] text-black' : 'bg-white/10 text-white/60'}`}>{p.position}</span>
                     </div>
                     <div className="flex justify-between items-center w-full">
                       <span className="text-[10px] text-white/40 uppercase tracking-widest">{p.country}</span>
                       <span className="font-mono text-sm text-[#f27d26]">₹{p.basePrice}</span>
                     </div>
                   </button>
                 )
               })}
               {filteredUnsold.length === 0 && (
                 <div className="col-span-full py-12 text-center text-white/40 text-[10px] uppercase tracking-widest font-bold">
                   No unsold players found in this category.
                 </div>
               )}
            </div>

            <div className="p-6 border-t border-white/10 bg-white/[0.02] flex justify-between items-center shrink-0">
               <div className="text-[10px] text-white/40 uppercase tracking-widest font-bold">
                 <span className="text-white text-sm">{selectedToRevive.size}</span> Players Selected
               </div>
               <div className="flex gap-4">
                 <button 
                   onClick={() => setShowRevive(false)}
                   className="px-6 py-3 border border-white/10 hover:bg-white/5 text-white text-[10px] uppercase tracking-widest font-bold transition-colors"
                 >
                   Cancel
                 </button>
                 <button 
                   onClick={handleExecuteRevive}
                   disabled={selectedToRevive.size === 0}
                   className="px-8 py-3 bg-[#f27d26] hover:bg-[#d96a1a] text-black text-[10px] uppercase tracking-widest font-black transition-colors disabled:opacity-50 flex items-center gap-2"
                 >
                   <RefreshCw className="w-4 h-4" /> Revive Selected
                 </button>
               </div>
            </div>
          </div>
        </div>
      )}

    </motion.div>
  )
}
