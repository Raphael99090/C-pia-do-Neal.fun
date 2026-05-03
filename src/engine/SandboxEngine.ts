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
      if (type === ElementType.VIRUS) {
        this.processVirus(x, y);
      }
      if (type === ElementType.THERMITE) {
        this.processThermite(x, y);
      }
      if (type === ElementType.SNOW) {
        if (this.processSnow(x, y)) return;
      }

      // Check for falling
      const moveBottom = [
        ElementType.EMPTY,
        ElementType.WATER,
        ElementType.GAS,
        ElementType.STEAM,
        ElementType.OIL,
        ElementType.SMOKE,
        ElementType.NITRO,
        ElementType.ACID,
        ElementType.BLOOD,
        ElementType.SLIME,
        ElementType.HONEY,
      ];

      if (this.moveIf(x, y, x, y + 1, moveBottom)) return;
      else if (this.moveIf(x, y, x - 1, y + 1, moveBottom)) return;
      else if (this.moveIf(x, y, x + 1, y + 1, moveBottom)) return;

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
        const liquidsGasesAndEmpty = [
          ElementType.EMPTY,
          ElementType.GAS,
          ElementType.STEAM,
          ElementType.SMOKE,
          ElementType.NEON,
          ElementType.SPARK,
        ];
        // Heavy liquids can displace water
        if (props.density > ELEMENTS[ElementType.WATER].density) {
          liquidsGasesAndEmpty.push(ElementType.WATER);
        }

        if (this.moveIf(x, y, x, y + 1, liquidsGasesAndEmpty)) return;

        const dir = Math.random() > 0.5 ? 1 : -1;
        if (this.moveIf(x, y, x + dir, y + 1, liquidsGasesAndEmpty)) return;
        if (this.moveIf(x, y, x - dir, y + 1, liquidsGasesAndEmpty)) return;

        if (this.moveIf(x, y, x + dir, y, liquidsGasesAndEmpty)) return;
        if (this.moveIf(x, y, x - dir, y, liquidsGasesAndEmpty)) return;
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
      }
      if (type === ElementType.BLOOD) {
        if (Math.random() > 0.999) {
          this.nextGrid[idx] = ElementType.DIRT; // dries up over time
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
      } else if (type === ElementType.SPARK) {
        this.sparkProcess(x, y);
      }

      // Gases, Fire and Spark Movement
      if (type === ElementType.SPARK) {
        // sparks move erratically in all directions
        const dx = Math.floor(Math.random() * 3) - 1;
        const dy = Math.floor(Math.random() * 3) - 1;
        if (
          this.moveIf(x, y, x + dx, y + dy, [
            ElementType.EMPTY,
            ElementType.GAS,
            ElementType.NEON,
            ElementType.SMOKE,
          ])
        )
          return;
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
      if (type === ElementType.SPARK) {
        if (Math.random() > 0.8) {
          this.nextGrid[idx] = ElementType.EMPTY;
          this.updated[idx] = true;
        }
      }

      if (
        type === ElementType.SMOKE ||
        type === ElementType.STEAM ||
        type === ElementType.GAS
      ) {
        if (Math.random() > 0.98) {
          if (type === ElementType.STEAM && Math.random() > 0.9) {
            this.nextGrid[idx] = ElementType.WATER;
          } else {
            this.nextGrid[idx] = ElementType.EMPTY;
          }
          this.updated[idx] = true;
        }
      }
    }
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

  dissolve(x: number, y: number, acidX: number, acidY: number) {
    if (!this.isInBounds(x, y)) return;
    const idx = this.getIndex(x, y);
    const target = this.grid[idx];
    if (
      target !== ElementType.EMPTY &&
      target !== ElementType.STONE &&
      target !== ElementType.ACID &&
      target !== ElementType.GLASS
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
        if (t === ElementType.WIRE || t === ElementType.METAL) {
          // Spark travels through wire.
          if (this.moveIf(x, y, nx, ny, [ElementType.EMPTY])) {
            return; // moved successfully
          } else if (Math.random() > 0.5) {
            // sometimes spawns a spark on the adjacent wire and deletes this one
            if (this.moveIf(nx, ny, x, y, [ElementType.SPARK])) {
              // effectively swapping places
            }
          }
        } else if (
          t === ElementType.GUNPOWDER ||
          t === ElementType.NITRO ||
          t === ElementType.GAS
        ) {
          this.explode(nx, ny);
        }
      }
    }
  }

  explode(x: number, y: number) {
    const radius = 6 + Math.random() * 8;
    for (let dy = -radius; dy <= radius; dy++) {
      for (let dx = -radius; dx <= radius; dx++) {
        const distSq = dx * dx + dy * dy;
        if (distSq <= radius * radius) {
          const nx = x + Math.floor(dx);
          const ny = y + Math.floor(dy);
          if (this.isInBounds(nx, ny)) {
            const currentIdx = this.getIndex(nx, ny);
            const currentTarget = this.grid[currentIdx];

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
