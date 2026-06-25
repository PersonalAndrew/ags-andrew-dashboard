const comparisonData = {
    england: {
        label: "Inglaterra 2026",
        type: "Seleção",
        metrics: {
            goals: 4,
            xg: 3.38,
            shots: 22,
            shotsOnTarget: 11,
            possession: 52,
            bigChances: 7,
            finalThirdEntries: 40,
            passAccuracy: 86,
        },
    },

    croatia: {
        label: "Croácia 2026",
        type: "Seleção",
        metrics: {
            goals: 2,
            xg: 0.70,
            shots: 10,
            shotsOnTarget: 5,
            possession: 48,
            bigChances: 2,
            finalThirdEntries: 32,
            passAccuracy: 84,
        },
    },

    brazil2022: {
        label: "Brasil 2022",
        type: "Seleção",
        metrics: {
            goals: 8,
            xg: 9.42,
            shots: 88,
            shotsOnTarget: 31,
            possession: 56,
            bigChances: 13,
            finalThirdEntries: 178,
            passAccuracy: 87,
        },
    },

    argentina2022: {
        label: "Argentina 2022",
        type: "Seleção",
        metrics: {
            goals: 15,
            xg: 15.10,
            shots: 104,
            shotsOnTarget: 42,
            possession: 57,
            bigChances: 18,
            finalThirdEntries: 216,
            passAccuracy: 86,
        },
    },

    france2022: {
        label: "França 2022",
        type: "Seleção",
        metrics: {
            goals: 16,
            xg: 13.80,
            shots: 101,
            shotsOnTarget: 38,
            possession: 51,
            bigChances: 17,
            finalThirdEntries: 205,
            passAccuracy: 84,
        },
    },
};

const metricConfig = [
    {
        key: "goals",
        label: "Gols",
        format: "number",
    },
    {
        key: "xg",
        label: "xG",
        format: "decimal",
    },
    {
        key: "shots",
        label: "Finalizações",
        format: "number",
    },
    {
        key: "shotsOnTarget",
        label: "Finalizações no gol",
        format: "number",
    },
    {
        key: "possession",
        label: "Posse de bola",
        format: "percent",
    },
    {
        key: "bigChances",
        label: "Grandes chances",
        format: "number",
    },
    {
        key: "finalThirdEntries",
        label: "Entradas no terço final",
        format: "number",
    },
    {
        key: "passAccuracy",
        label: "Acurácia dos passes",
        format: "percent",
    },
];

function formatMetric(value, format) {
    if (format === "percent") {
        return `${value}%`;
    }

    if (format === "decimal") {
        return Number(value).toFixed(2);
    }

    return value;
}

function getWinnerClass(valueA, valueB) {
    const numberA = Number(valueA);
    const numberB = Number(valueB);

    if (numberA > numberB) return "a";
    if (numberB > numberA) return "b";

    return "draw";
}

function renderComparison() {
    const entityAKey = document.querySelector("#entity-a")?.value;
    const entityBKey = document.querySelector("#entity-b")?.value;
    const box = document.querySelector("#comparison-result-box");

    if (!box) return;

    const entityA = comparisonData[entityAKey];
    const entityB = comparisonData[entityBKey];

    if (!entityA || !entityB) {
        box.innerHTML = `<div class="loading-card">Seleção inválida.</div>`;
        return;
    }

    box.innerHTML = `
        <table class="metric-table">
            <thead>
                <tr>
                    <th>Métrica</th>
                    <th>${entityA.label}</th>
                    <th>${entityB.label}</th>
                    <th>Leitura</th>
                </tr>
            </thead>

            <tbody>
                ${metricConfig
                    .map((metric) => {
                        const valueA = entityA.metrics[metric.key];
                        const valueB = entityB.metrics[metric.key];
                        const winner = getWinnerClass(valueA, valueB);

                        const classA = winner === "a" ? "metric-highlight" : "";
                        const classB = winner === "b" ? "metric-highlight" : "";

                        let reading = "Equilíbrio";

                        if (winner === "a") {
                            reading = `${entityA.label} superior`;
                        }

                        if (winner === "b") {
                            reading = `${entityB.label} superior`;
                        }

                        return `
                            <tr>
                                <td class="metric-name">${metric.label}</td>
                                <td class="${classA}">
                                    ${formatMetric(valueA, metric.format)}
                                </td>
                                <td class="${classB}">
                                    ${formatMetric(valueB, metric.format)}
                                </td>
                                <td>${reading}</td>
                            </tr>
                        `;
                    })
                    .join("")}
            </tbody>
        </table>
    `;
}

function setupModeButtons() {
    const buttons = document.querySelectorAll(".mode-card");

    buttons.forEach((button) => {
        button.addEventListener("click", () => {
            buttons.forEach((item) => item.classList.remove("active"));
            button.classList.add("active");
        });
    });
}

function setupSelectors() {
    const selectors = document.querySelectorAll("#entity-a, #entity-b");

    selectors.forEach((select) => {
        select.addEventListener("change", renderComparison);
    });
}

function initComparativo() {
    setupModeButtons();
    setupSelectors();
    renderComparison();
}

document.addEventListener("DOMContentLoaded", initComparativo);