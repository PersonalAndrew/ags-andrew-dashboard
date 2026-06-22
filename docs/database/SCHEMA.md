# Database Schema — SofaScore Data Warehouse

**Engine:** SQLite 3  
**Arquivo:** `data/sofascore.db`  
**Schema DDL:** `sql/sofascore_schema.sql`

## Entity-Relationship Diagram

```
matches 1──* match_players *──1 players
matches 1──* player_statistics *──1 players
matches 1──* player_events *──1 players
matches 1──* heatmap_points *──1 players
matches 1──* shotmap_points *──1 players
```

## Tables

### `matches`
| Column | Type | Description |
|--------|------|-------------|
| `match_id` | INTEGER PK | ID SofaScore da partida |
| `home_team` | TEXT | Nome do time da casa |
| `away_team` | TEXT | Nome do time visitante |
| `home_score` | INTEGER | Placar time da casa |
| `away_score` | INTEGER | Placar visitante |
| `match_date` | TEXT | Data da partida |
| `competition` | TEXT | Competição (ex: "Friendly") |
| `fetched_at` | TEXT | Timestamp da última busca |

### `players`
| Column | Type | Description |
|--------|------|-------------|
| `player_id` | INTEGER PK | ID SofaScore do jogador |
| `name` | TEXT | Nome completo |
| `position` | TEXT | Posição (G/D/M/F) |
| `team` | TEXT | Time atual |
| `image_url` | TEXT | URL da foto |

### `match_players`
| Column | Type | Description |
|--------|------|-------------|
| `match_id` | INTEGER PK FK | Partida |
| `player_id` | INTEGER PK FK | Jogador |
| `team_side` | TEXT | 'home' ou 'away' |
| `is_starter` | INTEGER | 1=titular, 0=reserva |
| `shirt_number` | INTEGER | Número da camisa |
| `rating` | REAL | Nota SofaScore (0-10) |
| `minutes_played` | INTEGER | Minutos jogados |

### `player_statistics`
30 colunas de estatísticas individuais por partida.

| Column | Mapeamento SofaScore |
|--------|---------------------|
| `total_pass` | `statistics.totalPass` |
| `accurate_pass` | `statistics.accuratePass` |
| `total_long_balls` | `statistics.totalLongBalls` |
| `goal_assist` | `statistics.goalAssist` |
| `accurate_own_half_passes` | `statistics.accurateOwnHalfPasses` |
| `total_own_half_passes` | `statistics.totalOwnHalfPasses` |
| `accurate_opposition_half_passes` | `statistics.accurateOppositionHalfPasses` |
| `total_opposition_half_passes` | `statistics.totalOppositionHalfPasses` |
| `total_cross` | `statistics.totalCross` |
| `accurate_cross` | `statistics.accurateCross` |
| `duel_lost` | `statistics.duelLost` |
| `duel_won` | `statistics.duelWon` |
| `total_contest` | `statistics.totalContest` |
| `won_contest` | `statistics.wonContest` |
| `big_chance_created` | `statistics.bigChanceCreated` |
| `on_target_scoring_attempt` | `statistics.onTargetScoringAttempt` |
| `goals` | `statistics.goals` |
| `ball_recovery` | `statistics.ballRecovery` |
| `total_tackle` | `statistics.totalTackle` |
| `won_tackle` | `statistics.wonTackle` |
| `was_fouled` | `statistics.wasFouled` |
| `fouls` | `statistics.fouls` |
| `shot_off_target` | `statistics.shotOffTarget` |
| `blocked_scoring_attempt` | `statistics.blockedScoringAttempt` |
| `total_clearance` | `statistics.totalClearance` |
| `outfielder_block` | `statistics.outfielderBlock` |
| `error_lead_to_goal` | `statistics.errorLeadToAGoal` |
| `minutes_played` | `statistics.minutesPlayed` |
| `rating` | `statistics.rating` |
| `fetched_at` | Timestamp |

### `player_events`
| Column | Type | Description |
|--------|------|-------------|
| `id` | INTEGER PK AUTO | |
| `match_id` | INTEGER FK | Partida |
| `player_id` | INTEGER FK | Jogador |
| `event_type` | TEXT | 'pass' / 'dribble' / 'defensive' / 'ball_carry' |
| `x` | REAL | Coordenada x (opta 0-100) |
| `y` | REAL | Coordenada y (opta 0-100) |
| `end_x` | REAL | Coordenada final x |
| `end_y` | REAL | Coordenada final y |
| `outcome` | INTEGER | 1=sucesso, 0=falha |
| `keypass` | INTEGER | 1=passe decisivo |
| `is_home` | INTEGER | 1=time da casa |

### `heatmap_points`
| Column | Type | Description |
|--------|------|-------------|
| `id` | INTEGER PK AUTO | |
| `match_id` | INTEGER FK | Partida |
| `player_id` | INTEGER FK | Jogador |
| `x` | REAL | Coordenada x |
| `y` | REAL | Coordenada y |

### `shotmap_points`
| Column | Type | Description |
|--------|------|-------------|
| `id` | INTEGER PK AUTO | |
| `match_id` | INTEGER FK | Partida |
| `player_id` | INTEGER FK | Jogador |
| `x` | REAL | Coordenada x |
| `y` | REAL | Coordenada y |
| `shot_type` | TEXT | 'goal' / 'miss' / 'save' / 'block' |
| `body_part` | TEXT | Parte do corpo |
| `situation` | TEXT | Contexto do chute |

## Indexes

| Index | Table | Columns |
|-------|-------|---------|
| `idx_events_match_player` | `player_events` | `(match_id, player_id)` |
| `idx_heatmap_match_player` | `heatmap_points` | `(match_id, player_id)` |
| `idx_shotmap_match_player` | `shotmap_points` | `(match_id, player_id)` |

## Service Layer

`backend/db/database.py` — `DatabaseService` class:
- `get_player_statistics(match_id, player_id)`
- `get_player_events(match_id, player_id, event_type)`
- `get_heatmap(match_id, player_id)`
- `get_shotmap(match_id, player_id)`
- `persist_player_data(match_id, player_id, name, team_side, stats, events, heatmap, shotmap, rating, minutes)`

## Ingest Pipeline

```bash
uv run python -m backend.db.persist
```

`persist.py` lê de:
1. `data/raw/match_{MATCH_ID}/` — dados do extrator (match completo)
2. `data/sofascore_player_{player_id}/` — dados do fetch_playwright (player avulso)
