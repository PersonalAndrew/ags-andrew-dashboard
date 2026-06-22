export class StatsRadar {
    constructor(canvasElement) {
        this.canvas = canvasElement;
        this.chart = null;
    }

    render(stats) {
        const labels = [
            'Passes Certos',
            'Passes Totais',
            'Dribles',
            'Desarmes',
            'Duelos Ganhos',
            'Recuperações',
            'Finalizações',
            'Faltas Sofridas'
        ];

        const values = [
            stats.accuratePass || 0,
            stats.totalPass || 0,
            stats.duelWon || 0,
            stats.wonTackle || 0,
            stats.duelWon || 0,
            stats.interceptions || 0,
            stats.onTargetScoringAttempt || 0,
            stats.wasFouled || 0
        ];

        const maxVal = Math.max(...values, 1);

        if (this.chart) {
            this.chart.destroy();
        }

        this.chart = new Chart(this.canvas.getContext('2d'), {
            type: 'radar',
            data: {
                labels,
                datasets: [{
                    label: 'Atributos do Jogador',
                    data: values.map(v => (v / maxVal) * 100),
                    backgroundColor: 'rgba(16, 185, 129, 0.2)',
                    borderColor: '#10b981',
                    pointBackgroundColor: '#10b981',
                    pointBorderColor: '#fff',
                    pointHoverBackgroundColor: '#fff',
                    pointHoverBorderColor: '#10b981',
                    borderWidth: 2
                }]
            },
            options: {
                responsive: true,
                scales: {
                    r: {
                        angleLines: { color: 'rgba(255, 255, 255, 0.1)' },
                        grid: { color: 'rgba(255, 255, 255, 0.1)' },
                        pointLabels: {
                            color: '#94a3b8',
                            font: { family: 'Outfit', size: 11 }
                        },
                        ticks: { display: false, max: 100 }
                    }
                },
                plugins: {
                    legend: { display: false }
                }
            }
        });
    }

    destroy() {
        if (this.chart) {
            this.chart.destroy();
            this.chart = null;
        }
    }
}
