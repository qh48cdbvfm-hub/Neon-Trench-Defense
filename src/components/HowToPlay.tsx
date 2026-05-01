import React from 'react';
import { Shield, Zap, Crosshair, Skull, Coins, Heart, Cpu, ShieldAlert, BookOpen, ArrowLeft, Info } from 'lucide-react';

interface HowToPlayProps {
  onMainMenu: () => void;
}

export function HowToPlay({ onMainMenu }: HowToPlayProps) {
  return (
    <div className="min-h-screen bg-gray-950 text-cyan-50 font-mono p-8 overflow-y-auto custom-scrollbar selection:bg-cyan-900">
      <div className="max-w-4xl mx-auto">
        
        <div className="flex items-center justify-between mb-8 border-b border-cyan-900 pb-4">
          <h1 className="text-4xl font-bold text-cyan-400 tracking-widest uppercase drop-shadow-[0_0_8px_rgba(34,211,238,0.8)] flex items-center gap-4">
            <BookOpen className="text-purple-400" size={40} />
            Data Nexus Archives
          </h1>
          <button 
            onClick={onMainMenu}
            className="px-4 py-2 bg-gray-900 hover:bg-gray-800 text-gray-300 font-bold rounded border border-gray-700 transition-all cursor-pointer flex items-center gap-2"
          >
            <ArrowLeft size={18} /> MAIN MENU
          </button>
        </div>

        <div className="space-y-12 pb-12">
          
          {/* Basics */}
          <section className="bg-gray-900/50 p-6 rounded-lg border border-gray-800">
            <h2 className="text-2xl font-bold text-purple-400 mb-4 flex items-center gap-2">
              <Info /> The Basics
            </h2>
            <p className="text-gray-300 mb-4 leading-relaxed">
              Defend the Data Nexus from incoming waves of rogue AI and cyber-mutants. Build towers along the grid to destroy enemies before they reach the end of the path.
            </p>
            <ul className="list-disc list-inside text-gray-400 space-y-2 ml-2">
              <li><strong className="text-red-400">Lives (Hearts):</strong> You lose 1 life for every enemy that breaches the Nexus. Lose all lives, and it's Game Over.</li>
              <li><strong className="text-green-400">Crypto-Creds (Coins):</strong> Earned by destroying enemies. Used to build and upgrade towers.</li>
              <li><strong className="text-cyan-400">Data Fragments:</strong> Rare drops from enemies. Used in the Safehouse to buy permanent meta-upgrades.</li>
            </ul>
          </section>

          {/* Towers */}
          <section>
            <h2 className="text-2xl font-bold text-cyan-400 mb-6 border-b border-cyan-900/50 pb-2">Arsenal (Towers)</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-gray-900 p-4 rounded border border-gray-800">
                <h3 className="font-bold text-lg text-[#00ffff] mb-1">Shredder Turret</h3>
                <p className="text-sm text-gray-400">Fast-firing kinetic weapon. Good against weak swarms. Can be upgraded to ricochet.</p>
              </div>
              <div className="bg-gray-900 p-4 rounded border border-gray-800">
                <h3 className="font-bold text-lg text-[#ff00ff] mb-1">Plasma Bombard</h3>
                <p className="text-sm text-gray-400">Slow, heavy splash damage. Excellent against clustered enemies. High levels leave damaging slag pools.</p>
              </div>
              <div className="bg-gray-900 p-4 rounded border border-gray-800">
                <h3 className="font-bold text-lg text-[#ffff00] mb-1">EMP Emitter</h3>
                <p className="text-sm text-gray-400">Deals no damage, but slows enemies in a radius. High levels completely freeze enemies.</p>
              </div>
              <div className="bg-gray-900 p-4 rounded border border-gray-800">
                <h3 className="font-bold text-lg text-[#00ff00] mb-1">Net-Node</h3>
                <p className="text-sm text-gray-400">Generates Crypto-Creds over time. Essential for long-term economy. Can be hijacked by hackers.</p>
              </div>
              <div className="bg-gray-900 p-4 rounded border border-gray-800">
                <h3 className="font-bold text-lg text-[#ff8800] mb-1">Chem-Sprayer</h3>
                <p className="text-sm text-gray-400">Applies toxic sludge that damages over time and slows enemies. Enables Ignition combos.</p>
              </div>
              <div className="bg-gray-900 p-4 rounded border border-gray-800">
                <h3 className="font-bold text-lg text-[#aaaaaa] mb-1">Holo-Decoy</h3>
                <p className="text-sm text-gray-400">Attracts and slows nearby enemies. Great for grouping them up for Plasma Bombards.</p>
              </div>
              <div className="bg-gray-900 p-4 rounded border border-gray-800">
                <h3 className="font-bold text-lg text-[#ffffff] mb-1">Scanner Node</h3>
                <p className="text-sm text-gray-400">Reveals cloaked Ghost enemies in a massive radius, allowing other towers to target them.</p>
              </div>
            </div>
          </section>

          {/* Enemies */}
          <section>
            <h2 className="text-2xl font-bold text-red-400 mb-6 border-b border-red-900/50 pb-2">Threat Database (Enemies)</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-gray-900 p-4 rounded border border-gray-800">
                <h3 className="font-bold text-lg text-[#00ff00] mb-1">Scum</h3>
                <p className="text-sm text-gray-400">Basic infantry. Weak but numerous.</p>
              </div>
              <div className="bg-gray-900 p-4 rounded border border-gray-800">
                <h3 className="font-bold text-lg text-[#ff9900] mb-1">Biker</h3>
                <p className="text-sm text-gray-400">Fast-moving scout. Requires quick-firing towers to catch.</p>
              </div>
              <div className="bg-gray-900 p-4 rounded border border-gray-800">
                <h3 className="font-bold text-lg text-[#cccccc] mb-1">Shield-Bot</h3>
                <p className="text-sm text-gray-400">Slow but heavily armored. Requires sustained fire or heavy plasma.</p>
              </div>
              <div className="bg-gray-900 p-4 rounded border border-gray-800">
                <h3 className="font-bold text-lg text-[#33ccff] mb-1">Drone</h3>
                <p className="text-sm text-gray-400">Flying unit. Can only be hit by specific anti-air towers (if available) or hijacked by Black-ICE Net-Nodes.</p>
              </div>
              <div className="bg-gray-900 p-4 rounded border border-gray-800">
                <h3 className="font-bold text-lg text-[#ff0000] mb-1">Cyber-Psycho</h3>
                <p className="text-sm text-gray-400">Mini-boss. Regenerates health over time. Focus fire is required.</p>
              </div>
              <div className="bg-gray-900 p-4 rounded border border-gray-800">
                <h3 className="font-bold text-lg text-[#660000] mb-1">Arachno-Tank</h3>
                <p className="text-sm text-gray-400">Massive boss. Periodically emits EMP blasts that disable nearby towers.</p>
              </div>
              <div className="bg-gray-900 p-4 rounded border border-gray-800">
                <h3 className="font-bold text-lg text-[#33ff33] mb-1">Mutant</h3>
                <p className="text-sm text-gray-400">Immune to EMP stun/slow effects. Must be killed with raw damage.</p>
              </div>
              <div className="bg-gray-900 p-4 rounded border border-gray-800">
                <h3 className="font-bold text-lg text-[#ffffff] mb-1">Ghost</h3>
                <p className="text-sm text-gray-400">Cloaked and untargetable until revealed by a Scanner Node.</p>
              </div>
              <div className="bg-gray-900 p-4 rounded border border-gray-800">
                <h3 className="font-bold text-lg text-[#ffff00] mb-1">Hacker</h3>
                <p className="text-sm text-gray-400">Periodically stuns your towers. <strong className="text-cyan-300">Overclocked towers are immune to being hacked/stunned.</strong></p>
              </div>
            </div>
          </section>

          {/* Synergies & Strategies */}
          <section className="bg-gray-900/50 p-6 rounded-lg border border-gray-800">
            <h2 className="text-2xl font-bold text-yellow-400 mb-4 flex items-center gap-2">
              <Zap /> Synergies & Tactics
            </h2>
            <ul className="space-y-4 text-gray-300">
              <li>
                <strong className="text-cyan-300 block mb-1">Shatter Combo:</strong> 
                Shredder Turrets deal <span className="text-white font-bold">3x damage</span> to enemies that are completely frozen by high-level EMP Emitters.
              </li>
              <li>
                <strong className="text-orange-400 block mb-1">Ignition Combo:</strong> 
                Plasma Bombards deal <span className="text-white font-bold">2x damage</span> to enemies covered in Chem-Sprayer sludge, triggering a secondary explosion.
              </li>
              <li>
                <strong className="text-red-400 block mb-1">Overclocking & Hack Prevention:</strong> 
                You can manually Overclock a tower to double its damage and fire rate temporarily. <span className="text-white font-bold">While Overclocked, a tower cannot be stunned by Hackers.</span> Use this defensively when Hackers approach! Warning: Towers will overheat and shut down temporarily after the overclock ends.
              </li>
              <li>
                <strong className="text-purple-400 block mb-1">Cyber-Deck Hacks:</strong> 
                Use your active abilities (Grid Blackout, Orbital Laser, System Override) in emergencies. They have long cooldowns but can save your life.
              </li>
            </ul>
          </section>

          {/* Advanced Systems */}
          <section className="bg-gray-900/50 p-6 rounded-lg border border-gray-800">
            <h2 className="text-2xl font-bold text-blue-400 mb-4 flex items-center gap-2">
              <Cpu /> Advanced Systems
            </h2>
            <ul className="space-y-4 text-gray-300">
              <li>
                <strong className="text-pink-400 block mb-1">Edgerunners (Mercs):</strong> 
                You can hire a single Edgerunner (Mercenary) to patrol the trench. They move independently and attack enemies. You can only have <span className="text-white font-bold">one Edgerunner deployed at a time</span>. Choose wisely between the fast Street Samurai, the tanky Heavy-Borg, or the supportive Combat Medic.
              </li>
              <li>
                <strong className="text-purple-400 block mb-1">The Mainframe:</strong> 
                In Endless Mode, access the Mainframe to allocate processing power. You can boost global attack speed or passive credit generation. Watch the heat levels! If the Mainframe overheats, your allocations will reset. Upgrade cooling to handle more processing power.
              </li>
              <li>
                <strong className="text-yellow-400 block mb-1">Gacha System:</strong> 
                Visit the Hub to spend Data Fragments on the Gacha machine. You can pull rare, epic, or legendary items that provide permanent buffs or unique towers for your future runs.
              </li>
              <li>
                <strong className="text-red-500 block mb-1">Burn Notice (Prestige):</strong> 
                When things get too hot in Endless Mode, you can trigger a Burn Notice. This wipes your current run (destroying all towers and resetting your wave progress) but extracts <span className="text-white font-bold">Source Code</span>. Spend Source Code in the Dark Web for powerful, permanent meta-upgrades like global damage multipliers and AI Daemons.
              </li>
            </ul>
          </section>

          {/* Deep Dive */}
          <section className="bg-red-950/30 p-6 rounded-lg border border-red-900/50">
            <h2 className="text-2xl font-bold text-red-500 mb-4 flex items-center gap-2">
              <Skull /> Deep Dive (Endless Mode)
            </h2>
            <p className="text-gray-300 mb-4 leading-relaxed">
              After clearing the 13-wave campaign, you unlock the Deep Dive. This is an endless survival mode with procedurally generated, infinitely scaling waves.
            </p>
            <ul className="list-disc list-inside text-gray-400 space-y-2 ml-2">
              <li>Enemy health and numbers scale infinitely.</li>
              <li>Every 10 waves, a <strong className="text-green-400">Glitch Event</strong> occurs, granting you massive bonuses like free credits, extra lives, or instant tower upgrades.</li>
              <li>Survive as long as possible to farm Data Fragments for the Safehouse.</li>
            </ul>
          </section>

        </div>
      </div>
    </div>
  );
}
