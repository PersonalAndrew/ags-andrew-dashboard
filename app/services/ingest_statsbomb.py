"""
Script de ingestão dos dados StatsBomb (Copa do Mundo 2022) para o banco SQLite.

Lê os 5 CSVs gerados em analise-dados/dados/statsbomb/copa2022/ e popula
tabelas próprias (prefixo sb_), sem alterar as tabelas do SofaScore.

Como rodar (a partir da pasta statsbomb/dashboard):
    uv run python app/services/ingest_statsbomb.py
"""
import os
import sqlite3

import pandas as pd

# Caminhos relativos a partir deste arquivo: app/services/ingest_statsbomb.py
ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(__file__))))
# ROOT = .../statsbomb

CSV_DIR = os.path.join(ROOT, "analise-dados", "dados", "statsbomb", "copa2022")
RESUMOS_DIR = os.path.join(CSV_DIR, "resumos")

DB_PATH = os.path.join(os.path.dirname(__file__), "..", "..", "..", "dashboard", "data", "sofascore.db")
DB_PATH = os.path.normpath(DB_PATH)

SCHEMA_PATH = os.path.join(os.path.dirname(__file__), "..", "..", "sql", "statsbomb_schema.sql")
SCHEMA_PATH = os.path.normpath(SCHEMA_PATH)


def get_connection():
    os.makedirs(os.path.dirname(DB_PATH), exist_ok=True)
    conn = sqlite3.connect(DB_PATH)
    return conn


def init_schema(conn):
    with open(SCHEMA_PATH, encoding="utf-8") as f:
        schema = f.read()
    conn.executescript(schema)
    conn.commit()
    print(f"[ingest_statsbomb] Schema aplicado em {DB_PATH}")


def ingest_matches(conn):
    path = os.path.join(CSV_DIR, "matches.csv")
    df = pd.read_csv(path)

    cols = [
        "match_id", "match_date", "kick_off", "home_team", "away_team",
        "home_score", "away_score", "competition_stage", "stadium", "referee",
        "home_manager_name", "away_manager_name",
    ]
    df_sel = df[cols].copy()

    cur = conn.cursor()
    for _, row in df_sel.iterrows():
        cur.execute("""
            INSERT INTO sb_matches
                (match_id, match_date, kick_off, home_team, away_team,
                 home_score, away_score, competition_stage, stadium, referee,
                 home_manager_name, away_manager_name)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT(match_id) DO UPDATE SET
                home_score=excluded.home_score,
                away_score=excluded.away_score
        """, tuple(row[c] if pd.notna(row[c]) else None for c in cols))
    conn.commit()
    print(f"[ingest_statsbomb] {len(df_sel)} partidas inseridas em sb_matches")


def ingest_artilheiros(conn):
    path = os.path.join(RESUMOS_DIR, "artilheiros.csv")
    df = pd.read_csv(path)

    cur = conn.cursor()
    for _, row in df.iterrows():
        cur.execute("""
            INSERT INTO sb_artilheiros (player, team, gols)
            VALUES (?, ?, ?)
            ON CONFLICT(player, team) DO UPDATE SET gols=excluded.gols
        """, (row["player"], row["team"], int(row["gols"])))
    conn.commit()
    print(f"[ingest_statsbomb] {len(df)} artilheiros inseridos em sb_artilheiros")


def ingest_brasil_campanha(conn):
    path = os.path.join(RESUMOS_DIR, "brasil_campanha.csv")
    df = pd.read_csv(path)

    cur = conn.cursor()
    cur.execute("DELETE FROM sb_brasil_campanha")  # idempotente: recria sempre
    for _, row in df.iterrows():
        cur.execute("""
            INSERT INTO sb_brasil_campanha
                (match_date, competition_stage, opponent, goals,
                 gols_sofridos, xg, shots, shots_on_target)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            row["match_date"], row["competition_stage"], row["opponent"],
            float(row["goals"]) if pd.notna(row["goals"]) else None,
            int(row["gols_sofridos"]) if pd.notna(row["gols_sofridos"]) else None,
            float(row["xg"]) if pd.notna(row["xg"]) else None,
            int(row["shots"]) if pd.notna(row["shots"]) else None,
            float(row["shots_on_target"]) if pd.notna(row["shots_on_target"]) else None,
        ))
    conn.commit()
    print(f"[ingest_statsbomb] {len(df)} jogos do Brasil inseridos em sb_brasil_campanha")


def ingest_ranking_times(conn):
    path = os.path.join(RESUMOS_DIR, "ranking_times.csv")
    df = pd.read_csv(path)

    cur = conn.cursor()
    for _, row in df.iterrows():
        cur.execute("""
            INSERT INTO sb_ranking_times
                (team, jogos, gols, chutes, chutes_no_gol, xg, xg_diff)
            VALUES (?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT(team) DO UPDATE SET
                jogos=excluded.jogos, gols=excluded.gols,
                chutes=excluded.chutes, chutes_no_gol=excluded.chutes_no_gol,
                xg=excluded.xg, xg_diff=excluded.xg_diff
        """, (
            row["team"], int(row["jogos"]), float(row["gols"]),
            int(row["chutes"]),
            float(row["chutes_no_gol"]) if pd.notna(row["chutes_no_gol"]) else None,
            float(row["xg"]), float(row["xg_diff"]),
        ))
    conn.commit()
    print(f"[ingest_statsbomb] {len(df)} times inseridos em sb_ranking_times")


def ingest_team_match_stats(conn):
    path = os.path.join(RESUMOS_DIR, "stats_por_time_jogo.csv")
    df = pd.read_csv(path)

    cur = conn.cursor()
    cur.execute("DELETE FROM sb_team_match_stats")  # idempotente
    for _, row in df.iterrows():
        cur.execute("""
            INSERT INTO sb_team_match_stats
                (match_id, team, shots, xg, goals, shots_on_target,
                 match_date, home_team, away_team, home_score, away_score,
                 competition_stage)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            int(row["match_id"]), row["team"], int(row["shots"]),
            float(row["xg"]), float(row["goals"]) if pd.notna(row["goals"]) else None,
            float(row["shots_on_target"]) if pd.notna(row["shots_on_target"]) else None,
            row["match_date"], row["home_team"], row["away_team"],
            int(row["home_score"]), int(row["away_score"]), row["competition_stage"],
        ))
    conn.commit()
    print(f"[ingest_statsbomb] {len(df)} linhas inseridas em sb_team_match_stats")


def main():
    print(f"[ingest_statsbomb] Lendo CSVs de: {CSV_DIR}")
    conn = get_connection()
    init_schema(conn)

    ingest_matches(conn)
    ingest_artilheiros(conn)
    ingest_brasil_campanha(conn)
    ingest_ranking_times(conn)
    ingest_team_match_stats(conn)

    conn.close()
    print("[ingest_statsbomb] Concluído! Dados StatsBomb Copa 2022 disponíveis no banco.")


if __name__ == "__main__":
    main()