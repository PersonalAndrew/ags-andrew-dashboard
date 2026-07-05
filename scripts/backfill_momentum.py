from __future__ import annotations

import json
import time
from pathlib import Path
from typing import Any

from curl_cffi import requests


BASE_URL = "https://api.sofascore.com/api/v1"
MATCHES_PATH = Path("data/sofascore/matches/worldcup_2026_matches.json")
MOMENTUM_DIR = Path("data/sofascore/momentum")


def load_json(path: Path) -> Any:
    with path.open("r", encoding="utf-8") as file:
        return json.load(file)


def save_json(path: Path, data: Any) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)

    with path.open("w", encoding="utf-8") as file:
        json.dump(data, file, ensure_ascii=False, indent=2)


def request_graph(match_id: int) -> dict[str, Any] | None:
    url = f"{BASE_URL}/event/{match_id}/graph"

    print(f"Buscando momentum: {url}")

    try:
        response = requests.get(
            url,
            impersonate="chrome120",
            timeout=30,
            headers={
                "Accept": "application/json",
                "User-Agent": "Mozilla/5.0",
            },
        )

        if response.status_code != 200:
            print(f"Sem momentum: {match_id} | status {response.status_code}")
            return None

        data = response.json()

        if not data:
            print(f"Momentum vazio: {match_id}")
            return None

        return data

    except Exception as error:
        print(f"Erro ao buscar momentum {match_id}: {error}")
        return None


def main() -> None:
    if not MATCHES_PATH.exists():
        raise FileNotFoundError(f"Arquivo não encontrado: {MATCHES_PATH}")

    MOMENTUM_DIR.mkdir(parents=True, exist_ok=True)

    matches = load_json(MATCHES_PATH)

    if not isinstance(matches, list):
        raise ValueError("O arquivo de partidas precisa ser uma lista.")

    finished_matches = [
        match for match in matches
        if match.get("status_type") == "finished" and match.get("match_id")
    ]

    print("=" * 50)
    print("Backfill de momentum SofaScore")
    print("=" * 50)
    print(f"Jogos finalizados encontrados: {len(finished_matches)}")
    print()

    created = 0
    skipped = 0
    missing = 0

    for match in finished_matches:
        match_id = int(match["match_id"])
        output_path = MOMENTUM_DIR / f"{match_id}.json"

        if output_path.exists():
            skipped += 1
            continue

        data = request_graph(match_id)

        if data is None:
            missing += 1
            time.sleep(0.25)
            continue

        save_json(output_path, data)
        created += 1

        print(f"OK momentum salvo: {match_id}")
        time.sleep(0.35)

    print()
    print("=" * 50)
    print("Backfill finalizado")
    print("=" * 50)
    print(f"Já existiam: {skipped}")
    print(f"Criados agora: {created}")
    print(f"Sem retorno da API: {missing}")
    print("=" * 50)


if __name__ == "__main__":
    main()