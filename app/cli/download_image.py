import os
import sys
import time

from playwright.sync_api import sync_playwright


def download_image(player_id, match_id):
    root = os.path.dirname(os.path.dirname(os.path.dirname(__file__)))
    img_dir = os.path.join(root, 'data', 'raw', f'match_{match_id}')
    os.makedirs(img_dir, exist_ok=True)
    img_path = os.path.join(img_dir, f'player_{player_id}.png')

    if os.path.exists(img_path):
        print(f"Imagem já existe em {img_path}")
        return

    print(f"Baixando imagem do jogador {player_id} usando Playwright...")
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(
            user_agent='Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36'
        )
        page = context.new_page()
        page.goto('https://www.sofascore.com')
        time.sleep(2)

        url = f'https://img.sofascore.com/api/v1/player/{player_id}/image'
        response = page.goto(url)
        time.sleep(1)
        if response and response.ok:
            with open(img_path, 'wb') as f:
                f.write(response.body())
            print(f"Imagem salva com sucesso em {img_path}")
        else:
            status = response.status if response else 'Unknown'
            print(f"Falha ao baixar imagem: Status {status}")
        browser.close()


if __name__ == "__main__":
    if len(sys.argv) < 3:
        print("Uso: python -m app.cli.download_image <PLAYER_ID> <MATCH_ID>")
        sys.exit(1)
    download_image(sys.argv[1], sys.argv[2])
