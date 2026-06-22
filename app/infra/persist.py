import json
import os

from app.infra.database import DatabaseService

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(__file__)))

MATCH_ID = "15691379"


def ingest_match_data(db: DatabaseService, match_id: str = MATCH_ID):
    """Ingere dados de uma partida do JSON para o banco SQLite."""
    match_dir = os.path.join(ROOT, "data", "raw", f"match_{match_id}")
    if not os.path.exists(match_dir):
        print(f"[persist] Diretório não encontrado: {match_dir}")
        return

    # 1. Lineups
    lineups_path = os.path.join(match_dir, "lineups.json")
    if not os.path.exists(lineups_path):
        print("[persist] lineups.json não encontrado")
        return

    with open(lineups_path, encoding="utf-8") as f:
        lineups = json.load(f)

    home_team = lineups.get("home", {}).get("name", "Home")
    away_team = lineups.get("away", {}).get("name", "Away")
    db.upsert_match(int(match_id), home_team, away_team,
                    match_date="2024", competition="Friendly")

    for team_side in ("home", "away"):
        for item in lineups.get(team_side, {}).get("players", []):
            p = item.get("player", {})
            pid = str(p.get("id"))
            name = p.get("name", "")
            pos = p.get("position", "")
            shirt = p.get("shirtNumber")
            stats = item.get("statistics", {})

            db.upsert_player(pid, name, position=pos)
            db.upsert_match_player(
                int(match_id), pid, team_side,
                is_starter=1,
                shirt_number=shirt,
                rating=stats.get("rating"),
                minutes_played=stats.get("minutesPlayed"),
            )

    # 2. Per-player stats files
    import glob
    for stats_path in glob.glob(os.path.join(match_dir, "*_stats.json")):
        fname = os.path.basename(stats_path)
        pid = fname.split("_")[1]
        with open(stats_path, encoding="utf-8") as f:
            raw = json.load(f)
        stats_dict = raw.get("statistics", raw)
        db.upsert_player_statistics(int(match_id), pid, **stats_dict)

    # 3. Shotmaps
    for shot_path in glob.glob(os.path.join(match_dir, "*_shotmap.json")):
        fname = os.path.basename(shot_path)
        pid = fname.split("_")[1]
        with open(shot_path, encoding="utf-8") as f:
            raw = json.load(f)
        shots = raw.get("shotmap", [])
        if shots:
            db.save_shotmap(int(match_id), pid, shots)

    # 4. Events
    for evt_path in glob.glob(os.path.join(match_dir, "*_events.json")):
        fname = os.path.basename(evt_path)
        pid = fname.split("_")[1]
        with open(evt_path, encoding="utf-8") as f:
            evt_data = json.load(f)
        for etype in ("passes", "dribbles", "defensive", "ball-carries"):
            elist = evt_data.get(etype, [])
            if elist:
                db.save_player_events(int(match_id), pid, elist, etype.rstrip("s").replace("-", "_"))

    print(f"[persist] Dados da partida {match_id} ingeridos com sucesso!")


def ingest_sofascore_data(db: DatabaseService, match_id: str = "16130149"):
    """Ingere dados do diretório sofascore_player_{id}."""
    import glob
    base = os.path.join(ROOT, "data")
    for pdir in glob.glob(os.path.join(base, "sofascore_player_*")):
        pid = os.path.basename(pdir).replace("sofascore_player_", "")

        rating_data = None
        rp = os.path.join(pdir, "rating_breakdown.json")
        if os.path.exists(rp):
            with open(rp, encoding="utf-8") as f:
                rating_data = json.load(f)

        stats_data = None
        sp = os.path.join(pdir, "statistics.json")
        if os.path.exists(sp):
            with open(sp, encoding="utf-8") as f:
                stats_data = json.load(f)

        heatmap_data = None
        hp = os.path.join(pdir, "heatmap.json")
        if os.path.exists(hp):
            with open(hp, encoding="utf-8") as f:
                hd = json.load(f)
            heatmap_data = hd.get("heatmap", [])

        shotmap_data = None
        smp = os.path.join(pdir, "shotmap.json")
        if os.path.exists(smp):
            with open(smp, encoding="utf-8") as f:
                sd = json.load(f)
            shotmap_data = sd.get("shotmap", [])

        if rating_data:
            for etype, db_type in [("passes", "pass"), ("dribbles", "dribble"),
                                    ("defensive", "defensive"), ("ball-carries", "ball_carry")]:
                elist = rating_data.get(etype, [])
                if elist:
                    db.save_player_events(int(match_id), pid, elist, db_type)

        if heatmap_data:
            db.save_heatmap(int(match_id), pid, heatmap_data)

        if shotmap_data:
            db.save_shotmap(int(match_id), pid, shotmap_data)

        if stats_data:
            s = stats_data.get("statistics", stats_data)
            db.upsert_player_statistics(int(match_id), pid, **s)

        print(f"[persist] Jogador {pid} ingerido.")

    print("[persist] Todos os dados do SofaScore foram ingeridos!")


if __name__ == "__main__":
    db = DatabaseService()
    ingest_match_data(db)
    ingest_sofascore_data(db)
