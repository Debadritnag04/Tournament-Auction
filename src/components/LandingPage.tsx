import { useState } from 'react';
import { motion } from 'motion/react';
import { useStore } from '../store';
import { Play, Trophy, Users, Database, Zap, RotateCcw } from 'lucide-react';

export default function LandingPage() {
  const { resetForNewAuction, continueAuction, hasSavedAuction } = useStore();
  const [showNoAuction, setShowNoAuction] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleContinue = async () => {
    if (!hasSavedAuction) {
      setShowNoAuction(true);
      setTimeout(() => setShowNoAuction(false), 3500);
      return;
    }
    setIsLoading(true);
    await continueAuction();
    setIsLoading(false);
  };

  const handleNewAuction = async () => {
    setIsLoading(true);
    await resetForNewAuction();
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-[#030305] text-white font-sans flex flex-col relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
        <div className="absolute top-[-20%] left-[20%] w-[600px] h-[600px] bg-[#f27d26] rounded-full blur-[200px] opacity-[0.08]" />
        <div className="absolute bottom-[-20%] right-[10%] w-[500px] h-[500px] bg-[#f27d26] rounded-full blur-[180px] opacity-[0.04]" />
        <div className="absolute top-[50%] left-[50%] -translate-x-1/2 w-[800px] h-[400px] bg-[#f27d26] rounded-full blur-[250px] opacity-[0.03]" />
      </div>

      <main className="relative z-10 max-w-6xl mx-auto px-6 pt-28 pb-20 flex-1 flex flex-col items-center justify-center text-center">
        {/* Hero Section */}
        <motion.section
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, ease: 'easeOut' }}
          aria-label="Hero"
          className="flex flex-col items-center"
        >
          <div className="inline-block bg-[#f27d26] px-5 py-1.5 text-black font-black text-xs uppercase tracking-[0.2em] mb-8 rounded-sm">
            Position-Based Pot System
          </div>

          <h1 className="text-6xl md:text-8xl lg:text-[6.5rem] font-black italic uppercase tracking-tighter mb-8 text-transparent bg-clip-text bg-gradient-to-b from-white via-white/90 to-white/30 leading-[0.9]">
            Football Mega<br />Auction
          </h1>

          <p className="max-w-2xl mx-auto text-white/40 font-bold uppercase tracking-[0.15em] leading-relaxed mb-14 text-sm">
            Cinematic live auction experience. GK → DEF → MID → ATT pot flow.
            200 Cr purse. S/A/B/C/D tier system. Build your dream squad.
          </p>

          {/* Dual CTA Buttons — Centered */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-6 sm:gap-8 w-full"
          >
            {/* NEW AUCTION */}
            <motion.button
              onClick={handleNewAuction}
              disabled={isLoading}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              aria-label="Start a new auction"
              className="w-[300px] sm:w-[320px] py-5 bg-gradient-to-r from-[#FF7A1A] to-[#FF922E] text-black font-black text-lg uppercase tracking-[0.15em] rounded-lg shadow-[0_0_40px_rgba(242,125,38,0.35)] hover:shadow-[0_0_60px_rgba(242,125,38,0.55)] transition-shadow flex items-center justify-center gap-3 cursor-pointer disabled:opacity-50"
            >
              <Play className="w-5 h-5 fill-current" />
              New Auction
            </motion.button>

            {/* CONTINUE AUCTION */}
            <motion.button
              onClick={handleContinue}
              disabled={isLoading}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              aria-label="Continue a saved auction"
              className="w-[300px] sm:w-[320px] py-5 bg-gradient-to-r from-[#FF7A1A] to-[#FF922E] text-black font-black text-lg uppercase tracking-[0.15em] rounded-lg shadow-[0_0_40px_rgba(242,125,38,0.35)] hover:shadow-[0_0_60px_rgba(242,125,38,0.55)] transition-shadow flex items-center justify-center gap-3 cursor-pointer disabled:opacity-50"
            >
              <RotateCcw className="w-5 h-5" />
              Continue Auction
            </motion.button>
          </motion.div>

          {/* No saved auction message */}
          {showNoAuction && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-6 flex flex-col items-center gap-3"
            >
              <p className="text-[11px] text-amber-400 uppercase tracking-widest font-bold">
                No unfinished auction found.
              </p>
              <button
                onClick={handleNewAuction}
                className="text-[10px] text-white/50 uppercase tracking-widest font-bold underline underline-offset-2 hover:text-white cursor-pointer transition-colors"
              >
                Start New Auction
              </button>
            </motion.div>
          )}
        </motion.section>

        {/* Feature Cards */}
        <motion.section
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.5 }}
          className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-24 w-full max-w-5xl text-left"
          aria-label="Features"
        >
          {[
            { icon: Database, title: 'Position Pots', desc: 'GK, DEF, MID, ATT — auction flows through each pot sequentially for organized bidding.' },
            { icon: Users, title: '200 Cr Purse', desc: 'Each team starts with 200 Cr. Strategic bidding with tiered bid increments.' },
            { icon: Trophy, title: 'Tier System', desc: 'S/A/B/C/D quality tiers with fixed base prices and retention pricing.' },
            { icon: Zap, title: 'Live Bidding', desc: 'Real-time countdown timer, auto-sell, dynamic increments, and cinematic player cards.' },
          ].map(({ icon: Icon, title, desc }) => (
            <article key={title} className="bg-white/[0.03] border border-white/5 p-6 rounded-lg hover:border-[#f27d26]/30 transition-colors">
              <Icon className="w-8 h-8 text-[#f27d26] mb-4" aria-hidden="true" />
              <h2 className="text-sm font-black italic uppercase tracking-widest mb-2">{title}</h2>
              <p className="text-[10px] uppercase tracking-widest text-white/30 font-bold leading-relaxed">{desc}</p>
            </article>
          ))}
        </motion.section>
      </main>
    </div>
  );
}
