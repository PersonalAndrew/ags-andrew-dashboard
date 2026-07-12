from __future__ import annotations

import json
import sqlite3
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

import pandas as pd

PROJECT_ROOT = Path(__file__).resolve().parents[1]

SOFASCORE_DIR = PROJECT_ROOT / "data" / "sofascore"
SHOTMAP_DIR = SOFASCORE_DIR / "shotmap"
MATCHES_FILE = SOFASCORE_DIR / "matches" / "worldcup_2026_matches.json"

PARQUET_DIR = PROJECT_ROOT / "data" / "parquet"
SQLITE_PATH = PROJECT_ROOT / "data" / "sofascore_xg.db"


def read_json(path: Path) -> Any:
    return json.loads(path.read_text(encoding="utf-8"))


def as_float(value: Any, default: float = 0.0) -> float:
    if value is None:
        return default

    try:
        return float(value)
    except (TypeError, ValueError):
        return default


def as_int(value: Any, default: int = 0) -> int:
    if value is None:
        return default

    try:
        return int(value)
    except (TypeError, ValueError):
        return default


def team_name(team: dict | None) -> str | None:
    if not isinstance(team, dict):
        return None

    return (
        team.get("name")
        or team.get("shortName")
        or team.get("slug")
        or None
    )


def score_value(score: Any) -> int | None:
    if isinstance(score, dict):
        for key in ["current", "normaltime", "display", "period1"]:
            if key in score and score[key] is not None:
                return as_int(score[key], default=0)

    if score is None:
        return None

    return as_int(score, default=0)


def timestamp_to_date(value: Any) -> str | None:
    if value is None:
        return None

    try:
        ts = int(value)
    except (TypeError, ValueError):
        return None

    return datetime.fromtimestamp(ts, tz=timezone.utc).date().isoformat()


def walk_dicts(obj: Any):
    if isinstance(obj, dict):
        yield obj

        for value in obj.values():
            yield from walk_dicts(value)

    elif isinstance(obj, list):
        for item in obj:
            yield from walk_dicts(item)


def build_match_metadata() -> dict[str, dict]:
    if not MATCHES_FILE.exists():
        raise FileNotFoundError(f"Arquivo de partidas nao encontrado: {MATCHES_FILE}")

    data = read_json(MATCHES_FILE)
    metadata: dict[str, dict] = {}

    # Formato normalizado do projeto:
    # data/sofascore/matches/worldcup_2026_matches.json
    if isinstance(data, list):
        for item in data:
            if not isinstance(item, dict):
                continue

            match_id = item.get("match_id") or item.get("id") or item.get("eventId")

            if match_id is None:
                continue

            home_name = item.get("home_team") or item.get("homeTeam")
            away_name = item.get("away_team") or item.get("awayTeam")

            if isinstance(home_name, dict):
                home_name = team_name(home_name)

            if isinstance(away_name, dict):
                away_name = team_name(away_name)

            if not home_name or not away_name:
                continue

            metadata[str(match_id)] = {
                "match_id": str(match_id),
                "home_team": home_name,
                "away_team": away_name,
                "home_score": item.get("home_score"),
                "away_score": item.get("away_score"),
                "start_date": (
                    str(item.get("start_datetime_utc"))[:10]
                    if item.get("start_datetime_utc")
                    else timestamp_to_date(item.get("start_timestamp"))
                ),
                "status": item.get("status") or item.get("status_type"),
                "tournament": item.get("tournament_name"),
                "round": item.get("round") or item.get("round_number"),
            }

        return metadata

    # Fallback para formato bruto da API SofaScore, caso usemos no futuro
    for item in walk_dicts(data):
        event_id = item.get("id") or item.get("eventId") or item.get("match_id")

        if event_id is None:
            continue

        home_team = item.get("homeTeam") or item.get("home_team")
        away_team = item.get("awayTeam") or item.get("away_team")

        if not home_team or not away_team:
            continue

        home_name = team_name(home_team) if isinstance(home_team, dict) else str(home_team)
        away_name = team_name(away_team) if isinstance(away_team, dict) else str(away_team)

        match_id = str(event_id)

        metadata[match_id] = {
            "match_id": match_id,
            "home_team": home_name,
            "away_team": away_name,
            "home_score": score_value(item.get("homeScore") or item.get("home_score")),
            "away_score": score_value(item.get("awayScore") or item.get("away_score")),
            "start_date": timestamp_to_date(item.get("startTimestamp") or item.get("start_timestamp")),
            "status": (item.get("status") or {}).get("description") if isinstance(item.get("status"), dict) else item.get("status"),
            "tournament": team_name(item.get("tournament")) if isinstance(item.get("tournament"), dict) else item.get("tournament_name"),
            "round": (item.get("roundInfo") or {}).get("round") if isinstance(item.get("roundInfo"), dict) else item.get("round_number"),
        }

    return metadata


def extract_shots(match_metadata: dict[str, dict]) -> pd.DataFrame:
    records: list[dict] = []

    for path in sorted(SHOTMAP_DIR.glob("*.json")):
        match_id = path.stem
        data = read_json(path)

        shots = data.get("shotmap") if isinstance(data, dict) else data

        if not isinstance(shots, list):
            continue

        meta = match_metadata.get(match_id, {})
        home_team = meta.get("home_team")
        away_team = meta.get("away_team")

        for index, shot in enumerate(shots, start=1):
            if not isinstance(shot, dict):
                continue

            player = shot.get("player") if isinstance(shot.get("player"), dict) else {}
            coordinates = shot.get("playerCoordinates") if isinstance(shot.get("playerCoordinates"), dict) else {}

            is_home = bool(shot.get("isHome"))
            team = home_team if is_home else away_team
            opponent = away_team if is_home else home_team

            shot_type = shot.get("shotType")
            xg = as_float(shot.get("xg", shot.get("expectedGoals")))
            xgot = as_float(shot.get("xgot", shot.get("expectedGoalsOnTarget")))

            is_goal = 1 if shot_type == "goal" else 0
            is_on_target = 1 if (xgot > 0 or shot_type in {"goal", "save"}) else 0

            records.append(
                {
                    "match_id": match_id,
                    "shot_index": index,
                    "date": meta.get("start_date"),
                    "tournament": meta.get("tournament"),
                    "round": meta.get("round"),
                    "home_team": home_team,
                    "away_team": away_team,
                    "home_score": meta.get("home_score"),
                    "away_score": meta.get("away_score"),
                    "team": team,
                    "opponent": opponent,
                    "is_home": is_home,
                    "player_id": player.get("id"),
                    "player": player.get("name") or player.get("shortName"),
                    "player_short_name": player.get("shortName"),
                    "shot_type": shot_type,
                    "situation": shot.get("situation"),
                    "body_part": shot.get("bodyPart"),
                    "time": shot.get("time"),
                    "added_time": shot.get("addedTime"),
                    "x": coordinates.get("x"),
                    "y": coordinates.get("y"),
                    "z": coordinates.get("z"),
                    "xg": xg,
                    "xgot": xgot,
                    "is_goal": is_goal,
                    "is_on_target": is_on_target,
                }
            )

    return pd.DataFrame(records)


def aggregate_players(shots: pd.DataFrame) -> pd.DataFrame:
    if shots.empty:
        return pd.DataFrame()

    grouped = (
        shots
        .groupby(["team", "player_id", "player"], dropna=False)
        .agg(
            matches=("match_id", "nunique"),
            shots=("shot_index", "count"),
            goals=("is_goal", "sum"),
            shots_on_target=("is_on_target", "sum"),
            xg=("xg", "sum"),
            xgot=("xgot", "sum"),
        )
        .reset_index()
    )

    grouped["xg_per_shot"] = grouped["xg"] / grouped["shots"]
    grouped["goals_minus_xg"] = grouped["goals"] - grouped["xg"]
    grouped["xgot_minus_xg"] = grouped["xgot"] - grouped["xg"]
    grouped["shot_accuracy"] = grouped["shots_on_target"] * 100 / grouped["shots"]

    return grouped.sort_values(["xg", "goals", "shots"], ascending=False)


def aggregate_teams(shots: pd.DataFrame) -> pd.DataFrame:
    if shots.empty:
        return pd.DataFrame()

    attack = (
        shots
        .groupby("team", dropna=False)
        .agg(
            matches=("match_id", "nunique"),
            shots_for=("shot_index", "count"),
            goals_for=("is_goal", "sum"),
            shots_on_target_for=("is_on_target", "sum"),
            xg_for=("xg", "sum"),
            xgot_for=("xgot", "sum"),
        )
        .reset_index()
    )

    defense = (
        shots
        .groupby("opponent", dropna=False)
        .agg(
            shots_against=("shot_index", "count"),
            goals_against=("is_goal", "sum"),
            shots_on_target_against=("is_on_target", "sum"),
            xg_against=("xg", "sum"),
            xgot_against=("xgot", "sum"),
        )
        .reset_index()
        .rename(columns={"opponent": "team"})
    )

    teams = attack.merge(defense, on="team", how="left")

    teams["xg_difference"] = teams["xg_for"] - teams["xg_against"]
    teams["goals_minus_xg"] = teams["goals_for"] - teams["xg_for"]
    teams["shot_accuracy_for"] = teams["shots_on_target_for"] * 100 / teams["shots_for"]

    return teams.sort_values(["xg_for", "goals_for"], ascending=False)


def aggregate_matches(shots: pd.DataFrame) -> pd.DataFrame:
    if shots.empty:
        return pd.DataFrame()

    rows = []

    for match_id, group in shots.groupby("match_id"):
        first = group.iloc[0]

        home_team = first["home_team"]
        away_team = first["away_team"]

        home = group[group["team"] == home_team]
        away = group[group["team"] == away_team]

        rows.append(
            {
                "match_id": match_id,
                "date": first["date"],
                "round": first["round"],
                "home_team": home_team,
                "away_team": away_team,
                "home_score": first["home_score"],
                "away_score": first["away_score"],
                "home_shots": len(home),
                "away_shots": len(away),
                "home_goals": int(home["is_goal"].sum()),
                "away_goals": int(away["is_goal"].sum()),
                "home_xg": float(home["xg"].sum()),
                "away_xg": float(away["xg"].sum()),
                "home_xgot": float(home["xgot"].sum()),
                "away_xgot": float(away["xgot"].sum()),
            }
        )

    return pd.DataFrame(rows).sort_values(["date", "match_id"], na_position="last")



def prepare_for_storage(df: pd.DataFrame) -> pd.DataFrame:
    clean = df.copy()

    text_columns = [
        "match_id",
        "date",
        "tournament",
        "round",
        "home_team",
        "away_team",
        "team",
        "opponent",
        "player",
        "player_short_name",
        "shot_type",
        "situation",
        "body_part",
    ]

    for column in text_columns:
        if column in clean.columns:
            clean[column] = clean[column].astype("string")

    return clean


def save_outputs(
    shots: pd.DataFrame,
    players: pd.DataFrame,
    teams: pd.DataFrame,
    matches: pd.DataFrame,
) -> None:
    PARQUET_DIR.mkdir(parents=True, exist_ok=True)

    outputs = {
        "sofascore_xg_shots": shots,
        "sofascore_xg_players": players,
        "sofascore_xg_teams": teams,
        "sofascore_xg_matches": matches,
    }

    with sqlite3.connect(SQLITE_PATH) as con:
        for name, df in outputs.items():
            parquet_path = PARQUET_DIR / f"{name}.parquet"
            clean_df = prepare_for_storage(df)

            clean_df.to_parquet(parquet_path, index=False)
            clean_df.to_sql(name, con, if_exists="replace", index=False)

            print(f"[OK] {name}")
            print(f"     linhas: {len(clean_df)}")
            print(f"     parquet: {parquet_path.relative_to(PROJECT_ROOT)}")
            print(f"     sqlite: {SQLITE_PATH.relative_to(PROJECT_ROOT)} :: {name}")


def main() -> None:
    print("=== SofaScore xG Builder ===")

    match_metadata = build_match_metadata()
    print(f"Partidas com metadados: {len(match_metadata)}")

    shots = extract_shots(match_metadata)
    print(f"Finalizacoes extraidas: {len(shots)}")

    if shots.empty:
        raise SystemExit("Nenhuma finalizacao encontrada.")

    missing_team_mask = shots["team"].isna() | (shots["team"].astype(str).str.strip() == "")
    missing_team = int(missing_team_mask.sum())

    if missing_team:
        ignored_match_ids = sorted(shots.loc[missing_team_mask, "match_id"].astype(str).unique().tolist())
        print(f"[AVISO] Finalizacoes sem time identificado removidas da base final: {missing_team}")
        print(f"[AVISO] Match IDs ignorados: {', '.join(ignored_match_ids)}")

    shots = shots.loc[~missing_team_mask].copy()

    players = aggregate_players(shots)
    teams = aggregate_teams(shots)
    matches = aggregate_matches(shots)

    save_outputs(shots, players, teams, matches)

    print("\nTop 10 selecoes por xG:")
    print(
        teams[["team", "xg_for", "goals_for", "xg_against", "xg_difference"]]
        .head(10)
        .to_string(index=False)
    )

    print("\nTop 10 jogadores por xG:")
    print(
        players[["player", "team", "shots", "goals", "xg", "xgot"]]
        .head(10)
        .to_string(index=False)
    )

    print("\nBuild finalizado com sucesso.")


if __name__ == "__main__":
    main()