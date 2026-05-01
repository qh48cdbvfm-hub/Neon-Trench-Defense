import React from 'react';
import { GameState } from '../game/types';
import { Cpu, Thermometer, Zap, Coins, X } from 'lucide-react';

interface MainframeUIProps {
  gameState: GameState;
  onClose: () => void;
  onAllocate: (type: 'attackSpeed' | 'credGen', value: number) => void;
  onUpgradeCooling: () => void;
}

export const MainframeUI: React.FC<MainframeUIProps> = ({ gameState, onClose, onAllocate, onUpgradeCooling }) => {
  const { mainframe, credits } = gameState;
  if (!mainframe) return null;

  const coolingCost = Math.floor(500 * Math.pow(1.5, mainframe.coolingLevel - 1));
  const canAffordCooling = credits >= coolingCost;

  const totalAllocation = mainframe.allocations.attackSpeed + mainframe.allocations.credGen;
  const heatGen = (totalAllocation / 100) * 5;
  const cooling = mainframe.coolingLevel * 2;
  const netHeat = heatGen - cooling;

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 font-mono">
      <div className="bg-gray-950 border-2 border-purple-500 rounded-lg shadow-[0_0_30px_rgba(168,85,247,0.3)] w-full max-w-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-purple-900/50 p-4 flex justify-between items-center border-b border-purple-500">
          <div className="flex items-center gap-3">
            <Cpu className="text-purple-400" size={28} />
            <div>
              <h2 className="text-xl font-bold text-purple-100 tracking-widest uppercase">Mainframe Access</h2>
              <p className="text-xs text-purple-300">Processing Power: {mainframe.processingPower} THz</p>
            </div>
          </div>
          <button onClick={onClose} className="text-purple-300 hover:text-white transition-colors">
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-8">
          
          {/* Heat Status */}
          <div className="bg-gray-900 border border-gray-700 p-4 rounded-lg relative overflow-hidden">
            <div 
              className="absolute inset-0 bg-red-500/20 transition-all duration-500"
              style={{ width: `${mainframe.heat}%` }}
            />
            <div className="relative z-10 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Thermometer className={mainframe.heat > 80 ? 'text-red-500 animate-pulse' : 'text-orange-500'} />
                <span className="font-bold text-gray-200">Core Temperature</span>
              </div>
              <div className="text-right">
                <div className={`text-2xl font-black ${mainframe.heat > 80 ? 'text-red-500' : 'text-orange-400'}`}>
                  {Math.floor(mainframe.heat)}%
                </div>
                <div className="text-xs text-gray-400">
                  Net Heat: {netHeat > 0 ? '+' : ''}{netHeat.toFixed(1)}/s
                </div>
              </div>
            </div>
          </div>

          {/* Allocations */}
          <div className="space-y-6">
            <h3 className="text-purple-400 font-bold uppercase tracking-widest border-b border-purple-900/50 pb-2">Resource Allocation</h3>
            
            {/* Attack Speed Slider */}
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-gray-300 flex items-center gap-2"><Zap size={16} className="text-yellow-400"/> Overclock Towers</span>
                <span className="text-yellow-400 font-bold">{mainframe.allocations.attackSpeed}%</span>
              </div>
              <input 
                type="range" 
                min="0" 
                max="100" 
                value={mainframe.allocations.attackSpeed}
                onChange={(e) => onAllocate('attackSpeed', parseInt(e.target.value))}
                className="w-full accent-yellow-500"
              />
              <p className="text-xs text-gray-500 mt-1">Increases tower fire rate up to 50%.</p>
            </div>

            {/* Cred Gen Slider */}
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-gray-300 flex items-center gap-2"><Coins size={16} className="text-green-400"/> Crypto Mining</span>
                <span className="text-green-400 font-bold">{mainframe.allocations.credGen}%</span>
              </div>
              <input 
                type="range" 
                min="0" 
                max="100" 
                value={mainframe.allocations.credGen}
                onChange={(e) => onAllocate('credGen', parseInt(e.target.value))}
                className="w-full accent-green-500"
              />
              <p className="text-xs text-gray-500 mt-1">Generates passive income based on Processing Power.</p>
            </div>
          </div>

          {/* Upgrades */}
          <div className="pt-4 border-t border-gray-800 flex justify-between items-center">
            <div>
              <div className="font-bold text-blue-400">Liquid Cooling System LVL {mainframe.coolingLevel}</div>
              <div className="text-xs text-gray-500">Dissipates 2 heat/s per level.</div>
            </div>
            <button
              onClick={onUpgradeCooling}
              disabled={!canAffordCooling}
              className={`px-4 py-2 rounded font-bold transition-colors flex items-center gap-2 ${canAffordCooling ? 'bg-blue-900 hover:bg-blue-700 text-blue-100' : 'bg-gray-800 text-gray-600 cursor-not-allowed'}`}
            >
              <Coins size={16} />
              {coolingCost}
            </button>
          </div>

        </div>
      </div>
    </div>
  );
};
