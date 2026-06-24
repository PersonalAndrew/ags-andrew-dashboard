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

    const homeOnTarget = homeShots.filter((shot) => ["goal", "save"].includes(shot.shotType)).length;
    const awayOnTarget = awayShots.filter((shot) => ["goal", "save"].includes(shot.shotType)).length;

    return {
        homeShots: homeShots.length,
        awayShots: awayShots.length,
        homeXg,
        awayXg,
        homeOnTarget,
        awayOnTarget,
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

function updateKpisFromData(statisticsData, shotmapData) {
    const statsRows = flattenStatistics(statisticsData);
    const shotSummary = getShotmapSummary(shotmapData);

    const possession = findStat(statsRows, ["ballPossession"]);
    const totalShots = findStat(statsRows, ["totalShotsOnGoal", "totalShots"]);
    const shotsOnTarget = findStat(statsRows, ["shotsOnGoal", "shotsOnTarget"]);

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

    console.log("Estatísticas carregadas:", statsRows);
    console.log("Resumo de chutes:", shotSummary);
    console.log("Finalizações no gol:", shotsOnTarget);
}

function renderDataStatus(success = true) {
    const statusPanel = document.querySelector(".full-panel .section-header p");

    if (!statusPanel) return;

    if (success) {
        statusPanel.textContent =
            "Dados reais do SofaScore carregados com sucesso. A página agora já utiliza estatísticas, shotmap, logos e arquivos migrados do dashboard antigo.";
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