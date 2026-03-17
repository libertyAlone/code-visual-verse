# CodeVisualVerse - 🌌 Code Visual Universe

[中文版](./README_ZH.md)

**Requirement**: Transform codebases into an immersive, perceptible, and navigable 3D visual universe.

[![Tauri](https://img.shields.io/badge/Tauri-2.0+-blue.svg)](https://tauri.app/)
[![Three.js](https://img.shields.io/badge/Three.js-r150+-green.svg)](https://threejs.org/)
[![React](https://img.shields.io/badge/React-19+-cyan.svg)](https://reactjs.org/)

> **CodeVisualVerse** is a code exploration tool designed for developers. It transcends the traditional flat file tree, reconstructing complex project architectures into magnificent galaxy systems. Here, code is no longer cold text, but a living, perceptible visual asset.

---

## 🌟 Key Features

### 1. 🪐 Intuitive Astral Modeling
*   **Code Planets**: Each source file is a planet. Sphere size maps to the file's mass (Lines of Code).
*   **Star Systems**: The directory structure is visualized as hierarchically nested galaxies. Each directory level is a gravitational center gathering its celestial bodies.
*   **Orbital Linkages**: Dependency relationships are visualized via radiant energy beams connecting the planets.

### 2. 🧬 Holographic Code Projection
*   **Real-time HUD**: Clicking a planet summons a **3D Holographic Panel** floating above it, allowing you to preview source code directly within the spatial environment.
*   **Scanning Animation**: Features sci-fi laser scan lines and HUD telemetry data for ultimate cyber-immersion.
*   **Adaptive Scaling**: The holographic panel automatically adjusts its scale based on the camera distance, ensuring text remains legible from any range.

### 3. 🧪 Visual Metrics
Audit code intuitively without reading a single line:
*   **Activity**: Integrated with Git telemetry. A planet's **Glow intensity** and **Rotation speed** represent commit frequency. The brighter it shines, the more active the code.
*   **Complexity**: Surface **distortion and color shifts** represent logical complexity. The more chaotic the distortion, the harder the file is to maintain.

### 4. 🛰️ Immersive Navigation
*   **Stellar Jump**: While viewing code details, clicking any `import` path will smoothly warp the camera to the target planet, enabling seamless cross-galaxy transitions.
*   **Evolution Timeline**: Backtrack through Git history to witness the code universe evolve from a single star into a vast cluster.
*   **README Holo-Broadcasts**: Entering a system triggers an automatic holographic playback of its `README.md` as a spatial welcome broadcast.

---

## 🎮 Interface Guide

*   **Scroll Wheel**: Warp through nebulae to enter or leave the microscopic code world.
*   **Left Click**: Select planets or directory nodes to invoke holographic projections and deep telemetry panels.
*   **Keyboard Controls**: Use Arrow keys in "Evolution Mode" to traverse through commits instantly.
*   **Tour Mode**: Engage the "Cinematic Autopilot" to let the system guide you through the architecture's highlights automatically.

---

## 🛠 Tech Stack

*   **3D Rendering**: React 19 + Three.js + React-Three-Fiber + Drei
*   **Desktop Engine**: Tauri v2 (Rust)
*   **Data Aggregation**: Git CLI + AST Analysis
*   **Localization**: i18next (Full support for English & Chinese)
*   **Styling**: Tailwind CSS

---

## 🔒 Privacy First

**CodeVisualVerse runs entirely locally.**
All code scanning and Git data processing occur within your local environment. No code is ever uploaded to the cloud—protecting your project privacy is our core design principle.

---

## 📄 License

This project is licensed under the [PolyForm Noncommercial License 1.0.0](LICENSE).
📧 For commercial licensing, please contact the project maintainers.
