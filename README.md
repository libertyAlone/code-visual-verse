# CodeVisualVerse - 🌌 代码视觉宇宙

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

### 2. 🧪 视觉化度量衡 (Visual Metrics)
无需阅读代码，即可凭直觉进行代码审计：
*   **活跃度 (Activity)**：对接 Git 提交数据。星球的 **自发光强度 (Glow)** 和 **旋转速度** 代表了代码的活跃频率，光芒越盛，变动越频。
*   **复杂度 (Complexity)**：星球表面的 **畸变扭曲 (Distortion)** 和 **颜色偏移 (向红/暗偏移)** 代表了逻辑复杂度。扭曲越剧烈，代表该文件越难以维护。

### 3. 🚀 沉浸式导航感
*   **星际跳跃 (Stellar Jump)**：在查看代码详情时，点击任何 `import` 路径，视角将丝滑地飞向目标星球，实现跨星系的无缝切换。
*   **交互引力源 (Galaxy Hubs)**：点击蓝色的全息文件夹中心节点，可快速获取该目录的代码量分布与全系统计报告。
*   ** README 百科全书**：进入星系时，会自动播放该区域的 `README.md` 全息投影，作为空间“欢迎广播”。

### 4. 🎬 电影级演示模式
*   **自动巡航 (Tour Mode)**：开启“自动驾驶”模式，系统将带领你以电影视点自动遍历项目的重要节点，完美适配项目演示或动态壁纸需求。
*   **极致美学**：内置后期处理链（Bloom, Sparkles, Stars），提供极致的视觉冲击力。

---

## 🎮 交互指南

*   **滚轮缩放**：穿越星云，进入或离开微观代码世界。
*   **鼠标拖拽**：旋转视角，观察项目架构的宏观布局。
*   **左键点击**：选中星球或文件夹节点，唤起侧边栏的深度遥测面板（包含代码详情与 Git 溯源）。
*   **星际跳跃**：详情页点击高亮路径，触发实时飞行交互。

---

## 🛠 技术栈

*   **三维渲染**: React 19 + Three.js + React-Three-Fiber + Drei
*   **桌面封装**: Tauri v2 (Rust)
*   **数据采集**: Git CLI + AST 分析
*   **多语言**: i18next (支持中英双语)
*   **样式**: Tailwind CSS (Vanilla CSS 核心)

---

## 🚀 开发部署

```bash
# 安装依赖
pnpm install

# 启动开发环境
pnpm tauri dev
```

---

## 🔒 隐私声明

**CodeVisualVerse 完全在本地运行。**
所有代码扫描、Git 数据读取均在你的本地环境中完成。我们不上传任何代码到云端，保护你的项目隐私是我们的核心设计准则。

---

## 📄 许可证

[![License: PolyForm-Noncommercial](https://img.shields.io/badge/License-PolyForm--Noncommercial-blue.svg)](LICENSE)

本项目采用 [PolyForm Noncommercial License 1.0.0](LICENSE)。

- ✅ 允许个人学习、研究、非商业用途使用
- ✅ 允许修改和分发
- ❌ 禁止商业用途
- 📧 商业授权请联系项目维护者
