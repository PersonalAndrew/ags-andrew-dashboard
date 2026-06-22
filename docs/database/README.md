# Database — SofaScore Data Warehouse

## Visão Geral

Banco SQLite local que centraliza todos os dados extraídos da API do SofaScore: partidas, jogadores, estatísticas individuais e eventos espaciais (passes, chutes, dribles, ações defensivas, conduções).

## Arquivos

| Arquivo | Descrição |
|---------|-----------|
| `sql/sofascore_schema.sql` | DDL completo (7 tabelas, 3 índices) |
| `backend/db/database.py` | `DatabaseService` — ORM leve (context manager, upsert, CRUD) |
| `backend/db/persist.py` | Script de ingestão: JSON → SQLite |
| `data/sofascore.db` | Banco de dados (gerado) |

## Como Usar

### Ingerir dados existentes
```bash
uv run python -m backend.db.persist
```

### Servir com cache no banco
```bash
uv run uvicorn backend.main:app --port 8000
```

O backend automaticamente:
1. Consulta SQLite primeiro (cache)
2. Fallback para JSON files
3. Fallback para Playwright fetch

### Consultar diretamente
```bash
# Listar jogadores
sqlite3 data/sofascore.db "SELECT player_id, name, position FROM players LIMIT 10;"

# Estatísticas do Bruno Guimarães (match 15691379)
sqlite3 data/sofascore.db \
  "SELECT total_pass, accurate_pass, goals, rating
   FROM player_statistics
   WHERE match_id=15691379 AND player_id=866469;"

# Eventos de passe do Bruno
sqlite3 data/sofascore.db \
  "SELECT COUNT(*) as total_passes,
          SUM(outcome) as accurate_passes
   FROM player_events
   WHERE match_id=15691379 AND player_id=866469 AND event_type='pass';"
```

## Schema Diagram

```
┌───────────┐     ┌─────────────────┐     ┌───────────┐
│  matches  │1───*│  match_players  │*───1│  players  │
└───────────┘     └─────────────────┘     └───────────┘
     │                      
     ├──* player_statistics
     ├──* player_events
     ├──* heatmap_points
     └──* shotmap_points
```

Ver `SCHEMA.md` para detalhes de todas as colunas e tipos.
