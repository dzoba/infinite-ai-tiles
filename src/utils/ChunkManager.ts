export interface ChunkCoord {
  x: number;
  y: number;
}

import { TerrainType, WangTiling } from './WangTiling';
import { Autotiling } from './Autotiling';
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

export class ChunkManager {
  private chunks = new Map<string, Chunk>();
  private chunkSize = 32;
  private loadRadius = 2;
  
  private scene: Phaser.Scene;
  private tilemap: Phaser.Tilemaps.Tilemap;
  private tileset: Phaser.Tilemaps.Tileset;
  
  constructor(scene: Phaser.Scene, tilemap: Phaser.Tilemaps.Tilemap, tileset: Phaser.Tilemaps.Tileset) {
    this.scene = scene;
    this.tilemap = tilemap;
    this.tileset = tileset;
  }
  
  public update(cameraX: number, cameraY: number): void {
    const currentChunkX = Math.floor(cameraX / (this.chunkSize * 16)); // 16 = tile size
    const currentChunkY = Math.floor(cameraY / (this.chunkSize * 16));
    
    // Load chunks within radius
    for (let x = currentChunkX - this.loadRadius; x <= currentChunkX + this.loadRadius; x++) {
      for (let y = currentChunkY - this.loadRadius; y <= currentChunkY + this.loadRadius; y++) {
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
      if (dx > this.loadRadius + 1 || dy > this.loadRadius + 1) {
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
    
    for (let x = 0; x < mapSize; x++) {
      terrainMap[x] = [];
      for (let y = 0; y < mapSize; y++) {
        const worldX = coord.x * this.chunkSize + x - 1; // -1 for border offset
        const worldY = coord.y * this.chunkSize + y - 1;
        
        const noiseValue = this.simpleNoise(worldX, worldY);
        terrainMap[x][y] = WangTiling.getTerrainFromNoise(noiseValue);
      }
    }
    
    return terrainMap;
  }

  // Simple pseudo-noise function to replace Perlin noise for now
  private simpleNoise(x: number, y: number): number {
    // Create more natural terrain with pseudo-random noise
    const seed = 12345;
    
    // Hash function for pseudo-random values
    const hash = (a: number, b: number): number => {
      let h = (a * 374761393 + b * 668265261 + seed) & 0xffffffff;
      h = ((h ^ (h >>> 16)) * 0x85ebca6b) & 0xffffffff;
      h = ((h ^ (h >>> 13)) * 0xc2b2ae35) & 0xffffffff;
      return ((h ^ (h >>> 16)) & 0xffffffff) / 0xffffffff;
    };
    
    // Interpolation function
    const smoothstep = (t: number): number => t * t * (3 - 2 * t);
    
    // Grid-based noise
    const scale = 0.05;
    const sx = x * scale;
    const sy = y * scale;
    
    const x0 = Math.floor(sx);
    const y0 = Math.floor(sy);
    const x1 = x0 + 1;
    const y1 = y0 + 1;
    
    const fx = smoothstep(sx - x0);
    const fy = smoothstep(sy - y0);
    
    // Get values at grid corners
    const v00 = hash(x0, y0) * 2 - 1;
    const v10 = hash(x1, y0) * 2 - 1;
    const v01 = hash(x0, y1) * 2 - 1;
    const v11 = hash(x1, y1) * 2 - 1;
    
    // Bilinear interpolation
    const v0 = v00 * (1 - fx) + v10 * fx;
    const v1 = v01 * (1 - fx) + v11 * fx;
    const value = v0 * (1 - fy) + v1 * fy;
    
    // Add some larger scale variation for continents
    const largeScale = Math.sin(x * 0.008 + 100) * Math.cos(y * 0.008 + 200) * 0.5;
    
    // Add medium scale features
    const mediumScale = Math.sin(x * 0.02) * Math.cos(y * 0.02) * 0.2;
    
    return Math.max(-1, Math.min(1, value + largeScale + mediumScale));
  }
  
  private unloadChunk(key: string): void {
    const chunk = this.chunks.get(key);
    if (chunk?.layer) {
      chunk.layer.destroy();
    }
    this.chunks.delete(key);
  }
}