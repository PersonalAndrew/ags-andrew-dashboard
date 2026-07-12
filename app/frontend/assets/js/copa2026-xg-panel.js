(function () {
    const state = {
        summary: null,
        teams: [],
        players: [],
        matches: [],
        selectedTeam: "",
        teamMetric: "xg_for",
        playerOrder: "xg",
        playerSearch: "",
    };

    const metricInfo = {
        xg_for: {
            label: "xG criado",
            description: "Qualidade das chances criadas por cada selecao.",
            valueKey: "xg_for",
        },
        xg_difference: {
            label: "Saldo de xG",
            description: "xG criado menos xG concedido. Indica dominio territorial e qualidade das chances.",
            valueKey: "xg_difference",
        },
        xg_against: {
            label: "Menor xG contra",
            description: "Selecoes que concederam menos qualidade de chances aos adversarios.",
            valueKey: "xg_against",
            lowerIsBetter: true,
        },
        goals_minus_xg: {
            label: "Gols - xG",
            description: "Quanto a equipe marcou acima ou abaixo da qualidade esperada das chances.",
            valueKey: "goals_minus_xg",
        },
        xgot_for: {
            label: "xGOT",
            description: "Qualidade das finalizacoes que foram no alvo.",
            valueKey: "xgot_for",
        },
        shots_for: {
            label: "Finalizacoes",
            description: "Volume total de chutes registrados no shotmap.",
            valueKey: "shots_for",
        },
    };

    function qs(selector) {
        return document.querySelector(selector);
    }

    function fmt(value, digits = 2) {
        return new Intl.NumberFormat("pt-BR", {
            minimumFractionDigits: digits,
            maximumFractionDigits: digits,
        }).format(Number(value || 0));
    }

    function fmtInt(value) {
        return new Intl.NumberFormat("pt-BR").format(Number(value || 0));
    }

    async function fetchJson(url) {
        const response = await fetch(url);

        if (!response.ok) {
            throw new Error(`Erro ao carregar ${url}`);
        }

        return response.json();
    }

    function buildPlayerUrl() {
        const params = new URLSearchParams({
            order_by: state.playerOrder,
            limit: "80",
        });

        if (state.selectedTeam) {
            params.set("team", state.selectedTeam);
        }

        if (state.playerSearch) {
            params.set("search", state.playerSearch);
        }

        return `/api/sofascore/xg/players?${params.toString()}`;
    }

    function buildMatchesUrl() {
        const params = new URLSearchParams({
            limit: "90",
        });

        if (state.selectedTeam) {
            params.set("team", state.selectedTeam);
        }

        return `/api/sofascore/xg/matches?${params.toString()}`;
    }

    async function loadPlayersAndMatches() {
        const [players, matches] = await Promise.all([
            fetchJson(buildPlayerUrl()),
            fetchJson(buildMatchesUrl()),
        ]);

        state.players = players.players || [];
        state.matches = matches.matches || [];

        renderPlayers();
        renderMatches();
    }

    function renderSummary() {
        const summary = state.summary;

        if (!summary) {
            return;
        }

        qs("#xg2026TotalShots").textContent = fmtInt(summary.total_shots);
        qs("#xg2026TotalMatches").textContent = fmtInt(summary.total_matches);

        qs("#xg2026LeaderTeam").textContent = summary.leader_xg?.team || "--";
        qs("#xg2026LeaderValue").textContent = summary.leader_xg
            ? `${fmt(summary.leader_xg.xg_for)} xG | ${summary.leader_xg.goals_for} gols`
            : "--";

        qs("#xg2026TopPlayer").textContent = summary.top_player_xg?.player || "--";
        qs("#xg2026TopPlayerValue").textContent = summary.top_player_xg
            ? `${summary.top_player_xg.team} | ${fmt(summary.top_player_xg.xg)} xG`
            : "--";

        qs("#xg2026BestFinisher").textContent = summary.best_finisher
            ? `Melhor finalizador: ${summary.best_finisher.player} (${fmt(summary.best_finisher.goals_minus_xg)} G-xG)`
            : "--";
    }

    function populateTeamFilter() {
        const select = qs("#xg2026TeamFilter");

        if (!select) {
            return;
        }

        const teams = [...state.teams]
            .map((row) => row.team)
            .filter(Boolean)
            .sort((a, b) => a.localeCompare(b));

        select.innerHTML = [
            '<option value="">Todas as selecoes</option>',
            ...teams.map((team) => `<option value="${team}">${team}</option>`),
        ].join("");
    }

    function renderTeamRanking() {
        const body = qs("#xg2026TeamRanking");
        const description = qs("#xg2026TeamMetricDescription");

        if (!body) {
            return;
        }

        const metric = metricInfo[state.teamMetric] || metricInfo.xg_for;
        description.textContent = metric.description;

        let rows = [...state.teams];

        rows.sort((a, b) => {
            const valueA = Number(a[metric.valueKey] || 0);
            const valueB = Number(b[metric.valueKey] || 0);

            return metric.lowerIsBetter ? valueA - valueB : valueB - valueA;
        });

        rows = rows.slice(0, 12);

        const maxValue = Math.max(...rows.map((row) => Math.abs(Number(row[metric.valueKey] || 0))), 1);

        body.innerHTML = rows.map((row, index) => {
            const value = Number(row[metric.valueKey] || 0);
            const width = Math.max((Math.abs(value) / maxValue) * 100, 4);
            const selected = row.team === state.selectedTeam ? " is-active" : "";

            return `
                <div class="xg2026-bar-row${selected}">
                    <div class="xg2026-rank">${index + 1}</div>

                    <div class="xg2026-bar-main">
                        <div class="xg2026-bar-info">
                            <strong>${row.team}</strong>
                            <span>${fmt(value)}</span>
                        </div>

                        <div class="xg2026-bar-track">
                            <div class="xg2026-bar-fill" style="width: ${width}%"></div>
                        </div>

                        <small>${row.goals_for} gols | ${fmt(row.xg_for)} xG criado | ${fmt(row.xg_against)} xG contra</small>
                    </div>
                </div>
            `;
        }).join("");
    }

    function renderPlayers() {
        const body = qs("#xg2026PlayerRanking");

        if (!body) {
            return;
        }

        if (!state.players.length) {
            body.innerHTML = '<div class="xg2026-empty">Nenhum jogador encontrado.</div>';
            return;
        }

        body.innerHTML = state.players.slice(0, 14).map((row, index) => `
            <div class="xg2026-player-row">
                <div class="xg2026-rank">${index + 1}</div>

                <div class="xg2026-player-info">
                    <strong>${row.player}</strong>
                    <span>${row.team}</span>
                </div>

                <div class="xg2026-player-metrics">
                    <strong>${fmt(row.xg)}</strong>
                    <span>xG</span>
                </div>

                <div class="xg2026-player-metrics">
                    <strong>${fmt(row.xgot)}</strong>
                    <span>xGOT</span>
                </div>

                <div class="xg2026-player-metrics">
                    <strong>${fmt(row.goals_minus_xg)}</strong>
                    <span>G-xG</span>
                </div>
            </div>
        `).join("");
    }

    function renderMatches() {
        const body = qs("#xg2026MatchesBody");

        if (!body) {
            return;
        }

        const rows = [...state.matches]
            .map((row) => ({
                ...row,
                total_xg: Number(row.home_xg || 0) + Number(row.away_xg || 0),
                total_shots: Number(row.home_shots || 0) + Number(row.away_shots || 0),
            }))
            .sort((a, b) => b.total_xg - a.total_xg)
            .slice(0, 12);

        body.innerHTML = rows.map((row) => `
            <tr>
                <td><strong>${row.home_team}</strong> x <strong>${row.away_team}</strong></td>
                <td>${row.home_score} - ${row.away_score}</td>
                <td>${fmt(row.home_xg)}</td>
                <td>${fmt(row.away_xg)}</td>
                <td><strong>${fmt(row.total_xg)}</strong></td>
                <td>${fmtInt(row.total_shots)}</td>
            </tr>
        `).join("");
    }

    function setupEvents() {
        const teamMetric = qs("#xg2026TeamMetric");
        const teamFilter = qs("#xg2026TeamFilter");
        const playerOrder = qs("#xg2026PlayerOrder");
        const playerSearch = qs("#xg2026PlayerSearch");

        teamMetric?.addEventListener("change", (event) => {
            state.teamMetric = event.target.value;
            renderTeamRanking();
        });

        teamFilter?.addEventListener("change", async (event) => {
            state.selectedTeam = event.target.value;
            renderTeamRanking();
            await loadPlayersAndMatches();
        });

        playerOrder?.addEventListener("change", async (event) => {
            state.playerOrder = event.target.value;
            await loadPlayersAndMatches();
        });

        playerSearch?.addEventListener("input", async (event) => {
            state.playerSearch = event.target.value.trim();
            await loadPlayersAndMatches();
        });
    }

    async function initXgPanel() {
        const panel = qs("#copa2026XgPanel");

        if (!panel) {
            return;
        }

        try {
            const [summary, teams] = await Promise.all([
                fetchJson("/api/sofascore/xg/summary"),
                fetchJson("/api/sofascore/xg/teams?order_by=xg_for&limit=48"),
            ]);

            state.summary = summary;
            state.teams = teams.teams || [];

            renderSummary();
            populateTeamFilter();
            setupEvents();
            renderTeamRanking();

            await loadPlayersAndMatches();
        } catch (error) {
            console.error(error);
            panel.innerHTML = `
                <div class="xg2026-error">
                    Erro ao carregar o painel xG. Confirme se a API /api/sofascore/xg/summary esta funcionando.
                </div>
            `;
        }
    }

    document.addEventListener("DOMContentLoaded", initXgPanel);
})();