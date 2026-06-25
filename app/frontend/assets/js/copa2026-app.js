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