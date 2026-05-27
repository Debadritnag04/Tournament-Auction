import { useState } from 'react';
import { useStore } from '../store';
import { motion, AnimatePresence } from 'motion/react';
import { X, Banknote, UserRound, LayoutGrid, FileText, Download } from 'lucide-react';
import { cn } from '../lib/utils';
import { Player, Tier } from '../types';
import Papa from 'papaparse';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const TIER_COLORS: Record<Tier, string> = {
  S: '#fbbf24', A: '#a78bfa', B: '#60a5fa', C: '#34d399', D: '#9ca3af',
};

const FORMATIONS = ['4-3-3', '4-4-2', '3-5-2', '5-3-2', '3-4-3'] as const;

function parseFormation(f: string): { def: number; mid: number; att: number } {
  const [d, m, a] = f.split('-').map(Number);
  return { def: d, mid: m, att: a };
}

export default function TeamView({ onClose }: { onClose: () => void }) {
  const { teams, players, config } = useStore();
  const [selectedTeamId, setSelectedTeamId] = useState(teams[0]?.id);
  const [formation, setFormation] = useState<string>('4-3-3');

  const team = teams.find(t => t.id === selectedTeamId);
  const teamPlayers = players.filter(p => p.teamId === selectedTeamId && (p.status === 'sold' || p.status === 'retained'));
  const remaining = team ? team.startingPurse - team.spent : 0;

  // Sort by rating within each position
  const gkAll = teamPlayers.filter(p => p.position === 'GK').sort((a, b) => b.rating - a.rating);
  const defAll = teamPlayers.filter(p => p.position === 'DEF').sort((a, b) => b.rating - a.rating);
  const midAll = teamPlayers.filter(p => p.position === 'MID').sort((a, b) => b.rating - a.rating);
  const attAll = teamPlayers.filter(p => p.position === 'ATT').sort((a, b) => b.rating - a.rating);

  // Formation-based starting XI
  const { def: defCount, mid: midCount, att: attCount } = parseFormation(formation);
  const startingGK = gkAll.slice(0, 1);
  const startingDef = defAll.slice(0, defCount);
  const startingMid = midAll.slice(0, midCount);
  const startingAtt = attAll.slice(0, attCount);

  // Bench = everyone not in starting XI
  const startingIds = new Set([...startingGK, ...startingDef, ...startingMid, ...startingAtt].map(p => p.id));
  const bench = teamPlayers.filter(p => !startingIds.has(p.id)).sort((a, b) => b.rating - a.rating);

  const handleExportCSV = () => {
    if (!team) return;
    const csv = Papa.unparse(teamPlayers.map(p => ({
      Player: p.name, Position: p.position, Tier: p.tier, Country: p.country,
      Rating: p.rating, Acquisition: p.status, Price: p.soldPrice,
    })));
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${team.name.replace(/\s+/g, '_')}_squad.csv`;
    link.click();
  };

  const handleExportPDF = () => {
    if (!team) return;
    const doc = new jsPDF();
    doc.setFontSize(20);
    doc.text(`${team.name} - Squad`, doc.internal.pageSize.width / 2, 20, { align: 'center' });
    doc.setFontSize(11);
    doc.text(`Spent: ${team.spent} Cr | Remaining: ${remaining} Cr | Formation: ${formation}`, doc.internal.pageSize.width / 2, 28, { align: 'center' });
    autoTable(doc, {
      startY: 35,
      head: [['Player', 'Pos', 'Tier', 'Rating', 'Status', 'Price']],
      body: teamPlayers.map(p => [p.name, p.position, p.tier, p.rating, p.status, `${p.soldPrice} Cr`]),
      theme: 'grid',
      headStyles: { fillColor: [242, 125, 38] },
    });
    doc.save(`${team.name.replace(/\s+/g, '_')}_squad.pdf`);
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="absolute inset-0 z-50 bg-black/95 backdrop-blur-xl flex flex-col font-sans overflow-hidden">
      {/* Header */}
      <div className="h-12 px-5 flex items-center justify-between border-b border-white/10 bg-[#0a0a0a] shrink-0">
        <div className="flex items-center gap-3">
          <LayoutGrid className="w-4 h-4 text-[#f27d26]" />
          <h2 className="text-[14px] font-black tracking-widest uppercase italic">Squad View</h2>
          <span className="text-[9px] text-white/30 font-mono uppercase">Formation: {formation}</span>
        </div>
        <div className="flex items-center gap-2">
          {/* Formation Toggle */}
          <div className="flex bg-white/5 border border-white/10 rounded overflow-hidden mr-2">
            {FORMATIONS.map(f => (
              <button key={f} onClick={() => setFormation(f)}
                className={cn('px-2.5 py-1 text-[9px] font-bold tracking-wider transition-colors cursor-pointer',
                  formation === f ? 'bg-white/15 text-white' : 'text-white/30 hover:text-white/60 hover:bg-white/5'
                )}>{f}</button>
            ))}
          </div>
          {/* Team selector */}
          <div className="flex bg-white/5 border border-white/10 rounded overflow-hidden">
            {teams.map(t => (
              <button key={t.id} onClick={() => setSelectedTeamId(t.id)}
                className={cn('px-2.5 py-1 text-[9px] font-bold uppercase tracking-widest transition-colors cursor-pointer',
                  selectedTeamId === t.id ? 'bg-[#f27d26] text-black' : 'text-white/40 hover:text-white hover:bg-white/5'
                )}>{t.shortName}</button>
            ))}
          </div>
          <button onClick={onClose} className="p-1.5 bg-white/5 border border-white/10 rounded text-white/40 hover:text-white cursor-pointer ml-1"><X className="w-4 h-4" /></button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex overflow-hidden min-h-0">
        {/* Left Stats Panel */}
        <div className="w-64 border-r border-white/10 bg-[#0a0a0a] p-4 flex flex-col overflow-y-auto hide-scrollbar shrink-0">
          {team && (
            <>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full border-2 overflow-hidden shrink-0" style={{ borderColor: team.secondaryColor }}>
                  {team.logo ? <img src={team.logo} alt="" className="w-full h-full object-cover" /> :
                    <div className="w-full h-full flex items-center justify-center" style={{ backgroundColor: team.primaryColor }}>
                      <span className="text-[9px] font-black text-white/80">{team.shortName}</span>
                    </div>}
                </div>
                <div className="min-w-0">
                  <h1 className="text-[14px] font-black uppercase tracking-tighter truncate">{team.name}</h1>
                  <span className="text-[8px] text-white/30 uppercase tracking-widest font-bold">Analytics</span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 mb-4">
                <div className="bg-white/5 border border-white/5 p-2.5 rounded">
                  <div className="flex items-center gap-1 mb-0.5 text-white/40"><Banknote className="w-3 h-3" /><span className="text-[8px] uppercase tracking-widest font-bold">Purse</span></div>
                  <div className="text-[14px] font-mono font-bold text-[#f27d26]">{remaining} Cr</div>
                </div>
                <div className="bg-white/5 border border-white/5 p-2.5 rounded">
                  <div className="flex items-center gap-1 mb-0.5 text-white/40"><UserRound className="w-3 h-3" /><span className="text-[8px] uppercase tracking-widest font-bold">Squad</span></div>
                  <div className="text-[14px] font-mono font-bold">{teamPlayers.length}<span className="text-[9px] text-white/40">/{config.maxPlayers}</span></div>
                </div>
              </div>
              <div className="flex gap-2 mb-4">
                <button onClick={handleExportCSV} className="flex-1 py-1.5 bg-white/5 hover:bg-[#f27d26] hover:text-black border border-white/10 text-[8px] font-bold uppercase tracking-widest transition-colors cursor-pointer flex items-center justify-center gap-1">
                  <FileText className="w-3 h-3" /> CSV
                </button>
                <button onClick={handleExportPDF} className="flex-1 py-1.5 bg-white/5 hover:bg-[#f27d26] hover:text-black border border-white/10 text-[8px] font-bold uppercase tracking-widest transition-colors cursor-pointer flex items-center justify-center gap-1">
                  <Download className="w-3 h-3" /> PDF
                </button>
              </div>
              {/* Position breakdown */}
              <div className="text-[8px] uppercase tracking-widest text-white/25 font-bold mb-2">Position Breakdown</div>
              <div className="grid grid-cols-4 gap-1 mb-4">
                {[{ label: 'GK', count: gkAll.length, color: '#f59e0b' }, { label: 'DEF', count: defAll.length, color: '#3b82f6' }, { label: 'MID', count: midAll.length, color: '#10b981' }, { label: 'ATT', count: attAll.length, color: '#ef4444' }].map(({ label, count, color }) => (
                  <div key={label} className="bg-white/[0.03] border border-white/5 p-1.5 rounded text-center">
                    <div className="text-[8px] font-bold" style={{ color }}>{label}</div>
                    <div className="text-[12px] font-black">{count}</div>
                  </div>
                ))}
              </div>
              {/* Full player list */}
              <div className="text-[8px] uppercase tracking-widest text-white/25 font-bold mb-2">All Players</div>
              <div className="space-y-1">
                {teamPlayers.map(p => (
                  <div key={p.id} className="bg-white/[0.02] p-1.5 flex justify-between items-center border-l-2 rounded-sm" style={{ borderLeftColor: team.primaryColor }}>
                    <div className="min-w-0">
                      <div className="text-[10px] font-bold truncate max-w-[110px]">{p.name}</div>
                      <div className="flex items-center gap-1">
                        <span className="text-[7px] font-black px-0.5 rounded-sm" style={{ backgroundColor: TIER_COLORS[p.tier] + '25', color: TIER_COLORS[p.tier] }}>{p.tier}</span>
                        <span className="text-[7px] text-white/25">{p.position} • {p.rating}</span>
                      </div>
                    </div>
                    <span className="text-[9px] font-mono font-bold text-white/50 shrink-0">{p.soldPrice}</span>
                  </div>
                ))}
                {teamPlayers.length === 0 && <div className="text-[9px] text-white/15 text-center py-4 italic">No players yet</div>}
              </div>
            </>
          )}
        </div>

        {/* Pitch View + Bench */}
        <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
          {/* Pitch */}
          <div className="flex-1 bg-[#0d1117] relative flex items-center justify-center p-6 min-h-0">
            {/* Pitch markings */}
            <div className="absolute inset-6 border-2 border-white/[0.06] rounded-lg overflow-hidden pointer-events-none">
              <div className="absolute top-1/2 left-0 right-0 h-px bg-white/[0.06]" />
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-24 h-24 rounded-full border-2 border-white/[0.06]" />
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-white/10" />
              {/* Penalty areas */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[35%] h-[18%] border-2 border-t-0 border-white/[0.04]" />
              <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[35%] h-[18%] border-2 border-b-0 border-white/[0.04]" />
            </div>

            {/* Formation label */}
            <div className="absolute top-3 left-6 text-[9px] font-black text-white/15 uppercase tracking-[0.3em]">
              Starting XI · {formation}
            </div>

            {/* Starting XI rows */}
            <div className="relative z-10 w-full h-full flex flex-col justify-between py-4">
              <PitchRow players={startingAtt} label="ATT" color="#ef4444" maxSlots={attCount} />
              <PitchRow players={startingMid} label="MID" color="#10b981" maxSlots={midCount} />
              <PitchRow players={startingDef} label="DEF" color="#3b82f6" maxSlots={defCount} />
              <PitchRow players={startingGK} label="GK" color="#f59e0b" maxSlots={1} />
            </div>
          </div>

          {/* Substitute Bench */}
          <div className="h-28 bg-[#080a0e] border-t border-white/10 px-5 py-3 flex flex-col shrink-0">
            <div className="text-[8px] font-black tracking-[0.2em] uppercase text-white/30 mb-2 flex items-center justify-between">
              <span>Substitute Bench ({bench.length})</span>
              <span className="text-white/15 font-mono">{teamPlayers.length - startingIds.size} on bench</span>
            </div>
            <div className="flex-1 overflow-x-auto hide-scrollbar flex gap-3 items-start">
              <AnimatePresence>
                {bench.map(p => (
                  <motion.div key={p.id} initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}
                    className="flex flex-col items-center shrink-0 group cursor-crosshair hover:-translate-y-1 transition-transform">
                    <div className="w-10 h-10 rounded-full border-2 bg-[#111] flex items-center justify-center overflow-hidden" style={{ borderColor: TIER_COLORS[p.tier] + '60' }}>
                      {p.image ? <img src={p.image} alt="" className="w-full h-full object-cover" /> : <span className="text-[9px] font-black text-white/40">{p.name.substring(0, 2)}</span>}
                    </div>
                    <div className="mt-1 text-center">
                      <div className="text-[7px] font-bold truncate max-w-[50px] text-white/60">{p.name.split(' ').pop()}</div>
                      <div className="text-[7px] font-mono text-white/30">{p.position}</div>
                    </div>
                    {/* Hover tooltip */}
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 w-32 bg-black/90 border border-white/10 rounded p-1.5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 hidden group-hover:block">
                      <div className="text-[9px] font-bold truncate">{p.name}</div>
                      <div className="text-[7px] text-white/40">{p.position} • {p.tier} • {p.rating} OVR • {p.soldPrice} Cr</div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
              {bench.length === 0 && (
                <div className="flex items-center h-full">
                  <span className="text-[9px] text-white/15 italic uppercase tracking-widest">No substitutes</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function PitchRow({ players, label, color, maxSlots }: { players: Player[]; label: string; color: string; maxSlots: number }) {
  const placeholders = Math.max(0, maxSlots - players.length);

  return (
    <div className="flex justify-center items-center gap-5 relative min-h-[60px]">
      <div className="absolute left-3 text-[8px] font-black uppercase tracking-[0.25em] text-white/8">{label}</div>
      <AnimatePresence mode="popLayout">
        {players.map((p, i) => (
          <motion.div key={p.id}
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.04 }}
            className="group relative cursor-crosshair hover:scale-110 transition-transform z-10">
            <div className="w-11 h-11 rounded-full border-2 flex items-center justify-center bg-[#111] overflow-hidden shadow-lg" style={{ borderColor: color, boxShadow: `0 0 12px ${color}20` }}>
              {p.image ? <img src={p.image} alt="" className="w-full h-full object-cover" /> : <span className="text-[9px] font-black text-white/60">{p.name.substring(0, 2)}</span>}
            </div>
            {/* Name below */}
            <div className="absolute top-full left-1/2 -translate-x-1/2 mt-0.5 text-center w-16">
              <div className="text-[7px] font-bold truncate text-white/70">{p.name.split(' ').pop()}</div>
              <div className="text-[7px] font-mono" style={{ color }}>{p.soldPrice}</div>
            </div>
            {/* Hover tooltip */}
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-36 bg-black/95 border border-white/10 rounded p-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
              <div className="text-[10px] font-bold truncate">{p.name}</div>
              <div className="text-[8px] text-white/40">{p.position} • {p.tier} Tier • {p.rating} OVR</div>
              <div className="text-[9px] font-mono mt-0.5" style={{ color }}>{p.soldPrice} Cr ({p.status})</div>
            </div>
          </motion.div>
        ))}
        {/* Empty slot placeholders */}
        {Array.from({ length: placeholders }).map((_, i) => (
          <motion.div key={`empty-${i}`} layout
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="w-11 h-11 rounded-full border-2 border-dashed border-white/8 flex items-center justify-center">
            <div className="w-2 h-2 rounded-full bg-white/5" />
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
