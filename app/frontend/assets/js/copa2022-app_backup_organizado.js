const API = "/api/statsbomb";

async function fetchJSON(url) {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Erro ${res.status} em ${url}`);
    return res.json();
}

async function loadSummary() {
    const data = await fetchJSON(`${API}/summary`);
    const el = document.getElementById("kpi-row");

    el.innerHTML = `
        <div class="kpi-card">
            <div class="kpi-value">${data.total_matches}</div>
            <div class="kpi-label">Partidas</div>
        </div>
        <div class="kpi-card">
            <div class="kpi-value">${data.total_goals}</div>
            <div class="kpi-label">Gols na Copa</div>
        </div>
        <div class="kpi-card">
            <div class="kpi-value">${data.teams_count}</div>
            <div class="kpi-label">Seleções</div>
        </div>
        <div class="kpi-card">
            <div class="kpi-value">${data.top_scorer ? data.top_scorer.gols : "-"}</div>
            <div class="kpi-label">Artilheiro</div>
            <div class="kpi-sub">${data.top_scorer ? data.top_scorer.player : ""}</div>
        </div>
    `;
}

async function loadArtilheiros() {
    const data = await fetchJSON(`${API}/artilheiros?limit=10`);
    const el = document.getElementById("artilheiros-list");

    el.innerHTML = data.artilheiros.map((a, i) => `
        <div class="scorer-row">
            <div>
                <span class="rank-badge">${i + 1}</span>
                <span class="scorer-name">${a.player}</span>
                <div class="scorer-team">${a.team}</div>
            </div>
            <div class="scorer-goals">${a.gols}</div>
        </div>
    `).join("");
}

let rankingChart = null;

async function loadRanking(orderBy = "gols") {
    const data = await fetchJSON(`${API}/ranking?order_by=${orderBy}&limit=32`);
    const labels = data.ranking.map(r => r.team);
    const values = data.ranking.map(r => r[orderBy]);

    const ctx = document.getElementById("ranking-chart");
    if (rankingChart) rankingChart.destroy();

    rankingChart = new Chart(ctx, {
        type: "bar",
        data: {
            labels,
            datasets: [{
                label: orderBy,
                data: values,
                backgroundColor: "rgba(212, 175, 55, 0.75)",
                borderColor: "#D4AF37",
                borderWidth: 1,
                borderRadius: 6,
            }],
        },
        options: {
            indexAxis: "y",
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                x: {
                    ticks: {
                        color: "#A8A29E"
                    },
                    grid: {
                        color: "rgba(255,255,255,0.05)"
                    }
                },
                y: {
                    ticks: {
                        color: "#F5F5F5"
                    },
                    grid: {
                        display: false
                    }
                },
            },
        },
    });
}

async function loadBrasilCampanha() {
    const data = await fetchJSON(`${API}/brasil-campanha`);
    const tbody = document.getElementById("brasil-tbody");

    tbody.innerHTML = data.campanha.map(j => `
        <tr>
            <td>${j.match_date}</td>
            <td>${j.competition_stage}</td>
            <td>${j.opponent}</td>
            <td>${j.goals ?? "-"} x ${j.gols_sofridos ?? "-"}</td>
            <td>${j.xg ? Number(j.xg).toFixed(2) : "-"}</td>
            <td>${j.shots ?? "-"}</td>
            <td>${j.shots_on_target ?? "-"}</td>
        </tr>
    `).join("");
}

async function loadMatches(team = "") {
    const url = team ? `${API}/matches?team=${encodeURIComponent(team)}` : `${API}/matches`;
    const data = await fetchJSON(url);
    const tbody = document.getElementById("matches-tbody");

    if (!data.matches.length) {
        tbody.innerHTML = `<tr><td colspan="5" class="loading">Nenhuma partida encontrada</td></tr>`;
        return;
    }

    tbody.innerHTML = data.matches.map(m => `
        <tr>
            <td>${m.match_date}</td>
            <td>${m.competition_stage}</td>
            <td>${m.home_team}</td>
            <td style="color:var(--gold);font-weight:700;">${m.home_score} – ${m.away_score}</td>
            <td>${m.away_team}</td>
        </tr>
    `).join("");
}

async function populateTeamFilter() {
    const data = await fetchJSON(`${API}/ranking?limit=32`);
    const select = document.getElementById("team-filter");

    if (!select) return;

    const teams = data.ranking.map(r => r.team).sort();

    select.innerHTML = `<option value="">Todas as seleções</option>` +
        teams.map(t => `<option value="${t}">${t}</option>`).join("");

    select.addEventListener("change", () => loadMatches(select.value));
}

/* ============================
   ANÁLISE POR PARTIDA — V2
============================ */

let analysisMatches = [];

async function populateAnalysisMatchSelect() {
    const data = await fetchJSON(`${API}/matches`);
    analysisMatches = data.matches;

    const select = document.getElementById("analysis-match-select");

    if (!select) return;

    select.innerHTML = `<option value="">Selecione uma partida</option>` +
        analysisMatches.map(m => `
            <option value="${m.match_id}">
                ${m.match_date} - ${m.home_team} ${m.home_score} x ${m.away_score} ${m.away_team}
            </option>
        `).join("");

    select.addEventListener("change", async () => {
        const matchId = select.value;

        clearAnalysisBoxes();

        if (!matchId) {
            resetAnalysisFilters();
            return;
        }

        await populateAnalysisTeamSelect(matchId);
        await loadMatchAnalysis();
    });
}

function resetAnalysisFilters() {
    const teamSelect = document.getElementById("analysis-team-select");
    const playerSelect = document.getElementById("analysis-player-select");

    if (teamSelect) {
        teamSelect.innerHTML = `<option value="">Ambos os times</option>`;
    }

    if (playerSelect) {
        playerSelect.innerHTML = `<option value="">Todos os jogadores</option>`;
    }
}

async function populateAnalysisTeamSelect(matchId) {
    const match = analysisMatches.find(m => String(m.match_id) === String(matchId));
    const select = document.getElementById("analysis-team-select");

    if (!select || !match) return;

    select.innerHTML = `
        <option value="">Ambos os times</option>
        <option value="${match.home_team}">${match.home_team}</option>
        <option value="${match.away_team}">${match.away_team}</option>
    `;

    select.onchange = async () => {
        await populateAnalysisPlayerSelect();
        await loadMatchAnalysis();
    };

    await populateAnalysisPlayerSelect();
}

async function populateAnalysisPlayerSelect() {
    const matchId = document.getElementById("analysis-match-select")?.value;
    const team = document.getElementById("analysis-team-select")?.value;
    const playerSelect = document.getElementById("analysis-player-select");

    if (!matchId || !playerSelect) return;

    let url = `${API}/players?match_id=${encodeURIComponent(matchId)}`;

    if (team) {
        url += `&team=${encodeURIComponent(team)}`;
    }

    const data = await fetchJSON(url);

    playerSelect.innerHTML = `<option value="">Todos os jogadores</option>` +
        data.players.map(p => `
            <option value="${p.player}">
                ${p.jersey_number ? `${p.jersey_number} - ` : ""}${p.player}
            </option>
        `).join("");

    playerSelect.onchange = async () => {
        await loadMatchAnalysis();
    };
}

function clearAnalysisBoxes() {
    const ids = [
        "lineups-box",
        "player-summary-box",
        "shots-box",
        "passes-box"
    ];

    ids.forEach(id => {
        const el = document.getElementById(id);

        if (el) {
            el.innerHTML = `<div class="loading">Selecione uma partida</div>`;
        }
    });
}

function getAnalysisFilters() {
    const matchId = document.getElementById("analysis-match-select")?.value;
    const team = document.getElementById("analysis-team-select")?.value;
    const player = document.getElementById("analysis-player-select")?.value;

    return {
        matchId,
        team,
        player
    };
}

async function loadMatchAnalysis() {
    const { matchId } = getAnalysisFilters();

    if (!matchId) return;

    await Promise.all([
        loadAnalysisLineups(),
        loadAnalysisPlayerSummary(),
        loadAnalysisShots(),
        loadAnalysisPasses(),
    ]);
}

async function loadAnalysisLineups() {
    const { matchId, team } = getAnalysisFilters();
    const box = document.getElementById("lineups-box");

    if (!box || !matchId) return;

    let url = `${API}/lineups?match_id=${encodeURIComponent(matchId)}`;

    if (team) {
        url += `&team=${encodeURIComponent(team)}`;
    }

    const data = await fetchJSON(url);

    if (!data.lineups.length) {
        box.innerHTML = `<div class="loading">Nenhuma escalação encontrada</div>`;
        return;
    }

    const grouped = {};

    data.lineups.forEach(p => {
        if (!grouped[p.team]) grouped[p.team] = [];
        grouped[p.team].push(p);
    });

    box.innerHTML = Object.entries(grouped).map(([teamName, players]) => `
        <div class="team-lineup">
            <h4>${teamName} ${players[0]?.formation ? `- ${players[0].formation}` : ""}</h4>
            <div class="lineup-list">
                ${players.map(p => `
                    <div class="lineup-player">
                        <span class="shirt-number">${p.jersey_number ?? "-"}</span>
                        <div>
                            <strong>${p.player_name}</strong>
                            <small>${p.position_name ?? ""}</small>
                        </div>
                    </div>
                `).join("")}
            </div>
        </div>
    `).join("");
}

async function loadAnalysisPlayerSummary() {
    const { matchId, team, player } = getAnalysisFilters();
    const box = document.getElementById("player-summary-box");

    if (!box || !matchId) return;

    let url = `${API}/player-summary?match_id=${encodeURIComponent(matchId)}&limit=30`;

    if (team) {
        url += `&team=${encodeURIComponent(team)}`;
    }

    if (player) {
        url += `&player=${encodeURIComponent(player)}`;
    }

    const data = await fetchJSON(url);

    if (!data.players.length) {
        box.innerHTML = `<div class="loading">Nenhum jogador encontrado</div>`;
        return;
    }

    box.innerHTML = `
        <div class="table-wrapper small-table">
            <table>
                <thead>
                    <tr>
                        <th>Jogador</th>
                        <th>Time</th>
                        <th>Ações</th>
                        <th>Passes</th>
                        <th>Chutes</th>
                        <th>Gols</th>
                        <th>xG</th>
                        <th>Dribles</th>
                    </tr>
                </thead>
                <tbody>
                    ${data.players.map(p => `
                        <tr>
                            <td>${p.player}</td>
                            <td>${p.team}</td>
                            <td>${p.total_events ?? 0}</td>
                            <td>${p.passes_certos ?? 0}/${p.passes ?? 0}</td>
                            <td>${p.chutes ?? 0}</td>
                            <td>${p.gols ?? 0}</td>
                            <td>${Number(p.xg ?? 0).toFixed(2)}</td>
                            <td>${p.dribles_certos ?? 0}/${p.dribles ?? 0}</td>
                        </tr>
                    `).join("")}
                </tbody>
            </table>
        </div>
    `;
}

async function loadAnalysisShots() {
    const { matchId, team, player } = getAnalysisFilters();
    const box = document.getElementById("shots-box");

    if (!box || !matchId) return;

    let url = `${API}/shotmap-data?match_id=${encodeURIComponent(matchId)}`;

    if (team) {
        url += `&team=${encodeURIComponent(team)}`;
    }

    if (player) {
        url += `&player=${encodeURIComponent(player)}`;
    }

    const data = await fetchJSON(url);

    if (!data.shots.length) {
        box.innerHTML = `<div class="loading">Nenhum chute encontrado</div>`;
        return;
    }

    const totalShots = data.shots.length;
    const totalGoals = data.shots.filter(s => s.shot_outcome === "Goal").length;
    const totalXg = data.shots.reduce((acc, s) => acc + Number(s.shot_xg || 0), 0);

    box.innerHTML = `
        <div class="stat-highlight-row">
            <div>
                <strong>${totalShots}</strong>
                <span>Chutes</span>
            </div>
            <div>
                <strong>${totalGoals}</strong>
                <span>Gols</span>
            </div>
            <div>
                <strong>${totalXg.toFixed(2)}</strong>
                <span>xG</span>
            </div>
        </div>

        <div class="table-wrapper small-table">
            <table>
                <thead>
                    <tr>
                        <th>Min</th>
                        <th>Jogador</th>
                        <th>Time</th>
                        <th>xG</th>
                        <th>Resultado</th>
                        <th>Parte do corpo</th>
                    </tr>
                </thead>
                <tbody>
                    ${data.shots.map(s => `
                        <tr>
                            <td>${s.minute}'</td>
                            <td>${s.player ?? "-"}</td>
                            <td>${s.team}</td>
                            <td>${Number(s.shot_xg ?? 0).toFixed(2)}</td>
                            <td>${s.shot_outcome ?? "-"}</td>
                            <td>${s.shot_body_part ?? "-"}</td>
                        </tr>
                    `).join("")}
                </tbody>
            </table>
        </div>
    `;
}

async function loadAnalysisPasses() {
    const { matchId, team, player } = getAnalysisFilters();
    const box = document.getElementById("passes-box");

    if (!box || !matchId) return;

    let url = `${API}/passmap-data?match_id=${encodeURIComponent(matchId)}&limit=2000`;

    if (team) {
        url += `&team=${encodeURIComponent(team)}`;
    }

    if (player) {
        url += `&player=${encodeURIComponent(player)}`;
    }

    const data = await fetchJSON(url);

    if (!data.passes.length) {
        box.innerHTML = `<div class="loading">Nenhum passe encontrado</div>`;
        return;
    }

    const totalPasses = data.passes.length;
    const completedPasses = data.passes.filter(p => !p.pass_outcome).length;

    box.innerHTML = `
        <div class="stat-highlight-row">
            <div>
                <strong>${totalPasses}</strong>
                <span>Passes listados</span>
            </div>
            <div>
                <strong>${completedPasses}</strong>
                <span>Certos</span>
            </div>
        </div>

        <div class="table-wrapper small-table">
            <table>
                <thead>
                    <tr>
                        <th>Min</th>
                        <th>Jogador</th>
                        <th>Destino</th>
                        <th>Time</th>
                        <th>Tipo</th>
                        <th>Tamanho</th>
                    </tr>
                </thead>
                <tbody>
                    ${data.passes.map(p => `
                        <tr>
                            <td>${p.minute}'</td>
                            <td>${p.player ?? "-"}</td>
                            <td>${p.pass_recipient ?? "-"}</td>
                            <td>${p.team}</td>
                            <td>${p.pass_height ?? "-"}</td>
                            <td>${Number(p.pass_length ?? 0).toFixed(1)}m</td>
                        </tr>
                    `).join("")}
                </tbody>
            </table>
        </div>
    `;
}

/* ============================
   INIT
============================ */

async function init() {
    try {
        await Promise.all([
            loadSummary(),
            loadArtilheiros(),
            loadRanking(),
            loadBrasilCampanha(),
            loadMatches(),
            populateTeamFilter(),
            populateAnalysisMatchSelect(),
        ]);
    } catch (err) {
        console.error("Erro ao carregar dashboard:", err);
    }

    const rankingOrder = document.getElementById("ranking-order");

    if (rankingOrder) {
        rankingOrder.addEventListener("change", (e) => {
            loadRanking(e.target.value);
        });
    }
}

init();