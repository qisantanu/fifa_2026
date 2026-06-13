# 🏆 FIFA 2026 Quantum Stats

A futuristic, Excel-driven web application to track and visualize 2026 FIFA World Cup statistics, knockout progress, and player performances.

## 🚀 Features

- **Cyber/Futuristic UI:** Neon accents, glassmorphism, and interactive animations using Framer Motion.
- **Excel-Driven Data:** Real-time synchronization with a local Excel file (`public/data/world_cup_2026.xlsx`).
- **Dynamic Leaderboards:** Automated Golden Boot calculation with player-team association and flags.
- **Group Standings:** Live calculation of points, goal difference, and rankings.
- **Match Feed:** Interactive dashboard showing recent scores and goal scorers.

## 🛠️ Local Setup

Follow these steps to get the project running on your local machine:

### Prerequisites
- [Node.js](https://nodejs.org/) (v18 or higher recommended)
- [npm](https://www.npmjs.com/) (installed with Node.js)

### Installation
1.  **Clone the repository:**
    ```bash
    git clone <repository-url>
    cd fifa_2026
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Start the development server:**
    ```bash
    npm run dev
    ```
    The application will be available at `http://localhost:5173` (or the port displayed in your terminal).

### Data Management
- All tournament data is stored in `public/data/world_cup_2026.xlsx`.
- Open the file in Excel, update scores or scorers, and save. 
- Refresh the browser to see the live updates.

## 📦 Building for Production

To create an optimized production build:
```bash
npm run build
```
The output will be in the `dist/` directory.

## 📜 License

**Proprietary Software - All Rights Reserved.**

This software is for private use only. Unauthorized copying, distribution, modification, or use of this code, via any medium, is strictly prohibited. 

Copyright (c) 2026 Santanub.
