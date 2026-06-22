from pathlib import Path
import streamlit as st
import streamlit.components.v1 as components

st.set_page_config(
    page_title="Copa do Mundo 2022 | Dashboard",
    page_icon="⚽",
    layout="wide",
    initial_sidebar_state="collapsed",
)

BASE_DIR = Path(__file__).parent
HTML_PATH = BASE_DIR / "app" / "frontend" / "copa2022.html"

st.markdown(
    """
    <style>
        .block-container {
            padding-top: 0rem;
            padding-bottom: 0rem;
            padding-left: 0rem;
            padding-right: 0rem;
            max-width: 100%;
        }

        header[data-testid="stHeader"] {
            display: none;
        }

        footer {
            display: none;
        }

        iframe {
            width: 100%;
            min-height: 100vh;
            border: none;
        }

        .mobile-warning {
            margin: 0;
            padding: 0.85rem 1rem;
            background: #111111;
            border-bottom: 1px solid rgba(212, 175, 55, 0.35);
            color: #f5f5f5;
            font-family: Arial, sans-serif;
            font-size: 0.9rem;
            text-align: center;
        }

        .mobile-warning strong {
            color: #d4af37;
        }
    </style>

    <div class="mobile-warning">
        <strong>Melhor experiência:</strong>
        acesse pelo computador. No celular, use a opção
        <strong>“site para computador”</strong> no navegador.
    </div>
    """,
    unsafe_allow_html=True,
)

if not HTML_PATH.exists():
    st.error(f"Arquivo HTML não encontrado: {HTML_PATH}")
    st.stop()

html = HTML_PATH.read_text(encoding="utf-8")

html = html.replace('/dashboard/assets/', 'app/frontend/assets/')

components.html(
    html,
    height=2400,
    scrolling=True,
)