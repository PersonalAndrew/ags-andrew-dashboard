# Frontend Architecture

## Stack
- **Vanilla JavaScript** (ES Modules) — sem bundler/framework
- **Chart.js** (CDN) — gráfico radar
- **CSS Modular** — base + components + animations
- **Google Fonts** — Outfit (300/400/600/800)

## Directory Structure

```
frontend/
├── index.html                          # Entry point (ES module)
├── assets/
│   ├── css/
│   │   ├── base.css                    # Design tokens, reset, tipografia, layout
│   │   ├── components.css              # Glass panels, stat cards, selectors
│   │   └── animations.css              # Keyframes e transições
│   ├── js/
│   │   ├── app.js                      # Bootstrap (DOMContentLoaded → Dashboard)
│   │   ├── services/
│   │   │   └── api.js                  # ApiClient — camada de fetch
│   │   └── components/
│   │       ├── Dashboard.js            # Orquestrador principal
│   │       ├── PlayerSelector.js       # Dropdown de jogadores
│   │       └── StatsRadar.js           # Gráfico radar (Chart.js)
│   └── images/
│       └── favicon.svg
└── design-system/
    └── MASTER.md                       # Design tokens, cores, tipografia
```

## Component Tree

```
app.js
 └── Dashboard
      ├── PlayerSelector     → <select> populado via /api/players
      ├── StatsRadar         → <canvas> Chart.js radar
      ├── heatmap-img        → <img> base64 PNG
      ├── shotmap-img        → <img> base64 PNG
      ├── passmap-img        → <img> base64 PNG
      ├── stats-grid         → Stat cards (10 métricas)
      └── player-info        → Rating + minutos
```

## Data Flow

```
User selects player
    → PlayerSelector.onChange(playerId)
    → Dashboard.loadPlayer(playerId)
    → api.getDashboardData(playerId)       [GET /api/dashboard-data]
    → Render:
        • Imagens (heatmap, shotmap, passmap)
        • StatsRadar (radar chart)
        • StatsGrid (10 stat cards)
        • PlayerInfo (rating, minutos)
```

## API Endpoints Consumed

| Endpoint | Método | Retorno |
|----------|--------|---------|
| `/api/players` | GET | `{ players: [{id, name}] }` |
| `/api/dashboard-data?player_id=X` | GET | `{ images, stats, events }` |

## OOP Principles (SOLID)

Cada componente é uma classe com responsabilidade única:

| Classe | Responsabilidade |
|--------|------------------|
| `ApiClient` | Centralizar chamadas HTTP (single point of change) |
| `PlayerSelector` | Gerenciar dropdown + eventos de change |
| `StatsRadar` | Renderizar/destruir gráfico Chart.js |
| `Dashboard` | Orquestrar carregamento e renderização |

## CSS Architecture

| Arquivo | Conteúdo |
|---------|----------|
| `base.css` | `:root` tokens, reset, body, `.dashboard`, `header` |
| `components.css` | `.glass-panel`, `.stat-card`, `.player-selector`, `.player-info` |
| `animations.css` | `@keyframes fadeInDown`, `fadeInUp` |

## Playwright Validation

- Config: `playwright.config.ts` + `.env.playwright`
- Screenshots: `artifacts/playwright/`
- Routes: configurável via `_PLAYWRIGHT_ROUTES`
