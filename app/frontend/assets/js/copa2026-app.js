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
        homeShots: homeShots.length,
        awayShots: awayShots.length,
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
                    <strong>${shotSummary.homeShots}</strong>
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
                    <strong>${shotSummary.awayShots}</strong>
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
            : `${shotSummary.homeShots} x ${shotSummary.awayShots}`,
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

async function initCopa2026Dashboard() {
    try {
        updateHeroText();
        updateTeamLogos();

        const [statisticsData, shotmapData] = await Promise.all([
            loadJson(`${DATA_BASE_PATH}/statistics.json`),
            loadJson(`${DATA_BASE_PATH}/shotmap.json`),
        ]);

        updateKpisFromData(statisticsData, shotmapData);
        renderDataStatus(true);
    } catch (error) {
        console.error("Erro ao inicializar Copa 2026:", error);
        renderDataStatus(false);
    }
}

document.addEventListener("DOMContentLoaded", initCopa2026Dashboard);