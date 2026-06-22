# REST API — SofaScore Player Dashboard

**Base URL:** `http://127.0.0.1:8000`

## Endpoints

### `GET /api/players`
Retorna lista de jogadores disponíveis (ordenada por nome).

**Response:**
```json
{
  "players": [
    { "id": "866469", "name": "Bruno Guimarães" },
    { "id": "124992", "name": "Danilo" }
  ]
}
```

**Data source:** Banco SQLite → `match_players JOIN players`, fallback `lineups.json`

---

### `GET /api/dashboard-data?player_id=866469`
Retorna dados completos do dashboard para um jogador.

**Response:**
```json
{
  "images": {
    "heatmap": "base64...",     // PNG do mapa de calor
    "shotmap": "base64...",     // PNG do mapa de chutes
    "passmap": "base64..."      // PNG do mapa de passes
  },
  "stats": {
    "rating": 8.1,
    "minutesPlayed": 45,
    "totalPass": 35,
    "accuratePass": 33,
    "goalAssist": 0,
    "totalCross": 2,
    "duelWon": 4,
    "duelLost": 2,
    "totalTackle": 1,
    "wonTackle": 1,
    "interceptions": 6,
    "wasFouled": 2,
    "goals": 1,
    "onTargetScoringAttempt": 1,
    "shotOffTarget": 0,
    "blockedScoringAttempt": 0,
    "clearances": 0,
    "fouls": 1
  },
  "events": {
    "passes": [          // Máx 50 eventos
      {
        "playerCoordinates": { "x": 36.3, "y": 51.1 },
        "passEndCoordinates": { "x": 33.0, "y": 56.9 },
        "outcome": true,
        "keypass": false,
        "isHome": true
      }
    ],
    "dribbles": [],      // Máx 20
    "defensive": [],      // Máx 20
    "ball_carries": []    // Máx 20
  }
}
```

**Cache strategy:**
1. SQLite (cache principal)
2. JSON files (fallback)
3. Playwright fetch (auto-download se não existir)

---

### `GET /api/matches`
Retorna partidas no banco de dados.

**Response:**
```json
{
  "matches": [
    {
      "match_id": 15691379,
      "home_team": "Brasil",
      "away_team": "Egito",
      "match_date": "2024",
      "competition": "Friendly"
    }
  ]
}
```

---

### `GET /api/players/db`
Retorna todos os jogadores do banco de dados (com posição).

**Response:**
```json
{
  "players": [
    {
      "player_id": 866469,
      "name": "Bruno Guimarães",
      "position": "M",
      "team": null,
      "image_url": null
    }
  ]
}
```

---

### `GET /dashboard/`
Serve o frontend SPA (arquivos estáticos do diretório `frontend/`).
