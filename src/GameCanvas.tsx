import { useEffect, useRef } from 'react';
import Phaser from 'phaser';
import PerlinPlugin from 'phaser3-rex-plugins/plugins/perlin-plugin.js';
import { PreloadScene } from './scenes/PreloadScene';
import { WorldScene } from './scenes/WorldScene';
import type { TerrainConfig } from './utils/ChunkManager';

interface GameCanvasProps {
  terrainConfig?: TerrainConfig;
  initialCameraPosition?: { x: number; y: number };
  initialZoom?: number;
  onCameraMove?: (x: number, y: number) => void;
  onCameraZoom?: (zoom: number) => void;
  customTilesetData?: any;
}

const GameCanvas: React.FC<GameCanvasProps> = ({ terrainConfig, initialCameraPosition, initialZoom, onCameraMove, onCameraZoom, customTilesetData }) => {
  const gameRef = useRef<Phaser.Game | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Update terrain when config changes
  useEffect(() => {
    if (gameRef.current && terrainConfig) {
      const worldScene = gameRef.current.scene.getScene('WorldScene') as any;
      if (worldScene && worldScene.updateTerrainConfig) {
        worldScene.updateTerrainConfig(terrainConfig);
      }
    }
  }, [terrainConfig]);

  useEffect(() => {
    if (!containerRef.current) return;

    // Phaser game configuration
    const config: Phaser.Types.Core.GameConfig = {
      type: Phaser.AUTO,
      width: window.innerWidth,
      height: window.innerHeight,
      parent: containerRef.current,
      backgroundColor: '#2c3e50',
      scale: {
        mode: Phaser.Scale.RESIZE,
        autoCenter: Phaser.Scale.CENTER_BOTH
      },
      plugins: {
        global: [
          { key: 'rexPerlin', plugin: PerlinPlugin, start: true }
        ]
      },
      scene: [
        PreloadScene,
        WorldScene
      ],
      physics: {
        default: 'arcade',
        arcade: {
          gravity: { x: 0, y: 0 },
          debug: false
        }
      }
    };

    // Create the game instance
    gameRef.current = new Phaser.Game(config);

    // Make game globally accessible for debugging
    (window as any).game = gameRef.current;
    
    // Store terrain config and camera info globally for the scene to access
    (window as any).terrainConfig = terrainConfig;
    (window as any).initialCameraPosition = initialCameraPosition;
    (window as any).initialZoom = initialZoom;
    (window as any).onCameraMove = onCameraMove;
    (window as any).onCameraZoom = onCameraZoom;
    (window as any).customTilesetData = customTilesetData;

    // Cleanup function
    return () => {
      if (gameRef.current) {
        gameRef.current.destroy(true);
        gameRef.current = null;
      }
    };
  }, []);

  return (
    <div 
      ref={containerRef} 
      style={{ 
        width: '100%',
        height: '100%',
        margin: 0,
        padding: 0,
        overflow: 'hidden'
      }} 
    />
  );
};

export default GameCanvas;