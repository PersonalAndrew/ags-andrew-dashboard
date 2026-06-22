"""
╔══════════════════════════════════════════════════════════════════════════════╗
║     🏆 COPA DO MUNDO FIFA 2022 — DASHBOARD ANALÍTICO PREMIUM                ║
║     Powered by: StatsBomb Open Data + mplsoccer + Streamlit + Plotly       ║
╚══════════════════════════════════════════════════════════════════════════════╝
"""

import io
import warnings

import matplotlib.patches as mpatches
import matplotlib.pyplot as plt
import pandas as pd
import plotly.express as px
import plotly.graph_objects as go
import streamlit as st
from matplotlib.colors import LinearSegmentedColormap
from mplsoccer import Pitch, Sbopen, VerticalPitch
from statsbombpy import sb

warnings.filterwarnings("ignore")

# ─────────────────────────────────────────────
# CONFIG PAGE
# ─────────────────────────────────────────────
st.set_page_config(
    page_title="🏆 Copa do Mundo 2022 — Dashboard Analítico",
    page_icon="⚽",
    layout="wide",
    initial_sidebar_state="expanded",
)

# ─────────────────────────────────────────────
# THEME CSS
# ─────────────────────────────────────────────
st.markdown("""
<style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;900&display=swap');

    html, body, [class*="css"] {
        font-family: 'Inter', sans-serif;
    }

    /* Background escuro premium */
    .stApp {
        background: linear-gradient(135deg, #0a0a1a 0%, #0d1117 50%, #111827 100%);
        color: #e2e8f0;
    }

    /* Sidebar */
    [data-testid="stSidebar"] {
        background: linear-gradient(180deg, #0d1117 0%, #161b22 100%);
        border-right: 1px solid rgba(255,215,0,0.2);
    }

    /* Métricas premium */
    [data-testid="metric-container"] {
        background: linear-gradient(135deg, rgba(255,215,0,0.1), rgba(255,140,0,0.05));
        border: 1px solid rgba(255,215,0,0.25);
        border-radius: 12px;
        padding: 16px;
        backdrop-filter: blur(10px);
    }

    [data-testid="metric-container"] [data-testid="stMetricValue"] {
        color: #FFD700;
        font-size: 2rem !important;
        font-weight: 700;
    }

    [data-testid="metric-container"] [data-testid="stMetricLabel"] {
        color: #94a3b8;
        font-size: 0.8rem;
        text-transform: uppercase;
        letter-spacing: 0.1em;
    }

    /* Headers */
    h1, h2, h3 { color: #FFD700 !important; }

    /* Tabs estilizadas */
    .stTabs [data-baseweb="tab-list"] {
        background: rgba(255,215,0,0.05);
        border-radius: 12px;
        padding: 4px;
        gap: 4px;
    }
    .stTabs [data-baseweb="tab"] {
        color: #94a3b8;
        border-radius: 8px;
        font-weight: 500;
    }
    .stTabs [aria-selected="true"] {
        background: linear-gradient(135deg, #FFD700, #FFA500) !important;
        color: #000 !important;
        font-weight: 700;
    }

    /* Selectbox e inputs */
    .stSelectbox > div > div {
        background: #161b22;
        border: 1px solid rgba(255,215,0,0.3);
        border-radius: 8px;
        color: #e2e8f0;
    }

    /* Cards de info */
    .info-card {
        background: linear-gradient(135deg, rgba(30,41,59,0.8), rgba(15,23,42,0.9));
        border: 1px solid rgba(255,215,0,0.2);
        border-radius: 16px;
        padding: 20px;
        margin: 8px 0;
    }

    /* Dividers */
    hr { border-color: rgba(255,215,0,0.2) !important; }

    /* DataFrames */
    .stDataFrame { border-radius: 12px; overflow: hidden; }

    /* Badges */
    .badge {
        display: inline-block;
        padding: 4px 12px;
        border-radius: 20px;
        font-size: 0.75rem;
        font-weight: 600;
        margin: 2px;
    }
    .badge-gold { background: linear-gradient(135deg, #FFD700, #FFA500); color: #000; }
    .badge-blue { background: rgba(59,130,246,0.3); color: #93c5fd; border: 1px solid rgba(59,130,246,0.4); }
    .badge-green { background: rgba(34,197,94,0.2); color: #86efac; border: 1px solid rgba(34,197,94,0.3); }
    .badge-red { background: rgba(239,68,68,0.2); color: #fca5a5; border: 1px solid rgba(239,68,68,0.3); }

    /* Scrollbar */
    ::-webkit-scrollbar { width: 6px; }
    ::-webkit-scrollbar-track { background: #0d1117; }
    ::-webkit-scrollbar-thumb { background: #FFD700; border-radius: 3px; }

    /* Expander */
    .streamlit-expanderHeader {
        background: rgba(255,215,0,0.08) !important;
        border: 1px solid rgba(255,215,0,0.2) !important;
        border-radius: 8px !important;
        color: #FFD700 !important;
    }
</style>
""", unsafe_allow_html=True)

# ─────────────────────────────────────────────
# CONSTANTES
# ─────────────────────────────────────────────
COMP_ID = 43       # FIFA World Cup
SEASON_ID = 106    # 2022

CORES = {
    "ouro":    "#FFD700",
    "laranja": "#FFA500",
    "verde":   "#00D26A",
    "vermelho":"#FF4757",
    "azul":    "#3B82F6",
    "roxo":    "#8B5CF6",
    "branco":  "#F1F5F9",
    "cinza":   "#334155",
    "fundo":   "#0a0a1a",
    "card":    "#0d1117",
}

# Mapa de cores para xG
CMAP_XG = LinearSegmentedColormap.from_list(
    "xg", ["#0a0a1a", "#1e3a5f", "#FFD700", "#FF4500"], N=256
)

# ─────────────────────────────────────────────
# CACHE: FUNÇÕES DE CARREGAMENTO DE DADOS
# ─────────────────────────────────────────────
@st.cache_data(show_spinner=False)
def load_matches():
    """Carrega todas as partidas da Copa 2022."""
    matches = sb.matches(competition_id=COMP_ID, season_id=SEASON_ID)
    matches = matches.sort_values(['competition_stage', 'match_date']).reset_index(drop=True)
    return matches

@st.cache_data(show_spinner=False)
def load_events(match_id: int):
    """Carrega todos os eventos de uma partida."""
    # Usar o parser Sbopen para dados completos
    parser = Sbopen()
    df_event, df_related, df_freeze, df_tactics = parser.event(match_id)
    
    # Map player to team name using lineups if possible
    try:
        lineups = load_lineups(match_id)
        player_team_map = {}
        for t_name, df_lin in lineups.items():
            if isinstance(df_lin, pd.DataFrame) and 'player_id' in df_lin.columns:
                for p_id in df_lin['player_id'].tolist():
                    player_team_map[p_id] = t_name
        df_tactics['team_name'] = df_tactics['player_id'].map(player_team_map)
    except Exception:
        # Fallback using events
        if 'team_name' in df_event.columns and 'player_id' in df_event.columns:
            p_t_map = df_event.dropna(subset=['player_id', 'team_name']).drop_duplicates('player_id').set_index('player_id')['team_name'].to_dict()
            df_tactics['team_name'] = df_tactics['player_id'].map(p_t_map)

    # Map position_id to standard pitch coordinates (x, y)
    POSITION_COORDS = {
        1: (6, 40),    # Goalkeeper
        2: (30, 72),   # Right Back
        3: (20, 52),   # Right Center Back
        4: (20, 40),   # Center Back
        5: (20, 28),   # Left Center Back
        6: (30, 8),    # Left Back
        7: (40, 72),   # Right Wing Back
        8: (40, 8),    # Left Wing Back
        9: (45, 52),   # Right Defensive Midfield
        10: (45, 40),  # Center Defensive Midfield
        11: (45, 28),  # Left Defensive Midfield
        12: (60, 72),  # Right Midfield
        13: (60, 52),  # Right Center Midfield
        14: (60, 40),  # Center Midfield
        15: (60, 28),  # Left Center Midfield
        16: (60, 8),   # Left Midfield
        17: (95, 72),  # Right Wing
        18: (80, 55),  # Right Attacking Midfield
        19: (80, 40),  # Center Attacking Midfield
        20: (80, 25),  # Left Attacking Midfield
        21: (95, 8),   # Left Wing
        22: (105, 52), # Right Center Forward
        23: (105, 40), # Center Forward
        24: (105, 28), # Left Center Forward
        25: (90, 40),  # Deep Lying Striker
    }
    if 'position_id' in df_tactics.columns:
        coords = df_tactics['position_id'].map(POSITION_COORDS)
        df_tactics['x'] = coords.apply(lambda val: val[0] if isinstance(val, tuple) else 50.0)
        df_tactics['y'] = coords.apply(lambda val: val[1] if isinstance(val, tuple) else 40.0)

    return df_event, df_related, df_freeze, df_tactics

@st.cache_data(show_spinner=False)
def load_lineups(match_id: int):
    """Carrega os lineups de uma partida."""
    lineups = sb.lineups(match_id=match_id)
    return lineups

@st.cache_data(show_spinner=False)
def load_all_events_agg():
    """Carrega e agrega eventos de TODAS as partidas para estatísticas globais."""
    matches = load_matches()
    all_shots = []
    all_passes = []
    
    progress = st.progress(0, text="📡 Carregando eventos...")
    for i, match_id in enumerate(matches['match_id'].tolist()):
        try:
            parser = Sbopen()
            df_event, _, _, _ = parser.event(match_id)
            
            shots = df_event[df_event['type_name'] == 'Shot'].copy()
            shots['match_id'] = match_id
            all_shots.append(shots)
            
            passes = df_event[df_event['type_name'] == 'Pass'].copy()
            passes['match_id'] = match_id
            all_passes.append(passes)
        except Exception:
            pass
        progress.progress((i + 1) / len(matches), 
                          text=f"📡 Carregando partida {i+1}/{len(matches)}...")
    
    progress.empty()
    
    shots_df = pd.concat(all_shots, ignore_index=True) if all_shots else pd.DataFrame()
    passes_df = pd.concat(all_passes, ignore_index=True) if all_passes else pd.DataFrame()
    return shots_df, passes_df

# ─────────────────────────────────────────────
# FUNÇÕES AUXILIARES DE VISUALIZAÇÃO
# ─────────────────────────────────────────────
def fig_to_image(fig):
    """Converte figura matplotlib para exibição no Streamlit."""
    buf = io.BytesIO()
    fig.savefig(buf, format="png", dpi=150, bbox_inches="tight",
                facecolor=fig.get_facecolor())
    buf.seek(0)
    return buf

def setup_dark_fig(w=12, h=8):
    """Cria figura com fundo escuro premium."""
    fig, ax = plt.subplots(figsize=(w, h))
    fig.set_facecolor(CORES["fundo"])
    ax.set_facecolor(CORES["fundo"])
    return fig, ax

def plot_pitch_dark():
    """Cria campo com tema escuro."""
    pitch = Pitch(
        pitch_type='statsbomb',
        pitch_color='#0d2137',
        line_color='#4a6fa5',
        goal_type='box',
        corner_arcs=True,
        linewidth=1.5,
    )
    return pitch

def scatter_shots(ax, pitch, shots_df, title="Chutes"):
    """Plota mapa de chutes com xG."""
    if shots_df.empty:
        ax.text(60, 40, "Sem dados", color="white", ha="center", fontsize=14)
        return
    
    goal = shots_df[shots_df['outcome_name'] == 'Goal']
    no_goal = shots_df[shots_df['outcome_name'] != 'Goal']
    
    # Chutes sem gol
    if not no_goal.empty and 'x' in no_goal.columns:
        xg_vals = no_goal.get('shot_statsbomb_xg', pd.Series([0.1]*len(no_goal)))
        pitch.scatter(
            no_goal['x'], no_goal['y'],
            s=xg_vals * 500 + 50,
            c=xg_vals,
            cmap=CMAP_XG,
            alpha=0.7,
            marker='o',
            edgecolors='white',
            linewidths=0.5,
            ax=ax,
            zorder=3,
        )
    
    # Gols
    if not goal.empty and 'x' in goal.columns:
        pitch.scatter(
            goal['x'], goal['y'],
            s=300,
            c=CORES['ouro'],
            marker='*',
            edgecolors='white',
            linewidths=1,
            ax=ax,
            zorder=5,
            label='Gol',
        )
    
    ax.set_title(title, color=CORES['ouro'], fontsize=14, fontweight='bold', pad=12)


def plot_pass_network(ax, pitch, passes_df, team_name):
    """Plota rede de passes entre jogadores."""
    if passes_df.empty or 'player_name' not in passes_df.columns:
        return
    
    team_passes = passes_df[
        (passes_df['team_name'] == team_name) &
        (passes_df['outcome_name'].isna())  # passes completados
    ].copy()
    
    if team_passes.empty:
        return
    
    # Calcular posição média
    avg_pos = team_passes.groupby('player_name')[['x', 'y']].mean()
    pass_counts = team_passes.groupby(['player_name', 'pass_recipient_name']).size().reset_index(name='count')
    pass_counts = pass_counts[pass_counts['count'] >= 3]
    
    # Plotar linhas de passe
    for _, row in pass_counts.iterrows():
        if row['player_name'] in avg_pos.index and row['pass_recipient_name'] in avg_pos.index:
            start = avg_pos.loc[row['player_name']]
            end = avg_pos.loc[row['pass_recipient_name']]
            width = min(row['count'] / 5, 5)
            pitch.lines(
                start['x'], start['y'],
                end['x'], end['y'],
                lw=width,
                color=CORES['azul'],
                alpha=0.4,
                ax=ax,
                zorder=2,
            )
    
    # Plotar nós dos jogadores
    player_counts = team_passes.groupby('player_name').size()
    for player, pos in avg_pos.iterrows():
        size = min(player_counts.get(player, 10) * 3, 800)
        pitch.scatter(
            pos['x'], pos['y'],
            s=size,
            c=CORES['ouro'],
            edgecolors='white',
            linewidths=1.5,
            ax=ax,
            zorder=4,
        )
        # Nome do jogador (abreviado)
        short = player.split()[-1] if ' ' in player else player
        ax.annotate(
            short[:10],
            (pos['x'], pos['y']),
            xytext=(0, 8),
            textcoords='offset points',
            ha='center',
            fontsize=6,
            color='white',
            fontweight='bold',
        )


def plot_heatmap_passes(ax, pitch, passes_df, team_name):
    """Plota heatmap de passes."""
    team_passes = passes_df[passes_df['team_name'] == team_name].copy()
    if team_passes.empty or 'x' not in team_passes.columns:
        return
    
    bs_heatmap = pitch.bin_statistic(
        team_passes['x'], team_passes['y'],
        statistic='count', bins=(25, 16)
    )
    pitch.heatmap(
        bs_heatmap,
        ax=ax,
        cmap='YlOrRd',
        edgecolors='none',
        alpha=0.8,
    )
    pitch.scatter(
        team_passes['x'], team_passes['y'],
        s=2, alpha=0.15, color='white', ax=ax,
    )

# ─────────────────────────────────────────────
# CABEÇALHO PRINCIPAL
# ─────────────────────────────────────────────
st.markdown("""
<div style="text-align: center; padding: 30px 0 10px 0;">
    <div style="font-size: 3.5rem; margin-bottom: 8px;">🏆</div>
    <h1 style="font-size: 2.8rem; font-weight: 900; background: linear-gradient(135deg, #FFD700, #FFA500, #FF6B35);
               -webkit-background-clip: text; -webkit-text-fill-color: transparent;
               background-clip: text; margin: 0; letter-spacing: -1px;">
        COPA DO MUNDO FIFA 2022
    </h1>
    <p style="color: #64748b; font-size: 1rem; margin: 4px 0 0 0; letter-spacing: 3px; text-transform: uppercase;">
        Dashboard Analítico Premium · StatsBomb Open Data
    </p>
    <div style="display: flex; justify-content: center; gap: 8px; margin-top: 12px; flex-wrap: wrap;">
        <span class="badge badge-gold">Qatar 2022</span>
        <span class="badge badge-blue">⚽ Dados de Eventos</span>
        <span class="badge badge-green">📊 mplsoccer</span>
        <span class="badge badge-red">🎯 xG Analytics</span>
    </div>
</div>
<hr/>
""", unsafe_allow_html=True)

# ─────────────────────────────────────────────
# CARREGAMENTO DE DADOS
# ─────────────────────────────────────────────
with st.spinner("⚽ Carregando dados da Copa do Mundo 2022..."):
    try:
        matches = load_matches()
        data_ok = True
    except Exception as e:
        st.error(f"❌ Erro ao carregar dados: {e}")
        data_ok = False

if not data_ok:
    st.stop()

# ─────────────────────────────────────────────
# SIDEBAR — SELEÇÃO DE PARTIDA
# ─────────────────────────────────────────────
with st.sidebar:
    st.markdown("""
    <div style="text-align:center; padding: 10px 0;">
        <div style="font-size: 2.5rem;">🏆</div>
        <div style="color: #FFD700; font-weight: 700; font-size: 1.1rem;">FIFA World Cup 2022</div>
        <div style="color: #64748b; font-size: 0.75rem;">Qatar • 21 Nov – 18 Dez</div>
    </div>
    <hr style="border-color: rgba(255,215,0,0.2)"/>
    """, unsafe_allow_html=True)
    
    st.markdown("### 🔍 Filtros")
    
    # Filtro de fase
    stages = ['Todas as Fases'] + sorted(matches['competition_stage'].unique().tolist())
    selected_stage = st.selectbox("📌 Fase:", stages)
    
    if selected_stage == 'Todas as Fases':
        filtered_matches = matches.copy()
    else:
        filtered_matches = matches[matches['competition_stage'] == selected_stage].copy()
    
    # Filtro de seleção
    all_teams = sorted(set(matches['home_team'].unique().tolist() + matches['away_team'].unique().tolist()))
    selected_team = st.selectbox("🌍 Filtrar por Seleção:", ['Todas'] + all_teams)
    
    if selected_team != 'Todas':
        filtered_matches = filtered_matches[
            (filtered_matches['home_team'] == selected_team) |
            (filtered_matches['away_team'] == selected_team)
        ]
    
    st.markdown("---")
    
    # Seleção de partida para análise detalhada
    st.markdown("### 🎯 Análise de Partida")
    
    match_labels = [
        f"{row['match_date'][:10]} · {row['home_team']} {row['home_score']}–{row['away_score']} {row['away_team']} ({row['competition_stage']})"
        for _, row in filtered_matches.iterrows()
    ]
    
    selected_match_label = st.selectbox("⚽ Partida:", match_labels)
    selected_match_idx = match_labels.index(selected_match_label)
    selected_match = filtered_matches.iloc[selected_match_idx]
    selected_match_id = int(selected_match['match_id'])
    
    st.markdown("---")
    
    # Info da partida selecionada
    st.markdown(f"""
    <div style="background: rgba(255,215,0,0.08); border: 1px solid rgba(255,215,0,0.2); 
                border-radius: 12px; padding: 14px; margin-top: 8px;">
        <div style="color: #FFD700; font-weight: 700; margin-bottom: 8px;">📋 Partida Selecionada</div>
        <div style="color: #94a3b8; font-size: 0.8rem; margin-bottom: 4px;">🏟️ {selected_match.get('stadium', 'N/A')}</div>
        <div style="color: #94a3b8; font-size: 0.8rem; margin-bottom: 4px;">📅 {str(selected_match['match_date'])[:10]}</div>
        <div style="color: #94a3b8; font-size: 0.8rem; margin-bottom: 4px;">🏆 {selected_match['competition_stage']}</div>
        <div style="color: #94a3b8; font-size: 0.8rem;">👨‍⚖️ Árbitro: {selected_match.get('referee', 'N/A')}</div>
    </div>
    """, unsafe_allow_html=True)

# ─────────────────────────────────────────────
# MÉTRICAS GLOBAIS DO TORNEIO
# ─────────────────────────────────────────────
st.markdown("## 📊 Visão Geral do Torneio")

col1, col2, col3, col4, col5, col6 = st.columns(6)
col1.metric("⚽ Partidas", len(matches))
col2.metric("🌍 Seleções", len(all_teams))
total_goals = int(matches['home_score'].sum() + matches['away_score'].sum())
col3.metric("⚽ Gols Totais", total_goals)
avg_goals = round(total_goals / len(matches), 2)
col4.metric("📈 Média Gols/Jogo", avg_goals)
col5.metric("🏟️ Estádios", matches['stadium'].nunique() if 'stadium' in matches.columns else 'N/A')
col6.metric("👨‍⚖️ Árbitros", matches['referee'].nunique() if 'referee' in matches.columns else 'N/A')

st.markdown("<br/>", unsafe_allow_html=True)

# ─────────────────────────────────────────────
# TABS PRINCIPAIS
# ─────────────────────────────────────────────
tab_visao, tab_partidas, tab_eventos, tab_campo, tab_lineups, tab_dados = st.tabs([
    "🌐 Torneio",
    "📋 Partidas",
    "⚡ Eventos",
    "🗺️ Mapas de Campo",
    "👥 Escalações",
    "🗂️ Dados Brutos",
])

# ═══════════════════════════════════════════════
# TAB 1 — VISÃO GERAL DO TORNEIO
# ═══════════════════════════════════════════════
with tab_visao:
    st.markdown("### 🏆 Resultados por Fase")
    
    # Tabela de gols por fase
    phase_stats = matches.groupby('competition_stage').agg(
        partidas=('match_id', 'count'),
        gols_total=('home_score', lambda x: x.sum() + matches.loc[x.index, 'away_score'].sum()),
    ).reset_index()
    phase_stats['media_gols'] = (phase_stats['gols_total'] / phase_stats['partidas']).round(2)
    phase_stats = phase_stats.sort_values('partidas', ascending=False)
    
    fig_phase = px.bar(
        phase_stats,
        x='competition_stage',
        y='gols_total',
        color='media_gols',
        color_continuous_scale=[[0,'#1e3a5f'], [0.5,'#FFA500'], [1,'#FFD700']],
        text='partidas',
        title="Gols por Fase do Torneio",
        labels={'competition_stage': 'Fase', 'gols_total': 'Total de Gols', 'partidas': 'Partidas'},
    )
    fig_phase.update_layout(
        paper_bgcolor='rgba(0,0,0,0)',
        plot_bgcolor='rgba(13,17,23,0.8)',
        font_color='#e2e8f0',
        title_font_color='#FFD700',
        showlegend=False,
    )
    fig_phase.update_traces(marker_line_color='rgba(255,215,0,0.3)', marker_line_width=1)
    st.plotly_chart(fig_phase, use_container_width=True)
    
    col_l, col_r = st.columns(2)
    
    with col_l:
        st.markdown("### 🥅 Top Resultados (Mais Gols)")
        matches_sorted = matches.copy()
        matches_sorted['total_gols'] = matches_sorted['home_score'] + matches_sorted['away_score']
        top_matches = matches_sorted.nlargest(10, 'total_gols')[
            ['match_date', 'home_team', 'home_score', 'away_score', 'away_team', 
             'competition_stage', 'total_gols']
        ]
        st.dataframe(
            top_matches.style.background_gradient(subset=['total_gols'], cmap='YlOrRd'),
            use_container_width=True, hide_index=True,
        )
    
    with col_r:
        st.markdown("### 📅 Distribuição de Gols por Data")
        matches_copy = matches.copy()
        matches_copy['data'] = pd.to_datetime(matches_copy['match_date']).dt.date
        matches_copy['gols'] = matches_copy['home_score'] + matches_copy['away_score']
        daily_goals = matches_copy.groupby('data')['gols'].sum().reset_index()
        
        fig_daily = px.area(
            daily_goals, x='data', y='gols',
            title="Gols por Dia de Jogo",
            color_discrete_sequence=['#FFD700'],
        )
        fig_daily.update_layout(
            paper_bgcolor='rgba(0,0,0,0)',
            plot_bgcolor='rgba(13,17,23,0.8)',
            font_color='#e2e8f0',
            title_font_color='#FFD700',
        )
        fig_daily.update_traces(fill='tozeroy', fillcolor='rgba(255,215,0,0.15)')
        st.plotly_chart(fig_daily, use_container_width=True)
    
    # Gols das seleções
    st.markdown("### 🌍 Desempenho das Seleções")
    team_home = matches[['home_team', 'home_score', 'away_score']].rename(
        columns={'home_team': 'team', 'home_score': 'gols_marcados', 'away_score': 'gols_sofridos'})
    team_away = matches[['away_team', 'away_score', 'home_score']].rename(
        columns={'away_team': 'team', 'away_score': 'gols_marcados', 'home_score': 'gols_sofridos'})
    team_stats = pd.concat([team_home, team_away]).groupby('team').agg(
        jogos=('gols_marcados', 'count'),
        gols_marcados=('gols_marcados', 'sum'),
        gols_sofridos=('gols_sofridos', 'sum'),
    ).reset_index()
    team_stats['saldo'] = team_stats['gols_marcados'] - team_stats['gols_sofridos']
    team_stats = team_stats.sort_values('gols_marcados', ascending=False)
    
    fig_teams = px.scatter(
        team_stats,
        x='gols_marcados',
        y='gols_sofridos',
        size='jogos',
        color='saldo',
        color_continuous_scale=[[0,'#FF4757'], [0.5,'#FFD700'], [1,'#00D26A']],
        text='team',
        title="Gols Marcados vs. Sofridos por Seleção",
        hover_data=['jogos', 'saldo'],
    )
    fig_teams.update_traces(textposition='top center', textfont_size=9)
    fig_teams.update_layout(
        paper_bgcolor='rgba(0,0,0,0)',
        plot_bgcolor='rgba(13,17,23,0.8)',
        font_color='#e2e8f0',
        title_font_color='#FFD700',
        height=500,
    )
    st.plotly_chart(fig_teams, use_container_width=True)

# ═══════════════════════════════════════════════
# TAB 2 — PARTIDAS
# ═══════════════════════════════════════════════
with tab_partidas:
    st.markdown(f"### 📋 {len(filtered_matches)} Partidas Encontradas")
    
    # Tabela completa de partidas
    display_cols = ['match_date', 'competition_stage', 'home_team', 'home_score', 
                    'away_score', 'away_team', 'stadium', 'referee', 'match_id']
    
    available_cols = [c for c in display_cols if c in filtered_matches.columns]
    df_display = filtered_matches[available_cols].copy()
    df_display['match_date'] = pd.to_datetime(df_display['match_date']).dt.strftime('%d/%m/%Y')
    df_display.columns = [c.replace('_', ' ').title() for c in df_display.columns]
    
    st.dataframe(
        df_display,
        use_container_width=True,
        hide_index=True,
        height=500,
    )
    
    # Árbitros
    if 'referee' in matches.columns:
        st.markdown("### 👨‍⚖️ Árbitros da Copa 2022")
        ref_stats = matches.groupby('referee').agg(
            jogos=('match_id', 'count'),
            gols_totais=('home_score', lambda x: x.sum() + matches.loc[x.index, 'away_score'].sum()),
        ).reset_index().sort_values('jogos', ascending=False)
        
        col_r1, col_r2 = st.columns([1, 1])
        with col_r1:
            st.dataframe(ref_stats, use_container_width=True, hide_index=True)
        with col_r2:
            fig_ref = px.bar(
                ref_stats.head(10),
                x='jogos', y='referee',
                orientation='h',
                color='gols_totais',
                color_continuous_scale=[[0,'#1e3a5f'], [1,'#FFD700']],
                title="Top 10 Árbitros por Jogos Apitados",
            )
            fig_ref.update_layout(
                paper_bgcolor='rgba(0,0,0,0)',
                plot_bgcolor='rgba(13,17,23,0.8)',
                font_color='#e2e8f0',
                title_font_color='#FFD700',
                yaxis={'categoryorder': 'total ascending'},
            )
            st.plotly_chart(fig_ref, use_container_width=True)

# ═══════════════════════════════════════════════
# TAB 3 — EVENTOS
# ═══════════════════════════════════════════════
with tab_eventos:
    st.markdown(f"""
    ### ⚡ Análise de Eventos
    **Partida selecionada:** `{selected_match['home_team']} {selected_match['home_score']}–{selected_match['away_score']} {selected_match['away_team']}`
    """)
    
    with st.spinner("🔄 Carregando eventos da partida..."):
        try:
            df_event, df_related, df_freeze, df_tactics = load_events(selected_match_id)
            events_ok = True
        except Exception as e:
            st.error(f"Erro ao carregar eventos: {e}")
            events_ok = False
    
    if events_ok:
        # Métricas de eventos
        st.markdown("#### 📊 Resumo de Eventos")
        event_types = df_event['type_name'].value_counts()
        
        col_e1, col_e2, col_e3, col_e4, col_e5 = st.columns(5)
        col_e1.metric("🦵 Passes", int(event_types.get('Pass', 0)))
        col_e2.metric("🥅 Chutes", int(event_types.get('Shot', 0)))
        col_e3.metric("⚡ Dribles", int(event_types.get('Dribble', 0)))
        col_e4.metric("🚫 Faltas", int(event_types.get('Foul Committed', 0)))
        col_e5.metric("🔧 Total Eventos", len(df_event))
        
        # Distribuição de eventos
        col_ev1, col_ev2 = st.columns(2)
        
        with col_ev1:
            top_events = event_types.head(15).reset_index()
            top_events.columns = ['Tipo de Evento', 'Quantidade']
            fig_ev = px.bar(
                top_events,
                x='Quantidade', y='Tipo de Evento',
                orientation='h',
                color='Quantidade',
                color_continuous_scale=[[0,'#1e3a5f'], [0.5,'#3B82F6'], [1,'#FFD700']],
                title="Tipos de Eventos na Partida",
            )
            fig_ev.update_layout(
                paper_bgcolor='rgba(0,0,0,0)',
                plot_bgcolor='rgba(13,17,23,0.8)',
                font_color='#e2e8f0',
                title_font_color='#FFD700',
                yaxis={'categoryorder': 'total ascending'},
                showlegend=False,
            )
            st.plotly_chart(fig_ev, use_container_width=True)
        
        with col_ev2:
            # Eventos por equipe
            if 'team_name' in df_event.columns:
                team_events = df_event.groupby(['team_name', 'type_name']).size().reset_index(name='count')
                top_types = event_types.head(8).index.tolist()
                team_events_filtered = team_events[team_events['type_name'].isin(top_types)]
                
                fig_team_ev = px.bar(
                    team_events_filtered,
                    x='type_name', y='count',
                    color='team_name',
                    barmode='group',
                    title="Eventos por Equipe",
                    color_discrete_map={
                        selected_match['home_team']: '#FFD700',
                        selected_match['away_team']: '#3B82F6',
                    },
                )
                fig_team_ev.update_layout(
                    paper_bgcolor='rgba(0,0,0,0)',
                    plot_bgcolor='rgba(13,17,23,0.8)',
                    font_color='#e2e8f0',
                    title_font_color='#FFD700',
                    xaxis_tickangle=-30,
                )
                st.plotly_chart(fig_team_ev, use_container_width=True)
        
        # Linha do tempo de eventos
        st.markdown("#### ⏱️ Linha do Tempo de Eventos")
        if 'minute' in df_event.columns:
            timeline = df_event.groupby(['minute', 'type_name']).size().reset_index(name='count')
            key_events = ['Shot', 'Foul Committed', 'Dribble', 'Ball Receipt*']
            timeline_key = timeline[timeline['type_name'].isin(key_events)]
            
            fig_timeline = px.scatter(
                timeline_key,
                x='minute', y='type_name',
                size='count',
                color='type_name',
                color_discrete_map={
                    'Shot': '#FFD700',
                    'Foul Committed': '#FF4757',
                    'Dribble': '#00D26A',
                    'Ball Receipt*': '#3B82F6',
                },
                title="Linha do Tempo — Eventos Chave por Minuto",
            )
            fig_timeline.update_layout(
                paper_bgcolor='rgba(0,0,0,0)',
                plot_bgcolor='rgba(13,17,23,0.8)',
                font_color='#e2e8f0',
                title_font_color='#FFD700',
                height=400,
            )
            fig_timeline.add_vline(x=45, line_dash="dash", line_color="rgba(255,255,255,0.3)", 
                                   annotation_text="HT", annotation_font_color="white")
            if df_event['minute'].max() > 90:
                fig_timeline.add_vline(x=90, line_dash="dash", line_color="rgba(255,255,255,0.3)",
                                       annotation_text="FT", annotation_font_color="white")
            st.plotly_chart(fig_timeline, use_container_width=True)
        
        # Análise de chutes e xG
        st.markdown("#### 🥅 Análise de Chutes & xG")
        shots = df_event[df_event['type_name'] == 'Shot'].copy()
        
        if not shots.empty:
            col_s1, col_s2 = st.columns(2)
            
            with col_s1:
                # xG por equipe
                if 'shot_statsbomb_xg' in shots.columns and 'team_name' in shots.columns:
                    xg_team = shots.groupby('team_name').agg(
                        chutes=('shot_statsbomb_xg', 'count'),
                        xg_total=('shot_statsbomb_xg', 'sum'),
                        gols=('outcome_name', lambda x: (x == 'Goal').sum()),
                    ).reset_index()
                    
                    fig_xg = go.Figure()
                    for _, row in xg_team.iterrows():
                        color = '#FFD700' if row['team_name'] == selected_match['home_team'] else '#3B82F6'
                        fig_xg.add_trace(go.Bar(
                            name=row['team_name'],
                            x=['xG Total', 'Gols', 'Chutes'],
                            y=[round(row['xg_total'], 2), row['gols'], row['chutes']],
                            marker_color=color,
                        ))
                    
                    fig_xg.update_layout(
                        title="xG, Gols e Chutes por Equipe",
                        paper_bgcolor='rgba(0,0,0,0)',
                        plot_bgcolor='rgba(13,17,23,0.8)',
                        font_color='#e2e8f0',
                        title_font_color='#FFD700',
                        barmode='group',
                    )
                    st.plotly_chart(fig_xg, use_container_width=True)
            
            with col_s2:
                # Distribuição de outcomes de chutes
                if 'outcome_name' in shots.columns:
                    outcomes = shots['outcome_name'].value_counts().reset_index()
                    outcomes.columns = ['Resultado', 'Quantidade']
                    
                    color_map = {
                        'Goal': '#FFD700',
                        'Saved': '#3B82F6',
                        'Off T': '#FF4757',
                        'Blocked': '#8B5CF6',
                        'Wayward': '#64748b',
                        'Post': '#F97316',
                    }
                    
                    fig_outcomes = px.pie(
                        outcomes,
                        values='Quantidade', names='Resultado',
                        title="Distribuição de Resultados dos Chutes",
                        color='Resultado',
                        color_discrete_map=color_map,
                        hole=0.4,
                    )
                    fig_outcomes.update_layout(
                        paper_bgcolor='rgba(0,0,0,0)',
                        font_color='#e2e8f0',
                        title_font_color='#FFD700',
                    )
                    st.plotly_chart(fig_outcomes, use_container_width=True)
        
        # Dados de freezes (frames 360°)
        if not df_freeze.empty:
            st.markdown("#### 📡 Dados de Freeze Frame (360°)")
            st.info("🎯 Esta partida possui dados de rastreamento 360° disponíveis!")
            
            with st.expander("Ver amostra dos Freeze Frames"):
                st.dataframe(df_freeze.head(50), use_container_width=True)
        
        # Táticas
        if not df_tactics.empty:
            st.markdown("#### 📋 Formações Táticas")
            st.dataframe(df_tactics, use_container_width=True, hide_index=True)


# ═══════════════════════════════════════════════
# TAB 4 — MAPAS DE CAMPO (mplsoccer)
# ═══════════════════════════════════════════════
with tab_campo:
    st.markdown(f"""
    ### 🗺️ Visualizações de Campo
    **Partida:** `{selected_match['home_team']} {selected_match['home_score']}–{selected_match['away_score']} {selected_match['away_team']}`
    """)
    
    with st.spinner("🔄 Gerando mapas de campo..."):
        try:
            df_event, _, df_freeze, _ = load_events(selected_match_id)
            campo_ok = True
        except Exception as e:
            st.error(f"Erro: {e}")
            campo_ok = False
    
    if campo_ok:
        home_team = selected_match['home_team']
        away_team = selected_match['away_team']
        
        teams_for_analysis = st.selectbox(
            "🎯 Selecionar Equipe para Análise de Campo:", 
            [home_team, away_team],
        )
        
        map_type = st.selectbox(
            "🗺️ Tipo de Mapa:",
            ["Mapa de Chutes", "Rede de Passes", "Heatmap de Passes", 
             "Mapa de Dribles", "Zonas de Pressão", "Defesas do Goleiro",
             "Chutes — Vista Frontal do Gol"],
        )
        
        # Filtrar eventos por equipe
        team_events = df_event[df_event['team_name'] == teams_for_analysis].copy()
        
        fig_pitch, axes = plt.subplots(1, 1, figsize=(13, 9))
        fig_pitch.set_facecolor(CORES['fundo'])
        
        pitch = plot_pitch_dark()
        pitch.draw(ax=axes)
        
        axes.set_facecolor('#0d2137')
        
        if map_type == "Mapa de Chutes":
            shots = team_events[team_events['type_name'] == 'Shot'].copy()
            scatter_shots(axes, pitch, shots, 
                          title=f"Mapa de Chutes — {teams_for_analysis}")
            
            # Legenda
            goal_patch = mpatches.Patch(color=CORES['ouro'], label='⭐ Gol')
            shot_patch = mpatches.Patch(color='#3B82F6', label='○ Chute (tamanho = xG)')
            axes.legend(handles=[goal_patch, shot_patch], loc='upper left',
                        facecolor='#0d1117', labelcolor='white', fontsize=9)
        
        elif map_type == "Rede de Passes":
            passes = team_events[
                (team_events['type_name'] == 'Pass') &
                (team_events['outcome_name'].isna())
            ].copy()
            plot_pass_network(axes, pitch, team_events, teams_for_analysis)
            axes.set_title(f"Rede de Passes — {teams_for_analysis}",
                           color=CORES['ouro'], fontsize=14, fontweight='bold')
        
        elif map_type == "Heatmap de Passes":
            passes = team_events[team_events['type_name'] == 'Pass'].copy()
            if not passes.empty and 'x' in passes.columns:
                bs = pitch.bin_statistic(passes['x'], passes['y'],
                                         statistic='count', bins=(25, 16))
                pcm = pitch.heatmap(bs, ax=axes, cmap='YlOrRd', edgecolors='none', alpha=0.85)
                pitch.scatter(passes['x'], passes['y'], s=2, alpha=0.2, color='white', ax=axes)
                plt.colorbar(pcm, ax=axes, shrink=0.8, label='Densidade de Passes')
            axes.set_title(f"Heatmap de Passes — {teams_for_analysis}",
                           color=CORES['ouro'], fontsize=14, fontweight='bold')
        
        elif map_type == "Mapa de Dribles":
            dribbles = team_events[team_events['type_name'] == 'Dribble'].copy()
            if not dribbles.empty and 'x' in dribbles.columns:
                successful = dribbles[dribbles['outcome_name'] == 'Complete']
                failed = dribbles[dribbles['outcome_name'] != 'Complete']
                
                if not successful.empty:
                    pitch.scatter(successful['x'], successful['y'], 
                                  s=120, c=CORES['verde'], marker='^',
                                  edgecolors='white', linewidths=0.8,
                                  ax=axes, zorder=4, label='Sucesso')
                if not failed.empty:
                    pitch.scatter(failed['x'], failed['y'],
                                  s=120, c=CORES['vermelho'], marker='v',
                                  edgecolors='white', linewidths=0.8,
                                  ax=axes, zorder=4, label='Falha')
                
                axes.legend(loc='upper left', facecolor='#0d1117', 
                            labelcolor='white', fontsize=10)
            axes.set_title(f"Mapa de Dribles — {teams_for_analysis}",
                           color=CORES['ouro'], fontsize=14, fontweight='bold')
        
        elif map_type == "Zonas de Pressão":
            pressure = team_events[team_events['type_name'] == 'Pressure'].copy()
            if not pressure.empty and 'x' in pressure.columns:
                bs = pitch.bin_statistic(pressure['x'], pressure['y'],
                                         statistic='count', bins=(20, 13))
                pcm = pitch.heatmap(bs, ax=axes, cmap='Reds', edgecolors='none', alpha=0.8)
                plt.colorbar(pcm, ax=axes, shrink=0.8, label='Intensidade de Pressão')
            axes.set_title(f"Zonas de Pressão — {teams_for_analysis}",
                           color=CORES['ouro'], fontsize=14, fontweight='bold')
        
        elif map_type == "Defesas do Goleiro":
            gk_events = team_events[team_events['type_name'].isin(
                ['Goal Keeper', 'Goalkeeper'])].copy()
            all_gk = df_event[df_event['type_name'].isin(['Goal Keeper', 'Goalkeeper'])].copy()
            away_gk = all_gk[all_gk['team_name'] != teams_for_analysis]
            
            # Chutes contra esta equipe
            opp_shots = df_event[
                (df_event['type_name'] == 'Shot') &
                (df_event['team_name'] != teams_for_analysis)
            ].copy()
            
            if not opp_shots.empty and 'x' in opp_shots.columns:
                # Usar VerticalPitch para visão do gol
                v_pitch = VerticalPitch(
                    pitch_type='statsbomb',
                    half=True,
                    pitch_color='#0d2137',
                    line_color='#4a6fa5',
                )
                fig_pitch.clear()
                v_pitch.draw(ax=axes)
                axes.set_facecolor('#0d2137')
                
                scatter_shots(axes, v_pitch, opp_shots,
                              title=f"Chutes contra {teams_for_analysis} (Defesas)")
            else:
                axes.set_title(f"Sem dados de GK para {teams_for_analysis}",
                               color='white', fontsize=12)
        
        elif map_type == "Chutes — Vista Frontal do Gol":
            shots = team_events[team_events['type_name'] == 'Shot'].copy()
            if not shots.empty:
                fig_pitch.clear()
                v_pitch = VerticalPitch(
                    pitch_type='statsbomb',
                    half=True,
                    pitch_color='#0d2137',
                    line_color='#4a6fa5',
                    goal_type='box',
                )
                v_pitch.draw(ax=axes)
                axes.set_facecolor('#0d2137')
                scatter_shots(axes, v_pitch, shots,
                              title=f"Vista de Chutes (Meia-Vertical) — {teams_for_analysis}")
        
        # Watermark
        fig_pitch.text(
            0.98, 0.02, "StatsBomb Open Data | mplsoccer",
            color='#ffffff33',
            ha='right', va='bottom', fontsize=8,
            transform=fig_pitch.transFigure,
        )
        
        plt.tight_layout()
        st.image(fig_to_image(fig_pitch), use_container_width=True)
        plt.close(fig_pitch)
        
        # Segundo campo — Passes completados (Arrow plot)
        st.markdown("#### 📍 Passes com Direção (Amostra)")
        passes_sample = team_events[
            (team_events['type_name'] == 'Pass') &
            (team_events['outcome_name'].isna())
        ].head(80).copy()
        
        if not passes_sample.empty and 'x' in passes_sample.columns and 'pass_end_x' in passes_sample.columns:
            fig2, ax2 = plt.subplots(figsize=(13, 9))
            fig2.set_facecolor(CORES['fundo'])
            
            pitch2 = plot_pitch_dark()
            pitch2.draw(ax=ax2)
            ax2.set_facecolor('#0d2137')
            
            # Colorir por terço do campo
            colors_pass = []
            for _, row in passes_sample.iterrows():
                if row['x'] < 40:
                    colors_pass.append(CORES['azul'])
                elif row['x'] < 80:
                    colors_pass.append(CORES['laranja'])
                else:
                    colors_pass.append(CORES['ouro'])
            
            pitch2.arrows(
                passes_sample['x'], passes_sample['y'],
                passes_sample['pass_end_x'], passes_sample['pass_end_y'],
                width=1.5,
                headwidth=4,
                headlength=4,
                color=colors_pass,
                alpha=0.65,
                ax=ax2,
            )
            
            ax2.set_title(
                f"Direção dos Passes — {teams_for_analysis}\n(🔵 Defesa | 🟠 Meio | 🟡 Ataque)",
                color=CORES['ouro'], fontsize=13, fontweight='bold',
            )
            
            plt.tight_layout()
            st.image(fig_to_image(fig2), use_container_width=True)
            plt.close(fig2)

# ═══════════════════════════════════════════════
# TAB 5 — ESCALAÇÕES (LINEUPS)
# ═══════════════════════════════════════════════
with tab_lineups:
    st.markdown(f"""
    ### 👥 Escalações
    **Partida:** `{selected_match['home_team']} {selected_match['home_score']}–{selected_match['away_score']} {selected_match['away_team']}`
    """)
    
    with st.spinner("🔄 Carregando escalações..."):
        try:
            lineups = load_lineups(selected_match_id)
            lineups_ok = True
        except Exception as e:
            st.error(f"Erro: {e}")
            lineups_ok = False
    
    if lineups_ok:
        teams = list(lineups.keys())
        
        col_h, col_a = st.columns(2)
        
        for col, team_name in zip([col_h, col_a], teams):
            with col:
                color_badge = "#FFD700" if team_name == selected_match['home_team'] else "#3B82F6"
                label = "🏠 CASA" if team_name == selected_match['home_team'] else "✈️ VISITANTE"
                
                st.markdown(f"""
                <div style="text-align:center; margin-bottom:12px;">
                    <span style="background: {color_badge}22; border: 1px solid {color_badge}44;
                                 border-radius:8px; padding:4px 16px; color:{color_badge}; 
                                 font-size:0.75rem; font-weight:700;">{label}</span>
                    <div style="color:{color_badge}; font-size:1.3rem; font-weight:800; margin-top:8px;">
                        {team_name}
                    </div>
                </div>
                """, unsafe_allow_html=True)
                
                df_lineup = lineups[team_name]
                
                # Extrair jogadores iniciais
                if isinstance(df_lineup, pd.DataFrame):
                    display_cols = []
                    for possible_col in ['player_name', 'player_nickname', 'jersey_number', 
                                        'position', 'country']:
                        if possible_col in df_lineup.columns:
                            display_cols.append(possible_col)
                    
                    if display_cols:
                        st.dataframe(
                            df_lineup[display_cols],
                            use_container_width=True,
                            hide_index=True,
                        )
                    else:
                        st.dataframe(df_lineup, use_container_width=True, hide_index=True)
                else:
                    st.write(df_lineup)
        
        # Formação tática visualizada
        st.markdown("### 🎨 Formação no Campo")
        
        try:
            df_event, _, _, df_tactics = load_events(selected_match_id)
            
            if not df_tactics.empty:
                col_t1, col_t2 = st.columns(2)
                
                for col, team_name in zip([col_t1, col_t2], teams):
                    with col:
                        team_tactics = df_tactics[df_tactics['team_name'] == team_name].head(11).copy()
                        
                        if not team_tactics.empty:
                            fig_tac, ax_tac = plt.subplots(figsize=(7, 10))
                            fig_tac.set_facecolor(CORES['fundo'])
                            
                            v_pitch = VerticalPitch(
                                pitch_type='statsbomb',
                                pitch_color='#0d2137',
                                line_color='#4a6fa5',
                                half=False,
                                goal_type='box',
                            )
                            v_pitch.draw(ax=ax_tac)
                            ax_tac.set_facecolor('#0d2137')
                            
                            color_team = CORES['ouro'] if team_name == selected_match['home_team'] else CORES['azul']
                            
                            if 'x' in team_tactics.columns and 'y' in team_tactics.columns:
                                v_pitch.scatter(
                                    team_tactics['x'], team_tactics['y'],
                                    s=500, c=color_team,
                                    edgecolors='white', linewidths=2,
                                    ax=ax_tac, zorder=4,
                                )
                                
                                for _, player in team_tactics.iterrows():
                                    short_name = str(player.get('player_name', '')).split()[-1][:8]
                                    jersey = str(player.get('jersey_number', ''))
                                    ax_tac.annotate(
                                        jersey,
                                        (player['x'], player['y']),
                                        ha='center', va='center',
                                        fontsize=9, fontweight='bold',
                                        color='black', zorder=5,
                                    )
                                    ax_tac.annotate(
                                        short_name,
                                        (player['x'], player['y']),
                                        xytext=(0, -14),
                                        textcoords='offset points',
                                        ha='center', fontsize=6.5,
                                        color='white', zorder=5,
                                    )
                            
                            # Obter a formação inicial do time a partir de df_event
                            team_starting_events = df_event[(df_event['team_name'] == team_name) & (df_event['tactics_formation'].notna())]
                            formation = team_starting_events['tactics_formation'].iloc[0] if not team_starting_events.empty else "N/A"
                            ax_tac.set_title(
                                f"{team_name}\nFormação: {formation}",
                                color=color_team, fontsize=12, fontweight='bold',
                            )
                            
                            plt.tight_layout()
                            st.image(fig_to_image(fig_tac), use_container_width=True)
                            plt.close(fig_tac)
        except Exception as e:
            st.warning(f"Não foi possível carregar formação: {e}")

# ═══════════════════════════════════════════════
# TAB 6 — DADOS BRUTOS
# ═══════════════════════════════════════════════
with tab_dados:
    st.markdown("### 🗂️ Explorador de Dados Brutos")
    
    data_source = st.selectbox(
        "📦 Fonte de Dados:",
        ["Partidas do Torneio", "Eventos da Partida", "Passes", "Chutes (xG)", 
         "Dribles", "Faltas", "Lineups", "Táticas"],
    )
    
    with st.spinner("🔄 Carregando dados..."):
        try:
            df_event, df_related, df_freeze, df_tactics = load_events(selected_match_id)
            lineups = load_lineups(selected_match_id)
        except Exception as e:
            st.error(f"Erro: {e}")
            st.stop()
    
    if data_source == "Partidas do Torneio":
        df_show = matches.copy()
        st.markdown(f"**{len(df_show)} partidas · {len(df_show.columns)} colunas**")
    
    elif data_source == "Eventos da Partida":
        df_show = df_event.copy()
        st.markdown(f"**{len(df_show)} eventos · {len(df_show.columns)} colunas**")
        
        # Filtro de tipo
        event_types = ['Todos'] + sorted(df_show['type_name'].unique().tolist())
        sel_type = st.selectbox("Filtrar por tipo:", event_types)
        if sel_type != 'Todos':
            df_show = df_show[df_show['type_name'] == sel_type]
    
    elif data_source == "Passes":
        df_show = df_event[df_event['type_name'] == 'Pass'].copy()
        st.markdown(f"**{len(df_show)} passes · {len(df_show.columns)} colunas**")
        
        # Métricas de passes
        completed = df_show[df_show['outcome_name'].isna()]
        c1, c2, c3 = st.columns(3)
        c1.metric("✅ Passes Completos", len(completed))
        c2.metric("❌ Incompletos", len(df_show) - len(completed))
        c3.metric("📊 Precisão", f"{len(completed)/len(df_show)*100:.1f}%" if len(df_show) > 0 else "N/A")
    
    elif data_source == "Chutes (xG)":
        df_show = df_event[df_event['type_name'] == 'Shot'].copy()
        st.markdown(f"**{len(df_show)} chutes · {len(df_show.columns)} colunas**")
        
        if 'shot_statsbomb_xg' in df_show.columns:
            c1, c2, c3, c4 = st.columns(4)
            total_xg = df_show['shot_statsbomb_xg'].sum()
            goals = (df_show['outcome_name'] == 'Goal').sum()
            c1.metric("⚽ Gols", int(goals))
            c2.metric("📈 xG Total", f"{total_xg:.2f}")
            c3.metric("🎯 xG/Gol", f"{total_xg/max(goals,1):.2f}")
            c4.metric("💥 Overperformance", f"{goals - total_xg:+.2f}")
    
    elif data_source == "Dribles":
        df_show = df_event[df_event['type_name'] == 'Dribble'].copy()
        st.markdown(f"**{len(df_show)} dribles**")
    
    elif data_source == "Faltas":
        df_show = df_event[df_event['type_name'] == 'Foul Committed'].copy()
        st.markdown(f"**{len(df_show)} faltas**")
    
    elif data_source == "Lineups":
        teams_list = list(lineups.keys())
        sel_team = st.selectbox("Equipe:", teams_list)
        df_show = lineups[sel_team]
        if not isinstance(df_show, pd.DataFrame):
            df_show = pd.DataFrame(df_show)
    
    elif data_source == "Táticas":
        df_show = df_tactics.copy()
        st.markdown(f"**{len(df_show)} registros táticos**")
    
    # Informações do dataframe
    col_info1, col_info2, col_info3 = st.columns(3)
    col_info1.metric("📊 Linhas", len(df_show))
    col_info2.metric("📋 Colunas", len(df_show.columns))
    col_info3.metric("💾 Tamanho", f"{df_show.memory_usage(deep=True).sum() / 1024:.1f} KB")
    
    # Seletor de colunas
    with st.expander("🔧 Selecionar Colunas"):
        all_cols = df_show.columns.tolist()
        selected_cols = st.multiselect(
            "Colunas a exibir:", all_cols, default=all_cols[:min(15, len(all_cols))]
        )
        if selected_cols:
            df_show = df_show[selected_cols]
    
    # Tabela principal
    st.dataframe(df_show, use_container_width=True, height=500)
    
    # Download
    csv_data = df_show.to_csv(index=False)
    st.download_button(
        label="⬇️ Baixar CSV",
        data=csv_data,
        file_name=f"statsbomb_{data_source.lower().replace(' ', '_')}.csv",
        mime="text/csv",
    )
    
    # Schema / dtypes
    with st.expander("📐 Schema do DataFrame"):
        schema_df = pd.DataFrame({
            'Coluna': df_show.dtypes.index,
            'Tipo': df_show.dtypes.values.astype(str),
            'Não-Nulos': df_show.count().values,
            '% Preenchido': (df_show.count() / len(df_show) * 100).round(1).values,
        })
        st.dataframe(schema_df, use_container_width=True, hide_index=True)

# ─────────────────────────────────────────────
# FOOTER
# ─────────────────────────────────────────────
st.markdown("<hr/>", unsafe_allow_html=True)
st.markdown("""
<div style="text-align: center; color: #475569; font-size: 0.8rem; padding: 16px 0;">
    🏆 <strong style="color: #FFD700;">Copa do Mundo FIFA 2022</strong> · 
    Dados: <a href="https://statsbomb.com/what-we-do/hub/free-data/" 
              style="color:#3B82F6;">StatsBomb Open Data</a> · 
    Visualizações: <a href="https://mplsoccer.readthedocs.io" 
                      style="color:#3B82F6;">mplsoccer</a> · 
    Dashboard por <strong style="color:#FFD700;">Antigravity IDE</strong>
</div>
""", unsafe_allow_html=True)
