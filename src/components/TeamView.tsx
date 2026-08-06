import { useState, useCallback } from 'react';
import type React from 'react';
import { useStore } from '../store';
import { motion, AnimatePresence } from 'motion/react';
import { X, Banknote, UserRound, LayoutGrid, FileText, Download, ArrowLeftRight } from 'lucide-react';
import { cn } from '../lib/utils';
import { Player, Tier, SquadLayout } from '../types';
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

function isGK(player: Player | undefined): boolean {
  return player?.position === 'GK';
}

export default function TeamView({ onClose }: { onClose: () => void }) {
  const { teams, players, config, squadLayouts, setSquadLayout } = useStore();
  const [selectedTeamId, setSelectedTeamId] = useState(teams[0]?.id);
  const [formation, setFormation] = useState<string>(
    squadLayouts[teams[0]?.id]?.formation || '4-3-3'
  );
  const [swapSource, setSwapSource] = useState<string | null>(null);
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [invalidSwapMsg, setInvalidSwapMsg] = useState('');

  const team = teams.find(t => t.id === selectedTeamId);
  const teamPlayers = players.filter(
    p => p.teamId === selectedTeamId && (p.status === 'sold' || p.status === 'retained')
  );
  const remaining = team ? team.startingPurse - team.spent : 0;

  // Get or compute layout for current team
  const getLayout = useCallback((): { starting11: string[]; bench: string[] } => {
    const saved = squadLayouts[selectedTeamId];
    if (saved && saved.formation === formation && saved.starting11.length > 0) {
      // Filter out players no longer on team
      const validIds = new Set(teamPlayers.map(p => p.id));
      const validStarting = saved.starting11.filter(id => validIds.has(id));
      const validBench = saved.bench.filter(id => validIds.has(id));
      const assigned = new Set([...validStarting, ...validBench]);
      const unassigned = teamPlayers.filter(p => !assigned.has(p.id));
      // Place unassigned players on bench
      return {
        starting11: validStarting,
        bench: [...validBench, ...unassigned.map(p => p.id)],
      };
    }

    // Auto-generate layout: place players in CORRECT positional zones
    const { def: defCount, mid: midCount, att: attCount } = parseFormation(formation);

    // Group by actual position type
    const gks = teamPlayers.filter(p => p.position === 'GK').sort((a, b) => b.rating - a.rating);
    const defenders = teamPlayers.filter(p => p.position === 'DEF').sort((a, b) => b.rating - a.rating);
    const midfielders = teamPlayers.filter(p => p.position === 'MID').sort((a, b) => b.rating - a.rating);
    const attackers = teamPlayers.filter(p => p.position === 'ATT').sort((a, b) => b.rating - a.rating);

    // Build starting XI: pick best players from each zone up to formation limit
    const startingGK = gks.slice(0, 1);
    const startingDEF = defenders.slice(0, defCount);
    const startingMID = midfielders.slice(0, midCount);
    const startingATT = attackers.slice(0, attCount);

    // Ordered: GK first, then DEF, then MID, then ATT (back to front on pitch)
    const starting11Ids = [
      ...startingGK.map(p => p.id),
      ...startingDEF.map(p => p.id),
      ...startingMID.map(p => p.id),
      ...startingATT.map(p => p.id),
    ];

    // If we don't have enough players in a zone, fill from other zones (bench overflow)
    // But never misplace — just leave slots empty rather than wrong position
    const startingSet = new Set(starting11Ids);
    const benchIds = teamPlayers.filter(p => !startingSet.has(p.id)).map(p => p.id);

    return { starting11: starting11Ids, bench: benchIds };
  }, [selectedTeamId, formation, teamPlayers, squadLayouts]);

  const layout = getLayout();
  const starting11Players = layout.starting11.map(id => teamPlayers.find(p => p.id === id)).filter(Boolean) as Player[];
  const benchPlayers = layout.bench.map(id => teamPlayers.find(p => p.id === id)).filter(Boolean) as Player[];

  // Save layout to store (auto-persisted)
  const saveLayout = useCallback((starting11: string[], bench: string[]) => {
    setSquadLayout(selectedTeamId, { formation, starting11, bench });
  }, [selectedTeamId, formation, setSquadLayout]);

  // Swap two players by ID
  const performSwap = useCallback((idA: string, idB: string) => {
    const playerA = teamPlayers.find(p => p.id === idA);
    const playerB = teamPlayers.find(p => p.id === idB);
    if (!playerA || !playerB) return;

    // GK restriction
    if ((isGK(playerA) && !isGK(playerB)) || (!isGK(playerA) && isGK(playerB))) {
      setInvalidSwapMsg('Goalkeepers can only swap with other Goalkeepers.');
      setTimeout(() => setInvalidSwapMsg(''), 2500);
      return;
    }

    const newStarting = [...layout.starting11];
    const newBench = [...layout.bench];
    const idxA_start = newStarting.indexOf(idA);
    const idxB_start = newStarting.indexOf(idB);
    const idxA_bench = newBench.indexOf(idA);
    const idxB_bench = newBench.indexOf(idB);

    // Both in starting
    if (idxA_start >= 0 && idxB_start >= 0) {
      newStarting[idxA_start] = idB;
      newStarting[idxB_start] = idA;
    }
    // A in starting, B in bench
    else if (idxA_start >= 0 && idxB_bench >= 0) {
      newStarting[idxA_start] = idB;
      newBench[idxB_bench] = idA;
    }
    // A in bench, B in starting
    else if (idxA_bench >= 0 && idxB_start >= 0) {
      newStarting[idxB_start] = idA;
      newBench[idxA_bench] = idB;
    }
    // Both in bench
    else if (idxA_bench >= 0 && idxB_bench >= 0) {
      newBench[idxA_bench] = idB;
      newBench[idxB_bench] = idA;
    }

    saveLayout(newStarting, newBench);
    setSwapSource(null);
    setDraggedId(null);
  }, [layout, teamPlayers, saveLayout]);

  // Click-swap mode handler
  const handlePlayerClick = (playerId: string) => {
    if (!swapSource) {
      setSwapSource(playerId);
    } else if (swapSource === playerId) {
      setSwapSource(null);
    } else {
      performSwap(swapSource, playerId);
    }
  };

  // Drag handlers
  const handleDragStart = (playerId: string) => {
    setDraggedId(playerId);
  };
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };
  const handleDrop = (targetId: string) => {
    if (draggedId && draggedId !== targetId) {
      performSwap(draggedId, targetId);
    }
    setDraggedId(null);
  };
  const handleDragEnd = () => {
    setDraggedId(null);
  };

  // Formation change resets layout
  const handleFormationChange = (f: string) => {
    setFormation(f);
    // Clear saved layout so it regenerates with new formation
    setSquadLayout(selectedTeamId, { formation: f, starting11: [], bench: [] });
  };

  const handleTeamChange = (id: string) => {
    setSelectedTeamId(id);
    setSwapSource(null);
    const saved = squadLayouts[id];
    if (saved?.formation) setFormation(saved.formation);
  };

  // Position groups for starting XI display — group by actual player position
  const gkSlot = starting11Players.filter(p => p.position === 'GK');
  const defSlot = starting11Players.filter(p => p.position === 'DEF');
  const midSlot = starting11Players.filter(p => p.position === 'MID');
  const attSlot = starting11Players.filter(p => p.position === 'ATT');

  // Export functions
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

  // Determine if a player is a valid swap target
  const getTargetState = (playerId: string): 'none' | 'selected' | 'valid' | 'invalid' => {
    if (swapSource === playerId) return 'selected';
    if (!swapSource && !draggedId) return 'none';
    const sourceId = swapSource || draggedId;
    if (!sourceId || sourceId === playerId) return 'none';
    const source = teamPlayers.find(p => p.id === sourceId);
    const target = teamPlayers.find(p => p.id === playerId);
    if ((isGK(source) && !isGK(target)) || (!isGK(source) && isGK(target))) return 'invalid';
    return 'valid';
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="absolute inset-0 z-50 bg-black/95 backdrop-blur-xl flex flex-col font-sans overflow-hidden">
      {/* Header */}
      <div className="h-12 px-5 flex items-center justify-between border-b border-white/10 bg-[#0a0a0a] shrink-0">
        <div className="flex items-center gap-3">
          <LayoutGrid className="w-4 h-4 text-[#f27d26]" />
          <h2 className="text-[14px] font-black tracking-widest uppercase italic">Squad View</h2>
          {swapSource && (
            <span className="text-[9px] bg-[#f27d26]/20 text-[#f27d26] px-2 py-0.5 rounded font-bold uppercase tracking-wider animate-pulse">
              Swap Mode — Select target
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <div className="flex bg-white/5 border border-white/10 rounded overflow-hidden mr-2">
            {FORMATIONS.map(f => (
              <button key={f} onClick={() => handleFormationChange(f)}
                className={cn('px-2.5 py-1 text-[9px] font-bold tracking-wider transition-colors cursor-pointer',
                  formation === f ? 'bg-white/15 text-white' : 'text-white/30 hover:text-white/60 hover:bg-white/5'
                )}>{f}</button>
            ))}
          </div>
          <div className="flex bg-white/5 border border-white/10 rounded overflow-hidden">
            {teams.map(t => (
              <button key={t.id} onClick={() => handleTeamChange(t.id)}
                className={cn('px-2.5 py-1 text-[9px] font-bold uppercase tracking-widest transition-colors cursor-pointer',
                  selectedTeamId === t.id ? 'bg-[#f27d26] text-black' : 'text-white/40 hover:text-white hover:bg-white/5'
                )}>{t.shortName}</button>
            ))}
          </div>
          <button onClick={() => { setSwapSource(null); onClose(); }} className="p-1.5 bg-white/5 border border-white/10 rounded text-white/40 hover:text-white cursor-pointer ml-1"><X className="w-4 h-4" /></button>
        </div>
      </div>

      {/* Invalid swap message */}
      <AnimatePresence>
        {invalidSwapMsg && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="absolute top-14 left-1/2 -translate-x-1/2 z-50 bg-red-950/90 border border-red-700/50 px-4 py-2 rounded text-[10px] text-red-300 font-bold uppercase tracking-wider">
            {invalidSwapMsg}
          </motion.div>
        )}
      </AnimatePresence>

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
                  <span className="text-[8px] text-white/30 uppercase tracking-widest font-bold">Drag or Click to Swap</span>
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
              {/* All Players list */}
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
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[35%] h-[18%] border-2 border-t-0 border-white/[0.04]" />
              <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[35%] h-[18%] border-2 border-b-0 border-white/[0.04]" />
            </div>
            <div className="absolute top-3 left-6 text-[9px] font-black text-white/15 uppercase tracking-[0.3em]">
              Starting XI · {formation}
            </div>
            {/* Starting XI rows */}
            <div className="relative z-10 w-full h-full flex flex-col justify-between py-4">
              <PitchRow players={attSlot} label="ATT" color="#ef4444"
                swapSource={swapSource} draggedId={draggedId} getTargetState={getTargetState}
                onPlayerClick={handlePlayerClick} onDragStart={handleDragStart}
                onDragOver={handleDragOver} onDrop={handleDrop} onDragEnd={handleDragEnd} />
              <PitchRow players={midSlot} label="MID" color="#10b981"
                swapSource={swapSource} draggedId={draggedId} getTargetState={getTargetState}
                onPlayerClick={handlePlayerClick} onDragStart={handleDragStart}
                onDragOver={handleDragOver} onDrop={handleDrop} onDragEnd={handleDragEnd} />
              <PitchRow players={defSlot} label="DEF" color="#3b82f6"
                swapSource={swapSource} draggedId={draggedId} getTargetState={getTargetState}
                onPlayerClick={handlePlayerClick} onDragStart={handleDragStart}
                onDragOver={handleDragOver} onDrop={handleDrop} onDragEnd={handleDragEnd} />
              <PitchRow players={gkSlot} label="GK" color="#f59e0b"
                swapSource={swapSource} draggedId={draggedId} getTargetState={getTargetState}
                onPlayerClick={handlePlayerClick} onDragStart={handleDragStart}
                onDragOver={handleDragOver} onDrop={handleDrop} onDragEnd={handleDragEnd} />
            </div>
          </div>

          {/* Substitute Bench */}
          <div className="h-32 bg-[#080a0e] border-t border-white/10 px-5 py-3 flex flex-col shrink-0">
            <div className="text-[8px] font-black tracking-[0.2em] uppercase text-white/30 mb-2 flex items-center justify-between">
              <span>Substitute Bench ({benchPlayers.length})</span>
              {swapSource && <span className="text-[#f27d26] animate-pulse">Click a bench player to swap</span>}
            </div>
            <div className="flex-1 overflow-x-auto hide-scrollbar flex gap-3 items-start">
              {benchPlayers.map(p => {
                const targetState = getTargetState(p.id);
                return (
                  <motion.div key={p.id}
                    draggable
                    onDragStart={() => handleDragStart(p.id)}
                    onDragOver={handleDragOver}
                    onDrop={() => handleDrop(p.id)}
                    onDragEnd={handleDragEnd}
                    onClick={() => handlePlayerClick(p.id)}
                    layout
                    transition={{ duration: 0.25 }}
                    className={cn(
                      'flex flex-col items-center shrink-0 cursor-grab active:cursor-grabbing hover:-translate-y-1 transition-all duration-200 rounded-lg p-1',
                      swapSource === p.id && 'ring-2 ring-[#f27d26] scale-105 bg-[#f27d26]/10',
                      targetState === 'valid' && 'ring-2 ring-[#f27d26]/50 bg-[#f27d26]/5',
                      targetState === 'invalid' && 'ring-2 ring-red-500/50 opacity-50',
                      draggedId === p.id && 'opacity-40 scale-95',
                    )}>
                    <div className="w-10 h-10 rounded-full border-2 bg-[#111] flex items-center justify-center overflow-hidden" style={{ borderColor: TIER_COLORS[p.tier] + '60' }}>
                      {p.image ? <img src={p.image} alt="" className="w-full h-full object-cover" /> : <span className="text-[9px] font-black text-white/40">{p.name.substring(0, 2)}</span>}
                    </div>
                    <div className="mt-1 text-center">
                      <div className="text-[7px] font-bold truncate max-w-[50px] text-white/60">{p.name.split(' ').pop()}</div>
                      <div className="text-[7px] font-mono text-white/30">{p.position}</div>
                    </div>
                    {swapSource === p.id && <ArrowLeftRight className="w-3 h-3 text-[#f27d26] mt-0.5" />}
                  </motion.div>
                );
              })}
              {benchPlayers.length === 0 && (
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

interface PitchRowProps {
  players: Player[];
  label: string;
  color: string;
  swapSource: string | null;
  draggedId: string | null;
  getTargetState: (id: string) => 'none' | 'selected' | 'valid' | 'invalid';
  onPlayerClick: (id: string) => void;
  onDragStart: (id: string) => void;
  onDragOver: (e: React.DragEvent) => void;
  onDrop: (id: string) => void;
  onDragEnd: () => void;
}

function PitchRow({ players, label, color, swapSource, draggedId, getTargetState, onPlayerClick, onDragStart, onDragOver, onDrop, onDragEnd }: PitchRowProps) {
  return (
    <div className="flex justify-center items-center gap-5 relative min-h-[60px]">
      <div className="absolute left-3 text-[8px] font-black uppercase tracking-[0.25em] text-white/8">{label}</div>
      <AnimatePresence mode="popLayout">
        {players.map((p, i) => {
          const targetState = getTargetState(p.id);
          return (
            <motion.div key={p.id}
              draggable
              onDragStart={() => onDragStart(p.id)}
              onDragOver={onDragOver}
              onDrop={() => onDrop(p.id)}
              onDragEnd={onDragEnd}
              onClick={() => onPlayerClick(p.id)}
              layout
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.25, delay: i * 0.03 }}
              className={cn(
                'group relative cursor-grab active:cursor-grabbing hover:scale-110 transition-all duration-200 z-10 rounded-full',
                swapSource === p.id && 'scale-115 ring-3 ring-[#f27d26] shadow-[0_0_20px_rgba(242,125,38,0.4)]',
                targetState === 'valid' && 'ring-2 ring-[#f27d26]/60 shadow-[0_0_15px_rgba(242,125,38,0.2)]',
                targetState === 'invalid' && 'ring-2 ring-red-500/60 shadow-[0_0_15px_rgba(239,68,68,0.2)]',
                draggedId === p.id && 'opacity-40 scale-95',
              )}>
              <div className="w-11 h-11 rounded-full border-2 flex items-center justify-center bg-[#111] overflow-hidden shadow-lg"
                style={{ borderColor: swapSource === p.id ? '#f27d26' : color, boxShadow: `0 0 12px ${color}20` }}>
                {p.image ? <img src={p.image} alt="" className="w-full h-full object-cover" /> : <span className="text-[9px] font-black text-white/60">{p.name.substring(0, 2)}</span>}
              </div>
              {/* Swap icon indicator */}
              {swapSource === p.id && (
                <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[#f27d26] flex items-center justify-center">
                  <ArrowLeftRight className="w-2.5 h-2.5 text-black" />
                </div>
              )}
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
                <div className="text-[7px] text-white/20 mt-1 italic">Click or drag to swap</div>
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
