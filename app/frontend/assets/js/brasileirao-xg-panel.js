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
            description: "Qualidade das chances criadas por cada clube.",
            valueKey: "xg_for",
        },
        xg_difference: {
            label: "Saldo de xG",
            description: "xG criado menos xG concedido.",
            valueKey: "xg_difference",
        },
        xg_against: {
            label: "Menor xG contra",
            description: "Clubes que concedem menos qualidade de chances aos adversarios.",
            valueKey: "xg_against",
            lowerIsBetter: true,
        },
        goals_minus_xg: {
            label: "Gols - xG",
            description: "Quanto o clube marcou acima ou abaixo do esperado.",
            valueKey: "goals_minus_xg",
        },
        xgot_for: {
            label: "xGOT",
            description: "Qualidade das finalizacoes que foram no alvo.",
            valueKey: "xgot_for",
        },
        shots_for: {
            label: "Finalizacoes",
            description: "Volume total de chutes registrados no SofaScore.",
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


    function resolveXgPanelTarget() {
        const candidates = [
            '[data-panel="rankings"]',
            '.brasileirao-page',
            '.br-page-shell',
            '.br-page-main',
            '.br-dashboard',
            '.page-shell',
            'main'
        ];

        for (const selector of candidates) {
            const element = qs(selector);

            if (element) {
                return element;
            }
        }

        return document.body;
    }

    function createPanel() {
        if (qs("#brasileiraoXgPanel")) return;

        const target = resolveXgPanelTarget();

        const panel = document.createElement("section");
        panel.id = "brasileiraoXgPanel";
        panel.className = "br-xg-section";
        panel.innerHTML = `
            <div class="br-xg-header">
                <span>SofaScore Shotmap</span>
                <h2>xG Brasileir&atilde;o 2026</h2>
                <p>
                    Camada de xG real do SofaScore integrada ao painel do Brasileir&atilde;o:
                    qualidade das chances, xG contra, xGOT, gols acima do esperado,
                    ranking de clubes, jogadores e partidas.
                </p>
            </div>

            <div class="br-xg-kpi-grid">
                <article class="br-xg-kpi">
                    <span>Finaliza&ccedil;&otilde;es analisadas</span>
                    <strong id="brXgTotalShots">--</strong>
                </article>

                <article class="br-xg-kpi">
                    <span>Partidas com xG</span>
                    <strong id="brXgTotalMatches">--</strong>
                </article>

                <article class="br-xg-kpi">
                    <span>L&iacute;der em xG</span>
                    <strong id="brXgLeaderTeam">--</strong>
                    <small id="brXgLeaderValue">--</small>
                </article>

                <article class="br-xg-kpi">
                    <span>Jogador l&iacute;der</span>
                    <strong id="brXgTopPlayer">--</strong>
                    <small id="brXgTopPlayerValue">--</small>
                </article>
            </div>

            <div class="br-xg-layout">
                <article class="br-xg-panel">
                    <div class="br-xg-panel-header">
                        <div>
                            <span>Clubes</span>
                            <h3>Ranking xG por equipe</h3>
                        </div>

                        <select id="brXgTeamMetric" class="br-xg-select">
                            <option value="xg_for">xG criado</option>
                            <option value="xg_difference">Saldo de xG</option>
                            <option value="xg_against">Menor xG contra</option>
                            <option value="goals_minus_xg">Gols - xG</option>
                            <option value="xgot_for">xGOT</option>
                            <option value="shots_for">Finaliza&ccedil;&otilde;es</option>
                        </select>
                    </div>

                    <p id="brXgMetricDescription" class="br-xg-description">
                        Qualidade das chances criadas por cada clube.
                    </p>

                    <div id="brXgTeamRanking" class="br-xg-bar-list"></div>
                </article>

                <article class="br-xg-panel">
                    <div class="br-xg-panel-header">
                        <div>
                            <span>Jogadores</span>
                            <h3>Ranking individual</h3>
                        </div>
                    </div>

                    <div class="br-xg-filter-grid">
                        <select id="brXgTeamFilter" class="br-xg-select">
                            <option value="">Todos os clubes</option>
                        </select>

                        <select id="brXgPlayerOrder" class="br-xg-select">
                            <option value="xg">xG</option>
                            <option value="xgot">xGOT</option>
                            <option value="goals_minus_xg">Gols - xG</option>
                            <option value="goals">Gols</option>
                            <option value="shots">Finaliza&ccedil;&otilde;es</option>
                            <option value="xg_per_shot">xG por chute</option>
                        </select>

                        <input id="brXgPlayerSearch" class="br-xg-input" type="search" placeholder="Buscar jogador">
                    </div>

                    <div id="brXgPlayerRanking" class="br-xg-player-list"></div>
                </article>
            </div>

            <article class="br-xg-panel br-xg-matches-panel">
                <div class="br-xg-panel-header">
                    <div>
                        <span>Partidas</span>
                        <h3>Jogos com maior volume de xG</h3>
                    </div>

                    <span id="brXgBestFinisher" class="br-xg-chip">--</span>
                </div>

                <div class="br-xg-table-wrap">
                    <table class="br-xg-table">
                        <thead>
                            <tr>
                                <th>Partida</th>
                                <th>Placar</th>
                                <th>xG mandante</th>
                                <th>xG visitante</th>
                                <th>xG total</th>
                                <th>Finaliza&ccedil;&otilde;es</th>
                            </tr>
                        </thead>
                        <tbody id="brXgMatchesBody"></tbody>
                    </table>
                </div>
            </article>
        `;

        target.classList.add("br-xg-mounted-target");
        target.appendChild(panel);
    }

    function buildPlayerUrl() {
        const params = new URLSearchParams({
            order_by: state.playerOrder,
            limit: "80",
        });

        if (state.selectedTeam) params.set("team", state.selectedTeam);
        if (state.playerSearch) params.set("search", state.playerSearch);

        return `/api/brasileirao/xg/players?${params.toString()}`;
    }

    function buildMatchesUrl() {
        const params = new URLSearchParams({
            order_by: "total_xg",
            limit: "80",
        });

        if (state.selectedTeam) params.set("team", state.selectedTeam);

        return `/api/brasileirao/xg/matches?${params.toString()}`;
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
        if (!summary) return;

        qs("#brXgTotalShots").textContent = fmtInt(summary.total_shots);
        qs("#brXgTotalMatches").textContent = fmtInt(summary.total_matches);

        qs("#brXgLeaderTeam").textContent = summary.leader_xg?.team || "--";
        qs("#brXgLeaderValue").textContent = summary.leader_xg
            ? `${fmt(summary.leader_xg.xg_for)} xG | ${summary.leader_xg.goals_for} gols`
            : "--";

        qs("#brXgTopPlayer").textContent = summary.top_player_xg?.player || "--";
        qs("#brXgTopPlayerValue").textContent = summary.top_player_xg
            ? `${summary.top_player_xg.team} | ${fmt(summary.top_player_xg.xg)} xG`
            : "--";

        qs("#brXgBestFinisher").textContent = summary.best_finisher
            ? `Melhor finalizador: ${summary.best_finisher.player} (${fmt(summary.best_finisher.goals_minus_xg)} G-xG)`
            : "--";
    }

    function populateTeamFilter() {
        const select = qs("#brXgTeamFilter");
        if (!select) return;

        const teams = [...state.teams]
            .map((row) => row.team)
            .filter(Boolean)
            .sort((a, b) => a.localeCompare(b));

        select.innerHTML = [
            '<option value="">Todos os clubes</option>',
            ...teams.map((team) => `<option value="${team}">${team}</option>`),
        ].join("");
    }

    function renderTeamRanking() {
        const body = qs("#brXgTeamRanking");
        const description = qs("#brXgMetricDescription");
        if (!body) return;

        const metric = metricInfo[state.teamMetric] || metricInfo.xg_for;
        description.textContent = metric.description;

        let rows = [...state.teams];

        rows.sort((a, b) => {
            const valueA = Number(a[metric.valueKey] || 0);
            const valueB = Number(b[metric.valueKey] || 0);
            return metric.lowerIsBetter ? valueA - valueB : valueB - valueA;
        });

        rows = rows.slice(0, 12);

        const maxValue = Math.max(
            ...rows.map((row) => Math.abs(Number(row[metric.valueKey] || 0))),
            1
        );

        body.innerHTML = rows.map((row, index) => {
            const value = Number(row[metric.valueKey] || 0);
            const width = Math.max((Math.abs(value) / maxValue) * 100, 4);
            const active = row.team === state.selectedTeam ? " is-active" : "";

            return `
                <div class="br-xg-bar-row${active}">
                    <div class="br-xg-rank">${index + 1}</div>

                    <div class="br-xg-bar-main">
                        <div class="br-xg-bar-info">
                            <strong>${row.team}</strong>
                            <span>${fmt(value)}</span>
                        </div>

                        <div class="br-xg-bar-track">
                            <div class="br-xg-bar-fill" style="width: ${width}%"></div>
                        </div>

                        <small>${row.goals_for} gols | ${fmt(row.xg_for)} xG criado | ${fmt(row.xg_against)} xG contra</small>
                    </div>
                </div>
            `;
        }).join("");
    }

    function renderPlayers() {
        const body = qs("#brXgPlayerRanking");
        if (!body) return;

        if (!state.players.length) {
            body.innerHTML = '<div class="br-xg-empty">Nenhum jogador encontrado.</div>';
            return;
        }

        body.innerHTML = state.players.slice(0, 14).map((row, index) => `
            <div class="br-xg-player-row">
                <div class="br-xg-rank">${index + 1}</div>

                <div class="br-xg-player-info">
                    <strong>${row.player}</strong>
                    <span>${row.team}</span>
                </div>

                <div class="br-xg-player-metric">
                    <strong>${fmt(row.xg)}</strong>
                    <span>xG</span>
                </div>

                <div class="br-xg-player-metric">
                    <strong>${fmt(row.xgot)}</strong>
                    <span>xGOT</span>
                </div>

                <div class="br-xg-player-metric">
                    <strong>${fmt(row.goals_minus_xg)}</strong>
                    <span>G-xG</span>
                </div>
            </div>
        `).join("");
    }

    function renderMatches() {
        const body = qs("#brXgMatchesBody");
        if (!body) return;

        const rows = [...state.matches].slice(0, 12);

        body.innerHTML = rows.map((row) => {
            const totalShots = Number(row.home_shots || 0) + Number(row.away_shots || 0);

            return `
                <tr>
                    <td><strong>${row.home_team}</strong> x <strong>${row.away_team}</strong></td>
                    <td>${row.home_score} - ${row.away_score}</td>
                    <td>${fmt(row.home_xg)}</td>
                    <td>${fmt(row.away_xg)}</td>
                    <td><strong>${fmt(row.total_xg)}</strong></td>
                    <td>${fmtInt(totalShots)}</td>
                </tr>
            `;
        }).join("");
    }

    function setupEvents() {
        qs("#brXgTeamMetric")?.addEventListener("change", (event) => {
            state.teamMetric = event.target.value;
            renderTeamRanking();
        });

        qs("#brXgTeamFilter")?.addEventListener("change", async (event) => {
            state.selectedTeam = event.target.value;
            renderTeamRanking();
            await loadPlayersAndMatches();
            fitXgPanelToContentArea();
        });

        qs("#brXgPlayerOrder")?.addEventListener("change", async (event) => {
            state.playerOrder = event.target.value;
            await loadPlayersAndMatches();
            fitXgPanelToContentArea();
        });

        qs("#brXgPlayerSearch")?.addEventListener("input", async (event) => {
            state.playerSearch = event.target.value.trim();
            await loadPlayersAndMatches();
            fitXgPanelToContentArea();
        });
    }


    function fitXgPanelToContentArea() {
        const panel = qs("#brasileiraoXgPanel");

        if (!panel) {
            return;
        }

        const sidebar =
            document.querySelector("aside") ||
            document.querySelector(".sidebar") ||
            document.querySelector(".app-sidebar") ||
            document.querySelector(".hub-sidebar");

        panel.style.position = "relative";
        panel.style.left = "auto";
        panel.style.right = "auto";
        panel.style.transform = "none";
        panel.style.boxSizing = "border-box";

        if (!sidebar || window.innerWidth < 900) {
            panel.style.marginLeft = "0";
            panel.style.width = "100%";
            panel.style.maxWidth = "100%";
            return;
        }

        const sidebarRect = sidebar.getBoundingClientRect();
        const panelRect = panel.getBoundingClientRect();

        const sidebarRight = Math.ceil(sidebarRect.right);
        const panelLeft = Math.ceil(panelRect.left);

        const isBehindSidebar = panelLeft < sidebarRight - 12;
        const isOverflowingRight = panelRect.right > window.innerWidth + 12;

        if (!isBehindSidebar && !isOverflowingRight) {
            panel.style.marginLeft = "0";
            panel.style.width = "100%";
            panel.style.maxWidth = "100%";
            return;
        }

        const safeLeft = isBehindSidebar ? sidebarRight + 20 : panelLeft;
        const safeWidth = Math.max(window.innerWidth - safeLeft - 24, 420);

        panel.style.marginLeft = isBehindSidebar ? `${sidebarRight + 20}px` : "0";
        panel.style.width = `${safeWidth}px`;
        panel.style.maxWidth = `${safeWidth}px`;
    }

    async function init() {
        createPanel();
        fitXgPanelToContentArea();

        try {
            const [summary, teams] = await Promise.all([
                fetchJson("/api/brasileirao/xg/summary"),
                fetchJson("/api/brasileirao/xg/teams?order_by=xg_for&limit=20"),
            ]);

            state.summary = summary;
            state.teams = teams.teams || [];

            renderSummary();
            populateTeamFilter();
            setupEvents();
            renderTeamRanking();

            await loadPlayersAndMatches();
            fitXgPanelToContentArea();
        } catch (error) {
            console.error(error);

            const panel = qs("#brasileiraoXgPanel");
            if (panel) {
                panel.innerHTML = `
                    <div class="br-xg-empty">
                        Erro ao carregar xG do Brasileir&atilde;o. Confirme se /api/brasileirao/xg/summary est&aacute; funcionando.
                    </div>
                `;
            }
        }
    }

    window.addEventListener("resize", fitXgPanelToContentArea);
    document.addEventListener("DOMContentLoaded", init);
})();