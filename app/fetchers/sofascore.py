import asyncio
import json
import os
import sys

from playwright.async_api import async_playwright

MATCH_ID = "16130149"
BASE_URL = f"https://api.sofascore.com/api/v1/event/{MATCH_ID}"

ENDPOINTS = {
    "heatmap": "/player/{player_id}/heatmap",
    "shotmap": "/shotmap/player/{player_id}",
    "rating_breakdown": "/player/{player_id}/rating-breakdown",
    "incidents": "/incidents",
    "statistics": "/player/{player_id}/statistics",
}


class SofascoreFetcher:
    def __init__(self, match_id=None, output_base=None):
        self.match_id = match_id or MATCH_ID
        self.base_url = f"https://api.sofascore.com/api/v1/event/{self.match_id}"
        self.output_base = output_base or os.path.join(
            os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "data"
        )

    async def fetch_player(self, player_id):
        out_dir = os.path.join(self.output_base, f"sofascore_player_{player_id}")
        os.makedirs(out_dir, exist_ok=True)
        async with async_playwright() as p:
            browser = await p.chromium.launch(headless=True)
            context = await browser.new_context(
                user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
            )
            page = await context.new_page()

            print("Visitando página inicial do SofaScore para obter cookies...")
            await page.goto("https://www.sofascore.com/", wait_until="domcontentloaded")

            for name, endpoint_template in ENDPOINTS.items():
                endpoint = endpoint_template.replace("{player_id}", player_id)
                url = self.base_url + endpoint
                print(f"Buscando {name} de {url}...")

                response = await page.goto(url)
                if response.status == 200:
                    try:
                        data = await response.json()
                        out_path = os.path.join(out_dir, f"{name}.json")
                        with open(out_path, "w", encoding="utf-8") as f:
                            json.dump(data, f, indent=4, ensure_ascii=False)
                        print(f"[OK] Salvo: {out_path}")
                    except Exception as e:
                        print(f"[ERRO JSON] {e}")
                else:
                    print(f"[ERRO] {response.status} em {name}")

            await browser.close()


async def fetch_data():
    player_id = sys.argv[1] if len(sys.argv) > 1 else "12345"
    fetcher = SofascoreFetcher()
    await fetcher.fetch_player(player_id)


if __name__ == "__main__":
    asyncio.run(fetch_data())
