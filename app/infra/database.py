import os
import sqlite3
from contextlib import contextmanager

DB_PATH = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))),
                       "data", "sofascore.db")
SCHEMA_PATH = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))),
                           "sql", "sofascore_schema.sql")


class DatabaseService:
    def __init__(self, db_path=None):
        self.db_path = db_path or DB_PATH
        self._init_schema()

    def _init_schema(self):
        os.makedirs(os.path.dirname(self.db_path), exist_ok=True)
        with open(SCHEMA_PATH, encoding="utf-8") as f:
            schema = f.read()
        with self._connect() as conn:
            conn.executescript(schema)
            conn.commit()

    @contextmanager
    def _connect(self):
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row
        try:
            yield conn
        finally:
            conn.close()

    # --- Matches ---
    def upsert_match(self, match_id, home_team, away_team,
                     home_score=None, away_score=None,
                     match_date=None, competition=None):
        with self._connect() as conn:
            conn.execute("""
                INSERT INTO matches (match_id, home_team, away_team,
                                     home_score, away_score, match_date, competition)
                VALUES (?, ?, ?, ?, ?, ?, ?)
                ON CONFLICT(match_id) DO UPDATE SET
                    home_team=excluded.home_team,
                    away_team=excluded.away_team,
                    home_score=COALESCE(excluded.home_score, matches.home_score),
                    away_score=COALESCE(excluded.away_score, matches.away_score),
                    fetched_at=datetime('now')
            """, (match_id, home_team, away_team, home_score, away_score,
                  match_date, competition))
            conn.commit()

    def get_match(self, match_id):
        with self._connect() as conn:
            row = conn.execute(
                "SELECT * FROM matches WHERE match_id = ?", (match_id,)
            ).fetchone()
            return dict(row) if row else None

    def list_matches(self, limit=20):
        with self._connect() as conn:
            rows = conn.execute(
                "SELECT * FROM matches ORDER BY fetched_at DESC LIMIT ?",
                (limit,)
            ).fetchall()
            return [dict(r) for r in rows]

    # --- Players ---
    def upsert_player(self, player_id, name, position=None,
                      team=None, image_url=None):
        with self._connect() as conn:
            conn.execute("""
                INSERT INTO players (player_id, name, position, team, image_url)
                VALUES (?, ?, ?, ?, ?)
                ON CONFLICT(player_id) DO UPDATE SET
                    name=excluded.name,
                    position=COALESCE(excluded.position, players.position),
                    team=COALESCE(excluded.team, players.team)
            """, (player_id, name, position, team, image_url))
            conn.commit()

    def get_player(self, player_id):
        with self._connect() as conn:
            row = conn.execute(
                "SELECT * FROM players WHERE player_id = ?", (player_id,)
            ).fetchone()
            return dict(row) if row else None

    def list_players(self, limit=100):
        with self._connect() as conn:
            rows = conn.execute(
                "SELECT * FROM players ORDER BY name LIMIT ?", (limit,)
            ).fetchall()
            return [dict(r) for r in rows]

    # --- Match Players (Lineups) ---
    def upsert_match_player(self, match_id, player_id, team_side,
                            is_starter=0, shirt_number=None,
                            rating=None, minutes_played=None):
        with self._connect() as conn:
            conn.execute("""
                INSERT INTO match_players
                    (match_id, player_id, team_side, is_starter,
                     shirt_number, rating, minutes_played)
                VALUES (?, ?, ?, ?, ?, ?, ?)
                ON CONFLICT(match_id, player_id) DO UPDATE SET
                    team_side=excluded.team_side,
                    is_starter=excluded.is_starter,
                    rating=COALESCE(excluded.rating, match_players.rating),
                    minutes_played=COALESCE(excluded.minutes_played,
                                            match_players.minutes_played)
            """, (match_id, player_id, team_side, is_starter,
                  shirt_number, rating, minutes_played))
            conn.commit()

    def get_match_players(self, match_id):
        with self._connect() as conn:
            rows = conn.execute("""
                SELECT mp.*, p.name, p.position
                FROM match_players mp
                JOIN players p ON p.player_id = mp.player_id
                WHERE mp.match_id = ?
                ORDER BY mp.team_side, mp.is_starter DESC
            """, (match_id,)).fetchall()
            return [dict(r) for r in rows]

    # --- Player Statistics ---
    def upsert_player_statistics(self, match_id, player_id, **kwargs):
        fields = {
            "total_pass", "accurate_pass", "total_long_balls", "goal_assist",
            "accurate_own_half_passes", "total_own_half_passes",
            "accurate_opposition_half_passes", "total_opposition_half_passes",
            "total_cross", "accurate_cross", "duel_lost", "duel_won",
            "total_contest", "won_contest", "big_chance_created",
            "on_target_scoring_attempt", "goals", "ball_recovery",
            "total_tackle", "won_tackle", "was_fouled", "fouls",
            "shot_off_target", "blocked_scoring_attempt", "total_clearance",
            "outfielder_block", "error_lead_to_goal", "minutes_played", "rating",
        }
        cols = ["match_id", "player_id"]
        vals = [match_id, player_id]
        placeholders = ["?", "?"]
        update_parts = []
        for k, v in kwargs.items():
            if k in fields and v is not None:
                cols.append(k)
                vals.append(v)
                placeholders.append("?")
                update_parts.append(f"{k}=excluded.{k}")
        if len(cols) == 2:
            return
        sql = f"""
            INSERT INTO player_statistics ({', '.join(cols)})
            VALUES ({', '.join(placeholders)})
            ON CONFLICT(match_id, player_id) DO UPDATE SET
                {', '.join(update_parts)},
                fetched_at=datetime('now')
        """
        with self._connect() as conn:
            conn.execute(sql, vals)
            conn.commit()

    def get_player_statistics(self, match_id, player_id):
        with self._connect() as conn:
            row = conn.execute(
                "SELECT * FROM player_statistics WHERE match_id=? AND player_id=?",
                (match_id, player_id)
            ).fetchone()
            return dict(row) if row else None

    # --- Player Events ---
    def save_player_events(self, match_id, player_id, events, event_type):
        with self._connect() as conn:
            conn.execute(
                "DELETE FROM player_events WHERE match_id=? AND player_id=? AND event_type=?",
                (match_id, player_id, event_type)
            )
            for e in events:
                coords = e.get("playerCoordinates", {})
                end_coords = e.get("passEndCoordinates", {})
                conn.execute("""
                    INSERT INTO player_events
                        (match_id, player_id, event_type, x, y,
                         end_x, end_y, outcome, keypass, is_home)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """, (
                    match_id, player_id, event_type,
                    coords.get("x", 0), coords.get("y", 0),
                    end_coords.get("x"), end_coords.get("y"),
                    1 if e.get("outcome") else 0,
                    1 if e.get("keypass") else 0,
                    1 if e.get("isHome") else 0,
                ))
            conn.commit()

    def get_player_events(self, match_id, player_id, event_type=None):
        with self._connect() as conn:
            if event_type:
                rows = conn.execute(
                    "SELECT * FROM player_events WHERE match_id=? AND player_id=? AND event_type=?",
                    (match_id, player_id, event_type)
                ).fetchall()
            else:
                rows = conn.execute(
                    "SELECT * FROM player_events WHERE match_id=? AND player_id=?",
                    (match_id, player_id)
                ).fetchall()
            return [dict(r) for r in rows]

    # --- Heatmap ---
    def save_heatmap(self, match_id, player_id, points):
        with self._connect() as conn:
            conn.execute(
                "DELETE FROM heatmap_points WHERE match_id=? AND player_id=?",
                (match_id, player_id)
            )
            for pt in points:
                conn.execute(
                    "INSERT INTO heatmap_points (match_id, player_id, x, y) VALUES (?, ?, ?, ?)",
                    (match_id, player_id, pt.get("x", 0), pt.get("y", 0))
                )
            conn.commit()

    def get_heatmap(self, match_id, player_id):
        with self._connect() as conn:
            rows = conn.execute(
                "SELECT x, y FROM heatmap_points WHERE match_id=? AND player_id=?",
                (match_id, player_id)
            ).fetchall()
            return [{"x": r["x"], "y": r["y"]} for r in rows]

    # --- Shotmap ---
    def save_shotmap(self, match_id, player_id, shots):
        with self._connect() as conn:
            conn.execute(
                "DELETE FROM shotmap_points WHERE match_id=? AND player_id=?",
                (match_id, player_id)
            )
            for s in shots:
                coords = s.get("playerCoordinates", {})
                conn.execute(
                    "INSERT INTO shotmap_points (match_id, player_id, x, y, shot_type) VALUES (?, ?, ?, ?, ?)",
                    (match_id, player_id,
                     coords.get("x", 0), coords.get("y", 0),
                     s.get("shotType", ""))
                )
            conn.commit()

    def get_shotmap(self, match_id, player_id):
        with self._connect() as conn:
            rows = conn.execute(
                "SELECT x, y, shot_type FROM shotmap_points WHERE match_id=? AND player_id=?",
                (match_id, player_id)
            ).fetchall()
            return [{"x": r["x"], "y": r["y"], "shotType": r["shot_type"]}
                    for r in rows]

    # --- Persist full player data from JSON dicts ---
    def persist_player_data(self, match_id, player_id, name, team_side,
                            stats_dict, events_dict, heatmap_list, shotmap_list,
                            rating=None, minutes=None, position=None):
        self.upsert_player(player_id, name, position=position)
        self.upsert_match_player(match_id, player_id, team_side,
                                 rating=rating, minutes_played=minutes)
        if stats_dict:
            self.upsert_player_statistics(match_id, player_id, **stats_dict)
        if events_dict:
            for etype, elist in events_dict.items():
                if elist:
                    self.save_player_events(match_id, player_id, elist, etype)
        if heatmap_list:
            self.save_heatmap(match_id, player_id, heatmap_list)
        if shotmap_list:
            self.save_shotmap(match_id, player_id, shotmap_list)
