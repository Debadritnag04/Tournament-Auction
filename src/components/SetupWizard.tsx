import { useState } from 'react';
import { useStore } from '../store';
import { Users, Clock, Shield, Wallet, Zap, Check, Search } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

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
  { name: 'Thunderbolts FC', shortName: 'TFC', primaryColor: '#FACC15', secondaryColor: '#1E293B', owner: '', logo: undefined, purse: 200 },
  { name: 'Majhi FC', shortName: 'MFC', primaryColor: '#0EA5E9', secondaryColor: '#0F172A', owner: '', logo: undefined, purse: 200 },
];

export default function SetupWizard() {
  const { config, updateConfig, setStep, setTeams, setAuctionMode, auctionMode } = useStore();
  const [numTeams, setNumTeams] = useState(9);
  const [selectedTeamIndices, setSelectedTeamIndices] = useState<Set<number>>(
    new Set(DEFAULT_TEAMS.map((_, i) => i))
  );
  const [globalPurse, setGlobalPurse] = useState(200);
  const [useCustomPurse, setUseCustomPurse] = useState(false);
  const [customPurses, setCustomPurses] = useState<number[]>(
    DEFAULT_TEAMS.map(t => t.purse)
  );
  const [teamSearch, setTeamSearch] = useState('');
  const [validationMsg, setValidationMsg] = useState('');

  // Filter teams by search
  const filteredTeams = DEFAULT_TEAMS.map((team, idx) => ({ ...team, idx })).filter(
    t => !teamSearch || t.name.toLowerCase().includes(teamSearch.toLowerCase()) || t.shortName.toLowerCase().includes(teamSearch.toLowerCase())
  );

  // Team selection toggle
  const toggleTeam = (idx: number) => {
    const updated = new Set(selectedTeamIndices);
    if (updated.has(idx)) {
      updated.delete(idx);
      setValidationMsg('');
    } else {
      if (updated.size >= numTeams) {
        setValidationMsg(`Maximum of ${numTeams} teams can be selected.`);
        setTimeout(() => setValidationMsg(''), 2500);
        return;
      }
      updated.add(idx);
      setValidationMsg('');
    }
    setSelectedTeamIndices(updated);
  };

  // Select All
  const selectAll = () => {
    if (DEFAULT_TEAMS.length <= numTeams) {
      setSelectedTeamIndices(new Set(DEFAULT_TEAMS.map((_, i) => i)));
    } else {
      // Select first numTeams
      setSelectedTeamIndices(new Set(Array.from({ length: numTeams }, (_, i) => i)));
    }
    setValidationMsg('');
  };

  // Deselect All
  const deselectAll = () => {
    setSelectedTeamIndices(new Set());
    setValidationMsg('');
  };

  // When numTeams changes, auto-adjust selection
  const handleNumTeamsChange = (val: number) => {
    setNumTeams(val);
    // If current selection exceeds new count, trim to first `val` selected
    if (selectedTeamIndices.size > val) {
      const arr = [...selectedTeamIndices];
      const trimmed = new Set<number>(arr.slice(0, val));
      setSelectedTeamIndices(trimmed);
    }
    setValidationMsg('');
  };

  const isSelectionComplete = selectedTeamIndices.size === numTeams;

  // Custom purses for selected teams only
  const sortedSelectedIndices: number[] = [...selectedTeamIndices].sort((a, b) => a - b);
  const selectedTeams = sortedSelectedIndices.map(i => DEFAULT_TEAMS[i]);
  const ensuredPurses = selectedTeams.map((t, i) => customPurses[sortedSelectedIndices[i]] ?? t.purse);

  const handleCustomPurseChange = (originalIdx: number, value: number) => {
    const updated = [...customPurses];
    updated[originalIdx] = value;
    setCustomPurses(updated);
  };

  const handleNext = () => {
    if (!isSelectionComplete) return;

    const sortedIndices: number[] = [...selectedTeamIndices].sort((a, b) => a - b);
    const initialTeams = sortedIndices.map((teamIdx) => {
      const preset = DEFAULT_TEAMS[teamIdx];
      const purse = useCustomPurse ? (customPurses[teamIdx] ?? preset.purse) : globalPurse;
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
    });
    setTeams(initialTeams);
    setStep('teams');
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-5xl mx-auto pt-20 px-6 font-sans text-white"
    >
      <div className="text-center mb-16">
        <div className="inline-block bg-[#f27d26] px-3 py-1 text-black font-black text-xs uppercase tracking-widest mb-4">Phase 01</div>
        <h1 className="text-5xl font-black tracking-tight mb-2 italic uppercase">Tournament Setup</h1>
        <p className="text-white/40 text-[10px] uppercase tracking-[0.2em] font-bold">Configure auction rules, purse, and squad limits.</p>
      </div>

      <div className="grid md:grid-cols-2 gap-4 mb-8">
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

        {/* Teams Count + Squad Limits side by side */}
        <div className="bg-white/5 border border-white/10 p-8">
          <div className="flex items-center gap-3 mb-6 pb-4 border-b border-white/5">
            <Users className="w-5 h-5 text-[#f27d26]" />
            <h2 className="text-lg font-bold uppercase tracking-widest">Teams</h2>
          </div>
          <div>
            <label className="block text-[10px] uppercase font-bold text-white/40 mb-2">Number of Teams (<span className="font-mono text-[#f27d26]">{numTeams}</span>)</label>
            <input type="range" min="2" max="9" value={numTeams} onChange={(e) => handleNumTeamsChange(Number(e.target.value))} className="w-full accent-[#f27d26]" />
          </div>
        </div>

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

        {/* ── TEAM SELECTION — full width ── */}
        <div className="bg-white/5 border border-white/10 p-8 md:col-span-2">
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-white/5">
            <div className="flex items-center gap-3">
              <Users className="w-5 h-5 text-[#f27d26]" />
              <h2 className="text-lg font-bold uppercase tracking-widest">Select Teams</h2>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-[11px] font-mono font-bold">
                <span className={selectedTeamIndices.size === numTeams ? 'text-emerald-400' : 'text-[#f27d26]'}>{selectedTeamIndices.size}</span>
                <span className="text-white/30"> / {numTeams}</span>
                <span className="text-white/20 ml-1 text-[9px] uppercase tracking-wider">Teams</span>
              </span>
            </div>
          </div>

          {/* Search + Actions */}
          <div className="flex items-center gap-3 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/20" />
              <input
                type="text"
                placeholder="Search teams..."
                value={teamSearch}
                onChange={(e) => setTeamSearch(e.target.value)}
                className="w-full bg-black/50 border border-white/10 pl-9 pr-4 py-2 text-[11px] focus:border-[#f27d26] outline-none placeholder:text-white/20 rounded-sm"
              />
            </div>
            <button onClick={selectAll} className="px-3 py-2 bg-white/5 border border-white/10 text-[9px] font-bold uppercase tracking-wider hover:bg-white/10 cursor-pointer rounded-sm transition-colors">
              Select All
            </button>
            <button onClick={deselectAll} className="px-3 py-2 bg-white/5 border border-white/10 text-[9px] font-bold uppercase tracking-wider hover:bg-white/10 cursor-pointer rounded-sm transition-colors text-white/50">
              Clear
            </button>
          </div>

          {/* Team Cards Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {filteredTeams.map(team => {
              const isSelected = selectedTeamIndices.has(team.idx);
              const isDisabled = !isSelected && selectedTeamIndices.size >= numTeams;
              return (
                <motion.button
                  key={team.idx}
                  onClick={() => !isDisabled && toggleTeam(team.idx)}
                  whileTap={!isDisabled ? { scale: 0.97 } : undefined}
                  className={`relative p-4 border-2 rounded-lg transition-all duration-200 cursor-pointer text-left flex items-center gap-3 ${
                    isSelected
                      ? 'border-[#f27d26] bg-[#f27d26]/[0.08] shadow-[0_0_20px_rgba(242,125,38,0.15)] scale-[1.02]'
                      : isDisabled
                        ? 'border-white/[0.04] bg-white/[0.01] opacity-40 cursor-not-allowed'
                        : 'border-white/[0.08] bg-white/[0.02] hover:border-white/20 hover:bg-white/[0.04]'
                  }`}
                >
                  {/* Logo */}
                  <div className="w-10 h-10 rounded-full overflow-hidden shrink-0 border-2 flex items-center justify-center" style={{ borderColor: isSelected ? '#f27d26' : team.primaryColor + '40' }}>
                    {team.logo ? (
                      <img src={team.logo} alt={team.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center" style={{ backgroundColor: team.primaryColor }}>
                        <span className="text-[9px] font-black text-white/90">{team.shortName.slice(0, 3)}</span>
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="text-[11px] font-black uppercase truncate leading-tight">{team.name}</div>
                    {team.owner && <div className="text-[8px] text-white/30 uppercase tracking-widest mt-0.5">{team.owner}</div>}
                  </div>

                  {/* Selection check */}
                  <AnimatePresence>
                    {isSelected && (
                      <motion.div
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0, opacity: 0 }}
                        className="w-6 h-6 rounded-full bg-[#f27d26] flex items-center justify-center shrink-0"
                      >
                        <Check className="w-3.5 h-3.5 text-black" strokeWidth={3} />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.button>
              );
            })}
          </div>

          {/* Validation message */}
          <AnimatePresence>
            {validationMsg && (
              <motion.p
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="text-[10px] text-amber-400 uppercase tracking-widest font-bold mt-3"
              >
                {validationMsg}
              </motion.p>
            )}
          </AnimatePresence>

          {!isSelectionComplete && !validationMsg && (
            <p className="text-[9px] text-white/20 uppercase tracking-widest font-bold mt-3">
              Please select {numTeams} teams to continue.
            </p>
          )}
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
              <p className="text-[9px] text-white/30 mt-1 uppercase tracking-widest">Applied to all selected teams equally</p>
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

          {/* Custom purse per selected team */}
          {useCustomPurse && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="border-t border-white/5 pt-4"
            >
              <p className="text-[9px] text-[#f27d26] uppercase tracking-widest font-bold mb-3">Set individual purse for each selected team</p>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {([...selectedTeamIndices] as number[]).sort((a, b) => a - b).map((teamIdx) => {
                  const preset = DEFAULT_TEAMS[teamIdx];
                  return (
                    <div key={teamIdx} className="flex items-center gap-2 bg-black/30 border border-white/5 px-3 py-2 rounded-sm">
                      <div className="w-2 h-5 rounded-sm shrink-0" style={{ backgroundColor: preset.primaryColor }} />
                      <span className="text-[10px] font-bold uppercase tracking-wider text-white/60 w-10 shrink-0">{preset.shortName}</span>
                      <input
                        type="number" min={50} step={10}
                        value={customPurses[teamIdx] ?? preset.purse}
                        onChange={(e) => handleCustomPurseChange(teamIdx, Number(e.target.value))}
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

      {/* Continue Button */}
      <div className="flex justify-end pb-20">
        <button
          onClick={handleNext}
          disabled={!isSelectionComplete}
          className={`px-8 py-4 font-black uppercase tracking-widest rounded transition-all cursor-pointer ${
            isSelectionComplete
              ? 'bg-[#f27d26] hover:bg-[#d96a1a] text-black'
              : 'bg-white/10 text-white/30 cursor-not-allowed'
          }`}
        >
          Configure Teams {!isSelectionComplete && `(${selectedTeamIndices.size}/${numTeams})`}
        </button>
      </div>
    </motion.div>
  );
}
