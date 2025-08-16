# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a personal portfolio website hosted on GitHub Pages (https://maujim.github.io). The site features:
- A minimalist design with an animated shimmer effect on dots
- Interactive hover states that reveal text content
- Personal projects showcase pages
- Static HTML/CSS/JavaScript architecture

## Development Commands

### Formatting
```bash
make format
# or directly:
pnpm dlx prettier --write css/* javascript/* index.html
```

### Local Development
This is a static site that can be served locally using any HTTP server:
```bash
# Python 3
python -m http.server 8000

# Node.js
npx serve .

# Live Server (VS Code extension)
# Right-click index.html and "Open with Live Server"
```

## Architecture

### Core Structure
- `index.html` - Main landing page with inline CSS and animated dot pattern
- `work.html` - Simple work/services page
- `css/global.css` - Container utilities and responsive breakpoints
- `javascript/` - Currently minimal JavaScript, plus animation utilities

### Key Features

#### Shimmer Animation System
- Controlled by CSS custom properties (`--shimmer-gap`, `--shimmer-start-delay`)
- Uses `javascript/generate-shimmer-keyframes.js` to calculate optimal keyframe timing
- 60-second animation loop with staggered dot animations
- Each dot's shimmer is delayed by `--shimmer-gap * index`

#### Responsive Design
- Mobile-first approach with portrait/landscape media queries
- Fluid typography using `clamp()` functions
- Container system with predefined breakpoints (576px, 768px, 1024px, 1280px, 1536px)

#### Color System
CSS custom properties define color schemes:
- `--niceblue*` variants for primary text/elements
- `--burntorange*` variants for accents
- `--nicegreen*` variants for alternative theming

### File Organization
- `/assets/` - PDFs, images, and project resources
- `/projects/` - Individual project showcase pages
- `/dist/` - Build output (if any)
- Static files served directly from root

## Development Notes

- No build system required - direct file editing
- Animation keyframes are generated programmatically but manually copied to CSS
- GitHub Pages deployment happens automatically on push to master branch
- Uses semantic HTML with inline styles for the main page to reduce HTTP requests