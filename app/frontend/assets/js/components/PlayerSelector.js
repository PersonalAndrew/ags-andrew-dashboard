import { api } from '../services/api.js';

export class PlayerSelector {
    constructor(selectElement) {
        this.select = selectElement;
        this.onChangeCallback = null;
    }

    async load(defaultPlayerId = '866469') {
        const players = await api.getPlayers();
        this.select.innerHTML = '';

        players.forEach(p => {
            const option = document.createElement('option');
            option.value = p.id;
            option.textContent = p.name;
            if (p.id === defaultPlayerId) {
                option.selected = true;
            }
            this.select.appendChild(option);
        });

        this.select.disabled = false;
        return this.select.value;
    }

    onChange(callback) {
        this.onChangeCallback = callback;
        this.select.addEventListener('change', (e) => {
            this.onChangeCallback(e.target.value);
        });
    }
}
