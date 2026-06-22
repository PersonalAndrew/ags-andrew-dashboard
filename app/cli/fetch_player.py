import asyncio
import sys

from app.fetchers.sofascore import SofascoreFetcher


def fetch_player(player_id):
    fetcher = SofascoreFetcher()
    asyncio.run(fetcher.fetch_player(player_id))


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Uso: python -m app.cli.fetch_player <PLAYER_ID>")
        sys.exit(1)
    fetch_player(sys.argv[1])
