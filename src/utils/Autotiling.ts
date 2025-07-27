import { TerrainType } from './WangTiling';

// Bitmask values for autotiling
const NORTH_WEST = 1;
const NORTH = 2;
const NORTH_EAST = 4;
const WEST = 8;
const EAST = 16;
const SOUTH_WEST = 32;
const SOUTH = 64;
const SOUTH_EAST = 128;

// Tile index mapping based on bitmask values
// This maps the bitmask to the actual tile index in the tileset
const AUTOTILE_MAP: Record<number, number> = {
  0: 0,     // Isolated (all water)
  2: 2,     // North edge
  8: 1,     // West edge
  10: 3,    // North-West corner
  16: 4,    // East edge
  18: 6,    // North-East (not in basic set, use 6)
  24: 7,    // East-West 
  26: 8,    // North-East-West
  64: 2,    // South edge (reuse north pattern)
  66: 5,    // North-South
  72: 3,    // South-West (reuse NW pattern)
  74: 9,    // North-South-West
  80: 11,   // East-South
  82: 10,   // North-East-South
  88: 11,   // East-South-West
  90: 5,    // All sides (use center tile)
  // Add more mappings as needed
};

export class Autotiling {
  // Calculate bitmask based on neighboring terrain matching center terrain
  static calculateBitmask(
    center: TerrainType,
    neighbors: {
      nw: TerrainType, n: TerrainType, ne: TerrainType,
      w: TerrainType,                    e: TerrainType,
      sw: TerrainType, s: TerrainType, se: TerrainType
    }
  ): number {
    let bitmask = 0;
    
    // For water tiles, we check where there's land (sand or grass)
    // For land tiles, we check where there's water
    const checkTerrain = center === TerrainType.WATER ? 
      (t: TerrainType) => t !== TerrainType.WATER :
      (t: TerrainType) => t === TerrainType.WATER;
    
    // Check cardinal directions first
    if (checkTerrain(neighbors.n)) bitmask |= NORTH;
    if (checkTerrain(neighbors.e)) bitmask |= EAST;
    if (checkTerrain(neighbors.s)) bitmask |= SOUTH;
    if (checkTerrain(neighbors.w)) bitmask |= WEST;
    
    // Check corners only if adjacent edges are set
    if ((bitmask & NORTH) && (bitmask & WEST) && checkTerrain(neighbors.nw)) bitmask |= NORTH_WEST;
    if ((bitmask & NORTH) && (bitmask & EAST) && checkTerrain(neighbors.ne)) bitmask |= NORTH_EAST;
    if ((bitmask & SOUTH) && (bitmask & WEST) && checkTerrain(neighbors.sw)) bitmask |= SOUTH_WEST;
    if ((bitmask & SOUTH) && (bitmask & EAST) && checkTerrain(neighbors.se)) bitmask |= SOUTH_EAST;
    
    return bitmask;
  }
  
  // Get tile index based on terrain type and bitmask
  static getTileIndex(terrain: TerrainType, bitmask: number): number {
    // Base tile indices for each terrain type
    const baseTiles = {
      [TerrainType.WATER]: 0,
      [TerrainType.SAND]: 5,
      [TerrainType.GRASS]: 15
    };
    
    // For now, use simplified mapping
    if (terrain === TerrainType.WATER) {
      // Water uses tiles 0-4 for edges
      const mapped = AUTOTILE_MAP[bitmask];
      return mapped !== undefined ? mapped : 0;
    } else if (terrain === TerrainType.SAND) {
      // Sand tiles are in the middle of the tileset
      if (bitmask === 0) return 5; // Full sand
      // Use tiles 4-11 for sand transitions
      return 5 + (bitmask % 7);
    } else {
      // Grass is mostly solid
      return 15;
    }
  }
}