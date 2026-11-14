// empire.js — Сбалансированная экономика $HOBO (10 000 игровых = 1 реальный токен)

const HOBO_RANKS = [
    { level: 1, name: "Коробка у Пятерочки", minEarned: 0, icon: "📦", tapPower: 1 },
    { level: 2, name: "Теплотрасса Люкс", minEarned: 25000, icon: "♨️", tapPower: 2 },
    { level: 3, name: "Хостел с клопами", minEarned: 150000, icon: "🛏️", tapPower: 4 },
    { level: 4, name: "Крипто-подвал", minEarned: 750000, icon: "💻", tapPower: 7 },
    { level: 5, name: "Однушка в Мурино", minEarned: 3000000, icon: "🏢", tapPower: 12 },
    { level: 6, name: "Пентхаус в Дубае", minEarned: 15000000, icon: "🏙️", tapPower: 20 }
];

const UPGRADE_CARDS = [
    // Ветка 1: УЛИЦА
    {
        id: "street_bottles",
        category: "street",
        name: "Сбор стеклотары",
        desc: "Утренний обход парков. Мелочь, а приятно.",
        baseCost: 150,
        baseProfit: 20, // в час
        costMultiplier: 1.65,
        profitMultiplier: 1.25,
        icon: "🍾"
    },
    {
        id: "street_metro",
        category: "street",
        name: "Точка у метро",
        desc: "Картонка «Помогите на газ для транзакций».",
        baseCost: 800,
        baseProfit: 95,
        costMultiplier: 1.7,
        profitMultiplier: 1.28,
        icon: "🚇"
    },
    {
        id: "street_metal",
        category: "street",
        name: "Приемка цветмета",
        desc: "Скупаем старые кабели у местных электриков.",
        baseCost: 4500,
        baseProfit: 420,
        costMultiplier: 1.75,
        profitMultiplier: 1.3,
        icon: "🧲"
    },
    {
        id: "street_dog",
        category: "street",
        name: "Пес Шарик (Защита)",
        desc: "Кусает тех, кто пытается обчистить твою коробку.",
        baseCost: 5000,
        baseProfit: 150,
        defenseBonus: 20,
        costMultiplier: 1.8,
        profitMultiplier: 1.2,
        icon: "🐕"
    },

    // Ветка 2: КРИПТА
    {
        id: "crypto_wifi",
        category: "crypto",
        name: "Wi-Fi у Макдака",
        desc: "Ловим халявный инет для ловли ретродропов.",
        baseCost: 2200,
        baseProfit: 240,
        costMultiplier: 1.7,
        profitMultiplier: 1.28,
        icon: "📶"
    },
    {
        id: "crypto_laptop",
        category: "crypto",
        name: "Ноут со свалки",
        desc: "Греет руки зимой и крутит ноды.",
        baseCost: 12000,
        baseProfit: 1100,
        costMultiplier: 1.75,
        profitMultiplier: 1.32,
        icon: "💻"
    },
    {
        id: "crypto_signals",
        category: "crypto",
        name: "Инсайды Дяди Пети",
        desc: "Закрытый чат аналитиков из гаражей.",
        baseCost: 65000,
        baseProfit: 4800,
        costMultiplier: 1.8,
        profitMultiplier: 1.35,
        icon: "📈"
    },

    // Ветка 3: ЛАКШЕРИ
    {
        id: "lux_suit",
        category: "luxury",
        name: "Пиджак из секонда",
        desc: "Солидный вид для переговоров у ларька.",
        baseCost: 18000,
        baseProfit: 1500,
        costMultiplier: 1.75,
        profitMultiplier: 1.3,
        icon: "🧥"
    },
    {
        id: "lux_rolex",
        category: "luxury",
        name: "Паль Rolex с рынка",
        desc: "Светится в темноте, повышает авторитет.",
        baseCost: 95000,
        baseProfit: 6500,
        costMultiplier: 1.85,
        profitMultiplier: 1.35,
        icon: "⌚"
    }
];

class EmpireManager {
    constructor(state) {
        this.state = state;
        if (!this.state.cards) this.state.cards = {};
        UPGRADE_CARDS.forEach(c => {
            if (this.state.cards[c.id] === undefined) this.state.cards[c.id] = 0;
        });
    }

    getCardCost(cardId) {
        const card = UPGRADE_CARDS.find(c => c.id === cardId);
        const lvl = this.state.cards[cardId] || 0;
        return Math.floor(card.baseCost * Math.pow(card.costMultiplier, lvl));
    }

    getCardProfit(cardId) {
        const card = UPGRADE_CARDS.find(c => c.id === cardId);
        const lvl = this.state.cards[cardId] || 0;
        if (lvl === 0) return 0;
        return Math.floor(card.baseProfit * Math.pow(card.profitMultiplier, lvl - 1));
    }

    getNextLevelProfitDiff(cardId) {
        const card = UPGRADE_CARDS.find(c => c.id === cardId);
        const lvl = this.state.cards[cardId] || 0;
        if (lvl === 0) return card.baseProfit;
        return Math.floor(card.baseProfit * Math.pow(card.profitMultiplier, lvl)) - this.getCardProfit(cardId);
    }

    getTotalProfitPerHour() {
        return UPGRADE_CARDS.reduce((sum, c) => sum + this.getCardProfit(c.id), 0);
    }

    getTotalDefense() {
        return UPGRADE_CARDS.reduce((sum, c) => sum + (c.defenseBonus ? c.defenseBonus * (this.state.cards[c.id] || 0) : 0), 0);
    }

    // Конвертер для отображения реального баланса токенов в UI
    getEstimatedRealTokens() {
        return (this.state.balance / 10000).toFixed(2);
    }

    buyUpgrade(cardId) {
        const cost = this.getCardCost(cardId);
        if (this.state.balance < cost) {
            return { success: false, message: "Не хватает фантиков $HOBO!" };
        }
        this.state.balance -= cost;
        this.state.cards[cardId] = (this.state.cards[cardId] || 0) + 1;

        if (window.playSound) window.playSound('upgrade');
        if (window.Telegram?.WebApp?.HapticFeedback) {
            window.Telegram.WebApp.HapticFeedback.notificationOccurred('success');
        }
        return { success: true };
    }

    getCurrentRank() {
        let current = HOBO_RANKS;
        for (let i = 0; i < HOBO_RANKS.length; i++) {
            if ((this.state.totalEarned || 0) >= HOBO_RANKS[i].minEarned) {
                current = HOBO_RANKS[i];
            }
        }
        return current;
    }

    renderCards(category = 'street', containerId = 'cards-container', onUpdate) {
        const container = document.getElementById(containerId);
        if (!container) return;
        container.innerHTML = '';

        UPGRADE_CARDS.filter(c => c.category === category).forEach(card => {
            const lvl = this.state.cards[card.id] || 0;
            const cost = this.getCardCost(card.id);
            const diff = this.getNextLevelProfitDiff(card.id);
            const canAfford = this.state.balance >= cost;

            const el = document.createElement('div');
            el.className = `hobo-card ${canAfford ? 'affordable' : 'locked'}`;
            el.innerHTML = `
                <div class="card-top">
                    <span class="card-icon">${card.icon}</span>
                    <div class="card-info">
                        <h4>${card.name} <span class="lvl-badge">ур. ${lvl}</span></h4>
                        <p>${card.desc}</p>
                    </div>
                </div>
                <div class="card-bottom">
                    <span class="profit-tag">+${diff} /ч</span>
                    <button class="buy-btn" ${!canAfford ? 'disabled' : ''}>
                        💰 ${cost.toLocaleString()}
                    </button>
                </div>
            `;
            el.querySelector('.buy-btn').addEventListener('click', () => {
                if (this.buyUpgrade(card.id).success && onUpdate) onUpdate();
            });
            container.appendChild(el);
        });
    }
}

window.EmpireManager = EmpireManager;
window.HOBO_RANKS = HOBO_RANKS;
