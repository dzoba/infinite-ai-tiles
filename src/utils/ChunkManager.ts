export interface ChunkCoord {
  x: number;
  y: number;
}

import { TerrainType } from './WangTiling';
import { CornerTiling } from './CornerTiling';

export interface TileData {
  terrain: TerrainType;
  tileIndex: number;
}

export class Chunk {
  public coord: ChunkCoord;
  public tiles: TileData[][];
  public layer?: Phaser.Tilemaps.TilemapLayer;
  
  constructor(coord: ChunkCoord, size: number = 32) {
    this.coord = coord;
    this.tiles = Array(size).fill(null).map(() => Array(size).fill(null));
  }
  
  public getKey(): string {
    return `${this.coord.x},${this.coord.y}`;
  }
}

export interface TerrainConfig {
  islandDensity?: number;     // Number of islands per 100x100 area (default: 0.5)
  islandSize?: number;        // Average island radius in tiles (default: 20)
  islandSizeVariation?: number; // Size variation factor 0-1 (default: 0.5)
  edgeNoise?: number;         // Amount of edge noise 0-1 (default: 0.2)
  seed?: number;              // Random seed
}

export class ChunkManager {
  private chunks = new Map<string, Chunk>();
  private chunkSize = 32;
  private baseLoadRadius = 2;
  
  private tilemap: Phaser.Tilemaps.Tilemap;
  private tileset: Phaser.Tilemaps.Tileset;
  
  // Terrain generation parameters
  private terrainConfig: Required<TerrainConfig> = {
    islandDensity: 12.1,      // Islands per 100x100 area
    islandSize: 14,           // Average radius in tiles
    islandSizeVariation: 0.5, // Size variation 0-1
    edgeNoise: 0.2,          // Edge roughness 0-1
    seed: 707
  };
  
  // Cache for Voronoi seeds to ensure consistency across chunks
  private voronoiSeedCache = new Map<string, {x: number, y: number, size: number}>();
  
  constructor(_scene: Phaser.Scene, tilemap: Phaser.Tilemaps.Tilemap, tileset: Phaser.Tilemaps.Tileset, config?: TerrainConfig) {
    this.tilemap = tilemap;
    this.tileset = tileset;
    
    // Apply custom config
    if (config) {
      this.terrainConfig = { ...this.terrainConfig, ...config };
    }
  }
  
  public update(cameraX: number, cameraY: number, zoom: number = 1): void {
    const currentChunkX = Math.floor(cameraX / (this.chunkSize * 16)); // 16 = tile size
    const currentChunkY = Math.floor(cameraY / (this.chunkSize * 16));
    
    // Calculate dynamic load radius based on zoom
    // When zoomed out (zoom < 1), we need to load more chunks
    // When zoomed in (zoom > 1), we can use the base radius
    const loadRadius = Math.ceil(this.baseLoadRadius / zoom) + 1;
    
    // Load chunks within radius
    for (let x = currentChunkX - loadRadius; x <= currentChunkX + loadRadius; x++) {
      for (let y = currentChunkY - loadRadius; y <= currentChunkY + loadRadius; y++) {
        const key = `${x},${y}`;
        if (!this.chunks.has(key)) {
          this.loadChunk({ x, y });
        }
      }
    }
    
    // Unload distant chunks
    const chunksToRemove: string[] = [];
    this.chunks.forEach((chunk, key) => {
      const dx = Math.abs(chunk.coord.x - currentChunkX);
      const dy = Math.abs(chunk.coord.y - currentChunkY);
      if (dx > loadRadius + 1 || dy > loadRadius + 1) {
        chunksToRemove.push(key);
      }
    });
    
    chunksToRemove.forEach(key => this.unloadChunk(key));
  }
  
  private loadChunk(coord: ChunkCoord): void {
    console.log('ChunkManager: Loading chunk', coord);
    
    const chunk = new Chunk(coord, this.chunkSize);
    
    // First pass: Generate base terrain map for current chunk and neighbors
    const terrainMap = this.generateTerrainMap(coord);
    
    
    // Second pass: Apply autotiling based on neighboring terrain
    for (let x = 0; x < this.chunkSize; x++) {
      for (let y = 0; y < this.chunkSize; y++) {
        const center = terrainMap[x + 1][y + 1]; // +1 because we have border
        
        // Get all 8 neighbors for autotiling
        // Remember: center is at [x+1][y+1] in the terrain map
        const neighbors = {
          nw: terrainMap[x][y],         // northwest
          n: terrainMap[x + 1][y],      // north
          ne: terrainMap[x + 2][y],     // northeast
          w: terrainMap[x][y + 1],      // west
          e: terrainMap[x + 2][y + 1],  // east
          sw: terrainMap[x][y + 2],     // southwest
          s: terrainMap[x + 1][y + 2],  // south
          se: terrainMap[x + 2][y + 2]  // southeast
        };
        
        // Corner-based tile selection
        // Determine the terrain at each corner of this tile
        const topLeft = CornerTiling.getCornerTerrain(
          center, 
          neighbors.n,
          neighbors.w, 
          neighbors.nw
        );
        
        const topRight = CornerTiling.getCornerTerrain(
          center,
          neighbors.n,
          neighbors.e,
          neighbors.ne
        );
        
        const bottomRight = CornerTiling.getCornerTerrain(
          center,
          neighbors.s,
          neighbors.e,
          neighbors.se
        );
        
        const bottomLeft = CornerTiling.getCornerTerrain(
          center,
          neighbors.s,
          neighbors.w,
          neighbors.sw
        );
        
        // Get the appropriate tile index based on corner materials
        const tileIndex = CornerTiling.getTileIndex(
          topLeft,
          topRight,
          bottomRight,
          bottomLeft
        );
        
        
        chunk.tiles[x][y] = { terrain: center, tileIndex };
      }
    }
    
    // Create Phaser tilemap layer for this chunk
    const layer = this.tilemap.createBlankLayer(
      `chunk_${chunk.getKey()}`, 
      this.tileset, 
      coord.x * this.chunkSize * 16, 
      coord.y * this.chunkSize * 16,
      this.chunkSize,
      this.chunkSize,
      16, // tile width
      16  // tile height
    );
    
    if (layer) {
      // Fill the layer with generated tiles
      for (let x = 0; x < this.chunkSize; x++) {
        for (let y = 0; y < this.chunkSize; y++) {
          const tileData = chunk.tiles[x][y];
          if (tileData) {
            layer.putTileAt(tileData.tileIndex, x, y);
          }
        }
      }
      
      chunk.layer = layer;
    }
    
    this.chunks.set(chunk.getKey(), chunk);
  }
  
  // Generate terrain map including borders for Wang tiling
  private generateTerrainMap(coord: ChunkCoord): TerrainType[][] {
    const mapSize = this.chunkSize + 2; // +2 for border (1 tile on each side)
    const terrainMap: TerrainType[][] = [];
    
    // Initialize all as water
    for (let x = 0; x < mapSize; x++) {
      terrainMap[x] = [];
      for (let y = 0; y < mapSize; y++) {
        terrainMap[x][y] = TerrainType.WATER;
      }
    }
    
    // Get all Voronoi seeds that could affect this chunk
    const influenceRadius = this.terrainConfig.islandSize * 2;
    const seeds = this.getVoronoiSeeds(coord, influenceRadius);
    
    
    // For each tile, check if it's inside any island
    for (let x = 0; x < mapSize; x++) {
      for (let y = 0; y < mapSize; y++) {
        const worldX = coord.x * this.chunkSize + x - 1; // -1 for border offset
        const worldY = coord.y * this.chunkSize + y - 1;
        
        // Check distance to all nearby seeds
        for (const seed of seeds) {
          const dx = worldX - seed.x;
          const dy = worldY - seed.y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          
          // Apply edge noise for more natural shapes
          const angle = Math.atan2(dy, dx);
          // Create smooth variation around the circle using multiple harmonics
          const noise1 = Math.sin(angle * 3 + seed.x * 0.1) * 0.3;
          const noise2 = Math.sin(angle * 7 + seed.y * 0.1) * 0.15;
          const noise3 = Math.sin(angle * 11 + (seed.x + seed.y) * 0.1) * 0.1;
          const noiseFactor = 1 + this.terrainConfig.edgeNoise * (noise1 + noise2 + noise3);
          
          const effectiveRadius = seed.size * noiseFactor;
          
          if (distance < effectiveRadius) {
            terrainMap[x][y] = TerrainType.GRASS;
            break; // This tile is land, no need to check other seeds
          }
        }
      }
    }
    
    // Apply post-processing cleanup to remove thin landmasses
    this.cleanupThinLandmasses(terrainMap);
    
    return terrainMap;
  }

  // Remove thin landmasses and small islands that don't tile well
  private cleanupThinLandmasses(terrainMap: TerrainType[][]): void {
    const mapSize = terrainMap.length;
    const minLandNeighbors = 2; // Land tiles need at least this many land neighbors to survive
    
    // Create a copy to avoid modifying while iterating
    const originalMap = terrainMap.map(row => [...row]);
    
    for (let x = 1; x < mapSize - 1; x++) {
      for (let y = 1; y < mapSize - 1; y++) {
        if (originalMap[x][y] === TerrainType.GRASS) {
          // Count land neighbors (including diagonal)
          let landNeighbors = 0;
          for (let dx = -1; dx <= 1; dx++) {
            for (let dy = -1; dy <= 1; dy++) {
              if (dx === 0 && dy === 0) continue; // Skip center tile
              const nx = x + dx;
              const ny = y + dy;
              if (nx >= 0 && nx < mapSize && ny >= 0 && ny < mapSize) {
                if (originalMap[nx][ny] === TerrainType.GRASS) {
                  landNeighbors++;
                }
              }
            }
          }
          
          // If this land tile has too few land neighbors, convert it to water
          if (landNeighbors < minLandNeighbors) {
            terrainMap[x][y] = TerrainType.WATER;
          }
        }
      }
    }
  }

  // Get Voronoi seeds that could affect the given chunk
  private getVoronoiSeeds(coord: ChunkCoord, radius: number): Array<{x: number, y: number, size: number}> {
    const seeds: Array<{x: number, y: number, size: number}> = [];
    const gridSize = 100; // Grid cells for seed placement
    
    // Calculate which grid cells could contain seeds affecting this chunk
    const chunkWorldX = coord.x * this.chunkSize;
    const chunkWorldY = coord.y * this.chunkSize;
    
    const minGridX = Math.floor((chunkWorldX - radius) / gridSize);
    const maxGridX = Math.floor((chunkWorldX + this.chunkSize + radius) / gridSize);
    const minGridY = Math.floor((chunkWorldY - radius) / gridSize);
    const maxGridY = Math.floor((chunkWorldY + this.chunkSize + radius) / gridSize);
    
    // Check each grid cell
    for (let gx = minGridX; gx <= maxGridX; gx++) {
      for (let gy = minGridY; gy <= maxGridY; gy++) {
        // Generate seeds for this grid cell deterministically
        const seedsInCell = this.generateSeedsForCell(gx, gy, gridSize);
        seedsInCell.forEach((seed, index) => {
          const seedKey = `${gx},${gy}_${index}`;
          // Check cache first
          if (this.voronoiSeedCache.has(seedKey)) {
            seeds.push(this.voronoiSeedCache.get(seedKey)!);
          } else {
            this.voronoiSeedCache.set(seedKey, seed);
            seeds.push(seed);
          }
        });
      }
    }
    
    return seeds;
  }
  
  // Generate island seeds for a specific grid cell
  private generateSeedsForCell(gridX: number, gridY: number, gridSize: number): Array<{x: number, y: number, size: number}> {
    const seeds: Array<{x: number, y: number, size: number}> = [];
    
    // Use grid coordinates as part of the random seed
    const cellSeed = this.hash(gridX, gridY, this.terrainConfig.seed);
    const rng = this.createRNG(cellSeed);
    
    // Determine number of seeds in this cell based on density
    // islandDensity is the average number of islands per grid cell
    const avgSeeds = this.terrainConfig.islandDensity;
    let numSeeds = 0;
    
    // Use Poisson-like distribution for natural clustering
    if (avgSeeds < 1) {
      // For low density, use probability
      numSeeds = rng() < avgSeeds ? 1 : 0;
    } else {
      // For higher density, generate multiple seeds
      numSeeds = Math.floor(avgSeeds);
      if (rng() < (avgSeeds - numSeeds)) {
        numSeeds++;
      }
    }
    
    
    for (let i = 0; i < numSeeds; i++) {
      // Random position within grid cell
      const x = gridX * gridSize + rng() * gridSize;
      const y = gridY * gridSize + rng() * gridSize;
      
      // Vary the island size
      const sizeVariation = 1 + (rng() - 0.5) * 2 * this.terrainConfig.islandSizeVariation;
      const size = this.terrainConfig.islandSize * sizeVariation;
      
      seeds.push({ x, y, size });
    }
    
    return seeds;
  }
  
  // Simple hash function for deterministic randomness
  private hash(x: number, y: number, seed: number): number {
    let h = seed + x * 374761393 + y * 668265263;
    h = (h ^ (h >>> 13)) * 1274126177;
    return h ^ (h >>> 16);
  }
  
  // Create a seeded random number generator
  private createRNG(seed: number): () => number {
    let s = seed;
    return () => {
      s = (s * 9301 + 49297) % 233280;
      return s / 233280;
    };
  }
  
  private unloadChunk(key: string): void {
    const chunk = this.chunks.get(key);
    if (chunk?.layer) {
      chunk.layer.destroy();
    }
    this.chunks.delete(key);
  }
}