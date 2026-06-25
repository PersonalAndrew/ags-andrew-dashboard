const DATA_BASE_PATH = "/dashboard/assets/data/copa2026";

let currentMode = "teams";

const staticComparisonData = {
    brazil2022: {
        label: "Brasil 2022",
        type: "Seleção",
        source: "StatsBomb",
        metrics: {
            goals: 8,
            xg: 9.42,
            shots: 88,
            shotsOnTarget: 31,
            possession: 56,
            bigChances: 13,
            finalThirdEntries: 178,
            passAccuracy: 87,
        },
    },

    argentina2022: {
        label: "Argentina 2022",
        type: "Seleção",
        source: "StatsBomb",
        metrics: {
            goals: 15,
            xg: 15.10,
            shots: 104,
            shotsOnTarget: 42,
            possession: 57,
            bigChances: 18,
            finalThirdEntries: 216,
            passAccuracy: 86,
        },
    },

    france2022: {
        label: "França 2022",
        type: "Seleção",
        source: "StatsBomb",
        metrics: {
            goals: 16,
            xg: 13.80,
            shots: 101,
            shotsOnTarget: 38,
            possession: 51,
            bigChances: 17,
            finalThirdEntries: 205,
            passAccuracy: 84,
        },
    },
};

let comparisonData = {
    ...staticComparisonData,
};

let playerComparisonData = {};

const teamMetricConfig = [
    {
        key: "goals",
        label: "Gols",
        format: "number",
    },
    {
        key: "xg",
        label: "xG",
        format: "decimal",
    },
    {
        key: "shots",
        label: "Finalizações",
        format: "number",
    },
    {
        key: "shotsOnTarget",
        label: "Finalizações no gol",
        format: "number",
    },
    {
        key: "possession",
        label: "Posse de bola",
        format: "percent",
    },
    {
        key: "bigChances",
        label: "Grandes chances",
        format: "number",
    },
    {
        key: "finalThirdEntries",
        label: "Entradas no terço final",
        format: "number",
    },
    {
        key: "passAccuracy",
        label: "Acurácia dos passes",
        format: "percent",
    },
];

const playerMetricConfig = [
    {
        key: "rating",
        label: "Nota",
        format: "decimal",
    },
    {
        key: "goals",
        label: "Gols",
        format: "number",
    },
    {
        key: "assists",
        label: "Assistências",
        format: "number",
    },
    {
        key: "shots",
        label: "Finalizações",
        format: "number",
    },
    {
        key: "xg",
        label: "xG",
        format: "decimal",
    },
    {
        key: "xa",
        label: "xA",
        format: "decimal",
    },
    {
        key: "passes",
        label: "Passes",
        format: "number",
    },
    {
        key: "sprints",
        label: "Sprints",
        format: "number",
    },
];

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

function getStatNumber(statsRows, keys, side) {
    const row = findStat(statsRows, keys);

    if (!row) return 0;

    const rawValue = side === "home"
        ? row.homeValue ?? row.home
        : row.awayValue ?? row.away;

    if (typeof rawValue === "string") {
        return Number(rawValue.replace("%", "").replace(",", ".") || 0);
    }

    return Number(rawValue || 0);
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

    return {
        homeShots: homeShots.length,
        awayShots: awayShots.length,
        homeXg,
        awayXg,
        homeGoals,
        awayGoals,
        homeOnTarget,
        awayOnTarget,
    };
}

function buildTeamDataFromCopa2026(statisticsData, shotmapData) {
    const statsRows = flattenStatistics(statisticsData);
    const shotSummary = getShotmapSummary(shotmapData);

    const homePasses = getStatNumber(statsRows, ["passes"], "home");
    const awayPasses = getStatNumber(statsRows, ["passes"], "away");

    const homeAccuratePasses = getStatNumber(statsRows, ["accuratePasses"], "home");
    const awayAccuratePasses = getStatNumber(statsRows, ["accuratePasses"], "away");

    const homePassAccuracy = homePasses
        ? (homeAccuratePasses / homePasses) * 100
        : 86;

    const awayPassAccuracy = awayPasses
        ? (awayAccuratePasses / awayPasses) * 100
        : 84;

    comparisonData = {
        england: {
            label: "Inglaterra 2026",
            type: "Seleção",
            source: "SofaScore",
            metrics: {
                goals: 4,
                xg: Number(shotSummary.homeXg.toFixed(2)),
                shots: getStatNumber(statsRows, ["totalShotsOnGoal", "totalShots"], "home") || shotSummary.homeShots,
                shotsOnTarget: getStatNumber(statsRows, ["shotsOnGoal", "shotsOnTarget"], "home") || shotSummary.homeOnTarget,
                possession: getStatNumber(statsRows, ["ballPossession"], "home"),
                bigChances: getStatNumber(statsRows, ["bigChanceCreated"], "home"),
                finalThirdEntries: getStatNumber(statsRows, ["finalThirdEntries"], "home"),
                passAccuracy: Number(homePassAccuracy.toFixed(1)),
            },
        },

        croatia: {
            label: "Croácia 2026",
            type: "Seleção",
            source: "SofaScore",
            metrics: {
                goals: 2,
                xg: Number(shotSummary.awayXg.toFixed(2)),
                shots: getStatNumber(statsRows, ["totalShotsOnGoal", "totalShots"], "away") || shotSummary.awayShots,
                shotsOnTarget: getStatNumber(statsRows, ["shotsOnGoal", "shotsOnTarget"], "away") || shotSummary.awayOnTarget,
                possession: getStatNumber(statsRows, ["ballPossession"], "away"),
                bigChances: getStatNumber(statsRows, ["bigChanceCreated"], "away"),
                finalThirdEntries: getStatNumber(statsRows, ["finalThirdEntries"], "away"),
                passAccuracy: Number(awayPassAccuracy.toFixed(1)),
            },
        },

        ...staticComparisonData,
    };
}

function normalizePlayersFromLineups(lineupsData) {
    const homePlayers = lineupsData?.home?.players || [];
    const awayPlayers = lineupsData?.away?.players || [];

    const mapPlayer = (item, teamName) => {
        const player = item.player || {};
        const stats = item.statistics || {};
        const key = `${teamName}-${player.shortName || player.name || Math.random()}`
            .toLowerCase()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .replace(/[^a-z0-9]+/g, "-");

        return {
            key,
            label: `${player.shortName || player.name || "-"} (${teamName})`,
            type: "Jogador",
            source: "SofaScore",
            metrics: {
                rating: Number(stats.rating || 0),
                goals: Number(stats.goals || 0),
                assists: Number(stats.goalAssist || 0),
                shots: Number(stats.totalShots || 0),
                xg: Number(stats.expectedGoals || 0),
                xa: Number(stats.expectedAssists || 0),
                passes: Number(stats.totalPass || stats.passes || 0),
                sprints: Number(stats.numberOfSprints || 0),
            },
        };
    };

    return [
        ...homePlayers.map((item) => mapPlayer(item, "Inglaterra")),
        ...awayPlayers.map((item) => mapPlayer(item, "Croácia")),
    ];
}

function buildPlayerDataFromCopa2026(lineupsData) {
    const players = normalizePlayersFromLineups(lineupsData)
        .filter((player) => player.label !== "-")
        .filter((player) => player.metrics.rating || player.metrics.goals || player.metrics.shots)
        .sort((a, b) => {
            const scoreA =
                a.metrics.rating * 10 +
                a.metrics.goals * 12 +
                a.metrics.assists * 8 +
                a.metrics.xg * 7 +
                a.metrics.shots;

            const scoreB =
                b.metrics.rating * 10 +
                b.metrics.goals * 12 +
                b.metrics.assists * 8 +
                b.metrics.xg * 7 +
                b.metrics.shots;

            return scoreB - scoreA;
        })
        .slice(0, 12);

    playerComparisonData = {};

    players.forEach((player) => {
        playerComparisonData[player.key] = player;
    });
}

function formatMetric(value, format) {
    const number = Number(value || 0);

    if (format === "percent") {
        return `${number.toFixed(number % 1 === 0 ? 0 : 1)}%`;
    }

    if (format === "decimal") {
        return number.toFixed(2);
    }

    return number.toFixed(0);
}

function getWinnerClass(valueA, valueB) {
    const numberA = Number(valueA);
    const numberB = Number(valueB);

    if (numberA > numberB) return "a";
    if (numberB > numberA) return "b";

    return "draw";
}

function getActiveData() {
    return currentMode === "players" ? playerComparisonData : comparisonData;
}

function getActiveMetricConfig() {
    return currentMode === "players" ? playerMetricConfig : teamMetricConfig;
}

function populateSelectors() {
    const entityA = document.querySelector("#entity-a");
    const entityB = document.querySelector("#entity-b");

    if (!entityA || !entityB) return;

    const data = getActiveData();
    const entries = Object.entries(data);

    entityA.innerHTML = entries
        .map(([key, item]) => `<option value="${key}">${item.label}</option>`)
        .join("");

    entityB.innerHTML = entries
        .map(([key, item]) => `<option value="${key}">${item.label}</option>`)
        .join("");

    if (currentMode === "teams") {
        entityA.value = "england";
        entityB.value = "croatia";
    }

    if (currentMode === "players") {
        const keys = Object.keys(data);
        entityA.value = keys[0] || "";
        entityB.value = keys[1] || keys[0] || "";
    }
}

function updateSelectorTitles() {
    const firstTitle = document.querySelector(".comparison-card:first-child .section-header h2");
    const secondTitle = document.querySelector(".comparison-card:nth-child(2) .section-header h2");
    const firstLabel = document.querySelector("label[for='entity-a']");
    const secondLabel = document.querySelector("label[for='entity-b']");

    if (currentMode === "teams") {
        if (firstTitle) firstTitle.textContent = "Primeira seleção";
        if (secondTitle) secondTitle.textContent = "Segunda seleção";
        if (firstLabel) firstLabel.textContent = "Selecionar seleção";
        if (secondLabel) secondLabel.textContent = "Selecionar seleção";
    } else {
        if (firstTitle) firstTitle.textContent = "Primeiro jogador";
        if (secondTitle) secondTitle.textContent = "Segundo jogador";
        if (firstLabel) firstLabel.textContent = "Selecionar jogador";
        if (secondLabel) secondLabel.textContent = "Selecionar jogador";
    }
}

function renderComparison() {
    const entityAKey = document.querySelector("#entity-a")?.value;
    const entityBKey = document.querySelector("#entity-b")?.value;
    const box = document.querySelector("#comparison-result-box");

    if (!box) return;

    const data = getActiveData();
    const metricConfig = getActiveMetricConfig();

    const entityA = data[entityAKey];
    const entityB = data[entityBKey];

    if (!entityA || !entityB) {
        box.innerHTML = `<div class="loading-card">Seleção inválida.</div>`;
        return;
    }

    box.innerHTML = `
        <table class="metric-table">
            <thead>
                <tr>
                    <th>Métrica</th>
                    <th>${entityA.label}</th>
                    <th>${entityB.label}</th>
                    <th>Leitura</th>
                </tr>
            </thead>

            <tbody>
                ${metricConfig
                    .map((metric) => {
                        const valueA = entityA.metrics[metric.key] ?? 0;
                        const valueB = entityB.metrics[metric.key] ?? 0;
                        const winner = getWinnerClass(valueA, valueB);

                        const classA = winner === "a" ? "metric-highlight" : "";
                        const classB = winner === "b" ? "metric-highlight" : "";

                        let reading = "Equilíbrio";

                        if (winner === "a") {
                            reading = `${entityA.label} superior`;
                        }

                        if (winner === "b") {
                            reading = `${entityB.label} superior`;
                        }

                        return `
                            <tr>
                                <td class="metric-name">${metric.label}</td>
                                <td class="${classA}">
                                    ${formatMetric(valueA, metric.format)}
                                </td>
                                <td class="${classB}">
                                    ${formatMetric(valueB, metric.format)}
                                </td>
                                <td>${reading}</td>
                            </tr>
                        `;
                    })
                    .join("")}
            </tbody>
        </table>
    `;
}

function setupModeButtons() {
    const buttons = document.querySelectorAll(".mode-card");

    buttons.forEach((button) => {
        button.addEventListener("click", () => {
            buttons.forEach((item) => item.classList.remove("active"));
            button.classList.add("active");

            currentMode = button.dataset.mode || "teams";

            populateSelectors();
            updateSelectorTitles();
            renderComparison();
        });
    });
}

function setupSelectors() {
    const selectors = document.querySelectorAll("#entity-a, #entity-b");

    selectors.forEach((select) => {
        select.addEventListener("change", renderComparison);
    });
}

async function loadRealData() {
    try {
        const [statisticsData, shotmapData, lineupsData] = await Promise.all([
            loadJson(`${DATA_BASE_PATH}/statistics.json`),
            loadJson(`${DATA_BASE_PATH}/shotmap.json`),
            loadJson(`${DATA_BASE_PATH}/lineups.json`),
        ]);

        buildTeamDataFromCopa2026(statisticsData, shotmapData);
        buildPlayerDataFromCopa2026(lineupsData);
    } catch (error) {
        console.error("Erro ao carregar dados reais do comparativo:", error);
    }
}

async function initComparativo() {
    await loadRealData();

    setupModeButtons();
    setupSelectors();
    populateSelectors();
    updateSelectorTitles();
    renderComparison();
}

document.addEventListener("DOMContentLoaded", initComparativo);