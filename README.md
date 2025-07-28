# Infinite AI Tiles

An infinite scrolling tile-based world generator with procedurally generated islands using Voronoi-based blob generation and corner-based Wang tiling for smooth terrain transitions. Tile art created with [PixelLab](https://www.pixellab.ai/).

🎮 **[Play it here!](https://dzoba.github.io/infinite-ai-tiles/)**

## Features

- **Infinite World**: Explore an endless procedurally generated world
- **Voronoi Islands**: Natural-looking blob-shaped islands (no Perlin noise!)
- **Wang Tiling**: Smooth transitions between water, sand, and grass using corner-based tiling
- **Real-time Controls**: Adjust terrain generation parameters on the fly
- **URL Sharing**: Share specific world views with others via URL parameters
- **Responsive Design**: Fullscreen canvas that adapts to any screen size
- **Zoom Support**: Scroll to zoom in/out

## Controls

- **Arrow Keys** or **WASD**: Move around the world
- **Scroll**: Zoom in/out
- **H**: Hide/show terrain controls
- **Terrain Controls**: Adjust island density, size, variation, edge roughness, and seed

## Technical Details

Built with:
- React 19.1.0
- TypeScript
- Vite 5.x
- Phaser.js 3.90.0
- Custom tileset with corner-based Wang tiling

The terrain generation uses:
- Voronoi seed placement for natural island distribution
- Dynamic chunk loading/unloading based on camera position
- Corner-based tile selection for smooth coastlines
- Post-processing to remove thin landmasses

## Development

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Build for GitHub Pages
npm run build:gh-pages
```

## URL Parameters

The following parameters can be used to share specific world configurations:
- `seed`: Random seed for world generation
- `x`, `y`: Camera position
- `zoom`: Zoom level
- `density`: Island density (0.1-20)
- `size`: Island size (10-50)
- `variation`: Size variation (0-1)
- `edge`: Edge roughness (0-0.5)

Example: `https://dzoba.github.io/infinite-ai-tiles/?seed=707&x=2390&y=-930&density=12.10&size=14&variation=0.50&edge=0.20`