<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://ai.google.dev/static/site-assets/images/share-ais-513315318.png" />
</div>

# Tournament Mega Auction

A comprehensive, interactive web application for hosting live sports tournament mega auctions. Built with modern web technologies, it provides a sleek, dark-themed interface for managing teams, importing player data, retaining players, and executing a real-time live auction experience.

## Features

- **Setup Wizard:** Configure tournament rules, purse limits, and squad sizes easily.
- **Team Management:** Define teams, assign colors, and manage starting purses.
- **Data Import:** Seamlessly import player databases using CSV files.
- **Retention Phase:** Allow teams to retain core players before the auction begins.
- **Live Auction Stage:**
  - Dynamic player showcasing with player stats, tiers (S, A, B, C, D), and positions (GK, DEF, MID, ATT).
  - Real-time bidding system with auto-calculating next bids.
  - Auction timer with visual countdown.
  - Filterable player queue and categorized player pots.
  - Live team purse standings and squad progress tracking.
- **Revive Unsold Players:** Option to bring back unsold players for another bidding round.
- **Results & Export:** View final auction results and export them as PDF documents.

## Tech Stack

- **Framework:** React 19 + TypeScript
- **Build Tool:** Vite
- **Styling:** Tailwind CSS v4
- **State Management:** Zustand
- **Animations:** Framer Motion
- **Icons:** Lucide React
- **Data Handling:** Papaparse (CSV), jsPDF (PDF export)

## Run Locally

**Prerequisites:** [Node.js](https://nodejs.org/) installed on your machine.

1. **Clone the repository and install dependencies:**
   ```bash
   npm install
   ```

2. **Configure Environment Variables:**
   Create a `.env.local` file in the root directory (you can copy `.env.example` if it exists) and add any required API keys (e.g., Gemini API key if you're using AI generation features).
   ```env
   GEMINI_API_KEY=your_gemini_api_key_here
   ```

3. **Run the development server:**
   ```bash
   npm run dev
   ```

4. **Build for production:**
   ```bash
   npm run build
   ```

## Original App Link
View the original app scaffolded via AI Studio: [https://ai.studio/apps/f562f664-7b61-44fb-87b5-aad72581d8ef](https://ai.studio/apps/f562f664-7b61-44fb-87b5-aad72581d8ef)
