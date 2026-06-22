<div align="center">
  <img src="../images/CBF_Academy_COLORIDA_FUNDO_ESCURO@4x.webp" alt="CBF Academy" width="120"/>

  # ⚽ SofaScore Player Dashboard

  **Dashboard de análise de performance de futebol — CBF Academy**

  <p align="center">
    <img src="https://img.shields.io/badge/Python-3.13+-3776AB?style=for-the-badge&logo=python&logoColor=white" alt="Python"/>
    <img src="https://img.shields.io/badge/FastAPI-0.135-009688?style=for-the-badge&logo=fastapi&logoColor=white" alt="FastAPI"/>
    <img src="https://img.shields.io/badge/SQLite-003B57?style=for-the-badge&logo=sqlite&logoColor=white" alt="SQLite"/>
    <img src="https://img.shields.io/badge/mplsoccer-1.6-FF6F00?style=for-the-badge&logo=python&logoColor=white" alt="mplsoccer"/>
    <img src="https://img.shields.io/badge/Playwright-1.58-2EAD33?style=for-the-badge&logo=playwright&logoColor=white" alt="Playwright"/>
    <img src="https://img.shields.io/badge/license-MIT-10b981?style=for-the-badge" alt="License"/>
  </p>

  <p align="center">
    <img src="https://img.shields.io/badge/tests-7%2F7%20✅-10b981?style=flat-square" alt="Tests"/>
    <img src="https://img.shields.io/badge/status-production-10b981?style=flat-square" alt="Status"/>
  </p>

  <br/>
</div>

---

## 📋 Visão Geral

Dashboard interativo que consome dados **reais** da API do **SofaScore**, armazena em cache **SQLite** e exibe visualizações táticas profissionais — mapas de calor, chutes, passes e estatísticas detalhadas — em uma SPA moderna com design **glassmorphism**.

> Projeto didático desenvolvido durante o curso **Python para Dados** da **CBF Academy**.

---

## ✨ Features

<table>
  <tr>
    <td width="33%" align="center">
      <strong>🗺️ Mapas Táticos</strong><br/>
      Heatmap (kdeplot), Shotmap (scatter por tipo), Passmap (setas) — em coordenadas Opta
    </td>
    <td width="33%" align="center">
      <strong>📊 Radar de Performance</strong><br/>
      Chart.js com 6 métricas: passes, duelos, desarmes, finalização,Rating
    </td>
    <td width="33%" align="center">
      <strong>🧠 Cache Inteligente</strong><br/>
      SQLite → JSON → Playwright fetch (lazy sob demanda)
    </td>
  </tr>
  <tr>
    <td width="33%" align="center">
      <strong>🎨 Design Glassmorphism</strong><br/>
      Tema escuro, vidro fosco, gradientes, animações suaves
    </td>
    <td width="33%" align="center">
      <strong>🔌 API REST</strong><br/>
      4 endpoints + Swagger automático + fallback a JSON
    </td>
    <td width="33%" align="center">
      <strong>🕷️ Auto-Fetch</strong><br/>
      Se o jogador não está em cache, baixa automaticamente via Playwright
    </td>
  </tr>
</table>

---

## 🏗️ Arquitetura

```
┌──────────────────────────────────────────────────────────────────┐
│                    FRONTEND SPA                                   │
│  Vanilla JS (ES Modules) · Chart.js · CSS Glassmorphism           │
│  ┌──────────────────────────────────────────────────────────────┐ │
│  │  PlayerSelector  │  Dashboard  │  StatsRadar                │ │
│  │  (dropdown)      │  (3 maps)   │  (Chart.js canvas)         │ │
│  └──────────────────────────────────────────────────────────────┘ │
└──────────────────────────┬───────────────────────────────────────┘
                           │ HTTP REST (JSON)
┌──────────────────────────▼───────────────────────────────────────┐
│                    FASTAPI BACKEND                                │
│  ┌──────────────────────────────────────────────────────────────┐ │
│  │  main.py         → App factory · CORS · Static mount         │ │
│  │  api/routes.py   → 4 endpoints (APIRouter)                  │ │
│  │  services/       → mplsoccer: heatmap, shotmap, passmap     │ │
│  │  infra/          → DatabaseService + persist (ETL)          │ │
│  │  fetchers/       → Playwright (async + sync)                │ │
│  │  cli/            → fetch_player · download_image            │ │
│  └──────────────────────────────────────────────────────────────┘ │
└──────────────────────────┬───────────────────────────────────────┘
                           │
┌──────────────────────────▼───────────────────────────────────────┐
│                    DATA LAYER                                     │
│  SQLite (data/sofascore.db) — 7 tabelas, 847 registros            │
│  JSON (data/raw/ + data/sofascore_player_*/)                      │
│  Schema DDL em sql/sofascore_schema.sql                           │
└──────────────────────────┬───────────────────────────────────────┘
                           │ Playwright (Chromium headless)
┌──────────────────────────▼───────────────────────────────────────┐
│                    FETCH LAYER                                    │
│  Sofascore API (real) ← Playwright ← bypass Cloudflare            │
│  app/cli/fetch_player.py — fetch individual do jogador           │
│  app/fetchers/sofascore.py — classe SofascoreFetcher (async)     │
└──────────────────────────────────────────────────────────────────┘
```

### Fluxo de Requisição

```
Usuário                        Backend                          Cache
   │                              │                               │
   ├── GET /api/dashboard-data ──►│                               │
   │                              ├──► DB: stats? heatmap? ─────►│
   │                              │◄── cache HIT ────────────────│
   │                              ├──► sem cache → JSON files     │
   │                              ├──► sem JSON → Playwright      │
   │◄── response (images + stats)─┤                               │
```

---

## 🚀 Quick Start

### Pré-requisitos

- Python 3.13+
- [uv](https://docs.astral.sh/uv/)
- Chromium (Playwright)

### Setup

```bash
# 1. Entrar no projeto
cd dashboard

# 2. Instalar dependências
uv sync

# 3. Instalar browser do Playwright
uv run playwright install chromium

# 4. Ingerir dados (opcional — já existe banco populado)
uv run python -m app.infra.persist

# 5. Iniciar servidor
uv run uvicorn app.main:app --reload --port 8000

# 6. Abrir no navegador
open http://127.0.0.1:8000/dashboard/
```

### Comandos CLI

```bash
# Fetch de jogador individual
uv run python -m app.cli.fetch_player 866469

# Download de imagem do jogador
uv run python -m app.cli.download_image 866469 15691379

# Ingestão completa dos JSONs para SQLite
uv run python -m app.infra.persist
```

---

## 📡 API

### Endpoints

| Método | Rota | Descrição |
|--------|------|-----------|
| `GET` | `/api/players` | Lista todos os jogadores (DB → JSON) |
| `GET` | `/api/dashboard-data?player_id=X` | Dashboard completo: imagens + stats + eventos |
| `GET` | `/api/matches` | Partidas cadastradas no banco |
| `GET` | `/api/players/db` | Jogadores no banco SQLite |
| `GET` | `/dashboard/` | Frontend SPA (static mount) |
| `GET` | `/docs` | Swagger UI (automático) |
| `GET` | `/redoc` | ReDoc (automático) |

### Exemplo: `/api/dashboard-data?player_id=866469`

```json
{
  "images": {
    "heatmap": "data:image/png;base64,...",
    "shotmap": "data:image/png;base64,...",
    "passmap": "data:image/png;base64,..."
  },
  "stats": {
    "rating": 7.2,
    "minutesPlayed": 90,
    "totalPass": 45,
    "accuratePass": 38,
    "goals": 1,
    "onTargetScoringAttempt": 3,
    "duelWon": 12,
    "duelLost": 4,
    "wonTackle": 5,
    "interceptions": 8
  },
  "events": {
    "passes": [
      {
        "playerCoordinates": {"x": 50, "y": 30},
        "passEndCoordinates": {"x": 78, "y": 45},
        "outcome": true,
        "keypass": false
      }
    ],
    "dribbles": [],
    "defensive": [],
    "ball_carries": []
  }
}
```

> **Nota:** As imagens (heatmap, shotmap, passmap) são retornadas como **base64** — prontas para uso direto no atributo `src` de uma tag `<img>`.

---

## 🗄️ Database

**Engine:** SQLite (zero-config, sem servidor) — `data/sofascore.db`

### Schema (7 tabelas)

| Tabela | Registros | Finalidade |
|--------|----------|------------|
| `matches` | 1 | Partidas |
| `players` | 51 | Jogadores |
| `match_players` | 44 | Relação partida-jogador |
| `player_statistics` | 42 | Estatísticas detalhadas (29 campos) |
| `player_events` | 359 | Passes, dribles, defensivas, carregamentos |
| `heatmap_points` | 277 | Pontos de calor (coordenadas Opta) |
| `shotmap_points` | 26 | Chutes (coordenadas + tipo) |

DDL completo: `sql/sofascore_schema.sql`

---

## 🧪 Testes

```bash
cd dashboard
uv run pytest app/tests/ -v
```

```
collected 7 items

app/tests/test_api.py .........                           [ 57%]
app/tests/test_database.py ....                           [100%]

========================= 7 passed in 0.41s ===============
```

---

## 🧰 Stack

| Categoria | Tecnologia |
|-----------|------------|
| **Runtime** | Python 3.13+ |
| **Framework Web** | FastAPI + Uvicorn |
| **Banco** | SQLite (cache-first) |
| **Frontend** | Vanilla JS (ES Modules) + Chart.js |
| **CSS** | Glassmorphism · Outfit Font · CSS Modules |
| **Plotagem** | mplsoccer (coordenadas Opta) |
| **Scraping** | Playwright (Chromium headless) |
| **Package** | uv · Hatchling · Workspace |

---

## 📁 Estrutura

```
dashboard/
├── app/                           # ★ Código principal
│   ├── main.py                   # FastAPI app factory
│   ├── api/routes.py             # REST endpoints (APIRouter)
│   ├── services/plotter.py       # mplsoccer: heatmap, shotmap, passmap
│   ├── infra/
│   │   ├── database.py           # DatabaseService (SQLite)
│   │   └── persist.py            # ETL: JSON → SQLite
│   ├── fetchers/
│   │   ├── sofascore.py          # Playwright fetcher (async)
│   │   └── extractor.py          # Extrator de partida (sync)
│   ├── cli/
│   │   ├── fetch_player.py       # CLI: fetch de jogador
│   │   └── download_image.py     # CLI: download de imagem
│   ├── frontend/                 # SPA (static mount)
│   │   ├── index.html
│   │   ├── assets/css/           # 3 módulos CSS
│   │   └── assets/js/            # 5 módulos JS
│   └── tests/                    # 7 testes pytest
├── data/                         # SQLite + JSON
├── sql/                          # Schema DDL
├── docs/                         # Documentação detalhada
├── pyproject.toml                # Dependências
└── README.md                     # ← Você está aqui
```

---

## 🎨 Design System

| Token | Valor | Uso |
|-------|-------|-----|
| `--bg-color` | `#0f172a` | Background principal |
| `--accent` | `#10b981` | Verde esmeralda (destaque) |
| `--panel-bg` | `rgba(30,41,59,0.7)` | Painéis glassmorphism |
| `--text-main` | `#f8fafc` | Texto primário |
| **Fonte** | Outfit (Google Fonts) | Pesos: 300, 400, 600, 800 |

> Design system completo: [`app/frontend/design-system/MASTER.md`](app/frontend/design-system/MASTER.md)

---

## 📚 Documentação

| Documento | Conteúdo |
|-----------|----------|
| [`docs/README.md`](docs/README.md) | Índice da documentação |
| [`docs/frontend/ARCHITECTURE.md`](docs/frontend/ARCHITECTURE.md) | Arquitetura de componentes e data flow |
| [`docs/frontend/DATA_PIPELINE.md`](docs/frontend/DATA_PIPELINE.md) | Pipeline de dados completo |
| [`docs/api/REST.md`](docs/api/REST.md) | Referência completa da API |
| [`docs/database/README.md`](docs/database/README.md) | Overview do banco e estratégia de cache |
| [`docs/database/SCHEMA.md`](docs/database/SCHEMA.md) | Schema detalhado (colunas, tipos, índices) |

---

## 👨‍🏫 Sobre

Este projeto foi desenvolvido como material didático do curso **Python para Dados** da **CBF Academy**, demonstrando na prática:

- Consumo de API real com bypass de Cloudflare (Playwright)
- Pipeline ETL completo (JSON → SQLite → REST)
- Visualização de dados esportivos com mplsoccer
- API REST com FastAPI
- Frontend SPA com JavaScript modular e design glassmorphism
- Testes automatizados com pytest

---

<div align="center">
  <sub>
    Feito com ⚽ durante o curso Python para Dados — 
    <a href="https://www.cbf.com.br/cbf-academy">CBF Academy</a>
  </sub>
  <br/>
  <img src="../images/CBF_Academy_COLORIDA_FUNDO_ESCURO@4x.webp" width="60"/>
</div>
