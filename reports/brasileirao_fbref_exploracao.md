# Exploração FBref/SoccerData — Brasileirão Série A 2026

## Fonte

Dados extraídos com `soccerdata` a partir do FBref.

Liga configurada manualmente no SoccerData:

- Chave local: `BRA-Serie A`
- Nome FBref: `Campeonato Brasileiro Série A`
- Temporada: `2026`

## Arquivos gerados

- `data/parquet/brasileirao_2026_schedule.parquet`
- `data/parquet/brasileirao_2026_standings.parquet`
- `data/parquet/brasileirao_2026_team_standard.parquet`
- `data/parquet/brasileirao_2026_team_shooting.parquet`
- `data/parquet/brasileirao_2026_opponent_shooting.parquet`
- `data/parquet/brasileirao_2026_player_standard.parquet`
- `data/parquet/brasileirao_2026_player_shooting.parquet`
- `data/fbref_brasileirao.db`

## Tabelas SQLite

- `fbref_schedule`
- `fbref_standings`
- `fbref_team_standard`
- `fbref_team_shooting`
- `fbref_opponent_shooting`
- `fbref_player_standard`
- `fbref_player_shooting`

## Pergunta 1 — Melhor jogador em xG/90

Não foi possível calcular com segurança.

As tabelas de jogadores extraídas via FBref/SoccerData para o Brasileirão Série A 2026 não trouxeram colunas de xG, expected goals ou equivalente.

Colunas relevantes encontradas:

- `player_shooting`: `team`, `player`, `90s`, `standard_sh`
- `player_standard`: `team`, `player`, `playing_time_90s`

Como não há coluna de xG, a métrica xG/90 não foi calculada para evitar criação artificial de dado.

## Pergunta 2 — Time que mais concede finalizações

A partir da tabela `opponent_shooting`, a coluna `standard_sh` representa finalizações dos adversários contra cada equipe.

Resultado encontrado:

| Time | Finalizações concedidas |
|---|---:|
| Coritiba | 304 |
| Chapecoense | 289 |
| Botafogo-RJ | 266 |
| Atlético Mineiro | 257 |
| Remo | 254 |
| Grêmio | 249 |
| Palmeiras | 245 |
| Santos | 245 |
| Bahia | 241 |

Conclusão: o Coritiba foi o time que mais concedeu finalizações, com 304 chutes sofridos.

## Observação metodológica

O projeto não mistura fontes brutas. Os dados do Brasileirão ficam separados dos módulos StatsBomb e SofaScore.

- Copa 2022: StatsBomb
- Copa 2026: SofaScore
- Brasileirão: FBref/SoccerData

