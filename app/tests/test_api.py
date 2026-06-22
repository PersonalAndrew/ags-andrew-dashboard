def test_health(client):
    resp = client.get("/api/players")
    assert resp.status_code == 200
    data = resp.json()
    assert "players" in data


def test_dashboard_data(client):
    resp = client.get("/api/dashboard-data?player_id=866469")
    assert resp.status_code == 200
    data = resp.json()
    assert "images" in data
    assert "stats" in data


def test_matches(client):
    resp = client.get("/api/matches")
    assert resp.status_code == 200
    data = resp.json()
    assert "matches" in data


def test_list_players_db(client):
    resp = client.get("/api/players/db")
    assert resp.status_code == 200
    data = resp.json()
    assert "players" in data
