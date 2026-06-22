import pytest

from app.infra.database import DatabaseService


@pytest.fixture
def db():
    return DatabaseService()


def test_list_matches(db):
    matches = db.list_matches(5)
    assert isinstance(matches, list)


def test_list_players(db):
    players = db.list_players(5)
    assert isinstance(players, list)


def test_get_match(db):
    match = db.get_match(15691379)
    if match:
        assert "home_team" in match
        assert "away_team" in match
