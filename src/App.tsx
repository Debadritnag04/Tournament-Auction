/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

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

  return (
    <div className="min-h-screen bg-[#020203] text-white font-sans selection:bg-[#f27d26]/30 overflow-hidden relative flex flex-col">
      {/* Background Atmosphere */}
      <div className="absolute top-0 left-0 w-full h-full opacity-20 pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-[#f27d26] rounded-full blur-[120px]"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-[#2662f2] rounded-full blur-[120px]"></div>
      </div>

      <div className="relative z-10 flex-1 flex flex-col overflow-y-auto">
        {step === 'landing' && <LandingPage />}
        {step === 'setup' && <SetupWizard />}
        {step === 'teams' && <TeamSetup />}
        {step === 'import' && <ImportData />}
        {step === 'retention' && <RetentionPhase />}
        {step === 'auction' && <LiveAuction />}
        {step === 'results' && <Results />}
      </div>
    </div>
  );
}

