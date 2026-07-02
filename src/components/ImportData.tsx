import React, { useState } from 'react';
import { useStore } from '../store';
import Papa from 'papaparse';
import { Upload, CheckCircle2, ArrowRight, ArrowLeft } from 'lucide-react';
import { motion } from 'motion/react';
import { loadDemoPlayers } from '../lib/demoData';
import { Player, Position, Tier } from '../types';

function normPos(pos: string): Position {
  const p = pos.trim().toUpperCase();
  if (p === 'GK') return 'GK';
  if (['CB','LB','RB','LWB','RWB'].includes(p)) return 'DEF';
  if (['CM','CDM','CAM','LM','RM'].includes(p)) return 'MID';
  if (['ST','CF','SS','LW','RW'].includes(p)) return 'ATT';
  return 'MID';
}

function normTier(t: string): Tier {
  const v = t.trim().toUpperCase();
  if (v === 'S' || v === 'A' || v === 'B' || v === 'C' || v === 'D') return v;
  return 'C';
}

const TIER_BASE: Record<Tier, number> = { S: 12, A: 9, B: 6, C: 3, D: 1 };
const TIER_RET: Record<Tier, number> = { S: 18, A: 13, B: 8, C: 4, D: 2 };

export default function ImportData() {
  const { setPlayers, setStep } = useStore();
  const auctionMode = useStore(s => s.auctionMode);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [importedCount, setImportedCount] = useState(0);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLoading(true);
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (file.name.endsWith('.json')) {
        try {
          const data = JSON.parse(content);
          const formatted: Player[] = data.map((p: any) => {
            const tier = normTier(p.tier || p.category || 'C');
            return {
              id: p.id || crypto.randomUUID(),
              name: p.name,
              position: normPos(p.position || 'MID'),
              tier,
              country: p.country || 'Unknown',
              rating: p.rating || 0,
              basePrice: TIER_BASE[tier],
              retentionPrice: TIER_RET[tier],
              image: p.image || '',
              status: 'available' as const,
            };
          });
          setPlayers(formatted);
          setImportedCount(formatted.length);
          setSuccess(true);
        } catch { alert('Invalid JSON format'); }
      } else if (file.name.endsWith('.csv')) {
        Papa.parse(content, {
          header: true, skipEmptyLines: true,
          complete: (results) => {
            const formatted: Player[] = results.data.map((p: any) => {
              const tier = normTier(p.Tier || p.tier || 'C');
              return {
                id: crypto.randomUUID(),
                name: p['Player Name'] || p.name || '',
                position: normPos(p.Pos || p.position || 'MID'),
                tier,
                country: p.Nationality || p.country || 'Unknown',
                rating: parseInt(p.Rating || p.rating) || 0,
                basePrice: TIER_BASE[tier],
                retentionPrice: TIER_RET[tier],
                image: p.image || '',
                status: 'available' as const,
              };
            });
            setPlayers(formatted);
            setImportedCount(formatted.length);
            setSuccess(true);
          },
        });
      } else { alert('Unsupported file type. Use JSON or CSV.'); }
      setLoading(false);
    };
    reader.readAsText(file);
  };

  const loadDummyData = () => {
    const demoPlayers = loadDemoPlayers();
    setPlayers(demoPlayers);
    setImportedCount(demoPlayers.length);
    setSuccess(true);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-3xl mx-auto pt-20 px-6 font-sans text-white relative"
    >
      <div className="text-center mb-16 relative z-10">
        <div className="inline-block bg-[#f27d26] px-3 py-1 text-black font-black text-xs uppercase tracking-widest mb-4">Phase 03</div>
        <h1 className="text-5xl font-black tracking-tight mb-2 italic uppercase">Database Import</h1>
        <p className="text-white/40 text-[10px] uppercase tracking-[0.2em] font-bold">Upload a JSON or CSV file containing your player database.</p>
      </div>

      <div className="bg-white/5 border border-white/10 p-12 text-center mb-8 relative group transition-colors hover:border-[#f27d26]/50">
        <input
          type="file" accept=".json,.csv"
          onChange={handleFileUpload}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20"
        />
        {success ? (
          <div className="flex flex-col items-center">
            <CheckCircle2 className="w-16 h-16 text-[#f27d26] mb-6" />
            <h3 className="text-2xl font-black italic uppercase mb-2 text-white/80 tracking-widest">Successfully Imported</h3>
            <p className="text-[#f27d26] font-mono tracking-widest uppercase text-xs">{importedCount} players ready</p>
          </div>
        ) : (
          <div className="flex flex-col items-center">
            <div className="w-20 h-20 border border-white/10 bg-black/50 flex items-center justify-center mb-6 group-hover:border-[#f27d26]/50 transition-colors">
              <Upload className="w-8 h-8 text-white/40 group-hover:text-[#f27d26] transition-colors" />
            </div>
            <h3 className="text-lg font-bold tracking-widest uppercase mb-2">Drag & Drop Database</h3>
            <p className="text-[10px] text-white/40 uppercase tracking-widest mb-8">or click to browse local files.</p>
            <div className="text-[10px] text-white/40 bg-black/60 px-6 py-4 border border-white/5 uppercase tracking-widest">
              <p className="mb-2 font-bold text-white/60">Supported Formats:</p>
              <code className="font-mono text-[#f27d26]">CSV (with Tier, Pos, Rating columns) or JSON</code>
            </div>
          </div>
        )}
      </div>

      {!success && (
        <div className="text-center mb-12 relative z-10">
          <button
            onClick={loadDummyData}
            className="text-[10px] text-white/40 uppercase tracking-widest hover:text-[#f27d26] underline underline-offset-4 decoration-white/10 transition-colors cursor-pointer"
          >
            Or load internal demo dataset (150 players)
          </button>
        </div>
      )}

      {success && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex justify-between items-center bg-black/80 p-6 border border-white/10 relative z-10 sticky bottom-6 shadow-2xl backdrop-blur-md"
        >
          <button
            onClick={() => setStep('teams')}
            className="px-6 py-3 text-white/40 hover:text-white flex items-center gap-2 transition-colors font-bold text-xs uppercase tracking-widest cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" /> Go Back
          </button>
          <button
            onClick={() => setStep(auctionMode === 'mega' ? 'auction' : 'retention')}
            className="px-8 py-4 bg-[#f27d26] hover:bg-[#d96a1a] text-black font-black uppercase tracking-widest rounded transition-colors flex items-center gap-2 cursor-pointer"
          >
            {auctionMode === 'mega' ? 'Start Auction' : 'Retention Phase'} <ArrowRight className="w-4 h-4" />
          </button>
        </motion.div>
      )}
    </motion.div>
  );
}
