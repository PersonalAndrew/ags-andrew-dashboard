const DATA_BASE_PATH = "/dashboard/assets/data/copa2026";
const TEAMS_IMG_PATH = "/dashboard/assets/img/teams";

const copa2026State = {
    match: {
        competition: "Copa do Mundo 2026",
        source: "SofaScore",
        date: "17 JUN 2026",
        homeTeam: "Inglaterra",
        awayTeam: "Croácia",
        homeCode: "ENG",
        awayCode: "CRO",
        homeScore: 4,
        awayScore: 2,
    },
};

const statTranslations = {
    ballPossession: "Posse de bola",
    expectedGoals: "Gols esperados",
    bigChanceCreated: "Grandes chances",
    totalShotsOnGoal: "Finalizações",
    totalShots: "Finalizações",
    shotsOnGoal: "Finalizações no gol",
    shotsOnTarget: "Finalizações no gol",
    cornerKicks: "Escanteios",
    passes: "Passes",
    accuratePasses: "Passes certos",
    finalThirdEntries: "Entradas no terço final",
    touchesInOppBox: "Toques na área",
};

async function loadJson(path) {
    const response = await fetch(path);

    if (!response.ok) {
        throw new Error(`Erro ao carregar ${path}`);
    }

    return response.json();
}

function getAllPeriod(statisticsData) {
    const blocks = statisticsData?.statistics || [];
    return blocks.find((block) => block.period === "ALL") || blocks[0] || {};
}

function flattenStatistics(statisticsData) {
    const period = getAllPeriod(statisticsData);
    const rows = [];

    for (const group of period.groups || []) {
        for (const item of group.statisticsItems || []) {
            rows.push({
                group: group.groupName || "-",
                name: item.name || "-",
                key: item.key || "",
                home: item.home ?? "-",
                away: item.away ?? "-",
                homeValue: item.homeValue ?? 0,
                awayValue: item.awayValue ?? 0,
            });
        }
    }

    return rows;
}

function findStat(statsRows, keys) {
    return statsRows.find((row) => keys.includes(row.key)) || null;
}

function getShotmapSummary(shotmapData) {
    const shots = shotmapData?.shotmap || [];

    const homeShots = shots.filter((shot) => shot.isHome);
    const awayShots = shots.filter((shot) => !shot.isHome);

    const homeXg = homeShots.reduce((sum, shot) => sum + Number(shot.xg || 0), 0);
    const awayXg = awayShots.reduce((sum, shot) => sum + Number(shot.xg || 0), 0);

    const homeGoals = homeShots.filter((shot) => shot.shotType === "goal").length;
    const awayGoals = awayShots.filter((shot) => shot.shotType === "goal").length;

    const homeOnTarget = homeShots.filter((shot) => ["goal", "save"].includes(shot.shotType)).length;
    const awayOnTarget = awayShots.filter((shot) => ["goal", "save"].includes(shot.shotType)).length;

    const homeAccuracy = homeShots.length ? (homeOnTarget / homeShots.length) * 100 : 0;
    const awayAccuracy = awayShots.length ? (awayOnTarget / awayShots.length) * 100 : 0;

    return {
        homeShots,
        awayShots,
        homeShotsCount: homeShots.length,
        awayShotsCount: awayShots.length,
        homeXg,
        awayXg,
        homeGoals,
        awayGoals,
        homeOnTarget,
        awayOnTarget,
        homeAccuracy,
        awayAccuracy,
    };
}

function updateKpiCard(index, label, value, note) {
    const cards = document.querySelectorAll(".kpi-card");
    const card = cards[index];

    if (!card) return;

    const labelElement = card.querySelector(".kpi-label");
    const valueElement = card.querySelector("strong");
    const noteElement = card.querySelector("small");

    if (labelElement) labelElement.textContent = label;
    if (valueElement) valueElement.textContent = value;
    if (noteElement) noteElement.textContent = note;
}

function updateTeamLogos() {
    const flagBoxes = document.querySelectorAll(".flag-placeholder");

    if (flagBoxes[0]) {
        flagBoxes[0].innerHTML = `
            <img
                src="${TEAMS_IMG_PATH}/england.png"
                alt="Inglaterra"
                class="team-logo-img"
            >
        `;
    }

    if (flagBoxes[1]) {
        flagBoxes[1].innerHTML = `
            <img
                src="${TEAMS_IMG_PATH}/croatia.png"
                alt="Croácia"
                class="team-logo-img"
            >
        `;
    }
}

function updateHeroText() {
    const heroTitle = document.querySelector(".hero-card h1");

    if (heroTitle) {
        heroTitle.textContent = `${copa2026State.match.homeTeam} ${copa2026State.match.homeScore} x ${copa2026State.match.awayScore} ${copa2026State.match.awayTeam}`;
    }
}

function getStatPercentages(homeValue, awayValue) {
    const homeNumber = Number(homeValue) || 0;
    const awayNumber = Number(awayValue) || 0;
    const total = Math.abs(homeNumber) + Math.abs(awayNumber);

    if (!total) {
        return {
            home: 50,
            away: 50,
        };
    }

    return {
        home: Math.max(4, (Math.abs(homeNumber) / total) * 100),
        away: Math.max(4, (Math.abs(awayNumber) / total) * 100),
    };
}

function renderStatRow(row) {
    const label = statTranslations[row.key] || row.name;
    const percentages = getStatPercentages(row.homeValue, row.awayValue);

    return `
        <div class="stat-compare-row">
            <div class="stat-compare-top">
                <div class="stat-home-value">${row.home}</div>
                <div class="stat-label">${label}</div>
                <div class="stat-away-value">${row.away}</div>
            </div>

            <div class="stat-bars">
                <div class="stat-bar-wrap">
                    <div
                        class="stat-bar-home"
                        style="width: ${percentages.home}%"
                    ></div>
                </div>

                <div class="stat-bar-wrap">
                    <div
                        class="stat-bar-away"
                        style="width: ${percentages.away}%"
                    ></div>
                </div>
            </div>
        </div>
    `;
}

function renderStatsComparison(statsRows) {
    const box = document.querySelector("#stats-comparison-box");

    if (!box) return;

    const wantedKeys = [
        ["ballPossession"],
        ["expectedGoals"],
        ["bigChanceCreated"],
        ["totalShotsOnGoal", "totalShots"],
        ["shotsOnGoal", "shotsOnTarget"],
        ["cornerKicks"],
        ["passes"],
        ["finalThirdEntries"],
    ];

    const selectedRows = wantedKeys
        .map((keys) => findStat(statsRows, keys))
        .filter(Boolean);

    if (!selectedRows.length) {
        box.innerHTML = `<div class="loading-card">Não foi possível carregar as estatísticas.</div>`;
        return;
    }

    box.innerHTML = selectedRows.map(renderStatRow).join("");
}

function renderShotSummary(shotSummary) {
    const box = document.querySelector("#shot-summary-box");

    if (!box) return;

    box.innerHTML = `
        <div class="shot-summary-grid">
            <div class="shot-team-card">
                <h3>Inglaterra</h3>

                <div class="shot-team-stat">
                    <span>Finalizações</span>
                    <strong>${shotSummary.homeShotsCount}</strong>
                </div>

                <div class="shot-team-stat">
                    <span>No gol</span>
                    <strong>${shotSummary.homeOnTarget}</strong>
                </div>

                <div class="shot-team-stat">
                    <span>Gols</span>
                    <strong>${shotSummary.homeGoals}</strong>
                </div>

                <div class="shot-team-stat">
                    <span>xG</span>
                    <strong>${shotSummary.homeXg.toFixed(2)}</strong>
                </div>

                <div class="shot-team-stat">
                    <span>Precisão</span>
                    <strong>${shotSummary.homeAccuracy.toFixed(1)}%</strong>
                </div>
            </div>

            <div class="shot-team-card">
                <h3>Croácia</h3>

                <div class="shot-team-stat">
                    <span>Finalizações</span>
                    <strong>${shotSummary.awayShotsCount}</strong>
                </div>

                <div class="shot-team-stat">
                    <span>No gol</span>
                    <strong>${shotSummary.awayOnTarget}</strong>
                </div>

                <div class="shot-team-stat">
                    <span>Gols</span>
                    <strong>${shotSummary.awayGoals}</strong>
                </div>

                <div class="shot-team-stat">
                    <span>xG</span>
                    <strong>${shotSummary.awayXg.toFixed(2)}</strong>
                </div>

                <div class="shot-team-stat">
                    <span>Precisão</span>
                    <strong>${shotSummary.awayAccuracy.toFixed(1)}%</strong>
                </div>
            </div>
        </div>
    `;
}

function getShotPlayerName(shot) {
    const player = shot.player || {};
    return player.shortName || player.name || "-";
}

function translateShotResult(type) {
    const translations = {
        goal: "Gol",
        save: "No alvo",
        miss: "Fora",
        block: "Bloqueado",
    };

    return translations[type] || type || "-";
}

function getShotResultClass(type) {
    const classes = {
        goal: "shot-result-goal",
        save: "shot-result-save",
        miss: "shot-result-miss",
        block: "shot-result-block",
    };

    return classes[type] || "shot-result-miss";
}

function shotToRow(shot) {
    const minute = shot.time ?? "-";
    const player = getShotPlayerName(shot);
    const result = translateShotResult(shot.shotType);
    const resultClass = getShotResultClass(shot.shotType);
    const xg = Number(shot.xg || 0).toFixed(3);

    return `
        <tr>
            <td>${minute}'</td>
            <td class="player-cell">${player}</td>
            <td>
                <span class="shot-result-pill ${resultClass}">
                    ${result}
                </span>
            </td>
            <td>${xg}</td>
        </tr>
    `;
}

function renderShotsTable(selector, shots) {
    const box = document.querySelector(selector);

    if (!box) return;

    if (!shots.length) {
        box.innerHTML = `<div class="loading-card">Nenhuma finalização encontrada.</div>`;
        return;
    }

    const sortedShots = [...shots].sort(
        (a, b) => Number(a.time || 0) - Number(b.time || 0)
    );

    box.innerHTML = `
        <table class="shots-table">
            <thead>
                <tr>
                    <th>Min</th>
                    <th>Jogador</th>
                    <th>Resultado</th>
                    <th>xG</th>
                </tr>
            </thead>

            <tbody>
                ${sortedShots.map(shotToRow).join("")}
            </tbody>
        </table>
    `;
}

function renderShotTables(shotmapData) {
    const shots = shotmapData?.shotmap || [];

    const homeShots = shots.filter((shot) => shot.isHome);
    const awayShots = shots.filter((shot) => !shot.isHome);

    renderShotsTable("#england-shots-table", homeShots);
    renderShotsTable("#croatia-shots-table", awayShots);
}

function updateKpisFromData(statisticsData, shotmapData) {
    const statsRows = flattenStatistics(statisticsData);
    const shotSummary = getShotmapSummary(shotmapData);

    const possession = findStat(statsRows, ["ballPossession"]);
    const totalShots = findStat(statsRows, ["totalShotsOnGoal", "totalShots"]);

    updateKpiCard(
        0,
        "Placar",
        `${copa2026State.match.homeScore} x ${copa2026State.match.awayScore}`,
        "Inglaterra venceu"
    );

    updateKpiCard(
        1,
        "xG",
        `${shotSummary.homeXg.toFixed(2)} x ${shotSummary.awayXg.toFixed(2)}`,
        "Gols esperados"
    );

    updateKpiCard(
        2,
        "Finalizações",
        totalShots
            ? `${totalShots.home} x ${totalShots.away}`
            : `${shotSummary.homeShotsCount} x ${shotSummary.awayShotsCount}`,
        "Inglaterra x Croácia"
    );

    updateKpiCard(
        3,
        "Posse de bola",
        possession
            ? `${possession.home} x ${possession.away}`
            : "--",
        "Inglaterra x Croácia"
    );

    renderStatsComparison(statsRows);
    renderShotSummary(shotSummary);
    renderShotTables(shotmapData);

    console.log("Estatísticas carregadas:", statsRows);
    console.log("Resumo de chutes:", shotSummary);
}

function renderDataStatus(success = true) {
    const statusPanel = document.querySelector(".full-panel .section-header p");

    if (!statusPanel) return;

    if (success) {
        statusPanel.textContent =
            "Dados reais do SofaScore carregados com sucesso. A página agora utiliza estatísticas, shotmap, logos e arquivos migrados do dashboard antigo.";
    } else {
        statusPanel.textContent =
            "A página foi carregada, mas algum arquivo de dados não foi encontrado. Verifique a pasta assets/data/copa2026.";
    }
}

function normalizePlayersFromLineups(lineupsData) {
    const homePlayers = lineupsData?.home?.players || [];
    const awayPlayers = lineupsData?.away?.players || [];

    const mapPlayer = (item, teamName) => {
        const player = item.player || {};
        const stats = item.statistics || {};

        const rating = Number(stats.rating || 0);
        const goals = Number(stats.goals || 0);
        const assists = Number(stats.goalAssist || 0);
        const shots = Number(stats.totalShots || 0);
        const xg = Number(stats.expectedGoals || 0);
        const xa = Number(stats.expectedAssists || 0);
        const sprints = Number(stats.numberOfSprints || 0);

        const score =
            rating * 10 +
            goals * 12 +
            assists * 8 +
            xg * 7 +
            xa * 5 +
            shots * 1.4 +
            sprints * 0.08;

        return {
            team: teamName,
            name: player.shortName || player.name || "-",
            position: item.position || player.position || "-",
            rating,
            goals,
            assists,
            shots,
            xg,
            xa,
            sprints,
            score,
        };
    };

    return [
        ...homePlayers.map((item) => mapPlayer(item, "Inglaterra")),
        ...awayPlayers.map((item) => mapPlayer(item, "Croácia")),
    ];
}

function renderPlayerRanking(lineupsData) {
    const box = document.querySelector("#player-ranking-box");

    if (!box) return;

    const players = normalizePlayersFromLineups(lineupsData)
        .filter((player) => player.name !== "-")
        .sort((a, b) => b.score - a.score)
        .slice(0, 8);

    if (!players.length) {
        box.innerHTML = `<div class="loading-card">Não foi possível carregar o ranking.</div>`;
        return;
    }

    box.innerHTML = `
        <div class="player-ranking-list">
            ${players
                .map((player, index) => {
                    return `
                        <div class="player-ranking-row">
                            <div class="player-rank-number">${index + 1}</div>

                            <div class="player-rank-info">
                                <div class="player-rank-name">${player.name}</div>

                                <div class="player-rank-meta">
                                    <span class="player-rank-pill">${player.team}</span>
                                    <span class="player-rank-pill">${player.position}</span>
                                    <span class="player-rank-pill">${player.goals} gol(s)</span>
                                    <span class="player-rank-pill">${player.shots} chute(s)</span>
                                </div>
                            </div>

                            <div class="player-rank-score">
                                ${player.rating ? player.rating.toFixed(1) : player.score.toFixed(1)}
                            </div>
                        </div>
                    `;
                })
                .join("")}
        </div>
    `;
}

function normalizeMomentum(momentumData) {
    const points = momentumData?.graphPoints || [];

    return points
        .map((point) => {
            return {
                minute: Number(point.minute || 0),
                value: Number(point.value || 0),
            };
        })
        .filter((point) => point.minute > 0);
}

function formatMomentumMinute(minute) {
    if (minute === 45.5) return "45+";
    if (minute === 90.5) return "90+";
    return `${Math.round(minute)}'`;
}

function renderMomentum(momentumData) {
    const box = document.querySelector("#momentum-box");

    if (!box) return;

    const points = normalizeMomentum(momentumData);

    if (!points.length) {
        box.innerHTML = `<div class="loading-card">Não foi possível carregar o momentum.</div>`;
        return;
    }

    const homeDominance = points.filter((point) => point.value > 0).length;
    const awayDominance = points.filter((point) => point.value < 0).length;

    const homePeak = points.reduce(
        (best, point) => (point.value > best.value ? point : best),
        { minute: "-", value: 0 }
    );

    const awayPeak = points.reduce(
        (best, point) => (point.value < best.value ? point : best),
        { minute: "-", value: 0 }
    );

    const sampledPoints = points.filter((_, index) => index % 3 === 0).slice(0, 34);

    box.innerHTML = `
        <div class="momentum-summary-grid">
            <div class="momentum-mini-card">
                <span>Domínio Inglaterra</span>
                <strong>${homeDominance}</strong>
            </div>

            <div class="momentum-mini-card">
                <span>Domínio Croácia</span>
                <strong>${awayDominance}</strong>
            </div>

            <div class="momentum-mini-card">
                <span>Pico Inglaterra</span>
                <strong>${Math.round(homePeak.value)}</strong>
            </div>

            <div class="momentum-mini-card">
                <span>Pico Croácia</span>
                <strong>${Math.abs(Math.round(awayPeak.value))}</strong>
            </div>
        </div>

        <div class="momentum-chart">
            ${sampledPoints
                .map((point) => {
                    const width = Math.min(100, Math.abs(point.value));
                    const isHome = point.value >= 0;

                    return `
                        <div class="momentum-row">
                            <div class="momentum-minute">${formatMomentumMinute(point.minute)}</div>

                            <div class="momentum-bar-track">
                                <div class="momentum-bar-center"></div>
                                <div
                                    class="momentum-bar ${isHome ? "momentum-home" : "momentum-away"}"
                                    style="width: ${width / 2}%"
                                ></div>
                            </div>
                        </div>
                    `;
                })
                .join("")}
        </div>

        <div class="momentum-legend">
            <span class="legend-home">● Inglaterra</span>
            <span class="legend-away">● Croácia</span>
        </div>
    `;
}

async function initCopa2026Dashboard() {
    try {
        updateHeroText();
        updateTeamLogos();

        const [statisticsData, shotmapData, lineupsData, momentumData] = await Promise.all([
    loadJson(`${DATA_BASE_PATH}/statistics.json`),
    loadJson(`${DATA_BASE_PATH}/shotmap.json`),
    loadJson(`${DATA_BASE_PATH}/lineups.json`),
    loadJson(`${DATA_BASE_PATH}/momentum.json`),
]);

updateKpisFromData(statisticsData, shotmapData);
renderPlayerRanking(lineupsData);
renderMomentum(momentumData);
renderDataStatus(true);
    } catch (error) {
        console.error("Erro ao inicializar Copa 2026:", error);
        renderDataStatus(false);
    }
}

document.addEventListener("DOMContentLoaded", initCopa2026Dashboard);