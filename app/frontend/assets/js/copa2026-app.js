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

function getStatNumber(statsRows, keys, side) {
    const row = findStat(statsRows, keys);

    if (!row) return 0;

    if (side === "home") {
        return Number(row.homeValue || row.home || 0);
    }

    return Number(row.awayValue || row.away || 0);
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
    const points = momentumData?.graphPoints || momentumData?.points || momentumData || [];

    if (!Array.isArray(points)) return [];

    return points
        .map((point) => {
            return {
                minute: Number(point.minute || point.time || 0),
                value: Number(point.value || point.momentum || 0),
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

function getHighlightList(highlightsData) {
    if (Array.isArray(highlightsData)) return highlightsData;

    return (
        highlightsData?.highlights ||
        highlightsData?.incidents ||
        highlightsData?.events ||
        highlightsData?.data ||
        []
    );
}

function getEventMinute(event) {
    return (
        event.time ??
        event.minute ??
        event.incidentTime ??
        event.startMinute ??
        "-"
    );
}

function getEventTeam(event) {
    if (event.isHome === true) return "Inglaterra";
    if (event.isHome === false) return "Croácia";

    return (
        event.teamName ||
        event.team?.name ||
        event.player?.team?.name ||
        "Partida"
    );
}

function getEventTitle(event) {
    const playerName =
        event.playerName ||
        event.player?.shortName ||
        event.player?.name ||
        event.assist1?.name ||
        "";

    const type =
        event.incidentType ||
        event.eventType ||
        event.type ||
        event.title ||
        "Evento";

    const translatedTypes = {
        goal: "Gol",
        card: "Cartão",
        yellow: "Cartão amarelo",
        red: "Cartão vermelho",
        substitution: "Substituição",
        injury: "Atendimento",
        period: "Intervalo",
        var: "VAR",
        penalty: "Pênalti",
        varDecision: "Decisão do VAR",
        injuryTime: "Acréscimos",
    };

    const translated = translatedTypes[type] || event.text || event.description || type;

    if (playerName) {
        return `${translated} · ${playerName}`;
    }

    return translated;
}

function renderEventsTimeline(highlightsData) {
    const box = document.querySelector("#events-timeline-box");

    if (!box) return;

    const events = getHighlightList(highlightsData)
        .map((event) => {
            return {
                minute: getEventMinute(event),
                title: getEventTitle(event),
                team: getEventTeam(event),
                isHome: event.isHome,
            };
        })
        .filter((event) => event.title && event.title !== "Evento")
        .sort((a, b) => Number(a.minute || 0) - Number(b.minute || 0))
        .slice(0, 18);

    if (!events.length) {
        box.innerHTML = `<div class="loading-card">Não foi possível carregar os eventos.</div>`;
        return;
    }

    box.innerHTML = `
        <div class="events-timeline-list">
            ${events
                .map((event) => {
                    const teamClass = event.isHome === false ? "event-team-away" : "event-team-home";

                    return `
                        <div class="event-row">
                            <div class="event-minute">${event.minute}'</div>

                            <div>
                                <div class="event-title">${event.title}</div>
                                <div class="event-meta ${teamClass}">${event.team}</div>
                            </div>
                        </div>
                    `;
                })
                .join("")}
        </div>
    `;
}

function getAverageSideData(averageData, side) {
    const raw =
        averageData?.[side]?.players ||
        averageData?.[side] ||
        averageData?.averagePositions?.[side] ||
        averageData?.data?.[side] ||
        [];

    return Array.isArray(raw) ? raw : [];
}

function getAveragePlayerName(item) {
    const player = item.player || {};
    return player.shortName || player.name || item.name || item.playerName || "-";
}

function getAveragePlayerNumber(item, index) {
    const player = item.player || {};

    return (
        item.jerseyNumber ||
        item.shirtNumber ||
        player.jerseyNumber ||
        player.shirtNumber ||
        index + 1
    );
}

function getAverageCoordinates(item) {
    const x =
        item.averageX ??
        item.x ??
        item.averagePositionX ??
        item.positionX ??
        item.playerCoordinates?.x ??
        50;

    const y =
        item.averageY ??
        item.y ??
        item.averagePositionY ??
        item.positionY ??
        item.playerCoordinates?.y ??
        50;

    return {
        x: Math.min(96, Math.max(4, Number(x))),
        y: Math.min(96, Math.max(4, Number(y))),
    };
}

function renderAveragePitch(title, players, isAway = false) {
    const dots = players
        .slice(0, 11)
        .map((item, index) => {
            const coords = getAverageCoordinates(item);
            const name = getAveragePlayerName(item);
            const number = getAveragePlayerNumber(item, index);

            const left = coords.y;
            const top = 100 - coords.x;

            return `
                <div
                    class="average-dot ${isAway ? "away-dot" : ""}"
                    style="left: ${left}%; top: ${top}%"
                    title="${name}"
                >
                    ${number}
                    <span class="average-dot-name">${name}</span>
                </div>
            `;
        })
        .join("");

    return `
        <div class="average-team-card">
            <h3>${title}</h3>

            <div class="average-pitch">
                ${dots}
            </div>

            <div class="average-note">
                Números posicionados de acordo com a ocupação média em campo.
            </div>
        </div>
    `;
}

function renderAveragePositions(averageData) {
    const box = document.querySelector("#average-position-box");

    if (!box) return;

    const homePlayers = getAverageSideData(averageData, "home");
    const awayPlayers = getAverageSideData(averageData, "away");

    if (!homePlayers.length && !awayPlayers.length) {
        box.innerHTML = `<div class="loading-card">Não foi possível carregar as posições médias.</div>`;
        return;
    }

    box.innerHTML = `
        <div class="average-position-grid">
            ${renderAveragePitch("Inglaterra", homePlayers, false)}
            ${renderAveragePitch("Croácia", awayPlayers, true)}
        </div>
    `;
}

function getLineupPlayerName(item) {
    const player = item.player || {};
    return player.shortName || player.name || item.name || "-";
}

function getLineupPlayerNumber(item, index) {
    const player = item.player || {};

    return (
        item.jerseyNumber ||
        item.shirtNumber ||
        player.jerseyNumber ||
        player.shirtNumber ||
        index + 1
    );
}

function getLineupPlayerPosition(item) {
    const player = item.player || {};
    return item.position || player.position || "-";
}

function getStarterPlayers(players) {
    return players.filter((item) => !item.substitute).slice(0, 11);
}

function distributePlayersByFormation(players) {
    const starters = getStarterPlayers(players);

    const goalkeeper = starters.filter((p) => getLineupPlayerPosition(p) === "G");
    const defenders = starters.filter((p) => getLineupPlayerPosition(p) === "D");
    const midfielders = starters.filter((p) => getLineupPlayerPosition(p) === "M");
    const forwards = starters.filter((p) => getLineupPlayerPosition(p) === "F");

    const remaining = starters.filter(
        (p) =>
            !goalkeeper.includes(p) &&
            !defenders.includes(p) &&
            !midfielders.includes(p) &&
            !forwards.includes(p)
    );

    const lines = [];

    lines.push(goalkeeper.length ? goalkeeper.slice(0, 1) : starters.slice(0, 1));

    if (defenders.length) lines.push(defenders);
    if (midfielders.length) lines.push(midfielders);
    if (forwards.length) lines.push(forwards);
    if (remaining.length) lines.push(remaining);

    const normalizedLines = lines.slice(0, 4);
    const yPositions = [88, 66, 40, 17];
    const positioned = [];

    normalizedLines.forEach((line, lineIndex) => {
        const count = line.length;
        const y = yPositions[lineIndex] || 50;

        line.forEach((player, playerIndex) => {
            const x = ((playerIndex + 1) / (count + 1)) * 100;

            positioned.push({
                item: player,
                x,
                y,
            });
        });
    });

    return positioned.slice(0, 11);
}

function renderLineupTeam(title, formation, players, isAway = false) {
    const positionedPlayers = distributePlayersByFormation(players);

    return `
        <div class="lineup-team-card">
            <div class="lineup-team-header">
                <h3>${title}</h3>
                <span>Formação: ${formation || "-"}</span>
            </div>

            <div class="lineup-pitch">
                ${positionedPlayers
                    .map((player, index) => {
                        const number = getLineupPlayerNumber(player.item, index);
                        const name = getLineupPlayerName(player.item);
                        const position = getLineupPlayerPosition(player.item);

                        return `
                            <div
                                class="lineup-player ${isAway ? "away-player" : ""}"
                                style="left: ${player.x}%; top: ${player.y}%"
                                title="${name}"
                            >
                                <div class="lineup-player-number">${number}</div>
                                <span class="lineup-player-name">${name}</span>
                                <span class="lineup-player-position">${position}</span>
                            </div>
                        `;
                    })
                    .join("")}
            </div>
        </div>
    `;
}

function renderLineups(lineupsData) {
    const box = document.querySelector("#lineups-box");

    if (!box) return;

    const homePlayers = lineupsData?.home?.players || [];
    const awayPlayers = lineupsData?.away?.players || [];

    const homeFormation = lineupsData?.home?.formation || "-";
    const awayFormation = lineupsData?.away?.formation || "-";

    if (!homePlayers.length && !awayPlayers.length) {
        box.innerHTML = `<div class="loading-card">Não foi possível carregar as escalações.</div>`;
        return;
    }

    box.innerHTML = `
        <div class="lineups-grid">
            ${renderLineupTeam("Inglaterra", homeFormation, homePlayers, false)}
            ${renderLineupTeam("Croácia", awayFormation, awayPlayers, true)}
        </div>
    `;
}

function formatPercentValue(value) {
    if (!Number.isFinite(value)) return "--";
    return `${value.toFixed(1)}%`;
}

function formatDecimalValue(value, decimals = 2) {
    if (!Number.isFinite(value)) return "--";
    return value.toFixed(decimals);
}

function renderAdvancedMetric(label, homeValue, awayValue, note) {
    return `
        <div class="advanced-metric-card">
            <div class="advanced-metric-label">${label}</div>

            <div class="advanced-metric-values">
                <div class="advanced-team-value">
                    <strong>${homeValue}</strong>
                    <span>Inglaterra</span>
                </div>

                <div class="advanced-versus">vs</div>

                <div class="advanced-team-value">
                    <strong>${awayValue}</strong>
                    <span>Croácia</span>
                </div>
            </div>

            <div class="advanced-note">${note}</div>
        </div>
    `;
}

function renderAdvancedComparisons(statsRows, shotSummary) {
    const box = document.querySelector("#advanced-comparison-box");

    if (!box) return;

    const homeConversion = shotSummary.homeShotsCount
        ? (shotSummary.homeGoals / shotSummary.homeShotsCount) * 100
        : 0;

    const awayConversion = shotSummary.awayShotsCount
        ? (shotSummary.awayGoals / shotSummary.awayShotsCount) * 100
        : 0;

    const homeXgPerShot = shotSummary.homeShotsCount
        ? shotSummary.homeXg / shotSummary.homeShotsCount
        : 0;

    const awayXgPerShot = shotSummary.awayShotsCount
        ? shotSummary.awayXg / shotSummary.awayShotsCount
        : 0;

    const homeXgDiff = shotSummary.homeGoals - shotSummary.homeXg;
    const awayXgDiff = shotSummary.awayGoals - shotSummary.awayXg;

    const homeBigChances = getStatNumber(statsRows, ["bigChanceCreated"], "home");
    const awayBigChances = getStatNumber(statsRows, ["bigChanceCreated"], "away");

    const homeFinalThird = getStatNumber(statsRows, ["finalThirdEntries"], "home");
    const awayFinalThird = getStatNumber(statsRows, ["finalThirdEntries"], "away");

    box.innerHTML = `
        <div class="advanced-comparison-grid">
            ${renderAdvancedMetric(
                "Taxa de conversão",
                formatPercentValue(homeConversion),
                formatPercentValue(awayConversion),
                "Percentual de finalizações que terminaram em gol."
            )}

            ${renderAdvancedMetric(
                "Precisão dos chutes",
                formatPercentValue(shotSummary.homeAccuracy),
                formatPercentValue(shotSummary.awayAccuracy),
                "Percentual de finalizações que foram no alvo."
            )}

            ${renderAdvancedMetric(
                "xG por finalização",
                formatDecimalValue(homeXgPerShot, 3),
                formatDecimalValue(awayXgPerShot, 3),
                "Mede a qualidade média das chances criadas."
            )}

            ${renderAdvancedMetric(
                "Gols - xG",
                formatDecimalValue(homeXgDiff, 2),
                formatDecimalValue(awayXgDiff, 2),
                "Diferença entre gols marcados e gols esperados."
            )}

            ${renderAdvancedMetric(
                "Grandes chances",
                homeBigChances,
                awayBigChances,
                "Volume de oportunidades claras criadas na partida."
            )}

            ${renderAdvancedMetric(
                "Entradas no terço final",
                homeFinalThird,
                awayFinalThird,
                "Frequência de chegada ao setor ofensivo."
            )}
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
    renderAdvancedComparisons(statsRows, shotSummary);
}

function renderDataStatus(success = true) {
    const statusPanel = document.querySelector("#data-status-text");

    if (!statusPanel) return;

    if (success) {
        statusPanel.textContent =
            "Dados reais carregados com sucesso: estatísticas, finalizações, ranking, momentum, eventos, posições médias, escalações e comparativos avançados.";
    } else {
        statusPanel.textContent =
            "A página foi carregada, mas algum arquivo de dados não foi encontrado. Verifique a pasta assets/data/copa2026.";
    }
}

async function initCopa2026Dashboard() {
    try {
        updateHeroText();
        updateTeamLogos();

        const [
            statisticsData,
            shotmapData,
            lineupsData,
            momentumData,
            highlightsData,
            averagePositionData,
        ] = await Promise.all([
            loadJson(`${DATA_BASE_PATH}/statistics.json`),
            loadJson(`${DATA_BASE_PATH}/shotmap.json`),
            loadJson(`${DATA_BASE_PATH}/lineups.json`),
            loadJson(`${DATA_BASE_PATH}/momentum.json`),
            loadJson(`${DATA_BASE_PATH}/highlights.json`),
            loadJson(`${DATA_BASE_PATH}/average_position.json`),
        ]);

        updateKpisFromData(statisticsData, shotmapData);
        renderPlayerRanking(lineupsData);
        renderMomentum(momentumData);
        renderEventsTimeline(highlightsData);
        renderAveragePositions(averagePositionData);
        renderLineups(lineupsData);
        renderDataStatus(true);
    } catch (error) {
        console.error("Erro ao inicializar Copa 2026:", error);
        renderDataStatus(false);
    }
}

document.addEventListener("DOMContentLoaded", initCopa2026Dashboard);

// =======================================================
// BASE SOFASCORE — COPA 2026
// =======================================================

const SOFASCORE_API_BASE = "/api/sofascore";

const sofascoreState = {
    matches: [],
    trends: null,
};

function formatSofascoreDate(dateText) {
    if (!dateText) return "-";

    const date = new Date(dateText);

    if (Number.isNaN(date.getTime())) {
        return "-";
    }

    return date.toLocaleString("pt-BR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });
}

function getSofascoreStatusLabel(statusType, status) {
    if (statusType === "finished") return "Finalizado";
    if (statusType === "inprogress") return "Ao vivo";
    if (statusType === "notstarted") return "Não iniciado";

    return status || "-";
}

function buildSofascoreOptionLabel(match) {
    const home = match.home_team || "Mandante";
    const away = match.away_team || "Visitante";
    const status = getSofascoreStatusLabel(match.status_type, match.status);

    if (match.status_type === "finished" || match.status_type === "inprogress") {
        return `${home} ${match.home_score ?? "-"} x ${match.away_score ?? "-"} ${away} — ${status}`;
    }

    return `${home} x ${away} — ${status}`;
}

function renderSofascoreMatchCard(match) {
    const card = document.getElementById("sofascoreMatchCard");

    if (!card) return;

    if (!match) {
        card.innerHTML = `
            <div class="sofascore-empty">
                Nenhum jogo selecionado.
            </div>
        `;
        return;
    }

    const statusLabel = getSofascoreStatusLabel(match.status_type, match.status);
    const dateLabel = formatSofascoreDate(match.start_datetime_utc);

    const homeScore = match.home_score ?? "-";
    const awayScore = match.away_score ?? "-";

    card.innerHTML = `
        <div class="sofascore-match-topline">
            <span>${match.tournament_name || "World Cup 2026"}</span>
            <strong>${statusLabel}</strong>
        </div>

        <div class="sofascore-scoreboard">
            <div class="sofascore-team">
                <span>Mandante</span>
                <strong>${match.home_team || "-"}</strong>
            </div>

            <div class="sofascore-score">
                <strong>${homeScore}</strong>
                <span>x</span>
                <strong>${awayScore}</strong>
            </div>

            <div class="sofascore-team">
                <span>Visitante</span>
                <strong>${match.away_team || "-"}</strong>
            </div>
        </div>

        <div class="sofascore-info-row">
            <div>
                <span>Data</span>
                <strong>${dateLabel}</strong>
            </div>

            <div>
                <span>Rodada</span>
                <strong>${match.round || match.round_number || "-"}</strong>
            </div>

            <div>
                <span>ID da partida</span>
                <strong>${match.match_id || "-"}</strong>
            </div>
        </div>
    `;
}

function renderSofascoreSummary() {
    const totalElement = document.getElementById("sofascoreTotalMatches");
    const finishedElement = document.getElementById("sofascoreFinishedMatches");
    const liveElement = document.getElementById("sofascoreLiveMatches");
    const scheduledElement = document.getElementById("sofascoreScheduledMatches");

    const matches = sofascoreState.matches || [];

    const total = matches.length;
    const finished = matches.filter((match) => match.status_type === "finished").length;
    const live = matches.filter((match) => match.status_type === "inprogress").length;
    const scheduled = matches.filter((match) => match.status_type !== "finished" && match.status_type !== "inprogress").length;

    if (totalElement) totalElement.textContent = total;
    if (finishedElement) finishedElement.textContent = finished;
    if (liveElement) liveElement.textContent = live;
    if (scheduledElement) scheduledElement.textContent = scheduled;
}

function renderSofascoreSelect() {
    const select = document.getElementById("sofascoreMatchSelect");

    if (!select) return;

    const matches = sofascoreState.matches || [];

    if (!matches.length) {
        select.innerHTML = `<option value="">Nenhum jogo encontrado</option>`;
        renderSofascoreMatchCard(null);
        loadSelectedMatchAnalysis(null);
        return;
    }

    select.innerHTML = matches
        .map((match) => {
            return `
                <option value="${match.match_id}">
                    ${buildSofascoreOptionLabel(match)}
                </option>
            `;
        })
        .join("");

    const firstFinishedMatch = matches.find((match) => match.status_type === "finished");
    const firstMatch = firstFinishedMatch || matches[0];

    select.value = String(firstMatch.match_id);

    renderSofascoreMatchCard(firstMatch);
    loadSelectedMatchAnalysis(firstMatch);

    select.addEventListener("change", () => {
        const selectedId = Number(select.value);
        const selectedMatch = matches.find((match) => Number(match.match_id) === selectedId);

        renderSofascoreMatchCard(selectedMatch);
        loadSelectedMatchAnalysis(selectedMatch);
    });
}

async function initSofascoreSection() {
    const select = document.getElementById("sofascoreMatchSelect");

    if (!select) return;

    try {
        const matchesResponse = await fetch(`${SOFASCORE_API_BASE}/matches`);

        if (!matchesResponse.ok) {
            throw new Error("Erro ao carregar jogos SofaScore.");
        }

        const matches = await matchesResponse.json();

        sofascoreState.matches = Array.isArray(matches) ? matches : [];

        renderSofascoreSelect();
        renderSofascoreSummary();
        setupCopaCompetitionTabs();
        renderActiveCopaStage();

    } catch (error) {
        console.error(error);

        select.innerHTML = `<option value="">Erro ao carregar jogos</option>`;

        renderSofascoreMatchCard(null);
        loadSelectedMatchAnalysis(null);
    }
}

// =======================================================
// ORGANIZAÇÃO POR ABAS — COPA 2026
// =======================================================

const copaStageTabs = ["groups", "r32", "r16", "qf", "sf", "final"];

const copaStageLabels = {
    groups: {
        kicker: "Fase de grupos",
        title: "Grupos da Copa 2026",
        description: "Times e jogos organizados automaticamente pelas rodadas 1, 2 e 3.",
    },
    r32: {
        kicker: "Mata-mata",
        title: "16 avos de final",
        description: "Jogos da primeira fase eliminatória da Copa 2026.",
    },
    r16: {
        kicker: "Mata-mata",
        title: "Oitavas de final",
        description: "Jogos das oitavas de final.",
    },
    qf: {
        kicker: "Mata-mata",
        title: "Quartas de final",
        description: "Jogos das quartas de final.",
    },
    sf: {
        kicker: "Mata-mata",
        title: "Semifinais",
        description: "Jogos das semifinais.",
    },
    final: {
        kicker: "Decisão",
        title: "Final e disputa de terceiro lugar",
        description: "Jogos finais da competição.",
    },
};

function setupCopaCompetitionTabs() {
    const buttons = document.querySelectorAll(".copa-tab-button");

    if (!buttons.length) return;

    assignCopaTabSections();

    buttons.forEach((button) => {
        button.addEventListener("click", () => {
            const tab = button.dataset.copaTab || "overview";
            setActiveCopaTab(tab);
        });
    });

    const currentActive = document.querySelector(".copa-tab-button.active");
    const initialTab = currentActive?.dataset?.copaTab || "overview";

    setActiveCopaTab(initialTab);
}

function assignCopaTabSections() {
    const sections = Array.from(document.querySelectorAll("main.page-shell > section"));

    sections.forEach((section) => {
        if (section.classList.contains("hero-section")) return;
        if (section.classList.contains("copa-tabs-panel")) return;
        if (section.dataset.copaDynamicStage === "true") return;

        if (section.classList.contains("sofascore-live-panel")) {
            section.dataset.copaTabContent = "overview";
            return;
        }

        if (section.classList.contains("selected-match-analysis-panel")) {
            section.dataset.copaTabContent = "overview";
            return;
        }

        const headerText = section.textContent || "";

        if (headerText.includes("Metodologia")) {
            section.dataset.copaTabContent = "overview";
            return;
        }

        section.dataset.copaTabContent = "model";
    });
}

function setActiveCopaTab(tab) {
    const buttons = document.querySelectorAll(".copa-tab-button");
    const dynamicPanel = document.getElementById("copaDynamicStagePanel");

    buttons.forEach((button) => {
        button.classList.toggle("active", button.dataset.copaTab === tab);
    });

    document.querySelectorAll("[data-copa-tab-content]").forEach((section) => {
        const contentTab = section.dataset.copaTabContent;
        section.hidden = contentTab !== tab;
    });

    if (dynamicPanel) {
        const isStageTab = copaStageTabs.includes(tab);
        dynamicPanel.hidden = !isStageTab;

        if (isStageTab) {
            renderCopaStage(tab);
        }
    }
}

function renderActiveCopaStage() {
    const activeButton = document.querySelector(".copa-tab-button.active");
    const activeTab = activeButton?.dataset?.copaTab || "overview";

    if (copaStageTabs.includes(activeTab)) {
        renderCopaStage(activeTab);
    }
}

function renderCopaStage(tab) {
    const label = copaStageLabels[tab];
    const kicker = document.getElementById("copaStageKicker");
    const title = document.getElementById("copaStageTitle");
    const description = document.getElementById("copaStageDescription");
    const grid = document.getElementById("copaStageGrid");

    if (!grid || !label) return;

    if (kicker) kicker.textContent = label.kicker;
    if (title) title.textContent = label.title;
    if (description) description.textContent = label.description;

    if (tab === "groups") {
        renderGroupStage(grid);
        return;
    }

    renderKnockoutStage(tab, grid);
}

function getGroupStageMatches() {
    return (sofascoreState.matches || []).filter((match) => {
        const roundNumber = Number(match.round_number || 0);
        const hasKnockoutName = Boolean(match.round);

        return !hasKnockoutName && [1, 2, 3].includes(roundNumber);
    });
}

function buildGroupsFromMatches(matches) {
    const teamGraph = new Map();

    matches.forEach((match) => {
        const home = match.home_team;
        const away = match.away_team;

        if (!home || !away) return;

        if (!teamGraph.has(home)) teamGraph.set(home, new Set());
        if (!teamGraph.has(away)) teamGraph.set(away, new Set());

        teamGraph.get(home).add(away);
        teamGraph.get(away).add(home);
    });

    const visited = new Set();
    const groups = [];

    for (const team of teamGraph.keys()) {
        if (visited.has(team)) continue;

        const stack = [team];
        const teams = [];

        while (stack.length) {
            const current = stack.pop();

            if (visited.has(current)) continue;

            visited.add(current);
            teams.push(current);

            for (const nextTeam of teamGraph.get(current) || []) {
                if (!visited.has(nextTeam)) {
                    stack.push(nextTeam);
                }
            }
        }

        const groupMatches = matches.filter((match) => {
            return teams.includes(match.home_team) && teams.includes(match.away_team);
        });

        const firstTimestamp = Math.min(
            ...groupMatches.map((match) => match.start_timestamp || Number.MAX_SAFE_INTEGER)
        );

        groups.push({
            teams: teams.sort((a, b) => a.localeCompare(b)),
            matches: groupMatches.sort((a, b) => (a.start_timestamp || 0) - (b.start_timestamp || 0)),
            firstTimestamp,
        });
    }

    return groups.sort((a, b) => a.firstTimestamp - b.firstTimestamp);
}

function calculateGroupTable(group) {
    const table = new Map();

    group.teams.forEach((team) => {
        table.set(team, {
            team,
            points: 0,
            played: 0,
            wins: 0,
            draws: 0,
            losses: 0,
            goalsFor: 0,
            goalsAgainst: 0,
            goalDifference: 0,
        });
    });

    group.matches.forEach((match) => {
        if (match.status_type !== "finished") return;

        const home = table.get(match.home_team);
        const away = table.get(match.away_team);

        if (!home || !away) return;

        const homeScore = Number(match.home_score || 0);
        const awayScore = Number(match.away_score || 0);

        home.played += 1;
        away.played += 1;

        home.goalsFor += homeScore;
        home.goalsAgainst += awayScore;

        away.goalsFor += awayScore;
        away.goalsAgainst += homeScore;

        if (homeScore > awayScore) {
            home.points += 3;
            home.wins += 1;
            away.losses += 1;
        } else if (awayScore > homeScore) {
            away.points += 3;
            away.wins += 1;
            home.losses += 1;
        } else {
            home.points += 1;
            away.points += 1;
            home.draws += 1;
            away.draws += 1;
        }
    });

    return Array.from(table.values())
        .map((row) => ({
            ...row,
            goalDifference: row.goalsFor - row.goalsAgainst,
        }))
        .sort((a, b) => {
            if (b.points !== a.points) return b.points - a.points;
            if (b.goalDifference !== a.goalDifference) return b.goalDifference - a.goalDifference;
            if (b.goalsFor !== a.goalsFor) return b.goalsFor - a.goalsFor;

            return a.team.localeCompare(b.team);
        });
}

function renderGroupStage(grid) {
    const groupMatches = getGroupStageMatches();
    const groups = buildGroupsFromMatches(groupMatches);

    if (!groups.length) {
        grid.innerHTML = `<div class="loading-card">Nenhum grupo encontrado nos dados atuais.</div>`;
        return;
    }

    grid.innerHTML = groups
        .map((group, index) => {
            const groupLetter = String.fromCharCode(65 + index);
            const table = calculateGroupTable(group);

            const tableRows = table
                .map((row, rowIndex) => `
                    <tr>
                        <td>${rowIndex + 1}</td>
                        <td>${row.team}</td>
                        <td>${row.points}</td>
                        <td>${row.played}</td>
                        <td>${row.wins}</td>
                        <td>${row.draws}</td>
                        <td>${row.losses}</td>
                        <td>${row.goalDifference}</td>
                    </tr>
                `)
                .join("");

            const fixtures = group.matches
                .map((match) => renderCompactMatchButton(match))
                .join("");

            return `
                <article class="copa-group-card">
                    <div class="copa-group-header">
                        <span>Grupo ${groupLetter}</span>
                        <strong>${group.teams.length} seleções</strong>
                    </div>

                    <div class="copa-group-teams">
                        ${group.teams.map((team) => `<span>${team}</span>`).join("")}
                    </div>

                    <div class="copa-group-table-wrapper">
                        <table class="copa-group-table">
                            <thead>
                                <tr>
                                    <th>#</th>
                                    <th>Seleção</th>
                                    <th>Pts</th>
                                    <th>J</th>
                                    <th>V</th>
                                    <th>E</th>
                                    <th>D</th>
                                    <th>SG</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${tableRows}
                            </tbody>
                        </table>
                    </div>

                    <div class="copa-group-fixtures">
                        ${fixtures}
                    </div>
                </article>
            `;
        })
        .join("");

    bindCompactMatchButtons();
}

function renderKnockoutStage(tab, grid) {
    const matches = getKnockoutMatchesByTab(tab);

    if (!matches.length) {
        grid.innerHTML = `<div class="loading-card">Nenhum jogo encontrado para esta fase.</div>`;
        return;
    }

    grid.innerHTML = `
        <div class="copa-knockout-grid">
            ${matches.map((match) => renderKnockoutMatchCard(match)).join("")}
        </div>
    `;

    bindCompactMatchButtons();
}

function getKnockoutMatchesByTab(tab) {
    const matches = sofascoreState.matches || [];

    return matches
        .filter((match) => {
            const round = String(match.round || "").toLowerCase();
            const roundNumber = Number(match.round_number || 0);

            if (tab === "r32") {
                return round.includes("round of 32") || roundNumber === 6;
            }

            if (tab === "r16") {
                return round.includes("round of 16") || roundNumber === 7;
            }

            if (tab === "qf") {
                return round.includes("quarter") || roundNumber === 8;
            }

            if (tab === "sf") {
                return round.includes("semi") || roundNumber === 9;
            }

            if (tab === "final") {
                return round.includes("final") || roundNumber >= 10;
            }

            return false;
        })
        .sort((a, b) => (a.start_timestamp || 0) - (b.start_timestamp || 0));
}

function renderCompactMatchButton(match) {
    const status = getSofascoreStatusLabel(match.status_type, match.status);
    const score = match.status_type === "finished" || match.status_type === "inprogress"
        ? `${match.home_score ?? "-"} x ${match.away_score ?? "-"}`
        : "x";

    return `
        <button class="copa-match-button" data-match-id="${match.match_id}">
            <span>${formatSofascoreDate(match.start_datetime_utc)}</span>
            <strong>${match.home_team || "-"} ${score} ${match.away_team || "-"}</strong>
            <em>${status}</em>
        </button>
    `;
}

function renderKnockoutMatchCard(match) {
    const status = getSofascoreStatusLabel(match.status_type, match.status);
    const score = match.status_type === "finished" || match.status_type === "inprogress"
        ? `${match.home_score ?? "-"} x ${match.away_score ?? "-"}`
        : "x";

    return `
        <article class="copa-knockout-card">
            <div class="copa-knockout-top">
                <span>${match.round || "Mata-mata"}</span>
                <strong>${status}</strong>
            </div>

            <div class="copa-knockout-score">
                <span>${match.home_team || "-"}</span>
                <strong>${score}</strong>
                <span>${match.away_team || "-"}</span>
            </div>

            <button class="copa-match-button copa-match-button-full" data-match-id="${match.match_id}">
                Abrir no seletor da visão geral
            </button>
        </article>
    `;
}

function bindCompactMatchButtons() {
    document.querySelectorAll(".copa-match-button").forEach((button) => {
        button.addEventListener("click", () => {
            const matchId = button.dataset.matchId;
            const select = document.getElementById("sofascoreMatchSelect");

            if (!matchId || !select) return;

            select.value = String(matchId);
            select.dispatchEvent(new Event("change"));

            setActiveCopaTab("overview");

            const panel = document.querySelector(".sofascore-live-panel");

            if (panel) {
                panel.scrollIntoView({
                    behavior: "smooth",
                    block: "start",
                });
            }
        });
    });
}

// =======================================================
// ANÁLISE DINÂMICA DA PARTIDA SELECIONADA
// =======================================================

async function loadSelectedMatchAnalysis(match) {
    const content = document.getElementById("selectedMatchAnalysisContent");
    const title = document.getElementById("selectedMatchAnalysisTitle");
    const description = document.getElementById("selectedMatchAnalysisDescription");

    if (!content) return;

    if (!match || !match.match_id) {
        content.innerHTML = `
            <div class="loading-card">
                Selecione uma partida para iniciar a análise dinâmica.
            </div>
        `;
        return;
    }

    if (title) {
        title.textContent = `${match.home_team || "Mandante"} x ${match.away_team || "Visitante"}`;
    }

    if (description) {
        description.textContent = `Dados dinâmicos carregados pelo SofaScore para a partida ID ${match.match_id}.`;
    }

    content.innerHTML = `
        <div class="loading-card">
            Carregando análise da partida selecionada...
        </div>
    `;

    try {
        const [statistics, lineups, shotmap, momentum] = await Promise.all([
            fetchSofascoreDetail(match.match_id, "statistics"),
            fetchSofascoreDetail(match.match_id, "lineups"),
            fetchSofascoreDetail(match.match_id, "shotmap"),
            fetchSofascoreDetail(match.match_id, "momentum"),
        ]);

        renderSelectedMatchAnalysis({
            match,
            statistics,
            lineups,
            shotmap,
            momentum,
        });
    } catch (error) {
        console.error("Erro ao carregar análise dinâmica:", error);

        content.innerHTML = `
            <div class="loading-card">
                Não foi possível carregar a análise dinâmica desta partida.
            </div>
        `;
    }
}

async function fetchSofascoreDetail(matchId, detailType) {
    try {
        const response = await fetch(`${SOFASCORE_API_BASE}/matches/${matchId}/${detailType}`);

        if (!response.ok) {
            return null;
        }

        return await response.json();
    } catch (error) {
        console.warn(`Detalhe indisponível: ${detailType}`, error);
        return null;
    }
}

function renderSelectedMatchAnalysis(data) {
    const content = document.getElementById("selectedMatchAnalysisContent");

    if (!content) return;

    const { match, statistics, lineups, shotmap, momentum } = data;

    content.innerHTML = `
        ${renderDynamicMatchHeader(match)}
        ${renderDynamicDataAvailability(statistics, lineups, shotmap, momentum)}
        ${renderDynamicStatsSection(statistics)}
        ${renderDynamicShotmapSection(shotmap, match)}
        ${renderDynamicLineupsSection(lineups, match)}
        ${renderDynamicMomentumSection(momentum, match)}
    `;
}

function renderDynamicMatchHeader(match) {
    const status = getSofascoreStatusLabel(match.status_type, match.status);
    const date = formatSofascoreDate(match.start_datetime_utc);
    const score = match.status_type === "finished" || match.status_type === "inprogress"
        ? `${match.home_score ?? "-"} x ${match.away_score ?? "-"}`
        : "x";

    return `
        <div class="dynamic-match-hero">
            <div class="dynamic-match-team">
                <span>Mandante</span>
                <strong>${match.home_team || "-"}</strong>
            </div>

            <div class="dynamic-match-score">
                <span>${status}</span>
                <strong>${score}</strong>
                <small>${date}</small>
            </div>

            <div class="dynamic-match-team">
                <span>Visitante</span>
                <strong>${match.away_team || "-"}</strong>
            </div>
        </div>

        <div class="dynamic-match-meta-grid">
            <div>
                <span>Competição</span>
                <strong>${match.tournament_name || "World Cup 2026"}</strong>
            </div>

            <div>
                <span>Rodada/Fase</span>
                <strong>${match.round || match.round_number || "-"}</strong>
            </div>

            <div>
                <span>Status</span>
                <strong>${status}</strong>
            </div>

            <div>
                <span>ID SofaScore</span>
                <strong>${match.match_id || "-"}</strong>
            </div>
        </div>
    `;
}

function renderDynamicDataAvailability(statistics, lineups, shotmap, momentum) {
    const items = [
        {
            label: "Estatísticas",
            available: hasUsefulData(statistics),
        },
        {
            label: "Escalações",
            available: hasUsefulData(lineups),
        },
        {
            label: "Finalizações",
            available: hasUsefulData(shotmap),
        },
        {
            label: "Momentum",
            available: hasUsefulData(momentum),
        },
    ];

    return `
        <div class="dynamic-availability-grid">
            ${items
                .map((item) => `
                    <div class="dynamic-availability-card ${item.available ? "is-available" : "is-missing"}">
                        <span>${item.label}</span>
                        <strong>${item.available ? "Disponível" : "Indisponível"}</strong>
                    </div>
                `)
                .join("")}
        </div>
    `;
}

function hasUsefulData(data) {
    if (!data) return false;

    if (Array.isArray(data)) return data.length > 0;

    if (typeof data === "object") {
        return Object.keys(data).length > 0;
    }

    return false;
}

function renderDynamicStatsSection(statistics) {
    const rows = extractMainStatistics(statistics);

    if (!rows.length) {
        return renderDynamicEmptySection(
            "Estatísticas principais",
            "Nenhuma estatística disponível para esta partida."
        );
    }

    return `
        <div class="dynamic-analysis-section">
            <div class="dynamic-section-title">
                <span>Estatísticas</span>
                <h3>Comparativo principal</h3>
            </div>

            <div class="dynamic-stats-list">
                ${rows
                    .map((row) => `
                        <div class="dynamic-stat-row">
                            <strong>${row.home}</strong>
                            <span>${row.name}</span>
                            <strong>${row.away}</strong>
                        </div>
                    `)
                    .join("")}
            </div>
        </div>
    `;
}

function extractMainStatistics(statistics) {
    if (!statistics) return [];

    const groups = statistics.statistics || statistics.stats || statistics;

    const rows = [];

    function walkStats(node) {
        if (!node) return;

        if (Array.isArray(node)) {
            node.forEach(walkStats);
            return;
        }

        if (typeof node !== "object") return;

        const name = node.name || node.key || node.title || node.groupName;
        const home = node.home || node.homeValue || node.homeTeamValue;
        const away = node.away || node.awayValue || node.awayTeamValue;

        if (name && home !== undefined && away !== undefined) {
            rows.push({
                name,
                home,
                away,
            });
        }

        Object.values(node).forEach((value) => {
            if (Array.isArray(value) || (value && typeof value === "object")) {
                walkStats(value);
            }
        });
    }

    walkStats(groups);

    const seen = new Set();

    return rows
        .filter((row) => {
            const key = `${row.name}-${row.home}-${row.away}`;

            if (seen.has(key)) return false;

            seen.add(key);
            return true;
        })
        .slice(0, 14);
}

function renderDynamicShotmapSection(shotmap, match) {
    const shots = extractShots(shotmap);

    if (!shots.length) {
        return renderDynamicEmptySection(
            "Finalizações",
            "Nenhum dado de finalização disponível para esta partida."
        );
    }

    const totalShots = shots.length;
    const goals = shots.filter((shot) => classifyShotType(shot) === "goal").length;
    const onTarget = shots.filter((shot) => {
        const type = classifyShotType(shot);
        return type === "goal" || type === "on-target";
    }).length;

    const shotsWithCoordinates = shots.filter((shot) => {
        const coords = getShotCoordinates(shot);
        return coords.x !== null && coords.y !== null;
    });

    const topShots = shots.slice(0, 12);

    const shotDotsHtml = shotsWithCoordinates
        .map((shot) => renderShotDot(shot, match))
        .join("");

    const shotListHtml = topShots
        .map((shot) => renderShotListItem(shot))
        .join("");

    return `
        <div class="dynamic-analysis-section">
            <div class="dynamic-section-title">
                <span>Finalizações</span>
                <h3>Mapa e resumo dos chutes</h3>
            </div>

            <div class="dynamic-mini-kpi-grid">
                <div>
                    <span>Total de chutes</span>
                    <strong>${totalShots}</strong>
                </div>

                <div>
                    <span>Gols</span>
                    <strong>${goals}</strong>
                </div>

                <div>
                    <span>No alvo</span>
                    <strong>${onTarget}</strong>
                </div>
            </div>

            <div class="dynamic-shotmap-layout">
                <div class="dynamic-shot-pitch">
                    <div class="dynamic-shot-goal"></div>
                    <div class="dynamic-shot-box big"></div>
                    <div class="dynamic-shot-box small"></div>
                    <div class="dynamic-shot-arc"></div>
                    ${shotDotsHtml}
                </div>

                <div class="dynamic-shot-list compact">
                    ${shotListHtml}
                </div>
            </div>
        </div>
    `;
}

function extractShots(shotmap) {
    if (!shotmap) return [];

    if (Array.isArray(shotmap)) return shotmap;

    if (Array.isArray(shotmap.shotmap)) return shotmap.shotmap;
    if (Array.isArray(shotmap.shots)) return shotmap.shots;
    if (Array.isArray(shotmap.events)) return shotmap.events;

    return [];
}

function getShotCoordinates(shot) {
    const rawX =
        shot.playerCoordinates?.x ??
        shot.coordinates?.x ??
        shot.coordinate?.x ??
        shot.x ??
        null;

    const rawY =
        shot.playerCoordinates?.y ??
        shot.coordinates?.y ??
        shot.coordinate?.y ??
        shot.y ??
        null;

    if (rawX === null || rawY === null) {
        return {
            x: null,
            y: null,
        };
    }

    let x = Number(rawX);
    let y = Number(rawY);

    if (Number.isNaN(x) || Number.isNaN(y)) {
        return {
            x: null,
            y: null,
        };
    }

    x = Math.max(0, Math.min(100, x));
    y = Math.max(0, Math.min(100, y));

    return {
        x,
        y,
    };
}

function classifyShotType(shot) {
    const rawType = String(
        shot.shotType ||
        shot.type ||
        shot.result ||
        shot.bodyPart ||
        ""
    ).toLowerCase();

    if (rawType.includes("goal")) return "goal";
    if (rawType.includes("save") || rawType.includes("on")) return "on-target";
    if (rawType.includes("block")) return "blocked";

    return "off-target";
}

function renderShotDot(shot, match) {
    const coords = getShotCoordinates(shot);
    const type = classifyShotType(shot);

    if (coords.x === null || coords.y === null) {
        return "";
    }

    const player = shot.player?.name || shot.playerName || shot.player?.shortName || "Jogador";
    const minute = shot.time || shot.minute || shot.addedTime || "-";
    const xg = shot.xg ?? shot.expectedGoals ?? shot.xG ?? null;

    const left = coords.y;
    const top = 100 - coords.x;

    const title = `${String(player)} · ${String(minute)}' · ${
        xg !== null ? `xG ${Number(xg).toFixed(2)}` : "xG -"
    }`;

    return `
        <button
            class="dynamic-shot-dot ${type}"
            style="left: ${left}%; top: ${top}%;"
            title="${title}"
            aria-label="${title}"
        ></button>
    `;
}

function renderShotListItem(shot) {
    const player = shot.player?.name || shot.playerName || shot.player?.shortName || "Jogador não identificado";
    const minute = shot.time || shot.minute || shot.addedTime || "-";
    const shotType = shot.shotType || shot.type || shot.situation || shot.goalType || "-";
    const xg = shot.xg ?? shot.expectedGoals ?? shot.xG ?? null;

    return `
        <div class="dynamic-shot-item">
            <strong>${String(player)}</strong>
            <span>Minuto ${String(minute)} · ${String(shotType)}</span>
            <em>${xg !== null ? `xG ${Number(xg).toFixed(2)}` : "xG -"}</em>
        </div>
    `;
}

function renderDynamicLineupsSection(lineups, match) {
    const extracted = extractLineups(lineups);

    if (!extracted.home.length && !extracted.away.length) {
        return renderDynamicEmptySection(
            "Escalações",
            "Nenhuma escalação disponível para esta partida."
        );
    }

    return `
        <div class="dynamic-analysis-section">
            <div class="dynamic-section-title">
                <span>Escalações</span>
                <h3>Titulares e reservas relacionados</h3>
            </div>

            <div class="dynamic-lineups-grid">
                ${renderDynamicTeamLineupCard(match?.home_team || "Mandante", extracted.home)}
                ${renderDynamicTeamLineupCard(match?.away_team || "Visitante", extracted.away)}
            </div>
        </div>
    `;
}

function extractLineups(lineups) {
    if (!lineups) {
        return {
            home: [],
            away: [],
        };
    }

    const homePlayers = lineups.home?.players || lineups.homePlayers || [];
    const awayPlayers = lineups.away?.players || lineups.awayPlayers || [];

    return {
        home: normalizeLineupPlayers(homePlayers),
        away: normalizeLineupPlayers(awayPlayers),
    };
}

function normalizeLineupPlayers(players) {
    if (!Array.isArray(players)) return [];

    return players.map((item) => {
        const player = item.player || item;

        return {
            name: player.name || player.shortName || "Jogador",
            shirtNumber: item.shirtNumber || item.jerseyNumber || player.shirtNumber || "-",
            position: item.position || player.position || "-",
            substitute: Boolean(item.substitute),
        };
    });
}

function renderDynamicTeamLineupCard(teamName, players) {
    const starters = players.filter((player) => !player.substitute);
    const bench = players.filter((player) => player.substitute);

    return `
        <div class="dynamic-lineup-card">
            <h4>${teamName}</h4>

            <div class="dynamic-lineup-subtitle">
                Titulares
            </div>

            ${renderDynamicPlayersList(starters)}

            <div class="dynamic-lineup-subtitle">
                Reservas
            </div>

            ${renderDynamicPlayersList(bench)}
        </div>
    `;
}

function renderDynamicPlayersList(players) {
    if (!players.length) {
        return `<div class="dynamic-empty-small">Sem jogadores disponíveis.</div>`;
    }

    return `
        <div class="dynamic-player-list">
            ${players
                .map((player) => `
                    <div class="dynamic-player-row">
                        <strong>${player.shirtNumber}</strong>
                        <span>${player.name}</span>
                        <em>${player.substitute ? "Banco" : "Titular"}</em>
                    </div>
                `)
                .join("")}
        </div>
    `;
}

function renderDynamicMomentumSection(momentum, match) {
    const items = extractMomentum(momentum);

    if (!items.length) {
        return renderDynamicEmptySection(
            "Momentum",
            "Nenhum dado de momentum disponível para esta partida."
        );
    }

    const normalizedItems = items
        .map((item) => {
            const minute = item.minute || item.time || item.periodTime || "-";
            const value = Number(item.value ?? item.home ?? item.away ?? 0);

            return {
                minute,
                value,
            };
        })
        .filter((item) => !Number.isNaN(item.value))
        .slice(0, 100);

    const maxValue = Math.max(
        ...normalizedItems.map((item) => Math.abs(item.value)),
        1
    );

    return `
        <div class="dynamic-analysis-section">
            <div class="dynamic-section-title">
                <span>Momentum</span>
                <h3>Domínio da partida por minuto</h3>
            </div>

            <div class="dynamic-momentum-chart">
                <div class="dynamic-momentum-team-label home">
                    ${match?.home_team || "Mandante"}
                </div>

                <div class="dynamic-momentum-bars">
                    ${normalizedItems
                        .map((item) => {
                            const height = Math.max(Math.abs(item.value) / maxValue * 46, 3);
                            const isHome = item.value >= 0;

                            return `
                                <div class="dynamic-momentum-column" title="${item.minute}' · ${item.value}">
                                    <div
                                        class="dynamic-momentum-column-bar ${isHome ? "home" : "away"}"
                                        style="
                                            height: ${height}%;
                                            ${isHome ? "bottom: 50%;" : "top: 50%;"}
                                        "
                                    ></div>
                                </div>
                            `;
                        })
                        .join("")}
                </div>

                <div class="dynamic-momentum-center-line"></div>

                <div class="dynamic-momentum-team-label away">
                    ${match?.away_team || "Visitante"}
                </div>
            </div>
        </div>
    `;
}

function extractMomentum(momentum) {
    if (!momentum) return [];

    if (Array.isArray(momentum)) return momentum;
    if (Array.isArray(momentum.graphPoints)) return momentum.graphPoints;
    if (Array.isArray(momentum.momentum)) return momentum.momentum;
    if (Array.isArray(momentum.data)) return momentum.data;

    return [];
}

function renderDynamicEmptySection(title, message) {
    return `
        <div class="dynamic-analysis-section dynamic-analysis-empty">
            <div class="dynamic-section-title">
                <span>${title}</span>
                <h3>Dados indisponíveis</h3>
            </div>

            <p>${message}</p>
        </div>
    `;
}

// =======================================================
// INICIALIZAÇÃO
// =======================================================

document.addEventListener("DOMContentLoaded", () => {
    initSofascoreSection();
    setupCopaCompetitionTabs();
});
