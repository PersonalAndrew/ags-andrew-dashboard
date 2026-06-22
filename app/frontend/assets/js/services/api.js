class ApiClient {
    async getPlayers() {
        const response = await fetch('/api/players');
        const data = await response.json();
        return data.players || [];
    }

    async getDashboardData(playerId) {
        const response = await fetch(`/api/dashboard-data?player_id=${playerId}`);
        return response.json();
    }
}

export const api = new ApiClient();
