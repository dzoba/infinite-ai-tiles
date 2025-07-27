import Phaser from 'phaser';
import { ChunkManager } from '../utils/ChunkManager';

export class WorldScene extends Phaser.Scene {
  private chunkManager?: ChunkManager;
  private tilemap?: Phaser.Tilemaps.Tilemap;
  private tileset?: Phaser.Tilemaps.Tileset;
  private tilesetData?: any;

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

    // Enable camera controls
    const cursors = this.input.keyboard?.createCursorKeys();
    const wasd = this.input.keyboard?.addKeys('W,S,A,D') as any;

    // Store controls for update loop
    (this as any).cursors = cursors;
    (this as any).wasd = wasd;

    console.log('WorldScene: Initializing chunk manager...');

    // Initialize chunk manager
    this.chunkManager = new ChunkManager(this, this.tilemap, this.tileset);

    console.log('WorldScene: World initialization complete!');

    // Clear loading text and show instructions
    this.children.removeAll();
    
    // Show instructions
    this.add.text(10, 10, 'Use WASD or Arrow Keys to move around', {
      fontSize: '16px',
      color: '#ffffff',
      backgroundColor: '#000000',
      padding: { x: 10, y: 5 }
    }).setScrollFactor(0);

    // Force initial chunk load
    this.chunkManager.update(0, 0);
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
  }
}