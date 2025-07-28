import Phaser from 'phaser';
import { ChunkManager } from '../utils/ChunkManager';

import type { TerrainConfig } from '../utils/ChunkManager';

export class WorldScene extends Phaser.Scene {
  private chunkManager?: ChunkManager;
  private tilemap?: Phaser.Tilemaps.Tilemap;
  private tileset?: Phaser.Tilemaps.Tileset;
  private tilesetData?: any;
  private lastReportedCameraX: number = 0;
  private lastReportedCameraY: number = 0;

  constructor() {
    super({ key: 'WorldScene' });
  }

  init(data: { tilesetData: any }) {
    this.tilesetData = data.tilesetData;
  }

  create() {
    if (!this.tilesetData) {
      console.error('No tileset data provided');
      return;
    }

    console.log('WorldScene: Loading tileset image...');

    // Load the tileset image from base64 data
    this.load.image('tileset', this.tilesetData.base64);
    
    this.load.on('complete', () => {
      console.log('WorldScene: Tileset loaded, initializing world...');
      this.initializeWorld();
    });
    
    this.load.start();

    // Show loading text
    this.add.text(400, 300, 'Initializing Infinite World...', {
      fontSize: '24px',
      color: '#ffffff'
    }).setOrigin(0.5);
  }
  
  private initializeWorld() {
    // Create a tilemap
    this.tilemap = this.make.tilemap({
      tileWidth: 16,
      tileHeight: 16,
      width: 1000, // Large map size
      height: 1000
    });

    // Add the tileset to the map
    const tileset = this.tilemap.addTilesetImage('tileset', 'tileset', 16, 16);

    if (!tileset) {
      console.error('Failed to create tileset');
      return;
    }
    
    this.tileset = tileset;

    console.log('WorldScene: Setting up camera and controls...');

    // Set up camera
    this.cameras.main.setBounds(-10000, -10000, 20000, 20000);
    this.cameras.main.setZoom(2);
    
    // Set initial camera position from URL params if available
    const initialPos = (window as any).initialCameraPosition;
    if (initialPos && initialPos.x !== 0 && initialPos.y !== 0) {
      this.cameras.main.scrollX = initialPos.x;
      this.cameras.main.scrollY = initialPos.y;
    }

    // Enable camera controls
    const cursors = this.input.keyboard?.createCursorKeys();
    const wasd = this.input.keyboard?.addKeys('W,S,A,D') as any;

    // Store controls for update loop
    (this as any).cursors = cursors;
    (this as any).wasd = wasd;

    console.log('WorldScene: Initializing chunk manager...');

    // Initialize chunk manager with terrain config from window or defaults
    const terrainConfig = (window as any).terrainConfig || {
      islandDensity: 12.1,
      islandSize: 14,
      islandSizeVariation: 0.5,
      edgeNoise: 0.2,
    };
    
    this.chunkManager = new ChunkManager(this, this.tilemap, this.tileset, terrainConfig);

    console.log('WorldScene: World initialization complete!');

    // Clear loading text and show instructions
    this.children.removeAll();
    
    // Show instructions
    this.add.text(10, 10, 'Use WASD or Arrow Keys to move around', {
      fontSize: '16px',
      color: '#ffffff',
      backgroundColor: '#000000',
      padding: { x: 10, y: 5 }
    }).setScrollFactor(0).setDepth(1000);

    // Force initial chunk load
    this.chunkManager.update(0, 0);
  }

  // Method to update terrain configuration
  updateTerrainConfig(config: TerrainConfig) {
    if (!this.tilemap || !this.tileset) return;
    
    console.log('Updating terrain config:', config);
    
    // Create new chunk manager with new config
    this.chunkManager = new ChunkManager(this, this.tilemap, this.tileset, config);
    
    // Clear all existing tilemap layers
    this.tilemap.layers.forEach(layer => {
      if (layer.tilemapLayer) {
        layer.tilemapLayer.destroy();
      }
    });
    this.tilemap.layers = [];
    
    // Force reload at current position
    this.chunkManager.update(this.cameras.main.scrollX, this.cameras.main.scrollY);
  }

  update() {
    const cursors = (this as any).cursors;
    const wasd = (this as any).wasd;
    
    if (!cursors && !wasd) return;

    const speed = 5;
    let deltaX = 0;
    let deltaY = 0;

    // Handle input
    if (cursors?.left.isDown || wasd?.A.isDown) deltaX = -speed;
    if (cursors?.right.isDown || wasd?.D.isDown) deltaX = speed;
    if (cursors?.up.isDown || wasd?.W.isDown) deltaY = -speed;
    if (cursors?.down.isDown || wasd?.S.isDown) deltaY = speed;

    // Move camera
    if (deltaX !== 0 || deltaY !== 0) {
      this.cameras.main.scrollX += deltaX;
      this.cameras.main.scrollY += deltaY;
    }

    // Update chunk manager
    if (this.chunkManager) {
      this.chunkManager.update(this.cameras.main.scrollX, this.cameras.main.scrollY);
    }
    
    // Report camera position changes (throttled)
    const currentX = Math.floor(this.cameras.main.scrollX);
    const currentY = Math.floor(this.cameras.main.scrollY);
    
    if (Math.abs(currentX - this.lastReportedCameraX) > 50 || 
        Math.abs(currentY - this.lastReportedCameraY) > 50) {
      this.lastReportedCameraX = currentX;
      this.lastReportedCameraY = currentY;
      
      const onCameraMove = (window as any).onCameraMove;
      if (onCameraMove) {
        onCameraMove(currentX, currentY);
      }
    }
  }
}