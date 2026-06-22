const API = "/api/statsbomb";

async function fetchJSON(url) {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Erro ${res.status} em ${url}`);
    return res.json();
}

function escapeHTML(value) {
    if (value === null || value === undefined) return "-";
    return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}

/* ============================
   FORMATAÇÕES PT-BR
============================ */

function formatDateBR(dateValue) {
    if (!dateValue) return "-";

    const date = new Date(`${dateValue}T00:00:00`);

    if (Number.isNaN(date.getTime())) {
        return escapeHTML(dateValue);
    }

    return date.toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "short",
        year: "numeric"
    }).replaceAll(".", "");
}

function translateStage(stage) {
    const stages = {
        "Group Stage": "Fase de grupos",
        "Round of 16": "Oitavas de final",
        "Quarter-finals": "Quartas de final",
        "Semi-finals": "Semifinal",
        "3rd Place Final": "Disputa do 3º lugar",
        "Final": "Final"
    };

    return stages[stage] || stage || "-";
}

function translateTeamName(team) {
    const teams = {
        "Argentina": "Argentina",
        "Australia": "Austrália",
        "Belgium": "Bélgica",
        "Brazil": "Brasil",
        "Cameroon": "Camarões",
        "Canada": "Canadá",
        "Costa Rica": "Costa Rica",
        "Croatia": "Croácia",
        "Denmark": "Dinamarca",
        "Ecuador": "Equador",
        "England": "Inglaterra",
        "France": "França",
        "Germany": "Alemanha",
        "Ghana": "Gana",
        "Iran": "Irã",
        "Japan": "Japão",
        "Korea Republic": "Coreia do Sul",
        "Mexico": "México",
        "Morocco": "Marrocos",
        "Netherlands": "Holanda",
        "Poland": "Polônia",
        "Portugal": "Portugal",
        "Qatar": "Catar",
        "Saudi Arabia": "Arábia Saudita",
        "Senegal": "Senegal",
        "Serbia": "Sérvia",
        "Spain": "Espanha",
        "Switzerland": "Suíça",
        "Tunisia": "Tunísia",
        "United States": "Estados Unidos",
        "Uruguay": "Uruguai",
        "Wales": "País de Gales"
    };

    return teams[team] || team || "-";
}

function translateShotOutcome(outcome) {
    const outcomes = {
        "Goal": "Gol",
        "Saved": "Defendido",
        "Saved Off T": "Defendido para fora",
        "Saved to Post": "Defendido na trave",
        "Off T": "Para fora",
        "Blocked": "Bloqueado",
        "Post": "Na trave",
        "Wayward": "Muito fora"
    };

    return outcomes[outcome] || outcome || "-";
}

function translateBodyPart(bodyPart) {
    const parts = {
        "Right Foot": "Pé direito",
        "Left Foot": "Pé esquerdo",
        "Head": "Cabeça",
        "Other": "Outro"
    };

    return parts[bodyPart] || bodyPart || "-";
}

function translatePassResult(result) {
    const results = {
        "Complete": "Certo",
        "Incomplete": "Errado",
        "Out": "Para fora",
        "Pass Offside": "Impedimento",
        "Unknown": "Desconhecido"
    };

    return results[result] || result || "-";
}

function translatePassHeight(height) {
    const heights = {
        "Ground Pass": "Rasteiro",
        "Low Pass": "Baixo",
        "High Pass": "Alto"
    };

    return heights[height] || height || "-";
}

function translatePosition(position) {
    if (!position) return "-";

    const raw = String(position).trim();
    const pos = raw.toLowerCase();

    if (pos.includes("goalkeeper")) {
        return "Goleiro";
    }

    if (pos.includes("left wing back")) {
        return "Ala esquerdo";
    }

    if (pos.includes("right wing back")) {
        return "Ala direito";
    }

    if (pos.includes("left back")) {
        return "Lateral esquerdo";
    }

    if (pos.includes("right back")) {
        return "Lateral direito";
    }

    if (
        pos.includes("left center back") ||
        pos.includes("left centre back")
    ) {
        return "Zagueiro esquerdo";
    }

    if (
        pos.includes("right center back") ||
        pos.includes("right centre back")
    ) {
        return "Zagueiro direito";
    }

    if (
        pos.includes("center back") ||
        pos.includes("centre back")
    ) {
        return "Zagueiro central";
    }

    if (
        pos.includes("left center forward") ||
        pos.includes("left centre forward")
    ) {
        return "Atacante esquerdo";
    }

    if (
        pos.includes("right center forward") ||
        pos.includes("right centre forward")
    ) {
        return "Atacante direito";
    }

    if (
        pos.includes("center forward") ||
        pos.includes("centre forward")
    ) {
        return "Centroavante";
    }

    if (pos.includes("striker")) {
        return "Atacante";
    }

    if (pos.includes("left wing")) {
        return "Ponta esquerda";
    }

    if (pos.includes("right wing")) {
        return "Ponta direita";
    }

    if (pos.includes("left attacking midfield")) {
        return "Meia ofensivo esquerdo";
    }

    if (pos.includes("right attacking midfield")) {
        return "Meia ofensivo direito";
    }

    if (pos.includes("attacking midfield")) {
        return "Meia ofensivo";
    }

    if (pos.includes("left defensive midfield")) {
        return "Volante esquerdo";
    }

    if (pos.includes("right defensive midfield")) {
        return "Volante direito";
    }

    if (pos.includes("defensive midfield")) {
        return "Volante";
    }

    if (
        pos.includes("left center midfield") ||
        pos.includes("left centre midfield")
    ) {
        return "Meia esquerdo";
    }

    if (
        pos.includes("right center midfield") ||
        pos.includes("right centre midfield")
    ) {
        return "Meia direito";
    }

    if (
        pos.includes("center midfield") ||
        pos.includes("centre midfield")
    ) {
        return "Meio-campista";
    }

    if (pos.includes("left midfield")) {
        return "Meio-campista esquerdo";
    }

    if (pos.includes("right midfield")) {
        return "Meio-campista direito";
    }

    if (pos.includes("midfield")) {
        return "Meio-campista";
    }

    if (pos.includes("forward")) {
        return "Atacante";
    }

    return raw;
}

function renderTeamPill(team) {
    return `<span class="team-pill">${escapeHTML(translateTeamName(team))}</span>`;
}

function formatScoreWithPenalties(match) {
    if (!match) return "-";

    const home = Number(match.home_score ?? 0);
    const away = Number(match.away_score ?? 0);

    const homeTeam = match.home_team || "";
    const awayTeam = match.away_team || "";
    const stage = match.competition_stage || "";

    const isArgentinaFranceFinal =
        stage === "Final" &&
        (
            (homeTeam === "Argentina" && awayTeam === "France") ||
            (homeTeam === "France" && awayTeam === "Argentina")
        );

    if (isArgentinaFranceFinal && home === 3 && away === 3) {
        return `
            <div class="score-stack">
                <div class="score-main">3 – 3</div>
                <div class="penalty-score">Pênaltis: Argentina 4 – 2 França</div>
            </div>
        `;
    }

    const isMoroccoSpain =
        stage === "Round of 16" &&
        (
            (homeTeam === "Morocco" && awayTeam === "Spain") ||
            (homeTeam === "Spain" && awayTeam === "Morocco")
        );

    if (isMoroccoSpain && home === 0 && away === 0) {
        return `
            <div class="score-stack">
                <div class="score-main">0 – 0</div>
                <div class="penalty-score">Pênaltis: Marrocos 3 – 0 Espanha</div>
            </div>
        `;
    }

    return `
        <div class="score-stack">
            <div class="score-main">${home} – ${away}</div>
        </div>
    `;
}

/* ============================
   CAMPO SVG
============================ */

function createPitchSvg(content = "") {
    return `
        <div class="pitch-visual">
            <svg viewBox="0 0 120 80" role="img" aria-label="Campo de futebol">
                <defs>
                    <marker id="arrow-complete" markerWidth="4" markerHeight="4" refX="3" refY="2" orient="auto">
                        <path d="M0,0 L4,2 L0,4 Z" fill="rgba(212, 175, 55, 0.75)"></path>
                    </marker>

                    <marker id="arrow-incomplete" markerWidth="4" markerHeight="4" refX="3" refY="2" orient="auto">
                        <path d="M0,0 L4,2 L0,4 Z" fill="rgba(255, 95, 95, 0.75)"></path>
                    </marker>
                </defs>

                <rect class="pitch-bg" x="0" y="0" width="120" height="80" rx="2"></rect>

                <line class="pitch-line" x1="60" y1="0" x2="60" y2="80"></line>
                <circle class="pitch-line" cx="60" cy="40" r="9.15"></circle>
                <circle class="pitch-line" cx="60" cy="40" r="0.8"></circle>

                <rect class="pitch-line" x="0" y="18" width="18" height="44"></rect>
                <rect class="pitch-line" x="0" y="30" width="6" height="20"></rect>
                <circle class="pitch-line" cx="12" cy="40" r="0.8"></circle>

                <rect class="pitch-line" x="102" y="18" width="18" height="44"></rect>
                <rect class="pitch-line" x="114" y="30" width="6" height="20"></rect>
                <circle class="pitch-line" cx="108" cy="40" r="0.8"></circle>

                <path class="pitch-line" d="M18 30 A9.15 9.15 0 0 1 18 50"></path>
                <path class="pitch-line" d="M102 30 A9.15 9.15 0 0 0 102 50"></path>

                ${content}
            </svg>
        </div>
    `;
}

function getStarPoints(cx, cy, outerRadius, innerRadius) {
    const points = [];
    const spikes = 5;
    let rotation = -Math.PI / 2;

    for (let i = 0; i < spikes * 2; i++) {
        const radius = i % 2 === 0 ? outerRadius : innerRadius;
        const x = cx + Math.cos(rotation) * radius;
        const y = cy + Math.sin(rotation) * radius;
        points.push(`${x.toFixed(2)},${y.toFixed(2)}`);
        rotation += Math.PI / spikes;
    }

    return points.join(" ");
}

/* ============================
   NOMES
============================ */

function getShortName(fullName) {
    if (!fullName) return "-";

    const parts = String(fullName).trim().split(" ").filter(Boolean);

    if (parts.length === 1) return parts[0];
    if (parts.length === 2) return `${parts[0]} ${parts[1]}`;

    return `${parts[0]} ${parts[parts.length - 1]}`;
}

function getBubbleName(fullName) {
    if (!fullName) return "-";

    const parts = String(fullName).trim().split(" ").filter(Boolean);

    if (parts.length === 1) {
        return parts[0].slice(0, 8);
    }

    const lastName = parts[parts.length - 1];

    if (lastName.length <= 8) {
        return lastName;
    }

    return lastName.slice(0, 8) + ".";
}

/* ============================
   CHUTES
============================ */

function isShotOnTarget(outcome) {
    return [
        "Goal",
        "Saved",
        "Saved Off T",
        "Saved to Post"
    ].includes(outcome);
}

function renderShotmap(shots) {
    if (!shots || !shots.length) return "";

    const points = shots.map(s => {
        const x = Number(s.location_x);
        const y = Number(s.location_y);
        const xg = Number(s.shot_xg || 0);
        const r = Math.max(1.5, Math.min(5.8, 1.7 + xg * 9));
        const outcome = s.shot_outcome || "Unknown";

        if (outcome === "Goal") {
            return `
                <polygon
                    class="pitch-star goal"
                    points="${getStarPoints(x, y, r + 1.4, Math.max(1.2, r * 0.45))}"
                >
                    <title>${escapeHTML(s.player)} | ${escapeHTML(translateTeamName(s.team))} | Gol | xG ${xg.toFixed(2)}</title>
                </polygon>
            `;
        }

        const cls = isShotOnTarget(outcome) ? "on-target" : "off-target";

        return `
            <circle
                class="pitch-shot ${cls}"
                cx="${x}"
                cy="${y}"
                r="${r}"
            >
                <title>${escapeHTML(s.player)} | ${escapeHTML(translateTeamName(s.team))} | ${escapeHTML(translateShotOutcome(outcome))} | xG ${xg.toFixed(2)}</title>
            </circle>
        `;
    }).join("");

    return `
        ${createPitchSvg(points)}

        <div class="pitch-legend">
            <span><i class="pitch-dot gold"></i> Gol</span>
            <span><i class="pitch-dot white"></i> No alvo</span>
            <span><i class="pitch-dot red"></i> Para fora / bloqueado</span>
            <span>Tamanho = xG</span>
        </div>
    `;
}

/* ============================
   PASSES
============================ */

function classifyPass(p) {
    const length = Number(p.pass_length || 0);
    const height = p.pass_height || "";
    const isIncomplete = !!p.pass_outcome;

    if (isIncomplete) return "incomplete";
    if (length >= 30 || height === "High Pass") return "long";
    if (length <= 15) return "short";

    return "medium";
}

function filterPassesForMap(passes, mode = "all") {
    if (mode === "short") return passes.filter(p => classifyPass(p) === "short");
    if (mode === "medium") return passes.filter(p => classifyPass(p) === "medium");
    if (mode === "long") return passes.filter(p => classifyPass(p) === "long");
    if (mode === "incomplete") return passes.filter(p => classifyPass(p) === "incomplete");

    return passes;
}

function renderPassmap(passes, mode = "all") {
    if (!passes || !passes.length) return "";

    const filtered = filterPassesForMap(passes, mode);
    const visualPasses = filtered.slice(0, 450);

    const modeLabels = {
        all: "Todos",
        short: "Passes curtos",
        medium: "Passes médios",
        long: "Lançamentos",
        incomplete: "Passes errados"
    };

    const lines = visualPasses.map(p => {
        const x1 = Number(p.location_x);
        const y1 = Number(p.location_y);
        const x2 = Number(p.pass_end_x);
        const y2 = Number(p.pass_end_y);

        const passType = classifyPass(p);
        const completed = !p.pass_outcome;
        const cls = completed ? "complete" : "incomplete";
        const marker = completed ? "url(#arrow-complete)" : "url(#arrow-incomplete)";

        return `
            <line
                class="pitch-pass ${cls}"
                x1="${x1}"
                y1="${y1}"
                x2="${x2}"
                y2="${y2}"
                marker-end="${marker}"
            >
                <title>${escapeHTML(p.player)} para ${escapeHTML(p.pass_recipient)} | ${modeLabels[passType] || passType} | ${completed ? "Certo" : escapeHTML(translatePassResult(p.pass_outcome))}</title>
            </line>
        `;
    }).join("");

    const nodes = visualPasses.map(p => `
        <circle
            class="pitch-node"
            cx="${Number(p.location_x)}"
            cy="${Number(p.location_y)}"
            r="0.8"
        ></circle>
    `).join("");

    return `
        <div class="pass-filter-row">
            <button class="pass-filter-btn ${mode === "all" ? "active" : ""}" data-pass-mode="all">Todos</button>
            <button class="pass-filter-btn ${mode === "short" ? "active" : ""}" data-pass-mode="short">Curtos</button>
            <button class="pass-filter-btn ${mode === "medium" ? "active" : ""}" data-pass-mode="medium">Médios</button>
            <button class="pass-filter-btn ${mode === "long" ? "active" : ""}" data-pass-mode="long">Lançamentos</button>
            <button class="pass-filter-btn ${mode === "incomplete" ? "active" : ""}" data-pass-mode="incomplete">Errados</button>
        </div>

        ${createPitchSvg(lines + nodes)}

        <div class="pitch-legend">
            <span><i class="pitch-dot gold"></i> Passe certo</span>
            <span><i class="pitch-dot red"></i> Passe errado</span>
            <span>${modeLabels[mode]}: ${filtered.length} passes encontrados</span>
            <span>Mostrando até 450 no campo</span>
        </div>
    `;
}

/* ============================
   MAPA DE CALOR
============================ */

function buildHeatmapZones(points) {
    const cols = 6;
    const rows = 5;

    const zoneWidth = 120 / cols;
    const zoneHeight = 80 / rows;

    const zones = [];

    for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
            zones.push({
                row,
                col,
                x: col * zoneWidth,
                y: row * zoneHeight,
                width: zoneWidth,
                height: zoneHeight,
                count: 0,
                percentage: 0
            });
        }
    }

    points.forEach(p => {
        const x = Number(p.location_x);
        const y = Number(p.location_y);

        if (Number.isNaN(x) || Number.isNaN(y)) return;

        const col = Math.min(cols - 1, Math.max(0, Math.floor(x / zoneWidth)));
        const row = Math.min(rows - 1, Math.max(0, Math.floor(y / zoneHeight)));

        const index = row * cols + col;

        if (zones[index]) {
            zones[index].count += 1;
        }
    });

    const total = points.length || 1;

    zones.forEach(zone => {
        zone.percentage = (zone.count / total) * 100;
    });

    return zones;
}

function getHeatmapZoneClass(percentage, maxPercentage) {
    if (percentage <= 0) return "heat-zone-0";

    const intensity = percentage / Math.max(maxPercentage, 1);

    if (intensity >= 0.80) return "heat-zone-5";
    if (intensity >= 0.60) return "heat-zone-4";
    if (intensity >= 0.40) return "heat-zone-3";
    if (intensity >= 0.20) return "heat-zone-2";

    return "heat-zone-1";
}

function formatHeatmapPercentage(value) {
    if (value < 0.5 && value > 0) return "<1%";
    return `${Math.round(value)}%`;
}

function renderHeatmap(points) {
    if (!points || !points.length) {
        return `<div class="loading">Nenhuma ação encontrada para gerar o mapa de calor</div>`;
    }

    const zones = buildHeatmapZones(points);
    const maxPercentage = Math.max(...zones.map(z => z.percentage), 1);

    const zoneRects = zones.map(zone => {
        const zoneClass = getHeatmapZoneClass(zone.percentage, maxPercentage);
        const label = formatHeatmapPercentage(zone.percentage);

        return `
            <g class="heatmap-zone-group">
                <rect
                    class="heatmap-zone ${zoneClass}"
                    x="${zone.x}"
                    y="${zone.y}"
                    width="${zone.width}"
                    height="${zone.height}"
                >
                    <title>${zone.count} ações | ${label} das ações nesta zona</title>
                </rect>

                <text
                    class="heatmap-zone-label"
                    x="${zone.x + zone.width / 2}"
                    y="${zone.y + zone.height / 2}"
                >${label}</text>
            </g>
        `;
    }).join("");

    return `
        <div class="heatmap-wrapper heatmap-percentage">
            ${createPitchSvg(zoneRects)}
        </div>

        <div class="pitch-legend">
            <span><i class="pitch-dot gold"></i> Quanto mais claro, maior concentração</span>
            <span>Valores mostram o percentual de ações em cada zona</span>
        </div>
    `;
}

/* ============================
   POSIÇÃO MÉDIA
============================ */

function getAverageRadius(events, maxEvents) {
    const safeMax = Math.max(maxEvents, 1);
    return Math.max(4.8, Math.min(7.8, 4.8 + (events / safeMax) * 3));
}

function renderAveragePositionMap(players, teamName = "") {
    if (!players || !players.length) return "";

    const sortedPlayers = [...players].sort((a, b) => {
        return Number(b.total_events || 0) - Number(a.total_events || 0);
    });

    const maxEvents = Math.max(
        ...sortedPlayers.map(p => Number(p.total_events || 0)),
        1
    );

    const items = sortedPlayers.map(p => {
        const x = Number(p.avg_x);
        const y = Number(p.avg_y);
        const events = Number(p.total_events || 0);
        const r = getAverageRadius(events, maxEvents);
        const shirt = p.jersey_number ?? "?";
        const bubbleName = getBubbleName(p.player);

        return `
            <g class="average-position-group">
                <circle
                    class="average-position-player"
                    cx="${x}"
                    cy="${y}"
                    r="${r}"
                >
                    <title>${escapeHTML(p.player)} | ${escapeHTML(translateTeamName(p.team))} | ${events} ações | Média: ${x.toFixed(1)}, ${y.toFixed(1)}</title>
                </circle>

                <text
                    class="average-position-number"
                    x="${x}"
                    y="${y - 1.65}"
                >${escapeHTML(shirt)}</text>

                <text
                    class="average-position-name-inside"
                    x="${x}"
                    y="${y + 2.45}"
                >${escapeHTML(bubbleName)}</text>
            </g>
        `;
    }).join("");

    return `
        <div class="average-position-card">
            <div class="average-position-team-title">${escapeHTML(translateTeamName(teamName))}</div>

            ${createPitchSvg(items)}

            <div class="average-position-note">
                Número e nome dentro da bolinha. Tamanho = volume de ações na partida.
            </div>

            <div class="average-position-mini-table">
                ${sortedPlayers.map(p => `
                    <div class="average-position-mini-row">
                        <span class="average-position-mini-name">
                            ${escapeHTML(p.jersey_number ?? "?")} · ${escapeHTML(p.player)}
                        </span>

                        <span class="average-position-mini-events">
                            ${Number(p.total_events || 0)} ações
                        </span>
                    </div>
                `).join("")}
            </div>
        </div>
    `;
}

function renderAveragePositions(players) {
    if (!players || !players.length) {
        return `<div class="loading">Nenhuma posição média encontrada</div>`;
    }

    const grouped = {};

    players.forEach(p => {
        if (!grouped[p.team]) grouped[p.team] = [];
        grouped[p.team].push(p);
    });

    return `
        <div class="average-positions-grid">
            ${Object.entries(grouped).map(([teamName, teamPlayers]) => {
                return renderAveragePositionMap(teamPlayers, teamName);
            }).join("")}
        </div>
    `;
}

/* ============================
   COMPARATIVO ENTRE TIMES
============================ */

function formatComparisonValue(value, type = "number") {
    const num = Number(value || 0);

    if (type === "percent") return `${num.toFixed(1)}%`;
    if (type === "decimal") return num.toFixed(2);

    return String(Math.round(num));
}

function getComparisonPercent(value, maxValue) {
    const num = Number(value || 0);
    const max = Math.max(Number(maxValue || 0), 1);

    return Math.max(3, Math.min(100, (num / max) * 100));
}

function renderComparisonRow(label, leftValue, rightValue, type = "number") {
    const leftNum = Number(leftValue || 0);
    const rightNum = Number(rightValue || 0);
    const maxValue = Math.max(leftNum, rightNum, 1);

    const leftPercent = getComparisonPercent(leftNum, maxValue);
    const rightPercent = getComparisonPercent(rightNum, maxValue);

    const leftWinner = leftNum > rightNum ? "winner" : "";
    const rightWinner = rightNum > leftNum ? "winner" : "";
    const draw = leftNum === rightNum ? "draw" : "";

    return `
        <div class="comparison-row">
            <div class="comparison-side comparison-left">
                <span class="comparison-value ${leftWinner} ${draw}">
                    ${formatComparisonValue(leftNum, type)}
                </span>

                <div class="comparison-bar-track">
                    <div
                        class="comparison-bar comparison-bar-left ${leftWinner}"
                        style="width:${leftPercent}%"
                    ></div>
                </div>
            </div>

            <div class="comparison-metric">${escapeHTML(label)}</div>

            <div class="comparison-side comparison-right">
                <div class="comparison-bar-track">
                    <div
                        class="comparison-bar comparison-bar-right ${rightWinner}"
                        style="width:${rightPercent}%"
                    ></div>
                </div>

                <span class="comparison-value ${rightWinner} ${draw}">
                    ${formatComparisonValue(rightNum, type)}
                </span>
            </div>
        </div>
    `;
}

function renderTeamComparison(data) {
    if (!data || !data.teams || data.teams.length < 2) {
        return `<div class="loading">Comparativo indisponível para esta partida</div>`;
    }

    const left = data.teams[0];
    const right = data.teams[1];
    const match = data.match || {};

    const metrics = [
        { label: "Gols", key: "goals", type: "number" },
        { label: "Finalizações", key: "shots", type: "number" },
        { label: "Finalizações no gol", key: "shots_on_target", type: "number" },
        { label: "xG", key: "xg", type: "decimal" },
        { label: "Ações totais", key: "total_actions", type: "number" },
        { label: "Passes", key: "passes", type: "number" },
        { label: "Passes certos", key: "completed_passes", type: "number" },
        { label: "Aproveitamento de passe", key: "pass_accuracy", type: "percent" },
        { label: "Dribles", key: "dribbles", type: "number" },
        { label: "Dribles certos", key: "completed_dribbles", type: "number" },
        { label: "Faltas cometidas", key: "fouls_committed", type: "number" },
        { label: "Ações sob pressão", key: "actions_under_pressure", type: "number" }
    ];

    return `
        <div class="comparison-card">
            <div class="comparison-header">
                <div class="comparison-team-name left-team">
                    ${escapeHTML(translateTeamName(left.team))}
                </div>

                <div class="comparison-score">
                    <span>${left.goals}</span>
                    <strong>x</strong>
                    <span>${right.goals}</span>
                </div>

                <div class="comparison-team-name right-team">
                    ${escapeHTML(translateTeamName(right.team))}
                </div>
            </div>

            <div class="comparison-subtitle">
                ${formatDateBR(match.match_date || "")}
                ${match.competition_stage ? ` · ${escapeHTML(translateStage(match.competition_stage))}` : ""}
            </div>

            <div class="comparison-table">
                ${metrics.map(metric => {
                    return renderComparisonRow(
                        metric.label,
                        left[metric.key],
                        right[metric.key],
                        metric.type
                    );
                }).join("")}
            </div>
        </div>
    `;
}

/* ============================
   MOMENTOS DA PARTIDA
============================ */

function getMomentValue(moment, team) {
    if (!moment || !team || !moment[team]) return 0;
    return Number(moment[team].score || 0);
}

function getMomentShare(leftValue, rightValue) {
    const total = Number(leftValue || 0) + Number(rightValue || 0);

    if (total <= 0) {
        return {
            left: 50,
            right: 50
        };
    }

    return {
        left: Math.round((leftValue / total) * 100),
        right: Math.round((rightValue / total) * 100)
    };
}

function renderMomentBar(moment, leftTeam, rightTeam) {
    const leftValue = getMomentValue(moment, leftTeam);
    const rightValue = getMomentValue(moment, rightTeam);

    const shares = getMomentShare(leftValue, rightValue);

    const leftWinner = leftValue > rightValue ? "winner" : "";
    const rightWinner = rightValue > leftValue ? "winner" : "";
    const draw = leftValue === rightValue ? "draw" : "";

    const leftShots = moment[leftTeam]?.shots || 0;
    const rightShots = moment[rightTeam]?.shots || 0;

    const leftXg = Number(moment[leftTeam]?.xg || 0).toFixed(2);
    const rightXg = Number(moment[rightTeam]?.xg || 0).toFixed(2);

    const leftFinalThird = moment[leftTeam]?.final_third_actions || 0;
    const rightFinalThird = moment[rightTeam]?.final_third_actions || 0;

    let dominantTeam = "Equilíbrio";

    if (leftValue > rightValue) dominantTeam = translateTeamName(leftTeam);
    if (rightValue > leftValue) dominantTeam = translateTeamName(rightTeam);

    return `
        <div class="moments-row clean-moment-row">
            <div class="moments-time">${escapeHTML(moment.period_label)}'</div>

            <div class="moments-pressure-line">
                <div class="moments-pressure-side left">
                    <span class="moments-team-mini">${escapeHTML(translateTeamName(leftTeam))}</span>
                    <strong class="${leftWinner} ${draw}">${shares.left}%</strong>
                </div>

                <div class="moments-pressure-bar">
                    <div
                        class="moments-pressure-left ${leftWinner}"
                        style="width:${shares.left}%"
                    ></div>

                    <div
                        class="moments-pressure-right ${rightWinner}"
                        style="width:${shares.right}%"
                    ></div>
                </div>

                <div class="moments-pressure-side right">
                    <strong class="${rightWinner} ${draw}">${shares.right}%</strong>
                    <span class="moments-team-mini">${escapeHTML(translateTeamName(rightTeam))}</span>
                </div>
            </div>

            <div class="moments-summary-line">
                <span>Chutes: ${leftShots} x ${rightShots}</span>
                <span>xG: ${leftXg} x ${rightXg}</span>
                <span>Terço final: ${leftFinalThird} x ${rightFinalThird}</span>
            </div>

            <div class="moments-dominance ${leftWinner || rightWinner || draw}">
                Maior momento: <strong>${escapeHTML(dominantTeam)}</strong>
            </div>
        </div>
    `;
}

function renderGoalTimeline(goals) {
    if (!goals || !goals.length) {
        return `
            <div class="moments-goals-empty">
                Nenhum gol encontrado nos eventos da partida.
            </div>
        `;
    }

    return `
        <div class="moments-goals">
            ${goals.map(goal => `
                <div class="moments-goal-chip">
                    <strong>${goal.minute}'</strong>
                    <span>${escapeHTML(translateTeamName(goal.team))}</span>
                    <em>${escapeHTML(goal.player)}</em>
                </div>
            `).join("")}
        </div>
    `;
}

function renderMatchMoments(data) {
    if (!data || !data.moments || !data.moments.length || !data.teams || data.teams.length < 2) {
        return `<div class="loading">Momentos da partida indisponíveis</div>`;
    }

    const leftTeam = data.teams[0];
    const rightTeam = data.teams[1];
    const match = data.match || {};

    const usefulMoments = data.moments.filter(moment => {
        const left = getMomentValue(moment, leftTeam);
        const right = getMomentValue(moment, rightTeam);
        return left > 0 || right > 0;
    });

    return `
        <div class="moments-card">
            <div class="moments-header">
                <div class="moments-team left-team">${escapeHTML(translateTeamName(leftTeam))}</div>

                <div class="moments-title">
                    <strong>Momentos da Partida</strong>
                    <span>${formatDateBR(match.match_date || "")}${match.competition_stage ? ` · ${escapeHTML(translateStage(match.competition_stage))}` : ""}</span>
                </div>

                <div class="moments-team right-team">${escapeHTML(translateTeamName(rightTeam))}</div>
            </div>

            <div class="moments-explain">
                Leitura por blocos de 5 minutos. O percentual indica qual equipe concentrou mais pressão ofensiva naquele período.
            </div>

            <div class="moments-table clean-moments-table">
                ${usefulMoments.map(moment => {
                    return renderMomentBar(moment, leftTeam, rightTeam);
                }).join("")}
            </div>

            <div class="moments-goals-title">Gols da partida</div>
            ${renderGoalTimeline(data.goals)}
        </div>
    `;
}

/* ============================
   LINHA DO TEMPO DA PARTIDA
============================ */

function getTimelineClass(event) {
    if (!event) return "normal";

    if (event.importance === "goal") return "goal";
    if (event.importance === "shot_on_target") return "shot-on-target";
    if (event.importance === "card") return "card";
    if (event.importance === "red_card") return "red-card";
    if (event.importance === "substitution") return "substitution";

    return "normal";
}

function renderTimelineEvent(event) {
    const cls = getTimelineClass(event);
    const scoreText = `${event.home_score ?? 0} x ${event.away_score ?? 0}`;
    const isGoal = event.importance === "goal";

    return `
        <div class="timeline-item ${cls}">
            <div class="timeline-time">
                <strong>${escapeHTML(event.minute)}'</strong>
                <span>${String(event.second || 0).padStart(2, "0")}s</span>
            </div>

            <div class="timeline-marker">
                <span>${escapeHTML(event.icon || "•")}</span>
            </div>

            <div class="timeline-content">
                <div class="timeline-topline">
                    <span class="timeline-category">${escapeHTML(event.category || event.type)}</span>
                    <span class="timeline-team">${escapeHTML(translateTeamName(event.team))}</span>
                    ${isGoal ? `<span class="timeline-score">${escapeHTML(scoreText)}</span>` : ""}
                </div>

                <div class="timeline-title">
                    ${escapeHTML(event.title)}
                </div>

                <div class="timeline-description">
                    ${escapeHTML(event.description || "")}
                </div>
            </div>
        </div>
    `;
}

function renderMatchTimeline(data) {
    if (!data || !data.events || !data.events.length) {
        return `<div class="loading">Nenhum evento importante encontrado para esta partida</div>`;
    }

    const match = data.match || {};

    const goals = data.events.filter(e => e.importance === "goal").length;
    const shots = data.events.filter(e => e.type === "Shot").length;
    const cards = data.events.filter(e => e.importance === "card" || e.importance === "red_card").length;
    const subs = data.events.filter(e => e.importance === "substitution").length;

    return `
        <div class="timeline-card">
            <div class="timeline-header">
                <div>
                    <strong>${escapeHTML(translateTeamName(match.home_team))} ${match.home_score ?? ""} x ${match.away_score ?? ""} ${escapeHTML(translateTeamName(match.away_team))}</strong>
                    <span>${formatDateBR(match.match_date || "")}${match.competition_stage ? ` · ${escapeHTML(translateStage(match.competition_stage))}` : ""}</span>
                </div>
            </div>

            <div class="timeline-kpis">
                <div><strong>${goals}</strong><span>Gols</span></div>
                <div><strong>${shots}</strong><span>Finalizações</span></div>
                <div><strong>${cards}</strong><span>Cartões</span></div>
                <div><strong>${subs}</strong><span>Substituições</span></div>
            </div>

            <div class="timeline-list">
                ${data.events.map(event => renderTimelineEvent(event)).join("")}
            </div>
        </div>
    `;
}

/* ============================
   RANKING INDIVIDUAL
============================ */

function getRatingClass(rating) {
    const num = Number(rating || 0);

    if (num >= 8.5) return "elite";
    if (num >= 7.5) return "great";
    if (num >= 6.5) return "good";

    return "normal";
}

function renderPlayerRanking(data) {
    if (!data || !data.players || !data.players.length) {
        return `<div class="loading">Ranking individual indisponível para esta partida</div>`;
    }

    const topPlayers = data.players.slice(0, 5);
    const remainingPlayers = data.players.slice(5);

    return `
        <div class="player-ranking-card">
            <div class="player-ranking-header">
                <div>
                    <strong>Ranking Individual</strong>
                    <span>Índice próprio do dashboard, calculado a partir de eventos da StatsBomb.</span>
                </div>
            </div>

            <div class="player-ranking-podium">
                ${topPlayers.map((player, index) => `
                    <div class="player-podium-card rank-${index + 1}">
                        <div class="player-podium-rank">#${index + 1}</div>

                        <div class="player-podium-main">
                            <strong>${escapeHTML(player.player)}</strong>
                            <span>${escapeHTML(translateTeamName(player.team))}</span>
                        </div>

                        <div class="player-rating-badge ${getRatingClass(player.rating)}">
                            ${Number(player.rating || 0).toFixed(1)}
                        </div>

                        <div class="player-podium-stats">
                            <span>${player.goals} gols</span>
                            <span>${Number(player.xg || 0).toFixed(2)} xG</span>
                            <span>${player.completed_passes}/${player.passes} passes</span>
                        </div>
                    </div>
                `).join("")}
            </div>

            <div class="player-ranking-table-wrap">
                <table class="player-ranking-table">
                    <thead>
                        <tr>
                            <th>#</th>
                            <th>Jogador</th>
                            <th>Time</th>
                            <th>Nota</th>
                            <th>Ações</th>
                            <th>Gols</th>
                            <th>xG</th>
                            <th>Passes</th>
                            <th>Dribles</th>
                            <th>Terço final</th>
                        </tr>
                    </thead>

                    <tbody>
                        ${data.players.map((player, index) => `
                            <tr>
                                <td>
                                    <span class="player-rank-number">${index + 1}</span>
                                </td>

                                <td>
                                    <strong class="player-table-name">${escapeHTML(player.player)}</strong>
                                </td>

                                <td>${escapeHTML(translateTeamName(player.team))}</td>

                                <td>
                                    <span class="player-rating-small ${getRatingClass(player.rating)}">
                                        ${Number(player.rating || 0).toFixed(1)}
                                    </span>
                                </td>

                                <td>${player.total_actions}</td>
                                <td>${player.goals}</td>
                                <td>${Number(player.xg || 0).toFixed(2)}</td>
                                <td>${player.completed_passes}/${player.passes}</td>
                                <td>${player.completed_dribbles}/${player.dribbles}</td>
                                <td>${player.final_third_actions}</td>
                            </tr>
                        `).join("")}
                    </tbody>
                </table>
            </div>

            ${remainingPlayers.length ? `
                <div class="player-ranking-note">
                    Top 5 em destaque acima. A tabela mostra até ${data.players.length} jogadores da partida.
                </div>
            ` : ""}
        </div>
    `;
}

/* ============================
   RESUMO INTELIGENTE
============================ */

function getInsightIcon(type) {
    const icons = {
        result: "🏆",
        volume: "📊",
        attack: "🎯",
        xg: "⚡",
        territory: "🗺️",
        passing: "🔁",
        player: "⭐",
        "player-volume": "🔥",
        "passing-player": "🎼"
    };

    return icons[type] || "•";
}

function renderInsightCard(insight) {
    return `
        <div class="insight-card ${escapeHTML(insight.type || "default")}">
            <div class="insight-icon">
                ${getInsightIcon(insight.type)}
            </div>

            <div class="insight-content">
                <strong>${escapeHTML(insight.title)}</strong>
                <p>${escapeHTML(insight.text)}</p>
            </div>
        </div>
    `;
}

function renderInsightTeamCard(team) {
    return `
        <div class="insight-team-card">
            <div class="insight-team-header">
                <strong>${escapeHTML(translateTeamName(team.team))}</strong>
                <span>${team.goals} gols</span>
            </div>

            <div class="insight-team-metrics">
                <div>
                    <strong>${team.shots}</strong>
                    <span>Chutes</span>
                </div>

                <div>
                    <strong>${Number(team.xg || 0).toFixed(2)}</strong>
                    <span>xG</span>
                </div>

                <div>
                    <strong>${team.final_third_actions}</strong>
                    <span>Terço final</span>
                </div>

                <div>
                    <strong>${team.pass_accuracy}%</strong>
                    <span>Passes certos</span>
                </div>
            </div>
        </div>
    `;
}

function renderInsightPlayerCard(player, index) {
    return `
        <div class="insight-player-card">
            <div class="insight-player-rank">#${index + 1}</div>

            <div class="insight-player-main">
                <strong>${escapeHTML(player.player)}</strong>
                <span>${escapeHTML(translateTeamName(player.team))}</span>
            </div>

            <div class="insight-player-score">
                ${Number(player.impact_score || 0).toFixed(1)}
            </div>

            <div class="insight-player-stats">
                <span>${player.goals} gols</span>
                <span>${Number(player.xg || 0).toFixed(2)} xG</span>
                <span>${player.completed_passes} passes certos</span>
            </div>
        </div>
    `;
}

function renderMatchInsights(data) {
    if (!data || !data.insights || !data.insights.length) {
        return `<div class="loading">Resumo inteligente indisponível para esta partida</div>`;
    }

    const match = data.match || {};
    const teams = data.teams || [];
    const topPlayers = data.top_players || [];

    return `
        <div class="insights-card">
            <div class="insights-hero">
                <div>
                    <span class="insights-label">Resumo Inteligente</span>

                    <strong>
                        ${escapeHTML(translateTeamName(match.home_team))} ${match.home_score ?? ""} x ${match.away_score ?? ""} ${escapeHTML(translateTeamName(match.away_team))}
                    </strong>

                    <p>
                        ${formatDateBR(match.match_date || "")}
                        ${match.competition_stage ? ` · ${escapeHTML(translateStage(match.competition_stage))}` : ""}
                    </p>
                </div>
            </div>

            <div class="insights-grid">
                ${data.insights.map(insight => renderInsightCard(insight)).join("")}
            </div>

            <div class="insights-section-title">
                <strong>Leitura por equipe</strong>
                <span>Comparativo resumido das principais métricas da partida</span>
            </div>

            <div class="insight-teams-grid">
                ${teams.map(team => renderInsightTeamCard(team)).join("")}
            </div>

            <div class="insights-section-title">
                <strong>Destaques individuais</strong>
                <span>Ranking por índice de impacto próprio do dashboard</span>
            </div>

            <div class="insight-players-grid">
                ${topPlayers.map((player, index) => renderInsightPlayerCard(player, index)).join("")}
            </div>
        </div>
    `;
}

/* ============================
   ESCALAÇÃO TÁTICA VERTICAL
============================ */

function parseFormation(formation) {
    const raw = String(formation || "").replace(/\D/g, "");

    if (!raw) return [4, 3, 3];

    const numbers = raw.split("").map(Number).filter(n => n > 0);

    if (!numbers.length) return [4, 3, 3];

    return numbers;
}

function normalizePosition(positionName) {
    const pos = String(positionName || "").toLowerCase();

    if (pos.includes("goalkeeper")) return "gk";

    if (
        pos.includes("left back") ||
        pos.includes("right back") ||
        pos.includes("center back") ||
        pos.includes("centre back") ||
        pos.includes("back")
    ) {
        return "def";
    }

    if (
        pos.includes("striker") ||
        pos.includes("center forward") ||
        pos.includes("centre forward") ||
        pos.includes("forward") ||
        pos.includes("wing")
    ) {
        return "att";
    }

    if (
        pos.includes("midfield") ||
        pos.includes("defensive midfield") ||
        pos.includes("attacking midfield")
    ) {
        return "mid";
    }

    return "mid";
}

function getSideOrder(positionName) {
    const pos = String(positionName || "").toLowerCase();

    if (pos.includes("left wing back")) return 1;
    if (pos.includes("left back")) return 1;
    if (pos.includes("left midfield")) return 1;
    if (pos.includes("left wing")) return 1;
    if (pos.includes("left center") || pos.includes("left centre")) return 2;

    if (pos.includes("center") || pos.includes("centre")) return 3;

    if (pos.includes("right center") || pos.includes("right centre")) return 4;
    if (pos.includes("right wing back")) return 5;
    if (pos.includes("right back")) return 5;
    if (pos.includes("right midfield")) return 5;
    if (pos.includes("right wing")) return 5;

    return 3;
}

function sortPlayersBySide(players) {
    return [...players].sort((a, b) => {
        const sideDiff = getSideOrder(a.position_name) - getSideOrder(b.position_name);

        if (sideDiff !== 0) return sideDiff;

        return Number(a.position_id || 99) - Number(b.position_id || 99);
    });
}

function takePlayers(pool, amount) {
    const selected = pool.slice(0, amount);
    pool.splice(0, amount);
    return selected;
}

function distributeLine(players, y) {
    const sorted = sortPlayersBySide(players);
    const count = sorted.length;

    const xMap = {
        1: [50],
        2: [35, 65],
        3: [23, 50, 77],
        4: [16, 39, 61, 84],
        5: [10, 30, 50, 70, 90],
        6: [8, 25, 42, 58, 75, 92]
    };

    const xs = xMap[count] || sorted.map((_, index) => {
        return 10 + (index * (80 / Math.max(1, count - 1)));
    });

    return sorted.map((player, index) => ({
        ...player,
        x: xs[index],
        y
    }));
}

function getLineYs(lineCount) {
    if (lineCount === 3) return [74, 50, 25];
    if (lineCount === 4) return [76, 59, 42, 22];
    if (lineCount === 5) return [78, 64, 50, 35, 20];

    return [74, 50, 25];
}

function buildFormationLines(players) {
    const formation = players[0]?.formation || "433";
    const formationLines = parseFormation(formation);

    const gks = [];
    const defs = [];
    const mids = [];
    const atts = [];
    const others = [];

    players.forEach(player => {
        const type = normalizePosition(player.position_name);

        if (type === "gk") gks.push(player);
        else if (type === "def") defs.push(player);
        else if (type === "mid") mids.push(player);
        else if (type === "att") atts.push(player);
        else others.push(player);
    });

    const remainingDefs = sortPlayersBySide(defs);
    const remainingMids = sortPlayersBySide([...mids, ...others]);
    const remainingAtts = sortPlayersBySide(atts);

    const lines = [];
    const goalkeeper = gks.length ? gks[0] : players[0];

    lines.push({
        y: 91,
        players: [goalkeeper]
    });

    const ys = getLineYs(formationLines.length);

    formationLines.forEach((amount, index) => {
        const isDefenseLine = index === 0;
        const isAttackLine = index === formationLines.length - 1;
        let linePlayers = [];

        if (isDefenseLine) {
            linePlayers = takePlayers(remainingDefs, amount);

            while (linePlayers.length < amount && remainingMids.length) {
                linePlayers.push(...takePlayers(remainingMids, 1));
            }
        } else if (isAttackLine) {
            linePlayers = takePlayers(remainingAtts, amount);

            while (linePlayers.length < amount && remainingMids.length) {
                linePlayers.push(...takePlayers(remainingMids, 1));
            }

            while (linePlayers.length < amount && remainingDefs.length) {
                linePlayers.push(...takePlayers(remainingDefs, 1));
            }
        } else {
            linePlayers = takePlayers(remainingMids, amount);

            while (linePlayers.length < amount && remainingAtts.length) {
                linePlayers.push(...takePlayers(remainingAtts, 1));
            }

            while (linePlayers.length < amount && remainingDefs.length) {
                linePlayers.push(...takePlayers(remainingDefs, 1));
            }
        }

        lines.push({
            y: ys[index],
            players: linePlayers
        });
    });

    const usedIds = new Set();

    lines.forEach(line => {
        line.players.forEach(player => {
            usedIds.add(String(player.player_id || player.player_name));
        });
    });

    const leftovers = players.filter(player => {
        const key = String(player.player_id || player.player_name);
        return !usedIds.has(key);
    });

    if (leftovers.length) {
        const midLineIndex = Math.min(2, lines.length - 1);
        lines[midLineIndex].players.push(...leftovers);
    }

    return lines;
}

function getFormationLabel(formation) {
    const nums = parseFormation(formation);
    return nums.join("-");
}

function renderTacticalLineup(teamName, players) {
    const formation = players[0]?.formation || "433";
    const formationLabel = getFormationLabel(formation);
    const lines = buildFormationLines(players);

    const positionedPlayers = lines.flatMap(line => {
        return distributeLine(line.players, line.y);
    });

    return `
        <div class="tactical-lineup-card">
            <div class="tactical-lineup-title">
                ${escapeHTML(translateTeamName(teamName))}
                <span>Formação: ${escapeHTML(formationLabel)}</span>
            </div>

            <div class="lineup-field-scroll">
                <div class="lineup-field">
                    <div class="lineup-field-lines">
                        <div class="lineup-center-circle"></div>
                        <div class="lineup-box-top"></div>
                        <div class="lineup-box-bottom"></div>
                        <div class="lineup-small-box-top"></div>
                        <div class="lineup-small-box-bottom"></div>
                    </div>

                    ${positionedPlayers.map(p => `
                        <div
                            class="lineup-player-dot"
                            style="left:${p.x}%; top:${p.y}%"
                            title="${escapeHTML(p.player_name)} - ${escapeHTML(translatePosition(p.position_name))}"
                        >
                            <div class="lineup-shirt">${p.jersey_number ?? "-"}</div>
                            <div class="lineup-player-name">${escapeHTML(getShortName(p.player_name))}</div>
                            <div class="lineup-player-position">${escapeHTML(translatePosition(p.position_name))}</div>
                        </div>
                    `).join("")}
                </div>
            </div>
        </div>
    `;
}

/* ============================
   VISÃO GERAL
============================ */

async function loadSummary() {
    const data = await fetchJSON(`${API}/summary`);
    const el = document.getElementById("kpi-row");

    if (!el) return;

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
            <div class="kpi-sub">${data.top_scorer ? escapeHTML(data.top_scorer.player) : ""}</div>
        </div>
    `;
}

async function loadArtilheiros() {
    const data = await fetchJSON(`${API}/artilheiros?limit=10`);
    const el = document.getElementById("artilheiros-list");

    if (!el) return;

    el.innerHTML = data.artilheiros.map((a, i) => `
        <div class="scorer-row">
            <div>
                <span class="rank-badge">${i + 1}</span>
                <span class="scorer-name">${escapeHTML(a.player)}</span>
                <div class="scorer-team">${escapeHTML(translateTeamName(a.team))}</div>
            </div>
            <div class="scorer-goals">${a.gols}</div>
        </div>
    `).join("");
}

let rankingChart = null;

async function loadRanking(orderBy = "gols", limit = 10) {
    const metricMap = {
        gols: { apiKey: "gols", dataKey: "gols", label: "Gols" },
        xg: { apiKey: "xg", dataKey: "xg", label: "xG" },
        shots: { apiKey: "chutes", dataKey: "chutes", label: "Finalizações" },
        shots_on_target: { apiKey: "chutes_no_gol", dataKey: "chutes_no_gol", label: "Finalizações no gol" }
    };

    const metric = metricMap[orderBy] || metricMap.gols;
    const data = await fetchJSON(`${API}/ranking?order_by=${metric.apiKey}&limit=${limit}`);

    const labels = data.ranking.map(r => translateTeamName(r.team));
    const values = data.ranking.map(r => Number(r[metric.dataKey] || 0));

    const ctx = document.getElementById("ranking-chart");
    const wrapper = document.getElementById("ranking-chart-wrapper");

    if (!ctx) return;

    if (wrapper) {
        if (Number(limit) === 32) wrapper.classList.add("expanded");
        else wrapper.classList.remove("expanded");
    }

    if (rankingChart) rankingChart.destroy();

    rankingChart = new Chart(ctx, {
        type: "bar",
        data: {
            labels,
            datasets: [{
                label: metric.label,
                data: values,
                backgroundColor: "rgba(212, 175, 55, 0.82)",
                borderColor: "#D4AF37",
                borderWidth: 1,
                borderRadius: 6,
                barThickness: "flex",
                maxBarThickness: 28
            }],
        },
        options: {
            indexAxis: "y",
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return `${metric.label}: ${context.raw}`;
                        }
                    }
                }
            },
            scales: {
                x: {
                    beginAtZero: true,
                    ticks: { color: "#A8A29E" },
                    grid: { color: "rgba(255,255,255,0.05)" }
                },
                y: {
                    ticks: { color: "#F5F5F5", autoSkip: false },
                    grid: { display: false }
                },
            },
        },
    });
}

async function loadBrasilCampanha() {
    const data = await fetchJSON(`${API}/brasil-campanha`);
    const tbody = document.getElementById("brasil-tbody");

    if (!tbody) return;

    tbody.innerHTML = data.campanha.map(j => `
        <tr>
            <td>
                <span class="date-chip">${formatDateBR(j.match_date)}</span>
            </td>

            <td>
                <span class="stage-chip">${escapeHTML(translateStage(j.competition_stage))}</span>
            </td>

            <td>${renderTeamPill(j.opponent)}</td>

            <td class="score-cell">${j.goals ?? "-"} – ${j.gols_sofridos ?? "-"}</td>

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

    if (!tbody) return;

    if (!data.matches.length) {
        tbody.innerHTML = `<tr><td colspan="5" class="loading">Nenhuma partida encontrada</td></tr>`;
        return;
    }

    tbody.innerHTML = data.matches.map(m => `
        <tr>
            <td>
                <span class="date-chip">${formatDateBR(m.match_date)}</span>
            </td>

            <td>
                <span class="stage-chip">${escapeHTML(translateStage(m.competition_stage))}</span>
            </td>

            <td>${renderTeamPill(m.home_team)}</td>

            <td class="score-cell">
                ${formatScoreWithPenalties(m)}
            </td>

            <td>${renderTeamPill(m.away_team)}</td>
        </tr>
    `).join("");
}

async function populateTeamFilter() {
    const data = await fetchJSON(`${API}/ranking?limit=32`);
    const select = document.getElementById("team-filter");

    if (!select) return;

    const teams = data.ranking.map(r => r.team).sort();

    select.innerHTML = `<option value="">Todas as seleções</option>` +
        teams.map(t => `<option value="${escapeHTML(t)}">${escapeHTML(translateTeamName(t))}</option>`).join("");

    select.addEventListener("change", () => loadMatches(select.value));
}

/* ============================
   ANÁLISE POR PARTIDA
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
                ${formatDateBR(m.match_date)} - ${translateTeamName(m.home_team)} ${m.home_score} x ${m.away_score} ${translateTeamName(m.away_team)}
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
        <option value="${escapeHTML(match.home_team)}">${escapeHTML(translateTeamName(match.home_team))}</option>
        <option value="${escapeHTML(match.away_team)}">${escapeHTML(translateTeamName(match.away_team))}</option>
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
            <option value="${escapeHTML(p.player)}">
                ${p.jersey_number ? `${p.jersey_number} - ` : ""}${escapeHTML(p.player)}
            </option>
        `).join("");

    playerSelect.onchange = async () => {
        await loadMatchAnalysis();
    };
}

function clearAnalysisBoxes() {
    const ids = [
        "lineups-box",
        "insights-box",
        "comparison-box",
        "moments-box",
        "timeline-box",
        "player-ranking-box",
        "average-positions-box",
        "heatmap-box",
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

    return { matchId, team, player };
}

async function loadMatchAnalysis() {
    const { matchId } = getAnalysisFilters();

    if (!matchId) return;

    await Promise.all([
        loadAnalysisLineups(),
        loadMatchInsights(),
        loadTeamComparison(),
        loadMatchMoments(),
        loadMatchTimeline(),
        loadPlayerRanking(),
        loadAveragePositions(),
        loadHeatmap(),
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

    box.innerHTML = `
        <div class="lineup-pitch-grid">
            ${Object.entries(grouped).map(([teamName, players]) => {
                const orderedPlayers = players
                    .slice()
                    .sort((a, b) => Number(a.position_id || 99) - Number(b.position_id || 99));

                return renderTacticalLineup(teamName, orderedPlayers);
            }).join("")}
        </div>
    `;
}

async function loadMatchInsights() {
    const { matchId } = getAnalysisFilters();
    const box = document.getElementById("insights-box");

    if (!box || !matchId) return;

    const data = await fetchJSON(`${API}/match-insights?match_id=${encodeURIComponent(matchId)}`);

    if (!data.insights || !data.insights.length) {
        box.innerHTML = `<div class="loading">Resumo inteligente indisponível para esta partida</div>`;
        return;
    }

    box.innerHTML = renderMatchInsights(data);
}

async function loadTeamComparison() {
    const { matchId } = getAnalysisFilters();
    const box = document.getElementById("comparison-box");

    if (!box || !matchId) return;

    const data = await fetchJSON(`${API}/team-comparison?match_id=${encodeURIComponent(matchId)}`);

    if (!data.teams || data.teams.length < 2) {
        box.innerHTML = `<div class="loading">Comparativo indisponível para esta partida</div>`;
        return;
    }

    box.innerHTML = renderTeamComparison(data);
}

async function loadMatchMoments() {
    const { matchId } = getAnalysisFilters();
    const box = document.getElementById("moments-box");

    if (!box || !matchId) return;

    const data = await fetchJSON(`${API}/match-moments?match_id=${encodeURIComponent(matchId)}&interval=5`);

    if (!data.moments || !data.moments.length) {
        box.innerHTML = `<div class="loading">Momentos da partida indisponíveis</div>`;
        return;
    }

    box.innerHTML = renderMatchMoments(data);
}

async function loadMatchTimeline() {
    const { matchId } = getAnalysisFilters();
    const box = document.getElementById("timeline-box");

    if (!box || !matchId) return;

    const data = await fetchJSON(`${API}/match-timeline?match_id=${encodeURIComponent(matchId)}`);

    if (!data.events || !data.events.length) {
        box.innerHTML = `<div class="loading">Nenhum evento importante encontrado para esta partida</div>`;
        return;
    }

    box.innerHTML = renderMatchTimeline(data);
}

async function loadPlayerRanking() {
    const { matchId, team } = getAnalysisFilters();
    const box = document.getElementById("player-ranking-box");

    if (!box || !matchId) return;

    let url = `${API}/player-ranking?match_id=${encodeURIComponent(matchId)}&limit=30`;

    if (team) {
        url += `&team=${encodeURIComponent(team)}`;
    }

    const data = await fetchJSON(url);

    if (!data.players || !data.players.length) {
        box.innerHTML = `<div class="loading">Ranking individual indisponível para esta partida</div>`;
        return;
    }

    box.innerHTML = renderPlayerRanking(data);
}

async function loadAveragePositions() {
    const { matchId, team, player } = getAnalysisFilters();
    const box = document.getElementById("average-positions-box");

    if (!box || !matchId) return;

    let url = `${API}/average-positions?match_id=${encodeURIComponent(matchId)}&min_events=3`;

    if (team) url += `&team=${encodeURIComponent(team)}`;
    if (player) url += `&player=${encodeURIComponent(player)}`;

    const data = await fetchJSON(url);

    if (!data.positions.length) {
        box.innerHTML = `<div class="loading">Nenhuma posição média encontrada</div>`;
        return;
    }

    box.innerHTML = renderAveragePositions(data.positions);
}

async function loadHeatmap() {
    const { matchId, team, player } = getAnalysisFilters();
    const box = document.getElementById("heatmap-box");

    if (!box || !matchId) return;

    let url = `${API}/heatmap-data?match_id=${encodeURIComponent(matchId)}&limit=5000`;

    if (team) url += `&team=${encodeURIComponent(team)}`;
    if (player) url += `&player=${encodeURIComponent(player)}`;

    const data = await fetchJSON(url);

    if (!data.points.length) {
        box.innerHTML = `<div class="loading">Nenhuma ação encontrada para o mapa de calor</div>`;
        return;
    }

    box.innerHTML = `
        ${renderHeatmap(data.points)}

        <div class="stat-highlight-row">
            <div><strong>${data.summary.total_actions}</strong><span>Ações</span></div>
            <div><strong>${data.summary.passes}</strong><span>Passes</span></div>
            <div><strong>${data.summary.shots}</strong><span>Chutes</span></div>
            <div><strong>${data.summary.dribbles}</strong><span>Dribles</span></div>
            <div><strong>${data.summary.under_pressure}</strong><span>Sob pressão</span></div>
        </div>
    `;
}

async function loadAnalysisPlayerSummary() {
    const { matchId, team, player } = getAnalysisFilters();
    const box = document.getElementById("player-summary-box");

    if (!box || !matchId) return;

    let url = `${API}/player-summary?match_id=${encodeURIComponent(matchId)}&limit=60`;

    if (team) url += `&team=${encodeURIComponent(team)}`;
    if (player) url += `&player=${encodeURIComponent(player)}`;

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
                            <td>${escapeHTML(p.player)}</td>
                            <td>${escapeHTML(translateTeamName(p.team))}</td>
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

    if (team) url += `&team=${encodeURIComponent(team)}`;
    if (player) url += `&player=${encodeURIComponent(player)}`;

    const data = await fetchJSON(url);

    if (!data.shots.length) {
        box.innerHTML = `<div class="loading">Nenhum chute encontrado</div>`;
        return;
    }

    const totalShots = data.shots.length;
    const totalGoals = data.shots.filter(s => s.shot_outcome === "Goal").length;
    const totalOnTarget = data.shots.filter(s => isShotOnTarget(s.shot_outcome)).length;
    const totalOffTarget = totalShots - totalOnTarget;
    const totalXg = data.shots.reduce((acc, s) => acc + Number(s.shot_xg || 0), 0);

    box.innerHTML = `
        ${renderShotmap(data.shots)}

        <div class="stat-highlight-row">
            <div><strong>${totalShots}</strong><span>Chutes</span></div>
            <div><strong>${totalGoals}</strong><span>Gols</span></div>
            <div><strong>${totalOnTarget}</strong><span>No alvo</span></div>
            <div><strong>${totalOffTarget}</strong><span>Para fora / bloqueados</span></div>
            <div><strong>${totalXg.toFixed(2)}</strong><span>xG</span></div>
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
                            <td>${escapeHTML(s.player)}</td>
                            <td>${escapeHTML(translateTeamName(s.team))}</td>
                            <td>${Number(s.shot_xg ?? 0).toFixed(2)}</td>
                            <td>${escapeHTML(translateShotOutcome(s.shot_outcome))}</td>
                            <td>${escapeHTML(translateBodyPart(s.shot_body_part))}</td>
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

    let url = `${API}/passmap-data?match_id=${encodeURIComponent(matchId)}&limit=3000&only_completed=false`;

    if (team) url += `&team=${encodeURIComponent(team)}`;
    if (player) url += `&player=${encodeURIComponent(player)}`;

    const data = await fetchJSON(url);

    if (!data.passes.length) {
        box.innerHTML = `<div class="loading">Nenhum passe encontrado</div>`;
        return;
    }

    const totalPasses = data.passes.length;
    const completedPasses = data.passes.filter(p => !p.pass_outcome).length;
    const failedPasses = totalPasses - completedPasses;
    const passAccuracy = totalPasses > 0 ? (completedPasses / totalPasses) * 100 : 0;

    const shortPasses = data.passes.filter(p => classifyPass(p) === "short").length;
    const mediumPasses = data.passes.filter(p => classifyPass(p) === "medium").length;
    const longPasses = data.passes.filter(p => classifyPass(p) === "long").length;

    function renderPassContent(mode = "all") {
        box.innerHTML = `
            ${renderPassmap(data.passes, mode)}

            <div class="stat-highlight-row">
                <div><strong>${totalPasses}</strong><span>Passes totais</span></div>
                <div><strong>${completedPasses}</strong><span>Passes certos</span></div>
                <div><strong>${failedPasses}</strong><span>Passes errados</span></div>
                <div><strong>${passAccuracy.toFixed(1)}%</strong><span>Aproveitamento</span></div>
                <div><strong>${shortPasses}</strong><span>Curtos</span></div>
                <div><strong>${mediumPasses}</strong><span>Médios</span></div>
                <div><strong>${longPasses}</strong><span>Lançamentos</span></div>
            </div>

            <div class="table-wrapper small-table">
                <table>
                    <thead>
                        <tr>
                            <th>Min</th>
                            <th>Jogador</th>
                            <th>Destino</th>
                            <th>Time</th>
                            <th>Categoria</th>
                            <th>Tipo</th>
                            <th>Tamanho</th>
                            <th>Resultado</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${data.passes.map(p => {
                            const result = p.pass_outcome ? p.pass_outcome : "Complete";
                            const translatedResult = translatePassResult(result);
                            const translatedHeight = translatePassHeight(p.pass_height);
                            const category = classifyPass(p);

                            const categoryLabel = {
                                short: "Curto",
                                medium: "Médio",
                                long: "Lançamento",
                                incomplete: "Errado"
                            }[category] || "-";

                            return `
                                <tr>
                                    <td>${p.minute}'</td>
                                    <td>${escapeHTML(p.player)}</td>
                                    <td>${escapeHTML(p.pass_recipient)}</td>
                                    <td>${escapeHTML(translateTeamName(p.team))}</td>
                                    <td>${categoryLabel}</td>
                                    <td>${escapeHTML(translatedHeight)}</td>
                                    <td>${Number(p.pass_length ?? 0).toFixed(1)}m</td>
                                    <td>${escapeHTML(translatedResult)}</td>
                                </tr>
                            `;
                        }).join("")}
                    </tbody>
                </table>
            </div>
        `;

        const buttons = box.querySelectorAll(".pass-filter-btn");

        buttons.forEach(btn => {
            btn.addEventListener("click", () => {
                renderPassContent(btn.dataset.passMode);
            });
        });
    }

    renderPassContent("all");
}

/* ============================
   ABAS
============================ */

function setupAnalysisTabs() {
    const tabs = document.querySelectorAll(".analysis-tab");
    const panels = document.querySelectorAll(".analysis-tab-content");

    tabs.forEach(tab => {
        tab.addEventListener("click", () => {
            const target = tab.dataset.tab;

            tabs.forEach(t => t.classList.remove("active"));
            panels.forEach(p => p.classList.remove("active"));

            tab.classList.add("active");

            const panel = document.getElementById(target);
            if (panel) {
                panel.classList.add("active");
            }
        });
    });
}

/* ============================
   INIT
============================ */

async function init() {
    try {
        await Promise.all([
            loadSummary(),
            loadArtilheiros(),
            loadRanking("gols", 10),
            loadBrasilCampanha(),
            loadMatches(),
            populateTeamFilter(),
            populateAnalysisMatchSelect(),
        ]);

        setupAnalysisTabs();
    } catch (err) {
        console.error("Erro ao carregar dashboard:", err);
    }

    const rankingOrder = document.getElementById("ranking-order");
    const rankingLimit = document.getElementById("ranking-limit");

    function refreshRanking() {
        const orderBy = rankingOrder ? rankingOrder.value : "gols";
        const limit = rankingLimit ? rankingLimit.value : 10;
        loadRanking(orderBy, limit);
    }

    if (rankingOrder) {
        rankingOrder.addEventListener("change", refreshRanking);
    }

    if (rankingLimit) {
        rankingLimit.addEventListener("change", refreshRanking);
    }
}

init();
/* ============================
   PATCH DE RECUPERAÇÃO PT-BR
============================ */

function formatDateBR(dateValue) {
    if (!dateValue) return "-";

    const date = new Date(`${dateValue}T00:00:00`);

    if (Number.isNaN(date.getTime())) {
        return String(dateValue);
    }

    return date.toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "short",
        year: "numeric"
    }).replaceAll(".", "");
}

function translateStage(stage) {
    const stages = {
        "Group Stage": "Fase de grupos",
        "Round of 16": "Oitavas de final",
        "Quarter-finals": "Quartas de final",
        "Semi-finals": "Semifinal",
        "3rd Place Final": "Disputa do 3º lugar",
        "Final": "Final"
    };

    return stages[stage] || stage || "-";
}

function translateTeamName(team) {
    const teams = {
        "Argentina": "Argentina",
        "Australia": "Austrália",
        "Belgium": "Bélgica",
        "Brazil": "Brasil",
        "Cameroon": "Camarões",
        "Canada": "Canadá",
        "Costa Rica": "Costa Rica",
        "Croatia": "Croácia",
        "Denmark": "Dinamarca",
        "Ecuador": "Equador",
        "England": "Inglaterra",
        "France": "França",
        "Germany": "Alemanha",
        "Ghana": "Gana",
        "Iran": "Irã",
        "Japan": "Japão",
        "Korea Republic": "Coreia do Sul",
        "Mexico": "México",
        "Morocco": "Marrocos",
        "Netherlands": "Holanda",
        "Poland": "Polônia",
        "Portugal": "Portugal",
        "Qatar": "Catar",
        "Saudi Arabia": "Arábia Saudita",
        "Senegal": "Senegal",
        "Serbia": "Sérvia",
        "Spain": "Espanha",
        "Switzerland": "Suíça",
        "Tunisia": "Tunísia",
        "United States": "Estados Unidos",
        "Uruguay": "Uruguai",
        "Wales": "País de Gales"
    };

    return teams[team] || team || "-";
}

function renderTeamPill(team) {
    return `<span class="team-pill">${escapeHTML(translateTeamName(team))}</span>`;
}

function formatScoreWithPenalties(match) {
    if (!match) return "-";

    const home = Number(match.home_score ?? 0);
    const away = Number(match.away_score ?? 0);

    const homeTeam = match.home_team || "";
    const awayTeam = match.away_team || "";
    const stage = match.competition_stage || "";

    const isArgentinaFranceFinal =
        stage === "Final" &&
        (
            (homeTeam === "Argentina" && awayTeam === "France") ||
            (homeTeam === "France" && awayTeam === "Argentina")
        );

    if (isArgentinaFranceFinal && home === 3 && away === 3) {
        return `
            <span class="score-stack">
                <span class="score-main">3 – 3</span>
                <span class="penalty-score">Pênaltis: Argentina 4 – 2 França</span>
            </span>
        `;
    }

    const isMoroccoSpain =
        stage === "Round of 16" &&
        (
            (homeTeam === "Morocco" && awayTeam === "Spain") ||
            (homeTeam === "Spain" && awayTeam === "Morocco")
        );

    if (isMoroccoSpain && home === 0 && away === 0) {
        return `
            <span class="score-stack">
                <span class="score-main">0 – 0</span>
                <span class="penalty-score">Pênaltis: Marrocos 3 – 0 Espanha</span>
            </span>
        `;
    }

    return `
        <span class="score-stack">
            <span class="score-main">${home} – ${away}</span>
        </span>
    `;
}

async function loadBrasilCampanha() {
    const data = await fetchJSON(`${API}/brasil-campanha`);
    const tbody = document.getElementById("brasil-tbody");

    if (!tbody) return;

    tbody.innerHTML = data.campanha.map(j => `
        <tr>
            <td><span class="date-chip">${formatDateBR(j.match_date)}</span></td>
            <td><span class="stage-chip">${escapeHTML(translateStage(j.competition_stage))}</span></td>
            <td>${renderTeamPill(j.opponent)}</td>
            <td class="score-cell">${j.goals ?? "-"} – ${j.gols_sofridos ?? "-"}</td>
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

    if (!tbody) return;

    if (!data.matches.length) {
        tbody.innerHTML = `<tr><td colspan="5" class="loading">Nenhuma partida encontrada</td></tr>`;
        return;
    }

    tbody.innerHTML = data.matches.map(m => `
        <tr>
            <td><span class="date-chip">${formatDateBR(m.match_date)}</span></td>
            <td><span class="stage-chip">${escapeHTML(translateStage(m.competition_stage))}</span></td>
            <td>${renderTeamPill(m.home_team)}</td>
            <td class="score-cell">${formatScoreWithPenalties(m)}</td>
            <td>${renderTeamPill(m.away_team)}</td>
        </tr>
    `).join("");
}

async function populateTeamFilter() {
    const data = await fetchJSON(`${API}/ranking?limit=32`);
    const select = document.getElementById("team-filter");

    if (!select) return;

    const teams = data.ranking.map(r => r.team).sort();

    select.innerHTML = `<option value="">Todas as seleções</option>` +
        teams.map(t => `<option value="${escapeHTML(t)}">${escapeHTML(translateTeamName(t))}</option>`).join("");

    select.addEventListener("change", () => loadMatches(select.value));
}

async function populateAnalysisMatchSelect() {
    const data = await fetchJSON(`${API}/matches`);
    analysisMatches = data.matches;

    const select = document.getElementById("analysis-match-select");

    if (!select) return;

    select.innerHTML = `<option value="">Selecione uma partida</option>` +
        analysisMatches.map(m => `
            <option value="${m.match_id}">
                ${formatDateBR(m.match_date)} - ${translateTeamName(m.home_team)} ${m.home_score} x ${m.away_score} ${translateTeamName(m.away_team)}
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