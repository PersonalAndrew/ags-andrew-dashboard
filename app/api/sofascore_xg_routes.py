from __future__ import annotations

import sqlite3
from pathlib import Path
from typing import Any

from fastapi import APIRouter, HTTPException, Query

router = APIRouter(prefix="/api/sofascore/xg", tags=["SofaScore xG"])

PROJECT_ROOT = Path(__file__).resolve().parents[2]
DB_PATH = PROJECT_ROOT / "data" / "sofascore_xg.db"


def get_connection() -> sqlite3.Connection:
    if not DB_PATH.exists():
        raise HTTPException(
            status_code=404,
            detail="Base xG SofaScore nao encontrada. Rode: uv run python scripts/build_sofascore_xg.py",
        )

    con = sqlite3.connect(DB_PATH)
    con.row_factory = sqlite3.Row
    return con


def rows_to_dicts(rows: list[sqlite3.Row]) -> list[dict[str, Any]]:
    return [dict(row) for row in rows]


def round_numbers(row: dict[str, Any]) -> dict[str, Any]:
    rounded = {}

    for key, value in row.items():
        if isinstance(value, float):
            rounded[key] = round(value, 3)
        else:
            rounded[key] = value

    return rounded


def clean_rows(rows: list[dict[str, Any]]) -> list[dict[str, Any]]:
    return [round_numbers(row) for row in rows]


@router.get("/summary")
def xg_summary() -> dict[str, Any]:
    with get_connection() as con:
        total_shots = con.execute("SELECT COUNT(*) AS total FROM sofascore_xg_shots").fetchone()["total"]
        total_matches = con.execute("SELECT COUNT(*) AS total FROM sofascore_xg_matches").fetchone()["total"]
        total_teams = con.execute("SELECT COUNT(*) AS total FROM sofascore_xg_teams").fetchone()["total"]
        total_players = con.execute("SELECT COUNT(*) AS total FROM sofascore_xg_players").fetchone()["total"]

        leader_xg = con.execute(
            """
            SELECT team, xg_for, goals_for, xg_against, xg_difference
            FROM sofascore_xg_teams
            ORDER BY xg_for DESC
            LIMIT 1
            """
        ).fetchone()

        leader_xg_diff = con.execute(
            """
            SELECT team, xg_for, xg_against, xg_difference
            FROM sofascore_xg_teams
            ORDER BY xg_difference DESC
            LIMIT 1
            """
        ).fetchone()

        top_player = con.execute(
            """
            SELECT player, team, shots, goals, xg, xgot, goals_minus_xg
            FROM sofascore_xg_players
            ORDER BY xg DESC
            LIMIT 1
            """
        ).fetchone()

        best_finisher = con.execute(
            """
            SELECT player, team, shots, goals, xg, goals_minus_xg
            FROM sofascore_xg_players
            WHERE shots >= 3
            ORDER BY goals_minus_xg DESC
            LIMIT 1
            """
        ).fetchone()

    return {
        "source": "SofaScore shotmap",
        "competition": "World Championship 2026",
        "total_shots": total_shots,
        "total_matches": total_matches,
        "total_teams": total_teams,
        "total_players": total_players,
        "leader_xg": round_numbers(dict(leader_xg)) if leader_xg else None,
        "leader_xg_difference": round_numbers(dict(leader_xg_diff)) if leader_xg_diff else None,
        "top_player_xg": round_numbers(dict(top_player)) if top_player else None,
        "best_finisher": round_numbers(dict(best_finisher)) if best_finisher else None,
        "metrics": {
            "xg": "Expected Goals: qualidade das chances criadas.",
            "xgot": "Expected Goals on Target: qualidade das finalizacoes que foram no alvo.",
            "goals_minus_xg": "Gols marcados menos xG. Indica finalizacao acima ou abaixo do esperado.",
            "xg_difference": "xG criado menos xG concedido.",
        },
    }


@router.get("/teams")
def xg_teams(
    limit: int = Query(48, ge=1, le=100),
    order_by: str = Query("xg_for"),
) -> dict[str, Any]:
    allowed_order = {
        "xg_for",
        "xg_against",
        "xg_difference",
        "goals_for",
        "goals_minus_xg",
        "shots_for",
        "xgot_for",
    }

    if order_by not in allowed_order:
        raise HTTPException(status_code=400, detail=f"order_by invalido: {order_by}")

    direction = "ASC" if order_by == "xg_against" else "DESC"

    with get_connection() as con:
        rows = con.execute(
            f"""
            SELECT
                team,
                matches,
                shots_for,
                goals_for,
                shots_on_target_for,
                xg_for,
                xgot_for,
                shots_against,
                goals_against,
                xg_against,
                xgot_against,
                xg_difference,
                goals_minus_xg,
                shot_accuracy_for
            FROM sofascore_xg_teams
            ORDER BY {order_by} {direction}
            LIMIT ?
            """,
            (limit,),
        ).fetchall()

    return {
        "order_by": order_by,
        "teams": clean_rows(rows_to_dicts(rows)),
    }


@router.get("/players")
def xg_players(
    team: str | None = Query(None),
    search: str | None = Query(None),
    limit: int = Query(50, ge=1, le=500),
    order_by: str = Query("xg"),
) -> dict[str, Any]:
    allowed_order = {
        "xg",
        "xgot",
        "goals",
        "goals_minus_xg",
        "shots",
        "xg_per_shot",
        "shot_accuracy",
    }

    if order_by not in allowed_order:
        raise HTTPException(status_code=400, detail=f"order_by invalido: {order_by}")

    where = []
    params: list[Any] = []

    if team:
        where.append("team = ?")
        params.append(team)

    if search:
        where.append("LOWER(player) LIKE LOWER(?)")
        params.append(f"%{search}%")

    where_sql = f"WHERE {' AND '.join(where)}" if where else ""

    with get_connection() as con:
        rows = con.execute(
            f"""
            SELECT
                team,
                player_id,
                player,
                matches,
                shots,
                goals,
                shots_on_target,
                xg,
                xgot,
                xg_per_shot,
                goals_minus_xg,
                xgot_minus_xg,
                shot_accuracy
            FROM sofascore_xg_players
            {where_sql}
            ORDER BY {order_by} DESC
            LIMIT ?
            """,
            (*params, limit),
        ).fetchall()

    return {
        "team": team,
        "search": search,
        "order_by": order_by,
        "players": clean_rows(rows_to_dicts(rows)),
    }


@router.get("/matches")
def xg_matches(
    team: str | None = Query(None),
    limit: int = Query(90, ge=1, le=200),
) -> dict[str, Any]:
    where = []
    params: list[Any] = []

    if team:
        where.append("(home_team = ? OR away_team = ?)")
        params.extend([team, team])

    where_sql = f"WHERE {' AND '.join(where)}" if where else ""

    with get_connection() as con:
        rows = con.execute(
            f"""
            SELECT
                match_id,
                date,
                round,
                home_team,
                away_team,
                home_score,
                away_score,
                home_shots,
                away_shots,
                home_goals,
                away_goals,
                home_xg,
                away_xg,
                home_xgot,
                away_xgot
            FROM sofascore_xg_matches
            {where_sql}
            ORDER BY date ASC, match_id ASC
            LIMIT ?
            """,
            (*params, limit),
        ).fetchall()

    return {
        "team": team,
        "matches": clean_rows(rows_to_dicts(rows)),
    }


@router.get("/shots")
def xg_shots(
    match_id: str | None = Query(None),
    team: str | None = Query(None),
    player: str | None = Query(None),
    limit: int = Query(300, ge=1, le=2000),
) -> dict[str, Any]:
    where = []
    params: list[Any] = []

    if match_id:
        where.append("match_id = ?")
        params.append(match_id)

    if team:
        where.append("team = ?")
        params.append(team)

    if player:
        where.append("LOWER(player) LIKE LOWER(?)")
        params.append(f"%{player}%")

    where_sql = f"WHERE {' AND '.join(where)}" if where else ""

    with get_connection() as con:
        rows = con.execute(
            f"""
            SELECT
                match_id,
                date,
                home_team,
                away_team,
                team,
                opponent,
                is_home,
                player_id,
                player,
                shot_type,
                situation,
                body_part,
                time,
                added_time,
                x,
                y,
                z,
                xg,
                xgot,
                is_goal,
                is_on_target
            FROM sofascore_xg_shots
            {where_sql}
            ORDER BY date ASC, match_id ASC, time ASC
            LIMIT ?
            """,
            (*params, limit),
        ).fetchall()

    return {
        "match_id": match_id,
        "team": team,
        "player": player,
        "shots": clean_rows(rows_to_dicts(rows)),
    }