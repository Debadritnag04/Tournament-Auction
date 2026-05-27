import { useStore } from '../store';
import { motion } from 'motion/react';
import { ArrowRight, ArrowLeft, Shield, Wallet } from 'lucide-react';

// Owner data mapped by team name for display
const OWNER_MAP: Record<string, string> = {
  'Coochbehar United FC': 'Debadrit',
  'Baghbazar Tigers': 'Sourish',
  'Kamarhati Knights': 'Subhojit',
  'Shobhabazar Smashers': 'Debanjan',
  'Dakshineshwar Deltas': 'Sumit',
  'Ichapur Invincibles': 'Dwipayan',
  'Krishnanagar City Junction FC': 'Debdip',
};

export default function TeamSetup() {
  const { teams, updateTeam, setStep } = useStore();

  return (
    <div className="min-h-screen bg-[#030305] text-white font-sans relative overflow-hidden">
      {/* Background atmosphere */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[-15%] left-[10%] w-[500px] h-[500px] bg-[#f27d26] rounded-full blur-[180px] opacity-[0.04]" />
        <div className="absolute bottom-[-10%] right-[5%] w-[400px] h-[400px] bg-[#3b82f6] rounded-full blur-[150px] opacity-[0.03]" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto pt-8 px-6 pb-24">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <div className="inline-block bg-[#f27d26] px-3 py-1 text-black font-black text-xs uppercase tracking-widest mb-3">Phase 02</div>
          <h1 className="text-4xl md:text-5xl font-black tracking-tight italic uppercase mb-1">
            Team Manifest
          </h1>
          <p className="text-white/30 text-[10px] uppercase tracking-[0.25em] font-bold">
            {teams.length} Franchises · 200 Cr Purse · Configure identities below
          </p>
        </motion.div>

        {/* Team Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4 mb-16">
          {teams.map((team, index) => {
            const owner = OWNER_MAP[team.name] || '';
            return (
              <motion.div
                key={team.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="relative group"
              >
                {/* Card */}
                <div className="relative bg-white/[0.03] border border-white/8 rounded-lg overflow-hidden backdrop-blur-sm hover:border-white/15 transition-all duration-300">
                  {/* Top accent bar with gradient */}
                  <div className="h-1.5 w-full" style={{ background: `linear-gradient(90deg, ${team.primaryColor}, ${team.secondaryColor})` }} />

                  {/* Card header with crest area */}
                  <div className="px-4 pt-4 pb-3 flex items-center gap-3 border-b border-white/5">
                    {/* Team crest / logo */}
                    <div className="relative">
                      <div className="w-11 h-11 rounded-full flex items-center justify-center border-2 shadow-lg overflow-hidden" style={{ borderColor: team.secondaryColor, boxShadow: `0 0 20px ${team.primaryColor}30` }}>
                        {team.logo ? (
                          <img src={team.logo} alt={team.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center" style={{ backgroundColor: team.primaryColor }}>
                            <span className="text-[10px] font-black text-white/90 uppercase tracking-tight">{team.shortName.substring(0, 3)}</span>
                          </div>
                        )}
                      </div>
                      <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-black border border-white/10 flex items-center justify-center">
                        <span className="text-[7px] font-black text-[#f27d26]">{index + 1}</span>
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-[13px] font-black italic uppercase truncate leading-tight">{team.name || 'Unnamed'}</div>
                      {owner && (
                        <div className="text-[9px] text-white/30 uppercase tracking-widest font-bold mt-0.5">
                          Owner: <span className="text-white/50">{owner}</span>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-1 bg-white/5 border border-white/8 px-2 py-1 rounded-sm shrink-0">
                      <Wallet className="w-3 h-3 text-[#f27d26]" />
                      <span className="text-[11px] font-mono font-bold text-[#f27d26]">{team.startingPurse}</span>
                    </div>
                  </div>

                  {/* Editable fields */}
                  <div className="px-4 py-3 space-y-2.5">
                    {/* Name */}
                    <div>
                      <label className="block text-[8px] font-bold text-white/30 mb-0.5 uppercase tracking-widest">Club Name</label>
                      <input type="text" value={team.name} onChange={(e) => updateTeam(team.id, { name: e.target.value })}
                        className="w-full bg-black/40 border border-white/8 px-2.5 py-1.5 text-[12px] focus:border-[#f27d26]/60 outline-none font-bold rounded-sm transition-colors" />
                    </div>

                    {/* Short name + Purse row */}
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[8px] font-bold text-white/30 mb-0.5 uppercase tracking-widest">Tag</label>
                        <input type="text" maxLength={4} value={team.shortName} onChange={(e) => updateTeam(team.id, { shortName: e.target.value.toUpperCase() })}
                          className="w-full bg-black/40 border border-white/8 px-2.5 py-1.5 text-[12px] focus:border-[#f27d26]/60 outline-none uppercase font-bold font-mono rounded-sm transition-colors" />
                      </div>
                      <div>
                        <label className="block text-[8px] font-bold text-white/30 mb-0.5 uppercase tracking-widest">Purse (Cr)</label>
                        <input type="number" value={team.startingPurse} onChange={(e) => updateTeam(team.id, { startingPurse: Number(e.target.value) })}
                          className="w-full bg-black/40 border border-white/8 px-2.5 py-1.5 text-[12px] focus:border-[#f27d26]/60 outline-none font-mono rounded-sm transition-colors" />
                      </div>
                    </div>

                    {/* Colors row */}
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[8px] font-bold text-white/30 mb-0.5 uppercase tracking-widest">Primary</label>
                        <div className="flex items-center gap-2 bg-black/40 border border-white/8 rounded-sm px-2 py-1">
                          <div className="relative w-6 h-6 rounded-sm overflow-hidden border border-white/10 shrink-0">
                            <input type="color" value={team.primaryColor} onChange={(e) => updateTeam(team.id, { primaryColor: e.target.value })}
                              className="absolute inset-[-8px] w-[calc(100%+16px)] h-[calc(100%+16px)] cursor-pointer" />
                          </div>
                          <span className="text-[9px] font-mono text-white/40 uppercase">{team.primaryColor}</span>
                        </div>
                      </div>
                      <div>
                        <label className="block text-[8px] font-bold text-white/30 mb-0.5 uppercase tracking-widest">Secondary</label>
                        <div className="flex items-center gap-2 bg-black/40 border border-white/8 rounded-sm px-2 py-1">
                          <div className="relative w-6 h-6 rounded-sm overflow-hidden border border-white/10 shrink-0">
                            <input type="color" value={team.secondaryColor} onChange={(e) => updateTeam(team.id, { secondaryColor: e.target.value })}
                              className="absolute inset-[-8px] w-[calc(100%+16px)] h-[calc(100%+16px)] cursor-pointer" />
                          </div>
                          <span className="text-[9px] font-mono text-white/40 uppercase">{team.secondaryColor}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Bottom accent */}
                  <div className="px-4 py-2 border-t border-white/5 flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <Shield className="w-3 h-3 text-white/20" />
                      <span className="text-[8px] text-white/20 uppercase tracking-widest font-bold">Franchise #{index + 1}</span>
                    </div>
                    <div className="flex gap-1">
                      <div className="w-3 h-3 rounded-full border border-white/10" style={{ backgroundColor: team.primaryColor }} />
                      <div className="w-3 h-3 rounded-full border border-white/10" style={{ backgroundColor: team.secondaryColor }} />
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Sticky bottom navigation */}
        <div className="fixed bottom-0 left-0 right-0 z-50">
          <div className="max-w-7xl mx-auto px-6 pb-4">
            <div className="flex justify-between items-center bg-black/90 backdrop-blur-xl p-4 border border-white/10 rounded-lg shadow-[0_-10px_40px_rgba(0,0,0,0.5)]">
              <button onClick={() => setStep('setup')} className="px-5 py-2.5 text-white/40 hover:text-white flex items-center gap-2 transition-colors font-bold text-[10px] uppercase tracking-widest cursor-pointer border border-white/8 hover:border-white/20 rounded-sm">
                <ArrowLeft className="w-3.5 h-3.5" /> Back
              </button>
              <div className="text-[9px] text-white/25 uppercase tracking-widest font-bold hidden md:block">
                {teams.length} teams configured · Total purse: {teams.reduce((s, t) => s + t.startingPurse, 0)} Cr
              </div>
              <button onClick={() => setStep('import')} className="px-6 py-2.5 bg-[#f27d26] hover:bg-[#d96a1a] text-black font-black uppercase tracking-widest rounded-sm transition-colors flex items-center gap-2 cursor-pointer text-[11px]">
                Import Players <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
