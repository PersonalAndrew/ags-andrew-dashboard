import json
import logging
import os
import time

from playwright.sync_api import sync_playwright

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)


class SofascoreExtractor:
    def __init__(self, delay: float = 1.0):
        self.base_url = 'https://www.sofascore.com/api/v1'
        self.delay = delay

    def download_match_data(self, match_id: int, output_dir: str):
        match_dir = os.path.join(output_dir, f"match_{match_id}")
        os.makedirs(match_dir, exist_ok=True)

        logger.info(f"Iniciando Playwright para o jogo {match_id}...")

        with sync_playwright() as p:
            browser = p.chromium.launch(headless=True)
            context = browser.new_context(
                user_agent='Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
                viewport={'width': 1920, 'height': 1080}
            )
            page = context.new_page()

            logger.info("Acessando página principal do Sofascore para estabelecer sessão...")
            page.goto('https://www.sofascore.com', wait_until='domcontentloaded')
            time.sleep(3)

            def fetch_api(endpoint: str):
                url = f"{self.base_url}/{endpoint}"
                page.goto(url)
                time.sleep(self.delay)
                try:
                    content = page.locator("body").inner_text()
                    return json.loads(content)
                except Exception as e:
                    logger.error(f"Erro ao parsear JSON de {url}: {e}")
                    return None

            logger.info(f"Coletando escalações para a partida {match_id}")
            lineups = fetch_api(f"event/{match_id}/lineups")

            if not lineups or 'error' in lineups:
                logger.error("Falha ao obter escalações ou acesso bloqueado. Abortando extração.")
                browser.close()
                return

            with open(os.path.join(match_dir, "lineups.json"), 'w', encoding='utf-8') as f:
                json.dump(lineups, f, ensure_ascii=False, indent=4)

            player_ids = set()
            for team in ['home', 'away']:
                team_data = lineups.get(team, {})
                for squad_type in ['players', 'missingPlayers']:
                    for p in team_data.get(squad_type, []):
                        player = p.get('player', {})
                        p_id = player.get('id')
                        if p_id:
                            player_ids.add(p_id)

            player_ids = list(set(player_ids))
            total_players = len(player_ids)
            logger.info(f"Encontrados {total_players} jogadores na partida. Iniciando iteração...")

            api_base = f"https://www.sofascore.com/api/v1/event/{match_id}"
            for i, player_id in enumerate(player_ids, 1):
                stats_url = f"{api_base}/player/{player_id}/statistics"
                shotmap_url = f"{api_base}/shotmap/player/{player_id}"
                rating_url = f"{api_base}/player/{player_id}/rating-breakdown"

                try:
                    logger.info(f"[{i}/{total_players}] Processando jogador ID: {player_id}")

                    page.goto("https://www.sofascore.com/pt/")
                    time.sleep(1)

                    stats_response = page.request.get(stats_url)
                    if stats_response.ok:
                        stats_data = stats_response.json()
                        with open(os.path.join(match_dir, f"player_{player_id}_stats.json"), 'w', encoding='utf-8') as f:
                            json.dump(stats_data, f, ensure_ascii=False, indent=2)

                    time.sleep(1)

                    shotmap_response = page.request.get(shotmap_url)
                    if shotmap_response.ok:
                        shotmap_data = shotmap_response.json()
                        if shotmap_data.get('shotmap'):
                            with open(os.path.join(match_dir, f"player_{player_id}_shotmap.json"), 'w', encoding='utf-8') as f:
                                json.dump(shotmap_data, f, ensure_ascii=False, indent=2)

                    time.sleep(1)

                    rating_response = page.request.get(rating_url)
                    if rating_response.ok:
                        rating_data = rating_response.json()
                        with open(os.path.join(match_dir, f"player_{player_id}_rating.json"), 'w', encoding='utf-8') as f:
                            json.dump(rating_data, f, ensure_ascii=False, indent=2)

                except Exception as e:
                    logger.error(f"Erro ao processar jogador {player_id}: {e}")

            logger.info(f"Extração da partida {match_id} concluída com sucesso!")
            browser.close()


if __name__ == "__main__":
    extractor = SofascoreExtractor(delay=1.5)
    JOGO_ID = 15691379
    OUTPUT_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), 'data', 'raw')
    extractor.download_match_data(JOGO_ID, OUTPUT_DIR)
