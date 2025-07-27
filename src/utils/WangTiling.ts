export enum TerrainType {
  WATER = 0,
  SAND = 1, 
  GRASS = 2
}

// Wang tile indices for different edge combinations
// Each tile has 4 edges: North, East, South, West
// 0 = water, 1 = sand, 2 = grass
// Wang tiles mapping based on the actual tileset layout
// The tileset is a 4x4 grid (16 tiles) with water-sand-grass transitions
export const WANG_TILES: Record<string, number> = {
  // Row 0: Water and water-edge tiles
  '0,0,0,0': 0,    // Full water
  '0,0,0,1': 1,    // Water with sand on west
  '0,0,1,0': 2,    // Water with sand on south
  '0,0,1,1': 3,    // Water with sand on south-west corner
  
  // Row 1: Sand transitions
  '0,1,0,0': 4,    // Water with sand on east
  '1,1,1,1': 5,    // Full sand
  '1,0,0,0': 6,    // Sand with water on east/south/west
  '1,0,0,1': 7,    // Mixed transition
  
  // Row 2: Sand-grass transitions
  '0,1,1,0': 8,    // Transition tile
  '1,1,1,0': 9,    // Sand with water on west
  '1,0,1,1': 10,   // Complex transition
  '1,1,0,0': 11,   // Sand with water on south/west
  
  // Row 3: Grass tiles
  '1,1,0,1': 12,   // Transition to grass
  '2,1,1,1': 13,   // Sand with grass on north
  '1,1,2,1': 14,   // Sand with grass on south
  '2,2,2,2': 15,   // Full grass
};

export class WangTiling {
  // Get terrain type based on noise value
  static getTerrainFromNoise(noiseValue: number): TerrainType {
    // Adjusted thresholds for more visible land
    if (noiseValue < -0.2) return TerrainType.WATER;
    if (noiseValue < 0.2) return TerrainType.SAND;
    return TerrainType.GRASS;
  }
  
  // Get the appropriate Wang tile index based on neighboring terrain
  static getWangTileIndex(
    center: TerrainType,
    north: TerrainType,
    east: TerrainType, 
    south: TerrainType,
    west: TerrainType
  ): number {
    // For water tiles, check which edges have land (sand/grass)
    if (center === TerrainType.WATER) {
      const hasLandNorth = north !== TerrainType.WATER;
      const hasLandEast = east !== TerrainType.WATER;
      const hasLandSouth = south !== TerrainType.WATER;
      const hasLandWest = west !== TerrainType.WATER;
      
      // Select water tile based on land edges
      if (!hasLandNorth && !hasLandEast && !hasLandSouth && !hasLandWest) return 0; // Full water
      if (!hasLandNorth && !hasLandEast && !hasLandSouth && hasLandWest) return 1;  // Land on west
      if (!hasLandNorth && !hasLandEast && hasLandSouth && !hasLandWest) return 2;  // Land on south
      if (!hasLandNorth && !hasLandEast && hasLandSouth && hasLandWest) return 3;   // Land on SW corner
      if (!hasLandNorth && hasLandEast && !hasLandSouth && !hasLandWest) return 4;  // Land on east
      
      // More combinations...
      return 0; // Default water
    }
    
    // For sand tiles
    if (center === TerrainType.SAND) {
      const waterCount = [north, east, south, west].filter(t => t === TerrainType.WATER).length;
      const grassCount = [north, east, south, west].filter(t => t === TerrainType.GRASS).length;
      
      if (waterCount === 0 && grassCount === 0) return 5; // Full sand
      if (waterCount > 0) {
        // Sand-water transitions (tiles 4-11 have various sand-water combos)
        if (west === TerrainType.WATER) return 9;
        if (east === TerrainType.WATER) return 4;
        return 6; // Generic sand-water transition
      }
      if (grassCount > 0) {
        // Sand-grass transitions
        if (north === TerrainType.GRASS) return 13;
        if (south === TerrainType.GRASS) return 14;
        return 12; // Generic sand-grass transition
      }
      return 5; // Default sand
    }
    
    // For grass tiles
    if (center === TerrainType.GRASS) {
      return 15; // Full grass (simplified for now)
    }
    
    return 0; // Default fallback
  }
  
  // Helper to determine edge terrain between two cells
  static getEdgeTerrain(terrain1: TerrainType, terrain2: TerrainType): TerrainType {
    // If same terrain, use that terrain
    if (terrain1 === terrain2) return terrain1;
    
    // For different terrains, use the "lower" one (water < sand < grass)
    return Math.min(terrain1, terrain2) as TerrainType;
  }
}