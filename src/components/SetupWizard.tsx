import { useState } from 'react';
import { useStore } from '../store';
import { Users, Clock, Shield, Wallet, Zap } from 'lucide-react';
import { motion } from 'motion/react';

// Import team logos
import logoCoochbehar from '../Club-logo/Coochbehar.jpeg';
import logoSourish from '../Club-logo/sourish.jpeg';
import logoSubhojit from '../Club-logo/subhojit.jpeg';
import logoDebanjan from '../Club-logo/debanjan.jpeg';
import logoSumit from '../Club-logo/sumit.jpeg';
import logoDwipayan from '../Club-logo/dwipayan.jpeg';
import logoDebdip from '../Club-logo/debdip.jpeg';

const DEFAULT_TEAMS = [
  { name: 'Coochbehar United FC', shortName: 'CUFC', primaryColor: '#DC143C', secondaryColor: '#1B2A4A', owner: 'Debadrit', logo: logoCoochbehar, purse: 234 },
  { name: 'Baghbazar Tigers', shortName: 'BGT', primaryColor: '#1B2A4A', secondaryColor: '#D4A017', owner: 'Sourish', logo: logoSourish, purse: 236 },
  { name: 'Kamarhati Knights', shortName: 'KMK', primaryColor: '#2952CC', secondaryColor: '#D4A017', owner: 'Subhojit', logo: logoSubhojit, purse: 222 },
  { name: 'Shobhabazar Smashers', shortName: 'SBS', primaryColor: '#1A237E', secondaryColor: '#D4A017', owner: 'Debanjan', logo: logoDebanjan, purse: 210 },
  { name: 'Dakshineshwar Deltas', shortName: 'DKD', primaryColor: '#B7472A', secondaryColor: '#5C6B7A', owner: 'Sumit', logo: logoSumit, purse: 202 },
  { name: 'Ichapur Invincibles', shortName: 'ICI', primaryColor: '#2952CC', secondaryColor: '#D4A017', owner: 'Dwipayan', logo: logoDwipayan, purse: 222 },
  { name: 'Krishnanagar City Junction FC', shortName: 'KCJ', primaryColor: '#1B2A4A', secondaryColor: '#D4A017', owner: 'Debdip', logo: logoDebdip, purse: 228 },
];

export default function SetupWizard() {
  const { config, updateConfig, setStep, setTeams, setAuctionMode, auctionMode } = useStore();
  const [numTeams, setNumTeams] = useState(7);
  const [globalPurse, setGlobalPurse] = useState(200);
  const [useCustomPurse, setUseCustomPurse] = useState(false);
  const [customPurses, setCustomPurses] = useState<number[]>(
    DEFAULT_TEAMS.map(t => t.purse)
  );

  // Keep customPurses array in sync with numTeams
  const ensuredPurses = Array.from({ length: numTeams }, (_, i) => customPurses[i] ?? globalPurse);

  const handleCustomPurseChange = (index: number, value: number) => {
    const updated = [...ensuredPurses];
    updated[index] = value;
    setCustomPurses(updated);
  };

  const handleNext = () => {
    const initialTeams = Array.from({ length: numTeams }).map((_, i) => {
      const preset = DEFAULT_TEAMS[i];
      const purse = useCustomPurse ? ensuredPurses[i] : (preset ? preset.purse : globalPurse);
      if (preset) {
        return {
          id: crypto.randomUUID(),
          name: preset.name,
          shortName: preset.shortName,
          primaryColor: preset.primaryColor,
          secondaryColor: preset.secondaryColor,
          logo: preset.logo,
          startingPurse: purse,
          spent: 0,
        };
      }
      return {
        id: crypto.randomUUID(),
        name: `Team ${i + 1}`,
        shortName: `T${i + 1}`,
        primaryColor: ['#f27d26', '#3b82f6', '#10b981', '#a855f7', '#ef4444'][i % 5],
        secondaryColor: ['#cc5a12', '#2563eb', '#059669', '#7c3aed', '#dc2626'][i % 5],
        startingPurse: purse,
        spent: 0,
      };
    });
    setTeams(initialTeams);
    setStep('teams');
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-4xl mx-auto pt-20 px-6 font-sans text-white"
    >
      <div className="text-center mb-16">
        <div className="inline-block bg-[#f27d26] px-3 py-1 text-black font-black text-xs uppercase tracking-widest mb-4">Phase 01</div>
        <h1 className="text-5xl font-black tracking-tight mb-2 italic uppercase">Tournament Setup</h1>
        <p className="text-white/40 text-[10px] uppercase tracking-[0.2em] font-bold">Configure auction rules, purse, and squad limits.</p>
      </div>

      <div className="grid md:grid-cols-2 gap-4 mb-12">
        {/* Auction Mode Selector — full width */}
        <div className="bg-white/5 border border-white/10 p-8 md:col-span-2">
          <div className="flex items-center gap-3 mb-6 pb-4 border-b border-white/5">
            <Zap className="w-5 h-5 text-[#f27d26]" />
            <h2 className="text-lg font-bold uppercase tracking-widest">Auction Mode</h2>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <button onClick={() => setAuctionMode('mega')}
              className={`p-6 border-2 rounded transition-all cursor-pointer text-left ${auctionMode === 'mega' ? 'border-[#f27d26] bg-[#f27d26]/10' : 'border-white/10 bg-white/[0.02] hover:border-white/20'}`}>
              <div className="text-lg font-black uppercase italic tracking-tight mb-1">Mega Auction</div>
              <div className="text-[9px] text-white/40 uppercase tracking-widest leading-relaxed">
                Fresh start. No retentions. All players enter the pool. Full purse for every team.
              </div>
            </button>
            <button onClick={() => setAuctionMode('mini')}
              className={`p-6 border-2 rounded transition-all cursor-pointer text-left ${auctionMode === 'mini' ? 'border-[#f27d26] bg-[#f27d26]/10' : 'border-white/10 bg-white/[0.02] hover:border-white/20'}`}>
              <div className="text-lg font-black uppercase italic tracking-tight mb-1">Mini Auction</div>
              <div className="text-[9px] text-white/40 uppercase tracking-widest leading-relaxed">
                Retain up to 7 players from last season. Retention cost deducted from purse. Remaining players enter pool.
              </div>
            </button>
          </div>
        </div>

        {/* Teams */}
        <div className="bg-white/5 border border-white/10 p-8">
          <div className="flex items-center gap-3 mb-6 pb-4 border-b border-white/5">
            <Users className="w-5 h-5 text-[#f27d26]" />
            <h2 className="text-lg font-bold uppercase tracking-widest">Teams</h2>
          </div>
          <div>
            <label className="block text-[10px] uppercase font-bold text-white/40 mb-2">Number of Teams (<span className="font-mono text-[#f27d26]">{numTeams}</span>)</label>
            <input type="range" min="2" max="12" value={numTeams} onChange={(e) => setNumTeams(Number(e.target.value))} className="w-full accent-[#f27d26]" />
          </div>
        </div>

        {/* Squad Limits */}
        <div className="bg-white/5 border border-white/10 p-8">
          <div className="flex items-center gap-3 mb-6 pb-4 border-b border-white/5">
            <Shield className="w-5 h-5 text-[#f27d26]" />
            <h2 className="text-lg font-bold uppercase tracking-widest">Squad Limits</h2>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] uppercase font-bold text-white/40 mb-2">Min Players</label>
              <input type="number" value={config.minPlayers} onChange={(e) => updateConfig({ minPlayers: Number(e.target.value) })} className="w-full bg-black/50 border border-white/10 px-4 py-2 text-sm focus:border-[#f27d26] outline-none font-mono" />
            </div>
            <div>
              <label className="block text-[10px] uppercase font-bold text-white/40 mb-2">Max Players</label>
              <input type="number" value={config.maxPlayers} onChange={(e) => updateConfig({ maxPlayers: Number(e.target.value) })} className="w-full bg-black/50 border border-white/10 px-4 py-2 text-sm focus:border-[#f27d26] outline-none font-mono" />
            </div>
          </div>
          <div className="mt-4">
            <label className="block text-[10px] uppercase font-bold text-white/40 mb-2">Max Retentions Per Team</label>
            <input type="number" value={config.maxRetentions} onChange={(e) => updateConfig({ maxRetentions: Number(e.target.value) })} className="w-full bg-black/50 border border-white/10 px-4 py-2 text-sm focus:border-[#f27d26] outline-none font-mono" />
          </div>
        </div>

        {/* Purse Configuration — full width */}
        <div className="bg-white/5 border border-white/10 p-8 md:col-span-2">
          <div className="flex items-center gap-3 mb-6 pb-4 border-b border-white/5">
            <Wallet className="w-5 h-5 text-[#f27d26]" />
            <h2 className="text-lg font-bold uppercase tracking-widest">Purse Configuration</h2>
          </div>

          <div className="flex items-center justify-between mb-6">
            <div className="flex-1">
              <label className="block text-[10px] uppercase font-bold text-white/40 mb-2">Global Purse (Cr)</label>
              <input
                type="number" min={50} step={10}
                value={globalPurse}
                onChange={(e) => setGlobalPurse(Number(e.target.value))}
                disabled={useCustomPurse}
                className="w-48 bg-black/50 border border-white/10 px-4 py-2 text-sm focus:border-[#f27d26] outline-none font-mono disabled:opacity-40 disabled:cursor-not-allowed"
              />
              <p className="text-[9px] text-white/30 mt-1 uppercase tracking-widest">Applied to all teams equally</p>
            </div>

            {/* Custom purse toggle */}
            <div className="flex items-center gap-3">
              <label className="text-[10px] uppercase font-bold text-white/40 tracking-widest cursor-pointer" htmlFor="custom-purse-toggle">
                Custom Purse
              </label>
              <button
                id="custom-purse-toggle"
                onClick={() => setUseCustomPurse(!useCustomPurse)}
                className={`relative w-11 h-6 rounded-full transition-colors cursor-pointer ${useCustomPurse ? 'bg-[#f27d26]' : 'bg-white/10'}`}
              >
                <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${useCustomPurse ? 'translate-x-5.5 left-0.5' : 'left-0.5'}`}
                  style={{ transform: useCustomPurse ? 'translateX(22px)' : 'translateX(0)' }} />
              </button>
            </div>
          </div>

          {/* Custom purse per team */}
          {useCustomPurse && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="border-t border-white/5 pt-4"
            >
              <p className="text-[9px] text-[#f27d26] uppercase tracking-widest font-bold mb-3">Set individual purse for each team</p>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {Array.from({ length: numTeams }).map((_, i) => {
                  const preset = DEFAULT_TEAMS[i];
                  const label = preset ? preset.shortName : `T${i + 1}`;
                  const color = preset ? preset.primaryColor : '#666';
                  return (
                    <div key={i} className="flex items-center gap-2 bg-black/30 border border-white/5 px-3 py-2 rounded-sm">
                      <div className="w-2 h-5 rounded-sm shrink-0" style={{ backgroundColor: color }} />
                      <span className="text-[10px] font-bold uppercase tracking-wider text-white/60 w-10 shrink-0">{label}</span>
                      <input
                        type="number" min={50} step={10}
                        value={ensuredPurses[i]}
                        onChange={(e) => handleCustomPurseChange(i, Number(e.target.value))}
                        className="flex-1 bg-black/50 border border-white/10 px-2 py-1 text-[12px] focus:border-[#f27d26] outline-none font-mono min-w-0"
                      />
                      <span className="text-[9px] text-white/30 font-bold shrink-0">Cr</span>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          )}
        </div>

        {/* Auction Rules */}
        <div className="bg-white/5 border border-white/10 p-8 md:col-span-2">
          <div className="flex items-center gap-3 mb-6 pb-4 border-b border-white/5">
            <Clock className="w-5 h-5 text-[#f27d26]" />
            <h2 className="text-lg font-bold uppercase tracking-widest">Auction Rules</h2>
          </div>
          <div className="grid grid-cols-2 gap-8">
            <div>
              <label className="block text-[10px] uppercase font-bold text-white/40 mb-2">Bid Timer (seconds)</label>
              <input type="number" value={config.autoTimer} onChange={(e) => updateConfig({ autoTimer: Number(e.target.value) })} className="w-full bg-black/50 border border-white/10 px-4 py-2 text-sm focus:border-[#f27d26] outline-none font-mono" />
            </div>
            <div className="bg-black/30 border border-white/5 p-4 rounded text-[10px] text-white/40 uppercase tracking-widest space-y-1">
              <p className="font-bold text-white/60 mb-2">Bid Increments (Fixed)</p>
              <p>1-20 Cr → +1 Cr</p>
              <p>21-40 Cr → +2 Cr</p>
              <p>41-70 Cr → +5 Cr</p>
              <p>71+ Cr → +10 Cr</p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-end pb-20">
        <button onClick={handleNext} className="px-8 py-4 bg-[#f27d26] hover:bg-[#d96a1a] text-black font-black uppercase tracking-widest rounded transition-colors cursor-pointer">
          Configure Teams
        </button>
      </div>
    </motion.div>
  );
}
