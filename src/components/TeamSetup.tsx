import { useStore } from '../store';
import { motion } from 'motion/react';
import { ArrowRight, ArrowLeft } from 'lucide-react';
import { cn } from '../lib/utils';

export default function TeamSetup() {
  const { teams, updateTeam, setStep } = useStore();

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-6xl mx-auto pt-10 px-6 pb-20 font-sans text-white"
    >
      <div className="text-center mb-12">
        <div className="inline-block bg-[#f27d26] px-3 py-1 text-black font-black text-xs uppercase tracking-widest mb-4">Phase 02</div>
        <h1 className="text-5xl font-black tracking-tight mb-2 italic uppercase">Team Manifest</h1>
        <p className="text-white/40 text-[10px] uppercase tracking-[0.2em] font-bold">Set up identity and budgets for {teams.length} teams.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-12">
        {teams.map((team, index) => (
          <div key={team.id} className="bg-white/5 border border-white/10 p-6 group focus-within:border-[#f27d26]/50 transition-colors relative">
            <div className="absolute top-0 inset-x-0 h-1" style={{ backgroundColor: team.primaryColor }}></div>
            <div className="flex items-center gap-4 mb-6">
              <div 
                className="w-12 h-12 rounded-full border-2 border-black"
                style={{ backgroundColor: team.primaryColor }}
              >
                <div className="w-full h-full rounded-full border-2 border-transparent mix-blend-overlay" style={{ borderColor: team.secondaryColor }}></div>
              </div>
              <div>
                <h3 className="text-[10px] uppercase text-white/40 font-bold tracking-widest">Franchise {index + 1}</h3>
                <div className="text-lg font-black italic uppercase truncate">{team.name || 'Unnamed'}</div>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-[9px] font-bold text-white/40 mb-1 uppercase tracking-widest">Full Name</label>
                <input 
                  type="text" 
                  value={team.name}
                  onChange={(e) => updateTeam(team.id, { name: e.target.value })}
                  className="w-full bg-black/50 border border-white/10 px-3 py-2 text-sm focus:border-[#f27d26] outline-none font-bold"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[9px] font-bold text-white/40 mb-1 uppercase tracking-widest">Short</label>
                  <input 
                    type="text" 
                    maxLength={4}
                    value={team.shortName}
                    onChange={(e) => updateTeam(team.id, { shortName: e.target.value.toUpperCase() })}
                    className="w-full bg-black/50 border border-white/10 px-3 py-2 text-sm focus:border-[#f27d26] outline-none uppercase font-bold"
                  />
                </div>
                <div>
                  <label className="block text-[9px] font-bold text-white/40 mb-1 uppercase tracking-widest">Purse (Cr)</label>
                  <input 
                    type="number" 
                    value={team.startingPurse}
                    onChange={(e) => updateTeam(team.id, { startingPurse: Number(e.target.value) })}
                    className="w-full bg-black/50 border border-white/10 px-3 py-2 text-sm focus:border-[#f27d26] outline-none font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[9px] font-bold text-white/40 mb-1 uppercase tracking-widest">Primary Color</label>
                  <div className="flex h-10 w-full overflow-hidden border border-white/10 relative">
                    <input 
                      type="color" 
                      value={team.primaryColor}
                      onChange={(e) => updateTeam(team.id, { primaryColor: e.target.value })}
                      className="absolute inset-[-10px] w-[calc(100%+20px)] h-[calc(100%+20px)] cursor-pointer"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[9px] font-bold text-white/40 mb-1 uppercase tracking-widest">Secondary</label>
                   <div className="flex h-10 w-full overflow-hidden border border-white/10 relative">
                    <input 
                      type="color" 
                      value={team.secondaryColor}
                      onChange={(e) => updateTeam(team.id, { secondaryColor: e.target.value })}
                      className="absolute inset-[-10px] w-[calc(100%+20px)] h-[calc(100%+20px)] cursor-pointer"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="flex justify-between items-center bg-black/80 p-6 border border-white/10 sticky bottom-6 shadow-2xl backdrop-blur-md">
        <button 
          onClick={() => setStep('setup')}
          className="px-6 py-3 text-white/40 hover:text-white flex items-center gap-2 transition-colors font-bold text-xs uppercase tracking-widest"
        >
          <ArrowLeft className="w-4 h-4" /> Go Back
        </button>
        <button 
          onClick={() => setStep('import')}
          className="px-8 py-4 bg-[#f27d26] hover:bg-[#d96a1a] text-black font-black uppercase tracking-widest rounded transition-colors flex items-center gap-2"
        >
          Import Data <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </motion.div>
  );
}
