import { useState } from 'react';
import { useStore } from '../store';
import { Settings, Users, Clock, Shield } from 'lucide-react';
import { cn } from '../lib/utils';
import { motion } from 'motion/react';

export default function SetupWizard() {
  const { config, updateConfig, setStep, setTeams } = useStore();
  const [numTeams, setNumTeams] = useState(4);

  const handleNext = () => {
    // Initialize empty teams based on numTeams
    const initialTeams = Array.from({ length: numTeams }).map((_, i) => ({
      id: crypto.randomUUID(),
      name: `Team ${i + 1}`,
      shortName: `T${i + 1}`,
      primaryColor: '#f27d26',
      secondaryColor: '#cc5a12',
      startingPurse: 100,
      spent: 0,
    }));
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
        <h1 className="text-5xl font-black tracking-tight mb-2 italic uppercase">
          TOURNAMENT SETUP
        </h1>
        <p className="text-white/40 text-[10px] uppercase tracking-[0.2em] font-bold">Configure your auction rules and limits.</p>
      </div>

      <div className="grid md:grid-cols-2 gap-4 mb-12">
        <div className="bg-white/5 border border-white/10 p-8">
          <div className="flex items-center gap-3 mb-6 pb-4 border-b border-white/5">
            <Users className="w-5 h-5 text-[#f27d26]" />
            <h2 className="text-lg font-bold uppercase tracking-widest">Teams</h2>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-[10px] uppercase font-bold text-white/40 mb-2">Number of Teams (<span className="block inline font-mono text-[#f27d26]">{numTeams}</span>)</label>
              <input 
                type="range" 
                min="2" max="20" 
                value={numTeams} 
                onChange={(e) => setNumTeams(Number(e.target.value))}
                className="w-full accent-[#f27d26]"
              />
            </div>
          </div>
        </div>

        <div className="bg-white/5 border border-white/10 p-8">
          <div className="flex items-center gap-3 mb-6 pb-4 border-b border-white/5">
            <Shield className="w-5 h-5 text-[#f27d26]" />
            <h2 className="text-lg font-bold uppercase tracking-widest">Squad Limits</h2>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] uppercase font-bold text-white/40 mb-2 whitespace-nowrap">Min Players</label>
              <input 
                type="number" 
                value={config.minPlayers}
                onChange={(e) => updateConfig({ minPlayers: Number(e.target.value) })}
                className="w-full bg-black/50 border border-white/10 px-4 py-2 text-sm focus:border-[#f27d26] outline-none font-mono"
              />
            </div>
            <div>
              <label className="block text-[10px] uppercase font-bold text-white/40 mb-2 whitespace-nowrap">Max Players</label>
              <input 
                type="number" 
                value={config.maxPlayers}
                onChange={(e) => updateConfig({ maxPlayers: Number(e.target.value) })}
                className="w-full bg-black/50 border border-white/10 px-4 py-2 text-sm focus:border-[#f27d26] outline-none font-mono"
              />
            </div>
          </div>
        </div>

        <div className="bg-white/5 border border-white/10 p-8 md:col-span-2">
          <div className="flex items-center gap-3 mb-6 pb-4 border-b border-white/5">
            <Clock className="w-5 h-5 text-[#f27d26]" />
            <h2 className="text-lg font-bold uppercase tracking-widest">Auction Rules</h2>
          </div>
          <div className="grid grid-cols-2 gap-8">
             <div>
              <label className="block text-[10px] uppercase font-bold text-white/40 mb-2">Auto Timer (s)</label>
              <input 
                type="number" 
                value={config.autoTimer}
                onChange={(e) => updateConfig({ autoTimer: Number(e.target.value) })}
                className="w-full bg-black/50 border border-white/10 px-4 py-2 text-sm focus:border-[#f27d26] outline-none font-mono"
              />
            </div>
            <div>
              <label className="block text-[10px] uppercase font-bold text-white/40 mb-2">Default Base (Cr)</label>
              <input 
                type="number" 
                step="0.5"
                value={config.defaultStartingBid}
                onChange={(e) => updateConfig({ defaultStartingBid: Number(e.target.value) })}
                className="w-full bg-black/50 border border-white/10 px-4 py-2 text-sm focus:border-[#f27d26] outline-none font-mono"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-end pb-20">
        <button 
          onClick={handleNext}
          className="px-8 py-4 bg-[#f27d26] hover:bg-[#d96a1a] text-black font-black uppercase tracking-widest rounded transition-colors"
        >
          Configure Teams
        </button>
      </div>
    </motion.div>
  );
}
