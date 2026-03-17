# CodeVisualVerse - 🌌 代码视觉宇宙

[English Version](./README.md)

需求：将代码库转化为可沉浸、可感知、可漫游的 3D 视觉宇宙。

[![Tauri](https://img.shields.io/badge/Tauri-2.0+-blue.svg)](https://tauri.app/)
[![Three.js](https://img.shields.io/badge/Three.js-r150+-green.svg)](https://threejs.org/)
[![React](https://img.shields.io/badge/React-19+-cyan.svg)](https://reactjs.org/)

> **CodeVisualVerse** 是一款专为开发者打造的代码可视化探索工具。它超越了传统的平面文件树，将复杂的项目架构重构为壮丽的星系系统。在这里，代码不再是冰冷的文本，而是拥有生命力、可感知的视觉资产。

---

## 🌟 核心亮点

### 1. 🪐 直觉式天体建模
*   **代码星球 (Planets)**：每个源文件都是一颗星球。球体大小映射文件体积（Lines of Code）。
*   **星系系统 (Star Systems)**：目录结构被可视化为分层嵌套的星系，每一级目录都是一个引力中心，汇聚属于它的天体。
*   **星际轨道 (Import Links)**：文件间的依赖关系通过流光溢彩的能量束（Energy Beams）进行可视化连接。

### 2. 🧬 全息代码投影 (Holographic Projection)
*   **实时全息面板**：点击选中星球，即可在星球上方唤起**动态全息投影**，直接在 3D 空间内预览源代码。
*   **扫描线动画**：面板带有科幻感十足的激光扫描线与 HUD 信息提示，提供极致的赛博沉浸感。
*   **自适应缩放**：全息面板会随视角远近自动调整大小，确保在任何距离下代码文本都清晰可见。

### 3. 🧪 视觉化度量衡 (Visual Metrics)
无需阅读代码，即可凭直觉进行代码审计：
*   **活跃度 (Activity)**：对接 Git 提交数据。星球的 **自发光强度 (Glow)** 和 **旋转速度** 代表了代码的活跃频率，光亮越盛，变动越频。
*   **复杂度 (Complexity)**：星球表面的 **分维纹理与变形** 代表了逻辑复杂度。扭曲越剧烈，代表该文件越难以维护。

### 4. 🚀 沉浸式导航感
*   **星际跳跃 (Stellar Jump)**：在查看代码详情时，点击任何 `import` 路径，视角将丝滑地飞向目标星球，实现跨星系的无缝切换。
*   **演化模式 (Evolution Mode)**：通过时间轴可以回溯 Git 历史，亲眼见证代码宇宙从最初的一颗恒星逐渐演华为庞大星团的壮丽过程。
*   ** README 百科全书**：进入星系时，会自动播放该区域的 `README.md` 全息投影，作为空间“欢迎广播”。

---

## 🎮 交互指南

*   **滚轮缩放**：穿越星云，进入或离开微观代码世界。
*   **左键点击**：选中星球或文件夹节点，唤起全息投影与深度遥测面板。
*   **键盘指令**：在“演化模式”下，使用键盘左右方向键可快速在时间线（Commit）间穿梭。
*   **自动巡航 (Tour Mode)**：开启“自动驾驶”，系统将以电影视角自动带您领略项目架构之美。

---

## 🛠 技术栈

*   **三维渲染**: React 19 + Three.js + React-Three-Fiber + Drei
*   **桌面封装**: Tauri v2 (Rust)
*   **数据采集**: Git CLI + AST 分析
*   **多语言**: i18next (全面支持中英双语切换)
*   **样式**: Tailwind CSS

---

## 🔒 隐私声明

**CodeVisualVerse 完全在本地运行。**
所有代码扫描、Git 数据读取均在您的本地环境中完成。我们不上传任何代码到云端，保护您的项目隐私是我们的核心设计准则。

---

## 📄 许可证

本项目采用 [PolyForm Noncommercial License 1.0.0](LICENSE)。
📧 商业授权请联系项目维护者。
