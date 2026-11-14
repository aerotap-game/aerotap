const HOBO_RANKS = [
    { level: 1, name: "Коробка у Пятерочки", minEarned: 0, icon: "📦", tapPower: 1 },
    { level: 2, name: "Теплотрасса Люкс", minEarned: 30000, icon: "♨️", tapPower: 2 },
    { level: 3, name: "Хостел с клопами", minEarned: 200000, icon: "🛏️", tapPower: 4 },
    { level: 4, name: "Крипто-подвал", minEarned: 1000000, icon: "💻", tapPower: 7 },
    { level: 5, name: "Однушка в Мурино", minEarned: 4500000, icon: "🏢", tapPower: 12 },
    { level: 6, name: "Пентхаус в Дубае", minEarned: 20000000, icon: "🏙️", tapPower: 20 }
];

const UPGRADE_CARDS = [
    { id: "street_bottles", category: "street", name: "Сбор стеклотары", desc: "Утренний обход парков.", baseCost: 150, baseProfit: 25, costMult: 1.65, profMult: 1.25, icon: "🍾" },
    { id: "street_metro", category: "street", name: "Точка у метро", desc: "Табличка «Помогите на газ».", baseCost: 850, baseProfit: 110, costMult: 1.7, profMult: 1.28, icon: "🚇" },
    { id: "street_metal", category: "street", name: "Приемка цветмета", desc: "Скупаем старые кабели.", baseCost: 4800, baseProfit: 480, costMult: 1.75, profMult: 1.3, icon: "🧲" },
    { id: "street_dog", category: "street", name: "Пес Шарик (Защита)", desc: "Охраняет коробку от налетов.", baseCost: 5000, baseProfit: 160, defenseBonus: 25, costMult: 1.8, profMult: 1.2, icon: "🐕" },
    { id: "crypto_wifi", category: "crypto", name: "Wi-Fi у Макдака", desc: "Ловим инет для ретродропов.", baseCost: 2400, baseProfit: 270, costMult: 1.7, profMult: 1.28, icon: "📶" },
    { id: "crypto_laptop", category: "crypto", name: "Ноут со свалки", desc: "Греет коробку и крутит ноды.", baseCost: 13000, baseProfit: 1250, costMult: 1.75, profMult: 1.32, icon: "💻" },
    { id: "crypto_signals", category: "crypto", name: "Инсайды Дяди Пети", desc: "Чат аналитиков из гаражей.", baseCost: 70000, baseProfit: 5200, costMult: 1.8, profMult: 1.35, icon: "📈" },
    { id: "lux_suit", category: "luxury", name: "Пиджак из секонда", desc: "Солидный вид у ларька.", baseCost: 20000, baseProfit: 1700, costMult: 1.75, profMult: 1.3, icon: "🧥" },
    { id: "lux_rolex", category: "luxury", name: "Паль Rolex с рынка", desc: "Светится в темноте.", baseCost: 100000, baseProfit: 7200, costMult: 1.85, profMult: 1.35, icon: "⌚" }
];

class EmpireManager {
    constructor(state) {
        this.state = state;
        if (!this.state.cards) this.state.cards = {};
        UPGRADE_CARDS.forEach(c => {
            if (this.state.cards[c.id] === undefined) this.state.cards[c.id] = 0;
        });
    }

    getCardCost(id) {
        const c = UPGRADE_CARDS.find(x => x.id === id);
        const lvl = this.state.cards[id] || 0;
        return Math.floor(c.baseCost * Math.pow(c.costMult, lvl));
    }

    getCardProfit(id) {
        const c = UPGRADE_CARDS.find(x => x.id === id);
        const lvl = this.state.cards[id] || 0;
        return lvl === 0 ? 0 : Math.floor(c.baseProfit * Math.pow(c.profMult, lvl - 1));
    }

    getNextDiff(id) {
        const c = UPGRADE_CARDS.find(x => x.id === id);
        const lvl = this.state.cards[id] || 0;
        if (lvl === 0) return c.baseProfit;
        return Math.floor(c.baseProfit * Math.pow(c.profMult, lvl)) - this.getCardProfit(id);
    }

    getTotalProfitPerHour() {
        return UPGRADE_CARDS.reduce((sum, c) => sum + this.getCardProfit(c.id), 0);
    }

    getTotalDefense() {
        return UPGRADE_CARDS.reduce((sum, c) => sum + (c.defenseBonus ? c.defenseBonus * (this.state.cards[c.id] || 0) : 0), 0);
    }

    buyUpgrade(id) {
        const cost = this.getCardCost(id);
        if (this.state.balance < cost) return { success: false, message: "Не хватает монет!" };
        this.state.balance -= cost;
        this.state.cards[id] = (this.state.cards[id] || 0) + 1;
        if (window.playSound) window.playSound('upgrade');
        return { success: true };
    }

    getCurrentRank() {
        let current = HOBO_RANKS;
        for (let i = 0; i < HOBO_RANKS.length; i++) {
            if ((this.state.totalEarned || 0) >= HOBO_RANKS[i].minEarned) current = HOBO_RANKS[i];
        }
        return current;
    }

    renderCards(category, containerId, onUpdate) {
        const box = document.getElementById(containerId);
        if (!box) return;
        box.innerHTML = '';

        UPGRADE_CARDS.filter(c => c.category === category).forEach(card => {
            const lvl = this.state.cards[card.id] || 0;
            const cost = this.getCardCost(card.id);
            const diff = this.getNextDiff(card.id);
            const ok = this.state.balance >= cost;

            const el = document.createElement('div');
            el.className = 'hobo-card';
            el.innerHTML = `
                <div class="card-top">
                    <span class="card-icon">${card.icon}</span>
                    <div class="card-info">
                        <h4>${card.name} <small>(ур. ${lvl})</small></h4>
                        <p>${card.desc}</p>
                    </div>
                </div>
                <div class="card-bottom">
                    <span class="profit-tag">+${diff} /ч</span>
                    <button class="buy-btn" ${!ok ? 'disabled' : ''}>🪙 ${cost.toLocaleString()}</button>
                </div>
            `;
            el.querySelector('.buy-btn').addEventListener('click', () => {
                if (this.buyUpgrade(card.id).success && onUpdate) onUpdate();
            });
            box.appendChild(el);
        });
    }
}

window.EmpireManager = EmpireManager;
window.HOBO_RANKS = HOBO_RANKS;
