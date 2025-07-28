import React from 'react';
import type { TerrainConfig } from '../utils/ChunkManager';

interface TerrainControlsProps {
  config: TerrainConfig;
  onChange: (config: TerrainConfig) => void;
}

const TerrainControls: React.FC<TerrainControlsProps> = ({ config, onChange }) => {
  const handleChange = (key: keyof TerrainConfig, value: number) => {
    onChange({ ...config, [key]: value });
  };

  return (
    <div style={{
      position: 'absolute',
      top: '10px',
      right: '10px',
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      color: 'white',
      padding: '20px',
      borderRadius: '8px',
      minWidth: '300px',
      fontSize: '14px',
      fontFamily: 'monospace',
      zIndex: 1000
    }}>
      <h3 style={{ margin: '0 0 15px 0' }}>Terrain Controls</h3>
      
      <div style={{ marginBottom: '15px' }}>
        <label>
          Island Density: {config.islandDensity?.toFixed(2)}
          <br />
          <small>Chance of island per area</small>
          <br />
          <input
            type="range"
            min="0.1"
            max="20.0"
            step="0.1"
            value={config.islandDensity || 12.1}
            onChange={(e) => handleChange('islandDensity', parseFloat(e.target.value))}
            style={{ width: '100%' }}
          />
        </label>
      </div>

      <div style={{ marginBottom: '15px' }}>
        <label>
          Island Size: {config.islandSize?.toFixed(0)} tiles
          <br />
          <small>Average radius of islands</small>
          <br />
          <input
            type="range"
            min="10"
            max="50"
            step="2"
            value={config.islandSize || 14}
            onChange={(e) => handleChange('islandSize', parseFloat(e.target.value))}
            style={{ width: '100%' }}
          />
        </label>
      </div>

      <div style={{ marginBottom: '15px' }}>
        <label>
          Size Variation: {((config.islandSizeVariation || 0.5) * 100).toFixed(0)}%
          <br />
          <small>How much island sizes vary</small>
          <br />
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={config.islandSizeVariation || 0.5}
            onChange={(e) => handleChange('islandSizeVariation', parseFloat(e.target.value))}
            style={{ width: '100%' }}
          />
        </label>
      </div>

      <div style={{ marginBottom: '15px' }}>
        <label>
          Edge Roughness: {((config.edgeNoise || 0.2) * 100).toFixed(0)}%
          <br />
          <small>Coastline irregularity</small>
          <br />
          <input
            type="range"
            min="0"
            max="0.5"
            step="0.05"
            value={config.edgeNoise || 0.2}
            onChange={(e) => handleChange('edgeNoise', parseFloat(e.target.value))}
            style={{ width: '100%' }}
          />
        </label>
      </div>

      <div style={{ marginBottom: '15px' }}>
        <label>
          Random Seed:
          <br />
          <input
            type="number"
            value={config.seed?.toFixed(0) || '0'}
            onChange={(e) => {
              const value = parseFloat(e.target.value);
              if (!isNaN(value)) {
                handleChange('seed', value);
              }
            }}
            style={{
              width: '70%',
              padding: '5px',
              marginRight: '5px',
              backgroundColor: '#333',
              color: 'white',
              border: '1px solid #555',
              borderRadius: '4px'
            }}
          />
          <button 
            onClick={() => handleChange('seed', Math.floor(Math.random() * 10000))}
            style={{
              padding: '5px 10px',
              backgroundColor: '#4CAF50',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
            title="Generate new random seed"
          >
            🎲
          </button>
        </label>
      </div>

      <div style={{ 
        marginTop: '20px', 
        paddingTop: '15px', 
        borderTop: '1px solid #555',
        fontSize: '12px',
        color: '#aaa'
      }}>
        <strong>Note:</strong> Changing values will regenerate terrain.
        <br />
        You may need to move around to see changes.
      </div>
    </div>
  );
};

export default TerrainControls;