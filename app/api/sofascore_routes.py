from __future__ import annotations

import json
from pathlib import Path
from typing import Any

from fastapi import APIRouter, HTTPException


router = APIRouter(prefix="/api/sofascore", tags=["SofaScore"])

ROOT_DIR = Path(__file__).resolve().parents[2]
DATA_DIR = ROOT_DIR / "data" / "sofascore"

MATCHES_FILE = DATA_DIR / "matches" / "worldcup_2026_matches.json"
TRENDS_FILE = DATA_DIR / "worldcup_2026_trends.json"
MANIFEST_FILE = DATA_DIR / "manifest.json"

STATISTICS_DIR = DATA_DIR / "statistics"
LINEUPS_DIR = DATA_DIR / "lineups"
SHOTMAP_DIR = DATA_DIR / "shotmap"
MOMENTUM_DIR = DATA_DIR / "momentum"


def read_json(path: Path) -> Any:
    if not path.exists():
        raise HTTPException(
            status_code=404,
            detail=f"Arquivo não encontrado: {path.name}",
        )

    with path.open("r", encoding="utf-8") as file:
        return json.load(file)


@router.get("/manifest")
def get_manifest() -> Any:
    return read_json(MANIFEST_FILE)


@router.get("/trends")
def get_trends() -> Any:
    return read_json(TRENDS_FILE)


@router.get("/matches")
def get_matches() -> Any:
    return read_json(MATCHES_FILE)


@router.get("/matches/{match_id}")
def get_match(match_id: int) -> Any:
    matches = read_json(MATCHES_FILE)

    for match in matches:
        if match.get("match_id") == match_id:
            return match

    raise HTTPException(
        status_code=404,
        detail=f"Jogo {match_id} não encontrado.",
    )


@router.get("/matches/{match_id}/statistics")
def get_match_statistics(match_id: int) -> Any:
    return read_json(STATISTICS_DIR / f"{match_id}.json")


@router.get("/matches/{match_id}/lineups")
def get_match_lineups(match_id: int) -> Any:
    return read_json(LINEUPS_DIR / f"{match_id}.json")


@router.get("/matches/{match_id}/shotmap")
def get_match_shotmap(match_id: int) -> Any:
    return read_json(SHOTMAP_DIR / f"{match_id}.json")


@router.get("/matches/{match_id}/momentum")
def get_match_momentum(match_id: int) -> Any:
    return read_json(MOMENTUM_DIR / f"{match_id}.json")