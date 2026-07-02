<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://ai.google.dev/static/site-assets/images/share-ais-513315318.png" />
</div>

# Tournament Mega Auction

A comprehensive, interactive web application for hosting live sports tournament mega auctions. Built with modern web technologies, it provides a sleek, dark-themed interface for managing teams, importing player data, retaining players, and executing a real-time live auction experience.

## Features

- **Multi-Season Support:** Mega Auction (full reset) and Mini Auction (with retentions)
- **Setup Wizard:** Configure tournament rules, purse limits, and squad sizes easily.
- **Team Management:** Define teams, assign colors, and manage starting purses.
- **Data Import:** Seamlessly import player databases using CSV files.
- **Retention Phase:** Allow teams to retain up to 7 players from the previous season (Mini Auction only).
- **Live Auction Stage:**
  - Dynamic player showcasing with player stats, tiers (S, A, B, C, D), and positions (GK, DEF, MID, ATT).
  - Real-time bidding system with auto-calculating next bids.
  - Auction timer with visual countdown.
  - Filterable player queue and categorized player pots.
  - Live team purse standings and squad progress tracking.
- **Revive Unsold Players:** Option to bring back unsold players for another bidding round.
- **Results & Export:** View final auction results and export them as PDF documents.
- **Public API:** Access squad data, player info, and auction history via REST API endpoints.

## Tech Stack

- **Framework:** React 19 + TypeScript
- **Build Tool:** Vite
- **Styling:** Tailwind CSS v4
- **State Management:** Zustand
- **Backend:** Supabase (PostgreSQL + RPC functions)
- **Hosting:** Vercel (frontend + serverless API)
- **Animations:** Framer Motion
- **Icons:** Lucide React
- **Data Handling:** Papaparse (CSV), jsPDF (PDF export)

---

## Public API

After deployment, the following API endpoints are available. All endpoints require an API key passed via the `x-api-key` header.

**Base URL:** `https://your-app.vercel.app`

### Authentication

All requests must include your API key:

```
x-api-key: YOUR_API_KEY
```

Or as a query parameter:

```
?api_key=YOUR_API_KEY
```

> Contact the tournament organizer to get your API key.

---

### `GET /api/squads`

Returns all teams with their purchased players, prices, and full player info.

**Query Parameters:**

| Param | Type | Description |
|-------|------|-------------|
| `season_id` | UUID (optional) | Filter by season. Defaults to latest active/completed season |
| `team_id` | UUID (optional) | Get squad for a specific team only |

**Example Request:**

```bash
curl -H "x-api-key: YOUR_API_KEY" https://your-app.vercel.app/api/squads
```

**Example Response:**

```json
{
  "season": {
    "id": "abc-123",
    "name": "Season 3",
    "season_number": 3,
    "auction_type": "mega",
    "status": "live"
  },
  "teams": [
    {
      "team": {
        "id": "team-uuid",
        "name": "Kamarhati Knights",
        "short_name": "KMK",
        "logo": "...",
        "primary_color": "#3b82f6",
        "secondary_color": "#1e40af"
      },
      "purse": {
        "starting_purse": 200,
        "current_purse": 154,
        "total_spent": 46
      },
      "players": [
        {
          "player_id": "player-uuid",
          "name": "E. Haaland",
          "position": "ATT",
          "tier": "A",
          "rating": 88,
          "nationality": "Norway",
          "image_url": "https://...",
          "purchase_price": 15,
          "status": "sold",
          "acquired_at": "2025-06-20T12:30:00Z"
        }
      ],
      "player_count": 8
    }
  ],
  "total_players_bought": 42
}
```

---

### `GET /api/players`

Returns all players in the master player database.

**Query Parameters:**

| Param | Type | Description |
|-------|------|-------------|
| `position` | `GK` \| `DEF` \| `MID` \| `ATT` (optional) | Filter by position |
| `tier` | `S` \| `A` \| `B` \| `C` \| `D` (optional) | Filter by tier |

**Example:**

```bash
curl -H "x-api-key: YOUR_API_KEY" https://your-app.vercel.app/api/players?position=ATT
```

---

### `GET /api/seasons`

Returns all seasons with summary statistics.

**Example:**

```bash
curl -H "x-api-key: YOUR_API_KEY" https://your-app.vercel.app/api/seasons
```

**Response:**

```json
{
  "seasons": [
    {
      "season_id": "...",
      "name": "Season 3",
      "season_number": 3,
      "auction_type": "mega",
      "base_purse": 200,
      "status": "completed",
      "teams_count": 7,
      "total_players_acquired": 84,
      "total_money_spent": 1120
    }
  ]
}
```

---

### `GET /api/history`

Returns historical squad data (immutable snapshots from completed seasons).

**Query Parameters:**

| Param | Type | Description |
|-------|------|-------------|
| `season_id` | UUID | Get all squads from a specific season |
| `team_id` | UUID (optional) | Filter by team within a season |
| `player_id` | UUID (optional) | Get a player's career history across all seasons |

**Examples:**

```bash
# All squads from Season 2
curl -H "x-api-key: YOUR_API_KEY" "https://your-app.vercel.app/api/history?season_id=SEASON_UUID"

# Player career history
curl -H "x-api-key: YOUR_API_KEY" "https://your-app.vercel.app/api/history?player_id=PLAYER_UUID"
```

---

## Run Locally

**Prerequisites:** [Node.js](https://nodejs.org/) installed on your machine.

1. **Clone the repository and install dependencies:**
   ```bash
   npm install
   ```

2. **Configure Environment Variables:**
   Create a `.env` file in the root directory:
   ```env
   VITE_SUPABASE_URL=your_supabase_project_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   API_SECRET_KEY=your_api_secret_key
   ```

3. **Run the development server:**
   ```bash
   npm run dev
   ```

4. **Build for production:**
   ```bash
   npm run build
   ```

## Deployment (Vercel)

1. Connect your GitHub repo to Vercel.
2. Set the following **Environment Variables** in Vercel dashboard:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `API_SECRET_KEY`
3. Deploy. The API routes in `/api` are automatically deployed as serverless functions.
