from __future__ import annotations

import sqlite3
from pathlib import Path

from fastapi import APIRouter

router = APIRouter()

DB_PATH = Path(__file__).resolve().parents[2] / "data" / "fbref_brasileirao.db"


def query(sql: str, params: tuple = ()) -> list[dict]:
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row

    try:
        rows = conn.execute(sql, params).fetchall()
        return [dict(row) for row in rows]
    finally:
        conn.close()


@router.get("/api/brasileirao/summary")
def brasileirao_summary():
    standings = query("SELECT COUNT(*) AS total_teams FROM fbref_standings")
    matches = query("SELECT COUNT(*) AS total_matches FROM fbref_schedule")

    goals = query("""
        SELECT
            SUM(goals_for) AS total_goals
        FROM fbref_standings
    """)

    leader = query("""
        SELECT
            position,
            team,
            points,
            wins,
            goal_difference
        FROM fbref_standings
        ORDER BY position ASC
        LIMIT 1
    """)

    most_shots_against = query("""
        SELECT
            REPLACE(team, 'vs ', '') AS team,
            standard_sh AS shots_against
        FROM fbref_opponent_shooting
        ORDER BY standard_sh DESC
        LIMIT 1
    """)

    return {
        "season": 2026,
        "competition": "Campeonato Brasileiro Série A",
        "source": "FBref/SoccerData",
        "total_teams": standings[0]["total_teams"] if standings else 0,
        "total_matches": matches[0]["total_matches"] if matches else 0,
        "total_goals": goals[0]["total_goals"] if goals else 0,
        "leader": leader[0] if leader else None,
        "most_shots_against": most_shots_against[0] if most_shots_against else None,
        "xg_available": False,
        "xg_note": "As tabelas extraídas do FBref/SoccerData para o Brasileirão 2026 não trouxeram coluna de xG.",
    }


@router.get("/api/brasileirao/standings")
def brasileirao_standings():
    rows = query("""
        SELECT
            position,
            team,
            matches,
            wins,
            draws,
            losses,
            goals_for,
            goals_against,
            goal_difference,
            points
        FROM fbref_standings
        ORDER BY position ASC
    """)

    return {"standings": rows}


@router.get("/api/brasileirao/matches")
def brasileirao_matches(limit: int = 380, team: str | None = None):
    params = []

    sql = """
        SELECT
            league,
            season,
            game,
            week,
            day,
            date,
            time,
            home_team,
            score,
            away_team,
            attendance,
            venue,
            referee,
            match_report,
            game_id
        FROM fbref_schedule
        WHERE 1 = 1
    """

    if team:
        sql += " AND (home_team = ? OR away_team = ?)"
        params.extend([team, team])

    sql += " ORDER BY date ASC, time ASC LIMIT ?"
    params.append(limit)

    rows = query(sql, tuple(params))

    return {"matches": rows}


@router.get("/api/brasileirao/shooting-against")
def brasileirao_shooting_against():
    rows = query("""
        SELECT
            REPLACE(team, 'vs ', '') AS team,
            standard_sh AS shots_against,
            "90s" AS nineties
        FROM fbref_opponent_shooting
        ORDER BY standard_sh DESC
    """)

    return {"shooting_against": rows}


@router.get("/api/brasileirao/team-shooting")
def brasileirao_team_shooting():
    rows = query("""
        SELECT
            team,
            "90s" AS nineties,
            standard_gls AS goals,
            standard_sh AS shots,
            standard_sot AS shots_on_target,
            standard_sh - standard_sot AS shots_not_on_target,
            ROUND(
                CASE
                    WHEN standard_sh > 0 THEN standard_sot * 100.0 / standard_sh
                    ELSE 0
                END,
                1
            ) AS shot_accuracy,
            standard_sh_90 AS shots_per90,
            standard_sot_90 AS shots_on_target_per90
        FROM fbref_team_shooting
        ORDER BY standard_sh DESC
    """)

    return {"teams": rows}


@router.get("/api/brasileirao/player-shooting")
def brasileirao_player_shooting(limit: int = 1000):
    rows = query("""
        SELECT
            team,
            player,
            "90s" AS nineties,
            standard_gls AS goals,
            standard_sh AS shots,
            standard_sot AS shots_on_target,
            standard_sh - standard_sot AS shots_not_on_target,
            ROUND(
                CASE
                    WHEN standard_sh > 0 THEN standard_sot * 100.0 / standard_sh
                    ELSE 0
                END,
                1
            ) AS shot_accuracy,
            standard_sh_90 AS shots_per90,
            standard_sot_90 AS shots_on_target_per90
        FROM fbref_player_shooting
        ORDER BY standard_sh DESC
        LIMIT ?
    """, (limit,))

    return {
        "players": rows,
        "xg_available": False,
        "note": "xG indisponivel nas tabelas de jogadores extraidas para o Brasileirao 2026.",
    }
