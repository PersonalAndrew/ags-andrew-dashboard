from __future__ import annotations

import json
import time
from pathlib import Path
from typing import Any

try:
    from curl_cffi import requests
    USE_CURL_CFFI = True
except Exception:
    import requests
    USE_CURL_CFFI = False

BASE_URL = "https://api.sofascore.com/api/v1"
ROOT_DIR = Path(__file__).resolve().parents[1]
OUT_DIR = ROOT_DIR / "data" / "sofascore_brasileirao" / "diagnostics"

# Candidato principal: Brasileirão Série A.
# Mantemos outros IDs só como fallback de descoberta.
CANDIDATE_TOURNAMENT_IDS = [
    325,
    390,
    1468,
    17,
    16,
]

HEADERS = {
    "User-Agent": "Mozilla/5.0",
    "Accept": "application/json,text/plain,*/*",
    "Accept-Language": "pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7",
    "Origin": "https://www.sofascore.com",
    "Referer": "https://www.sofascore.com/",
}


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
        response = requests.get(
            url,
            headers=HEADERS,
            timeout=30,
        )

    response.raise_for_status()
    return response.json()


def save_json(name: str, data: Any) -> None:
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    path = OUT_DIR / name
    path.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"[OK] salvo: {path}")


def event_sample(event: dict[str, Any]) -> dict[str, Any]:
    tournament = event.get("tournament") or {}
    unique_tournament = tournament.get("uniqueTournament") or {}
    category = tournament.get("category") or {}
    season = event.get("season") or {}

    return {
        "event_id": event.get("id"),
        "home": (event.get("homeTeam") or {}).get("name"),
        "away": (event.get("awayTeam") or {}).get("name"),
        "status": (event.get("status") or {}).get("description"),
        "status_type": (event.get("status") or {}).get("type"),
        "startTimestamp": event.get("startTimestamp"),
        "tournament_id": unique_tournament.get("id"),
        "tournament_name": unique_tournament.get("name"),
        "tournament_slug": unique_tournament.get("slug"),
        "category": category.get("name"),
        "season_id": season.get("id"),
        "season_year": season.get("year"),
    }


def count_events(tournament_id: int, season_id: int) -> dict[str, Any]:
    result = {
        "last": 0,
        "next": 0,
        "samples": [],
    }

    for direction in ["last", "next"]:
        try:
            data = request_json(
                f"/unique-tournament/{tournament_id}/season/{season_id}/events/{direction}/0"
            )
        except Exception as error:
            print(f"    [AVISO] eventos {direction}/0 falharam: {error}")
            continue

        save_json(f"events_{tournament_id}_{season_id}_{direction}_0.json", data)

        events = data.get("events", [])

        if isinstance(events, list):
            result[direction] = len(events)
            result["samples"].extend(event_sample(event) for event in events[:4])

        time.sleep(0.6)

    return result


def main() -> None:
    print("=== Diagnostico direto SofaScore Brasileirao ===")
    print(f"Cliente HTTP: {'curl_cffi/chrome120' if USE_CURL_CFFI else 'requests'}")
    print("")

    found = []

    for tournament_id in CANDIDATE_TOURNAMENT_IDS:
        print(f"\nTestando tournament_id={tournament_id}")

        try:
            seasons_data = request_json(f"/unique-tournament/{tournament_id}/seasons")
        except Exception as error:
            print(f"  [ERRO] temporadas falharam: {error}")
            continue

        save_json(f"seasons_{tournament_id}.json", seasons_data)

        seasons = seasons_data.get("seasons", [])

        if not isinstance(seasons, list) or not seasons:
            print("  Sem temporadas.")
            continue

        # prioriza 2026, depois 2025, depois primeiras recentes
        ordered = sorted(
            seasons,
            key=lambda season: (
                str(season.get("year") or season.get("name") or "") != "2026",
                str(season.get("year") or season.get("name") or "") != "2025",
            )
        )

        for season in ordered[:8]:
            season_id = season.get("id")
            season_year = season.get("year") or season.get("name")

            if not season_id:
                continue

            print(f"  season_id={season_id} | year/name={season_year}")

            info = count_events(tournament_id, int(season_id))

            print(f"    last={info['last']} | next={info['next']}")

            for sample in info["samples"][:3]:
                print(
                    "    exemplo:",
                    sample["event_id"],
                    "|",
                    sample["home"],
                    "x",
                    sample["away"],
                    "|",
                    sample["tournament_name"],
                    "|",
                    sample["category"],
                    "|",
                    sample["status"],
                )

            if info["last"] or info["next"]:
                found.append({
                    "tournament_id": tournament_id,
                    "season_id": int(season_id),
                    "season_year": season_year,
                    "last": info["last"],
                    "next": info["next"],
                    "samples": info["samples"][:5],
                })

            time.sleep(0.8)

    print("\n=== Possiveis candidatos validos ===")

    if not found:
        print("Nenhum candidato com eventos encontrado.")
        return

    for item in found:
        print(
            f"- tournament_id={item['tournament_id']} | "
            f"season_id={item['season_id']} | "
            f"year={item['season_year']} | "
            f"last={item['last']} | next={item['next']}"
        )

        for sample in item["samples"][:2]:
            print(
                f"  {sample['event_id']} | {sample['home']} x {sample['away']} | "
                f"{sample['tournament_name']} | {sample['category']}"
            )


if __name__ == "__main__":
    main()