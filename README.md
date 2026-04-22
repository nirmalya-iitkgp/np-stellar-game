# 🌌 STELLAR: The Nucleosynthesis Engine

[![React](https://img.shields.io/badge/React-18-blue.svg)](https://reactjs.org/)
[![Vite](https://img.shields.io/badge/Vite-Latest-646CFF.svg)](https://vitejs.dev/)
[![Tailwind](https://img.shields.io/badge/Tailwind-Play-38B2AC.svg)](https://tailwindcss.com/)
[![License](https://img.shields.io/badge/License-Apache--2.0-orange.svg)](LICENSE)

> *"The nitrogen in our DNA, the calcium in our teeth, the iron in our blood, the carbon in our apple pies were made in the interiors of collapsing stars. We are made of starstuff."* — **Carl Sagan**

**STELLAR** is an immersive, web-based astrophysical simulation that transforms the complex physics of nucleosynthesis into a poetic, rhythmic experience. Players navigate the life cycle of a star, capturing subatomic particles while managing gravitational stability and relativistic time-dilation.

---

## 🛠️ Technical Architecture

This project is built as a high-performance **Single Page Application (SPA)** with a custom hardware-accelerated rendering pipeline.

### 🎨 The Rendering Engine
- **Canvas 2D API**: Optimized for 60FPS particle simulation using a spatial-partitioning-lite approach for collision detection.
- **Motion (framer-motion)**: Orchestrates the high-level UI transitions, modal interactions, and HUD state-changes.
- **Glassmorphism HUD**: Developed using Tailwind CSS's `backdrop-blur` and `bg-white/5` modifiers for a non-destructive UI overlay.

### ⚛️ State Management
- **React Functional Hooks**: Uses `useRef` for timing-critical engine loops (bypassing the virtual DOM cycle for the simulation) and `useState` for UI synchronization.
- **Custom Audio Engine**: A frequency-modulated oscillator system that generates procedural tones based on atomic mass and fusion events.

---

## 🛰️ Game Mechanics (Developer POV)

The core gameplay loop is an exercise in **Vector Mathematics** and **PID-style smoothing**:

1.  **Nucleus Kinematics**: The player position is calculated using a lagged-follow algorithm on the mouse/touch coordinates, simulating inertia.
2.  **Spectral Shift (Doppler Effect)**:
    -   Moving to horizontal screen edges calculates a `spectralShift` value.
    -   This value acts as a multiplier for the global `dt` (delta-time), effectively slowing down or accelerating the universe.
3.  **Collision Logic**:
    -   **Alpha Particles**: Standard collection targets.
    -   **Isotopes**: Heavy mass contributors that scale core inertia.
    -   **Helium Flux**: Negative feedback loop that consumes `stability` percentage.

---

## 🔬 Scientific Foundations

For the nerds (and the curious), the game logic adheres to several real-world astrophysical principles:

-   **The Alpha Ladder**: Follows the sequential capture of Helium-4, evolving the star from Hydrogen through Carbon, Oxygen, and Silicon up to Iron.
-   **Chandrasekhar Limit**: The mass threshold is set at **1.4 M☉**. Crossing this forces a `supernova` outcome; staying below it leads to a `white_dwarf`.
-   **The Iron Peak**: The game's primary sequence ends at Iron (Fe-26) because fusion beyond iron is endothermic—it consumes energy, triggering the cataclysmic collapse simulated in the endgame.
-   **Neutron Degeneracy**: The "Neutron Star" mode represents the high-frequency remnants of a core collapse, where gravity is so intense that electrons and protons fuse into neutrons.

---

## 🚀 Getting Started

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build
```

---

*Curated with precision in Google AI Studio.*
