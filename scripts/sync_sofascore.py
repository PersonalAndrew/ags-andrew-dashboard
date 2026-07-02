from __future__ import annotations

import json
import time
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from curl_cffi import requests


# ============================
# CONFIGURAÇÕES PRINCIPAIS
# ============================

TOURNAMENT_ID = 16
SEASON_ID = 58210

BASE_URL = "https://api.sofascore.com/api/v1"

ROOT_DIR = Path(__file__).resolve().parents[1]
DATA_DIR = ROOT_DIR / "data" / "sofascore"

RAW_DIR = DATA_DIR / "raw"
MATCHES_DIR = DATA_DIR / "matches"
STATISTICS_DIR = DATA_DIR / "statistics"
LINEUPS_DIR = DATA_DIR / "lineups"
SHOTMAP_DIR = DATA_DIR / "shotmap"
MOMENTUM_DIR = DATA_DIR / "momentum"

HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/120.0.0.0 Safari/537.36"
    ),
    "Accept": "application/json,text/plain,*/*",
    "Accept-Language": "pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7",
    "Origin": "https://www.sofascore.com",
    "Referer": "https://www.sofascore.com/",
}


# ============================
# FUNÇÕES BASE
# ============================

def ensure_dirs() -> None:
    for folder in [
        RAW_DIR,
        MATCHES_DIR,
        STATISTICS_DIR,
        LINEUPS_DIR,
        SHOTMAP_DIR,
        MOMENTUM_DIR,
    ]:
        folder.mkdir(parents=True, exist_ok=True)


def save_json(path: Path, data: Any) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)

    with path.open("w", encoding="utf-8") as file:
        json.dump(data, file, ensure_ascii=False, indent=2)


def request_json(endpoint: str) -> Any:
    url = f"{BASE_URL}{endpoint}"

    print(f"Buscando: {url}")

    response = requests.get(
        url,
        headers=HEADERS,
        timeout=25,
        impersonate="chrome120",
    )

    if response.status_code != 200:
        print(f"Status recebido: {response.status_code}")
        print(response.text[:500])

    response.raise_for_status()

    time.sleep(1.2)

    return response.json()


# ============================
# NORMALIZAÇÃO
# ============================

def normalize_event(event: dict[str, Any]) -> dict[str, Any]:
    home_team = event.get("homeTeam", {})
    away_team = event.get("awayTeam", {})
    tournament = event.get("tournament", {})
    unique_tournament = tournament.get("uniqueTournament", {})
    category = tournament.get("category", {})
    status = event.get("status", {})
    round_info = event.get("roundInfo", {})

    home_score = event.get("homeScore", {})
    away_score = event.get("awayScore", {})

    start_timestamp = event.get("startTimestamp")
    start_datetime = None

    if start_timestamp:
        start_datetime = datetime.fromtimestamp(
            start_timestamp,
            tz=timezone.utc,
        ).isoformat()

    return {
        "match_id": event.get("id"),
        "slug": event.get("slug"),

        "home_team": home_team.get("name"),
        "away_team": away_team.get("name"),
        "home_team_short": home_team.get("shortName"),
        "away_team_short": away_team.get("shortName"),
        "home_team_id": home_team.get("id"),
        "away_team_id": away_team.get("id"),

        "home_score": home_score.get("current"),
        "away_score": away_score.get("current"),

        "status": status.get("description"),
        "status_type": status.get("type"),

        "start_timestamp": start_timestamp,
        "start_datetime_utc": start_datetime,

        "tournament_id": unique_tournament.get("id"),
        "tournament_name": unique_tournament.get("name"),
        "season_id": event.get("season", {}).get("id") if event.get("season") else SEASON_ID,

        "category_id": category.get("id"),
        "category_name": category.get("name"),

        "round": round_info.get("name"),
        "round_number": round_info.get("round"),

        "updated_at": datetime.now(timezone.utc).isoformat(),
    }


# ============================
# BUSCA DOS JOGOS DA COPA
# ============================

def fetch_worldcup_events() -> list[dict[str, Any]]:
    """
    Busca jogos da Copa do Mundo 2026 pelo Tournament ID e Season ID.

    Coleta várias páginas:
    - last/0, last/1, last/2... até parar
    - next/0, next/1... até parar
    """

    all_matches: dict[int, dict[str, Any]] = {}

    directions = ["last", "next"]
    max_pages = 10

    for direction in directions:
        for page in range(max_pages):
            endpoint = (
                f"/unique-tournament/{TOURNAMENT_ID}"
                f"/season/{SEASON_ID}"
                f"/events/{direction}/{page}"
            )

            try:
                data = request_json(endpoint)

                safe_name = endpoint.replace("/", "_").strip("_")
                save_json(RAW_DIR / f"{safe_name}.json", data)

                events = data.get("events", [])

                print(
                    f"Eventos encontrados em {direction}/{page}: "
                    f"{len(events)}"
                )

                if not events:
                    break

                for event in events:
                    normalized = normalize_event(event)
                    match_id = normalized.get("match_id")

                    if match_id:
                        all_matches[int(match_id)] = normalized

            except Exception as error:
                print(f"Fim ou erro em {direction}/{page}: {error}")
                break

    ordered_matches = sorted(
        all_matches.values(),
        key=lambda item: item.get("start_timestamp") or 0,
    )

    return ordered_matches


# ============================
# BUSCA DE DADOS DETALHADOS
# ============================

def fetch_match_statistics(match_id: int) -> None:
    try:
        data = request_json(f"/event/{match_id}/statistics")
        save_json(STATISTICS_DIR / f"{match_id}.json", data)
        print(f"OK estatísticas: {match_id}")

    except Exception as error:
        print(f"Sem estatísticas para {match_id}: {error}")


def fetch_match_lineups(match_id: int) -> None:
    try:
        data = request_json(f"/event/{match_id}/lineups")
        save_json(LINEUPS_DIR / f"{match_id}.json", data)
        print(f"OK escalações: {match_id}")

    except Exception as error:
        print(f"Sem escalações para {match_id}: {error}")


def fetch_match_shotmap(match_id: int) -> None:
    try:
        data = request_json(f"/event/{match_id}/shotmap")
        save_json(SHOTMAP_DIR / f"{match_id}.json", data)
        print(f"OK shotmap: {match_id}")

    except Exception as error:
        print(f"Sem shotmap para {match_id}: {error}")


def fetch_match_momentum(match_id: int) -> None:
    try:
        data = request_json(f"/event/{match_id}/graph")
        save_json(MOMENTUM_DIR / f"{match_id}.json", data)
        print(f"OK momentum: {match_id}")

    except Exception as error:
        print(f"Sem momentum para {match_id}: {error}")


def fetch_match_details(match: dict[str, Any]) -> None:
    match_id = match.get("match_id")
    home_team = match.get("home_team")
    away_team = match.get("away_team")
    status_type = match.get("status_type")

    if not match_id:
        return

    print("")
    print("=" * 60)
    print(f"Jogo: {home_team} x {away_team}")
    print(f"ID: {match_id}")
    print(f"Status: {status_type}")
    print("=" * 60)

    fetch_match_statistics(int(match_id))
    fetch_match_lineups(int(match_id))
    fetch_match_shotmap(int(match_id))
    fetch_match_momentum(int(match_id))


# ============================
# TENDÊNCIAS BÁSICAS
# ============================

def build_basic_trends(matches: list[dict[str, Any]]) -> dict[str, Any]:
    finished_matches = [
        match for match in matches
        if match.get("status_type") == "finished"
    ]

    live_matches = [
        match for match in matches
        if match.get("status_type") == "inprogress"
    ]

    scheduled_matches = [
        match for match in matches
        if match.get("status_type") not in ["finished", "inprogress"]
    ]

    total_goals = 0

    for match in finished_matches:
        home_score = match.get("home_score") or 0
        away_score = match.get("away_score") or 0

        total_goals += int(home_score) + int(away_score)

    goals_per_match = (
        total_goals / len(finished_matches)
        if finished_matches
        else 0
    )

    return {
        "source": "SofaScore",
        "tournament_id": TOURNAMENT_ID,
        "season_id": SEASON_ID,
        "updated_at": datetime.now(timezone.utc).isoformat(),

        "total_matches_collected": len(matches),
        "finished_matches": len(finished_matches),
        "live_matches": len(live_matches),
        "scheduled_matches": len(scheduled_matches),

        "total_goals_finished_matches": total_goals,
        "goals_per_finished_match": round(goals_per_match, 2),

        "live_games": live_matches,
        "next_games": scheduled_matches[:10],
        "recent_finished_games": finished_matches[-10:],
    }


# ============================
# SINCRONIZAÇÃO PRINCIPAL
# ============================

def sync_world_cup() -> None:
    ensure_dirs()

    print("")
    print("======================================")
    print("Sincronizando Copa 2026 pelo SofaScore")
    print("======================================")
    print(f"Tournament ID: {TOURNAMENT_ID}")
    print(f"Season ID: {SEASON_ID}")
    print("")

    matches = fetch_worldcup_events()

    save_json(MATCHES_DIR / "worldcup_2026_matches.json", matches)

    print("")
    print(f"{len(matches)} jogos da Copa 2026 encontrados e salvos.")
    print("")

    for match in matches:
        status_type = match.get("status_type")

        if status_type in ["inprogress", "finished"]:
            fetch_match_details(match)

    trends = build_basic_trends(matches)
    save_json(DATA_DIR / "worldcup_2026_trends.json", trends)

    manifest = {
        "source": "SofaScore",
        "tournament_id": TOURNAMENT_ID,
        "season_id": SEASON_ID,
        "total_matches": len(matches),
        "updated_at": datetime.now(timezone.utc).isoformat(),
        "files": {
            "matches": "data/sofascore/matches/worldcup_2026_matches.json",
            "trends": "data/sofascore/worldcup_2026_trends.json",
            "raw_last": f"data/sofascore/raw/unique-tournament_{TOURNAMENT_ID}_season_{SEASON_ID}_events_last_0.json",
            "raw_next": f"data/sofascore/raw/unique-tournament_{TOURNAMENT_ID}_season_{SEASON_ID}_events_next_0.json",
        },
    }

    save_json(DATA_DIR / "manifest.json", manifest)

    print("")
    print("======================================")
    print("Sincronização finalizada com sucesso.")
    print("======================================")
    print("Arquivos principais criados:")
    print("- data/sofascore/matches/worldcup_2026_matches.json")
    print("- data/sofascore/worldcup_2026_trends.json")
    print("- data/sofascore/manifest.json")
    print("")


if __name__ == "__main__":
    sync_world_cup()