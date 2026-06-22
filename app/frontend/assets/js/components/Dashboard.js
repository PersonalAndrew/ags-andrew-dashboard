import { api } from '../services/api.js';
import { PlayerSelector } from './PlayerSelector.js';
import { StatsRadar } from './StatsRadar.js';

const STAT_KEYS = [
    { key: 'totalPass', label: 'Passes', icon: '⤴️', suffix: '' },
    { key: 'accuratePass', label: 'Acerto', icon: '✓', suffix: '%', pct: true, base: 'totalPass' },
    { key: 'goalAssist', label: 'Assist.', icon: '🎯', suffix: '' },
    { key: 'totalCross', label: 'Cruzam.', icon: '×', suffix: '' },
    { key: 'duelWon', label: 'D. Ganhos', icon: '💪', suffix: '' },
    { key: 'totalTackle', label: 'Desarmes', icon: '🛡️', suffix: '' },
    { key: 'interceptions', label: 'Recuper.', icon: '↩️', suffix: '' },
    { key: 'wasFouled', label: 'Faltas Sof.', icon: '⚡', suffix: '' },
    { key: 'onTargetScoringAttempt', label: 'No Alvo', icon: '🎯', suffix: '' },
    { key: 'goals', label: 'Gols', icon: '⚽', suffix: '' },
];

export class Dashboard {
    constructor() {
        this.selector = new PlayerSelector(
            document.getElementById('player-select')
        );
        this.radar = new StatsRadar(
            document.getElementById('stats-radar')
        );
        this.heatmapImg = document.getElementById('heatmap-img');
        this.shotmapImg = document.getElementById('shotmap-img');
        this.passmapImg = document.getElementById('passmap-img');
        this.statsGrid = document.getElementById('stats-grid');
        this.playerInfo = document.getElementById('player-info');
    }

    async init() {
        try {
            const initialPlayerId = await this.selector.load();
            await this.loadPlayer(initialPlayerId);

            this.selector.onChange(async (playerId) => {
                await this.loadPlayer(playerId);
            });
        } catch (error) {
            console.error('Error initializing dashboard:', error);
        }
    }

    async loadPlayer(playerId) {
        try {
            const data = await api.getDashboardData(playerId);

            if (data.images?.heatmap) {
                this.heatmapImg.src = 'data:image/png;base64,' + data.images.heatmap;
                this.heatmapImg.alt = 'Heatmap do jogador';
            } else {
                this.heatmapImg.src = '';
                this.heatmapImg.alt = 'Nenhum mapa de calor disponível';
            }

            if (data.images?.shotmap) {
                this.shotmapImg.src = 'data:image/png;base64,' + data.images.shotmap;
                this.shotmapImg.alt = 'Mapa de chutes do jogador';
            } else {
                this.shotmapImg.src = '';
                this.shotmapImg.alt = 'Nenhum mapa de chutes disponível';
            }

            if (data.images?.passmap) {
                this.passmapImg.src = 'data:image/png;base64,' + data.images.passmap;
                this.passmapImg.alt = 'Mapa de passes do jogador';
            } else {
                this.passmapImg.src = '';
                this.passmapImg.alt = 'Nenhum mapa de passes disponível';
            }

            this.radar.render(data.stats);
            this.renderStatsGrid(data.stats);
            this.renderPlayerInfo(data.stats);
        } catch (error) {
            console.error('Error loading player dashboard:', error);
        }
    }

    renderPlayerInfo(stats) {
        const rating = stats.rating || '-';
        const mins = stats.minutesPlayed || '-';
        this.playerInfo.innerHTML = `
            <span class="info-badge">⭐ ${rating}</span>
            <span class="info-badge">⏱ ${mins} min</span>
        `;
    }

    renderStatsGrid(stats) {
        this.statsGrid.innerHTML = '';
        STAT_KEYS.forEach(({ key, label, icon, suffix, pct, base }) => {
            let value = stats[key] ?? 0;
            if (pct && base) {
                const baseVal = stats[base] ?? 0;
                value = baseVal > 0 ? Math.round((value / baseVal) * 100) : 0;
            }
            const card = document.createElement('div');
            card.className = 'stat-card';
            card.innerHTML = `
                <div class="stat-value">${value}${suffix}</div>
                <div class="stat-label">${icon} ${label}</div>
            `;
            this.statsGrid.appendChild(card);
        });
    }
}
