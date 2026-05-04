import { ElementType, ELEMENTS } from "../types";

export class SandboxEngine {
  width: number;
  height: number;
  grid: ElementType[];
  nextGrid: ElementType[];
  updated: boolean[];

  constructor(width: number, height: number) {
    this.width = width;
    this.height = height;
    this.grid = new Array(width * height).fill(ElementType.EMPTY);
    this.nextGrid = new Array(width * height).fill(ElementType.EMPTY);
    this.updated = new Array(width * height).fill(false);
  }

  getIndex(x: number, y: number): number {
    return y * this.width + x;
  }

  isInBounds(x: number, y: number): boolean {
    return x >= 0 && x < this.width && y >= 0 && y < this.height;
  }

  setPixel(x: number, y: number, type: ElementType) {
    if (this.isInBounds(x, y)) {
      this.grid[this.getIndex(x, y)] = type;
    }
  }

  getPixel(x: number, y: number): ElementType {
    if (!this.isInBounds(x, y)) return ElementType.STONE; // Border acts like stone
    return this.grid[this.getIndex(x, y)];
  }

  update() {
    this.nextGrid = [...this.grid];
    this.updated.fill(false);

    // Iterating backwards (bottom to top) helps falling elements move more naturally in one pass
    // but can cause artifacts if not careful. Standard CA usually does one direction.
    for (let y = this.height - 1; y >= 0; y--) {
      // Randomize x direction to prevent bias
      const leftToRight = Math.random() > 0.5;
      for (
        let x = leftToRight ? 0 : this.width - 1;
        leftToRight ? x < this.width : x >= 0;
        leftToRight ? x++ : x--
      ) {
        const idx = this.getIndex(x, y);
        if (this.updated[idx]) continue;

        const type = this.grid[idx];
        if (type === ElementType.EMPTY) continue;

        this.processPixel(x, y, type);
      }
    }

    this.grid = this.nextGrid;
  }

  processPixel(x: number, y: number, type: ElementType) {
    const props = ELEMENTS[type];
    const idx = this.getIndex(x, y);

    if (props.state === "immobile") {
      if (type === ElementType.ICE) this.processIce(x, y);
      else if (type === ElementType.FUNGUS) this.spreadFungus(x, y);
      else if (type === ElementType.SPONGE) this.processSponge(x, y);
      else if (type === ElementType.C4) this.processC4(x, y);
      return;
    }

    if (props.state === "solid") {
      if (type === ElementType.SEED) {
        if (this.processSeed(x, y)) return;
      }
      if (type === ElementType.ANTIMATTER) {
        this.processAntimatter(x, y);
      }
      if (type === ElementType.VIRUS) {
        this.processVirus(x, y);
      }
      if (type === ElementType.THERMITE) {
        this.processThermite(x, y);
      }
      if (type === ElementType.SNOW) {
        if (this.processSnow(x, y)) return;
      }

      if (type === ElementType.ANT || type === ElementType.TERMITE) {
        const dir = Math.random() > 0.5 ? 1 : -1;
        if (this.moveIf(x, y, x + dir, y, [ElementType.EMPTY])) { }
        else if (this.moveIf(x, y, x + dir, y - 1, [ElementType.EMPTY])) { }
        else if (this.moveIf(x, y, x + dir, y + 1, [ElementType.EMPTY])) { }
        
        if (type === ElementType.TERMITE && Math.random() > 0.2) {
           const neighbors = [[0,1],[0,-1],[1,0],[-1,0]];
           for(const [dx, dy] of neighbors) {
              const nx = x+dx; const ny = y+dy;
              if (this.isInBounds(nx, ny)) {
                 if (this.grid[this.getIndex(nx, ny)] === ElementType.WOOD) {
                    this.nextGrid[this.getIndex(nx, ny)] = ElementType.EMPTY;
                    this.updated[this.getIndex(nx, ny)] = true;
                 }
              }
           }
        }
      }

      // Check for falling
      if (this.moveIfLighter(x, y, x, y + 1, props.density)) return;
      else if (this.moveIfLighter(x, y, x - 1, y + 1, props.density)) return;
      else if (this.moveIfLighter(x, y, x + 1, y + 1, props.density)) return;

      // Some sideways movement for piles
      if (
        type === ElementType.SAND ||
        type === ElementType.SALT ||
        type === ElementType.GUNPOWDER ||
        type === ElementType.ASH ||
        type === ElementType.RUST ||
        type === ElementType.DIRT
      ) {
        if (Math.random() > 0.8) {
          if (this.moveIf(x, y, x - 1, y + 1, [ElementType.EMPTY])) return;
          if (this.moveIf(x, y, x + 1, y + 1, [ElementType.EMPTY])) return;
        }
      }
    } else if (props.state === "liquid") {
      // Viscosity check
      if (props.viscosity && Math.random() < props.viscosity) {
        // doesn't move this frame, skip falling logic this frame
      } else {
        // Liquids Movement
        if (this.moveIfLighter(x, y, x, y + 1, props.density)) return;

        const dir = Math.random() > 0.5 ? 1 : -1;
        if (this.moveIfLighter(x, y, x + dir, y + 1, props.density)) return;
        if (this.moveIfLighter(x, y, x - dir, y + 1, props.density)) return;

        const sidewaysTargets = [
          ElementType.EMPTY,
          ElementType.GAS,
          ElementType.STEAM,
          ElementType.SMOKE,
          ElementType.NEON,
          ElementType.SPARK,
        ];
        if (this.moveIf(x, y, x + dir, y, sidewaysTargets)) return;
        if (this.moveIf(x, y, x - dir, y, sidewaysTargets)) return;
      }

      // Interactions FIRST
      if (type === ElementType.ACID) {
        this.dissolve(x, y + 1, x, y);
        this.dissolve(x + 1, y, x, y);
        this.dissolve(x - 1, y, x, y);
        this.dissolve(x, y - 1, x, y);
        if (this.nextGrid[this.getIndex(x, y)] !== ElementType.ACID) return;
      }
      if (type === ElementType.LAVA) {
        this.burn(x, y + 1);
        this.burn(x + 1, y);
        this.burn(x - 1, y);
        this.burn(x, y - 1);
        this.cool(x, y);
        if (this.nextGrid[this.getIndex(x, y)] !== ElementType.LAVA) return;
      }
      if (type === ElementType.WATER) {
        this.saltEffect(x, y);
        this.grow(x, y);
        this.rustEffect(x, y);
        if (this.mudEffect(x, y)) return;
      }
      if (type === ElementType.BLOOD) {
        if (Math.random() > 0.999) {
          this.nextGrid[idx] = ElementType.DIRT; // dries up over time
          this.updated[idx] = true;
        }
      }
      if (type === ElementType.POISON) {
        this.infect(x, y + 1);
        this.infect(x - 1, y);
        this.infect(x + 1, y);
        this.infect(x, y - 1);
      }
      if (type === ElementType.LIQUID_NITROGEN) {
        this.freeze(x, y + 1);
        this.freeze(x - 1, y);
        this.freeze(x + 1, y);
        this.freeze(x, y - 1);
        if (Math.random() > 0.95) {
          this.nextGrid[idx] = ElementType.CLOUD; // slowly evaporates
          this.updated[idx] = true;
        }
      }
    } else if (props.state === "gas" || props.state === "energy") {
      // Fire/Energy interactions
      if (type === ElementType.FIRE) {
        this.burn(x, y + 1);
        this.burn(x + 1, y);
        this.burn(x - 1, y);
        this.burn(x, y - 1);
      } else if (type === ElementType.PLASMA) {
        this.plasmaMelt(x, y + 1);
        this.plasmaMelt(x - 1, y);
        this.plasmaMelt(x + 1, y);
        this.plasmaMelt(x, y - 1);
      } else if (type === ElementType.SPARK || type === ElementType.ELECTRICITY) {
        this.sparkProcess(x, y);
      }
      
      // Gases, Fire and Spark Movement
      if (type === ElementType.SPARK || type === ElementType.ELECTRICITY) {
        // sparks move erratically in all directions
        const dx = Math.floor(Math.random() * 3) - 1;
        const dy = Math.floor(Math.random() * 3) - 1;
        if (
          this.moveIf(x, y, x + dx, y + dy, [
            ElementType.EMPTY,
            ElementType.GAS,
            ElementType.NEON,
            ElementType.SMOKE,
            ElementType.WIRE,
            ElementType.IRON,
            ElementType.COPPER,
            ElementType.GOLD,
            ElementType.WATER,
          ])
        ) {
          // If electricity touches wire/metals, it travels fast
          return;
        }
      } else {
        const moveUp = type !== ElementType.FIRE || Math.random() > 0.3;
        if (moveUp) {
          if (this.moveIf(x, y, x, y - 1, [ElementType.EMPTY])) return;
          const dir = Math.random() > 0.5 ? 1 : -1;
          if (this.moveIf(x, y, x + dir, y - 1, [ElementType.EMPTY])) return;
          if (this.moveIf(x, y, x - dir, y - 1, [ElementType.EMPTY])) return;
          if (this.moveIf(x, y, x + dir, y, [ElementType.EMPTY])) return;
          if (this.moveIf(x, y, x - dir, y, [ElementType.EMPTY])) return;
          if (this.moveIf(x, y, x, y + 1, [ElementType.EMPTY])) return; // Gas can move down occasionally
        }
      }

      if (type === ElementType.FIRE) {
        if (Math.random() > 0.82) {
          this.nextGrid[idx] =
            Math.random() > 0.6 ? ElementType.SMOKE : ElementType.EMPTY;
          this.updated[idx] = true;
        }
      }
      if (type === ElementType.PLASMA) {
        if (Math.random() > 0.95) {
          this.nextGrid[idx] = ElementType.EMPTY;
          this.updated[idx] = true;
        }
      }
      if (type === ElementType.SPARK || type === ElementType.ELECTRICITY) {
        if (Math.random() > 0.8) {
          this.nextGrid[idx] = ElementType.EMPTY;
          this.updated[idx] = true;
        }
      }

      if (
        type === ElementType.SMOKE ||
        type === ElementType.STEAM ||
        type === ElementType.GAS ||
        type === ElementType.CLOUD ||
        type === ElementType.OXYGEN ||
        type === ElementType.HYDROGEN ||
        type === ElementType.HELIUM
      ) {
        if (Math.random() > 0.98) {
          if (type === ElementType.STEAM && Math.random() > 0.9) {
            this.nextGrid[idx] = ElementType.WATER;
          } else if (type === ElementType.CLOUD && Math.random() > 0.99) {
            this.nextGrid[idx] = ElementType.WATER; // rain
          } else if (type !== ElementType.CLOUD) {
            this.nextGrid[idx] = ElementType.EMPTY;
          }
          this.updated[idx] = true;
        }
      }
    } else if (props.state === "immobile") {
       if (type === ElementType.BLACK_HOLE) {
          this.blackHoleSuck(x, y);
       }
       if (type === ElementType.BATTERY) {
          if (Math.random() > 0.8) {
             this.generateEnergy(x, y);
          }
       }
       if (type === ElementType.SPONGE) {
          this.absorb(x, y);
       }
       // Vines grow downwards
       if (type === ElementType.VINE) {
          if (Math.random() > 0.99) {
             if (this.isInBounds(x, y+1) && this.grid[this.getIndex(x, y+1)] === ElementType.EMPTY) {
                this.nextGrid[this.getIndex(x, y+1)] = ElementType.VINE;
                this.updated[this.getIndex(x, y+1)] = true;
             }
          }
       }
       // FUNGUS consumes
       if (type === ElementType.FUNGUS) {
          this.infect(x, y + 1, ElementType.FUNGUS, [ElementType.WOOD, ElementType.PLANT, ElementType.VINE, ElementType.MEAT]);
          this.infect(x, y - 1, ElementType.FUNGUS, [ElementType.WOOD, ElementType.PLANT, ElementType.VINE, ElementType.MEAT]);
          this.infect(x + 1, y, ElementType.FUNGUS, [ElementType.WOOD, ElementType.PLANT, ElementType.VINE, ElementType.MEAT]);
          this.infect(x - 1, y, ElementType.FUNGUS, [ElementType.WOOD, ElementType.PLANT, ElementType.VINE, ElementType.MEAT]);
       }
    }
  }

  moveIfLighter(
    x: number,
    y: number,
    nx: number,
    ny: number,
    myDensity: number,
  ): boolean {
    if (!this.isInBounds(nx, ny)) return false;
    const nIdx = this.getIndex(nx, ny);
    const targetType = this.grid[nIdx];
    
    if (targetType === ElementType.EMPTY) {
      const idx = this.getIndex(x, y);
      this.nextGrid[idx] = targetType;
      this.nextGrid[nIdx] = this.grid[idx];
      this.updated[nIdx] = true;
      return true;
    }

    const tProps = ELEMENTS[targetType];
    
    // Displace gases, energy, or lighter liquids
    if (tProps.state === 'gas' || tProps.state === 'energy' || (tProps.state === 'liquid' && tProps.density < myDensity)) {
       const idx = this.getIndex(x, y);
       this.nextGrid[idx] = targetType;
       this.nextGrid[nIdx] = this.grid[idx];
       this.updated[nIdx] = true;
       return true;
    }
    return false;
  }

  moveIf(
    x: number,
    y: number,
    nx: number,
    ny: number,
    targets: ElementType[],
  ): boolean {
    if (!this.isInBounds(nx, ny)) return false;
    const nIdx = this.getIndex(nx, ny);
    const targetType = this.grid[nIdx];

    if (targets.includes(targetType)) {
      const idx = this.getIndex(x, y);
      const currentType = this.grid[idx];

      this.nextGrid[idx] = targetType;
      this.nextGrid[nIdx] = currentType;
      this.updated[nIdx] = true;
      return true;
    }
    return false;
  }

  burn(x: number, y: number) {
    if (!this.isInBounds(x, y)) return;
    const idx = this.getIndex(x, y);
    const target = this.grid[idx];
    const props = ELEMENTS[target];

    // Explosives react much faster to fire
    if (props.explosive && Math.random() < 0.8) {
      this.explode(x, y);
      return;
    }

    if (props.flammable && Math.random() < (props.burnRate || 0.1)) {
      this.nextGrid[idx] = ElementType.FIRE;
      this.updated[idx] = true;
    }

    if (target === ElementType.WATER && Math.random() > 0.7) {
      this.nextGrid[idx] = ElementType.STEAM;
      this.updated[idx] = true;
    }

    if (target === ElementType.ICE && Math.random() > 0.4) {
      this.nextGrid[idx] = ElementType.WATER;
      this.updated[idx] = true;
    }

    if (target === ElementType.GAS) {
      this.explode(x, y);
    }
  }

  triggerNuke() {
    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        const idx = this.getIndex(x, y);
        if (y === 5 && x % 5 === 0) {
          this.nextGrid[idx] = ElementType.C4;
          this.updated[idx] = true;
        } else if (y === 6 && x % 5 === 0) {
          this.nextGrid[idx] = ElementType.THERMITE;
          this.updated[idx] = true;
        } else if ((y === 7 || y === 8) && x % 5 === 0) {
          if (Math.random() > 0.8) {
            this.nextGrid[idx] = ElementType.FIRE;
            this.updated[idx] = true;
          }
        }
      }
    }
  }

  triggerMatrix() {
    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        const idx = this.getIndex(x, y);
        if (Math.random() > 0.95) {
          this.nextGrid[idx] = ElementType.NEON;
          this.updated[idx] = true;
        } else if (
          this.grid[idx] !== ElementType.EMPTY &&
          Math.random() > 0.5
        ) {
          this.nextGrid[idx] = ElementType.VIRUS;
          this.updated[idx] = true;
        }
      }
    }
  }

  grow(x: number, y: number) {
    if (Math.random() < 0.98) return;
    const neighbors = [
      [0, 1],
      [0, -1],
      [1, 0],
      [-1, 0],
    ];
    const [dx, dy] = neighbors[Math.floor(Math.random() * 4)];
    const nx = x + dx;
    const ny = y + dy;
    if (this.isInBounds(nx, ny)) {
      const target = this.grid[this.getIndex(nx, ny)];
      if (target === ElementType.CLAY || target === ElementType.PLANT) {
        // Growth logic
        const gx = nx + (Math.random() > 0.5 ? 1 : -1);
        const gy = ny - 1;
        if (
          this.isInBounds(gx, gy) &&
          this.grid[this.getIndex(gx, gy)] === ElementType.EMPTY
        ) {
          this.nextGrid[this.getIndex(gx, gy)] = ElementType.PLANT;
          this.updated[this.getIndex(gx, gy)] = true;
          // Consume water to grow
          if (Math.random() > 0.5) {
            this.nextGrid[this.getIndex(x, y)] = ElementType.EMPTY;
            this.updated[this.getIndex(x, y)] = true;
          }
        }
      }
    }
  }

  processIce(x: number, y: number) {
    const neighbors = [
      [0, 1],
      [0, -1],
      [1, 0],
      [-1, 0],
    ];
    let melted = false;

    for (const [dx, dy] of neighbors) {
      const nx = x + dx;
      const ny = y + dy;
      if (this.isInBounds(nx, ny)) {
        const nType = this.grid[this.getIndex(nx, ny)];
        if (nType === ElementType.WATER && Math.random() > 0.995) {
          melted = true;
        } else if (nType === ElementType.SALT && Math.random() > 0.8) {
          melted = true;
        } else if (
          (nType === ElementType.FIRE ||
            nType === ElementType.LAVA ||
            nType === ElementType.STEAM) &&
          Math.random() > 0.8
        ) {
          melted = true;
        }
      }
    }
    if (melted) {
      const idx = this.getIndex(x, y);
      this.nextGrid[idx] = ElementType.WATER;
      this.updated[idx] = true;
    }
  }

  plasmaMelt(x: number, y: number) {
    if (!this.isInBounds(x, y)) return;
    const idx = this.getIndex(x, y);
    const target = this.grid[idx];
    if (
      target !== ElementType.EMPTY &&
      target !== ElementType.VOID &&
      target !== ElementType.OBSIDIAN &&
      target !== ElementType.BLACK_HOLE &&
      target !== ElementType.PLASMA &&
      target !== ElementType.ELECTRICITY
    ) {
      if (Math.random() > 0.3) {
        if (target === ElementType.STONE || target === ElementType.METAL || target === ElementType.IRON || target === ElementType.COPPER || target === ElementType.GOLD) {
          this.nextGrid[idx] = ElementType.LAVA;
        } else if (target === ElementType.WATER || target === ElementType.ICE) {
          this.nextGrid[idx] = ElementType.STEAM;
        } else {
          this.nextGrid[idx] = ElementType.FIRE;
        }
        this.updated[idx] = true;
      }
    }
  }

  blackHoleSuck(x: number, y: number) {
    const radius = 3;
    for (let dy = -radius; dy <= radius; dy++) {
      for (let dx = -radius; dx <= radius; dx++) {
        const nx = x + dx;
        const ny = y + dy;
        if (this.isInBounds(nx, ny) && (dx !== 0 || dy !== 0)) {
           const idx = this.getIndex(nx, ny);
           const type = this.grid[idx];
           if (type !== ElementType.EMPTY && type !== ElementType.BLACK_HOLE) {
              if (Math.random() > 0.5) {
                // suck in towards center
                const sx = nx + Math.sign(-dx);
                const sy = ny + Math.sign(-dy);
                if (this.isInBounds(sx, sy)) {
                   if (sx === x && sy === y) {
                      this.nextGrid[idx] = ElementType.EMPTY;
                   } else {
                      this.nextGrid[this.getIndex(sx, sy)] = type;
                      this.nextGrid[idx] = ElementType.EMPTY;
                      this.updated[this.getIndex(sx, sy)] = true;
                   }
                   this.updated[idx] = true;
                }
              }
           }
        }
      }
    }
  }

  generateEnergy(x: number, y: number) {
     const neighbors = [
      [0, 1], [0, -1], [1, 0], [-1, 0]
     ];
     for (const [dx, dy] of neighbors) {
        const nx = x + dx;
        const ny = y + dy;
        if (this.isInBounds(nx, ny)) {
           const idx = this.getIndex(nx, ny);
           if (this.grid[idx] === ElementType.EMPTY) {
              this.nextGrid[idx] = ElementType.ELECTRICITY;
              this.updated[idx] = true;
           } else if (this.grid[idx] === ElementType.WIRE) {
              this.nextGrid[idx] = ElementType.ELECTRICITY;
              this.updated[idx] = true;
           }
        }
     }
  }

  absorb(x: number, y: number) {
    if (Math.random() > 0.4) return;
    const neighbors = [
      [0, 1],
      [0, -1],
      [1, 0],
      [-1, 0],
    ];
    for (const [dx, dy] of neighbors) {
      const nx = x + dx;
      const ny = y + dy;
      if (this.isInBounds(nx, ny)) {
        const idx = this.getIndex(nx, ny);
        const target = this.grid[idx];
        if (target === ElementType.WATER || target === ElementType.BLOOD || target === ElementType.POISON || target === ElementType.ALCOHOL) {
           this.nextGrid[idx] = ElementType.EMPTY;
           this.updated[idx] = true;
        }
      }
    }
  }

  freeze(x: number, y: number) {
    if (!this.isInBounds(x, y)) return;
    const idx = this.getIndex(x, y);
    const target = this.grid[idx];
    if (target === ElementType.WATER) {
      this.nextGrid[idx] = ElementType.ICE;
      this.updated[idx] = true;
    } else if (target === ElementType.LAVA) {
      this.nextGrid[idx] = ElementType.STONE;
      this.updated[idx] = true;
    } else if (target === ElementType.FIRE || target === ElementType.PLASMA) {
      this.nextGrid[idx] = ElementType.EMPTY;
      this.updated[idx] = true;
    }
  }

  infect(x: number, y: number, virusType: ElementType = ElementType.VIRUS, targets: ElementType[] = [ElementType.PLANT, ElementType.ANT, ElementType.TERMITE, ElementType.SEED, ElementType.MEAT]) {
    if (!this.isInBounds(x, y)) return;
    if (Math.random() > 0.8) return;
    const idx = this.getIndex(x, y);
    const target = this.grid[idx];
    if (targets.includes(target as any)) {
      this.nextGrid[idx] = virusType;
      this.updated[idx] = true;
    }
  }

  dissolve(x: number, y: number, acidX: number, acidY: number) {
    if (!this.isInBounds(x, y)) return;
    const idx = this.getIndex(x, y);
    const target = this.grid[idx];
    if (
      target !== ElementType.EMPTY &&
      target !== ElementType.STONE &&
      target !== ElementType.ACID &&
      target !== ElementType.GLASS &&
      target !== ElementType.WATER
    ) {
      if (Math.random() > 0.6) {
        this.nextGrid[idx] =
          target === ElementType.METAL || target === ElementType.WOOD
            ? ElementType.SMOKE
            : ElementType.EMPTY;
        this.updated[idx] = true;

        // acid is consumed sometimes
        if (Math.random() > 0.2) {
          const aIdx = this.getIndex(acidX, acidY);
          if (this.nextGrid[aIdx] === ElementType.ACID) {
            this.nextGrid[aIdx] = ElementType.SMOKE;
            this.updated[aIdx] = true;
          }
        }
      }
    }
  }

  cool(x: number, y: number) {
    // Lava cooling with water/ice, melting sand
    const neighbors = [
      [0, 1],
      [0, -1],
      [1, 0],
      [-1, 0],
    ];
    for (const [dx, dy] of neighbors) {
      const nx = x + dx;
      const ny = y + dy;
      if (this.isInBounds(nx, ny)) {
        const target = this.grid[this.getIndex(nx, ny)];
        if (target === ElementType.WATER || target === ElementType.ICE) {
          this.nextGrid[this.getIndex(x, y)] = ElementType.STONE;
          this.nextGrid[this.getIndex(nx, ny)] =
            target === ElementType.WATER
              ? ElementType.STEAM
              : ElementType.WATER;
          this.updated[this.getIndex(x, y)] = true;
          this.updated[this.getIndex(nx, ny)] = true;
          return;
        } else if (target === ElementType.SAND && Math.random() > 0.8) {
          this.nextGrid[this.getIndex(nx, ny)] = ElementType.GLASS;
          this.updated[this.getIndex(nx, ny)] = true;
        }
      }
    }
  }

  saltEffect(x: number, y: number) {
    const neighbors = [
      [0, 1],
      [0, -1],
      [1, 0],
      [-1, 0],
    ];
    for (const [dx, dy] of neighbors) {
      const nx = x + dx;
      const ny = y + dy;
      if (this.isInBounds(nx, ny)) {
        const target = this.grid[this.getIndex(nx, ny)];
        if (target === ElementType.PLANT || target === ElementType.FUNGUS) {
          if (Math.random() > 0.9) {
            this.nextGrid[this.getIndex(nx, ny)] = ElementType.EMPTY;
          }
        }
        if (target === ElementType.SALT) {
          if (Math.random() > 0.99) {
            this.nextGrid[this.getIndex(nx, ny)] = ElementType.EMPTY; // Salt dissolves
          }
        }
      }
    }
  }

  spreadFungus(x: number, y: number) {
    if (Math.random() > 0.95) {
      const dir = Math.floor(Math.random() * 4);
      const neighbors = [
        [0, 1],
        [0, -1],
        [1, 0],
        [-1, 0],
      ];
      const [dx, dy] = neighbors[dir];
      const nx = x + dx;
      const ny = y + dy;
      if (this.isInBounds(nx, ny)) {
        const target = this.grid[this.getIndex(nx, ny)];
        if (
          target === ElementType.WOOD ||
          target === ElementType.PLANT ||
          target === ElementType.CLAY
        ) {
          this.nextGrid[this.getIndex(nx, ny)] = ElementType.FUNGUS;
          this.updated[this.getIndex(nx, ny)] = true;
        }
      }
    }
  }

  processSponge(x: number, y: number) {
    const neighbors = [
      [0, 1],
      [0, -1],
      [1, 0],
      [-1, 0],
    ];
    for (const [dx, dy] of neighbors) {
      const nx = x + dx;
      const ny = y + dy;
      if (this.isInBounds(nx, ny)) {
        const t = this.grid[this.getIndex(nx, ny)];
        if (
          ELEMENTS[t].state === "liquid" &&
          t !== ElementType.LAVA &&
          t !== ElementType.ACID
        ) {
          this.nextGrid[this.getIndex(nx, ny)] =
            Math.random() > 0.5 ? ElementType.EMPTY : t;
          this.updated[this.getIndex(nx, ny)] = true;
        }
      }
    }
  }

  processC4(x: number, y: number) {
    const neighbors = [
      [0, 1],
      [0, -1],
      [1, 0],
      [-1, 0],
    ];
    for (const [dx, dy] of neighbors) {
      const nx = x + dx;
      const ny = y + dy;
      if (this.isInBounds(nx, ny)) {
        const t = this.grid[this.getIndex(nx, ny)];
        if (
          t === ElementType.SPARK ||
          t === ElementType.FIRE ||
          t === ElementType.LAVA
        ) {
          this.explode(x, y);
          return;
        }
      }
    }
  }

  processSeed(x: number, y: number): boolean {
    const neighbors = [
      [0, 1],
      [0, -1],
      [1, 0],
      [-1, 0],
    ];
    for (const [dx, dy] of neighbors) {
      const nx = x + dx;
      const ny = y + dy;
      if (this.isInBounds(nx, ny)) {
        const t = this.grid[this.getIndex(nx, ny)];
        if (t === ElementType.WATER || t === ElementType.DIRT) {
          if (Math.random() > 0.95) {
            this.nextGrid[this.getIndex(x, y)] = ElementType.PLANT;
            this.updated[this.getIndex(x, y)] = true;
            return true;
          }
        }
      }
    }
    return false;
  }

  processVirus(x: number, y: number) {
    if (Math.random() > 0.9) return;
    const neighbors = [
      [0, 1],
      [0, -1],
      [1, 0],
      [-1, 0],
      [1, 1],
      [-1, -1],
      [1, -1],
      [-1, 1],
    ];
    const [dx, dy] = neighbors[Math.floor(Math.random() * neighbors.length)];
    const nx = x + dx;
    const ny = y + dy;
    if (this.isInBounds(nx, ny)) {
      const t = this.grid[this.getIndex(nx, ny)];
      if (
        t === ElementType.PLANT ||
        t === ElementType.WOOD ||
        t === ElementType.FUNGUS ||
        t === ElementType.SEED ||
        t === ElementType.BLOOD
      ) {
        this.nextGrid[this.getIndex(nx, ny)] = ElementType.VIRUS;
        this.updated[this.getIndex(nx, ny)] = true;
      }
    }
  }

  processThermite(x: number, y: number) {
    const idx = this.getIndex(x, y);
    const neighbors = [
      [0, 1],
      [0, -1],
      [1, 0],
      [-1, 0],
    ];
    let isBurning = false;
    for (const [dx, dy] of neighbors) {
      const nx = x + dx;
      const ny = y + dy;
      if (this.isInBounds(nx, ny)) {
        const t = this.grid[this.getIndex(nx, ny)];
        if (t === ElementType.FIRE || t === ElementType.LAVA) {
          isBurning = true;
          break;
        }
      }
    }
    if (isBurning) {
      this.nextGrid[idx] =
        Math.random() > 0.2 ? ElementType.LAVA : ElementType.FIRE;
      this.updated[idx] = true;
      for (const [dx, dy] of neighbors) {
        const nx = x + dx;
        const ny = y + dy;
        if (this.isInBounds(nx, ny)) {
          const t = this.grid[this.getIndex(nx, ny)];
          if (
            t === ElementType.METAL ||
            t === ElementType.STONE ||
            t === ElementType.GLASS
          ) {
            this.nextGrid[this.getIndex(nx, ny)] = ElementType.LAVA;
            this.updated[this.getIndex(nx, ny)] = true;
          }
        }
      }
    }
  }

  processSnow(x: number, y: number): boolean {
    // natural melting
    if (Math.random() > 0.999) {
      this.nextGrid[this.getIndex(x, y)] = ElementType.WATER;
      this.updated[this.getIndex(x, y)] = true;
      return true;
    }

    const neighbors = [
      [0, 1],
      [0, -1],
      [1, 0],
      [-1, 0],
    ];
    for (const [dx, dy] of neighbors) {
      const nx = x + dx;
      const ny = y + dy;
      if (this.isInBounds(nx, ny)) {
        const t = this.grid[this.getIndex(nx, ny)];
        if (
          t === ElementType.FIRE ||
          t === ElementType.LAVA ||
          t === ElementType.STEAM ||
          t === ElementType.WATER
        ) {
          if (Math.random() > 0.1) {
            this.nextGrid[this.getIndex(x, y)] = ElementType.WATER;
            this.updated[this.getIndex(x, y)] = true;
            return true;
          }
        }
      }
    }
    return false;
  }

  mudEffect(x: number, y: number): boolean {
    const neighbors = [
      [0, 1],
      [0, -1],
      [1, 0],
      [-1, 0],
    ];
    for (const [dx, dy] of neighbors) {
      const nx = x + dx;
      const ny = y + dy;
      if (this.isInBounds(nx, ny)) {
        const target = this.grid[this.getIndex(nx, ny)];
        if (target === ElementType.DIRT) {
          if (Math.random() > 0.9) {
            this.nextGrid[this.getIndex(nx, ny)] = ElementType.CLAY;
            this.nextGrid[this.getIndex(x, y)] = ElementType.EMPTY;
            this.updated[this.getIndex(nx, ny)] = true;
            this.updated[this.getIndex(x, y)] = true;
            return true;
          }
        }
      }
    }
    return false;
  }

  rustEffect(x: number, y: number) {
    const neighbors = [
      [0, 1],
      [0, -1],
      [1, 0],
      [-1, 0],
    ];
    for (const [dx, dy] of neighbors) {
      const nx = x + dx;
      const ny = y + dy;
      if (this.isInBounds(nx, ny)) {
        const t = this.grid[this.getIndex(nx, ny)];
        if (t === ElementType.METAL) {
          if (Math.random() > 0.95) {
            this.nextGrid[this.getIndex(nx, ny)] = ElementType.RUST;
            this.updated[this.getIndex(nx, ny)] = true;
          }
        }
      }
    }
  }

  sparkProcess(x: number, y: number) {
    const neighbors = [
      [0, 1],
      [0, -1],
      [1, 0],
      [-1, 0],
      [1, 1],
      [-1, -1],
      [1, -1],
      [-1, 1],
    ];
    for (const [dx, dy] of neighbors) {
      const nx = x + dx;
      const ny = y + dy;
      if (this.isInBounds(nx, ny)) {
        const t = this.grid[this.getIndex(nx, ny)];
        if (t === ElementType.WIRE || t === ElementType.METAL || t === ElementType.IRON || t === ElementType.COPPER || t === ElementType.GOLD || t === ElementType.WATER) {
          // Spark travels through conductive
          if (this.moveIf(x, y, nx, ny, [ElementType.EMPTY])) {
            return; // moved successfully
          } else if (Math.random() > 0.5) {
            // sometimes spawns a spark
            if (this.moveIf(nx, ny, x, y, [ElementType.SPARK, ElementType.ELECTRICITY])) {
              // effectively swapping places
            }
          }
        } else if (
          t === ElementType.GUNPOWDER ||
          t === ElementType.NITRO ||
          t === ElementType.GAS ||
          t === ElementType.C4 ||
          t === ElementType.HYDROGEN ||
          t === ElementType.ALCOHOL
        ) {
          this.explode(nx, ny);
        } else if (t === ElementType.NUKE) {
          this.explode(nx, ny, 30);
        }
      }
    }
  }

  processAntimatter(x: number, y: number) {
    const neighbors = [ [0, 1], [0, -1], [1, 0], [-1, 0] ];
    for (const [dx, dy] of neighbors) {
      const nx = x + dx; const ny = y + dy;
      if (this.isInBounds(nx, ny)) {
        const t = this.grid[this.getIndex(nx, ny)];
        if (t !== ElementType.EMPTY && t !== ElementType.VOID && t !== ElementType.BLACK_HOLE && t !== ElementType.ANTIMATTER) {
           this.explode(x, y, 15);
           return;
        }
      }
    }
  }

  explode(x: number, y: number, baseRadius: number = 6) {
    const radius = baseRadius + Math.random() * (baseRadius * 1.5);
    for (let dy = -radius; dy <= radius; dy++) {
      for (let dx = -radius; dx <= radius; dx++) {
        const distSq = dx * dx + dy * dy;
        if (distSq <= radius * radius) {
          const nx = x + Math.floor(dx);
          const ny = y + Math.floor(dy);
          if (this.isInBounds(nx, ny)) {
            const currentIdx = this.getIndex(nx, ny);
            const currentTarget = this.grid[currentIdx];
            
            if (currentTarget === ElementType.OBSIDIAN || currentTarget === ElementType.DIAMOND || currentTarget === ElementType.BLACK_HOLE || currentTarget === ElementType.VOID) {
               continue; // Indestructible
            }

            // Core of explosion: extreme heat and destruction
            if (distSq < radius * radius * 0.4) {
              this.nextGrid[currentIdx] =
                Math.random() > 0.4 ? ElementType.FIRE : ElementType.EMPTY;
            } else if (Math.random() > 0.4) {
              // Outer ring: mostly smoke and heat
              this.nextGrid[currentIdx] =
                Math.random() > 0.5 ? ElementType.SMOKE : ElementType.FIRE;
            }

            this.updated[currentIdx] = true;
          }
        }
      }
    }
  }

  clear() {
    this.grid.fill(ElementType.EMPTY);
    this.nextGrid.fill(ElementType.EMPTY);
    this.updated.fill(false);
  }
}
