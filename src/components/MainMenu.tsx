import React from 'react';
import { Shield, Zap, Crosshair, Skull, Coins, Heart, Cpu, ShieldAlert, BookOpen, Play } from 'lucide-react';

interface MainMenuProps {
  onSafehouse: () => void;
  onHowToPlay: () => void;
  onStart: () => void;
  onTutorial: () => void;
  onEndless: () => void;
}

export function MainMenu({ onSafehouse, onHowToPlay, onStart, onTutorial, onEndless }: MainMenuProps) {
  return (
    <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center relative overflow-hidden font-mono selection:bg-cyan-900">
      {/* Animated grid background */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(0,255,136,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(0,255,136,0.1)_1px,transparent_1px)] bg-[size:50px_50px] [transform:perspective(800px)_rotateX(65deg)_translateZ(0)] origin-bottom opacity-50 animate-pulse"></div>
      
      {/* Neon glows */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-cyan-500/20 blur-[150px] rounded-full pointer-events-none animate-pulse"></div>
      <div className="absolute top-1/3 left-1/3 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-purple-500/15 blur-[120px] rounded-full pointer-events-none animate-pulse" style={{ animationDelay: '0.5s' }}></div>
      <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-pink-500/10 blur-[120px] rounded-full pointer-events-none animate-pulse" style={{ animationDelay: '1s' }}></div>

      {/* Scanlines overlay */}
      <div className="absolute inset-0 bg-[repeating-linear-gradient(0deg,rgba(0,0,0,.15),rgba(0,0,0,.15)_1px,transparent_1px,transparent_2px)] pointer-events-none z-20 opacity-20"></div>

      {/* Content */}
      <div className="z-10 flex flex-col items-center">
        <div className="flex flex-col items-center mb-20 gap-4">
          {/* Logo with glitch effect */}
          <div className="relative">
            <h1 
              className="text-7xl md:text-9xl text-[#ff0055] tracking-[0.2em] font-black text-center drop-shadow-[0_0_30px_rgba(255,0,85,0.8)] animate-pulse"
              style={{ fontFamily: '"Courier New", monospace', textShadow: '3px 3px 0px rgba(255,0,85,0.5)' }}
            >
              NEON
            </h1>
            <div className="absolute inset-0 text-[#00ffff] opacity-50 text-7xl md:text-9xl font-black tracking-[0.2em]" style={{ fontFamily: '"Courier New", monospace', transform: 'translateX(2px) translateY(2px)', textShadow: '2px 2px 0px rgba(0,255,255,0.3)' }}>
              NEON
            </div>
          </div>
          
          <h1 
            className="text-7xl md:text-9xl text-[#ff8800] tracking-[0.2em] font-black text-center drop-shadow-[0_0_30px_rgba(255,136,0,0.8)]"
            style={{ fontFamily: '"Courier New", monospace', textShadow: '3px 3px 0px rgba(255,136,0,0.5)' }}
          >
            TRENCH
          </h1>
          
          <h2 
            className="text-5xl md:text-7xl text-[#00ff88] tracking-[0.3em] font-black uppercase text-center drop-shadow-[0_0_25px_rgba(0,255,136,0.8)] animate-pulse"
            style={{ fontFamily: '"Courier New", monospace', animationDuration: '1.5s' }}
          >
            DEFENSE
          </h2>

          {/* Subtitle */}
          <p className="text-sm md:text-base text-cyan-300 tracking-[0.2em] mt-4 opacity-80 animate-pulse" style={{ fontFamily: '"Courier New", monospace', animationDelay: '0.3s' }}>
            [ NEURAL LINK ENGAGED ]
          </p>
        </div>

        <div className="flex flex-col gap-4 w-80">
          <button 
            onClick={onStart}
            className="cyber-button group relative px-8 py-4 bg-gradient-to-r from-cyan-950/80 to-cyan-900/80 hover:from-cyan-900 hover:to-cyan-800 text-cyan-100 font-bold text-xl border border-cyan-500 transition-all shadow-[0_0_20px_rgba(34,211,238,0.5)] hover:shadow-[0_0_30px_rgba(34,211,238,0.8)] overflow-hidden cursor-pointer flex items-center justify-center gap-3 uppercase tracking-widest"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-cyan-400/20 to-transparent -translate-x-[100%] group-hover:translate-x-[100%] transition-transform duration-500"></div>
            <Play className="text-cyan-400 group-hover:scale-110 transition-transform" size={24} />
            <span>CAMPAIGN</span>
          </button>

          <button 
            onClick={onEndless}
            className="cyber-button group relative px-8 py-4 bg-gradient-to-r from-red-950/80 to-red-900/80 hover:from-red-900 hover:to-red-800 text-red-100 font-bold text-xl border border-red-500 transition-all shadow-[0_0_20px_rgba(239,68,68,0.5)] hover:shadow-[0_0_30px_rgba(239,68,68,0.8)] overflow-hidden cursor-pointer flex items-center justify-center gap-3 uppercase tracking-widest"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-red-400/20 to-transparent -translate-x-[100%] group-hover:translate-x-[100%] transition-transform duration-500"></div>
            <Skull className="text-red-400 group-hover:scale-110 transition-transform" size={24} />
            <span>ENDLESS MODE</span>
          </button>

          <button 
            onClick={onTutorial}
            className="cyber-button group relative px-8 py-4 bg-gradient-to-r from-teal-950/80 to-teal-900/80 hover:from-teal-900 hover:to-teal-800 text-teal-100 font-bold text-xl border border-teal-500 transition-all shadow-[0_0_20px_rgba(20,184,166,0.5)] hover:shadow-[0_0_30px_rgba(20,184,166,0.8)] overflow-hidden cursor-pointer flex items-center justify-center gap-3 uppercase tracking-widest"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-teal-400/20 to-transparent -translate-x-[100%] group-hover:translate-x-[100%] transition-transform duration-500"></div>
            <Cpu className="text-teal-400 group-hover:scale-110 transition-transform" size={24} />
            <span>TUTORIAL AI</span>
          </button>

          <button 
            onClick={onSafehouse}
            className="cyber-button group relative px-8 py-4 bg-gradient-to-r from-purple-950/80 to-purple-900/80 hover:from-purple-900 hover:to-purple-800 text-purple-100 font-bold text-xl border border-purple-500 transition-all shadow-[0_0_20px_rgba(168,85,247,0.5)] hover:shadow-[0_0_30px_rgba(168,85,247,0.8)] overflow-hidden cursor-pointer flex items-center justify-center gap-3 uppercase tracking-widest"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-purple-400/20 to-transparent -translate-x-[100%] group-hover:translate-x-[100%] transition-transform duration-500"></div>
            <ShieldAlert className="text-purple-400 group-hover:scale-110 transition-transform" size={24} />
            <span>SAFEHOUSE</span>
          </button>

          <button 
            onClick={onHowToPlay}
            className="cyber-button group relative px-8 py-4 bg-gradient-to-r from-yellow-950/80 to-yellow-900/80 hover:from-yellow-900 hover:to-yellow-800 text-yellow-100 font-bold text-xl border border-yellow-500 transition-all shadow-[0_0_20px_rgba(234,179,8,0.5)] hover:shadow-[0_0_30px_rgba(234,179,8,0.8)] overflow-hidden cursor-pointer flex items-center justify-center gap-3 uppercase tracking-widest"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-yellow-400/20 to-transparent -translate-x-[100%] group-hover:translate-x-[100%] transition-transform duration-500"></div>
            <BookOpen className="text-yellow-400 group-hover:scale-110 transition-transform" size={24} />
            <span>HOW TO PLAY</span>
          </button>
        </div>

        {/* Footer text */}
        <p className="text-xs text-gray-500 tracking-[0.1em] mt-12 opacity-60">
          &gt; SYSTEM ONLINE | NEURAL LINK DETECTED
        </p>
      </div>
    </div>
  );
}
