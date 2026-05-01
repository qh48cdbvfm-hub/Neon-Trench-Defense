import React from 'react';
import { GameState } from '../game/types';
import { Database, Zap, Cpu, ArrowLeft, ShieldAlert } from 'lucide-react';

interface DarkWebProps {
  gameState: GameState;
  onBack: () => void;
  onMainMenu: () => void;
  onUpgrade: (type: 'damage' | 'mining' | 'credits' | 'autoBuild' | 'autoOverclock', cost: number) => void;
}

export const DarkWeb: React.FC<DarkWebProps> = ({ gameState, onBack, onMainMenu, onUpgrade }) => {
  const { prestige } = gameState;

  const renderUpgrade = (
    type: 'damage' | 'mining' | 'credits' | 'autoBuild' | 'autoOverclock',
    name: string,
    desc: string,
    currentLevel: number,
    baseCost: number,
    icon: React.ReactNode
  ) => {
    const cost = Math.floor(baseCost * Math.pow(1.5, currentLevel));
    const canAfford = prestige.sourceCode >= cost;

    return (
      <div className="p-4 border border-red-900/50 bg-black/50 rounded flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-full bg-red-900/20 text-red-500">
            {icon}
          </div>
          <div>
            <h3 className="font-bold text-red-400">{name} <span className="text-red-700 text-sm">LVL {currentLevel}</span></h3>
            <p className="text-sm text-gray-400 max-w-xs">{desc}</p>
          </div>
        </div>
        <button
          onClick={() => onUpgrade(type, cost)}
          disabled={!canAfford}
          className={`px-4 py-2 rounded font-bold transition-colors ${canAfford ? 'bg-red-900 hover:bg-red-700 text-white' : 'bg-gray-900 text-gray-700 cursor-not-allowed'}`}
        >
          {cost} SC
        </button>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-black text-white p-8 flex flex-col items-center font-mono relative overflow-hidden">
      {/* Matrix-like background effect */}
      <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at center, #ff0000 0%, transparent 100%)' }}></div>
      
      <div className="max-w-4xl w-full z-10">
        <header className="flex justify-between items-end border-b border-red-900 pb-4 mb-8">
          <div>
            <h1 className="text-4xl font-black text-red-600 tracking-tighter flex items-center gap-3">
              <ShieldAlert size={36} />
              DARK WEB // BLACK MARKET
            </h1>
            <p className="text-red-800 tracking-widest text-sm uppercase mt-1">Encrypted Connection Established</p>
          </div>
          <div className="text-right">
            <div className="text-red-500 font-mono text-3xl flex items-center gap-2 justify-end">
              <Database size={28} />
              {prestige.sourceCode}
            </div>
            <p className="text-red-900 text-xs uppercase tracking-widest">Source Code</p>
          </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
          <section>
            <h2 className="text-xl font-bold text-red-500 mb-4 border-b border-red-900/50 pb-2">Core Overrides</h2>
            <div className="space-y-4">
              {renderUpgrade('damage', 'Global Damage Multiplier', '+100% base damage to all towers permanently.', prestige.multipliers.globalDamage, 100, <Zap size={24} />)}
              {renderUpgrade('credits', 'Starting Capital', 'Start every run with +100 extra Crypto-Creds.', prestige.multipliers.startingCredits, 50, <Database size={24} />)}
              {renderUpgrade('mining', 'Offline Mining Rate', 'Increase passive fragment generation.', prestige.multipliers.offlineMining, 200, <Cpu size={24} />)}
            </div>
          </section>

          <section>
            <h2 className="text-xl font-bold text-red-500 mb-4 border-b border-red-900/50 pb-2">AI Daemons</h2>
            <div className="space-y-4">
              {renderUpgrade('autoBuild', 'Auto-Builder Daemon', 'Automatically upgrades lowest level towers when funds are available.', prestige.daemons.autoBuilderLevel, 500, <Cpu size={24} />)}
              {renderUpgrade('autoOverclock', 'Auto-Overclock Script', 'Automatically triggers Overclock on random towers periodically.', prestige.daemons.autoOverclockLevel, 1000, <Zap size={24} />)}
            </div>
          </section>
        </div>

        <div className="flex justify-center gap-4">
          <button
            onClick={onBack}
            className="cyber-button px-8 py-3 bg-gray-900/80 hover:bg-gray-800 text-gray-400 font-bold tracking-widest uppercase border border-gray-700 transition-all flex items-center gap-2 hover:shadow-[0_0_15px_rgba(156,163,175,0.4)]"
          >
            <ArrowLeft size={20} />
            Disconnect
          </button>
          <button
            onClick={onMainMenu}
            className="cyber-button px-8 py-3 bg-gray-900/80 hover:bg-gray-800 text-gray-300 font-bold tracking-widest uppercase border border-gray-600 transition-all hover:shadow-[0_0_15px_rgba(156,163,175,0.4)]"
          >
            Main Menu
          </button>
        </div>
      </div>
    </div>
  );
};
