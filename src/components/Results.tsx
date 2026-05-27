import { useStore } from '../store';
import { motion } from 'motion/react';
import { useState } from 'react';
import Papa from 'papaparse';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Download, FileText, Trophy, ArrowLeft, RefreshCw, X, Filter } from 'lucide-react';
import { Tier } from '../types';

const TIER_COLORS: Record<Tier, string> = {
  S: '#fbbf24', A: '#a78bfa', B: '#60a5fa', C: '#34d399', D: '#9ca3af',
};

export default function Results() {
  const { teams, players, config, setStep, revivePlayers } = useStore();
  const [showRevive, setShowRevive] = useState(false);
  const [selectedToRevive, setSelectedToRevive] = useState<Set<string>>(new Set());
  const [reviveFilter, setReviveFilter] = useState('ALL');

  const unsoldPlayers = players.filter(p => p.status === 'unsold');
  const filteredUnsold = unsoldPlayers.filter(p => reviveFilter === 'ALL' || p.position === reviveFilter);

  const handleExportCSV = () => {
    const csv = Papa.unparse(
      players.filter(p => p.status === 'sold' || p.status === 'retained').map(p => {
        const team = teams.find(t => t.id === p.teamId);
        return { Team: team?.name, Player: p.name, Position: p.position, Tier: p.tier, Rating: p.rating, Status: p.status, Price: p.soldPrice };
      })
    );
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'auction_results.csv';
    link.click();
  };

  const handleExportPDF = () => {
    const doc = new jsPDF();
    const pw = doc.internal.pageSize.width;
    const ph = doc.internal.pageSize.height;

    // ═══ COVER PAGE ═══
    // Dark background
    doc.setFillColor(10, 10, 15);
    doc.rect(0, 0, pw, ph, 'F');

    // Accent stripe
    doc.setFillColor(242, 125, 38);
    doc.rect(0, 0, pw, 4, 'F');
    doc.rect(0, ph - 4, pw, 4, 'F');

    // Title
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(32);
    doc.setFont('helvetica', 'bold');
    doc.text('FOOTBALL MEGA AUCTION', pw / 2, 60, { align: 'center' });

    doc.setFontSize(12);
    doc.setTextColor(242, 125, 38);
    doc.text('OFFICIAL RESULTS DOCUMENT', pw / 2, 72, { align: 'center' });

    // Summary stats box
    const totalSpent = teams.reduce((s, t) => s + t.spent, 0);
    const totalPlayers = players.filter(p => p.status === 'sold' || p.status === 'retained').length;
    const avgPrice = totalPlayers > 0 ? (totalSpent / totalPlayers).toFixed(1) : '0';
    const mostExpensive = players.filter(p => p.soldPrice).sort((a, b) => (b.soldPrice || 0) - (a.soldPrice || 0))[0];

    doc.setFillColor(20, 20, 30);
    doc.roundedRect(30, 90, pw - 60, 50, 3, 3, 'F');
    doc.setDrawColor(242, 125, 38);
    doc.setLineWidth(0.5);
    doc.roundedRect(30, 90, pw - 60, 50, 3, 3, 'S');

    doc.setFontSize(9);
    doc.setTextColor(150, 150, 160);
    doc.text('TEAMS', 50, 105);
    doc.text('PLAYERS SOLD', 95, 105);
    doc.text('TOTAL SPENT', 145, 105);
    doc.text('AVG PRICE', 50, 125);
    doc.text('MOST EXPENSIVE', 95, 125);

    doc.setFontSize(16);
    doc.setTextColor(255, 255, 255);
    doc.text(`${teams.length}`, 50, 115);
    doc.text(`${totalPlayers}`, 95, 115);
    doc.text(`${totalSpent} Cr`, 145, 115);
    doc.setFontSize(14);
    doc.text(`${avgPrice} Cr`, 50, 135);
    doc.setTextColor(242, 125, 38);
    doc.text(mostExpensive ? `${mostExpensive.name} (${mostExpensive.soldPrice} Cr)` : 'N/A', 95, 135);

    // Team list preview
    doc.setTextColor(100, 100, 110);
    doc.setFontSize(9);
    doc.text('PARTICIPATING FRANCHISES', pw / 2, 160, { align: 'center' });

    teams.forEach((team, i) => {
      const col = i % 2;
      const row = Math.floor(i / 2);
      const x = col === 0 ? 40 : pw / 2 + 10;
      const yPos = 170 + row * 12;
      doc.setFillColor(25, 25, 35);
      doc.roundedRect(x - 2, yPos - 5, pw / 2 - 30, 10, 1, 1, 'F');
      doc.setTextColor(200, 200, 210);
      doc.setFontSize(9);
      doc.text(`${team.name}`, x + 4, yPos + 1);
      doc.setTextColor(242, 125, 38);
      doc.text(`${team.spent} Cr`, x + pw / 2 - 55, yPos + 1);
    });

    // Footer
    doc.setTextColor(60, 60, 70);
    doc.setFontSize(8);
    doc.text(`Generated: ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`, pw / 2, ph - 15, { align: 'center' });

    // ═══ TEAM PAGES ═══
    [...teams].sort((a, b) => b.spent - a.spent).forEach((team, tIdx) => {
      doc.addPage();
      const tp = players.filter(p => p.teamId === team.id && (p.status === 'sold' || p.status === 'retained'));
      const rem = team.startingPurse - team.spent;

      // Page background
      doc.setFillColor(10, 10, 15);
      doc.rect(0, 0, pw, ph, 'F');

      // Top accent bar with team color
      const rgb = hexToRgb(team.primaryColor);
      doc.setFillColor(rgb.r, rgb.g, rgb.b);
      doc.rect(0, 0, pw, 3, 'F');

      // Team header
      doc.setFillColor(15, 15, 25);
      doc.rect(0, 3, pw, 35, 'F');

      doc.setTextColor(255, 255, 255);
      doc.setFontSize(18);
      doc.setFont('helvetica', 'bold');
      doc.text(team.name.toUpperCase(), 14, 22);

      doc.setFontSize(9);
      doc.setTextColor(rgb.r, rgb.g, rgb.b);
      doc.text(`${team.shortName}`, 14, 30);

      // Stats row
      doc.setTextColor(150, 150, 160);
      doc.setFontSize(8);
      doc.text(`PURSE: ${team.startingPurse} Cr`, pw - 14, 16, { align: 'right' });
      doc.text(`SPENT: ${team.spent} Cr`, pw - 14, 23, { align: 'right' });
      doc.setTextColor(rgb.r, rgb.g, rgb.b);
      doc.text(`REMAINING: ${rem} Cr`, pw - 14, 30, { align: 'right' });

      // Squad table
      autoTable(doc, {
        startY: 45,
        head: [['#', 'Player', 'Position', 'Tier', 'Rating', 'Status', 'Price (Cr)']],
        body: tp.map((p, i) => [
          (i + 1).toString(),
          p.name,
          p.position,
          p.tier,
          p.rating.toString(),
          p.status.toUpperCase(),
          `${p.soldPrice}`,
        ]),
        theme: 'plain',
        headStyles: {
          fillColor: [rgb.r, rgb.g, rgb.b],
          textColor: [0, 0, 0],
          fontStyle: 'bold',
          fontSize: 8,
          cellPadding: 3,
        },
        bodyStyles: {
          textColor: [200, 200, 210],
          fontSize: 8,
          cellPadding: 2.5,
        },
        alternateRowStyles: {
          fillColor: [18, 18, 28],
        },
        styles: {
          fillColor: [12, 12, 20],
          lineColor: [30, 30, 45],
          lineWidth: 0.1,
        },
        columnStyles: {
          0: { cellWidth: 10, halign: 'center' },
          2: { cellWidth: 22, halign: 'center' },
          3: { cellWidth: 15, halign: 'center' },
          4: { cellWidth: 18, halign: 'center' },
          5: { cellWidth: 22, halign: 'center' },
          6: { cellWidth: 22, halign: 'right', fontStyle: 'bold' },
        },
        margin: { left: 14, right: 14 },
      });

      // Position breakdown footer
      // @ts-ignore
      const finalY = doc.lastAutoTable.finalY + 10;
      if (finalY < ph - 30) {
        doc.setFillColor(15, 15, 25);
        doc.roundedRect(14, finalY, pw - 28, 18, 2, 2, 'F');
        doc.setFontSize(7);
        doc.setTextColor(100, 100, 110);
        const gkC = tp.filter(p => p.position === 'GK').length;
        const defC = tp.filter(p => p.position === 'DEF').length;
        const midC = tp.filter(p => p.position === 'MID').length;
        const attC = tp.filter(p => p.position === 'ATT').length;
        doc.text(`GK: ${gkC}  |  DEF: ${defC}  |  MID: ${midC}  |  ATT: ${attC}  |  TOTAL: ${tp.length}/${config.maxPlayers}`, pw / 2, finalY + 10, { align: 'center' });
      }

      // Page number
      doc.setTextColor(50, 50, 60);
      doc.setFontSize(7);
      doc.text(`Page ${tIdx + 2}`, pw - 14, ph - 8, { align: 'right' });
    });

    // ═══ UNSOLD PLAYERS PAGE ═══
    if (unsoldPlayers.length > 0) {
      doc.addPage();
      doc.setFillColor(10, 10, 15);
      doc.rect(0, 0, pw, ph, 'F');
      doc.setFillColor(239, 68, 68);
      doc.rect(0, 0, pw, 3, 'F');

      doc.setTextColor(255, 255, 255);
      doc.setFontSize(16);
      doc.text('UNSOLD PLAYERS', 14, 20);
      doc.setFontSize(9);
      doc.setTextColor(239, 68, 68);
      doc.text(`${unsoldPlayers.length} players remaining`, 14, 28);

      autoTable(doc, {
        startY: 35,
        head: [['#', 'Player', 'Position', 'Tier', 'Rating', 'Base Price (Cr)']],
        body: unsoldPlayers.map((p, i) => [
          (i + 1).toString(), p.name, p.position, p.tier, p.rating.toString(), `${p.basePrice}`,
        ]),
        theme: 'plain',
        headStyles: { fillColor: [60, 20, 20], textColor: [239, 68, 68], fontStyle: 'bold', fontSize: 8, cellPadding: 3 },
        bodyStyles: { textColor: [180, 180, 190], fontSize: 8, cellPadding: 2.5 },
        alternateRowStyles: { fillColor: [18, 18, 28] },
        styles: { fillColor: [12, 12, 20], lineColor: [30, 30, 45], lineWidth: 0.1 },
        margin: { left: 14, right: 14 },
      });
    }

    doc.save('Football_Mega_Auction_Results.pdf');
  };

  // Helper to convert hex color to RGB
  function hexToRgb(hex: string): { r: number; g: number; b: number } {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? { r: parseInt(result[1], 16), g: parseInt(result[2], 16), b: parseInt(result[3], 16) } : { r: 242, g: 125, b: 38 };
  }

  const handleExecuteRevive = () => {
    if (selectedToRevive.size === 0) return;
    revivePlayers(Array.from(selectedToRevive));
    setShowRevive(false);
    setSelectedToRevive(new Set());
    setStep('auction');
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
      className="max-w-6xl mx-auto pt-16 px-6 pb-20 font-sans text-white text-center">
      <div className="mb-16">
        <div className="inline-flex items-center justify-center w-20 h-20 border border-white/10 bg-[#f27d26]/10 text-[#f27d26] mb-6 rounded-full">
          <Trophy className="w-10 h-10" />
        </div>
        <div className="inline-block bg-[#f27d26] px-3 py-1 text-black font-black text-xs uppercase tracking-widest mb-4 mx-auto block w-max">Final</div>
        <h1 className="text-5xl font-black tracking-tight uppercase italic text-transparent bg-clip-text bg-gradient-to-b from-white to-white/40">Auction Complete</h1>
      </div>

      <div className="flex justify-center gap-6 mb-16">
        <button onClick={handleExportCSV} className="px-8 py-6 bg-white/5 border border-white/10 hover:border-[#f27d26] flex flex-col items-center gap-3 transition-colors group w-56 cursor-pointer">
          <FileText className="w-8 h-8 text-white/20 group-hover:text-[#f27d26] transition-colors" />
          <div className="font-black italic uppercase text-sm">Export CSV</div>
        </button>
        <button onClick={handleExportPDF} className="px-8 py-6 bg-white/5 border border-white/10 hover:border-[#f27d26] flex flex-col items-center gap-3 transition-colors group w-56 cursor-pointer">
          <Download className="w-8 h-8 text-white/20 group-hover:text-[#f27d26] transition-colors" />
          <div className="font-black italic uppercase text-sm">Export PDF</div>
        </button>
      </div>

      {/* Team Results Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 text-left mb-16">
        {[...teams].sort((a, b) => b.spent - a.spent).map((team, idx) => {
          const tp = players.filter(p => p.teamId === team.id && (p.status === 'sold' || p.status === 'retained'));
          const remaining = team.startingPurse - team.spent;
          return (
            <div key={team.id} className={`border p-5 relative overflow-hidden ${idx === 0 ? 'bg-[#f27d26]/5 border-[#f27d26]/30' : 'bg-white/[0.02] border-white/10'}`}>
              <div className="absolute top-0 left-0 w-1 h-full" style={{ backgroundColor: team.primaryColor }} />
              <div className="flex justify-between items-start mb-3">
                <h3 className="font-black text-lg italic uppercase tracking-tighter truncate pr-2">{team.name}</h3>
                <div className="text-right shrink-0">
                  <div className="font-mono font-bold text-[#f27d26]">{team.spent} Cr</div>
                  <div className="text-[8px] text-white/30 uppercase">spent</div>
                </div>
              </div>
              <div className="flex gap-4 text-[10px] text-white/40 uppercase tracking-widest mb-3">
                <span>Purse: <span className="text-white font-mono">{remaining}</span></span>
                <span>Squad: <span className="text-white font-mono">{tp.length}</span></span>
              </div>
              <div className="space-y-1 max-h-32 overflow-y-auto hide-scrollbar">
                {tp.slice(0, 6).map(p => (
                  <div key={p.id} className="flex justify-between items-center text-[10px]">
                    <div className="flex items-center gap-1.5">
                      <span className="w-4 text-center font-black" style={{ color: TIER_COLORS[p.tier] }}>{p.tier}</span>
                      <span className="truncate max-w-[100px]">{p.name}</span>
                    </div>
                    <span className="font-mono text-white/50">{p.soldPrice}</span>
                  </div>
                ))}
                {tp.length > 6 && <div className="text-[9px] text-white/20 italic">+{tp.length - 6} more</div>}
              </div>
            </div>
          );
        })}
      </div>

      {/* Actions */}
      <div className="flex justify-center gap-4">
        <button onClick={() => setStep('auction')} className="text-[10px] uppercase font-bold tracking-widest text-white/40 hover:text-white flex items-center gap-2 px-6 py-3 border border-white/10 hover:bg-white/5 transition-colors cursor-pointer">
          <ArrowLeft className="w-4 h-4" /> Back to Auction
        </button>
        {unsoldPlayers.length > 0 && (
          <button onClick={() => setShowRevive(true)} className="text-[10px] uppercase font-bold tracking-widest text-[#f27d26] px-6 py-3 border border-[#f27d26]/30 hover:border-[#f27d26] hover:bg-[#f27d26]/10 transition-colors flex items-center gap-2 cursor-pointer">
            <RefreshCw className="w-4 h-4" /> Revive Unsold ({unsoldPlayers.length})
          </button>
        )}
        <button onClick={() => { if (confirm('Start a completely new auction? All current data will be lost.')) setStep('landing'); }} className="text-[10px] uppercase font-bold tracking-widest text-emerald-400 px-6 py-3 border border-emerald-500/30 hover:border-emerald-500 hover:bg-emerald-500/10 transition-colors flex items-center gap-2 cursor-pointer">
          <Trophy className="w-4 h-4" /> New Auction
        </button>
      </div>

      {/* Revive Modal */}
      {showRevive && (
        <div className="fixed inset-0 z-50 flex justify-center items-center bg-black/90 backdrop-blur-md p-6">
          <div className="bg-[#111] border border-white/10 w-full max-w-4xl flex flex-col max-h-[85vh]">
            <div className="p-5 border-b border-white/10 flex justify-between items-center shrink-0">
              <div>
                <h2 className="text-xl font-black italic uppercase tracking-widest">Revive Unsold</h2>
                <p className="text-[9px] text-white/40 uppercase tracking-widest mt-1">Select players to return to auction pool</p>
              </div>
              <button onClick={() => setShowRevive(false)} className="text-white/40 hover:text-white cursor-pointer"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-3 border-b border-white/5 flex items-center gap-2 shrink-0">
              <Filter className="w-3.5 h-3.5 text-white/30" />
              {['ALL', 'GK', 'DEF', 'MID', 'ATT'].map(f => (
                <button key={f} onClick={() => setReviveFilter(f)}
                  className={`text-[9px] uppercase tracking-widest font-bold px-3 py-1 transition-colors cursor-pointer ${reviveFilter === f ? 'bg-[#f27d26] text-black' : 'text-white/40 hover:text-white'}`}>{f}</button>
              ))}
            </div>
            <div className="flex-1 overflow-y-auto p-4 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
              {filteredUnsold.map(p => {
                const sel = selectedToRevive.has(p.id);
                return (
                  <button key={p.id} onClick={() => { const s = new Set(selectedToRevive); sel ? s.delete(p.id) : s.add(p.id); setSelectedToRevive(s); }}
                    className={`text-left p-3 border transition-colors cursor-pointer ${sel ? 'bg-[#f27d26]/10 border-[#f27d26]' : 'bg-white/[0.03] border-white/5 hover:border-white/20'}`}>
                    <div className="text-[11px] font-bold truncate">{p.name}</div>
                    <div className="text-[9px] text-white/30">{p.position} • {p.tier} • {p.rating}</div>
                  </button>
                );
              })}
            </div>
            <div className="p-4 border-t border-white/10 flex justify-between items-center shrink-0">
              <span className="text-[10px] text-white/40 uppercase tracking-widest"><span className="text-white font-bold">{selectedToRevive.size}</span> selected</span>
              <button onClick={handleExecuteRevive} disabled={selectedToRevive.size === 0}
                className="px-6 py-2.5 bg-[#f27d26] hover:bg-[#d96a1a] text-black font-black text-[10px] uppercase tracking-widest disabled:opacity-40 cursor-pointer flex items-center gap-2">
                <RefreshCw className="w-3.5 h-3.5" /> Revive
              </button>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
}
