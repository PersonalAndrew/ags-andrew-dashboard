from __future__ import annotations

import argparse
import json
import time
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

try:
    from curl_cffi import requests
    USE_CURL_CFFI = True
except Exception:
    import requests
    USE_CURL_CFFI = False


TOURNAMENT_ID = 325
SEASON_ID = 87678

BASE_URL = "https://api.sofascore.com/api/v1"

ROOT_DIR = Path(__file__).resolve().parents[1]
DATA_DIR = ROOT_DIR / "data" / "sofascore_brasileirao"

RAW_DIR = DATA_DIR / "raw"
MATCHES_DIR = DATA_DIR / "matches"
STATISTICS_DIR = DATA_DIR / "statistics"
LINEUPS_DIR = DATA_DIR / "lineups"
SHOTMAP_DIR = DATA_DIR / "shotmap"
MOMENTUM_DIR = DATA_DIR / "momentum"

HEADERS = {
    "User-Agent": "Mozilla/5.0",
    "Accept": "application/json,text/plain,*/*",
    "Accept-Language": "pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7",
    "Origin": "https://www.sofascore.com",
    "Referer": "https://www.sofascore.com/",
}


def ensure_dirs() -> None:
    for path in [
        RAW_DIR,
        MATCHES_DIR,
        STATISTICS_DIR,
        LINEUPS_DIR,
        SHOTMAP_DIR,
        MOMENTUM_DIR,
    ]:
        path.mkdir(parents=True, exist_ok=True)


def request_json(endpoint: str) -> Any:
    url = f"{BASE_URL}{endpoint}"

    if USE_CURL_CFFI:
        response = requests.get(
            url,
            headers=HEADERS,
            timeout=30,
            impersonate="chrome120",
        )
    else:
        response = requests.get(url, headers=HEADERS, timeout=30)

    response.raise_for_status()
    return response.json()


def save_json(path: Path, data: Any) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")


def score_value(score: Any, key: str = "current") -> int | None:
    if isinstance(score, dict):
        value = score.get(key)

        if value is None:
            value = score.get("current")

        if value is None:
            return None

        try:
            return int(value)
        except (TypeError, ValueError):
            return None

    if score is None:
        return None

    try:
        return int(score)
    except (TypeError, ValueError):
        return None


def timestamp_to_datetime(value: Any) -> str | None:
    if value is None:
        return None

    try:
        timestamp = int(value)
    except (TypeError, ValueError):
        return None

    return datetime.fromtimestamp(timestamp, tz=timezone.utc).isoformat()


def normalize_event(event: dict[str, Any]) -> dict[str, Any]:
    home_team = event.get("homeTeam") or {}
    away_team = event.get("awayTeam") or {}
    home_score = event.get("homeScore") or {}
    away_score = event.get("awayScore") or {}
    tournament = event.get("tournament") or {}
    unique_tournament = tournament.get("uniqueTournament") or {}
    category = tournament.get("category") or {}
    status = event.get("status") or {}
    round_info = event.get("roundInfo") or {}
    season = event.get("season") or {}

    start_timestamp = event.get("startTimestamp")

    return {
        "match_id": event.get("id"),
        "slug": event.get("slug"),
        "home_team": home_team.get("name"),
        "away_team": away_team.get("name"),
        "home_team_short": home_team.get("shortName"),
        "away_team_short": away_team.get("shortName"),
        "home_team_id": home_team.get("id"),
        "away_team_id": away_team.get("id"),
        "home_score": score_value(home_score),
        "away_score": score_value(away_score),
        "home_score_current": score_value(home_score, "current"),
        "away_score_current": score_value(away_score, "current"),
        "home_score_normaltime": score_value(home_score, "normaltime"),
        "away_score_normaltime": score_value(away_score, "normaltime"),
        "home_score_overtime": score_value(home_score, "overtime"),
        "away_score_overtime": score_value(away_score, "overtime"),
        "home_penalty_score": score_value(home_score, "penalties"),
        "away_penalty_score": score_value(away_score, "penalties"),
        "status": status.get("description"),
        "status_type": status.get("type"),
        "start_timestamp": start_timestamp,
        "start_datetime_utc": timestamp_to_datetime(start_timestamp),
        "tournament_id": unique_tournament.get("id") or TOURNAMENT_ID,
        "tournament_name": unique_tournament.get("name"),
        "season_id": season.get("id") or SEASON_ID,
        "category_id": category.get("id"),
        "category_name": category.get("name"),
        "round": round_info.get("name"),
        "round_number": round_info.get("round"),
        "updated_at": datetime.now(timezone.utc).isoformat(),
    }


def fetch_brasileirao_events(max_pages: int) -> list[dict[str, Any]]:
    events_by_id: dict[int, dict[str, Any]] = {}

    for direction in ["last", "next"]:
        for page in range(max_pages):
            endpoint = (
                f"/unique-tournament/{TOURNAMENT_ID}"
                f"/season/{SEASON_ID}"
                f"/events/{direction}/{page}"
            )

            try:
                data = request_json(endpoint)
            except Exception as error:
                print(f"[AVISO] eventos {direction}/{page} falharam: {error}")
                break

            save_json(
                RAW_DIR / f"unique-tournament_{TOURNAMENT_ID}_season_{SEASON_ID}_events_{direction}_{page}.json",
                data,
            )

            events = data.get("events", [])

            print(f"Eventos {direction}/{page}: {len(events)}")

            if not events:
                break

            for event in events:
                normalized = normalize_event(event)
                match_id = normalized.get("match_id")

                if match_id is not None:
                    events_by_id[int(match_id)] = normalized

            time.sleep(0.6)

    matches = list(events_by_id.values())
    matches.sort(key=lambda row: (row.get("start_timestamp") or 0, row.get("match_id") or 0))

    return matches


def fetch_detail(match_id: int, endpoint: str, target_dir: Path, label: str) -> bool:
    try:
        data = request_json(f"/event/{match_id}/{endpoint}")
        save_json(target_dir / f"{match_id}.json", data)
        print(f"OK {label}: {match_id}")
        return True
    except Exception as error:
        print(f"Sem {label} para {match_id}: {error}")
        return False


def fetch_match_details(matches: list[dict[str, Any]], limit: int | None = None) -> None:
    finished_matches = [
        match for match in matches
        if str(match.get("status_type") or "").lower() == "finished"
    ]

    if limit:
        finished_matches = finished_matches[:limit]

    print("")
    print(f"Jogos finalizados para detalhar: {len(finished_matches)}")
    print("")

    for index, match in enumerate(finished_matches, start=1):
        match_id = int(match["match_id"])
        label = f"{match.get('home_team')} x {match.get('away_team')}"

        print("=" * 70)
        print(f"{index}/{len(finished_matches)} | {match_id} | {label}")
        print("=" * 70)

        fetch_detail(match_id, "statistics", STATISTICS_DIR, "estatisticas")
        time.sleep(0.5)

        fetch_detail(match_id, "lineups", LINEUPS_DIR, "escalacoes")
        time.sleep(0.5)

        fetch_detail(match_id, "shotmap", SHOTMAP_DIR, "shotmap")
        time.sleep(0.5)

        fetch_detail(match_id, "graph", MOMENTUM_DIR, "momentum")
        time.sleep(0.8)


def build_trends(matches: list[dict[str, Any]]) -> dict[str, Any]:
    finished = [row for row in matches if row.get("status_type") == "finished"]
    upcoming = [row for row in matches if row.get("status_type") != "finished"]

    total_goals = 0

    for match in finished:
        total_goals += int(match.get("home_score") or 0)
        total_goals += int(match.get("away_score") or 0)

    return {
        "source": "SofaScore",
        "competition": "Brasileirao Betano",
        "tournament_id": TOURNAMENT_ID,
        "season_id": SEASON_ID,
        "updated_at": datetime.now(timezone.utc).isoformat(),
        "total_matches": len(matches),
        "finished_matches": len(finished),
        "upcoming_matches": len(upcoming),
        "total_goals_finished": total_goals,
        "avg_goals_finished": round(total_goals / len(finished), 2) if finished else 0,
    }


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--max-pages", type=int, default=20)
    parser.add_argument("--limit-details", type=int, default=None)
    parser.add_argument("--skip-details", action="store_true")
    args = parser.parse_args()

    ensure_dirs()

    print("")
    print("==============================================")
    print("Sincronizando Brasileirão 2026 pelo SofaScore")
    print("==============================================")
    print(f"Tournament ID: {TOURNAMENT_ID}")
    print(f"Season ID: {SEASON_ID}")
    print(f"HTTP: {'curl_cffi/chrome120' if USE_CURL_CFFI else 'requests'}")
    print("")

    matches = fetch_brasileirao_events(max_pages=args.max_pages)

    save_json(MATCHES_DIR / "brasileirao_2026_matches.json", matches)
    save_json(DATA_DIR / "brasileirao_2026_trends.json", build_trends(matches))

    manifest = {
        "source": "SofaScore",
        "competition": "Brasileirao Betano",
        "tournament_id": TOURNAMENT_ID,
        "season_id": SEASON_ID,
        "total_matches": len(matches),
        "updated_at": datetime.now(timezone.utc).isoformat(),
        "files": {
            "matches": "data/sofascore_brasileirao/matches/brasileirao_2026_matches.json",
            "trends": "data/sofascore_brasileirao/brasileirao_2026_trends.json",
        },
    }

    save_json(DATA_DIR / "manifest.json", manifest)

    print("")
    print("Resumo inicial:")
    print(json.dumps(build_trends(matches), ensure_ascii=False, indent=2))

    if not args.skip_details:
        fetch_match_details(matches, limit=args.limit_details)

    print("")
    print("Sincronização finalizada.")


if __name__ == "__main__":
    main()