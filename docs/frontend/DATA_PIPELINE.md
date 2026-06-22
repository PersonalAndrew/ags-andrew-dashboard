# Data Pipeline — SofaScore Player Dashboard

## Fluxo de Dados

```
SofaScore API
    │
    ▼
┌─────────────────────────────────┐
│  fetch_playwright.py            │
│  (Playwright → bypass Cloudflare│
│   + scrape JSON endpoints)      │
└────────────┬────────────────────┘
             │
    ┌────────▼────────┐
    │  JSON Files     │
    │ data/           │
    │ ├─ sofascore/           │
    │ ├─ sofascore_player_X/  │
    │ └─ raw/match_X/         │
    └────────┬────────┘
             │
    ┌────────▼────────┐
    │  persist.py     │
    │  (ingest JSON→  │
    │   SQLite)       │
    └────────┬────────┘
             │
    ┌────────▼────────┐
    │  SQLite DB      │
    │ data/sofascore.db│
    └────────┬────────┘
             │
    ┌────────▼──────────────────┐
    │  backend/main.py          │
    │  (FastAPI)                │
    │  Cache: DB → JSON fallback│
    └────────┬──────────────────┘
             │
    ┌────────▼────────┐
    │  plot_utils.py  │
    │  (mplsoccer →   │
    │   base64 PNG)   │
    └────────┬────────┘
             │
    ┌────────▼──────────────────────┐
    │  api.js → Dashboard.js        │
    │  (ES Modules, Chart.js radar) │
    └───────────────────────────────┘
             │
             ▼
        Browser Render
```

## Fetch Scripts

### `fetch_playwright.py`
- **Match ID:** 16130149
- **Trigger:** Automático quando backend não encontra dados do jogador
- **Endpoints:**

| Endpoint | Arquivo |
|----------|---------|
| `/player/{id}/heatmap` | `heatmap.json` |
| `/shotmap/player/{id}` | `shotmap.json` |
| `/player/{id}/rating-breakdown` | `rating_breakdown.json` |
| `/incidents` | `incidents.json` |
| `/player/{id}/statistics` | `statistics.json` |

### `sofascore_extractor.py` (src/)
- **Match ID:** 15691379
- **Uso:** Extração completa de partida (todos os jogadores)
- **Endpoints por jogador:** `statistics`, `shotmap`, `rating`

## Cache Strategy

```
Backend recebe request → /api/dashboard-data?player_id=X
    │
    ├─❶ SQLite: SELECT * FROM player_statistics WHERE ... 
    │   └─ Se existe: retorna dados do banco (rápido)
    │
    ├─❷ JSON files: data/sofascore_player_X/ 
    │   └─ Se existe: retorna dados do JSON (médio)
    │
    └─❸ Playwright: executa fetch_playwright.py
        └─ Se não existe: baixa dados da API (lento)
```

## ETL (Extract → Transform → Load)

```bash
# 1. Extrair dados de uma partida (todos os jogadores)
uv run python src/sofascore_extractor.py

# 2. Ingerir JSON → SQLite
uv run python -m backend.db.persist

# 3. Servir (já usa DB automaticamente)
uv run uvicorn backend.main:app --port 8000
```
