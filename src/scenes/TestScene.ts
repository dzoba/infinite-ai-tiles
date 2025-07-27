import Phaser from 'phaser';

export class TestScene extends Phaser.Scene {
  constructor() {
    super({ key: 'TestScene' });
  }

  preload() {
    // Load tileset JSON
    this.load.json('tilesetData', '/tileset-water-sand-grass.json');
  }

  create() {
    const tilesetData = this.cache.json.get('tilesetData');
    console.log('Tileset data loaded:', tilesetData);

    if (tilesetData && tilesetData.base64) {
      console.log('Base64 data found, loading as image...');
      
      // Load the base64 data as an image using Phaser's loader
      this.load.image('tileset', tilesetData.base64);
      
      this.load.on('complete', () => {
        console.log('Tileset image loaded, creating test map...');
        this.createTestMap();
      });
      
      this.load.start();
      
    } else {
      console.error('No tileset data found or missing base64');
    }

    // Add debug text showing status
    this.add.text(10, 10, 'Loading tileset...', {
      fontSize: '16px',
      color: '#ffffff',
      backgroundColor: '#000000',
      padding: { x: 5, y: 5 }
    });
  }
  
  private createTestMap() {
    console.log('Creating test map...');
    
    // Create a simple test tilemap
    const map = this.make.tilemap({ 
      tileWidth: 16, 
      tileHeight: 16, 
      width: 20, 
      height: 15 
    });
    
    const tileset = map.addTilesetImage('tileset', 'tileset', 16, 16);
    console.log('Tileset created:', tileset);
    
    if (tileset) {
      const layer = map.createBlankLayer('test', tileset, 0, 0);
      console.log('Layer created:', layer);
      
      if (layer) {
        // Fill with a simple pattern
        for (let x = 0; x < 20; x++) {
          for (let y = 0; y < 15; y++) {
            // Use different tile indices to test
            let tileIndex = 0; // Default to first tile
            if ((x + y) % 3 === 1) tileIndex = 8;  // Second tile type
            if ((x + y) % 3 === 2) tileIndex = 16; // Third tile type
            
            layer.putTileAt(tileIndex, x, y);
          }
        }
        
        console.log('Test tilemap filled with tiles');
        
        // Update debug text
        this.add.text(10, 30, 'Tilemap created successfully!', {
          fontSize: '14px',
          color: '#00ff00',
          backgroundColor: '#000000',
          padding: { x: 5, y: 5 }
        });
        
      } else {
        console.error('Failed to create layer');
      }
    } else {
      console.error('Failed to create tileset from texture');
    }
  }
}