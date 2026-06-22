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
    const data = await fetchJSON(`${API}/ranking?order_by=${orderBy}&limit=10`);
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
            plugins: { legend: { display: false } },
            scales: {
                x: { ticks: { color: "#A8A29E" }, grid: { color: "rgba(255,255,255,0.05)" } },
                y: { ticks: { color: "#F5F5F5" }, grid: { display: false } },
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
            <td>${j.xg ? j.xg.toFixed(2) : "-"}</td>
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
    const teams = data.ranking.map(r => r.team).sort();
    select.innerHTML = `<option value="">Todas as seleções</option>` +
        teams.map(t => `<option value="${t}">${t}</option>`).join("");

    select.addEventListener("change", () => loadMatches(select.value));
}

async function init() {
    try {
        await Promise.all([
            loadSummary(),
            loadArtilheiros(),
            loadRanking(),
            loadBrasilCampanha(),
            loadMatches(),
            populateTeamFilter(),
        ]);
    } catch (err) {
        console.error("Erro ao carregar dashboard:", err);
    }

    document.getElementById("ranking-order").addEventListener("change", (e) => {
        loadRanking(e.target.value);
    });
}

init();
