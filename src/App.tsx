import { useState, useCallback, useEffect, useRef } from 'react'
import GameCanvas from './GameCanvas'
import TerrainControls from './components/TerrainControls'
import type { TerrainConfig } from './utils/ChunkManager'
import './App.css'

function App() {
  // Parse URL parameters
  const getUrlParams = () => {
    const params = new URLSearchParams(window.location.search);
    const seed = params.get('seed');
    const x = params.get('x');
    const y = params.get('y');
    const density = params.get('density');
    const size = params.get('size');
    const variation = params.get('variation');
    const edge = params.get('edge');
    const zoom = params.get('zoom');
    
    return {
      seed: seed ? parseFloat(seed) : 707,
      x: x ? parseFloat(x) : 2390,
      y: y ? parseFloat(y) : -930,
      density: density ? parseFloat(density) : 12.1,
      size: size ? parseFloat(size) : 14,
      variation: variation ? parseFloat(variation) : 0.5,
      edge: edge ? parseFloat(edge) : 0.2,
      zoom: zoom ? parseFloat(zoom) : 2
    };
  };

  const urlParams = getUrlParams();
  
  const [terrainConfig, setTerrainConfig] = useState<TerrainConfig>({
    islandDensity: urlParams.density,
    islandSize: urlParams.size,
    islandSizeVariation: urlParams.variation,
    edgeNoise: urlParams.edge,
    seed: urlParams.seed
  });
  
  const [cameraPosition, setCameraPosition] = useState({ x: urlParams.x, y: urlParams.y });
  const [cameraZoom, setCameraZoom] = useState(urlParams.zoom);
  const [showControls, setShowControls] = useState(true);
  const [customTilesetData, setCustomTilesetData] = useState<any>(null);
  const [gameKey, setGameKey] = useState(0);
  const urlUpdateTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Update URL when terrain config changes (immediate)
  useEffect(() => {
    const params = new URLSearchParams();
    params.set('seed', terrainConfig.seed?.toFixed(0) || '0');
    params.set('x', cameraPosition.x.toFixed(0));
    params.set('y', cameraPosition.y.toFixed(0));
    params.set('density', terrainConfig.islandDensity?.toFixed(2) || '0.3');
    params.set('size', terrainConfig.islandSize?.toFixed(0) || '20');
    params.set('variation', terrainConfig.islandSizeVariation?.toFixed(2) || '0.5');
    params.set('edge', terrainConfig.edgeNoise?.toFixed(2) || '0.2');
    
    const newUrl = `${window.location.pathname}?${params.toString()}`;
    window.history.replaceState({}, '', newUrl);
  }, [terrainConfig]);

  // Update URL when camera moves or zooms (debounced)
  useEffect(() => {
    // Clear any existing timer
    if (urlUpdateTimerRef.current) {
      clearTimeout(urlUpdateTimerRef.current);
    }
    
    // Set a new timer to update URL after movement stops
    urlUpdateTimerRef.current = setTimeout(() => {
      const params = new URLSearchParams();
      params.set('seed', terrainConfig.seed?.toFixed(0) || '0');
      params.set('x', cameraPosition.x.toFixed(0));
      params.set('y', cameraPosition.y.toFixed(0));
      params.set('density', terrainConfig.islandDensity?.toFixed(2) || '0.3');
      params.set('size', terrainConfig.islandSize?.toFixed(0) || '20');
      params.set('variation', terrainConfig.islandSizeVariation?.toFixed(2) || '0.5');
      params.set('edge', terrainConfig.edgeNoise?.toFixed(2) || '0.2');
      params.set('zoom', cameraZoom.toFixed(2));
      
      const newUrl = `${window.location.pathname}?${params.toString()}`;
      window.history.replaceState({}, '', newUrl);
    }, 500); // Update URL 500ms after movement stops
    
    return () => {
      if (urlUpdateTimerRef.current) {
        clearTimeout(urlUpdateTimerRef.current);
      }
    };
  }, [cameraPosition, cameraZoom, terrainConfig]);

  // Add keyboard event listener for toggling controls
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === 'h' || e.key === 'H') {
        setShowControls(prev => !prev);
      }
    };

    window.addEventListener('keypress', handleKeyPress);
    return () => window.removeEventListener('keypress', handleKeyPress);
  }, []);

  const handleTerrainChange = useCallback((newConfig: TerrainConfig) => {
    setTerrainConfig(newConfig);
  }, []);
  
  const handleCameraMove = useCallback((x: number, y: number) => {
    setCameraPosition({ x, y });
  }, []);
  
  const handleCameraZoom = useCallback((zoom: number) => {
    setCameraZoom(zoom);
  }, []);

  const handleTilesetLoad = useCallback((tilesetData: any) => {
    setCustomTilesetData(tilesetData);
    // Force game reload with new tileset
    setGameKey(prev => prev + 1);
  }, []);

  return (
    <div style={{ 
      margin: 0,
      padding: 0,
      width: '100%',
      height: '100%',
      overflow: 'hidden',
      position: 'relative'
    }}>
      <GameCanvas 
        key={gameKey}
        terrainConfig={terrainConfig} 
        initialCameraPosition={cameraPosition}
        initialZoom={cameraZoom}
        onCameraMove={handleCameraMove}
        onCameraZoom={handleCameraZoom}
        customTilesetData={customTilesetData}
      />
      {showControls && <TerrainControls config={terrainConfig} onChange={handleTerrainChange} onTilesetLoad={handleTilesetLoad} />}
    </div>
  )
}

export default App
