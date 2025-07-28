import { useEffect, useRef } from 'react';
import Phaser from 'phaser';
import PerlinPlugin from 'phaser3-rex-plugins/plugins/perlin-plugin.js';
import { PreloadScene } from './scenes/PreloadScene';
import { WorldScene } from './scenes/WorldScene';

const GameCanvas: React.FC = () => {
  const gameRef = useRef<Phaser.Game | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

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