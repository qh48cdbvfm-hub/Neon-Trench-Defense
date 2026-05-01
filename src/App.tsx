import React, { useEffect, useRef, useState } from 'react';
import { GameEngine } from './game/engine';
import { Renderer } from './game/renderer';
import { GameState, TowerType, HackType, MercType } from './game/types';
import { TOWER_STATS, MAP_WIDTH, MAP_HEIGHT, GRID_SIZE, MAP_PATHS, WAVES, MERC_STATS } from './game/constants';
import { audio } from './game/audio';
import { Play, FastForward, Zap, Crosshair, Skull, Coins, Heart, ShieldAlert, Cpu, Volume2, VolumeX } from 'lucide-react';

import { Hub } from './components/Hub';
import { MainMenu } from './components/MainMenu';
import { HowToPlay } from './components/HowToPlay';
import { CorpCreation } from './components/CorpCreation';
import { DarkWeb } from './components/DarkWeb';
import { MainframeUI } from './components/MainframeUI';
import { GachaUI } from './components/GachaUI';

export default function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<GameEngine | null>(null);
  const rendererRef = useRef<Renderer | null>(null);
  const requestRef = useRef<number>(0);

  const [gameState, setGameState] = useState<GameState | null>(null);
  const [selectedTowerType, setSelectedTowerType] = useState<TowerType | null>(null);
  const [selectedMercType, setSelectedMercType] = useState<MercType | null>(null);
  const [selectedTowerId, setSelectedTowerId] = useState<string | null>(null);
  const [movingTowerId, setMovingTowerId] = useState<string | null>(null);
  const [hoverCell, setHoverCell] = useState<{ x: number; y: number } | null>(null);
  const [view, setView] = useState<'MAIN_MENU' | 'CREATE_CORP' | 'HOW_TO_PLAY' | 'HUB' | 'DARK_WEB' | 'GAME'>('MAIN_MENU');
  const [isAdminMode, setIsAdminMode] = useState(false);
  const [isMainframeOpen, setIsMainframeOpen] = useState(false);
  const [isGachaOpen, setIsGachaOpen] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(30);
  const [isTutorialMode, setIsTutorialMode] = useState(false);
  const [tutorialHint, setTutorialHint] = useState('Tutorial autopilot engaged.');

  const tutorialIntervalRef = useRef<number | null>(null);
  const tutorialStartTimeoutRef = useRef<number | null>(null);
  const tutorialWaveTimeoutRef = useRef<number | null>(null);
  const selectedTowerIdRef = useRef(selectedTowerId);
  const hoverCellRef = useRef(hoverCell);
  const keyBufferRef = useRef<string[]>([]);

  useEffect(() => {
    selectedTowerIdRef.current = selectedTowerId;
  }, [selectedTowerId]);

  useEffect(() => {
    hoverCellRef.current = hoverCell;
  }, [hoverCell]);

  useEffect(() => {
    const engine = new GameEngine();
    engineRef.current = engine;
    
    engine.onStateChange = (state) => {
      setGameState({ ...state }); // Force re-render for UI
    };
    setGameState(engine.state);

    const loop = () => {
      if (!rendererRef.current && canvasRef.current) {
        const ctx = canvasRef.current.getContext('2d');
        if (ctx) {
          rendererRef.current = new Renderer(ctx);
        }
      }

      if (engineRef.current && rendererRef.current && canvasRef.current) {
        engineRef.current.update();
        rendererRef.current.render(engineRef.current.state, hoverCellRef.current, selectedTowerIdRef.current, engineRef.current.screenShake);
      }
      requestRef.current = requestAnimationFrame(loop);
    };

    requestRef.current = requestAnimationFrame(loop);

    return () => cancelAnimationFrame(requestRef.current);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cheat code logic
      keyBufferRef.current.push(e.key);
      if (keyBufferRef.current.length > 4) {
        keyBufferRef.current.shift();
      }
      if (keyBufferRef.current.join('') === '0925') {
        setIsAdminMode(prev => !prev);
        keyBufferRef.current = []; // Reset buffer
      }

      if (e.code === 'Escape') {
        setSelectedTowerType(null);
        setSelectedMercType(null);
        setSelectedTowerId(null);
        setMovingTowerId(null);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!engineRef.current || !canvasRef.current) return;
    
    const rect = canvasRef.current.getBoundingClientRect();
    const scaleX = canvasRef.current.width / rect.width;
    const scaleY = canvasRef.current.height / rect.height;
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;
    
    const gridX = Math.floor(x / GRID_SIZE);
    const gridY = Math.floor(y / GRID_SIZE);
    const pixelX = gridX * GRID_SIZE;
    const pixelY = gridY * GRID_SIZE;

    const clickedTower = engineRef.current.state.towers.find(
      t => t.x === pixelX && t.y === pixelY
    );

    const cx = pixelX + GRID_SIZE / 2;
    const cy = pixelY + GRID_SIZE / 2;
    
    const currentMapPath = MAP_PATHS[engineRef.current.state.mapIndex || 0];
    const isPath = currentMapPath.some((p1, i) => {
      if (i === currentMapPath.length - 1) return false;
      const p2 = currentMapPath[i + 1];
      
      const l2 = Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2);
      if (l2 === 0) return Math.hypot(cx - p1.x, cy - p1.y) < 30;
      
      let t = ((cx - p1.x) * (p2.x - p1.x) + (cy - p1.y) * (p2.y - p1.y)) / l2;
      t = Math.max(0, Math.min(1, t));
      
      const projX = p1.x + t * (p2.x - p1.x);
      const projY = p1.y + t * (p2.y - p1.y);
      
      return Math.hypot(cx - projX, cy - projY) < 35; // 35 is safe distance from path center
    });

    if (movingTowerId) {
      if (clickedTower && clickedTower.id !== movingTowerId) {
        // Allow if it's the same type and level for merging
        const towerToMove = engineRef.current.state.towers.find(t => t.id === movingTowerId);
        if (!towerToMove || towerToMove.type !== clickedTower.type || towerToMove.level !== clickedTower.level) {
          audio.playError();
          return;
        }
      }
      
      const towerToMove = engineRef.current.state.towers.find(t => t.id === movingTowerId);
      if (towerToMove) {
        if ((!isPath && towerToMove.type !== TowerType.DECOY) || (isPath && towerToMove.type === TowerType.DECOY)) {
          engineRef.current.moveTower(movingTowerId, pixelX, pixelY);
          setMovingTowerId(null);
          audio.playBuild();
        } else {
          audio.playError();
        }
      } else {
        setMovingTowerId(null);
      }
      return;
    }

    if (clickedTower) {
      setSelectedTowerId(clickedTower.id);
      setSelectedTowerType(null);
      setSelectedMercType(null);
    } else if (selectedTowerType) {
      if ((!isPath && selectedTowerType !== TowerType.DECOY) || (isPath && selectedTowerType === TowerType.DECOY)) {
        if (engineRef.current.buildTower(selectedTowerType, pixelX, pixelY)) {
          audio.playBuild();
          setSelectedTowerType(null);
        } else {
          audio.playError();
        }
      } else {
        audio.playError();
      }
    } else if (selectedMercType) {
      if (engineRef.current.hireMerc(selectedMercType, pixelX, pixelY)) {
        audio.playBuild();
        setSelectedMercType(null);
      } else {
        audio.playError();
      }
    } else {
      setSelectedTowerId(null);
    }
  };

  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const scaleX = canvasRef.current.width / rect.width;
    const scaleY = canvasRef.current.height / rect.height;
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;
    setHoverCell({ x: Math.floor(x / GRID_SIZE), y: Math.floor(y / GRID_SIZE) });
  };

  const handleCanvasMouseLeave = () => {
    setHoverCell(null);
  };

  const tutorialBuildPositions = [
    { x: 120, y: 40 },
    { x: 280, y: 80 },
    { x: 420, y: 220 },
    { x: 560, y: 340 },
    { x: 720, y: 460 },
  ];

  const runTutorialActions = () => {
    const engine = engineRef.current;
    if (!engine) return;

    const state = engine.state;
    if (state.status !== 'PLAYING') return;

    // Build towers in safe positions first.
    const freePosition = tutorialBuildPositions.find((pos) =>
      !state.towers.some((tower) => tower.x === pos.x && tower.y === pos.y)
    );

    const buildOrder: TowerType[] = [TowerType.SHREDDER, TowerType.EMP, TowerType.PLASMA, TowerType.CHEM, TowerType.NET_NODE];
    const buildType = buildOrder[state.towers.length % buildOrder.length];
    const buildCost = TOWER_STATS[buildType].cost[0];

    if (freePosition && state.credits >= buildCost) {
      engine.buildTower(buildType, freePosition.x, freePosition.y);
      setTutorialHint(`Auto-building ${TOWER_STATS[buildType].name}.`);
      return;
    }

    const upgradable = state.towers.find(
      (tower) => tower.level < 2 && state.credits >= TOWER_STATS[tower.type].cost[tower.level + 1]
    );
    if (upgradable) {
      engine.upgradeTower(upgradable.id);
      setTutorialHint(`Auto-upgrading ${TOWER_STATS[upgradable.type].name}.`);
      return;
    }

    const overclockable = state.towers.find((tower) => tower.overclockTimer === 0 && tower.overheatTimer === 0);
    if (overclockable && state.wave >= 2) {
      engine.overclockTower(overclockable.id);
      setTutorialHint('Auto-overclocking a tower.');
      return;
    }

    if (state.mercs.length === 0 && state.credits >= MERC_STATS[MercType.SAMURAI].cost) {
      engine.hireMerc(MercType.SAMURAI, 120, 520);
      setTutorialHint('Auto-deploying a Street Samurai.');
      return;
    }

    if (state.hacks[HackType.LASER].cooldown === 0 && state.wave >= 3) {
      engine.useHack(HackType.LASER);
      audio.playHack('LASER');
      setTutorialHint('Auto-firing Orbital Laser.');
      return;
    }

    if (state.hacks[HackType.BLACKOUT].cooldown === 0 && state.wave >= 5) {
      engine.useHack(HackType.BLACKOUT);
      audio.playHack('BLACKOUT');
      setTutorialHint('Auto-triggering Grid Blackout.');
      return;
    }

    if (state.hacks[HackType.OVERRIDE].cooldown === 0 && state.wave >= 7) {
      engine.useHack(HackType.OVERRIDE);
      audio.playHack('OVERRIDE');
      setTutorialHint('Auto-triggering System Override.');
      return;
    }
  };

  useEffect(() => {
    if (!isTutorialMode || !gameState) return;

    if (gameState.status === 'START') {
      if (tutorialStartTimeoutRef.current) {
        window.clearTimeout(tutorialStartTimeoutRef.current);
      }
      tutorialStartTimeoutRef.current = window.setTimeout(() => {
        engineRef.current?.start();
        setTutorialHint('Tutorial starting the first wave automatically.');
      }, 1000);
    }

    return () => {
      if (tutorialStartTimeoutRef.current) window.clearTimeout(tutorialStartTimeoutRef.current);
    };
  }, [isTutorialMode, gameState?.status]);

  useEffect(() => {
    if (!isTutorialMode || !gameState) return;

    if (gameState.status === 'WAVE_COMPLETE') {
      if (tutorialWaveTimeoutRef.current) {
        window.clearTimeout(tutorialWaveTimeoutRef.current);
      }
      tutorialWaveTimeoutRef.current = window.setTimeout(() => {
        engineRef.current?.startNextWave();
        setTutorialHint('Starting next wave automatically.');
      }, 1500);
    }

    return () => {
      if (tutorialWaveTimeoutRef.current) window.clearTimeout(tutorialWaveTimeoutRef.current);
    };
  }, [isTutorialMode, gameState?.status, gameState?.wave]);

  useEffect(() => {
    if (!isTutorialMode || !gameState || gameState.status !== 'PLAYING') return;

    if (tutorialIntervalRef.current) {
      window.clearInterval(tutorialIntervalRef.current);
    }

    tutorialIntervalRef.current = window.setInterval(runTutorialActions, 1200);
    return () => {
      if (tutorialIntervalRef.current) window.clearInterval(tutorialIntervalRef.current);
    };
  }, [isTutorialMode, gameState?.status]);

  useEffect(() => {
    return () => {
      if (tutorialIntervalRef.current) window.clearInterval(tutorialIntervalRef.current);
      if (tutorialStartTimeoutRef.current) window.clearTimeout(tutorialStartTimeoutRef.current);
      if (tutorialWaveTimeoutRef.current) window.clearTimeout(tutorialWaveTimeoutRef.current);
    };
  }, []);

  if (!gameState) return <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">Initializing Neural Link...</div>;

  if (view === 'MAIN_MENU') {
    return <MainMenu 
      onSafehouse={() => setView('HUB')} 
      onHowToPlay={() => setView('HOW_TO_PLAY')} 
      onStart={() => setView('CREATE_CORP')} 
      onTutorial={() => {
        if (engineRef.current) {
          engineRef.current.reset();
          engineRef.current.state.corp = { name: 'TUTORIAL', color: '#00ffff' };
          engineRef.current.state.isEndless = false;
          engineRef.current.state.credits = 600;
          engineRef.current.state.lives = 30;
          engineRef.current.state.prestige.daemons.autoBuilderLevel = 1;
          engineRef.current.state.prestige.daemons.autoOverclockLevel = 1;
          audio.init();
          rendererRef.current = null;
          setIsTutorialMode(true);
          setTutorialHint('Tutorial autopilot engaged. Let the system control defenses.');
          setView('GAME');
        }
      }}
      onEndless={() => {
        if (engineRef.current) {
          engineRef.current.reset();
          engineRef.current.state.isEndless = true;
          audio.init();
          rendererRef.current = null;
          setIsTutorialMode(false);
          setView('GAME');
        }
      }}
    />;
  }

  if (view === 'CREATE_CORP') {
    return (
      <CorpCreation 
        onBack={() => setView('MAIN_MENU')}
        onComplete={(name, color) => {
          if (engineRef.current) {
            engineRef.current.reset();
            engineRef.current.state.corp = { name, color };
            engineRef.current.state.isEndless = false; // Regular mode
            engineRef.current.saveMeta();
            audio.init();
            rendererRef.current = null;
            setView('GAME');
          }
        }}
      />
    );
  }

  if (view === 'HOW_TO_PLAY') {
    return <HowToPlay onMainMenu={() => setView('MAIN_MENU')} />;
  }

  if (view === 'HUB') {
    return (
      <>
        <Hub 
          gameState={gameState} 
          onStartGame={(isEndless) => {
            audio.init();
            if (engineRef.current) {
              engineRef.current.reset();
              engineRef.current.state.isEndless = isEndless;
            }
            rendererRef.current = null; // Reset renderer so it binds to the new canvas
            setView('GAME');
          }}
          onUpgrade={(key, cost) => {
            if (engineRef.current) {
              if (engineRef.current.state.dataFragments >= cost && !engineRef.current.state.upgrades[key]) {
                engineRef.current.state.dataFragments -= cost;
                engineRef.current.state.upgrades[key] = true;
                engineRef.current.saveMeta();
                engineRef.current.notify();
              }
            }
          }}
          onDarkWeb={() => setView('DARK_WEB')}
          onGacha={() => setIsGachaOpen(true)}
          onMainMenu={() => setView('MAIN_MENU')}
        />
        {isGachaOpen && (
          <GachaUI 
            gameState={gameState}
            onClose={() => setIsGachaOpen(false)}
            onPull={(amount) => {
              if (engineRef.current) {
                engineRef.current.pullGacha(amount);
              }
            }}
          />
        )}
      </>
    );
  }

  if (view === 'DARK_WEB') {
    return (
      <DarkWeb
        gameState={gameState}
        onBack={() => setView('HUB')}
        onMainMenu={() => setView('MAIN_MENU')}
        onUpgrade={(type, cost) => {
          if (engineRef.current) {
            const state = engineRef.current.state;
            if (state.prestige.sourceCode >= cost) {
              state.prestige.sourceCode -= cost;
              if (type === 'damage') state.prestige.multipliers.globalDamage += 1;
              if (type === 'mining') state.prestige.multipliers.offlineMining += 1;
              if (type === 'credits') state.prestige.multipliers.startingCredits += 1;
              if (type === 'autoBuild') state.prestige.daemons.autoBuilderLevel += 1;
              if (type === 'autoOverclock') state.prestige.daemons.autoOverclockLevel += 1;
              engineRef.current.saveMeta();
              engineRef.current.notify();
            }
          }
        }}
      />
    );
  }

  const selectedTower = gameState.towers.find(t => t.id === selectedTowerId);

  const getUpcomingWaveInfo = () => {
    if (!gameState) return null;
    
    let targetIndex = gameState.wave;
    if (gameState.status === 'WAVE_COMPLETE' || gameState.status === 'START') {
      targetIndex = gameState.status === 'START' ? 0 : gameState.wave + 1;
    }

    if (gameState.isEndless) {
      return { count: 10 + Math.floor(targetIndex * 1.5), type: 'MIXED SWARM' };
    }

    if (targetIndex < WAVES.length * MAP_PATHS.length) {
      return WAVES[targetIndex % WAVES.length];
    }
    return null;
  };

  const upcomingWave = getUpcomingWaveInfo();

  return (
    <div className={`h-screen w-screen overflow-hidden bg-gray-950 text-cyan-50 font-mono flex flex-col items-center py-2 selection:bg-cyan-900 ${gameState.screenGlitch > 0 ? 'animate-pulse bg-red-950/50' : ''}`}>
      
      {/* Header */}
      <div className="w-full max-w-[1200px] flex justify-between items-center mb-2 px-4 border-b border-cyan-900 pb-2 shrink-0">
        <div className="flex items-center gap-6">
          <h1 className="text-xl font-bold text-cyan-400 tracking-widest uppercase drop-shadow-[0_0_8px_rgba(34,211,238,0.8)]">
            Neon Trench Defense
          </h1>
          <div className="flex gap-4 text-base">
            <span className="flex items-center gap-2 text-red-400"><Heart size={16} /> {gameState.lives}</span>
            <span className="flex items-center gap-2 text-green-400">
              <Coins size={16} /> {gameState.credits} 
              {gameState.loanSharkWavesLeft > 0 && <span className="text-red-500 text-xs ml-1">(DEBT: {gameState.loanSharkWavesLeft} WAVES)</span>}
            </span>
            <span className="flex items-center gap-2 text-purple-400">
              <Skull size={16} /> 
              {gameState.isEndless 
                 ? `Deep Dive Wave ${gameState.wave + 1}` 
                 : `Wave ${(gameState.wave % WAVES.length) + 1}/${WAVES.length}`
              }
              {upcomingWave && !['GAME_OVER', 'VICTORY'].includes(gameState.status) && (
                <span className="text-xs text-purple-300/70 ml-1">
                  ({gameState.status === 'PLAYING' ? 'Current' : 'Next'}: {Math.floor(upcomingWave.count * Math.pow(2, (gameState.mapIndex || 0) + 1))}x {upcomingWave.type})
                </span>
              )}
            </span>
          </div>
        </div>
        
        <div className="flex gap-2">
          {gameState.status === 'PLAYING' && gameState.loanSharkWavesLeft === 0 && (gameState.isEndless || !gameState.loanUsed) && (
            <button 
              onClick={() => engineRef.current?.callFixer()}
              className="cyber-button px-4 py-1.5 bg-red-900/80 hover:bg-red-700 text-red-100 font-bold border border-red-400 transition-all shadow-[0_0_15px_rgba(239,68,68,0.5)] cursor-pointer text-sm"
              title="Get 2000 Creds instantly. Lose all income for 3 waves."
            >
              CALL FIXER (LOAN)
            </button>
          )}
          {gameState.status === 'PLAYING' && gameState.isEndless && gameState.dataFragments >= 50 * gameState.sector && (
            <button 
              onClick={() => {
                engineRef.current?.bribeFaction();
              }}
              className="cyber-button px-4 py-1.5 bg-yellow-900/80 hover:bg-yellow-700 text-yellow-100 font-bold border border-yellow-400 transition-all shadow-[0_0_15px_rgba(234,179,8,0.5)] cursor-pointer text-sm"
              title={`Bribe the current faction to retreat. Costs ${50 * gameState.sector} Fragments.`}
            >
              BRIBE FACTION ({50 * gameState.sector} FRAGS)
            </button>
          )}
          {gameState.status === 'PLAYING' && gameState.isEndless && (
            <button 
              onClick={() => {
                if (engineRef.current) {
                  engineRef.current.state.status = 'BURN_NOTICE';
                  engineRef.current.notify();
                }
              }}
              className="cyber-button px-4 py-1.5 bg-red-900/80 hover:bg-red-700 text-red-100 font-bold border border-red-400 transition-all shadow-[0_0_15px_rgba(239,68,68,0.5)] cursor-pointer text-sm flex items-center gap-2"
            >
              BURN NOTICE
            </button>
          )}
          {gameState.status === 'PLAYING' && gameState.isEndless && (
            <button 
              onClick={() => setIsMainframeOpen(true)}
              className="cyber-button px-4 py-1.5 bg-purple-900/80 hover:bg-purple-700 text-purple-100 font-bold border border-purple-400 transition-all shadow-[0_0_15px_rgba(168,85,247,0.5)] cursor-pointer text-sm flex items-center gap-2"
            >
              <Cpu size={16} />
              MAINFRAME
            </button>
          )}
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                const next = !isMuted;
                setIsMuted(next);
                audio.setMuted(next);
              }}
              className="cyber-button px-4 py-1.5 bg-gray-800/80 hover:bg-gray-700 text-gray-100 font-bold border border-gray-600 transition-all shadow-[0_0_15px_rgba(148,163,184,0.3)] cursor-pointer text-sm flex items-center gap-2"
              title="Toggle sound"
            >
              {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
              {isMuted ? 'Unmute' : 'Mute'}
            </button>
            <div className="flex items-center gap-2 px-2 py-1 bg-gray-900/80 border border-gray-700 rounded-md">
              <span className="text-xs text-gray-300">Vol</span>
              <input
                type="range"
                min={0}
                max={100}
                value={volume}
                onChange={(e) => {
                  const next = Number(e.target.value);
                  setVolume(next);
                  audio.setVolume(next / 100);
                }}
                className="h-2 w-28 bg-gray-700 accent-cyan-400"
              />
            </div>
          </div>
          {gameState.status === 'START' && (
            <button 
              onClick={() => {
                audio.init();
                engineRef.current?.start();
              }}
              className="cyber-button px-4 py-1.5 bg-cyan-900/80 hover:bg-cyan-700 text-cyan-100 font-bold border border-cyan-400 transition-all shadow-[0_0_15px_rgba(34,211,238,0.5)] cursor-pointer text-sm"
            >
              INITIALIZE UPLOAD
            </button>
          )}
          {gameState.status === 'WAVE_COMPLETE' && (
            <div className="flex items-center gap-4">
              <button 
                onClick={() => {
                  engineRef.current?.startNextWave();
                }}
                className="cyber-button px-4 py-1.5 bg-green-900/80 hover:bg-green-700 text-green-100 font-bold border border-green-400 transition-all shadow-[0_0_15px_rgba(34,211,238,0.5)] cursor-pointer text-sm"
              >
                START NEXT WAVE
              </button>
              <button 
                onClick={() => {
                  engineRef.current?.reset();
                  rendererRef.current = null;
                  audio.stopAll();
                  setIsTutorialMode(false);
                  setView('HUB');
                }}
                className="cyber-button px-4 py-1.5 bg-purple-900/80 hover:bg-purple-700 text-purple-100 font-bold border border-purple-400 transition-all cursor-pointer text-sm"
              >
                SAFEHOUSE
              </button>
              <button 
                onClick={() => {
                  engineRef.current?.reset();
                  rendererRef.current = null;
                  audio.stopAll();
                  setIsTutorialMode(false);
                  setView('MAIN_MENU');
                }}
                className="cyber-button px-4 py-1.5 bg-gray-800/80 hover:bg-gray-700 text-gray-300 font-bold border border-gray-600 transition-all cursor-pointer text-sm"
              >
                MAIN MENU
              </button>
            </div>
          )}
          {gameState.status === 'VICTORY' && (
            <div className="flex items-center gap-4">
              <div className="text-green-500 font-bold text-lg animate-pulse mr-2">
                 {(gameState.mapIndex || 0) < 3 && !gameState.isEndless ? 'MAP SECTOR SECURED!' : 'CAMPAIGN COMPLETED!'}
              </div>
              
              {(gameState.mapIndex || 0) < 3 && !gameState.isEndless && (
                <button 
                  onClick={() => {
                    engineRef.current?.continueCampaign();
                  }}
                  className="cyber-button px-6 py-2 bg-yellow-600/90 hover:bg-yellow-500 text-yellow-100 font-bold border-2 border-yellow-400 transition-all cursor-pointer shadow-[0_0_20px_rgba(202,138,4,0.6)] text-lg uppercase tracking-wider"
                >
                  CONTINUE CAMPAIGN
                </button>
              )}

              {((gameState.mapIndex || 0) >= 3 || gameState.isEndless) && (
                <>
                  <button 
                    onClick={() => {
                      engineRef.current?.reset();
                      rendererRef.current = null;
                      audio.stopAll();
                      setView('HUB');
                    }}
                    className="cyber-button px-6 py-2 bg-black hover:bg-gray-900 border-2 border-gray-600 text-gray-300 font-bold transition-all cursor-pointer shadow-[0_0_20px_rgba(0,0,0,0.8)] text-lg uppercase tracking-wider"
                  >
                    END CAMPAIGN
                  </button>
                  <button 
                    onClick={() => {
                      engineRef.current?.continueEndless();
                    }}
                    className="cyber-button px-3 py-1.5 bg-red-900/80 hover:bg-red-700 text-red-100 font-bold border border-red-400 transition-all cursor-pointer shadow-[0_0_15px_rgba(220,38,38,0.5)] text-sm uppercase"
                  >
                    DEEP DIVE
                  </button>
                </>
              )}

              <button 
                onClick={() => {
                  engineRef.current?.reset();
                  rendererRef.current = null;
                  audio.stopAll();
                  setView('HUB');
                }}
                className="cyber-button px-3 py-1.5 bg-purple-900/80 hover:bg-purple-700 text-purple-100 font-bold border border-purple-400 transition-all cursor-pointer text-sm"
              >
                RETURN TO SAFEHOUSE
              </button>

              <button 
                onClick={() => {
                  engineRef.current?.reset();
                  rendererRef.current = null;
                  audio.stopAll();
                  setView('MAIN_MENU');
                }}
                className="cyber-button px-3 py-1.5 bg-gray-800/80 hover:bg-gray-700 text-gray-300 font-bold border border-gray-600 transition-all cursor-pointer text-sm"
              >
                MAIN MENU
              </button>
            </div>
          )}
          {gameState.status !== 'WAVE_COMPLETE' && gameState.status !== 'VICTORY' && (
            <button 
              onClick={() => {
                engineRef.current?.reset();
                rendererRef.current = null;
                audio.stopAll();
                setIsTutorialMode(false);
                setView('MAIN_MENU');
              }}
              className="cyber-button px-4 py-1.5 bg-gray-800/80 hover:bg-gray-700 text-gray-300 font-bold border border-gray-600 transition-all cursor-pointer text-sm flex items-center gap-2"
            >
              MAIN MENU
            </button>
          )}
        </div>
      </div>

      {isTutorialMode && (
        <div className="absolute top-24 left-10 z-40 bg-cyan-950/95 border border-cyan-500 p-3 rounded-lg text-xs text-cyan-100 shadow-[0_0_20px_rgba(34,211,238,0.25)] max-w-sm">
          <div className="font-bold uppercase text-cyan-300 tracking-[0.2em] mb-1">Tutorial Autopilot</div>
          <div>{tutorialHint}</div>
        </div>
      )}

      <div className="flex gap-4 w-full max-w-[1200px] px-4 flex-1 min-h-0 pb-2">
        {/* Left Sidebar - Build Menu */}
        <div className="cyber-panel w-72 flex flex-col gap-2 shrink-0 overflow-y-auto p-2 custom-scrollbar">
          <h2 className="text-cyan-500 font-bold border-b border-cyan-900 pb-1 uppercase tracking-wider text-sm glitch-text" data-text="ARSENAL">ARSENAL</h2>
          {Object.entries(TOWER_STATS).map(([type, stats]) => (
            <button
              key={type}
              onClick={() => {
                setSelectedTowerType(type as TowerType);
                setSelectedMercType(null);
                setSelectedTowerId(null);
              }}
              className={`cyber-button p-2 border text-left transition-all cursor-pointer ${
                selectedTowerType === type 
                  ? 'bg-cyan-900/50 border-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.5)]' 
                  : 'bg-gray-900/50 border-gray-700 hover:border-cyan-700'
              } ${gameState.credits < stats.cost[0] ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <div className="flex justify-between items-center mb-1">
                <span className="font-bold text-sm" style={{ color: stats.color }}>{stats.name}</span>
                <span className="text-green-400 text-xs">${stats.cost[0]}</span>
              </div>
              <p className="text-[10px] text-gray-400 leading-tight">{stats.desc}</p>
            </button>
          ))}

          <h2 className="text-pink-500 font-bold border-b border-pink-900 pb-1 uppercase tracking-wider text-sm mt-2 glitch-text" data-text={`EDGERUNNERS ${gameState.isEndless ? '' : '(MAX 1)'}`}>
            EDGERUNNERS {gameState.isEndless ? '' : '(MAX 1)'}
          </h2>
          {Object.entries(MERC_STATS).map(([type, stats]) => {
            const limitReached = !gameState.isEndless && gameState.mercs.length >= 1;
            const cannotAfford = gameState.credits < stats.cost;
            const isDisabled = limitReached || cannotAfford;
            return (
            <button
              key={type}
              onClick={() => {
                if (isDisabled) return;
                setSelectedMercType(type as MercType);
                setSelectedTowerType(null);
                setSelectedTowerId(null);
              }}
              disabled={isDisabled}
              className={`cyber-button p-2 border text-left transition-all ${
                selectedMercType === type 
                  ? 'bg-pink-900/50 border-pink-400 shadow-[0_0_10px_rgba(236,72,153,0.5)]' 
                  : 'bg-gray-900/50 border-gray-700 hover:border-pink-700'
              } ${isDisabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
            >
              <div className="flex justify-between items-center mb-1">
                <span className="font-bold text-sm" style={{ color: stats.color }}>{stats.name}</span>
                <span className="text-green-400 text-xs">${stats.cost}</span>
              </div>
              <p className="text-[10px] text-gray-400 leading-tight">{stats.desc}</p>
              {limitReached && <p className="text-[10px] text-red-500 font-bold mt-1">LIMIT REACHED</p>}
            </button>
          )})}
        </div>

        {/* Main Canvas */}
        <div className="relative flex-1 min-w-0 flex items-center justify-center bg-gray-900 border-2 border-cyan-900 rounded-lg overflow-hidden shadow-[0_0_30px_rgba(0,0,0,0.8)]">
          <canvas
            ref={canvasRef}
            width={MAP_WIDTH}
            height={MAP_HEIGHT}
            onClick={handleCanvasClick}
            onMouseMove={handleCanvasMouseMove}
            onMouseLeave={handleCanvasMouseLeave}
            className={`max-w-full max-h-full object-contain cursor-crosshair bg-black transition-all duration-500 ${gameState.isNetDive ? 'invert hue-rotate-180 contrast-150 saturate-200' : ''}`}
          />
          
          {/* Build Overlay Hint */}
          {selectedTowerType && (
            <div className="absolute top-2 left-2 bg-black/80 border border-cyan-500 p-1.5 rounded text-xs text-cyan-300 pointer-events-none">
              Select a grid location to deploy {TOWER_STATS[selectedTowerType].name} (Press ESC to cancel)
            </div>
          )}
          {selectedMercType && (
            <div className="absolute top-2 left-2 bg-black/80 border border-pink-500 p-1.5 rounded text-xs text-pink-300 pointer-events-none">
              Select a location to deploy {MERC_STATS[selectedMercType].name} (Press ESC to cancel)
            </div>
          )}
          {movingTowerId && (
            <div className="absolute top-2 left-2 bg-black/80 border border-indigo-500 p-1.5 rounded text-xs text-indigo-300 pointer-events-none">
              Select a new location to move the unit (Press ESC to cancel)
            </div>
          )}
          
          <div className="absolute bottom-2 right-2 text-[10px] text-gray-500 pointer-events-none">
          </div>
        </div>

        {/* Right Sidebar - Selection/Upgrades & Hacks */}
        <div className="cyber-panel w-60 flex flex-col gap-4 shrink-0 overflow-y-auto p-2 custom-scrollbar">
          
          {/* Cyber Deck (Hacks) moved to right sidebar to save vertical space */}
          <div className="flex flex-col gap-2">
            <h2 className="text-purple-500 font-bold border-b border-purple-900 pb-1 uppercase tracking-wider text-sm glitch-text" data-text="CYBER-DECK">CYBER-DECK</h2>
            <div className="grid grid-cols-2 gap-2">
              <button 
                onClick={() => {
                  engineRef.current?.useHack(HackType.BLACKOUT);
                  audio.playHack('BLACKOUT');
                }}
                disabled={gameState.hacks[HackType.BLACKOUT].cooldown > 0}
                className="cyber-button relative p-2 bg-gray-900/50 border border-purple-500 hover:bg-purple-900/30 disabled:opacity-50 flex flex-col items-center justify-center gap-1 transition-all group cursor-pointer"
              >
                <ShieldAlert size={16} className="text-purple-400 group-hover:scale-110 transition-transform" />
                <span className="text-[10px] font-bold text-purple-300 text-center leading-tight">GRID BLACKOUT</span>
                {gameState.hacks[HackType.BLACKOUT].cooldown > 0 && (
                  <div className="absolute inset-0 bg-black/60 flex items-center justify-center text-white font-bold text-xs">
                    {Math.ceil(gameState.hacks[HackType.BLACKOUT].cooldown / 60)}s
                  </div>
                )}
              </button>

              <button 
                onClick={() => {
                  engineRef.current?.useHack(HackType.LASER);
                  audio.playHack('LASER');
                }}
                disabled={gameState.hacks[HackType.LASER].cooldown > 0}
                className="cyber-button relative p-2 bg-gray-900/50 border border-red-500 hover:bg-red-900/30 disabled:opacity-50 flex flex-col items-center justify-center gap-1 transition-all group cursor-pointer"
              >
                <Crosshair size={16} className="text-red-400 group-hover:scale-110 transition-transform" />
                <span className="text-[10px] font-bold text-red-300 text-center leading-tight">ORBITAL LASER</span>
                {gameState.hacks[HackType.LASER].cooldown > 0 && (
                  <div className="absolute inset-0 bg-black/60 flex items-center justify-center text-white font-bold text-xs">
                    {Math.ceil(gameState.hacks[HackType.LASER].cooldown / 60)}s
                  </div>
                )}
              </button>

              <button 
                onClick={() => {
                  engineRef.current?.useHack(HackType.OVERRIDE);
                  audio.playHack('OVERRIDE');
                }}
                disabled={gameState.hacks[HackType.OVERRIDE].cooldown > 0}
                className="cyber-button relative p-2 bg-gray-900/50 border border-yellow-500 hover:bg-yellow-900/30 disabled:opacity-50 flex flex-col items-center justify-center gap-1 transition-all group cursor-pointer col-span-2"
              >
                <Cpu size={16} className="text-yellow-400 group-hover:scale-110 transition-transform" />
                <span className="text-[10px] font-bold text-yellow-300 text-center leading-tight">SYS OVERRIDE</span>
                {gameState.hacks[HackType.OVERRIDE].cooldown > 0 && (
                  <div className="absolute inset-0 bg-black/60 flex items-center justify-center text-white font-bold text-xs">
                    {Math.ceil(gameState.hacks[HackType.OVERRIDE].cooldown / 60)}s
                  </div>
                )}
              </button>
            </div>
          </div>

          <div className="flex flex-col gap-2 flex-1">
            <h2 className="text-cyan-500 font-bold border-b border-cyan-900 pb-1 uppercase tracking-wider text-sm glitch-text" data-text="TELEMETRY">TELEMETRY</h2>
            
            {selectedTower ? (
              <div className="bg-gray-900/50 border border-gray-700 p-3 flex flex-col gap-3">
                <h3 className="font-bold text-sm" style={{ color: TOWER_STATS[selectedTower.type].color }}>
                  {TOWER_STATS[selectedTower.type].name} v{selectedTower.level + 1}.0
                </h3>
                
                <div className="text-xs text-gray-300 space-y-1">
                  <p>Damage: {TOWER_STATS[selectedTower.type].damage[selectedTower.level]}</p>
                  <p>Range: {TOWER_STATS[selectedTower.type].range[selectedTower.level]}</p>
                  <p>Fire Rate: {(60 / TOWER_STATS[selectedTower.type].fireRate[selectedTower.level]).toFixed(1)}/s</p>
                </div>

                {selectedTower.level < 2 ? (
                  <button
                    onClick={() => {
                      engineRef.current?.upgradeTower(selectedTower.id);
                      audio.playBuild();
                    }}
                    disabled={gameState.credits < TOWER_STATS[selectedTower.type].cost[selectedTower.level + 1]}
                    className="cyber-button w-full py-1.5 bg-blue-900/80 hover:bg-blue-700 text-white border border-blue-500 disabled:opacity-50 transition-colors cursor-pointer text-xs"
                  >
                    Upgrade (${TOWER_STATS[selectedTower.type].cost[selectedTower.level + 1]})
                  </button>
                ) : (
                  <div className="text-center text-yellow-500 font-bold text-xs py-1.5 border border-yellow-900 bg-yellow-900/20">
                    MAX LEVEL REACHED
                  </div>
                )}

                <button
                  onClick={() => {
                    engineRef.current?.overclockTower(selectedTower.id);
                    audio.playBuild();
                  }}
                  disabled={selectedTower.overclockTimer > 0 || selectedTower.overheatTimer > 0}
                  className="cyber-button w-full py-1.5 bg-red-900/80 hover:bg-red-700 text-white border border-red-500 disabled:opacity-50 flex items-center justify-center gap-2 transition-colors cursor-pointer text-xs"
                >
                  <Zap size={14} /> 
                  {selectedTower.overheatTimer > 0 ? 'OVERHEATED' : selectedTower.overclockTimer > 0 ? 'OVERCLOCKED' : 'OVERCLOCK'}
                </button>

                <button
                  onClick={() => {
                    setMovingTowerId(selectedTower.id);
                    setSelectedTowerId(null);
                  }}
                  className="cyber-button w-full py-1.5 bg-indigo-900/80 hover:bg-indigo-700 text-white border border-indigo-500 transition-colors cursor-pointer text-xs"
                >
                  Move Unit
                </button>

                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      engineRef.current?.sellTower(selectedTower.id);
                      audio.playBuild();
                      setSelectedTowerId(null);
                    }}
                    className="cyber-button flex-1 py-1.5 bg-gray-800/80 hover:bg-gray-700 text-gray-400 border border-gray-600 transition-colors cursor-pointer text-xs"
                  >
                    Sell (50%)
                  </button>
                  <button
                    onClick={() => {
                      engineRef.current?.scrapTower(selectedTower.id);
                      setSelectedTowerId(null);
                    }}
                    className="cyber-button flex-1 py-1.5 bg-orange-900/80 hover:bg-orange-700 text-white border border-orange-500 transition-colors cursor-pointer text-xs"
                    title="Destroy tower for 0 Creds, causing a massive explosion."
                  >
                    Scrap (Boom)
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-gray-500 text-xs italic text-center mt-4">
                Select a deployed tower to view telemetry and upgrades.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Game Over Overlay */}
      {gameState.status === 'GAME_OVER' && (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-red-950/90 backdrop-blur-sm">
          <div className="text-red-500 font-bold text-6xl mb-4 animate-pulse tracking-widest drop-shadow-[0_0_20px_rgba(239,68,68,1)]">
            SYSTEM FAILURE
          </div>
          <div className="text-red-400 text-xl mb-8 font-mono text-center max-w-2xl">
            The Data Nexus has been breached. All operations terminated.
          </div>
          
          <div className="flex gap-6">
            {gameState.isEndless ? (
              <button 
                onClick={() => {
                  if (engineRef.current) {
                    engineRef.current.reset();
                    engineRef.current.state.isEndless = true;
                    engineRef.current.start();
                  }
                }}
                className="cyber-button px-8 py-4 bg-red-950/80 hover:bg-red-900 text-red-100 font-bold text-xl border border-red-500 transition-all shadow-[0_0_15px_rgba(239,68,68,0.3)] hover:shadow-[0_0_25px_rgba(239,68,68,0.6)] uppercase tracking-wider cursor-pointer"
              >
                RESTART ENDLESS
              </button>
            ) : (
              <button 
                onClick={() => {
                  if (engineRef.current) {
                    engineRef.current.reset();
                    engineRef.current.start();
                  }
                }}
                className="cyber-button px-8 py-4 bg-red-950/80 hover:bg-red-900 text-red-100 font-bold text-xl border border-red-500 transition-all shadow-[0_0_15px_rgba(239,68,68,0.3)] hover:shadow-[0_0_25px_rgba(239,68,68,0.6)] uppercase tracking-wider cursor-pointer"
              >
                RESTART CAMPAIGN
              </button>
            )}
            <button 
              onClick={() => {
                if (engineRef.current) {
                  engineRef.current.reset();
                  rendererRef.current = null;
                  audio.stopAll();
                  setView('HUB');
                }
              }}
              className="cyber-button px-8 py-4 bg-gray-900/80 hover:bg-gray-800 text-gray-300 font-bold text-xl border border-gray-600 transition-all shadow-[0_0_15px_rgba(156,163,175,0.2)] hover:shadow-[0_0_25px_rgba(156,163,175,0.4)] uppercase tracking-wider cursor-pointer"
            >
              RETURN TO SAFEHOUSE
            </button>
          </div>
        </div>
      )}

      {/* Burn Notice Overlay */}
      {gameState.status === 'BURN_NOTICE' && (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-orange-950/90 backdrop-blur-sm">
          <div className="text-red-500 font-bold text-6xl mb-4 animate-pulse tracking-widest drop-shadow-[0_0_20px_rgba(239,68,68,1)]">
            BURN NOTICE TRIGGERED
          </div>
          <div className="text-red-400 text-xl mb-8 font-mono text-center max-w-2xl">
            The Corporate hit-squads have breached the trench. Detonating servers and wiping digital footprint.
            <br/><br/>
            <span className="text-cyan-400">Extracting Source Code...</span>
          </div>
          
          <div className="flex gap-6">
            <button 
              onClick={() => {
                if (engineRef.current) {
                  engineRef.current.triggerBurnNotice();
                  rendererRef.current = null;
                  audio.stopAll();
                  setView('HUB');
                }
              }}
              className="cyber-button px-8 py-4 bg-red-950/80 hover:bg-red-900 text-red-100 font-bold text-xl border border-red-500 transition-all shadow-[0_0_15px_rgba(239,68,68,0.3)] hover:shadow-[0_0_25px_rgba(239,68,68,0.6)] uppercase tracking-wider cursor-pointer"
            >
              FLEE TO SAFEHOUSE
            </button>
          </div>
        </div>
      )}

      {/* Mainframe UI Overlay */}
      {isMainframeOpen && (
        <MainframeUI 
          gameState={gameState}
          onClose={() => setIsMainframeOpen(false)}
          onAllocate={(type, value) => {
            if (engineRef.current && engineRef.current.state.mainframe) {
              engineRef.current.state.mainframe.allocations[type] = value;
              engineRef.current.notify();
            }
          }}
          onUpgradeCooling={() => {
            if (engineRef.current && engineRef.current.state.mainframe) {
              const cost = Math.floor(500 * Math.pow(1.5, engineRef.current.state.mainframe.coolingLevel - 1));
              if (engineRef.current.state.credits >= cost) {
                engineRef.current.state.credits -= cost;
                engineRef.current.state.mainframe.coolingLevel++;
                engineRef.current.notify();
              }
            }
          }}
        />
      )}

      {/* Admin UI Overlay */}
      {isAdminMode && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 z-50 bg-black/90 border-2 border-yellow-500 p-4 rounded-lg shadow-[0_0_30px_rgba(234,179,8,0.5)] flex flex-col gap-2 min-w-[300px]">
          <div className="text-yellow-500 font-bold text-center border-b border-yellow-700 pb-2 mb-2">
            ADMIN OVERRIDE ACTIVE
          </div>
          <button 
            onClick={() => engineRef.current?.adminAddCredits(10000)}
            className="cyber-button px-4 py-2 bg-yellow-900/50 hover:bg-yellow-800 text-yellow-200 border border-yellow-600 text-sm transition-colors"
          >
            +10,000 Creds
          </button>
          <button 
            onClick={() => engineRef.current?.adminAddLives(100)}
            className="cyber-button px-4 py-2 bg-yellow-900/50 hover:bg-yellow-800 text-yellow-200 border border-yellow-600 text-sm transition-colors"
          >
            +100 Lives
          </button>
          <button 
            onClick={() => engineRef.current?.adminAddDataFragments(1000)}
            className="cyber-button px-4 py-2 bg-yellow-900/50 hover:bg-yellow-800 text-yellow-200 border border-yellow-600 text-sm transition-colors"
          >
            +1,000 Data Fragments
          </button>
          <button 
            onClick={() => engineRef.current?.adminKillAllEnemies()}
            className="cyber-button px-4 py-2 bg-red-900/50 hover:bg-red-800 text-red-200 border border-red-600 text-sm transition-colors mt-2"
          >
            NUKE ALL ENEMIES
          </button>
          <button 
            onClick={() => engineRef.current?.adminSkipWave()}
            className="cyber-button px-4 py-2 bg-blue-900/50 hover:bg-blue-800 text-blue-200 border border-blue-600 text-sm transition-colors"
          >
            SKIP WAVE
          </button>
          <button 
            onClick={() => setIsAdminMode(false)}
            className="cyber-button px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 border border-gray-600 text-sm transition-colors mt-4"
          >
            CLOSE ADMIN PANEL
          </button>
        </div>
      )}
    </div>
  );
}
