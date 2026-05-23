import { motion } from 'motion/react';
import { useStore } from '../store';
import { Play, Trophy, Users, Database } from 'lucide-react';

export default function LandingPage() {
  const { setStep } = useStore();

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white font-sans flex flex-col relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-[#f27d26]/5 via-[#0a0a0a] to-[#0a0a0a] pointer-events-none" />
      
      <div className="relative z-10 max-w-6xl mx-auto px-6 pt-32 pb-20 flex-1 flex flex-col items-center justify-center text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <div className="inline-block bg-[#f27d26] px-4 py-1.5 text-black font-black text-xs uppercase tracking-widest mb-6">
            Elite Squad Building
          </div>
          <h1 className="text-6xl md:text-8xl font-black italic uppercase tracking-tighter mb-6 text-transparent bg-clip-text bg-gradient-to-b from-white to-white/40">
            Soccer Mega Auction
          </h1>
          <p className="max-w-2xl mx-auto text-white/40 font-bold uppercase tracking-[0.2em] leading-relaxed mb-12 text-sm md:text-base">
            Experience the ultimate draft bidding platform. Manage franchises, coordinate retentions, bid on world-class athletes, and build your dream team with real-time tactical views.
          </p>
          
          <button 
            onClick={() => setStep('setup')}
            className="px-10 py-5 bg-[#f27d26] hover:bg-[#d96a1a] text-black font-black text-lg uppercase tracking-[0.2em] hover:scale-105 transition-all shadow-[0_0_40px_rgba(242,125,38,0.3)] hover:shadow-[0_0_60px_rgba(242,125,38,0.5)] flex items-center gap-3 mx-auto"
          >
            <Play className="w-6 h-6 fill-current" /> Initialize Tournament
          </button>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-32 w-full max-w-5xl text-left"
        >
          <div className="bg-white/5 border border-white/10 p-8 hover:border-[#f27d26]/50 transition-colors">
            <Database className="w-10 h-10 text-[#f27d26] mb-6" />
            <h3 className="text-xl font-black italic uppercase tracking-widest mb-3">Custom Databases</h3>
            <p className="text-[10px] uppercase tracking-widest text-white/40 font-bold leading-relaxed">
              Import CSV or JSON player rosters. Filter by position, base price, and automatically segment your active auction queues.
            </p>
          </div>
          <div className="bg-white/5 border border-white/10 p-8 hover:border-[#f27d26]/50 transition-colors">
            <Users className="w-10 h-10 text-[#f27d26] mb-6" />
            <h3 className="text-xl font-black italic uppercase tracking-widest mb-3">Franchise Management</h3>
            <p className="text-[10px] uppercase tracking-widest text-white/40 font-bold leading-relaxed">
              Configure team budgets, colors, squad limits, and retain core players prior to the live bidding rounds.
            </p>
          </div>
          <div className="bg-white/5 border border-white/10 p-8 hover:border-[#f27d26]/50 transition-colors">
            <Trophy className="w-10 h-10 text-[#f27d26] mb-6" />
            <h3 className="text-xl font-black italic uppercase tracking-widest mb-3">Live Bidding</h3>
            <p className="text-[10px] uppercase tracking-widest text-white/40 font-bold leading-relaxed">
              Real-time timer, bid tracking, full squad view overlays, and post-auction PDF/CSV export generation.
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
