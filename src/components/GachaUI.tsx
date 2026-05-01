import React, { useState } from 'react';
import { GameState, TowerType } from '../game/types';
import { TOWER_STATS } from '../game/constants';
import { Package, X, Sparkles } from 'lucide-react';

interface GachaUIProps {
  gameState: GameState;
  onClose: () => void;
  onPull: (amount: number) => void;
}

export const GachaUI: React.FC<GachaUIProps> = ({ gameState, onClose, onPull }) => {
  const [pullResult, setPullResult] = useState<TowerType[] | null>(null);

  const handlePull = (amount: number) => {
    const cost = amount * 10; // 10 fragments per pull
    if (gameState.dataFragments >= cost) {
      // Capture inventory before pull
      const beforeInventory = { ...gameState.inventory };
      onPull(amount);
      
      // Calculate what was pulled
      const pulled: TowerType[] = [];
      Object.values(TowerType).forEach(type => {
        const afterCount = gameState.inventory[type as TowerType] || 0;
        const beforeCount = beforeInventory[type as TowerType] || 0;
        const diff = afterCount - beforeCount;
        for (let i = 0; i < diff; i++) {
          pulled.push(type as TowerType);
        }
      });
      setPullResult(pulled);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4 font-mono text-cyan-50">
      <div className="max-w-4xl w-full bg-gray-900 border-2 border-yellow-500 p-8 rounded-lg shadow-[0_0_50px_rgba(234,179,8,0.2)] relative">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-white transition-colors"
        >
          <X size={24} />
        </button>

        <div className="flex items-center gap-3 mb-8 border-b border-yellow-900 pb-4">
          <Package size={32} className="text-yellow-400" />
          <h2 className="text-3xl font-black text-yellow-400 tracking-widest uppercase">Black Market Gacha</h2>
        </div>

        {pullResult ? (
          <div className="text-center py-8">
            <h3 className="text-2xl font-bold text-yellow-400 mb-8">Acquired Blueprints</h3>
            <div className="flex flex-wrap justify-center gap-4 mb-8">
              {pullResult.map((type, i) => {
                const stats = TOWER_STATS[type];
                return (
                  <div key={i} className="p-4 bg-gray-800 border-2 rounded w-32 animate-pulse" style={{ borderColor: stats.color }}>
                    <div className="text-sm font-bold truncate mb-2" style={{ color: stats.color }}>{stats.name}</div>
                    <Package size={32} className="mx-auto" style={{ color: stats.color }} />
                  </div>
                );
              })}
            </div>
            <button
              onClick={() => setPullResult(null)}
              className="cyber-button px-8 py-3 bg-gray-800/80 hover:bg-gray-700 text-gray-300 font-bold border border-gray-600 transition-colors uppercase tracking-widest"
            >
              Continue
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <h3 className="text-xl font-bold text-cyan-400 mb-4">Pull for Tower Cards</h3>
              <p className="text-gray-400 mb-6">Spend Data Fragments to acquire new tower blueprints. Duplicate cards can be used to upgrade towers in-game.</p>
              
              <div className="space-y-4">
                <button
                  onClick={() => handlePull(1)}
                  disabled={gameState.dataFragments < 10}
                  className="cyber-button w-full py-4 bg-gray-800/80 hover:bg-gray-700 text-white font-bold border border-yellow-500/50 transition-all disabled:opacity-50 flex justify-between items-center px-6"
                >
                  <span>1x Pull</span>
                  <span className="text-yellow-400">10 Fragments</span>
                </button>
                <button
                  onClick={() => handlePull(10)}
                  disabled={gameState.dataFragments < 100}
                  className="cyber-button w-full py-4 bg-yellow-900/50 hover:bg-yellow-800/50 text-white font-bold border border-yellow-500 transition-all disabled:opacity-50 flex justify-between items-center px-6 shadow-[0_0_15px_rgba(234,179,8,0.3)]"
                >
                  <span className="flex items-center gap-2"><Sparkles size={18} className="text-yellow-400" /> 10x Pull</span>
                  <span className="text-yellow-400">100 Fragments</span>
                </button>
              </div>
              
              <div className="mt-8 p-4 bg-black/50 rounded border border-gray-800">
                <div className="text-sm text-gray-500 uppercase tracking-widest mb-2">Current Balance</div>
                <div className="text-3xl font-mono text-cyan-400">{gameState.dataFragments} Fragments</div>
              </div>
            </div>

            <div>
              <h3 className="text-xl font-bold text-purple-400 mb-4">Your Inventory</h3>
              <div className="grid grid-cols-2 gap-2 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                {Object.values(TowerType).map(type => {
                  const count = gameState.inventory[type as TowerType] || 0;
                  const stats = TOWER_STATS[type as TowerType];
                  if (!stats) return null;
                  
                  return (
                    <div key={type} className={`p-3 rounded border ${count > 0 ? 'bg-gray-800 border-gray-600' : 'bg-gray-900 border-gray-800 opacity-50'}`}>
                      <div className="font-bold text-sm truncate" style={{ color: stats.color }}>{stats.name}</div>
                      <div className="text-2xl font-mono mt-1">{count}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
