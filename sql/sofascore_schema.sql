-- SofaScore Dashboard Database Schema
-- Tabelas para armazenar dados de jogadores, partidas e estatísticas

-- Matches
CREATE TABLE IF NOT EXISTS matches (
    match_id INTEGER PRIMARY KEY,
    home_team TEXT NOT NULL,
    away_team TEXT NOT NULL,
    home_score INTEGER,
    away_score INTEGER,
    match_date TEXT,
    competition TEXT,
    fetched_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Players
CREATE TABLE IF NOT EXISTS players (
    player_id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    position TEXT,
    team TEXT,
    image_url TEXT
);

-- Match Players (Lineups)
CREATE TABLE IF NOT EXISTS match_players (
    match_id INTEGER NOT NULL,
    player_id TEXT NOT NULL,
    team_side TEXT NOT NULL,  -- 'home' or 'away'
    is_starter INTEGER DEFAULT 0,
    shirt_number INTEGER,
    rating REAL,
    minutes_played INTEGER,
    PRIMARY KEY (match_id, player_id),
    FOREIGN KEY (match_id) REFERENCES matches(match_id),
    FOREIGN KEY (player_id) REFERENCES players(player_id)
);

-- Player Statistics
CREATE TABLE IF NOT EXISTS player_statistics (
    match_id INTEGER NOT NULL,
    player_id TEXT NOT NULL,
    total_pass INTEGER,
    accurate_pass INTEGER,
    total_long_balls INTEGER,
    goal_assist INTEGER,
    accurate_own_half_passes INTEGER,
    total_own_half_passes INTEGER,
    accurate_opposition_half_passes INTEGER,
    total_opposition_half_passes INTEGER,
    total_cross INTEGER,
    accurate_cross INTEGER,
    duel_lost INTEGER,
    duel_won INTEGER,
    total_contest INTEGER,
    won_contest INTEGER,
    big_chance_created INTEGER,
    on_target_scoring_attempt INTEGER,
    goals INTEGER,
    ball_recovery INTEGER,
    total_tackle INTEGER,
    won_tackle INTEGER,
    was_fouled INTEGER,
    fouls INTEGER,
    shot_off_target INTEGER,
    blocked_scoring_attempt INTEGER,
    total_clearance INTEGER,
    outfielder_block INTEGER,
    error_lead_to_goal INTEGER,
    minutes_played INTEGER,
    rating REAL,
    fetched_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (match_id, player_id),
    FOREIGN KEY (match_id) REFERENCES matches(match_id),
    FOREIGN KEY (player_id) REFERENCES players(player_id)
);

-- Player Events
CREATE TABLE IF NOT EXISTS player_events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    match_id INTEGER NOT NULL,
    player_id TEXT NOT NULL,
    event_type TEXT NOT NULL,  -- 'pass', 'dribble', 'defensive', 'ball_carry'
    x REAL NOT NULL,
    y REAL NOT NULL,
    end_x REAL,
    end_y REAL,
    outcome INTEGER DEFAULT 0,
    keypass INTEGER DEFAULT 0,
    is_home INTEGER DEFAULT 0,
    FOREIGN KEY (match_id) REFERENCES matches(match_id),
    FOREIGN KEY (player_id) REFERENCES players(player_id)
);

CREATE INDEX IF NOT EXISTS idx_player_events_match_player_type 
    ON player_events(match_id, player_id, event_type);

-- Heatmap Points
CREATE TABLE IF NOT EXISTS heatmap_points (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    match_id INTEGER NOT NULL,
    player_id TEXT NOT NULL,
    x REAL NOT NULL,
    y REAL NOT NULL,
    FOREIGN KEY (match_id) REFERENCES matches(match_id),
    FOREIGN KEY (player_id) REFERENCES players(player_id)
);

CREATE INDEX IF NOT EXISTS idx_heatmap_match_player 
    ON heatmap_points(match_id, player_id);

-- Shotmap Points
CREATE TABLE IF NOT EXISTS shotmap_points (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    match_id INTEGER NOT NULL,
    player_id TEXT NOT NULL,
    x REAL NOT NULL,
    y REAL NOT NULL,
    shot_type TEXT,
    FOREIGN KEY (match_id) REFERENCES matches(match_id),
    FOREIGN KEY (player_id) REFERENCES players(player_id)
);

CREATE INDEX IF NOT EXISTS idx_shotmap_match_player 
    ON shotmap_points(match_id, player_id);
