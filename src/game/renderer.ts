import { GameState, TowerType, EnemyType, HackType, MercType } from './types';
import { MAP_PATHS, TOWER_STATS, ENEMY_STATS, MAP_WIDTH, MAP_HEIGHT, GRID_SIZE, MERC_STATS } from './constants';

export class Renderer {
  ctx: CanvasRenderingContext2D;
  rainDrops: { x: number; y: number; speed: number; length: number }[] = [];
  towerAngles = new Map<string, number>();
  buildings: { x: number; y: number; w: number; h: number; color: string; windows: number }[] = [];

  constructor(ctx: CanvasRenderingContext2D) {
    this.ctx = ctx;
    // Generate city buildings
    this.generateBuildings();
  }

  generateBuildings() {
    const mapPath = MAP_PATHS[0];
    const pathPixels = new Set<string>();
    
    // Mark path cells
    for (let i = 0; i < mapPath.length - 1; i++) {
      const p1 = mapPath[i];
      const p2 = mapPath[i + 1];
      const dist = Math.hypot(p2.x - p1.x, p2.y - p1.y);
      for (let d = 0; d <= dist; d += 5) {
        const t = d / dist;
        const x = Math.round(p1.x + (p2.x - p1.x) * t);
        const y = Math.round(p1.y + (p2.y - p1.y) * t);
        pathPixels.add(`${x},${y}`);
      }
    }

    // Generate buildings in non-path areas
    for (let x = 0; x < MAP_WIDTH; x += GRID_SIZE * 2) {
      for (let y = 0; y < MAP_HEIGHT; y += GRID_SIZE * 2) {
        let isNearPath = false;
        for (let dx = -60; dx <= 60; dx += 20) {
          for (let dy = -60; dy <= 60; dy += 20) {
            if (pathPixels.has(`${x + dx},${y + dy}`)) {
              isNearPath = true;
              break;
            }
          }
          if (isNearPath) break;
        }
        
        if (!isNearPath && Math.random() > 0.3) {
          const w = GRID_SIZE + Math.random() * GRID_SIZE;
          const h = GRID_SIZE + Math.random() * GRID_SIZE;
          const colors = ['#0a3a0a', '#1a2a3a', '#2a1a3a', '#3a2a1a'];
          const color = colors[Math.floor(Math.random() * colors.length)];
          this.buildings.push({ x, y, w, h, color, windows: Math.floor(Math.random() * 3) + 2 });
        }
      }
    }
  }

  render(state: GameState, hoverCell: { x: number; y: number } | null, selectedTowerId: string | null, screenShake: number = 0) {
    this.ctx.save();
    
    if (screenShake > 0) {
      const dx = (Math.random() - 0.5) * screenShake;
      const dy = (Math.random() - 0.5) * screenShake;
      this.ctx.translate(dx, dy);
    }

    this.ctx.clearRect(0, 0, MAP_WIDTH, MAP_HEIGHT);

    this.drawBackground(state);
    this.drawPath(state);
    this.drawPools(state);
    this.drawGrid(hoverCell);
    this.drawTowers(state, selectedTowerId);
    this.drawMercs(state);
    this.drawEnemies(state);
    this.drawProjectiles(state);
    this.drawParticles(state);
    this.drawRain();
    this.drawHacksEffects(state);
    this.drawFloatingTexts(state);

    this.ctx.restore();
  }

  drawBackground(state: GameState) {
    let bgColor = '#0a0a0a';
    let streetColor = '#1a1a1a';
    let neonColor = '#00ffff';

    if (state.sector === 1) {
      bgColor = '#0a0a0a';
      streetColor = '#151515';
      neonColor = '#00ffff';
    } else if (state.sector === 2) {
      bgColor = '#0a000a';
      streetColor = '#1a0a1a';
      neonColor = '#ff00ff';
    } else if (state.sector === 3) {
      bgColor = '#000a00';
      streetColor = '#0a1a0a';
      neonColor = '#33ff33';
    } else if (state.sector >= 4) {
      bgColor = '#0a0a0a';
      streetColor = '#1a1a0a';
      neonColor = '#ffcc00';
    }

    // Base background
    this.ctx.fillStyle = bgColor;
    this.ctx.fillRect(0, 0, MAP_WIDTH, MAP_HEIGHT);

    // Draw buildings
    for (const building of this.buildings) {
      this.ctx.fillStyle = building.color;
      this.ctx.fillRect(building.x, building.y, building.w, building.h);
      
      // Building outline
      this.ctx.strokeStyle = 'rgba(0, 0, 0, 0.5)';
      this.ctx.lineWidth = 1;
      this.ctx.strokeRect(building.x, building.y, building.w, building.h);
      
      // Windows with glow
      const glowIntensity = 0.3 + Math.sin(Date.now() / 500) * 0.2;
      this.ctx.fillStyle = `rgba(255, 255, 100, ${glowIntensity})`;
      const winSize = 6;
      for (let wy = 0; wy < building.h - 4; wy += 12) {
        for (let wx = 0; wx < building.w - 4; wx += 12) {
          this.ctx.fillRect(building.x + 2 + wx, building.y + 2 + wy, winSize, winSize);
        }
      }
    }

    // Draw streets with markings
    const mapPath = MAP_PATHS[state.mapIndex || 0];
    this.ctx.strokeStyle = streetColor;
    this.ctx.lineWidth = 10;
    this.ctx.lineCap = 'round';
    this.ctx.lineJoin = 'round';
    this.ctx.beginPath();
    this.ctx.moveTo(mapPath[0].x, mapPath[0].y);
    for (const point of mapPath.slice(1)) {
      this.ctx.lineTo(point.x, point.y);
    }
    this.ctx.stroke();

    // Street center line markings
    this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    this.ctx.lineWidth = 1;
    this.ctx.setLineDash([10, 10]);
    this.ctx.beginPath();
    this.ctx.moveTo(mapPath[0].x, mapPath[0].y);
    for (const point of mapPath.slice(1)) {
      this.ctx.lineTo(point.x, point.y);
    }
    this.ctx.stroke();
    this.ctx.setLineDash([]);

    if (state.isEndless && state.currentFaction !== 'NONE') {
      this.ctx.save();
      this.ctx.globalAlpha = 0.03;
      this.ctx.fillStyle = neonColor;
      this.ctx.font = 'bold 140px monospace';
      this.ctx.textAlign = 'center';
      this.ctx.textBaseline = 'middle';
      this.ctx.translate(MAP_WIDTH / 2, MAP_HEIGHT / 2);
      this.ctx.rotate(-Math.PI / 6);
      this.ctx.fillText(state.currentFaction.replace('_', ' '), 0, 0);
      this.ctx.restore();
    }
  }

  drawPath(state: GameState) {
    let pathColor = 'rgba(10, 15, 30, 0.8)';
    let neonColor = '#00ffff';

    if (state.sector === 1) {
      pathColor = 'rgba(10, 15, 30, 0.8)';
      neonColor = '#00ffff';
    } else if (state.sector === 2) {
      pathColor = 'rgba(30, 10, 30, 0.8)';
      neonColor = '#ff00ff';
    } else if (state.sector === 3) {
      pathColor = 'rgba(10, 30, 10, 0.8)';
      neonColor = '#33ff33';
    } else if (state.sector >= 4) {
      pathColor = 'rgba(30, 30, 30, 0.8)';
      neonColor = '#ffcc00';
    }

    const mapPath = MAP_PATHS[state.mapIndex || 0];

    // Base path
    this.ctx.beginPath();
    this.ctx.moveTo(mapPath[0].x, mapPath[0].y);
    for (let i = 1; i < mapPath.length; i++) {
      this.ctx.lineTo(mapPath[i].x, mapPath[i].y);
    }
    this.ctx.strokeStyle = pathColor;
    this.ctx.lineWidth = 40;
    this.ctx.lineCap = 'round';
    this.ctx.lineJoin = 'round';
    this.ctx.stroke();

    // Inner glowing data stream
    const time = Date.now() / 1000;
    this.ctx.beginPath();
    this.ctx.moveTo(mapPath[0].x, mapPath[0].y);
    for (let i = 1; i < mapPath.length; i++) {
      this.ctx.lineTo(mapPath[i].x, mapPath[i].y);
    }
    this.ctx.strokeStyle = neonColor;
    this.ctx.lineWidth = 4;
    this.ctx.setLineDash([20, 20]);
    this.ctx.lineDashOffset = -time * 50; // Animate dash
    this.ctx.shadowBlur = 15;
    this.ctx.shadowColor = neonColor;
    this.ctx.stroke();
    
    // Reset styles
    this.ctx.setLineDash([]);
    this.ctx.shadowBlur = 0;
    
    // Path borders
    this.ctx.beginPath();
    this.ctx.moveTo(mapPath[0].x, mapPath[0].y);
    for (let i = 1; i < mapPath.length; i++) {
      this.ctx.lineTo(mapPath[i].x, mapPath[i].y);
    }
    this.ctx.strokeStyle = neonColor;
    this.ctx.lineWidth = 1;
    this.ctx.globalAlpha = 0.5;
    this.ctx.stroke();
    this.ctx.globalAlpha = 1.0;
  }

  drawGrid(hoverCell: { x: number; y: number } | null) {
    if (hoverCell) {
      this.ctx.fillStyle = 'rgba(0, 255, 255, 0.15)';
      this.ctx.fillRect(hoverCell.x * GRID_SIZE, hoverCell.y * GRID_SIZE, GRID_SIZE, GRID_SIZE);
      this.ctx.strokeStyle = '#00ffff';
      this.ctx.lineWidth = 2;
      this.ctx.shadowBlur = 10;
      this.ctx.shadowColor = '#00ffff';
      this.ctx.strokeRect(hoverCell.x * GRID_SIZE, hoverCell.y * GRID_SIZE, GRID_SIZE, GRID_SIZE);
      
      // Corner accents
      this.ctx.beginPath();
      const s = 6; // size of corner accent
      const x = hoverCell.x * GRID_SIZE;
      const y = hoverCell.y * GRID_SIZE;
      // Top left
      this.ctx.moveTo(x, y + s); this.ctx.lineTo(x, y); this.ctx.lineTo(x + s, y);
      // Top right
      this.ctx.moveTo(x + GRID_SIZE - s, y); this.ctx.lineTo(x + GRID_SIZE, y); this.ctx.lineTo(x + GRID_SIZE, y + s);
      // Bottom right
      this.ctx.moveTo(x + GRID_SIZE, y + GRID_SIZE - s); this.ctx.lineTo(x + GRID_SIZE, y + GRID_SIZE); this.ctx.lineTo(x + GRID_SIZE - s, y + GRID_SIZE);
      // Bottom left
      this.ctx.moveTo(x + s, y + GRID_SIZE); this.ctx.lineTo(x, y + GRID_SIZE); this.ctx.lineTo(x, y + GRID_SIZE - s);
      this.ctx.lineWidth = 3;
      this.ctx.strokeStyle = '#ffffff';
      this.ctx.stroke();
      this.ctx.shadowBlur = 0;
    }
  }

  drawTowers(state: GameState, selectedTowerId: string | null) {
    for (const tower of state.towers) {
      const cx = tower.x + GRID_SIZE / 2;
      const cy = tower.y + GRID_SIZE / 2;
      const stats = TOWER_STATS[tower.type];

      // Base Plate
      this.ctx.fillStyle = '#111';
      this.ctx.strokeStyle = '#333';
      this.ctx.lineWidth = 2;
      this.ctx.beginPath();
      this.ctx.moveTo(tower.x + 8, tower.y + 4);
      this.ctx.lineTo(tower.x + GRID_SIZE - 8, tower.y + 4);
      this.ctx.lineTo(tower.x + GRID_SIZE - 4, tower.y + 8);
      this.ctx.lineTo(tower.x + GRID_SIZE - 4, tower.y + GRID_SIZE - 8);
      this.ctx.lineTo(tower.x + GRID_SIZE - 8, tower.y + GRID_SIZE - 4);
      this.ctx.lineTo(tower.x + 8, tower.y + GRID_SIZE - 4);
      this.ctx.lineTo(tower.x + 4, tower.y + GRID_SIZE - 8);
      this.ctx.lineTo(tower.x + 4, tower.y + 8);
      this.ctx.closePath();
      this.ctx.fill();
      this.ctx.stroke();

      // Overheat / Overclock visual
      if (tower.overheatTimer > 0) {
        this.ctx.fillStyle = 'rgba(255, 0, 0, 0.3)';
        this.ctx.fill();
        this.ctx.shadowBlur = 10;
        this.ctx.shadowColor = '#ff0000';
      } else if (tower.overclockTimer > 0) {
        this.ctx.shadowBlur = 15;
        this.ctx.shadowColor = '#00ffff';
      }

      // Tower specific visuals
      this.ctx.fillStyle = stats.color;
      this.ctx.strokeStyle = stats.color;
      this.ctx.lineWidth = 2;
      
      this.ctx.save();
      this.ctx.translate(cx, cy);
      
      // Calculate rotation towards target
      let currentAngle = this.towerAngles.get(tower.id) || -Math.PI / 2; // Default facing up visually
      if (tower.targetId) {
        const target = state.enemies.find(e => e.id === tower.targetId);
        if (target) {
          const targetAngle = Math.atan2(target.y - cy, target.x - cx);
          // Shortest path interpolation
          const diff = Math.atan2(Math.sin(targetAngle - currentAngle), Math.cos(targetAngle - currentAngle));
          currentAngle += diff * 0.15; // smoothness
        }
      }
      this.towerAngles.set(tower.id, currentAngle);

      this.ctx.rotate(currentAngle + Math.PI / 2); // Rotate to face target (+ PI/2 because towers are drawn pointing 'up' ie mostly negative y)
      
      // If tower has a target, rotate towards it (simplified, just visual flair)
      const currentFireRate = Array.isArray(stats.fireRate) ? stats.fireRate[Math.min(tower.level, stats.fireRate.length - 1)] : stats.fireRate;
      if (tower.cooldown < currentFireRate * 0.8 && tower.targetId) {
        // Just a slight jiggle when firing
        this.ctx.rotate((Math.random() - 0.5) * 0.1);
      }

      this.ctx.beginPath();
      if (tower.type === TowerType.SHREDDER) {
        // Rotating gun barrel
        this.ctx.arc(0, 0, 10 + tower.level * 1.5, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.beginPath();
        // Multiple barrels
        for (let i = 0; i < 3; i++) {
          const angle = (i * Math.PI * 2 / 3) + Date.now() / 300;
          this.ctx.moveTo(Math.cos(angle) * 4, Math.sin(angle) * 4);
          this.ctx.lineTo(Math.cos(angle) * 16, Math.sin(angle) * 16);
        }
        this.ctx.stroke();
      } else if (tower.type === TowerType.FLAK) {
        // Missile launcher rack
        this.ctx.rect(-12, -12, 24, 24);
        this.ctx.fill();
        this.ctx.stroke();
        // Launch tubes
        this.ctx.fillStyle = '#222';
        for (let i = 0; i < 4; i++) {
          const x = -8 + i * 5.3;
          this.ctx.fillRect(x - 2, -14, 4, 8);
        }
        this.ctx.beginPath();
      } else if (tower.type === TowerType.PLASMA) {
        // Energy cannon
        this.ctx.moveTo(0, -14);
        this.ctx.lineTo(14, 10);
        this.ctx.lineTo(-14, 10);
        this.ctx.fill();
        this.ctx.beginPath();
        this.ctx.arc(0, 0, 6, 0, Math.PI * 2);
        this.ctx.fillStyle = '#ffff00';
        this.ctx.fill();
        // Energy core glow
        this.ctx.beginPath();
        this.ctx.arc(0, 0, 8 + Math.sin(Date.now() / 200) * 2, 0, Math.PI * 2);
        this.ctx.globalAlpha = 0.3;
        this.ctx.stroke();
      } else if (tower.type === TowerType.EMP) {
        // Pulse emitter
        this.ctx.arc(0, 0, 11, 0, Math.PI, true);
        this.ctx.fill();
        this.ctx.stroke();
        // Pulse rings
        for (let i = 0; i < 3; i++) {
          const radius = 6 + i * 4 + (Date.now() % 400) / 50;
          this.ctx.beginPath();
          this.ctx.arc(0, 0, radius, 0, Math.PI * 2);
          this.ctx.globalAlpha = 0.3 - i * 0.1;
          this.ctx.stroke();
        }
      } else if (tower.type === TowerType.NET_NODE) {
        // Node with cables
        this.ctx.rect(-7, -13, 14, 26);
        this.ctx.fill();
        this.ctx.stroke();
        this.ctx.fillStyle = '#00ff00';
        this.ctx.fillRect(-3, -9, 6, 18);
        // Indicator lights
        for (let i = 0; i < 3; i++) {
          this.ctx.beginPath();
          this.ctx.arc(-9, -6 + i * 6, 1.5, 0, Math.PI * 2);
          this.ctx.fill();
        }
        this.ctx.beginPath();
      } else if (tower.type === TowerType.CHEM) {
        // Chemical dispenser
        this.ctx.arc(0, 0, 9, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.stroke();
        this.ctx.fillStyle = '#00ff00';
        this.ctx.beginPath();
        this.ctx.arc(0, -2, 4, 0, Math.PI * 2);
        this.ctx.fill();
        // Nozzle
        this.ctx.fillStyle = stats.color;
        this.ctx.beginPath();
        this.ctx.rect(-2, 6, 4, 8);
        this.ctx.fill();
      } else if (tower.type === TowerType.DECOY) {
        // Holographic projector
        this.ctx.moveTo(0, -12);
        this.ctx.lineTo(12, 12);
        this.ctx.lineTo(-12, 12);
        this.ctx.globalAlpha = 0.5 + Math.sin(Date.now() / 150) * 0.25;
        this.ctx.fill();
        this.ctx.stroke();
        this.ctx.globalAlpha = 1.0;
      } else if (tower.type === TowerType.SCANNER) {
        // Radar dome
        this.ctx.arc(0, 0, 13, 0, Math.PI);
        this.ctx.fill();
        this.ctx.stroke();
        // Scanning beam
        const angle = (Date.now() % 2000) / 2000 * Math.PI;
        this.ctx.beginPath();
        this.ctx.moveTo(0, 0);
        this.ctx.lineTo(Math.cos(angle - Math.PI / 2) * 16, Math.sin(angle - Math.PI / 2) * 16);
        this.ctx.globalAlpha = 0.6;
        this.ctx.stroke();
      }
      
      this.ctx.restore();
      this.ctx.globalAlpha = 1.0;
      this.ctx.shadowBlur = 0;

      if (tower.stunTimer > 0) {
        this.ctx.fillStyle = 'rgba(255, 0, 0, 0.5)';
        this.ctx.fillRect(tower.x + 4, tower.y + 4, GRID_SIZE - 8, GRID_SIZE - 8);
        // Glitch effect
        this.ctx.fillStyle = '#fff';
        this.ctx.fillRect(tower.x + Math.random() * GRID_SIZE, tower.y + Math.random() * GRID_SIZE, 10, 2);
        this.ctx.fillStyle = '#fff';
        this.ctx.font = '10px monospace';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('STUNNED', cx, cy + 5);
      }

      // Level indicators
      this.ctx.fillStyle = '#fff';
      for (let i = 0; i <= tower.level; i++) {
        this.ctx.fillRect(tower.x + 2 + i * 6, tower.y + GRID_SIZE - 6, 4, 4);
      }

      // Selection ring
      if (tower.id === selectedTowerId) {
        this.ctx.strokeStyle = '#fff';
        this.ctx.lineWidth = 1;
        this.ctx.setLineDash([5, 5]);
        this.ctx.beginPath();
        this.ctx.arc(cx, cy, tower.range, 0, Math.PI * 2);
        this.ctx.stroke();
        this.ctx.setLineDash([]);
      }
    }
  }

  drawEnemies(state: GameState) {
    for (const enemy of state.enemies) {
      if (enemy.isCloaked) continue;

      const stats = ENEMY_STATS[enemy.type];
      
      this.ctx.save();
      this.ctx.translate(enemy.x, enemy.y);

      const mapPath = MAP_PATHS[state.mapIndex || 0];
      const targetPoint = mapPath[enemy.pathIndex + 1];
      if (targetPoint) {
        const angle = Math.atan2(targetPoint.y - enemy.y, targetPoint.x - enemy.x);
        this.ctx.rotate(angle);
      }

      // Engine trail
      this.ctx.fillStyle = 'rgba(0, 255, 255, 0.5)';
      this.ctx.beginPath();
      this.ctx.arc(-stats.size - 5, 0, 3 + Math.random() * 2, 0, Math.PI * 2);
      this.ctx.fill();

      this.ctx.shadowBlur = 15;
      this.ctx.shadowColor = stats.color;
      this.ctx.fillStyle = '#0a0a0a'; // Darker chassis
      this.ctx.strokeStyle = stats.color;
      this.ctx.lineWidth = 2;

      this.ctx.beginPath();
      if (enemy.isFlying) {
        // Sleek drone with detail
        this.ctx.moveTo(stats.size + 4, 0);
        this.ctx.lineTo(-stats.size, stats.size);
        this.ctx.lineTo(-stats.size + 4, 0);
        this.ctx.lineTo(-stats.size, -stats.size);
        this.ctx.closePath();
        this.ctx.fill();
        this.ctx.stroke();
        // Jet nozzles
        this.ctx.fillStyle = stats.color;
        this.ctx.beginPath();
        this.ctx.arc(-stats.size - 2, stats.size * 0.5, 2, 0, Math.PI * 2);
        this.ctx.arc(-stats.size - 2, -stats.size * 0.5, 2, 0, Math.PI * 2);
        this.ctx.fill();
      } else if (enemy.type === EnemyType.TANK) {
        // Heavy tank with detailed treads
        this.ctx.rect(-stats.size, -stats.size * 0.8, stats.size * 2, stats.size * 1.6);
        this.ctx.fill();
        this.ctx.stroke();
        // Armor plating
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
        this.ctx.fillRect(-stats.size + 2, -stats.size * 0.8 + 2, stats.size * 2 - 4, 3);
        // Treads with detail
        this.ctx.fillStyle = '#222';
        this.ctx.fillRect(-stats.size - 2, -stats.size * 0.9, stats.size * 2.4, 4);
        this.ctx.fillRect(-stats.size - 2, stats.size * 0.9 - 4, stats.size * 2.4, 4);
        // Tread wheels
        for (let i = 0; i < 3; i++) {
          const x = -stats.size + 6 + i * (stats.size * 0.8);
          this.ctx.beginPath();
          this.ctx.arc(x, -stats.size * 0.95, 3, 0, Math.PI * 2);
          this.ctx.arc(x, stats.size * 0.95, 3, 0, Math.PI * 2);
          this.ctx.stroke();
        }
        this.ctx.beginPath(); // Reset for the core
      } else if (enemy.type === EnemyType.MUTANT) {
        // Organic/Glitchy with spikes
        this.ctx.arc(0, 0, stats.size, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.stroke();
        // Mutation spikes
        this.ctx.fillStyle = stats.color;
        for (let i = 0; i < 8; i++) {
          const angle = (i * Math.PI * 2 / 8);
          const x = Math.cos(angle) * (stats.size + 4);
          const y = Math.sin(angle) * (stats.size + 4);
          this.ctx.beginPath();
          this.ctx.arc(x, y, 2, 0, Math.PI * 2);
          this.ctx.fill();
        }
        this.ctx.beginPath();
        this.ctx.arc(stats.size/2, stats.size/2, stats.size/2, 0, Math.PI * 2);
      } else if (enemy.type === EnemyType.HACKER) {
        // Stealthy with tech details
        this.ctx.moveTo(stats.size, 0);
        this.ctx.lineTo(0, stats.size * 0.8);
        this.ctx.lineTo(-stats.size, 0);
        this.ctx.lineTo(0, -stats.size * 0.8);
        this.ctx.closePath();
        this.ctx.fill();
        this.ctx.stroke();
        // Digital eyes
        this.ctx.fillStyle = stats.color;
        this.ctx.beginPath();
        this.ctx.arc(-3, -2, 1.5, 0, Math.PI * 2);
        this.ctx.arc(3, -2, 1.5, 0, Math.PI * 2);
        this.ctx.fill();
      } else {
        // Standard grunt with plating
        const s = stats.size;
        this.ctx.moveTo(s, 0);
        this.ctx.lineTo(s*0.7, s*0.7);
        this.ctx.lineTo(0, s);
        this.ctx.lineTo(-s*0.7, s*0.7);
        this.ctx.lineTo(-s, 0);
        this.ctx.lineTo(-s*0.7, -s*0.7);
        this.ctx.lineTo(0, -s);
        this.ctx.lineTo(s*0.7, -s*0.7);
        this.ctx.closePath();
        this.ctx.fill();
        this.ctx.stroke();
        // Armor panels
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
        this.ctx.beginPath();
        this.ctx.arc(0, -s * 0.5, s * 0.3, 0, Math.PI * 2);
        this.ctx.fill();
      }
      this.ctx.fill();
      this.ctx.stroke();

      // Enhanced glowing core with pulsing effect
      this.ctx.fillStyle = stats.color;
      this.ctx.globalAlpha = 0.6 + Math.sin(Date.now() / 200) * 0.3;
      this.ctx.beginPath();
      this.ctx.arc(0, 0, stats.size * 0.35, 0, Math.PI * 2);
      this.ctx.fill();
      
      // Core glow ring
      this.ctx.globalAlpha = 0.3;
      this.ctx.strokeStyle = stats.color;
      this.ctx.lineWidth = 1;
      this.ctx.beginPath();
      this.ctx.arc(0, 0, stats.size * 0.5, 0, Math.PI * 2);
      this.ctx.stroke();
      this.ctx.globalAlpha = 1.0;

      this.ctx.restore();
      this.ctx.shadowBlur = 0;

      // Status effects
      if (enemy.effects.freezeTimer > 0) {
        this.ctx.fillStyle = 'rgba(0, 255, 255, 0.5)';
        this.ctx.beginPath();
        this.ctx.arc(enemy.x, enemy.y, stats.size + 4, 0, Math.PI * 2);
        this.ctx.fill();
      } else if (enemy.effects.slowTimer > 0) {
        this.ctx.strokeStyle = '#ffff00';
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.arc(enemy.x, enemy.y, stats.size + 4, 0, Math.PI * 2);
        this.ctx.stroke();
      }
      if (enemy.effects.burnTimer > 0) {
        this.ctx.fillStyle = 'rgba(255, 100, 0, 0.8)';
        this.ctx.beginPath();
        this.ctx.arc(enemy.x + Math.random()*10-5, enemy.y - stats.size, 4, 0, Math.PI*2);
        this.ctx.fill();
      }
      if (enemy.effects.sludgeTimer > 0) {
        this.ctx.fillStyle = 'rgba(51, 255, 51, 0.6)';
        this.ctx.beginPath();
        this.ctx.arc(enemy.x, enemy.y + stats.size/2, stats.size, 0, Math.PI*2);
        this.ctx.fill();
      }

      // Segmented Health Bar
      const hpPercent = enemy.hp / enemy.maxHp;
      const barWidth = 24;
      const segments = 6;
      const segmentWidth = (barWidth - (segments - 1)) / segments;
      
      this.ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
      this.ctx.fillRect(enemy.x - barWidth/2 - 1, enemy.y - stats.size - 10, barWidth + 2, 6);
      
      this.ctx.fillStyle = hpPercent > 0.5 ? '#00ff00' : hpPercent > 0.25 ? '#ffff00' : '#ff0000';
      this.ctx.shadowBlur = 5;
      this.ctx.shadowColor = this.ctx.fillStyle;
      
      const activeSegments = Math.ceil(hpPercent * segments);
      for (let i = 0; i < activeSegments; i++) {
        this.ctx.fillRect(enemy.x - barWidth/2 + i * (segmentWidth + 1), enemy.y - stats.size - 9, segmentWidth, 4);
      }
      this.ctx.shadowBlur = 0;
    }
  }

  drawMercs(state: GameState) {
    for (const merc of state.mercs) {
      const stats = MERC_STATS[merc.type];
      
      this.ctx.save();
      this.ctx.translate(merc.x, merc.y);
      
      // Draw shadow/glow
      this.ctx.shadowBlur = 15;
      this.ctx.shadowColor = stats.color;
      
      this.ctx.fillStyle = stats.color;
      this.ctx.strokeStyle = '#fff';
      this.ctx.lineWidth = 2;

      this.ctx.beginPath();
      if (merc.type === MercType.SAMURAI) {
        // Sword shape
        this.ctx.moveTo(0, -14); // tip
        this.ctx.lineTo(3, -7);
        this.ctx.lineTo(2, 4);
        this.ctx.lineTo(6, 4); // right guard
        this.ctx.lineTo(6, 7);
        this.ctx.lineTo(2, 7);
        this.ctx.lineTo(2, 12); // right handle
        this.ctx.lineTo(-2, 12); // left handle
        this.ctx.lineTo(-2, 7);
        this.ctx.lineTo(-6, 7); // left guard
        this.ctx.lineTo(-6, 4);
        this.ctx.lineTo(-2, 4);
        this.ctx.lineTo(-3, -7);
      } else if (merc.type === MercType.HEAVY) {
        // Machine gun shape
        this.ctx.moveTo(12, -2); // Barrel end top
        this.ctx.lineTo(12, 2);  // Barrel end bottom
        this.ctx.lineTo(6, 2);   // Body start
        this.ctx.lineTo(6, 8);   // Magazine bottom right
        this.ctx.lineTo(2, 8);   // Magazine bottom left
        this.ctx.lineTo(2, 2);   // Body middle bottom
        this.ctx.lineTo(-4, 2);  // Handle base right
        this.ctx.lineTo(-6, 8);  // Handle bottom right
        this.ctx.lineTo(-10, 8); // Handle bottom left
        this.ctx.lineTo(-8, 2);  // Body rear bottom
        this.ctx.lineTo(-12, 2); // Stock bottom
        this.ctx.lineTo(-12, -2); // Stock top
        this.ctx.lineTo(-2, -2); // Body top
        this.ctx.lineTo(-2, -5); // Sight top left
        this.ctx.lineTo(2, -5);  // Sight top right
        this.ctx.lineTo(2, -2);  // Body top right
      } else if (merc.type === MercType.MEDIC) {
        // Cross shape
        this.ctx.rect(-4, -12, 8, 24);
        this.ctx.rect(-12, -4, 24, 8);
      }
      this.ctx.closePath();
      this.ctx.fill();
      this.ctx.stroke();
      
      this.ctx.restore();
    }
  }

  drawProjectiles(state: GameState) {
    for (const p of state.projectiles) {
      this.ctx.fillStyle = TOWER_STATS[p.type].color;
      this.ctx.shadowBlur = 10;
      this.ctx.shadowColor = this.ctx.fillStyle;
      
      this.ctx.beginPath();
      if (p.type === TowerType.PLASMA) {
        this.ctx.arc(p.x, p.y, 6, 0, Math.PI * 2);
        this.ctx.fill();
        // Plasma trail
        this.ctx.beginPath();
        this.ctx.moveTo(p.x, p.y);
        this.ctx.lineTo(p.x - (p.vx || 0) * 3, p.y - (p.vy || 0) * 3);
        this.ctx.strokeStyle = this.ctx.fillStyle;
        this.ctx.lineWidth = 4;
        this.ctx.stroke();
      } else {
        // Kinetic tracer
        this.ctx.moveTo(p.x, p.y);
        this.ctx.lineTo(p.x - (p.vx || 0) * 2, p.y - (p.vy || 0) * 2);
        this.ctx.strokeStyle = this.ctx.fillStyle;
        this.ctx.lineWidth = 2;
        this.ctx.stroke();
      }
      this.ctx.shadowBlur = 0;
    }
  }

  drawParticles(state: GameState) {
    for (const p of state.particles) {
      this.ctx.strokeStyle = p.color;
      this.ctx.fillStyle = p.color;
      this.ctx.globalAlpha = p.life / p.maxLife;
      
      const speed = Math.hypot(p.vx, p.vy);
      if (speed > 1) {
        // Spark line
        this.ctx.beginPath();
        this.ctx.moveTo(p.x, p.y);
        this.ctx.lineTo(p.x - p.vx * 2, p.y - p.vy * 2);
        this.ctx.lineWidth = p.size;
        this.ctx.stroke();
      } else if (p.size > 15) {
        // Shockwave (expanding ring)
        const currentRadius = p.size * (1 - p.life / p.maxLife);
        this.ctx.beginPath();
        this.ctx.arc(p.x, p.y, currentRadius, 0, Math.PI * 2);
        this.ctx.lineWidth = 2;
        this.ctx.stroke();
      } else {
        // Smoke/Orb
        this.ctx.beginPath();
        this.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        this.ctx.fill();
      }
    }
    this.ctx.globalAlpha = 1;
  }

  drawPools(state: GameState) {
    for (const pool of state.pools) {
      this.ctx.fillStyle = `rgba(51, 255, 51, ${0.4 * (pool.life / pool.maxLife)})`;
      this.ctx.beginPath();
      this.ctx.arc(pool.x, pool.y, pool.radius, 0, Math.PI * 2);
      this.ctx.fill();
      
      // Bubbles
      this.ctx.fillStyle = `rgba(100, 255, 100, ${0.8 * (pool.life / pool.maxLife)})`;
      for (let i = 0; i < 3; i++) {
        const bx = pool.x + (Math.random() - 0.5) * pool.radius;
        const by = pool.y + (Math.random() - 0.5) * pool.radius;
        this.ctx.beginPath();
        this.ctx.arc(bx, by, Math.random() * 3, 0, Math.PI * 2);
        this.ctx.fill();
      }
    }
  }

  drawFloatingTexts(state: GameState) {
    this.ctx.font = 'bold 16px monospace';
    this.ctx.textAlign = 'center';
    for (const ft of state.floatingTexts) {
      this.ctx.fillStyle = ft.color;
      this.ctx.globalAlpha = ft.life / ft.maxLife;
      this.ctx.shadowBlur = 5;
      this.ctx.shadowColor = ft.color;
      // Slight upward drift
      const yOffset = (1 - ft.life / ft.maxLife) * 20;
      this.ctx.fillText(ft.text, ft.x, ft.y - yOffset);
    }
    this.ctx.globalAlpha = 1;
    this.ctx.shadowBlur = 0;
  }

  drawRain() {
    this.ctx.strokeStyle = 'rgba(0, 255, 255, 0.15)'; // Toxic neon rain
    this.ctx.lineWidth = 1;
    this.ctx.beginPath();
    for (const drop of this.rainDrops) {
      this.ctx.moveTo(drop.x, drop.y);
      this.ctx.lineTo(drop.x - drop.length * 0.2, drop.y + drop.length);
      
      drop.x -= drop.speed * 0.2;
      drop.y += drop.speed;
      
      if (drop.y > MAP_HEIGHT) {
        drop.y = -20;
        drop.x = Math.random() * MAP_WIDTH + 100; // Offset for angle
      }
    }
    this.ctx.stroke();
  }

  drawHacksEffects(state: GameState) {
    if (state.hacks[HackType.BLACKOUT].activeTimer > 0) {
      this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
      this.ctx.fillRect(0, 0, MAP_WIDTH, MAP_HEIGHT);
    }
    
    // Orbital laser effect if just used (cooldown near max)
    if (state.hacks[HackType.LASER].cooldown > 3550) {
      this.ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
      this.ctx.fillRect(0, 0, MAP_WIDTH, MAP_HEIGHT);
    }
  }
}
