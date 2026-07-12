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

function renderSummary(summary) {
    document.getElementById("brTotalTeams").textContent = formatNumber(summary.total_teams);
    document.getElementById("brTotalMatches").textContent = formatNumber(summary.total_matches);
    document.getElementById("brTotalGoals").textContent = formatNumber(summary.total_goals);
    document.getElementById("brLeader").textContent = summary.leader?.team ?? "--";

    document.getElementById("brXgNote").textContent = summary.xg_note;
}

function renderStandings(rows) {
    const body = document.getElementById("brStandingsBody");

    body.innerHTML = rows.map((row) => `
        <tr>
            <td>${row.position}</td>
            <td><strong>${row.team}</strong></td>
            <td>${row.matches}</td>
            <td>${row.wins}</td>
            <td>${row.draws}</td>
            <td>${row.losses}</td>
            <td>${row.goal_difference}</td>
            <td><strong>${row.points}</strong></td>
        </tr>
    `).join("");
}

function renderShootingAgainst(rows) {
    const container = document.getElementById("brShootingAgainst");

    container.innerHTML = rows.slice(0, 10).map((row, index) => `
        <div class="br-ranking-item">
            <strong>${index + 1}. ${row.team}</strong>
            <span>${row.shots_against}</span>
        </div>
    `).join("");
}

function renderPlayers(rows) {
    const body = document.getElementById("brPlayersBody");

    body.innerHTML = rows.slice(0, 20).map((row) => `
        <tr>
            <td><strong>${row.player}</strong></td>
            <td>${row.team}</td>
            <td>${row.nineties}</td>
            <td><strong>${row.shots}</strong></td>
        </tr>
    `).join("");
}

async function initBrasileiraoDashboard() {
    try {
        const [summary, standings, shootingAgainst, playerShooting] = await Promise.all([
            fetchJson("/api/brasileirao/summary"),
            fetchJson("/api/brasileirao/standings"),
            fetchJson("/api/brasileirao/shooting-against"),
            fetchJson("/api/brasileirao/player-shooting?limit=50"),
        ]);

        renderSummary(summary);
        renderStandings(standings.standings ?? []);
        renderShootingAgainst(shootingAgainst.shooting_against ?? []);
        renderPlayers(playerShooting.players ?? []);
    } catch (error) {
        console.error(error);

        document.getElementById("brXgNote").textContent =
            "Erro ao carregar os dados do Brasileirão. Verifique se o backend está rodando.";
    }
}

document.addEventListener("DOMContentLoaded", initBrasileiraoDashboard);