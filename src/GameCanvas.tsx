import { useEffect, useRef } from 'react';
import Phaser from 'phaser';
import PerlinPlugin from 'phaser3-rex-plugins/plugins/perlin-plugin.js';
import { PreloadScene } from './scenes/PreloadScene';
import { WorldScene } from './scenes/WorldScene';
import { TestScene } from './scenes/TestScene';

interface GameCanvasProps {
  width?: number;
  height?: number;
}

const GameCanvas: React.FC<GameCanvasProps> = ({ width = 800, height = 600 }) => {
  const gameRef = useRef<Phaser.Game | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Phaser game configuration
    const config: Phaser.Types.Core.GameConfig = {
      type: Phaser.AUTO,
      width,
      height,
      parent: containerRef.current,
      backgroundColor: '#2c3e50',
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

    // Cleanup function
    return () => {
      if (gameRef.current) {
        gameRef.current.destroy(true);
        gameRef.current = null;
      }
    };
  }, [width, height]);

  return (
    <div 
      ref={containerRef} 
      style={{ 
        width: `${width}px`, 
        height: `${height}px`,
        border: '2px solid #34495e',
        borderRadius: '8px'
      }} 
    />
  );
};

export default GameCanvas;