/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useState } from 'react';
import { useStore } from './store';
import LandingPage from './components/LandingPage';
import SetupWizard from './components/SetupWizard';
import TeamSetup from './components/TeamSetup';
import ImportData from './components/ImportData';
import RetentionPhase from './components/RetentionPhase';
import LiveAuction from './components/LiveAuction';
import Results from './components/Results';

export default function App() {
  const step = useStore(state => state.step);
  const checkSavedAuction = useStore(state => state.checkSavedAuction);
  const [isLoading, setIsLoading] = useState(true);

  // On mount: check if a saved auction exists (but do NOT navigate away from landing)
  useEffect(() => {
    checkSavedAuction().finally(() => setIsLoading(false));
  }, [checkSavedAuction]);

  // Show loading spinner while checking state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#020203] flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-[#f27d26] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-[10px] text-white/30 uppercase tracking-widest font-bold">Loading...</p>
        </div>
      </div>
    );
  }

  // Auction step uses its own full-screen layout
  if (step === 'auction') {
    return <LiveAuction />;
  }

  return (
    <div className="min-h-screen bg-[#020203] text-white font-sans selection:bg-[#f27d26]/30 relative flex flex-col">
      {/* Background Atmosphere */}
      <div className="fixed top-0 left-0 w-full h-full opacity-20 pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-[#f27d26] rounded-full blur-[120px]"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-[#2662f2] rounded-full blur-[120px]"></div>
      </div>

      <div className="relative z-10 flex-1 flex flex-col">
        {step === 'landing' && <LandingPage />}
        {step === 'setup' && <SetupWizard />}
        {step === 'teams' && <TeamSetup />}
        {step === 'import' && <ImportData />}
        {step === 'retention' && <RetentionPhase />}
        {step === 'results' && <Results />}
      </div>
    </div>
  );
}
