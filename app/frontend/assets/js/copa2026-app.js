const copa2026State = {
    match: {
        competition: "Copa do Mundo 2026",
        source: "SofaScore",
        homeTeam: "Inglaterra",
        awayTeam: "Croácia",
        homeCode: "ENG",
        awayCode: "CRO",
        homeScore: 4,
        awayScore: 2,
        status: "Página-base criada",
    },

    nextModules: [
        "Estatísticas gerais",
        "Finalizações",
        "Ranking dos jogadores",
        "Momentum",
        "Eventos da partida",
        "Posições médias",
    ],
};

function logCopa2026Status() {
    console.log("Copa 2026 carregada:", copa2026State.match);
    console.log("Módulos planejados:", copa2026State.nextModules);
}

document.addEventListener("DOMContentLoaded", () => {
    logCopa2026Status();
});