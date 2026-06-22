# Aula CBF — SofaScore Player Dashboard

Dashboard de análise de performance de jogadores de futebol, consumindo dados da API do SofaScore.

## Arquitetura

```
┌──────────────────────────────────────────────────────────┐
│                     Frontend                              │
│  Vanilla JS (ES Modules) + Chart.js + CSS Glassmorphism  │
│  └─ assets/js/{Dashboard, PlayerSelector, StatsRadar}    │
│  └─ assets/css/{base, components, animations}             │
└──────────────────────┬───────────────────────────────────┘
                       │ HTTP REST
┌──────────────────────▼───────────────────────────────────┐
│                     Backend                               │
│  FastAPI + mplsoccer (plot)                               │
│  └─ main.py (API REST)                                   │
│  └─ plot_utils.py (heatmap, shotmap, passmap)             │
│  └─ db/database.py (SQLite cache)                        │
└──────────────────────┬───────────────────────────────────┘
                       │
┌──────────────────────▼───────────────────────────────────┐
│                   Data Layer                              │
│  SQLite (data/sofascore.db) + JSON (data/)               │
│  └─ persist.py (ETL: JSON → SQLite)                     │
│  └─ sql/sofascore_schema.sql (DDL)                      │
└──────────────────────┬───────────────────────────────────┘
                       │ Playwright
┌──────────────────────▼───────────────────────────────────┐
│                  Fetch Layer                              │
│  fetch_playwright.py (bypass Cloudflare → SofaScore API) │
│  src/sofascore_extractor.py (extração completa)           │
└──────────────────────────────────────────────────────────┘
```

## Estrutura do Projeto

```
/
├── backend/                     # API + plotagem
│   ├── main.py                  # FastAPI (6 endpoints)
│   ├── plot_utils.py            # mplsoccer: heatmap, shotmap, passmap
│   └── db/
│       ├── database.py          # DatabaseService (SQLite)
│       └── persist.py           # Ingestão JSON → SQLite
│
├── frontend/                    # SPA Vanilla JS
│   ├── index.html               # Entry point
│   ├── assets/
│   │   ├── css/ (3 files)
│   │   └── js/ (5 modules)
│   └── design-system/MASTER.md
│
├── data/                        # Dados (JSON + SQLite)
│   ├── sofascore.db             # SQLite warehouse
│   ├── raw/match_15691379/      # Dados da partida Brasil x Egito
│   └── sofascore_player_{id}/   # Dados por jogador
│
├── sql/
│   └── sofascore_schema.sql     # DDL (7 tabelas)
│
├── docs/
│   ├── README.md                # Este arquivo
│   ├── frontend/
│   │   ├── ARCHITECTURE.md      # Frontend architecture
│   │   └── DATA_PIPELINE.md     # Data flow pipeline
│   ├── api/
│   │   └── REST.md              # API endpoints documentation
│   └── database/
│       ├── README.md            # Database overview
│       └── SCHEMA.md            # Full schema reference
│
├── src/
│   └── sofascore_extractor.py   # Extrator completo de partida
│
├── fetch_playwright.py          # Fetch de jogador individual
├── notebooks/                   # Jupyter analysis
├── images/                      # Análises offline
└── orquestra.md                 # SDD Governance
```

## Quick Start

```bash
# 1. Ingerir dados JSON → SQLite
uv run python -m backend.db.persist

# 2. Iniciar servidor
uv run uvicorn backend.main:app --port 8000

# 3. Abrir navegador
# http://127.0.0.1:8000/dashboard/
```

## API Endpoints

| Endpoint | Descrição |
|----------|-----------|
| `GET /api/players` | Lista jogadores |
| `GET /api/dashboard-data?player_id=X` | Dados completos do dashboard |
| `GET /api/matches` | Partidas no banco |
| `GET /api/players/db` | Jogadores no banco |
| `GET /dashboard/` | Frontend SPA |

## Princípios Aplicados (ORQUESTRA.md)

- **Artigo IV (Simplicidade):** Sem frameworks JS pesados, SQLite sem servidor
- **Artigo VII (≤3 Projects):** frontend + backend + data
- **Artigo XII (OOP + SOLID):** Componentes com responsabilidade única
- **Artigo VIII (Anti-Abstração):** Cada abstração justificada pelo crescimento
- **Artigo IX (Integration-First):** Banco real (SQLite), não mocks
- **Artigo XI (Documentação Localizada):** Docs em `docs/[módulo]/`
