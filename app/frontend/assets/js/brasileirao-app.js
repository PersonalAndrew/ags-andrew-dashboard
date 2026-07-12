const state = {
    summary: null,
    standings: [],
    shootingAgainst: [],
    teamShooting: [],
    players: [],
    matches: [],
    selectedTeam: "",
    playerSearch: "",
    playerSort: "shots",
};

async function fetchJson(url) {
    const response = await fetch(url);

    if (!response.ok) {
        throw new Error(`Erro ao carregar ${url}`);
    }

    return response.json();
}

function formatNumber(value) {
    return new Intl.NumberFormat("pt-BR").format(value ?? 0);
}

function normalizeText(value) {
    return String(value ?? "")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase();
}

function renderSummary(summary) {
    document.getElementById("brTotalTeams").textContent = formatNumber(summary.total_teams);
    document.getElementById("brTotalMatches").textContent = formatNumber(summary.total_matches);
    document.getElementById("brTotalGoals").textContent = formatNumber(summary.total_goals);
    document.getElementById("brLeader").textContent = summary.leader?.team ?? "--";

    document.getElementById("brXgNote").textContent =
        "xG indispon\u00edvel nesta extra\u00e7\u00e3o do FBref/SoccerData. O m\u00f3dulo usa gols, finaliza\u00e7\u00f5es, finaliza\u00e7\u00f5es no alvo e volume por 90 minutos.";
}

function populateTeamFilter(rows) {
    const select = document.getElementById("brTeamFilter");

    const currentValue = select.value;

    select.innerHTML = `
        <option value="">Todos os clubes</option>
        ${rows.map((row) => `<option value="${row.team}">${row.team}</option>`).join("")}
    `;

    select.value = currentValue;
}

function getSelectedClubData() {
    if (!state.selectedTeam) {
        return null;
    }

    const tableRow = state.standings.find((row) => row.team === state.selectedTeam);
    const shotsAgainstRow = state.shootingAgainst.find((row) => row.team === state.selectedTeam);
    const attackRow = state.teamShooting.find((row) => row.team === state.selectedTeam);

    return {
        ...tableRow,
        shots_against: shotsAgainstRow?.shots_against ?? null,
        shots_for: attackRow?.shots ?? null,
        shots_on_target: attackRow?.shots_on_target ?? null,
        shot_accuracy: attackRow?.shot_accuracy ?? null,
    };
}

function renderClubPanel() {
    const club = getSelectedClubData();

    const name = document.getElementById("brClubName");
    const description = document.getElementById("brClubDescription");
    const position = document.getElementById("brClubPosition");
    const points = document.getElementById("brClubPoints");
    const shotsFor = document.getElementById("brClubShotsFor");
    const shotsOnTarget = document.getElementById("brClubShotsOnTarget");
    const shotAccuracy = document.getElementById("brClubShotAccuracy");
    const shotsAgainst = document.getElementById("brClubShotsAgainst");

    if (!club) {
        name.textContent = "Vis\u00e3o geral da competi\u00e7\u00e3o";
        description.textContent = "Escolha um clube para ver resumo ofensivo, defensivo, jogadores e calend\u00e1rio.";
        position.textContent = "--";
        points.textContent = "--";
        shotsFor.textContent = "--";
        shotsOnTarget.textContent = "--";
        shotAccuracy.textContent = "--";
        shotsAgainst.textContent = "--";
        return;
    }

    name.textContent = club.team;
    description.textContent = `${club.matches} jogos, ${club.wins} vit\u00f3rias, ${club.draws} empates e ${club.losses} derrotas.`;

    position.textContent = `${club.position}\u00ba`;
    points.textContent = club.points;
    shotsFor.textContent = club.shots_for ?? "--";
    shotsOnTarget.textContent = club.shots_on_target ?? "--";
    shotAccuracy.textContent = club.shot_accuracy !== null ? `${club.shot_accuracy}%` : "--";
    shotsAgainst.textContent = club.shots_against ?? "--";
}


function renderClubs() {
    const body = document.getElementById("brClubsBody");

    if (!body) {
        return;
    }

    body.innerHTML = state.standings.map((row) => {
        const attackRow = state.teamShooting.find((team) => team.team === row.team) ?? {};
        const againstRow = state.shootingAgainst.find((team) => team.team === row.team) ?? {};
        const highlighted = row.team === state.selectedTeam ? "is-highlighted" : "";

        return `
            <tr class="${highlighted}">
                <td>${row.position}</td>
                <td><strong>${row.team}</strong></td>
                <td><strong>${row.points}</strong></td>
                <td>${row.goal_difference}</td>
                <td>${row.goals_for}</td>
                <td>${attackRow.shots ?? "--"}</td>
                <td>${attackRow.shots_on_target ?? "--"}</td>
                <td>${attackRow.shot_accuracy !== undefined ? `${attackRow.shot_accuracy}%` : "--"}</td>
                <td>${againstRow.shots_against ?? "--"}</td>
            </tr>
        `;
    }).join("");
}

function renderStandings() {
    const body = document.getElementById("brStandingsBody");

    body.innerHTML = state.standings.map((row) => {
        const highlighted = row.team === state.selectedTeam ? "is-highlighted" : "";

        return `
            <tr class="${highlighted}">
                <td>${row.position}</td>
                <td><strong>${row.team}</strong></td>
                <td>${row.matches}</td>
                <td>${row.wins}</td>
                <td>${row.draws}</td>
                <td>${row.losses}</td>
                <td>${row.goal_difference}</td>
                <td><strong>${row.points}</strong></td>
            </tr>
        `;
    }).join("");
}

function renderShootingAgainst() {
    const container = document.getElementById("brShootingAgainst");

    container.innerHTML = state.shootingAgainst.map((row, index) => {
        const highlighted = row.team === state.selectedTeam ? " is-highlighted" : "";

        return `
            <div class="br-ranking-item${highlighted}">
                <strong>${index + 1}. ${row.team}</strong>
                <span>${row.shots_against}</span>
            </div>
        `;
    }).join("");
}

function getFilteredPlayers() {
    let rows = [...state.players];

    if (state.selectedTeam) {
        rows = rows.filter((row) => row.team === state.selectedTeam);
    }

    if (state.playerSearch) {
        const search = normalizeText(state.playerSearch);
        rows = rows.filter((row) => normalizeText(row.player).includes(search));
    }

    rows.sort((a, b) => {
        const valueA = Number(a[state.playerSort] ?? 0);
        const valueB = Number(b[state.playerSort] ?? 0);

        return valueB - valueA;
    });

    return rows;
}

function renderPlayers() {
    const body = document.getElementById("brPlayersBody");
    const limit = state.selectedTeam || state.playerSearch ? 20 : 8;
    const rows = getFilteredPlayers().slice(0, limit);

    if (!rows.length) {
        body.innerHTML = `
            <tr>
                <td colspan="7">Nenhum jogador encontrado com os filtros atuais.</td>
            </tr>
        `;
        return;
    }

    body.innerHTML = rows.map((row) => {
        const nineties = Number(row.nineties ?? 0);
        const shots = Number(row.shots ?? 0);
        const shotsOnTarget = Number(row.shots_on_target ?? 0);
        const shotsNotOnTarget = Math.max(shots - shotsOnTarget, 0);
        const estimatedMinutes = Math.round(nineties * 90);
        const shotsPer90 = Number(row.shots_per90 ?? 0);

        return `
            <tr>
                <td><strong>${row.player}</strong></td>
                <td>${row.team}</td>
                <td>${formatNumber(estimatedMinutes)} min</td>
                <td><strong>${shots}</strong></td>
                <td>${shotsOnTarget}</td>
                <td>${shotsNotOnTarget}</td>
                <td><strong>${shotsPer90.toFixed(2)}</strong> por 90 min</td>
            </tr>
        `;
    }).join("");
}

function isPlayedMatch(row) {
    return /\d/.test(String(row.score ?? ""));
}

function getFilteredMatches() {
    let rows = [...state.matches];

    if (state.selectedTeam) {
        rows = rows.filter((row) => (
            row.home_team === state.selectedTeam ||
            row.away_team === state.selectedTeam
        ));

        rows = rows.filter(isPlayedMatch);

        return rows;
    }

    return rows.filter(isPlayedMatch).slice(0, 20);
}

function renderMatches() {
    const body = document.getElementById("brMatchesBody");
    const title = document.getElementById("brMatchesTitle");
    const rows = getFilteredMatches();

    title.textContent = state.selectedTeam
        ? `Partidas realizadas de ${state.selectedTeam} (${rows.length})`
        : `Partidas realizadas da competi\u00e7\u00e3o (${rows.length} exibidas)`;

    body.innerHTML = rows.map((row) => `
        <tr>
            <td>${row.week ?? "--"}</td>
            <td>${row.date ?? "--"}</td>
            <td><strong>${row.home_team}</strong></td>
            <td>${row.score ?? "x"}</td>
            <td><strong>${row.away_team}</strong></td>
            <td>${row.venue ?? "--"}</td>
        </tr>
    `).join("");
}

function renderAll() {
    renderClubPanel();
    renderStandings();
    renderClubs();
    renderShootingAgainst();
    renderPlayers();
    renderMatches();
}

function setupFilters() {
    const teamFilter = document.getElementById("brTeamFilter");
    const playerSearch = document.getElementById("brPlayerSearch");
    const playerSort = document.getElementById("brPlayerSort");
    const clearFilters = document.getElementById("brClearFilters");

    teamFilter.addEventListener("change", (event) => {
        state.selectedTeam = event.target.value;
        renderAll();
    });

    playerSearch.addEventListener("input", (event) => {
        state.playerSearch = event.target.value;
        renderPlayers();
    });

    playerSort.addEventListener("change", (event) => {
        state.playerSort = event.target.value;
        renderPlayers();
    });

    clearFilters.addEventListener("click", () => {
        state.selectedTeam = "";
        state.playerSearch = "";
        state.playerSort = "shots";

        teamFilter.value = "";
        playerSearch.value = "";
        playerSort.value = "shots";

        renderAll();
    });
}

async function initBrasileiraoDashboard() {
    try {
        const [summary, standings, shootingAgainst, teamShooting, playerShooting, matches] = await Promise.all([
            fetchJson("/api/brasileirao/summary"),
            fetchJson("/api/brasileirao/standings"),
            fetchJson("/api/brasileirao/shooting-against"),
            fetchJson("/api/brasileirao/team-shooting"),
            fetchJson("/api/brasileirao/player-shooting?limit=1000"),
            fetchJson("/api/brasileirao/matches?limit=380"),
        ]);

        state.summary = summary;
        state.standings = standings.standings ?? [];
        state.shootingAgainst = shootingAgainst.shooting_against ?? [];
        state.teamShooting = teamShooting.teams ?? [];
        state.players = playerShooting.players ?? [];
        state.matches = matches.matches ?? [];

        renderSummary(summary);
        populateTeamFilter(state.standings);
        setupFilters();
        renderAll();
    } catch (error) {
        console.error(error);

        document.getElementById("brXgNote").textContent =
            "Erro ao carregar os dados do Brasileirao. Verifique se o backend esta rodando.";
    }
}


function setupBrasileiraoTabs() {
    const buttons = document.querySelectorAll(".br-tab-button");
    const panels = document.querySelectorAll(".br-tab-panel");

    buttons.forEach((button) => {
        button.addEventListener("click", () => {
            const target = button.dataset.tab;

            buttons.forEach((item) => {
                item.classList.toggle("active", item === button);
            });

            panels.forEach((panel) => {
                panel.classList.toggle("active", panel.dataset.panel === target);
            });
        });
    });
}


document.addEventListener("DOMContentLoaded", () => {
    setupBrasileiraoTabs();
    initBrasileiraoDashboard();
});
