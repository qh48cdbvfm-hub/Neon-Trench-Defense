import React from 'react';
import { GameState } from '../game/types';
import { Cpu, Eye, Zap, Target, Maximize, Database, Building2 } from 'lucide-react';

interface HubProps {
  gameState: GameState;
  onStartGame: (isEndless: boolean) => void;
  onUpgrade: (upgradeKey: keyof GameState['upgrades'], cost: number) => void;
  onDarkWeb: () => void;
  onGacha?: () => void;
  onMainMenu: () => void;
}

export const Hub: React.FC<HubProps> = ({ gameState, onStartGame, onUpgrade, onDarkWeb, onGacha, onMainMenu }) => {
  const renderUpgrade = (
    key: keyof GameState['upgrades'],
    name: string,
    desc: string,
    cost: number,
    icon: React.ReactNode
  ) => {
    const isOwned = gameState.upgrades[key];
    const canAfford = gameState.dataFragments >= cost;

    return (
      <div className={`p-4 border rounded flex items-center justify-between transition-colors ${isOwned ? 'bg-cyan-900/40 border-cyan-500' : 'bg-gray-900 border-gray-700'}`}>
        <div className="flex items-center gap-4">
          <div className={`p-3 rounded-full ${isOwned ? 'bg-cyan-500/20 text-cyan-400' : 'bg-gray-800 text-gray-500'}`}>
            {icon}
          </div>
          <div>
            <h3 className={`font-bold ${isOwned ? 'text-cyan-400' : 'text-gray-300'}`}>{name}</h3>
            <p className="text-sm text-gray-500">{desc}</p>
          </div>
        </div>
        <div>
          {isOwned ? (
            <span className="text-cyan-500 font-bold tracking-widest uppercase text-sm">Installed</span>
          ) : (
            <button
              onClick={() => onUpgrade(key, cost)}
              disabled={!canAfford}
              className={`px-4 py-2 rounded font-bold transition-colors ${canAfford ? 'bg-purple-600 hover:bg-purple-500 text-white' : 'bg-gray-800 text-gray-600 cursor-not-allowed'}`}
            >
              {cost} Fragments
            </button>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#0a0a12] text-white p-8 flex flex-col items-center font-sans">
      <div className="max-w-4xl w-full">
        <header className="flex justify-between items-end border-b border-cyan-900 pb-4 mb-8">
          <div>
            <h1 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-500 tracking-tighter">
              NEON TRENCH
            </h1>
            <p className="text-cyan-600 tracking-widest text-sm uppercase mt-1 flex items-center gap-2">
              <Building2 size={14} />
              {gameState.corp ? gameState.corp.name : 'Safehouse // Hub'}
            </p>
          </div>
          <div className="flex gap-8 text-right">
            <div>
              <div className="text-purple-400 font-mono text-2xl flex items-center gap-2 justify-end">
                <Cpu size={24} />
                {gameState.dataFragments}
              </div>
              <p className="text-gray-500 text-xs uppercase tracking-widest">Data Fragments</p>
            </div>
            <div>
              <div className="text-red-400 font-mono text-2xl flex items-center gap-2 justify-end">
                <Database size={24} />
                {gameState.prestige.sourceCode}
              </div>
              <p className="text-gray-500 text-xs uppercase tracking-widest">Source Code</p>
            </div>
          </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
          {/* Hardware Bench */}
          <section>
            <h2 className="text-xl font-bold text-cyan-500 mb-4 flex items-center gap-2">
              <Target size={20} />
              Hardware Bench
            </h2>
            <div className="space-y-4">
              {renderUpgrade('ricochet', 'Ricochet Rounds', 'Shredder Turret bullets bounce to 1 additional target.', 15, <Target size={24} />)}
              {renderUpgrade('widerSlag', 'Thermal Expansion', 'Plasma Bombard slag pools have 50% larger radius.', 20, <Maximize size={24} />)}
            </div>
          </section>

          {/* Ripperdoc */}
          <section>
            <h2 className="text-xl font-bold text-purple-500 mb-4 flex items-center gap-2">
              <Zap size={20} />
              Ripperdoc
            </h2>
            <div className="space-y-4">
              {renderUpgrade('opticalCybereye', 'Optical Cybereye', 'Increases attack range of all towers by 15%.', 25, <Eye size={24} />)}
              {renderUpgrade('creditChip', 'Subdermal Credit Chip', 'Start every mission with +15% Crypto-Creds.', 30, <Cpu size={24} />)}
              {renderUpgrade('synapticAccelerator', 'Synaptic Accelerator', 'Reduces hack cooldowns by 20%.', 35, <Zap size={24} />)}
            </div>
          </section>
        </div>

        <div className="flex justify-center gap-6">
          {onGacha && (
            <button
              onClick={onGacha}
              className="cyber-button flex items-center justify-center text-center px-12 py-4 bg-yellow-900/80 hover:bg-yellow-700 text-yellow-100 font-black text-xl tracking-widest uppercase border border-yellow-500 shadow-[0_0_20px_rgba(234,179,8,0.5)] transition-all hover:shadow-[0_0_30px_rgba(234,179,8,0.8)]"
            >
              <span className="pl-[0.1em]">Gacha</span>
            </button>
          )}
          <button
            onClick={onDarkWeb}
            className="cyber-button flex items-center justify-center text-center px-12 py-4 bg-red-900/80 hover:bg-red-700 text-red-100 font-black text-xl tracking-widest uppercase border border-red-500 shadow-[0_0_20px_rgba(220,38,38,0.5)] transition-all hover:shadow-[0_0_30px_rgba(220,38,38,0.8)]"
          >
            <span className="pl-[0.1em]">Dark Web</span>
          </button>
          <button
            onClick={() => onStartGame(false)}
            className="cyber-button flex items-center justify-center text-center px-8 py-4 bg-cyan-900/80 hover:bg-cyan-700 text-cyan-100 font-black text-xl tracking-widest uppercase border border-cyan-500 shadow-[0_0_20px_rgba(8,145,178,0.5)] transition-all hover:shadow-[0_0_30px_rgba(8,145,178,0.8)]"
          >
            <span className="pl-[0.1em]">Campaign</span>
          </button>
          <button
            onClick={() => onStartGame(true)}
            className="cyber-button flex items-center justify-center text-center px-8 py-4 bg-purple-900/80 hover:bg-purple-700 text-purple-100 font-black text-xl tracking-widest uppercase border border-purple-500 shadow-[0_0_20px_rgba(147,51,234,0.5)] transition-all hover:shadow-[0_0_30px_rgba(147,51,234,0.8)]"
          >
            <span className="pl-[0.1em]">Endless</span>
          </button>
          <button
            onClick={onMainMenu}
            className="cyber-button flex items-center justify-center text-center px-8 py-4 bg-gray-900/80 hover:bg-gray-800 text-gray-300 font-black text-xl tracking-widest uppercase border border-gray-600 transition-all hover:shadow-[0_0_15px_rgba(156,163,175,0.4)]"
          >
            <span className="pl-[0.1em]">Main Menu</span>
          </button>
        </div>
      </div>
    </div>
  );
};
