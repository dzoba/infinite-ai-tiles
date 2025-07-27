import { TerrainType } from './WangTiling';

// Tile definitions based on corner materials (TL, TR, BR, BL - clockwise)
export const CORNER_TILES = [
  { index: 0, corners: ['grass', 'grass', 'water', 'grass'] },
  { index: 1, corners: ['grass', 'grass', 'water', 'water'] },
  { index: 2, corners: ['grass', 'grass', 'grass', 'water'] },
  { index: 3, corners: ['water', 'water', 'grass', 'water'] },
  { index: 4, corners: ['water', 'water', 'water', 'grass'] },
  { index: 5, corners: ['grass', 'water', 'water', 'grass'] },
  { index: 6, corners: ['water', 'water', 'water', 'water'] },
  { index: 7, corners: ['water', 'grass', 'grass', 'water'] },
  { index: 8, corners: ['water', 'grass', 'water', 'water'] },
  { index: 9, corners: ['grass', 'water', 'water', 'water'] },
  { index: 10, corners: ['grass', 'water', 'grass', 'grass'] },
  { index: 11, corners: ['water', 'water', 'grass', 'grass'] },
  { index: 12, corners: ['water', 'grass', 'grass', 'grass'] },
  { index: 13, corners: ['water', 'grass', 'water', 'grass'] },
  { index: 14, corners: ['grass', 'water', 'grass', 'water'] },
  { index: 15, corners: ['water', 'water', 'water', 'water'] }, // duplicate water (same as tile 6)
  { index: 16, corners: ['grass', 'grass', 'grass', 'grass'] }, // Pure grass - but might be out of bounds
];

export class CornerTiling {
  // Get the tile index based on the corner materials
  static getTileIndex(
    topLeft: TerrainType,
    topRight: TerrainType,
    bottomRight: TerrainType,
    bottomLeft: TerrainType
  ): number {
    // Convert terrain types to material names
    const getMaterial = (terrain: TerrainType): string => {
      switch (terrain) {
        case TerrainType.WATER: return 'water';
        case TerrainType.SAND: return 'sand';
        case TerrainType.GRASS: return 'grass';
        default: return 'water';
      }
    };

    const corners = [
      getMaterial(topLeft),
      getMaterial(topRight),
      getMaterial(bottomRight),
      getMaterial(bottomLeft)
    ];

    // Find matching tile
    for (const tile of CORNER_TILES) {
      // Don't skip tile 16 - let's see if it works even though it should be out of bounds
      // if (tile.index > 15) continue; // Skip tiles beyond our tileset size
      
      if (JSON.stringify(tile.corners) === JSON.stringify(corners)) {
        return tile.index;
      }
    }

    // Fallback based on majority material
    const waterCount = corners.filter(c => c === 'water').length;
    const grassCount = corners.filter(c => c === 'grass').length;
    
    if (waterCount === 4) return 6; // All water
    if (grassCount === 4) {
      // The pure grass tile must be one of 0-15
      // Looking at the tileset image carefully, let me try each position
      // Top row: 0,1,2,3 - all have water/sand edges
      // Second row: 4,5,6,7 - position 5 might be it
      // Third row: 8,9,10,11 - position 11 might be it  
      // Bottom row: 12,13,14,15 - need to check
      return 11; // Try tile 11
    }
    
    // For mixed tiles, find the closest match
    if (waterCount >= 3) return 6; // Mostly water
    if (grassCount >= 3) return 12; // Mostly grass
    return 5; // Mixed water/grass
  }

  // Helper to get corner terrain based on neighboring cells
  static getCornerTerrain(
    center: TerrainType,
    horizontal: TerrainType,
    vertical: TerrainType,
    diagonal: TerrainType
  ): TerrainType {
    // For corner-based Wang tiling, the corner material is determined by
    // looking at the 4 cells that meet at that corner.
    // The simplest rule: if ANY of the 4 tiles is water, the corner is water
    // This creates nice smooth transitions
    
    if (center === TerrainType.WATER || 
        horizontal === TerrainType.WATER || 
        vertical === TerrainType.WATER || 
        diagonal === TerrainType.WATER) {
      return TerrainType.WATER;
    }
    
    // If all 4 tiles are grass, the corner is grass
    return TerrainType.GRASS;
  }
}