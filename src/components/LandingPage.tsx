import { motion } from 'motion/react';
import { useStore } from '../store';
import { Play, Trophy, Users, Database, Zap } from 'lucide-react';

export default function LandingPage() {
  const { setStep } = useStore();

  return (
    <div className="min-h-screen bg-[#030305] text-white font-sans flex flex-col relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[-20%] left-[20%] w-[600px] h-[600px] bg-[#f27d26] rounded-full blur-[200px] opacity-[0.06]" />
        <div className="absolute bottom-[-20%] right-[10%] w-[500px] h-[500px] bg-[#3b82f6] rounded-full blur-[180px] opacity-[0.04]" />
        <div className="absolute top-[40%] right-[30%] w-[300px] h-[300px] bg-[#10b981] rounded-full blur-[150px] opacity-[0.03]" />
      </div>

      <div className="relative z-10 max-w-6xl mx-auto px-6 pt-32 pb-20 flex-1 flex flex-col items-center justify-center text-center">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
          <div className="inline-block bg-[#f27d26] px-4 py-1.5 text-black font-black text-xs uppercase tracking-widest mb-6">
            Position-Based Pot System
          </div>
          <h1 className="text-6xl md:text-8xl font-black italic uppercase tracking-tighter mb-6 text-transparent bg-clip-text bg-gradient-to-b from-white to-white/40">
            Football Mega Auction
          </h1>
          <p className="max-w-2xl mx-auto text-white/40 font-bold uppercase tracking-[0.15em] leading-relaxed mb-12 text-sm">
            Cinematic live auction experience. GK → DEF → MID → ATT pot flow.
            200 Cr purse. S/A/B/C/D tier system. Build your dream squad.
          </p>

          <button
            onClick={() => setStep('setup')}
            className="px-10 py-5 bg-[#f27d26] hover:bg-[#d96a1a] text-black font-black text-lg uppercase tracking-[0.2em] hover:scale-105 transition-all shadow-[0_0_40px_rgba(242,125,38,0.3)] hover:shadow-[0_0_60px_rgba(242,125,38,0.5)] flex items-center gap-3 mx-auto cursor-pointer"
          >
            <Play className="w-6 h-6 fill-current" /> Launch Auction
          </button>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-28 w-full max-w-5xl text-left"
        >
          {[
            { icon: Database, title: 'Position Pots', desc: 'GK, DEF, MID, ATT — auction flows through each pot sequentially.' },
            { icon: Users, title: '200 Cr Purse', desc: 'Each team starts with 200 Cr. Strategic bidding with tiered increments.' },
            { icon: Trophy, title: 'Tier System', desc: 'S/A/B/C/D quality tiers with fixed base and retention prices.' },
            { icon: Zap, title: 'Live Bidding', desc: 'Real-time timer, auto-sell, dynamic increments, and cinematic presentation.' },
          ].map(({ icon: Icon, title, desc }) => (
            <div key={title} className="bg-white/[0.03] border border-white/5 p-6 hover:border-[#f27d26]/30 transition-colors">
              <Icon className="w-8 h-8 text-[#f27d26] mb-4" />
              <h3 className="text-sm font-black italic uppercase tracking-widest mb-2">{title}</h3>
              <p className="text-[10px] uppercase tracking-widest text-white/30 font-bold leading-relaxed">{desc}</p>
            </div>
          ))}
        </motion.div>
      </div>
    </div>
  );
}
