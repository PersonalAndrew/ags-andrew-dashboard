from pathlib import Path
import sqlite3
import json
import pandas as pd


BASE_DIR = Path(__file__).resolve().parents[3]

EVENTS_PATH = BASE_DIR / "analise-dados" / "dados" / "statsbomb" / "copa2022" / "events.pkl.gz"
DB_PATH = BASE_DIR / "dashboard" / "data" / "sofascore.db"


def get_xy(value):
    if isinstance(value, list) and len(value) >= 2:
        return value[0], value[1]
    return None, None


def create_tables(conn):
    cursor = conn.cursor()

    cursor.execute("""
    DROP TABLE IF EXISTS sb_events;
    """)

    cursor.execute("""
    DROP TABLE IF EXISTS sb_lineups;
    """)

    cursor.execute("""
    CREATE TABLE sb_events (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        match_id INTEGER,
        event_id TEXT,
        event_index INTEGER,
        period INTEGER,
        minute INTEGER,
        second INTEGER,
        team TEXT,
        team_id INTEGER,
        player TEXT,
        player_id INTEGER,
        position TEXT,
        type TEXT,
        play_pattern TEXT,
        possession INTEGER,
        possession_team TEXT,
        location_x REAL,
        location_y REAL,
        pass_end_x REAL,
        pass_end_y REAL,
        pass_recipient TEXT,
        pass_recipient_id INTEGER,
        pass_outcome TEXT,
        pass_length REAL,
        pass_angle REAL,
        pass_height TEXT,
        pass_body_part TEXT,
        shot_xg REAL,
        shot_outcome TEXT,
        shot_body_part TEXT,
        shot_technique TEXT,
        shot_type TEXT,
        dribble_outcome TEXT,
        duel_type TEXT,
        duel_outcome TEXT,
        foul_committed_card TEXT,
        foul_committed_type TEXT,
        foul_won_penalty INTEGER,
        under_pressure INTEGER,
        timestamp TEXT
    );
    """)

    cursor.execute("""
    CREATE TABLE sb_lineups (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        match_id INTEGER,
        team TEXT,
        team_id INTEGER,
        formation INTEGER,
        player_id INTEGER,
        player_name TEXT,
        position_id INTEGER,
        position_name TEXT,
        jersey_number INTEGER
    );
    """)

    conn.commit()


def ingest_events(conn, df):
    rows = []

    for _, row in df.iterrows():
        location_x, location_y = get_xy(row.get("location"))
        pass_end_x, pass_end_y = get_xy(row.get("pass_end_location"))

        rows.append({
            "match_id": row.get("match_id"),
            "event_id": row.get("id"),
            "event_index": row.get("index"),
            "period": row.get("period"),
            "minute": row.get("minute"),
            "second": row.get("second"),
            "team": row.get("team"),
            "team_id": row.get("team_id"),
            "player": row.get("player"),
            "player_id": row.get("player_id"),
            "position": row.get("position"),
            "type": row.get("type"),
            "play_pattern": row.get("play_pattern"),
            "possession": row.get("possession"),
            "possession_team": row.get("possession_team"),
            "location_x": location_x,
            "location_y": location_y,
            "pass_end_x": pass_end_x,
            "pass_end_y": pass_end_y,
            "pass_recipient": row.get("pass_recipient"),
            "pass_recipient_id": row.get("pass_recipient_id"),
            "pass_outcome": row.get("pass_outcome"),
            "pass_length": row.get("pass_length"),
            "pass_angle": row.get("pass_angle"),
            "pass_height": row.get("pass_height"),
            "pass_body_part": row.get("pass_body_part"),
            "shot_xg": row.get("shot_statsbomb_xg"),
            "shot_outcome": row.get("shot_outcome"),
            "shot_body_part": row.get("shot_body_part"),
            "shot_technique": row.get("shot_technique"),
            "shot_type": row.get("shot_type"),
            "dribble_outcome": row.get("dribble_outcome"),
            "duel_type": row.get("duel_type"),
            "duel_outcome": row.get("duel_outcome"),
            "foul_committed_card": row.get("foul_committed_card"),
            "foul_committed_type": row.get("foul_committed_type"),
            "foul_won_penalty": 1 if row.get("foul_won_penalty") is True else 0,
            "under_pressure": 1 if row.get("under_pressure") is True else 0,
            "timestamp": row.get("timestamp"),
        })

    events_df = pd.DataFrame(rows)
    events_df.to_sql("sb_events", conn, if_exists="append", index=False)

    print(f"Eventos inseridos: {len(events_df)}")


def ingest_lineups(conn, df):
    rows = []

    starting_xi = df[df["type"] == "Starting XI"]

    for _, row in starting_xi.iterrows():
        tactics = row.get("tactics")

        if not isinstance(tactics, dict):
            continue

        formation = tactics.get("formation")
        lineup = tactics.get("lineup", [])

        for item in lineup:
            player = item.get("player", {})
            position = item.get("position", {})

            rows.append({
                "match_id": row.get("match_id"),
                "team": row.get("team"),
                "team_id": row.get("team_id"),
                "formation": formation,
                "player_id": player.get("id"),
                "player_name": player.get("name"),
                "position_id": position.get("id"),
                "position_name": position.get("name"),
                "jersey_number": item.get("jersey_number"),
            })

    lineups_df = pd.DataFrame(rows)
    lineups_df.to_sql("sb_lineups", conn, if_exists="append", index=False)

    print(f"Jogadores em escalações inseridos: {len(lineups_df)}")


def create_indexes(conn):
    cursor = conn.cursor()

    cursor.execute("CREATE INDEX IF NOT EXISTS idx_sb_events_match_id ON sb_events(match_id);")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_sb_events_team ON sb_events(team);")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_sb_events_player ON sb_events(player);")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_sb_events_type ON sb_events(type);")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_sb_lineups_match_id ON sb_lineups(match_id);")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_sb_lineups_team ON sb_lineups(team);")

    conn.commit()


def main():
    print("Lendo arquivo de eventos...")
    df = pd.read_pickle(EVENTS_PATH, compression="gzip")

    print(f"Shape do arquivo: {df.shape}")
    print("Conectando ao banco...")
    conn = sqlite3.connect(DB_PATH)

    try:
        print("Criando tabelas...")
        create_tables(conn)

        print("Inserindo eventos...")
        ingest_events(conn, df)

        print("Inserindo escalações...")
        ingest_lineups(conn, df)

        print("Criando índices...")
        create_indexes(conn)

        print("Ingestão finalizada com sucesso.")
    finally:
        conn.close()


if __name__ == "__main__":
    main()