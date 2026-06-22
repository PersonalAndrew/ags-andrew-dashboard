"""
Rotas da API para os dados StatsBomb (Copa do Mundo 2022).
NÃ£o interfere nas rotas do SofaScore em routes.py.
"""
import os
import sqlite3
from fastapi import APIRouter

router = APIRouter()

DB_PATH = os.path.join(
    os.path.dirname(os.path.dirname(os.path.dirname(__file__))),
    "data", "sofascore.db"
)


def query(sql, params=()):
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    try:
        rows = conn.execute(sql, params).fetchall()
        return [dict(r) for r in rows]
    finally:
        conn.close()


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
    allowed = {"gols", "xg", "chutes", "jogos", "xg_diff", "chutes_no_gol"}
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
