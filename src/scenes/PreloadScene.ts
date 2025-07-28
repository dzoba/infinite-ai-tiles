import Phaser from 'phaser';

export class PreloadScene extends Phaser.Scene {
  constructor() {
    super({ key: 'PreloadScene' });
  }

  preload() {
    // Check if custom tileset data is available
    const customTilesetData = (window as any).customTilesetData;
    
    if (customTilesetData) {
      // Use custom tileset data directly
      this.cache.json.add('tilesetData', customTilesetData);
    } else {
      // Load the default tileset data from JSON file
      // Use base URL that works for both local dev and GitHub Pages
      const baseUrl = import.meta.env.BASE_URL;
      this.load.json('tilesetData', `${baseUrl}tileset-water-sand-grass.json`);
    }
  }
  
  create() {
    const tilesetData = this.cache.json.get('tilesetData');
    
    if (tilesetData && tilesetData.base64) {
      console.log('PreloadScene: Tileset data loaded, starting WorldScene');
      this.scene.start('WorldScene', { tilesetData });
    } else {
      console.error('Failed to load tileset data:', tilesetData);
      // Start with empty data as fallback
      this.scene.start('WorldScene', { tilesetData: null });
    }
  }
}
