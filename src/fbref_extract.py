from __future__ import annotations

import argparse
import json
import re
import sqlite3
import sys
import unicodedata
from pathlib import Path

import pandas as pd


PROJECT_ROOT = Path(__file__).resolve().parents[1]
PARQUET_DIR = PROJECT_ROOT / "data" / "parquet"
SQLITE_PATH = PROJECT_ROOT / "data" / "fbref_brasileirao.db"

LEAGUE_KEY = "BRA-Serie A"
LEAGUE_CONFIG = {
    "FBref": "Campeonato Brasileiro Série A",
    "season_start": "Apr",
    "season_end": "Dec",
}

DEFAULT_SEASON = 2026

AVAILABLE_TABLES = [
    "schedule",
    "standings",
    "team_standard",
    "team_shooting",
    "opponent_shooting",
    "player_standard",
    "player_shooting",
]


def ensure_brasileirao_league_config() -> None:
    """Garante que o SoccerData reconheça o Brasileirão Série A no FBref."""
    config_dir = Path.home() / "soccerdata" / "config"
    config_dir.mkdir(parents=True, exist_ok=True)

    config_path = config_dir / "league_dict.json"

    data = {}
    if config_path.exists():
        try:
            data = json.loads(config_path.read_text(encoding="utf-8-sig"))
        except json.JSONDecodeError:
            print(
                f"Aviso: {config_path} estava inválido. Recriando configuração.",
                file=sys.stderr,
            )
            data = {}

    data[LEAGUE_KEY] = LEAGUE_CONFIG

    config_path.write_text(
        json.dumps(data, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )


ensure_brasileirao_league_config()

import soccerdata as sd  # noqa: E402


def slugify(value: object) -> str:
    text = str(value)
    text = unicodedata.normalize("NFKD", text)
    text = text.encode("ascii", "ignore").decode("ascii")
    text = re.sub(r"[^0-9a-zA-Z]+", "_", text)
    text = text.strip("_").lower()
    return text or "coluna"


def dedupe_columns(columns: list[str]) -> list[str]:
    seen: dict[str, int] = {}
    output = []

    for col in columns:
        if col not in seen:
            seen[col] = 0
            output.append(col)
            continue

        seen[col] += 1
        output.append(f"{col}_{seen[col]}")

    return output


def normalize_dataframe(df: pd.DataFrame) -> pd.DataFrame:
    out = df.copy().reset_index()

    normalized_columns = []
    for col in out.columns:
        if isinstance(col, tuple):
            parts = [
                str(part)
                for part in col
                if part is not None and str(part).strip() and str(part) != "nan"
            ]
            col_name = "_".join(parts)
        else:
            col_name = str(col)

        normalized_columns.append(slugify(col_name))

    out.columns = dedupe_columns(normalized_columns)

    for col in out.columns:
        if out[col].dtype == "object":
            out[col] = out[col].map(
                lambda value: json.dumps(value, ensure_ascii=False)
                if isinstance(value, (dict, list))
                else value
            )

    return out


def parse_score(score: object) -> tuple[int, int] | None:
    if score is None or pd.isna(score):
        return None

    text = str(score).strip()
    parts = re.split(r"\s*[–-]\s*", text)

    if len(parts) != 2:
        return None

    try:
        return int(parts[0]), int(parts[1])
    except ValueError:
        return None


def build_standings(schedule: pd.DataFrame) -> pd.DataFrame:
    table: dict[str, dict[str, int | str]] = {}

    def ensure_team(team: str) -> None:
        if team not in table:
            table[team] = {
                "team": team,
                "matches": 0,
                "wins": 0,
                "draws": 0,
                "losses": 0,
                "goals_for": 0,
                "goals_against": 0,
                "goal_difference": 0,
                "points": 0,
            }

    data = schedule.reset_index()

    for _, row in data.iterrows():
        home = row.get("home_team")
        away = row.get("away_team")
        parsed = parse_score(row.get("score"))

        if not home or not away or parsed is None:
            continue

        home_goals, away_goals = parsed
        home = str(home)
        away = str(away)

        ensure_team(home)
        ensure_team(away)

        table[home]["matches"] += 1
        table[away]["matches"] += 1

        table[home]["goals_for"] += home_goals
        table[home]["goals_against"] += away_goals

        table[away]["goals_for"] += away_goals
        table[away]["goals_against"] += home_goals

        if home_goals > away_goals:
            table[home]["wins"] += 1
            table[home]["points"] += 3
            table[away]["losses"] += 1
        elif home_goals < away_goals:
            table[away]["wins"] += 1
            table[away]["points"] += 3
            table[home]["losses"] += 1
        else:
            table[home]["draws"] += 1
            table[away]["draws"] += 1
            table[home]["points"] += 1
            table[away]["points"] += 1

    standings = pd.DataFrame(table.values())

    if standings.empty:
        return standings

    standings["goal_difference"] = (
        standings["goals_for"] - standings["goals_against"]
    )

    standings = standings.sort_values(
        by=["points", "wins", "goal_difference", "goals_for"],
        ascending=[False, False, False, False],
    ).reset_index(drop=True)

    standings.insert(0, "position", standings.index + 1)

    return standings


def save_table(name: str, df: pd.DataFrame, season: int) -> None:
    PARQUET_DIR.mkdir(parents=True, exist_ok=True)

    normalized = normalize_dataframe(df)

    parquet_path = PARQUET_DIR / f"brasileirao_{season}_{name}.parquet"
    sqlite_table = f"fbref_{name}"

    normalized.to_parquet(parquet_path, index=False)

    with sqlite3.connect(SQLITE_PATH) as conn:
        normalized.to_sql(sqlite_table, conn, if_exists="replace", index=False)

    print(f"[OK] {name}")
    print(f"     linhas: {len(normalized)}")
    print(f"     parquet: {parquet_path.relative_to(PROJECT_ROOT)}")
    print(f"     sqlite: {SQLITE_PATH.relative_to(PROJECT_ROOT)} :: {sqlite_table}")


def extract_table(reader: sd.FBref, table_name: str) -> pd.DataFrame:
    if table_name == "schedule":
        return reader.read_schedule()

    if table_name == "team_standard":
        return reader.read_team_season_stats(stat_type="standard")

    if table_name == "team_shooting":
        return reader.read_team_season_stats(stat_type="shooting")

    if table_name == "opponent_shooting":
        return reader.read_team_season_stats(
            stat_type="shooting",
            opponent_stats=True,
        )

    if table_name == "player_standard":
        return reader.read_player_season_stats(stat_type="standard")

    if table_name == "player_shooting":
        return reader.read_player_season_stats(stat_type="shooting")

    raise ValueError(f"Tabela não suportada: {table_name}")


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Extrai dados do Brasileirão Série A via FBref/SoccerData."
    )

    parser.add_argument(
        "--season",
        type=int,
        default=DEFAULT_SEASON,
        help="Temporada do Brasileirão. Padrão: 2026.",
    )

    parser.add_argument(
        "--tables",
        nargs="+",
        default=["schedule", "standings"],
        choices=AVAILABLE_TABLES,
        help="Tabelas para extrair.",
    )

    parser.add_argument(
        "--all",
        action="store_true",
        help="Extrai todas as tabelas principais.",
    )

    parser.add_argument(
        "--list-tables",
        action="store_true",
        help="Lista as tabelas disponíveis e encerra.",
    )

    args = parser.parse_args()

    if args.list_tables:
        print("Tabelas disponíveis:")
        for table in AVAILABLE_TABLES:
            print(f"- {table}")
        return

    tables = AVAILABLE_TABLES if args.all else args.tables

    print("=== FBref Brasileirão Série A ===")
    print(f"Liga: {LEAGUE_KEY}")
    print(f"Temporada: {args.season}")
    print(f"Tabelas: {', '.join(tables)}")
    print()

    reader = sd.FBref(leagues=LEAGUE_KEY, seasons=args.season)

    schedule_cache: pd.DataFrame | None = None
    failed: list[str] = []

    for table_name in tables:
        try:
            if table_name == "standings":
                if schedule_cache is None:
                    schedule_cache = reader.read_schedule()

                df = build_standings(schedule_cache)
            else:
                df = extract_table(reader, table_name)

                if table_name == "schedule":
                    schedule_cache = df

            save_table(table_name, df, args.season)
            print()

        except Exception as exc:
            failed.append(table_name)
            print(f"[ERRO] {table_name}: {exc}")
            print()

    if failed:
        print("Tabelas com erro:")
        for table in failed:
            print(f"- {table}")
        raise SystemExit(1)

    print("Extração finalizada com sucesso.")


if __name__ == "__main__":
    main()