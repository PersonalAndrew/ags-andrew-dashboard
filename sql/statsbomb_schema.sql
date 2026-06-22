-- StatsBomb Copa do Mundo 2022 Schema
-- Tabelas prefixadas com sb_ para evitar conflitos com tabelas do SofaScore

-- Matches
CREATE TABLE IF NOT EXISTS sb_matches (
    match_id INTEGER PRIMARY KEY,
    match_date TEXT,
    kick_off TEXT,
    home_team TEXT NOT NULL,
    away_team TEXT NOT NULL,
    home_score INTEGER,
    away_score INTEGER,
    competition_stage TEXT,
    stadium TEXT,
    referee TEXT,
    home_manager_name TEXT,
    away_manager_name TEXT
);

-- Artilheiros
CREATE TABLE IF NOT EXISTS sb_artilheiros (
    player TEXT NOT NULL,
    team TEXT NOT NULL,
    gols INTEGER NOT NULL,
    PRIMARY KEY (player, team)
);

-- Campanha do Brasil
CREATE TABLE IF NOT EXISTS sb_brasil_campanha (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    match_date TEXT,
    competition_stage TEXT,
    opponent TEXT,
    goals REAL,
    gols_sofridos INTEGER,
    xg REAL,
    shots INTEGER,
    shots_on_target REAL
);

-- Ranking de Times
CREATE TABLE IF NOT EXISTS sb_ranking_times (
    team TEXT PRIMARY KEY,
    jogos INTEGER,
    gols REAL,
    chutes INTEGER,
    chutes_no_gol REAL,
    xg REAL,
    xg_diff REAL
);

-- Stats por Time por Jogo
CREATE TABLE IF NOT EXISTS sb_team_match_stats (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    match_id INTEGER NOT NULL,
    team TEXT NOT NULL,
    shots INTEGER,
    xg REAL,
    goals REAL,
    shots_on_target REAL,
    match_date TEXT,
    home_team TEXT,
    away_team TEXT,
    home_score INTEGER,
    away_score INTEGER,
    competition_stage TEXT
);

CREATE INDEX IF NOT EXISTS idx_sb_team_match_stats_match_id 
    ON sb_team_match_stats(match_id);

CREATE INDEX IF NOT EXISTS idx_sb_team_match_stats_team 
    ON sb_team_match_stats(team);
