# AI World

A browser-based simulation where neural-network-driven cars learn to navigate roads on a canvas. Built with vanilla JavaScript and the Canvas 2D API — no frameworks, no build step.

## Modes

The project has three pages:

- **Real Map** (`index.html`) — Loads a user-designed world from the World Editor and runs an AI car with a feed-forward neural network. Save and restore the best brain via `localStorage`.
- **AI** (`ai.html`) — Classic multi-car lane simulation on a generated vertical road with dummy traffic. ~1000 AI cars compete; the one that travels the farthest wins.
- **World Editor** (`world-editor.html`) — 2D editor for building road graphs with crossings, yields, stops, traffic lights, parking, spawn points, and targets. Supports importing real road data from OpenStreetMap (Overpass JSON).

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (for the dev server)

### Installation

```bash
npm install
```

### Running

```bash
npm start
```

This starts a local server on **port 3000** and opens the World Editor in your browser.

You can also navigate manually:

| Page         | URL                                       |
| ------------ | ----------------------------------------- |
| Real Map     | `http://localhost:3000/index.html`        |
| AI           | `http://localhost:3000/ai.html`           |
| World Editor | `http://localhost:3000/world-editor.html` |

## How It Works

### World Editor

Design a road network by placing points and segments on the canvas. The editor procedurally generates road envelopes, buildings, and trees from the underlying graph. Add markings (stop signs, traffic lights, spawn points, etc.) to control AI behavior. Save/load worlds as `.world` files or sync to `localStorage` for use in Real Map.

You can also import real-world road data by pasting [Overpass API](https://overpass-turbo.eu/) JSON output into the OSM import panel.

### Neural Network

Each AI car is equipped with ray sensors and a simple feed-forward neural network with binary threshold (Heaviside) activation. The network topology is `[sensorRayCount, 6, 4]` — sensor inputs, one hidden layer, and four outputs (forward, left, right, reverse).

The best-performing car's brain can be saved to `localStorage`. On the next run, all cars start with that brain and are mutated slightly, allowing incremental improvement over generations.

### Canvas Rendering

All rendering uses the HTML5 Canvas 2D API with a pannable/zoomable viewport.

## Tech Stack

- **JavaScript** (ES modules, no transpilation)
- **HTML5 Canvas 2D** for rendering
- **http-server** as dev server
