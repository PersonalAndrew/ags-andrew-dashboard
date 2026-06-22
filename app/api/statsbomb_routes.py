"""
Rotas da API para os dados StatsBomb (Copa do Mundo 2022).
Não interfere nas rotas do SofaScore em routes.py.
"""

import os
import sqlite3
from pathlib import Path
from fastapi import APIRouter

router = APIRouter()

DB_PATH = os.path.join(
    os.path.dirname(os.path.dirname(os.path.dirname(__file__))),
    "data",
    "sofascore.db"
)

AVG_DB_PATH = Path(__file__).resolve().parents[2] / "data" / "sofascore.db"


def query(sql, params=()):
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    try:
        rows = conn.execute(sql, params).fetchall()
        return [dict(r) for r in rows]
    finally:
        conn.close()


# ============================
# PARTIDAS
# ============================

@router.get("/api/statsbomb/matches")
def list_sb_matches(team: str | None = None, stage: str | None = None):
    sql = "SELECT * FROM sb_matches WHERE 1=1"
    params = []

    if team:
        sql += " AND (home_team = ? OR away_team = ?)"
        params.extend([team, team])

    if stage:
        sql += " AND competition_stage = ?"
        params.append(stage)

    sql += " ORDER BY match_date"

    return {"matches": query(sql, params)}


@router.get("/api/statsbomb/matches/{match_id}")
def get_sb_match(match_id: int):
    rows = query("SELECT * FROM sb_matches WHERE match_id = ?", (match_id,))
    return {"match": rows[0] if rows else None}


# ============================
# ARTILHEIROS / BRASIL / RANKING
# ============================

@router.get("/api/statsbomb/artilheiros")
def list_artilheiros(limit: int = 10):
    rows = query(
        "SELECT player, team, gols FROM sb_artilheiros ORDER BY gols DESC LIMIT ?",
        (limit,)
    )

    return {"artilheiros": rows}


@router.get("/api/statsbomb/brasil-campanha")
def get_brasil_campanha():
    rows = query("SELECT * FROM sb_brasil_campanha ORDER BY match_date")
    return {"campanha": rows}


@router.get("/api/statsbomb/ranking")
def get_ranking(order_by: str = "gols", limit: int = 32):
    allowed = {
        "gols",
        "xg",
        "chutes",
        "jogos",
        "xg_diff",
        "chutes_no_gol"
    }

    if order_by not in allowed:
        order_by = "gols"

    rows = query(
        f"SELECT * FROM sb_ranking_times ORDER BY {order_by} DESC LIMIT ?",
        (limit,)
    )

    return {"ranking": rows}


@router.get("/api/statsbomb/team-stats")
def get_team_match_stats(team: str | None = None, match_id: int | None = None):
    sql = "SELECT * FROM sb_team_match_stats WHERE 1=1"
    params = []

    if team:
        sql += " AND team = ?"
        params.append(team)

    if match_id:
        sql += " AND match_id = ?"
        params.append(match_id)

    sql += " ORDER BY match_date"

    return {"stats": query(sql, params)}


@router.get("/api/statsbomb/summary")
def get_summary():
    total_matches = query("SELECT COUNT(*) as c FROM sb_matches")[0]["c"]

    total_goals = query(
        "SELECT SUM(home_score) + SUM(away_score) as g FROM sb_matches"
    )[0]["g"]

    top_scorer = query(
        "SELECT player, team, gols FROM sb_artilheiros ORDER BY gols DESC LIMIT 1"
    )

    teams_count = query("SELECT COUNT(*) as c FROM sb_ranking_times")[0]["c"]

    return {
        "total_matches": total_matches,
        "total_goals": total_goals,
        "top_scorer": top_scorer[0] if top_scorer else None,
        "teams_count": teams_count,
    }


# ============================
# EVENTOS
# ============================

@router.get("/api/statsbomb/events")
def list_events(
    match_id: int | None = None,
    team: str | None = None,
    player: str | None = None,
    event_type: str | None = None,
    limit: int = 500
):
    sql = """
        SELECT
            match_id,
            event_id,
            event_index,
            period,
            minute,
            second,
            team,
            player,
            position,
            type,
            play_pattern,
            location_x,
            location_y,
            pass_end_x,
            pass_end_y,
            pass_recipient,
            pass_outcome,
            shot_xg,
            shot_outcome,
            shot_body_part,
            shot_technique,
            shot_type,
            dribble_outcome,
            duel_type,
            duel_outcome,
            foul_committed_card,
            foul_committed_type,
            under_pressure,
            timestamp
        FROM sb_events
        WHERE 1=1
    """

    params = []

    if match_id:
        sql += " AND match_id = ?"
        params.append(match_id)

    if team:
        sql += " AND team = ?"
        params.append(team)

    if player:
        sql += " AND player = ?"
        params.append(player)

    if event_type:
        sql += " AND type = ?"
        params.append(event_type)

    sql += " ORDER BY match_id, event_index LIMIT ?"
    params.append(limit)

    return {"events": query(sql, params)}


# ============================
# ESCALAÇÕES / JOGADORES
# ============================

@router.get("/api/statsbomb/lineups")
def get_lineups(match_id: int | None = None, team: str | None = None):
    sql = """
        SELECT
            match_id,
            team,
            formation,
            player_id,
            player_name,
            position_id,
            position_name,
            jersey_number
        FROM sb_lineups
        WHERE 1=1
    """

    params = []

    if match_id:
        sql += " AND match_id = ?"
        params.append(match_id)

    if team:
        sql += " AND team = ?"
        params.append(team)

    sql += " ORDER BY match_id, team, position_id"

    return {"lineups": query(sql, params)}


@router.get("/api/statsbomb/players")
def get_players(match_id: int | None = None, team: str | None = None):
    sql = """
        SELECT DISTINCT
            match_id,
            team,
            player_name AS player,
            player_id,
            position_name,
            jersey_number
        FROM sb_lineups
        WHERE 1=1
    """

    params = []

    if match_id:
        sql += " AND match_id = ?"
        params.append(match_id)

    if team:
        sql += " AND team = ?"
        params.append(team)

    sql += " ORDER BY team, jersey_number"

    return {"players": query(sql, params)}


# ============================
# RESUMO DOS JOGADORES
# ============================

@router.get("/api/statsbomb/player-summary")
def get_player_summary(
    match_id: int | None = None,
    team: str | None = None,
    player: str | None = None,
    limit: int = 100
):
    sql = """
        SELECT
            player,
            team,
            COUNT(*) AS total_events,
            SUM(CASE WHEN type = 'Pass' THEN 1 ELSE 0 END) AS passes,
            SUM(CASE WHEN type = 'Pass' AND pass_outcome IS NULL THEN 1 ELSE 0 END) AS passes_certos,
            SUM(CASE WHEN type = 'Shot' THEN 1 ELSE 0 END) AS chutes,
            SUM(CASE WHEN type = 'Shot' AND shot_outcome = 'Goal' THEN 1 ELSE 0 END) AS gols,
            ROUND(SUM(CASE WHEN type = 'Shot' THEN COALESCE(shot_xg, 0) ELSE 0 END), 3) AS xg,
            SUM(CASE WHEN type = 'Dribble' THEN 1 ELSE 0 END) AS dribles,
            SUM(CASE WHEN type = 'Dribble' AND dribble_outcome = 'Complete' THEN 1 ELSE 0 END) AS dribles_certos,
            SUM(CASE WHEN type = 'Foul Committed' THEN 1 ELSE 0 END) AS faltas_cometidas,
            SUM(CASE WHEN type = 'Foul Won' THEN 1 ELSE 0 END) AS faltas_sofridas,
            SUM(CASE WHEN under_pressure = 1 THEN 1 ELSE 0 END) AS acoes_sob_pressao
        FROM sb_events
        WHERE player IS NOT NULL
    """

    params = []

    if match_id:
        sql += " AND match_id = ?"
        params.append(match_id)

    if team:
        sql += " AND team = ?"
        params.append(team)

    if player:
        sql += " AND player = ?"
        params.append(player)

    sql += """
        GROUP BY player, team
        ORDER BY total_events DESC
        LIMIT ?
    """

    params.append(limit)

    return {"players": query(sql, params)}


# ============================
# CHUTES
# ============================

@router.get("/api/statsbomb/shotmap-data")
def get_shotmap_data(
    match_id: int | None = None,
    team: str | None = None,
    player: str | None = None
):
    sql = """
        SELECT
            match_id,
            team,
            player,
            minute,
            second,
            location_x,
            location_y,
            shot_xg,
            shot_outcome,
            shot_body_part,
            shot_technique,
            shot_type
        FROM sb_events
        WHERE type = 'Shot'
          AND location_x IS NOT NULL
          AND location_y IS NOT NULL
    """

    params = []

    if match_id:
        sql += " AND match_id = ?"
        params.append(match_id)

    if team:
        sql += " AND team = ?"
        params.append(team)

    if player:
        sql += " AND player = ?"
        params.append(player)

    sql += " ORDER BY match_id, minute, second"

    return {"shots": query(sql, params)}


# ============================
# PASSES
# ============================

@router.get("/api/statsbomb/passmap-data")
def get_passmap_data(
    match_id: int | None = None,
    team: str | None = None,
    player: str | None = None,
    only_completed: bool = True,
    limit: int = 1000
):
    sql = """
        SELECT
            match_id,
            team,
            player,
            minute,
            second,
            location_x,
            location_y,
            pass_end_x,
            pass_end_y,
            pass_recipient,
            pass_outcome,
            pass_length,
            pass_angle,
            pass_height,
            pass_body_part
        FROM sb_events
        WHERE type = 'Pass'
          AND location_x IS NOT NULL
          AND location_y IS NOT NULL
          AND pass_end_x IS NOT NULL
          AND pass_end_y IS NOT NULL
    """

    params = []

    if only_completed:
        sql += " AND pass_outcome IS NULL"

    if match_id:
        sql += " AND match_id = ?"
        params.append(match_id)

    if team:
        sql += " AND team = ?"
        params.append(team)

    if player:
        sql += " AND player = ?"
        params.append(player)

    sql += " ORDER BY match_id, minute, second LIMIT ?"
    params.append(limit)

    return {"passes": query(sql, params)}


# ============================
# POSIÇÃO MÉDIA DOS JOGADORES
# ============================

@router.get("/api/statsbomb/average-positions")
def get_average_positions(
    match_id: int,
    team: str | None = None,
    player: str | None = None,
    min_events: int = 3
):
    conn = sqlite3.connect(AVG_DB_PATH)
    conn.row_factory = sqlite3.Row
    cur = conn.cursor()

    sql = """
        SELECT
            e.player,
            e.player_id,
            e.team,
            e.team_id,
            MAX(e.position) AS position,
            AVG(e.location_x) AS avg_x,
            AVG(e.location_y) AS avg_y,
            COUNT(*) AS total_events,
            SUM(CASE WHEN e.type = 'Pass' THEN 1 ELSE 0 END) AS passes,
            SUM(CASE WHEN e.type = 'Shot' THEN 1 ELSE 0 END) AS shots,
            SUM(CASE WHEN e.type = 'Dribble' THEN 1 ELSE 0 END) AS dribbles,
            MAX(l.jersey_number) AS jersey_number
        FROM sb_events e
        LEFT JOIN sb_lineups l
            ON e.match_id = l.match_id
            AND e.player_id = l.player_id
            AND e.team = l.team
        WHERE e.match_id = ?
            AND e.player IS NOT NULL
            AND e.location_x IS NOT NULL
            AND e.location_y IS NOT NULL
            AND e.type NOT IN (
                'Starting XI',
                'Half Start',
                'Half End',
                'Substitution',
                'Tactical Shift'
            )
    """

    params = [match_id]

    if team:
        sql += " AND e.team = ?"
        params.append(team)

    if player:
        sql += " AND e.player = ?"
        params.append(player)

    sql += """
        GROUP BY
            e.player,
            e.player_id,
            e.team,
            e.team_id
        HAVING COUNT(*) >= ?
        ORDER BY
            e.team ASC,
            total_events DESC
    """

    params.append(min_events)

    rows = cur.execute(sql, params).fetchall()
    conn.close()

    return {
        "match_id": match_id,
        "team": team,
        "player": player,
        "positions": [dict(row) for row in rows]
    }


# ============================
# MAPA DE CALOR / HEATMAP
# ============================

@router.get("/api/statsbomb/heatmap-data")
def get_heatmap_data(
    match_id: int,
    team: str | None = None,
    player: str | None = None,
    event_type: str | None = None,
    limit: int = 5000
):
    sql = """
        SELECT
            match_id,
            team,
            player,
            type,
            minute,
            second,
            location_x,
            location_y,
            under_pressure
        FROM sb_events
        WHERE match_id = ?
          AND player IS NOT NULL
          AND location_x IS NOT NULL
          AND location_y IS NOT NULL
          AND type NOT IN (
              'Starting XI',
              'Half Start',
              'Half End',
              'Substitution',
              'Tactical Shift'
          )
    """

    params = [match_id]

    if team:
        sql += " AND team = ?"
        params.append(team)

    if player:
        sql += " AND player = ?"
        params.append(player)

    if event_type:
        sql += " AND type = ?"
        params.append(event_type)

    sql += """
        ORDER BY minute, second
        LIMIT ?
    """

    params.append(limit)

    rows = query(sql, params)

    total_actions = len(rows)
    passes = sum(1 for r in rows if r.get("type") == "Pass")
    shots = sum(1 for r in rows if r.get("type") == "Shot")
    dribbles = sum(1 for r in rows if r.get("type") == "Dribble")
    pressures = sum(1 for r in rows if r.get("under_pressure") == 1)

    return {
        "match_id": match_id,
        "team": team,
        "player": player,
        "event_type": event_type,
        "summary": {
            "total_actions": total_actions,
            "passes": passes,
            "shots": shots,
            "dribbles": dribbles,
            "under_pressure": pressures
        },
        "points": rows
    }


# ============================
# COMPARATIVO ENTRE TIMES
# ============================

@router.get("/api/statsbomb/team-comparison")
def get_team_comparison(match_id: int):
    match_rows = query(
        """
        SELECT
            match_id,
            home_team,
            away_team,
            home_score,
            away_score,
            match_date,
            competition_stage
        FROM sb_matches
        WHERE match_id = ?
        """,
        (match_id,)
    )

    if not match_rows:
        return {
            "match_id": match_id,
            "match": None,
            "teams": []
        }

    match = match_rows[0]

    event_rows = query(
        """
        SELECT
            team,

            COUNT(*) AS total_actions,

            SUM(CASE WHEN type = 'Pass' THEN 1 ELSE 0 END) AS passes,
            SUM(CASE WHEN type = 'Pass' AND pass_outcome IS NULL THEN 1 ELSE 0 END) AS completed_passes,

            SUM(CASE WHEN type = 'Shot' THEN 1 ELSE 0 END) AS shots,
            SUM(CASE WHEN type = 'Shot' AND shot_outcome IN ('Goal', 'Saved', 'Saved Off T', 'Saved to Post') THEN 1 ELSE 0 END) AS shots_on_target,
            SUM(CASE WHEN type = 'Shot' AND shot_outcome = 'Goal' THEN 1 ELSE 0 END) AS goals_from_events,
            ROUND(SUM(CASE WHEN type = 'Shot' THEN COALESCE(shot_xg, 0) ELSE 0 END), 3) AS xg,

            SUM(CASE WHEN type = 'Dribble' THEN 1 ELSE 0 END) AS dribbles,
            SUM(CASE WHEN type = 'Dribble' AND dribble_outcome = 'Complete' THEN 1 ELSE 0 END) AS completed_dribbles,

            SUM(CASE WHEN type = 'Foul Committed' THEN 1 ELSE 0 END) AS fouls_committed,
            SUM(CASE WHEN type = 'Foul Won' THEN 1 ELSE 0 END) AS fouls_won,

            SUM(CASE WHEN under_pressure = 1 THEN 1 ELSE 0 END) AS actions_under_pressure

        FROM sb_events
        WHERE match_id = ?
          AND team IS NOT NULL
          AND type NOT IN (
              'Starting XI',
              'Half Start',
              'Half End',
              'Substitution',
              'Tactical Shift'
          )
        GROUP BY team
        """,
        (match_id,)
    )

    teams = []

    for row in event_rows:
        team_name = row["team"]

        goals = 0
        opponent = None

        if team_name == match["home_team"]:
            goals = match["home_score"]
            opponent = match["away_team"]
        elif team_name == match["away_team"]:
            goals = match["away_score"]
            opponent = match["home_team"]
        else:
            goals = row.get("goals_from_events") or 0

        passes = row.get("passes") or 0
        completed_passes = row.get("completed_passes") or 0
        pass_accuracy = round((completed_passes / passes) * 100, 1) if passes else 0

        dribbles = row.get("dribbles") or 0
        completed_dribbles = row.get("completed_dribbles") or 0
        dribble_accuracy = round((completed_dribbles / dribbles) * 100, 1) if dribbles else 0

        teams.append({
            "team": team_name,
            "opponent": opponent,
            "goals": goals,
            "total_actions": row.get("total_actions") or 0,
            "shots": row.get("shots") or 0,
            "shots_on_target": row.get("shots_on_target") or 0,
            "xg": row.get("xg") or 0,
            "passes": passes,
            "completed_passes": completed_passes,
            "pass_accuracy": pass_accuracy,
            "dribbles": dribbles,
            "completed_dribbles": completed_dribbles,
            "dribble_accuracy": dribble_accuracy,
            "fouls_committed": row.get("fouls_committed") or 0,
            "fouls_won": row.get("fouls_won") or 0,
            "actions_under_pressure": row.get("actions_under_pressure") or 0
        })

    order = {
        match["home_team"]: 0,
        match["away_team"]: 1
    }

    teams = sorted(
        teams,
        key=lambda item: order.get(item["team"], 99)
    )

    return {
        "match_id": match_id,
        "match": match,
        "teams": teams
    }


# ============================
# MOMENTOS DA PARTIDA
# ============================

@router.get("/api/statsbomb/match-moments")
def get_match_moments(match_id: int, interval: int = 5):
    match_rows = query(
        """
        SELECT
            match_id,
            home_team,
            away_team,
            home_score,
            away_score,
            match_date,
            competition_stage
        FROM sb_matches
        WHERE match_id = ?
        """,
        (match_id,)
    )

    if not match_rows:
        return {
            "match_id": match_id,
            "match": None,
            "teams": [],
            "moments": [],
            "goals": []
        }

    match = match_rows[0]
    home_team = match["home_team"]
    away_team = match["away_team"]

    event_rows = query(
        """
        SELECT
            team,
            player,
            type,
            minute,
            second,
            location_x,
            location_y,
            shot_xg,
            shot_outcome,
            pass_outcome,
            dribble_outcome,
            under_pressure
        FROM sb_events
        WHERE match_id = ?
          AND team IS NOT NULL
          AND minute IS NOT NULL
          AND type NOT IN (
              'Starting XI',
              'Half Start',
              'Half End',
              'Substitution',
              'Tactical Shift'
          )
        ORDER BY minute, second
        """,
        (match_id,)
    )

    max_minute = 90

    if event_rows:
        max_minute = max([row.get("minute") or 0 for row in event_rows])
        if max_minute < 90:
            max_minute = 90

    moments_map = {}

    for start in range(0, max_minute + interval, interval):
        end = start + interval
        label = f"{start}-{end}"

        moments_map[label] = {
            "period_label": label,
            "start_minute": start,
            "end_minute": end,
            home_team: {
                "score": 0,
                "actions": 0,
                "attacking_actions": 0,
                "shots": 0,
                "xg": 0,
                "final_third_actions": 0,
                "under_pressure": 0
            },
            away_team: {
                "score": 0,
                "actions": 0,
                "attacking_actions": 0,
                "shots": 0,
                "xg": 0,
                "final_third_actions": 0,
                "under_pressure": 0
            }
        }

    attacking_types = {
        "Pass",
        "Carry",
        "Dribble",
        "Shot",
        "Ball Receipt*",
        "Cross"
    }

    goals = []

    for row in event_rows:
        minute = row.get("minute") or 0
        team = row.get("team")

        if team not in [home_team, away_team]:
            continue

        start = (minute // interval) * interval
        end = start + interval
        label = f"{start}-{end}"

        if label not in moments_map:
            moments_map[label] = {
                "period_label": label,
                "start_minute": start,
                "end_minute": end,
                home_team: {
                    "score": 0,
                    "actions": 0,
                    "attacking_actions": 0,
                    "shots": 0,
                    "xg": 0,
                    "final_third_actions": 0,
                    "under_pressure": 0
                },
                away_team: {
                    "score": 0,
                    "actions": 0,
                    "attacking_actions": 0,
                    "shots": 0,
                    "xg": 0,
                    "final_third_actions": 0,
                    "under_pressure": 0
                }
            }

        team_data = moments_map[label][team]

        event_type = row.get("type")
        location_x = row.get("location_x")
        shot_xg = row.get("shot_xg") or 0

        team_data["actions"] += 1

        if event_type in attacking_types:
            team_data["attacking_actions"] += 1
            team_data["score"] += 1

        if event_type == "Shot":
            team_data["shots"] += 1
            team_data["xg"] += round(float(shot_xg), 3)
            team_data["score"] += 3

            if row.get("shot_outcome") == "Goal":
                team_data["score"] += 6

                goals.append({
                    "team": team,
                    "player": row.get("player"),
                    "minute": minute,
                    "second": row.get("second"),
                    "xg": shot_xg
                })

        if location_x is not None and float(location_x) >= 80:
            team_data["final_third_actions"] += 1
            team_data["score"] += 2

        if row.get("under_pressure") == 1:
            team_data["under_pressure"] += 1

    moments = list(moments_map.values())

    for moment in moments:
        for team in [home_team, away_team]:
            moment[team]["xg"] = round(moment[team]["xg"], 3)

    return {
        "match_id": match_id,
        "match": match,
        "teams": [home_team, away_team],
        "interval": interval,
        "moments": moments,
        "goals": goals
    }


# ============================
# LINHA DO TEMPO DA PARTIDA
# ============================

@router.get("/api/statsbomb/match-timeline")
def get_match_timeline(match_id: int):
    match_rows = query(
        """
        SELECT
            match_id,
            home_team,
            away_team,
            home_score,
            away_score,
            match_date,
            competition_stage
        FROM sb_matches
        WHERE match_id = ?
        """,
        (match_id,)
    )

    if not match_rows:
        return {
            "match_id": match_id,
            "match": None,
            "events": []
        }

    match = match_rows[0]

    rows = query(
        """
        SELECT
            team,
            player,
            type,
            minute,
            second,
            shot_xg,
            shot_outcome,
            foul_committed_card,
            foul_committed_type,
            dribble_outcome,
            pass_outcome,
            location_x,
            location_y
        FROM sb_events
        WHERE match_id = ?
          AND minute IS NOT NULL
          AND (
                type = 'Shot'
                OR type = 'Substitution'
                OR (
                    type = 'Foul Committed'
                    AND foul_committed_card IS NOT NULL
                )
          )
        ORDER BY minute ASC, second ASC
        """,
        (match_id,)
    )

    timeline = []

    home_goals = 0
    away_goals = 0

    for row in rows:
        event_type = row.get("type")
        team = row.get("team")
        player = row.get("player")
        minute = row.get("minute")
        second = row.get("second") or 0

        item = {
            "minute": minute,
            "second": second,
            "team": team,
            "player": player,
            "type": event_type,
            "category": "Evento",
            "title": event_type,
            "description": "",
            "icon": "•",
            "importance": "normal",
            "home_score": home_goals,
            "away_score": away_goals
        }

        if event_type == "Shot":
            outcome = row.get("shot_outcome")
            xg = row.get("shot_xg") or 0

            item["shot_outcome"] = outcome
            item["xg"] = round(float(xg), 3)

            if outcome == "Goal":
                item["category"] = "Gol"
                item["title"] = "Gol"
                item["description"] = f"{player} marcou para {team} · xG {float(xg):.2f}"
                item["icon"] = "⚽"
                item["importance"] = "goal"

                if team == match["home_team"]:
                    home_goals += 1
                elif team == match["away_team"]:
                    away_goals += 1

                item["home_score"] = home_goals
                item["away_score"] = away_goals

            elif outcome in ["Saved", "Saved Off T", "Saved to Post"]:
                item["category"] = "Finalização no alvo"
                item["title"] = "Finalização no alvo"
                item["description"] = f"{player} finalizou no alvo · xG {float(xg):.2f}"
                item["icon"] = "🎯"
                item["importance"] = "shot_on_target"

            else:
                item["category"] = "Finalização"
                item["title"] = "Finalização"
                item["description"] = f"{player} finalizou · xG {float(xg):.2f}"
                item["icon"] = "🥅"
                item["importance"] = "shot"

        elif event_type == "Foul Committed":
            card = row.get("foul_committed_card")

            item["category"] = "Cartão"
            item["title"] = card or "Cartão"
            item["description"] = f"{player} recebeu {card} por {team}"
            item["icon"] = "🟨"
            item["importance"] = "card"
            item["card"] = card

            if card and "Red" in card:
                item["icon"] = "🟥"
                item["importance"] = "red_card"

        elif event_type == "Substitution":
            item["category"] = "Substituição"
            item["title"] = "Substituição"
            item["description"] = f"Substituição de {team}: {player}"
            item["icon"] = "🔁"
            item["importance"] = "substitution"

        timeline.append(item)

    return {
        "match_id": match_id,
        "match": match,
        "events": timeline
    }


# ============================
# RANKING INDIVIDUAL POR PARTIDA
# ============================

@router.get("/api/statsbomb/player-ranking")
def get_player_ranking(
    match_id: int,
    team: str | None = None,
    limit: int = 30
):
    sql = """
        SELECT
            player,
            player_id,
            team,

            COUNT(*) AS total_actions,

            SUM(CASE WHEN type = 'Pass' THEN 1 ELSE 0 END) AS passes,
            SUM(CASE WHEN type = 'Pass' AND pass_outcome IS NULL THEN 1 ELSE 0 END) AS completed_passes,

            SUM(CASE WHEN type = 'Shot' THEN 1 ELSE 0 END) AS shots,
            SUM(CASE WHEN type = 'Shot' AND shot_outcome = 'Goal' THEN 1 ELSE 0 END) AS goals,
            ROUND(SUM(CASE WHEN type = 'Shot' THEN COALESCE(shot_xg, 0) ELSE 0 END), 3) AS xg,

            SUM(CASE WHEN type = 'Dribble' THEN 1 ELSE 0 END) AS dribbles,
            SUM(CASE WHEN type = 'Dribble' AND dribble_outcome = 'Complete' THEN 1 ELSE 0 END) AS completed_dribbles,

            SUM(CASE WHEN type = 'Duel' THEN 1 ELSE 0 END) AS duels,
            SUM(CASE WHEN type = 'Duel' AND duel_outcome IN ('Won', 'Success') THEN 1 ELSE 0 END) AS won_duels,

            SUM(CASE WHEN type = 'Foul Won' THEN 1 ELSE 0 END) AS fouls_won,
            SUM(CASE WHEN type = 'Foul Committed' THEN 1 ELSE 0 END) AS fouls_committed,

            SUM(CASE WHEN under_pressure = 1 THEN 1 ELSE 0 END) AS actions_under_pressure,

            SUM(CASE WHEN location_x >= 80 THEN 1 ELSE 0 END) AS final_third_actions

        FROM sb_events
        WHERE match_id = ?
          AND player IS NOT NULL
          AND team IS NOT NULL
          AND type NOT IN (
              'Starting XI',
              'Half Start',
              'Half End',
              'Substitution',
              'Tactical Shift'
          )
    """

    params = [match_id]

    if team:
        sql += " AND team = ?"
        params.append(team)

    sql += """
        GROUP BY player, player_id, team
        HAVING COUNT(*) >= 3
        ORDER BY total_actions DESC
        LIMIT ?
    """

    params.append(limit)

    rows = query(sql, params)

    players = []

    for row in rows:
        total_actions = row.get("total_actions") or 0

        passes = row.get("passes") or 0
        completed_passes = row.get("completed_passes") or 0
        pass_accuracy = round((completed_passes / passes) * 100, 1) if passes else 0

        dribbles = row.get("dribbles") or 0
        completed_dribbles = row.get("completed_dribbles") or 0
        dribble_accuracy = round((completed_dribbles / dribbles) * 100, 1) if dribbles else 0

        shots = row.get("shots") or 0
        goals = row.get("goals") or 0
        xg = row.get("xg") or 0
        duels = row.get("duels") or 0
        won_duels = row.get("won_duels") or 0
        fouls_won = row.get("fouls_won") or 0
        fouls_committed = row.get("fouls_committed") or 0
        actions_under_pressure = row.get("actions_under_pressure") or 0
        final_third_actions = row.get("final_third_actions") or 0

        # ============================
        # NOTA PRÓPRIA DO DASHBOARD
        # Fórmula mais rígida.
        # Objetivo: evitar muitos jogadores com 10.0.
        # ============================

        rating = 5.2

        # Impacto direto no placar
        rating += goals * 0.95

        # Qualidade das chances
        rating += float(xg) * 0.55
        rating += shots * 0.08

        # Participação com bola
        rating += completed_passes * 0.004
        rating += total_actions * 0.003

        # Ações ofensivas e competitivas
        rating += final_third_actions * 0.018
        rating += completed_dribbles * 0.12
        rating += won_duels * 0.055
        rating += fouls_won * 0.045

        # Penalizações
        rating -= fouls_committed * 0.06
        rating -= actions_under_pressure * 0.003

        # Bônus pequeno por volume alto
        if total_actions >= 70:
            rating += 0.15

        # Bônus para atuações decisivas
        if goals >= 2:
            rating += 0.25

        if goals >= 3:
            rating += 0.35

        # Regras de teto para deixar a nota mais realista
        if goals == 0:
            rating = min(rating, 8.6)

        if goals == 1 and float(xg) < 0.8 and total_actions < 70:
            rating = min(rating, 9.2)

        if goals == 2:
            rating = min(rating, 9.6)

        # Nota 10 só em atuação muito fora da curva
        if rating >= 9.8:
            if goals >= 3 or (goals >= 2 and float(xg) >= 1.2 and total_actions >= 55):
                rating = min(rating, 10.0)
            else:
                rating = min(rating, 9.7)

        rating = round(max(5.0, min(10.0, rating)), 1)

        players.append({
            "player": row.get("player"),
            "player_id": row.get("player_id"),
            "team": row.get("team"),
            "total_actions": total_actions,
            "passes": passes,
            "completed_passes": completed_passes,
            "pass_accuracy": pass_accuracy,
            "shots": shots,
            "goals": goals,
            "xg": xg,
            "dribbles": dribbles,
            "completed_dribbles": completed_dribbles,
            "dribble_accuracy": dribble_accuracy,
            "duels": duels,
            "won_duels": won_duels,
            "fouls_won": fouls_won,
            "fouls_committed": fouls_committed,
            "actions_under_pressure": actions_under_pressure,
            "final_third_actions": final_third_actions,
            "rating": rating
        })

    players = sorted(
        players,
        key=lambda p: (
            p["rating"],
            p["goals"],
            p["xg"],
            p["total_actions"]
        ),
        reverse=True
    )

    return {
        "match_id": match_id,
        "team": team,
        "players": players[:limit]
    }
# ============================
# RESUMO INTELIGENTE DA PARTIDA
# ============================

@router.get("/api/statsbomb/match-insights")
def get_match_insights(match_id: int):
    match_rows = query(
        """
        SELECT
            match_id,
            home_team,
            away_team,
            home_score,
            away_score,
            match_date,
            competition_stage
        FROM sb_matches
        WHERE match_id = ?
        """,
        (match_id,)
    )

    if not match_rows:
        return {
            "match_id": match_id,
            "match": None,
            "insights": [],
            "teams": [],
            "top_players": []
        }

    match = match_rows[0]

    team_rows = query(
        """
        SELECT
            team,
            COUNT(*) AS total_actions,

            SUM(CASE WHEN type = 'Pass' THEN 1 ELSE 0 END) AS passes,
            SUM(CASE WHEN type = 'Pass' AND pass_outcome IS NULL THEN 1 ELSE 0 END) AS completed_passes,

            SUM(CASE WHEN type = 'Shot' THEN 1 ELSE 0 END) AS shots,
            SUM(CASE WHEN type = 'Shot' AND shot_outcome IN ('Goal', 'Saved', 'Saved Off T', 'Saved to Post') THEN 1 ELSE 0 END) AS shots_on_target,
            ROUND(SUM(CASE WHEN type = 'Shot' THEN COALESCE(shot_xg, 0) ELSE 0 END), 3) AS xg,

            SUM(CASE WHEN type = 'Dribble' THEN 1 ELSE 0 END) AS dribbles,
            SUM(CASE WHEN type = 'Dribble' AND dribble_outcome = 'Complete' THEN 1 ELSE 0 END) AS completed_dribbles,

            SUM(CASE WHEN location_x >= 80 THEN 1 ELSE 0 END) AS final_third_actions,
            SUM(CASE WHEN under_pressure = 1 THEN 1 ELSE 0 END) AS actions_under_pressure

        FROM sb_events
        WHERE match_id = ?
          AND team IS NOT NULL
          AND type NOT IN (
              'Starting XI',
              'Half Start',
              'Half End',
              'Substitution',
              'Tactical Shift'
          )
        GROUP BY team
        """,
        (match_id,)
    )

    player_rows = query(
        """
        SELECT
            player,
            team,

            COUNT(*) AS total_actions,

            SUM(CASE WHEN type = 'Pass' THEN 1 ELSE 0 END) AS passes,
            SUM(CASE WHEN type = 'Pass' AND pass_outcome IS NULL THEN 1 ELSE 0 END) AS completed_passes,

            SUM(CASE WHEN type = 'Shot' THEN 1 ELSE 0 END) AS shots,
            SUM(CASE WHEN type = 'Shot' AND shot_outcome = 'Goal' THEN 1 ELSE 0 END) AS goals,
            ROUND(SUM(CASE WHEN type = 'Shot' THEN COALESCE(shot_xg, 0) ELSE 0 END), 3) AS xg,

            SUM(CASE WHEN type = 'Dribble' THEN 1 ELSE 0 END) AS dribbles,
            SUM(CASE WHEN type = 'Dribble' AND dribble_outcome = 'Complete' THEN 1 ELSE 0 END) AS completed_dribbles,

            SUM(CASE WHEN location_x >= 80 THEN 1 ELSE 0 END) AS final_third_actions

        FROM sb_events
        WHERE match_id = ?
          AND player IS NOT NULL
          AND team IS NOT NULL
          AND type NOT IN (
              'Starting XI',
              'Half Start',
              'Half End',
              'Substitution',
              'Tactical Shift'
          )
        GROUP BY player, team
        HAVING COUNT(*) >= 3
        """,
        (match_id,)
    )

    teams = []

    for row in team_rows:
        team_name = row.get("team")

        goals = 0

        if team_name == match["home_team"]:
            goals = match["home_score"]
        elif team_name == match["away_team"]:
            goals = match["away_score"]

        passes = row.get("passes") or 0
        completed_passes = row.get("completed_passes") or 0

        pass_accuracy = round((completed_passes / passes) * 100, 1) if passes else 0

        shots = row.get("shots") or 0
        shots_on_target = row.get("shots_on_target") or 0

        shot_accuracy = round((shots_on_target / shots) * 100, 1) if shots else 0

        teams.append({
            "team": team_name,
            "goals": goals,
            "total_actions": row.get("total_actions") or 0,
            "passes": passes,
            "completed_passes": completed_passes,
            "pass_accuracy": pass_accuracy,
            "shots": shots,
            "shots_on_target": shots_on_target,
            "shot_accuracy": shot_accuracy,
            "xg": row.get("xg") or 0,
            "dribbles": row.get("dribbles") or 0,
            "completed_dribbles": row.get("completed_dribbles") or 0,
            "final_third_actions": row.get("final_third_actions") or 0,
            "actions_under_pressure": row.get("actions_under_pressure") or 0
        })

    top_players = []

    for row in player_rows:
        total_actions = row.get("total_actions") or 0
        goals = row.get("goals") or 0
        xg = row.get("xg") or 0
        completed_passes = row.get("completed_passes") or 0
        shots = row.get("shots") or 0
        completed_dribbles = row.get("completed_dribbles") or 0
        final_third_actions = row.get("final_third_actions") or 0

        impact_score = 0
        impact_score += goals * 4
        impact_score += float(xg) * 2
        impact_score += shots * 0.35
        impact_score += completed_passes * 0.035
        impact_score += completed_dribbles * 0.55
        impact_score += final_third_actions * 0.16
        impact_score += total_actions * 0.025

        top_players.append({
            "player": row.get("player"),
            "team": row.get("team"),
            "total_actions": total_actions,
            "goals": goals,
            "xg": xg,
            "shots": shots,
            "completed_passes": completed_passes,
            "completed_dribbles": completed_dribbles,
            "final_third_actions": final_third_actions,
            "impact_score": round(impact_score, 2)
        })

    top_players = sorted(
        top_players,
        key=lambda p: p["impact_score"],
        reverse=True
    )

    insights = []

    if match["home_score"] > match["away_score"]:
        winner = match["home_team"]
        loser = match["away_team"]
        score = f'{match["home_score"]} x {match["away_score"]}'
        insights.append({
            "type": "result",
            "title": "Resultado da partida",
            "text": f"{winner} venceu {loser} por {score}."
        })
    elif match["away_score"] > match["home_score"]:
        winner = match["away_team"]
        loser = match["home_team"]
        score = f'{match["away_score"]} x {match["home_score"]}'
        insights.append({
            "type": "result",
            "title": "Resultado da partida",
            "text": f"{winner} venceu {loser} por {score}."
        })
    else:
        insights.append({
            "type": "result",
            "title": "Resultado da partida",
            "text": f"A partida terminou empatada em {match['home_score']} x {match['away_score']}."
        })

    if len(teams) >= 2:
        team_actions = sorted(teams, key=lambda t: t["total_actions"], reverse=True)[0]
        team_shots = sorted(teams, key=lambda t: t["shots"], reverse=True)[0]
        team_xg = sorted(teams, key=lambda t: t["xg"], reverse=True)[0]
        team_final_third = sorted(teams, key=lambda t: t["final_third_actions"], reverse=True)[0]
        team_pass_accuracy = sorted(teams, key=lambda t: t["pass_accuracy"], reverse=True)[0]

        insights.append({
            "type": "volume",
            "title": "Volume de jogo",
            "text": f"{team_actions['team']} teve maior participação no jogo, com {team_actions['total_actions']} ações registradas."
        })

        insights.append({
            "type": "attack",
            "title": "Volume ofensivo",
            "text": f"{team_shots['team']} finalizou mais vezes, com {team_shots['shots']} chutes."
        })

        insights.append({
            "type": "xg",
            "title": "Qualidade das chances",
            "text": f"{team_xg['team']} liderou em xG, com {float(team_xg['xg']):.2f}."
        })

        insights.append({
            "type": "territory",
            "title": "Presença no terço final",
            "text": f"{team_final_third['team']} chegou mais ao terço final, com {team_final_third['final_third_actions']} ações."
        })

        insights.append({
            "type": "passing",
            "title": "Eficiência nos passes",
            "text": f"{team_pass_accuracy['team']} teve o melhor aproveitamento de passes, com {team_pass_accuracy['pass_accuracy']}%."
        })

    if top_players:
        best_player = top_players[0]
        most_actions = sorted(top_players, key=lambda p: p["total_actions"], reverse=True)[0]
        best_passer = sorted(top_players, key=lambda p: p["completed_passes"], reverse=True)[0]

        insights.append({
            "type": "player",
            "title": "Destaque individual",
            "text": f"{best_player['player']} foi o principal destaque pelo índice de impacto do dashboard."
        })

        insights.append({
            "type": "player-volume",
            "title": "Jogador mais participativo",
            "text": f"{most_actions['player']} teve o maior volume de ações, com {most_actions['total_actions']} eventos."
        })

        insights.append({
            "type": "passing-player",
            "title": "Principal passador",
            "text": f"{best_passer['player']} liderou em passes certos, com {best_passer['completed_passes']}."
        })

    return {
        "match_id": match_id,
        "match": match,
        "teams": teams,
        "top_players": top_players[:5],
        "insights": insights
    }