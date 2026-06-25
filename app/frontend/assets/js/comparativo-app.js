const DATA_BASE_PATH = "/dashboard/assets/data/copa2026";
const STATSBOMB_RANKING_URL = "/api/statsbomb/ranking?limit=32";

let currentMode = "teams";

let comparisonData = {};
let playerComparisonData = {};

const teamNameTranslations = {
    France: "França 2022",
    Argentina: "Argentina 2022",
    England: "Inglaterra 2022",
    Portugal: "Portugal 2022",
    Netherlands: "Holanda 2022",
    Brazil: "Brasil 2022",
    Croatia: "Croácia 2022",
    Spain: "Espanha 2022",
    Germany: "Alemanha 2022",
    Morocco: "Marrocos 2022",
    Belgium: "Bélgica 2022",
    Uruguay: "Uruguai 2022",
    Switzerland: "Suíça 2022",
    Serbia: "Sérvia 2022",
    Mexico: "México 2022",
    Poland: "Polônia 2022",
    Japan: "Japão 2022",
    "South Korea": "Coreia do Sul 2022",
    Ghana: "Gana 2022",
    Cameroon: "Camarões 2022",
    Ecuador: "Equador 2022",
    Senegal: "Senegal 2022",
    Australia: "Austrália 2022",
    "United States": "Estados Unidos 2022",
    Wales: "País de Gales 2022",
    Iran: "Irã 2022",
    Qatar: "Catar 2022",
    Canada: "Canadá 2022",
    Tunisia: "Tunísia 2022",
    Denmark: "Dinamarca 2022",
    "Costa Rica": "Costa Rica 2022",
    "Saudi Arabia": "Arábia Saudita 2022",
};

const teamMetricConfig = [
    {
        key: "games",
        label: "Jogos analisados",
        format: "number",
    },
    {
        key: "goals",
        label: "Gols totais",
        format: "number",
    },
    {
        key: "goalsPerGame",
        label: "Gols por jogo",
        format: "decimal",
    },
    {
        key: "xg",
        label: "xG total",
        format: "decimal",
    },
    {
        key: "xgPerGame",
        label: "xG por jogo",
        format: "decimal",
    },
    {
        key: "shots",
        label: "Finalizações totais",
        format: "number",
    },
    {
        key: "shotsPerGame",
        label: "Finalizações por jogo",
        format: "decimal",
    },
    {
        key: "shotsOnTarget",
        label: "Finalizações no gol",
        format: "number",
    },
    {
        key: "shotAccuracy",
        label: "Precisão das finalizações",
        format: "percent",
    },
    {
        key: "conversionRate",
        label: "Taxa de conversão",
        format: "percent",
    },
    {
        key: "xgPerShot",
        label: "xG por finalização",
        format: "decimal",
    },
    {
        key: "xgDiff",
        label: "Gols - xG",
        format: "decimal",
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

function slugify(value) {
    return String(value)
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");
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

    if (!row) return null;

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

    const homeOnTarget = homeShots.filter((shot) => {
        return ["goal", "save"].includes(shot.shotType);
    }).length;

    const awayOnTarget = awayShots.filter((shot) => {
        return ["goal", "save"].includes(shot.shotType);
    }).length;

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

    const homePassAccuracy = homePasses && homeAccuratePasses
        ? (homeAccuratePasses / homePasses) * 100
        : null;

    const awayPassAccuracy = awayPasses && awayAccuratePasses
        ? (awayAccuratePasses / awayPasses) * 100
        : null;

    comparisonData.england2026 = {
        label: "Inglaterra 2026",
        type: "Seleção",
        source: "SofaScore",
        metrics: {
            goals: 4,
            xg: Number(shotSummary.homeXg.toFixed(2)),
            shots: getStatNumber(statsRows, ["totalShotsOnGoal", "totalShots"], "home") || shotSummary.homeShots,
            shotsOnTarget: getStatNumber(statsRows, ["shotsOnGoal", "shotsOnTarget"], "home") || shotSummary.homeOnTarget,
            xgDiff: Number((4 - shotSummary.homeXg).toFixed(2)),
            games: 1,
            possession: getStatNumber(statsRows, ["ballPossession"], "home"),
            bigChances: getStatNumber(statsRows, ["bigChanceCreated"], "home"),
            finalThirdEntries: getStatNumber(statsRows, ["finalThirdEntries"], "home"),
            passAccuracy: homePassAccuracy ? Number(homePassAccuracy.toFixed(1)) : null,
        },
    };

    comparisonData.croatia2026 = {
        label: "Croácia 2026",
        type: "Seleção",
        source: "SofaScore",
        metrics: {
            goals: 2,
            xg: Number(shotSummary.awayXg.toFixed(2)),
            shots: getStatNumber(statsRows, ["totalShotsOnGoal", "totalShots"], "away") || shotSummary.awayShots,
            shotsOnTarget: getStatNumber(statsRows, ["shotsOnGoal", "shotsOnTarget"], "away") || shotSummary.awayOnTarget,
            xgDiff: Number((2 - shotSummary.awayXg).toFixed(2)),
            games: 1,
            possession: getStatNumber(statsRows, ["ballPossession"], "away"),
            bigChances: getStatNumber(statsRows, ["bigChanceCreated"], "away"),
            finalThirdEntries: getStatNumber(statsRows, ["finalThirdEntries"], "away"),
            passAccuracy: awayPassAccuracy ? Number(awayPassAccuracy.toFixed(1)) : null,
        },
    };
}

async function buildTeamDataFromCopa2022() {
    const data = await loadJson(STATSBOMB_RANKING_URL);
    const ranking = data?.ranking || [];

    ranking.forEach((team) => {
        const key = `${slugify(team.team)}2022`;

        comparisonData[key] = {
            label: teamNameTranslations[team.team] || `${team.team} 2022`,
            type: "Seleção",
            source: "StatsBomb",
            metrics: {
                goals: Number(team.gols ?? 0),
                xg: Number(team.xg ?? 0),
                shots: Number(team.chutes ?? 0),
                shotsOnTarget: Number(team.chutes_no_gol ?? 0),
                xgDiff: Number(team.xg_diff ?? 0),
                games: Number(team.jogos ?? 0),

                // Esses campos ainda não vêm nesse endpoint da Copa 2022.
                // Eles aparecem como indisponíveis quando o outro lado tiver o dado.
                possession: null,
                bigChances: null,
                finalThirdEntries: null,
                passAccuracy: null,
            },
        };
    });
}

function normalizePlayersFromLineups(lineupsData) {
    const homePlayers = lineupsData?.home?.players || [];
    const awayPlayers = lineupsData?.away?.players || [];

    const mapPlayer = (item, teamName) => {
        const player = item.player || {};
        const stats = item.statistics || {};
        const playerName = player.shortName || player.name || "-";

        const key = `${teamName}-${playerName}`
            .toLowerCase()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .replace(/[^a-z0-9]+/g, "-");

        return {
            key,
            label: `${playerName} (${teamName})`,
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

function enrichTeamMetrics() {
    Object.values(comparisonData).forEach((team) => {
        const metrics = team.metrics || {};

        const games = Number(metrics.games || 1);
        const goals = Number(metrics.goals || 0);
        const xg = Number(metrics.xg || 0);
        const shots = Number(metrics.shots || 0);
        const shotsOnTarget = Number(metrics.shotsOnTarget || 0);

        metrics.goalsPerGame = games ? goals / games : null;
        metrics.xgPerGame = games ? xg / games : null;
        metrics.shotsPerGame = games ? shots / games : null;

        metrics.shotAccuracy = shots
            ? (shotsOnTarget / shots) * 100
            : null;

        metrics.conversionRate = shots
            ? (goals / shots) * 100
            : null;

        metrics.xgPerShot = shots
            ? xg / shots
            : null;
    });
}

function hasMetricValue(entity, key) {
    const value = entity?.metrics?.[key];

    return (
        value !== null &&
        value !== undefined &&
        value !== "" &&
        !Number.isNaN(Number(value))
    );
}

function shouldShowMetric(entityA, entityB, key) {
    const hasA = hasMetricValue(entityA, key);
    const hasB = hasMetricValue(entityB, key);

    // Se nenhum dos dois tiver, não mostra a linha.
    if (!hasA && !hasB) {
        return false;
    }

    // Se pelo menos um tiver, mostra.
    // O lado sem dado aparece como Indisponível.
    return true;
}

function formatMetric(value, format) {
    if (
        value === null ||
        value === undefined ||
        value === "" ||
        Number.isNaN(Number(value))
    ) {
        return "Indisponível";
    }

    const number = Number(value);

    if (format === "percent") {
        return `${number.toFixed(number % 1 === 0 ? 0 : 1)}%`;
    }

    if (format === "decimal") {
        return number.toFixed(2);
    }

    return number.toFixed(0);
}

function getWinnerClass(valueA, valueB) {
    if (
        valueA === null ||
        valueA === undefined ||
        valueB === null ||
        valueB === undefined ||
        valueA === "" ||
        valueB === ""
    ) {
        return "unavailable";
    }

    const numberA = Number(valueA);
    const numberB = Number(valueB);

    if (Number.isNaN(numberA) || Number.isNaN(numberB)) {
        return "unavailable";
    }

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
        entityA.value = "england2026";
        entityB.value = "croatia2026";
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

    const availableMetrics = metricConfig.filter((metric) => {
        return shouldShowMetric(entityA, entityB, metric.key);
    });

    if (!availableMetrics.length) {
        box.innerHTML = `
            <div class="loading-card">
                Não há métricas em comum suficientes para comparar essas opções.
            </div>
        `;
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
                ${availableMetrics
                    .map((metric) => {
                        const valueA = entityA.metrics[metric.key];
                        const valueB = entityB.metrics[metric.key];

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

                        if (winner === "unavailable") {
                            reading = "Dado parcial";
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

        await buildTeamDataFromCopa2022();

        enrichTeamMetrics();
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