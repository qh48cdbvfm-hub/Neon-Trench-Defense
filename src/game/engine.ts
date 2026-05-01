import { GameState, TowerType, EnemyType, HackType, MercType, Enemy, Tower, Projectile, Particle, Point, Faction } from './types';
import { MAP_PATHS, TOWER_STATS, ENEMY_STATS, WAVES, GRID_SIZE, MERC_STATS, MAP_WIDTH, MAP_HEIGHT } from './constants';
import { audio } from './audio';

export class GameEngine {
  state: GameState;
  frame: number = 0;
  waveIndex: number = 0;
  enemiesSpawnedInWave: number = 0;
  spawnTimer: number = 0;
  onStateChange?: (state: GameState) => void;
  screenShake: number = 0;

  constructor() {
    this.state = this.getInitialState();
  }

  notify() {
    if (this.onStateChange) {
      this.onStateChange(this.state);
    }
  }

  getInitialState(): GameState {
    const savedData = localStorage.getItem('neonTrenchMeta');
    let dataFragments = 0;
    let campaignCompleted = false;
    let upgrades = {
      ricochet: false,
      widerSlag: false,
      opticalCybereye: false,
      creditChip: false,
      synapticAccelerator: false,
    };
    let prestige = {
      sourceCode: 0,
      multipliers: { globalDamage: 0, offlineMining: 0, startingCredits: 0 },
      daemons: { autoBuilderLevel: 0, autoOverclockLevel: 0 }
    };
    let corp = null;
    let inventory = {};

    if (savedData) {
      try {
        const parsed = JSON.parse(savedData);
        dataFragments = parsed.dataFragments || 0;
        campaignCompleted = parsed.campaignCompleted || false;
        upgrades = { ...upgrades, ...parsed.upgrades };
        if (parsed.prestige) prestige = { ...prestige, ...parsed.prestige };
        if (parsed.corp) corp = parsed.corp;
        if (parsed.inventory) inventory = parsed.inventory;
      } catch (e) {}
    }

    return {
      corp,
      prestige,
      mainframe: {
        processingPower: 0,
        heat: 0,
        coolingLevel: 1,
        allocations: { attackSpeed: 0, credGen: 0 }
      },
      currentFaction: Faction.NONE,
      factionKills: { [Faction.KURO_SEC]: 0, [Faction.GENE_TEK]: 0, [Faction.GHOST_SYNDICATE]: 0 },
      sector: 1,
      mapIndex: 0,
      credits: (upgrades.creditChip ? Math.floor(100 * 1.15) : 100) + (prestige.multipliers.startingCredits * 100),
      lives: 20,
      wave: 0,
      enemies: [],
      towers: [],
      mercs: [],
      projectiles: [],
      particles: [],
      pools: [],
      floatingTexts: [],
      status: 'START',
      dataFragments,
      campaignCompleted,
      isEndless: false,
      loanSharkWavesLeft: 0,
      loanUsed: false,
      waveTimer: 0,
      screenGlitch: 0,
      sabotageDiscount: 1,
      inventory,
      upgrades,
      hacks: {
        [HackType.BLACKOUT]: { cooldown: 0, activeTimer: 0 },
        [HackType.LASER]: { cooldown: 0, activeTimer: 0 },
        [HackType.OVERRIDE]: { cooldown: 0, activeTimer: 0 },
      },
    };
  }

  saveMeta() {
    localStorage.setItem('neonTrenchMeta', JSON.stringify({
      dataFragments: this.state.dataFragments,
      upgrades: this.state.upgrades,
      campaignCompleted: this.state.campaignCompleted,
      prestige: this.state.prestige,
      corp: this.state.corp,
      inventory: this.state.inventory
    }));
  }

  pullGacha(amount: number) {
    const cost = amount * 10;
    if (this.state.dataFragments >= cost) {
      this.state.dataFragments -= cost;
      
      const towerTypes = Object.values(TowerType);
      
      for (let i = 0; i < amount; i++) {
        // Simple random pull for now. Could add weights later.
        const pulledType = towerTypes[Math.floor(Math.random() * towerTypes.length)];
        
        if (!this.state.inventory[pulledType]) {
          this.state.inventory[pulledType] = 0;
        }
        this.state.inventory[pulledType]!++;
      }
      
      this.saveMeta();
      this.notify();
    }
  }

  start() {
    this.state.status = 'PLAYING';
    this.waveIndex = 0;
    this.state.wave = 0;
    this.notify();
  }

  reset() {
    this.state = this.getInitialState();
    this.frame = 0;
    this.waveIndex = 0;
    this.enemiesSpawnedInWave = 0;
    this.spawnTimer = 0;
    this.notify();
  }

  update() {
    // These should decay regardless of game state (e.g. during WAVE_COMPLETE or GAME_OVER)
    if (this.screenShake > 0) {
      this.screenShake *= 0.9;
      if (this.screenShake < 0.5) this.screenShake = 0;
    }
    
    if (this.state.screenGlitch > 0) {
      this.state.screenGlitch--;
    }

    if (this.state.status !== 'PLAYING') return;

    this.frame++;
    this.state.waveTimer++;

    this.updateMainframe();
    this.updateHacks();
    this.spawnEnemies();
    this.updateEnemies();
    this.updateTowers();
    this.updateMercs();
    this.updateProjectiles();
    this.updateParticles();
    this.updatePools();
    this.updateFloatingTexts();
    this.runDaemons();

    // Remove dead enemies
    this.state.enemies = this.state.enemies.filter(e => e.hp > 0);

    if (this.state.lives <= 0) {
      this.state.status = 'GAME_OVER';
      this.state.screenGlitch = 0;
      this.screenShake = 30;
      this.notify();
    }

    // Notify UI every few frames or on important events, but for smooth rendering, 
    // the renderer will read state directly. We notify UI for reactive updates (money, lives).
    if (this.frame % 10 === 0) {
      this.notify();
    }
  }

  runDaemons() {
    const daemons = this.state.prestige?.daemons;
    if (!daemons) return;

    // Auto-Builder: Upgrades lowest level tower every 60 frames if affordable
    if (daemons.autoBuilderLevel > 0 && this.frame % 60 === 0) {
      const towers = [...this.state.towers].sort((a, b) => a.level - b.level);
      for (const tower of towers) {
        let cost = 0;
        if (tower.level < 2) {
          cost = TOWER_STATS[tower.type].cost[tower.level + 1];
        } else if (this.state.isEndless) {
          cost = Math.floor(TOWER_STATS[tower.type].cost[2] * Math.pow(1.5, tower.level - 1));
        }
        
        if (cost > 0 && this.state.credits >= cost) {
          this.upgradeTower(tower.id);
          break; // Only upgrade one per tick
        }
      }
    }

    // Auto-Overclock: Overclocks a random tower every 120 frames
    if (daemons.autoOverclockLevel > 0 && this.frame % 120 === 0) {
      const availableTowers = this.state.towers.filter(t => t.overclockTimer <= 0 && t.overheatTimer <= 0);
      if (availableTowers.length > 0) {
        const target = availableTowers[Math.floor(Math.random() * availableTowers.length)];
        this.overclockTower(target.id);
      }
    }
  }

  updateMainframe() {
    const { mainframe } = this.state;
    if (!mainframe) return;

    // Generate processing power
    if (this.frame % 60 === 0) {
      mainframe.processingPower += 1;
    }

    // Calculate total allocation
    const totalAllocation = mainframe.allocations.attackSpeed + mainframe.allocations.credGen;
    
    // Heat generation based on allocation
    if (this.frame % 60 === 0) {
      const heatGen = (totalAllocation / 100) * 5; // Max 5 heat per second
      const cooling = mainframe.coolingLevel * 2; // 2 cooling per level
      
      mainframe.heat = Math.max(0, Math.min(100, mainframe.heat + heatGen - cooling));
      
      // If overheated, reset allocations
      if (mainframe.heat >= 100) {
        mainframe.allocations.attackSpeed = 0;
        mainframe.allocations.credGen = 0;
        this.createFloatingText("MAINFRAME OVERHEATED", 400, 300, '#ff0000');
      }
    }

    // Apply cred gen bonus
    if (this.frame % 60 === 0 && mainframe.allocations.credGen > 0 && mainframe.heat < 100) {
      const bonus = Math.floor((mainframe.allocations.credGen / 100) * mainframe.processingPower);
      if (bonus > 0) {
        this.state.credits += bonus;
      }
    }
  }

  updateHacks() {
    for (const key in this.state.hacks) {
      const hack = this.state.hacks[key as HackType];
      if (hack.cooldown > 0) hack.cooldown--;
      if (hack.activeTimer > 0) hack.activeTimer--;
    }
  }

  spawnEnemies() {
    let currentWave;
    if (this.state.isEndless) {
      // Procedural wave
      const baseCount = 10 + Math.floor(this.waveIndex * 1.5);
      
      let types = Object.values(EnemyType);
      if (this.state.currentFaction === Faction.KURO_SEC) {
        types = [EnemyType.TANK, EnemyType.SHIELD, EnemyType.DRONE];
      } else if (this.state.currentFaction === Faction.GENE_TEK) {
        types = [EnemyType.MUTANT, EnemyType.SCUM, EnemyType.PSYCHO];
      } else if (this.state.currentFaction === Faction.GHOST_SYNDICATE) {
        types = [EnemyType.GHOST, EnemyType.HACKER, EnemyType.BIKER];
      }
      
      const type = types[Math.floor(Math.random() * types.length)];
      currentWave = { count: baseCount, type, interval: Math.max(10, 60 - this.waveIndex) };
    } else {
      if (this.waveIndex >= WAVES.length * MAP_PATHS.length) return;
      const baseWave = WAVES[this.waveIndex % WAVES.length];
      
      // Scale count if we are on higher maps: 2x, 4x, 8x, 16x
      const multiplier = Math.pow(2, (this.state.mapIndex || 0) + 1);
      const newCount = Math.floor(baseWave.count * multiplier);
      const newInterval = Math.max(10, Math.floor(baseWave.interval / multiplier));
      
      currentWave = { ...baseWave, count: newCount, interval: newInterval };
    }
    
    if (this.enemiesSpawnedInWave < currentWave.count) {
      this.spawnTimer--;
      if (this.spawnTimer <= 0) {
        this.spawnEnemy(currentWave.type);
        this.enemiesSpawnedInWave++;
        this.spawnTimer = currentWave.interval;
      }
    } else if (this.state.enemies.length === 0) {
      // Wave complete
      const timeInSeconds = this.state.waveTimer / 60;
      let timeBonus = 0;
      if (timeInSeconds < 30) timeBonus = 200;
      else if (timeInSeconds < 60) timeBonus = 100;
      else if (timeInSeconds < 90) timeBonus = 50;

      if (timeBonus > 0) {
        this.state.credits += timeBonus;
        this.createFloatingText(`SPEED BONUS: +${timeBonus}`, MAP_WIDTH / 2, MAP_HEIGHT / 2, '#00ff00');
      }

      this.screenShake = 15; // Set screen shake once when wave completes

      // We evaluate what's *about* to happen when they start next wave, without incrementing waveIndex yet.
      // E.g. waveIndex = 12 means they just cleared the 13th wave. In a 0-indexed system, 12 % 13 === 12.
      // Wait, if waveIndex represents the current wave we just *finished*.
      if (this.state.isEndless) {
        if (this.waveIndex > 0 && this.waveIndex % WAVES.length === WAVES.length - 1) {
          // Deep dive: Rotate maps every 13 waves
          this.state.mapIndex = Math.floor(Math.random() * MAP_PATHS.length);
          this.wipeTowers();
          this.createFloatingText("MAP ROTATED - INFRASTRUCTURE DESTROYED", MAP_WIDTH/2, MAP_HEIGHT/2, '#ff0000');
        }
        this.state.status = 'WAVE_COMPLETE';
        this.state.screenGlitch = 0;
        this.notify();
      } else {
        // Campaign Mode
        if (this.waveIndex % WAVES.length === WAVES.length - 1) {
           // We just completed a 13-wave map block.
           this.state.status = 'VICTORY';
           this.state.screenGlitch = 0;
           
           if (this.waveIndex >= (WAVES.length * MAP_PATHS.length) - 1 && !this.state.campaignCompleted) {
              this.state.campaignCompleted = true;
              this.saveMeta();
           }
           this.notify();
        } else {
           this.state.status = 'WAVE_COMPLETE';
           this.state.screenGlitch = 0;
           this.notify();
        }
      }
    }
  }

  startNextWave() {
    this.waveIndex++;
    this.enemiesSpawnedInWave = 0;
    this.spawnTimer = 0;
    this.state.waveTimer = 0;
    this.state.wave = this.waveIndex;
    this.state.status = 'PLAYING';
    
    if (this.state.loanSharkWavesLeft > 0) {
      this.state.loanSharkWavesLeft--;
    }

    if (this.state.isEndless) {
      // Sector progression
      this.state.sector = Math.floor(this.waveIndex / 100) + 1;
      
      // Faction rotation every 10 waves
      if (this.waveIndex % 10 === 0) {
        const factions = [Faction.KURO_SEC, Faction.GENE_TEK, Faction.GHOST_SYNDICATE];
        this.state.currentFaction = factions[Math.floor(Math.random() * factions.length)];
        this.applyGlitch();
        
        // Corporate Sabotage: 50% chance to get a 20% discount from a rival corp
        if (Math.random() < 0.5) {
          this.state.sabotageDiscount = 0.8;
          this.createFloatingText("CORPORATE SPONSORSHIP: 20% DISCOUNT", MAP_WIDTH/2, MAP_HEIGHT/2, '#00ff00');
        } else {
          this.state.sabotageDiscount = 1;
        }
      }
      
      // Check for rival sponsorship based on kills
      if (this.state.factionKills[Faction.KURO_SEC]! > 500 && this.state.currentFaction !== Faction.KURO_SEC) {
        this.state.sabotageDiscount = 0.7; // 30% discount
        this.createFloatingText("KURO-SEC SPONSORSHIP: 30% DISCOUNT", MAP_WIDTH/2, MAP_HEIGHT/2, '#00ff00');
      }
    }
    
    this.notify();
  }

  // Admin Tools
  adminAddCredits(amount: number) {
    this.state.credits += amount;
    this.notify();
  }

  adminAddLives(amount: number) {
    this.state.lives += amount;
    this.notify();
  }

  adminAddDataFragments(amount: number) {
    this.state.dataFragments += amount;
    this.saveMeta();
    this.notify();
  }

  adminKillAllEnemies() {
    this.state.enemies.forEach(e => {
      this.damageEnemy(e, 999999);
    });
    this.notify();
  }

  adminSkipWave() {
    this.state.enemies = [];
    this.enemiesSpawnedInWave = 9999; // Prevent more spawns
    // Do NOT hardcode status = 'WAVE_COMPLETE'. 
    // Let the very next update() gracefully handle end-of-wave math.
    this.notify();
  }

  bribeFaction() {
    const cost = 50 * this.state.sector;
    if (this.state.dataFragments >= cost && this.state.status === 'PLAYING') {
      this.state.dataFragments -= cost;
      this.adminSkipWave();
      this.saveMeta();
      this.createFloatingText("BRIBED", MAP_WIDTH/2, MAP_HEIGHT/2, '#ffff00');
    }
  }

  triggerBurnNotice() {
    // Calculate Source Code based on sector/wave
    const reward = Math.floor(this.waveIndex * this.state.sector * 2);
    this.state.prestige.sourceCode += reward;
    
    // Wipe
    this.state.towers = [];
    this.state.enemies = [];
    this.state.projectiles = [];
    this.state.credits = (this.state.upgrades.creditChip ? Math.floor(100 * 1.15) : 100) + (this.state.prestige.multipliers.startingCredits * 100);
    this.waveIndex = 0;
    this.state.wave = 0;
    this.state.sector = 1;
    this.state.status = 'START';
    this.state.isEndless = false;
    this.state.loanSharkWavesLeft = 0;
    
    this.saveMeta();
    this.notify();
    return reward;
  }

  continueCampaign() {
    this.state.mapIndex = (this.state.mapIndex || 0) + 1;
    this.wipeTowers();
    // Calling startNextWave will increment waveIndex and set status to PLAYING
    this.startNextWave();
  }

  continueEndless() {
    this.state.isEndless = true;
    this.state.mapIndex = Math.floor(Math.random() * MAP_PATHS.length);
    this.wipeTowers();
    // Since they are transitioning from VICTORY to endless, we need to manually start the next wave
    this.startNextWave();
  }

  wipeTowers() {
    this.state.towers = [];
    this.state.projectiles = [];
    this.state.mercs = [];
    this.state.pools = [];
    this.state.particles = [];
    this.createFloatingText(`MAP ASSETS DESTROYED`, MAP_WIDTH/2, MAP_HEIGHT/2, '#ff0000');
  }

  applyGlitch() {
    const glitches = [
      () => { this.state.credits += 500; this.createFloatingText("GLITCH: +500 CREDITS", MAP_WIDTH/2, MAP_HEIGHT/2, '#00ff00'); },
      () => { this.state.lives += 5; this.createFloatingText("GLITCH: +5 LIVES", MAP_WIDTH/2, MAP_HEIGHT/2, '#00ff00'); },
      () => { 
        this.state.towers.forEach(t => t.level = Math.min(2, t.level + 1)); 
        this.createFloatingText("GLITCH: ALL TOWERS UPGRADED", MAP_WIDTH/2, MAP_HEIGHT/2, '#00ff00'); 
      }
    ];
    const glitch = glitches[Math.floor(Math.random() * glitches.length)];
    glitch();
  }

  spawnEnemy(type: EnemyType) {
    const stats = ENEMY_STATS[type];
    
    let hpMultiplier = 1;
    if (this.state.isEndless) {
      hpMultiplier = Math.pow(1.2, this.waveIndex);
    } else {
      // Harder maps get more hp multiplier
      hpMultiplier = Math.pow(1.5, this.state.mapIndex || 0);
    }
    
    const finalHp = Math.floor(stats.hp * hpMultiplier);
    
    const mapPath = MAP_PATHS[this.state.mapIndex || 0];
    
    this.state.enemies.push({
      id: Math.random().toString(36).substr(2, 9),
      type,
      x: mapPath[0].x,
      y: mapPath[0].y,
      hp: finalHp,
      maxHp: finalHp,
      speed: stats.speed,
      baseSpeed: stats.speed,
      pathIndex: 0,
      reward: stats.reward,
      isFlying: stats.isFlying,
      effects: { slowTimer: 0, freezeTimer: 0, burnTimer: 0, burnDamage: 0, sludgeTimer: 0 },
      isCloaked: type === EnemyType.GHOST,
    });
  }

  updateEnemies() {
    const isBlackout = this.state.hacks[HackType.BLACKOUT].activeTimer > 0;

    for (let i = this.state.enemies.length - 1; i >= 0; i--) {
      const enemy = this.state.enemies[i];
      if (enemy.hp <= 0) continue;

      // Apply effects
      if (enemy.effects.freezeTimer > 0) {
        enemy.effects.freezeTimer--;
        continue; // Frozen, don't move
      }

      // Kuro-Sec Smoke Drones
      if (enemy.type === EnemyType.DRONE && this.state.currentFaction === Faction.KURO_SEC) {
        if (this.frame % 120 === 0) {
          // Blind nearby towers
          this.state.towers.forEach(t => {
            if (Math.hypot(t.x - enemy.x, t.y - enemy.y) <= 100) {
              t.stunTimer = Math.max(t.stunTimer, 60); // Blind for 1 second
              this.createFloatingText("BLINDED", t.x, t.y - 20, '#aaaaaa');
            }
          });
        }
      }

      if (isBlackout) {
        continue; // Blackout stops movement
      }

      let currentSpeed = enemy.baseSpeed;
      if (enemy.effects.slowTimer > 0) {
        enemy.effects.slowTimer--;
        currentSpeed *= 0.5; // 50% slow
      }

      if (enemy.effects.burnTimer > 0) {
        enemy.effects.burnTimer--;
        if (this.frame % 30 === 0) {
          this.damageEnemy(enemy, enemy.effects.burnDamage);
        }
      }

      if (enemy.effects.sludgeTimer > 0) {
        enemy.effects.sludgeTimer--;
      }

      if (enemy.hp <= 0) continue; // Might have died from burn

      // Cyber-Psycho Regen
      if (enemy.type === EnemyType.PSYCHO && enemy.hp < enemy.maxHp && this.frame % 60 === 0) {
        enemy.hp = Math.min(enemy.maxHp, enemy.hp + 50);
        this.createFloatingText('+50', enemy.x, enemy.y - 20, '#00ff00');
      }

      // Hacker logic
      if (enemy.type === EnemyType.HACKER && this.frame % 120 === 0) {
        // Find towers in range
        const towersInRange = this.state.towers.filter(t => t.stunTimer <= 0 && Math.hypot(t.x - enemy.x, t.y - enemy.y) <= 200);
        // Prioritize Holo-Decoy
        const decoys = towersInRange.filter(t => t.type === TowerType.DECOY);
        const targetTower = decoys.length > 0 
          ? decoys[Math.floor(Math.random() * decoys.length)]
          : (towersInRange.length > 0 ? towersInRange[Math.floor(Math.random() * towersInRange.length)] : null);
        
        if (targetTower) {
          if (targetTower.overclockTimer <= 0) {
            targetTower.stunTimer = 180; // 3 seconds stun
            this.createFloatingText('STUNNED', targetTower.x, targetTower.y - 20, '#ff0000');
          } else {
            this.createFloatingText('HACK BLOCKED', targetTower.x, targetTower.y - 20, '#00ffff');
          }
        }
      }

      // Arachno-Tank EMP
      if (enemy.type === EnemyType.TANK && this.frame % 180 === 0) {
        // Find decoys in range (e.g., 200)
        const decoys = this.state.towers.filter(t => t.type === TowerType.DECOY && Math.hypot(t.x - enemy.x, t.y - enemy.y) <= 200);
        const blastX = decoys.length > 0 ? decoys[0].x : enemy.x;
        const blastY = decoys.length > 0 ? decoys[0].y : enemy.y;
        
        this.createExplosion(blastX, blastY, '#00ffff', 150);
        this.createFloatingText('EMP BLAST', blastX, blastY - 30, '#00ffff');
        this.state.towers.forEach(t => {
          if (Math.hypot(t.x - blastX, t.y - blastY) <= 150) {
            t.cooldown = Math.max(t.cooldown, 120); // Disable for 2 seconds
            t.overheatTimer = Math.max(t.overheatTimer, 120);
          }
        });
      }

      // Movement
      let remainingSpeed = currentSpeed;
      while (remainingSpeed > 0) {
        const mapPath = MAP_PATHS[this.state.mapIndex || 0];
        const targetPoint = mapPath[enemy.pathIndex + 1];
        if (!targetPoint) {
          // Reached end
          this.state.lives--;
          this.state.screenGlitch = 30; // 0.5 seconds of glitch
          this.screenShake = 10;
          enemy.hp = 0;
          audio.playError();
          this.notify();
          break;
        }

        const dx = targetPoint.x - enemy.x;
        const dy = targetPoint.y - enemy.y;
        const dist = Math.hypot(dx, dy);

        if (dist <= remainingSpeed) {
          enemy.x = targetPoint.x;
          enemy.y = targetPoint.y;
          enemy.pathIndex++;
          remainingSpeed -= dist;
        } else {
          enemy.x += (dx / dist) * remainingSpeed;
          enemy.y += (dy / dist) * remainingSpeed;
          remainingSpeed = 0;
        }
      }
    }
  }

  updateTowers() {
    for (const tower of this.state.towers) {
      if (tower.stunTimer > 0) {
        tower.stunTimer--;
        continue;
      }

      if (tower.overheatTimer > 0) {
        tower.overheatTimer--;
        continue;
      }

      let isOverclocked = false;
      if (tower.overclockTimer > 0) {
        tower.overclockTimer--;
        isOverclocked = true;
        if (tower.overclockTimer === 0) {
          tower.overheatTimer = 300; // 5 seconds overheat
        }
      }

      const stats = TOWER_STATS[tower.type];
      const fireRate = isOverclocked ? stats.fireRate[tower.level] / 2 : stats.fireRate[tower.level];
      const damage = isOverclocked ? stats.damage[tower.level] * 2 : stats.damage[tower.level];
      let range = stats.range[tower.level];
      
      if (this.state.upgrades.opticalCybereye) {
        range *= 1.15;
      }

      if (tower.type === TowerType.NET_NODE) {
        if (tower.cooldown <= 0) {
          const income = (stats as any).income[tower.level];
          if (this.state.loanSharkWavesLeft <= 0) {
            this.state.credits += income;
            this.createFloatingText(`+${income}`, tower.x, tower.y, '#00ff00');
          } else {
            this.createFloatingText(`REPOSSESSED`, tower.x, tower.y, '#ff0000');
          }
          tower.cooldown = fireRate;
          this.notify();
        } else {
          tower.cooldown--;
        }

        // Black-ICE Node Hijack
        if (tower.level === 2 && this.frame % 300 === 0) {
          const target = this.state.enemies.find(e => e.hp > 0 && e.type === EnemyType.DRONE && Math.hypot(e.x - tower.x, e.y - tower.y) <= 200);
          if (target) {
            this.damageEnemy(target, 9999);
            this.createFloatingText("HIJACKED", target.x, target.y, '#00ff00');
            this.createExplosion(target.x, target.y, '#00ff00', 100);
            this.state.enemies.forEach(e => {
              if (e.hp > 0 && e.id !== target.id && Math.hypot(e.x - target.x, e.y - target.y) <= 100) {
                this.damageEnemy(e, 150);
              }
            });
          }
        }
        continue;
      }

      if (tower.type === TowerType.SCANNER) {
        // Reveal ghosts
        this.state.enemies.forEach(e => {
          if (e.isCloaked && Math.hypot(e.x - tower.x, e.y - tower.y) <= range) {
            e.isCloaked = false;
            this.createFloatingText("REVEALED", e.x, e.y - 20, '#ffffff');
          }
        });
        continue;
      }

      if (tower.type === TowerType.DECOY) {
        // Attract enemies (slow them down if near)
        this.state.enemies.forEach(e => {
          if (Math.hypot(e.x - tower.x, e.y - tower.y) <= 100) {
             e.effects.slowTimer = Math.max(e.effects.slowTimer, 2); // Constant slow while near
          }
        });
        continue;
      }

      if (tower.cooldown > 0) {
        tower.cooldown--;
        continue;
      }

      // Find target
      let target = this.state.enemies.find(e => e.id === tower.targetId && e.hp > 0);
      
      // Validate target
      if (!target || Math.hypot(target.x - tower.x, target.y - tower.y) > range || target.isCloaked) {
        target = this.findTarget(tower, range);
        tower.targetId = target ? target.id : null;
      }

      if (target) {
        this.fireProjectile(tower, target, damage);
        audio.playShoot(tower.type);
        
        // Apply mainframe attack speed buff
        let finalFireRate = fireRate;
        if (this.state.mainframe && this.state.mainframe.heat < 100) {
          const speedBuff = this.state.mainframe.allocations.attackSpeed / 100; // 0 to 1
          finalFireRate = Math.max(1, Math.floor(fireRate * (1 - (speedBuff * 0.5)))); // Up to 50% faster
        }
        
        tower.cooldown = finalFireRate;
      }
    }
  }

  findTarget(tower: Tower, range: number): Enemy | undefined {
    return this.state.enemies.find(e => {
      if (e.hp <= 0) return false;
      if (e.isCloaked) return false;
      if (tower.type === TowerType.FLAK && !e.isFlying) return false;
      if (tower.type !== TowerType.FLAK && e.isFlying) return false; // Only flak hits air
      return Math.hypot(e.x - tower.x, e.y - tower.y) <= range;
    });
  }

  hireMerc(type: MercType, x: number, y: number) {
    if (!this.state.isEndless && this.state.mercs.length >= 1) {
      this.createFloatingText("MERC LIMIT REACHED", x, y, '#ff0000');
      return false;
    }
    const cost = MERC_STATS[type].cost;
    if (this.state.credits >= cost) {
      this.state.credits -= cost;
      this.state.mercs.push({
        id: Math.random().toString(36).substr(2, 9),
        type,
        x, y,
        cooldown: 0,
        targetId: null
      });
      this.notify();
      return true;
    }
    return false;
  }

  updateMercs() {
    for (let i = this.state.mercs.length - 1; i >= 0; i--) {
      const merc = this.state.mercs[i];
      const stats = MERC_STATS[merc.type];
      if (merc.cooldown > 0) merc.cooldown--;

      if (merc.type === MercType.MEDIC) {
        let targetTower = this.state.towers.find(t => t.stunTimer > 0 || t.overheatTimer > 0);
        if (!targetTower && this.state.towers.length > 0) {
          targetTower = this.state.towers[Math.floor(Math.random() * this.state.towers.length)];
        }

        if (targetTower) {
          const dx = targetTower.x - merc.x;
          const dy = targetTower.y - merc.y;
          const dist = Math.hypot(dx, dy);

          if (dist > stats.range) {
            merc.x += (dx / dist) * stats.speed;
            merc.y += (dy / dist) * stats.speed;
          } else if (merc.cooldown <= 0) {
            if (targetTower.stunTimer > 0) targetTower.stunTimer = 0;
            if (targetTower.overheatTimer > 0) targetTower.overheatTimer = 0;
            this.createFloatingText('FIXED', targetTower.x, targetTower.y - 20, '#00ff88');
            merc.cooldown = 60 / stats.fireRate;
          }
        }
      } else {
        let target = this.state.enemies.find(e => e.id === merc.targetId);
        if (!target || target.hp <= 0) {
          let closestDist = Infinity;
          for (const e of this.state.enemies) {
            if (e.hp > 0) {
              const dist = Math.hypot(e.x - merc.x, e.y - merc.y);
              if (dist < closestDist) {
                closestDist = dist;
                target = e;
              }
            }
          }
          if (target) merc.targetId = target.id;
        }

        if (target) {
          const dx = target.x - merc.x;
          const dy = target.y - merc.y;
          const dist = Math.hypot(dx, dy);

          if (dist > stats.range) {
            merc.x += (dx / dist) * stats.speed;
            merc.y += (dy / dist) * stats.speed;
          } else if (merc.cooldown <= 0) {
            if (merc.type === MercType.HEAVY) {
              this.state.projectiles.push({
                id: Math.random().toString(36).substr(2, 9),
                x: merc.x, y: merc.y,
                targetId: target.id,
                targetX: target.x, targetY: target.y,
                damage: stats.damage,
                speed: 15,
                type: TowerType.SHREDDER, // Reusing bullet type
                level: 0
              });
              audio.playShoot(TowerType.SHREDDER);
            } else if (merc.type === MercType.SAMURAI) {
              this.damageEnemy(target, stats.damage);
              this.createExplosion(target.x, target.y, stats.color, 30);
              audio.playShoot(TowerType.EMP); // Reusing hit sound
            }
            merc.cooldown = 60 / stats.fireRate;
          }
        }
      }
    }
  }

  fireProjectile(tower: Tower, target: Enemy, damage: number) {
    // Muzzle flash
    const cx = tower.x + GRID_SIZE / 2;
    const cy = tower.y + GRID_SIZE / 2;
    const angle = Math.atan2(target.y - cy, target.x - cx);
    this.state.particles.push({
      x: cx + Math.cos(angle) * 15,
      y: cy + Math.sin(angle) * 15,
      vx: Math.cos(angle) * 2,
      vy: Math.sin(angle) * 2,
      life: 5, maxLife: 5,
      color: TOWER_STATS[tower.type].color,
      size: 8,
    });

    if (tower.type === TowerType.EMP) {
      if (target.type === EnemyType.MUTANT) {
        this.createFloatingText("IMMUNE", target.x, target.y - 20, '#ffffff');
        return;
      }
      if (target.type === EnemyType.DRONE && this.state.currentFaction === Faction.KURO_SEC) {
        this.damageEnemy(target, 9999);
        this.createFloatingText("SHORT CIRCUIT", target.x, target.y - 20, '#ffff00');
        this.createExplosion(target.x, target.y, '#ffff00', 30);
        return;
      }
      // Instant effect
      const stats = TOWER_STATS[TowerType.EMP];
      const slowFactor = stats.slowFactor![tower.level];
      const duration = stats.slowDuration![tower.level];
      
      if (slowFactor === 0) {
        target.effects.freezeTimer = duration;
      } else {
        target.effects.slowTimer = duration;
      }
      
      // EMP visual effect
      this.createExplosion(target.x, target.y, '#ffff00', 30);
      return;
    }

    this.state.projectiles.push({
      id: Math.random().toString(36).substr(2, 9),
      x: cx + Math.cos(angle) * 10,
      y: cy + Math.sin(angle) * 10,
      targetId: target.id,
      targetX: target.x,
      targetY: target.y,
      speed: 10,
      damage: damage,
      type: tower.type,
      splashRadius: (TOWER_STATS[tower.type] as any).splash?.[tower.level],
      level: tower.level,
    });
  }

  updateProjectiles() {
    for (let i = this.state.projectiles.length - 1; i >= 0; i--) {
      const p = this.state.projectiles[i];
      const target = this.state.enemies.find(e => e.id === p.targetId && e.hp > 0);

      if (target) {
        p.targetX = target.x;
        p.targetY = target.y;
      }

      const dx = p.targetX - p.x;
      const dy = p.targetY - p.y;
      const dist = Math.hypot(dx, dy);

      if (dist <= p.speed) {
        // Hit
        if (p.splashRadius) {
          audio.playExplosion();
          this.createExplosion(p.targetX, p.targetY, TOWER_STATS[p.type].color, p.splashRadius);
          this.state.enemies.forEach(e => {
            if (e.hp > 0 && Math.hypot(e.x - p.targetX, e.y - p.targetY) <= p.splashRadius!) {
              let finalDamage = p.damage;
              
              // Ignition combo
              if (p.type === TowerType.PLASMA && e.effects.sludgeTimer > 0) {
                 finalDamage *= 2;
                 this.createExplosion(e.x, e.y, '#ff6600', p.splashRadius! * 1.5);
                 this.createFloatingText("IGNITION!", e.x, e.y - 20, '#ff6600');
                 e.effects.sludgeTimer = 0; // Consume sludge
              }
              
              this.damageEnemy(e, finalDamage);
              if (p.type === TowerType.PLASMA && p.level === 2) { // Max level plasma
                e.effects.burnTimer = 180;
                e.effects.burnDamage = 10;
              }
            }
          });
          
          // Fusion Mortar Pool
          if (p.type === TowerType.PLASMA && p.level === 2) {
            let poolRadius = 80;
            if (this.state.upgrades.widerSlag) poolRadius *= 1.5;
            this.state.pools.push({
              x: p.targetX,
              y: p.targetY,
              radius: poolRadius,
              life: 180, // 3 seconds
              maxLife: 180,
              damage: 15
            });
          }
        } else if (target) {
          let finalDamage = p.damage;
          // Shatter combo
          if (p.type === TowerType.SHREDDER && target.effects.freezeTimer > 0) {
            finalDamage *= 3;
            this.createFloatingText("SHATTER!", target.x, target.y - 20, '#00ffff');
          }
          
          this.damageEnemy(target, finalDamage);
          this.createExplosion(p.targetX, p.targetY, TOWER_STATS[p.type].color, 10);
          
          if (p.type === TowerType.CHEM) {
             target.effects.sludgeTimer = 180; // 3 seconds
          }

          // Ricochet
          if (p.type === TowerType.SHREDDER && this.state.upgrades.ricochet && !p.hasRicocheted) {
             const nextTarget = this.state.enemies.find(e => e.hp > 0 && e.id !== target.id && Math.hypot(e.x - target.x, e.y - target.y) <= 150);
             if (nextTarget) {
                p.targetId = nextTarget.id;
                p.hasRicocheted = true;
                p.x = target.x;
                p.y = target.y;
                continue; // Don't splice
             }
          }
        }
        this.state.projectiles.splice(i, 1);
      } else {
        p.x += (dx / dist) * p.speed;
        p.y += (dy / dist) * p.speed;
      }
    }
  }

  damageEnemy(enemy: Enemy, amount: number) {
    if (enemy.hp <= 0) return;
    
    const multiplier = 1 + (this.state.prestige?.multipliers?.globalDamage || 0);
    const finalAmount = Math.floor(amount * multiplier);
    
    enemy.hp -= finalAmount;
    if (enemy.hp <= 0) {
      if (this.state.loanSharkWavesLeft <= 0) {
        this.state.credits += enemy.reward;
        this.createFloatingText(`+${enemy.reward}`, enemy.x, enemy.y, '#ffff00');
      } else {
        this.createFloatingText(`REPOSSESSED`, enemy.x, enemy.y, '#ff0000');
      }
      
      // 20% chance to drop a data fragment
      if (Math.random() < 0.2) {
        this.state.dataFragments++;
        this.saveMeta();
        this.createFloatingText('+1 FRAGMENT', enemy.x, enemy.y - 15, '#ff00ff');
      }

      // Track faction kills
      if (this.state.currentFaction !== Faction.NONE) {
        this.state.factionKills[this.state.currentFaction] = (this.state.factionKills[this.state.currentFaction] || 0) + 1;
      }

      this.createExplosion(enemy.x, enemy.y, '#ff8800', 20);
      audio.playExplosion();
      this.notify();
    }
  }

  updateParticles() {
    for (let i = this.state.particles.length - 1; i >= 0; i--) {
      const p = this.state.particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.life--;
      if (p.life <= 0) {
        this.state.particles.splice(i, 1);
      }
    }
  }

  updatePools() {
    for (let i = this.state.pools.length - 1; i >= 0; i--) {
      const pool = this.state.pools[i];
      pool.life--;
      if (pool.life <= 0) {
        this.state.pools.splice(i, 1);
        continue;
      }
      if (this.frame % 30 === 0) {
        this.state.enemies.forEach(e => {
          if (e.hp > 0 && Math.hypot(e.x - pool.x, e.y - pool.y) <= pool.radius) {
            this.damageEnemy(e, pool.damage);
          }
        });
      }
    }
  }

  updateFloatingTexts() {
    for (let i = this.state.floatingTexts.length - 1; i >= 0; i--) {
      const ft = this.state.floatingTexts[i];
      ft.y -= 0.5;
      ft.life--;
      if (ft.life <= 0) {
        this.state.floatingTexts.splice(i, 1);
      }
    }
  }

  createExplosion(x: number, y: number, color: string, radius: number) {
    this.screenShake = Math.max(this.screenShake, radius / 10);
    // Shockwave
    this.state.particles.push({
      x, y,
      vx: 0, vy: 0,
      life: 15, maxLife: 15,
      color: 'rgba(255, 255, 255, 0.8)',
      size: radius,
    });

    // Sparks
    for (let i = 0; i < radius / 2; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 5 + 2;
      this.state.particles.push({
        x, y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 10 + Math.random() * 15,
        maxLife: 25,
        color,
        size: Math.random() * 3 + 1,
      });
    }

    // Smoke
    for (let i = 0; i < radius / 4; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 1;
      this.state.particles.push({
        x, y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 30 + Math.random() * 30,
        maxLife: 60,
        color: 'rgba(50, 50, 50, 0.5)',
        size: Math.random() * 8 + 4,
      });
    }
  }

  createFloatingText(text: string, x: number, y: number, color: string) {
    this.state.floatingTexts.push({
      text, x, y, life: 60, maxLife: 60, color
    });
  }

  buildTower(type: TowerType, x: number, y: number) {
    const cost = Math.floor(TOWER_STATS[type].cost[0] * this.state.sabotageDiscount);
    if (this.state.credits >= cost) {
      this.state.credits -= cost;
      this.state.towers.push({
        id: Math.random().toString(36).substr(2, 9),
        type,
        x, y,
        level: 0,
        cooldown: 0,
        targetId: null,
        overclockTimer: 0,
        overheatTimer: 0,
        stunTimer: 0,
        range: TOWER_STATS[type].range[0],
        damage: TOWER_STATS[type].damage[0],
        fireRate: TOWER_STATS[type].fireRate[0],
      });
      this.notify();
      return true;
    }
    return false;
  }

  moveTower(towerId: string, x: number, y: number) {
    const tower = this.state.towers.find(t => t.id === towerId);
    if (tower) {
      // Check for merge
      const targetTower = this.state.towers.find(t => t.id !== towerId && t.x === x && t.y === y);
      if (targetTower && targetTower.type === tower.type && targetTower.level === tower.level) {
        // Merge!
        this.upgradeTower(targetTower.id, true); // Force upgrade
        this.state.towers = this.state.towers.filter(t => t.id !== towerId);
        this.createFloatingText("MERGED!", x, y - 20, '#00ffff');
        this.createExplosion(x, y, '#00ffff', 30);
        audio.playShoot(TowerType.EMP);
        this.notify();
        return true;
      }

      tower.x = x;
      tower.y = y;
      this.notify();
      return true;
    }
    return false;
  }

  upgradeTower(towerId: string, force: boolean = false) {
    const tower = this.state.towers.find(t => t.id === towerId);
    if (tower) {
      let cost = 0;
      if (tower.level < 2) {
        cost = TOWER_STATS[tower.type].cost[tower.level + 1];
      } else if (this.state.isEndless) {
        cost = Math.floor(TOWER_STATS[tower.type].cost[2] * Math.pow(1.5, tower.level - 1));
      } else if (!force) {
        return; // Max level in campaign
      }

      if (force || this.state.credits >= cost) {
        if (!force) {
          this.state.credits -= cost;
        }
        tower.level++;
        
        if (tower.level <= 2) {
          tower.range = TOWER_STATS[tower.type].range[tower.level];
          tower.damage = TOWER_STATS[tower.type].damage[tower.level];
          tower.fireRate = TOWER_STATS[tower.type].fireRate[tower.level];
        } else {
          // Infinite scaling
          tower.damage = Math.floor(tower.damage * 1.5);
          // Range and fire rate cap out
        }
        this.notify();
      }
    }
  }

  overclockTower(towerId: string) {
    const tower = this.state.towers.find(t => t.id === towerId);
    if (tower && tower.overclockTimer === 0 && tower.overheatTimer === 0) {
      tower.overclockTimer = 600; // 10 seconds at 60fps
      this.notify();
    }
  }

  sellTower(towerId: string) {
    const index = this.state.towers.findIndex(t => t.id === towerId);
    if (index !== -1) {
      const tower = this.state.towers[index];
      let totalCost = 0;
      for (let i = 0; i <= tower.level; i++) {
        totalCost += TOWER_STATS[tower.type].cost[i];
      }
      this.state.credits += Math.floor(totalCost * 0.5);
      this.state.towers.splice(index, 1);
      this.notify();
    }
  }

  scrapTower(towerId: string) {
    const index = this.state.towers.findIndex(t => t.id === towerId);
    if (index !== -1) {
      const tower = this.state.towers[index];
      this.createExplosion(tower.x, tower.y, '#ff0000', 150);
      this.state.enemies.forEach(e => {
        if (e.hp > 0 && Math.hypot(e.x - tower.x, e.y - tower.y) <= 150) {
          this.damageEnemy(e, 1000 + (tower.level * 500));
        }
      });
      this.state.towers.splice(index, 1);
      audio.playExplosion();
      this.notify();
    }
  }

  callFixer() {
    if (!this.state.isEndless && this.state.loanUsed) return;
    if (this.state.loanSharkWavesLeft === 0) {
      this.state.credits += 2000;
      this.state.loanSharkWavesLeft = 3;
      this.state.loanUsed = true;
      this.notify();
    }
  }

  useHack(type: HackType) {
    const hack = this.state.hacks[type];
    if (hack.cooldown > 0) return;

    let cooldownMultiplier = 1;
    if (this.state.upgrades.synapticAccelerator) {
      cooldownMultiplier = 0.8; // 20% reduction
    }

    if (type === HackType.BLACKOUT) {
      hack.activeTimer = 240; // 4 seconds
      hack.cooldown = 1800 * cooldownMultiplier; // 30 seconds
      this.screenShake = 5;
    } else if (type === HackType.LASER) {
      // Orbital Laser - damage all enemies
      this.state.enemies.forEach(e => {
        if (e.hp > 0) this.damageEnemy(e, 500);
      });
      hack.cooldown = 3600 * cooldownMultiplier; // 60 seconds
      this.screenShake = 20;
      // Visual effect handled by renderer checking cooldown just started
    } else if (type === HackType.OVERRIDE) {
      // Find strongest enemy
      let target: Enemy | undefined;
      for (const e of this.state.enemies) {
        if (e.hp > 0 && (!target || e.hp > target.hp)) target = e;
      }
      
      if (target) {
        this.createExplosion(target.x, target.y, '#ffffff', 150);
        this.state.enemies.forEach(e => {
          if (e.hp > 0 && Math.hypot(e.x - target!.x, e.y - target!.y) <= 150) {
            this.damageEnemy(e, 1000);
          }
        });
        this.damageEnemy(target, 9999); // Kill target
      }
      hack.cooldown = 2400 * cooldownMultiplier; // 40 seconds
      this.screenShake = 15;
    }
    this.notify();
  }
}
