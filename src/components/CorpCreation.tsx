import React, { useState } from 'react';
import { Building2, ChevronRight } from 'lucide-react';

interface CorpCreationProps {
  onComplete: (name: string, color: string) => void;
  onBack: () => void;
}

const COLORS = ['#00ff00', '#ff00ff', '#00ffff', '#ff3333', '#ff9900', '#ffffff'];

export const CorpCreation: React.FC<CorpCreationProps> = ({ onComplete, onBack }) => {
  const [name, setName] = useState('');
  const [color, setColor] = useState(COLORS[0]);

  return (
    <div className="min-h-screen w-full bg-gray-950 flex flex-col items-center justify-center p-4 font-mono text-cyan-50">
      <div className="max-w-md w-full bg-gray-900 border border-cyan-900 p-8 rounded-lg shadow-[0_0_30px_rgba(34,211,238,0.1)]">
        <div className="flex items-center gap-3 mb-8 justify-center">
          <Building2 size={32} className="text-cyan-400" />
          <h1 className="text-2xl font-bold text-cyan-400 tracking-widest uppercase">Register Mega-Corp</h1>
        </div>

        <div className="space-y-6">
          <div>
            <label className="block text-sm text-cyan-300 mb-2 uppercase tracking-wider">Corporate Designation</label>
            <input 
              type="text" 
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. OMNI-CORP"
              className="w-full bg-gray-950 border border-cyan-800 p-3 text-cyan-100 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition-all"
              maxLength={20}
            />
          </div>

          <div>
            <label className="block text-sm text-cyan-300 mb-2 uppercase tracking-wider">Brand Color</label>
            <div className="flex gap-3">
              {COLORS.map(c => (
                <button
                  key={c}
                  onClick={() => setColor(c)}
                  className={`w-10 h-10 rounded-full border-2 transition-all ${color === c ? 'border-white scale-110' : 'border-transparent hover:scale-105'}`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>

          <div className="pt-6 flex gap-4">
            <button 
              onClick={onBack}
              className="flex-1 py-3 bg-gray-800 hover:bg-gray-700 text-gray-300 font-bold uppercase tracking-wider transition-colors border border-gray-700"
            >
              Cancel
            </button>
            <button 
              onClick={() => {
                if (name.trim()) {
                  onComplete(name.trim(), color);
                }
              }}
              disabled={!name.trim()}
              className="flex-1 py-3 bg-cyan-900 hover:bg-cyan-800 text-cyan-100 font-bold uppercase tracking-wider transition-all border border-cyan-500 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Establish <ChevronRight size={18} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
