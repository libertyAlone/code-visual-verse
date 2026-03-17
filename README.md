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
*   **Integrated Blame & Diff**: Gutter indicators show Git authorship and allow instant diff viewing for any code segment.
*   **Adaptive Scaling**: The holographic panel automatically adjusts its scale based on the camera distance, ensuring text remains legible from any range.

### 3. 🧠 AI Insight Assistant
*   **Stellar Chat**: Chat with an LLM-powered assistant (OpenAI/Anthropic) that understands your code context.
*   **Architecture Analytics**: Ask questions about system flow, logic bottlenecks, or refactoring suggestions directly within the 3D space.

### 4. 🧪 Visual Metrics & Diagnostics
Audit code intuitively without reading a single line:
*   **Heatmap Mode**: Toggle a thermal gradient view that highlights high-complexity or high-frequency change areas (Hotspots).
*   **Activity Telemetry**: Integrated with Git. Glow intensity represents commit frequency.
*   **Structural Complexity**: Surface distortion and color shifts represent logic complexity (AST-based analysis).

### 5. 🛰️ Navigation & Control
*   **Cinematic Autopilot**: Engage "Tour Mode" for a guided, cinematic walk-through of the project's most significant nodes.
*   **Manual Pilot Mode**: Take full control of the camera with precise manual navigation.
*   **Stellar Jump**: Clicking `import` paths smoothly warps the camera to the target planet.

---

## 🎮 Interface Guide

*   **Scroll Wheel**: Warp through nebulae to enter or leave the microscopic code world.
*   **Left Click**: Select planets or directory nodes to invoke holographic projections.
*   **Right Click**: Re-center and focus on specific celestial bodies.
*   **Control Panel**: Access Settings (top-right) to toggle Heatmap, Performance Mode, and AI settings.

---

## 🛠 Tech Stack

*   **3D Rendering**: React 19 + Three.js + React-Three-Fiber + Drei
*   **Desktop Engine**: Tauri v2 (Rust)
*   **Intelligence**: OpenAI & Anthropic API Integration
*   **Data Aggregation**: Git CLI + AST Analysis
*   **Localization**: i18next (Full support for English & Chinese)
*   **Styling**: Vanilla CSS + Tailwind-inspired premium aesthetic

---

## 🔒 Privacy First

**CodeVisualVerse runs entirely locally.**
All code scanning and Git data processing occur within your local environment. No code is ever uploaded to the cloud—protecting your project privacy is our core design principle. AI interactions only transmit the specific snippets you choose to share.

---

## 📄 License

This project is licensed under the [PolyForm Noncommercial License 1.0.0](LICENSE).
📧 For commercial licensing, please contact the project maintainers.
