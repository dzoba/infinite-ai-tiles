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
    
    console.log('Tileset loaded:', {
      width: tileset.image.width,
      height: tileset.image.height,
      tileWidth: tileset.tileWidth,
      tileHeight: tileset.tileHeight,
      columns: tileset.columns,
      total: tileset.total
    });
    
    this.tileset = tileset;

    console.log('WorldScene: Setting up camera and controls...');

    // Set up camera
    this.cameras.main.setBounds(-10000, -10000, 20000, 20000);
    
    // Set initial zoom from URL params if available
    const initialZoom = (window as any).initialZoom;
    if (initialZoom) {
      this.cameras.main.setZoom(initialZoom);
    } else {
      this.cameras.main.setZoom(2);
    }
    
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

    // Clear loading text
    this.children.removeAll();

    // Force initial chunk load with current zoom
    this.chunkManager.update(this.cameras.main.scrollX, this.cameras.main.scrollY, this.cameras.main.zoom);
    
    // Add scroll to zoom functionality
    this.input.on('wheel', (_pointer: Phaser.Input.Pointer, _gameObjects: any[], _deltaX: number, deltaY: number, _deltaZ: number) => {
      const camera = this.cameras.main;
      const currentZoom = camera.zoom;
      
      // Calculate new zoom level
      const zoomChange = deltaY > 0 ? 0.9 : 1.1; // Scroll down = zoom out, scroll up = zoom in
      const newZoom = Phaser.Math.Clamp(currentZoom * zoomChange, 0.5, 4); // Min zoom 0.5x, max zoom 4x
      
      // Simply set the zoom - this keeps the center of the screen in the center
      camera.setZoom(newZoom);
      
      // Report zoom change
      const onCameraZoom = (window as any).onCameraZoom;
      if (onCameraZoom) {
        onCameraZoom(newZoom);
      }
    });
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

    // Update chunk manager with camera center position and zoom
    if (this.chunkManager) {
      const camera = this.cameras.main;
      const centerX = Math.floor(camera.scrollX + camera.width / 2 / camera.zoom);
      const centerY = Math.floor(camera.scrollY + camera.height / 2 / camera.zoom);
      this.chunkManager.update(centerX, centerY, camera.zoom);
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