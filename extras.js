const IPHONE_THEMES = [
    { id: "default", name: "Классика Hobo", cost: 0, bg: "radial-gradient(circle at 80% 10%, #193d29 0%, #0b0f17 45%, #050609 100%)" },
    { id: "cyber", name: "Неон Киберпанк", cost: 3000, bg: "radial-gradient(circle at 20% 15%, #3b145c 0%, #120924 50%, #05040a 100%)" },
    { id: "gold", name: "Золото Олигарха", cost: 10000, bg: "radial-gradient(circle at 80% 10%, #4a3508 0%, #1a1406 50%, #080602 100%)" },
    { id: "dubai", name: "Ночной Дубай", cost: 25000, bg: "radial-gradient(circle at 50% 0%, #0e3b5e 0%, #071324 55%, #03060c 100%)" }
];

const HOBO_NEWS = [
    "📰 Дядя Петя случайно купил биткоин в 2011 году, но забыл пароль от флешки.",
    "📈 Пункт приема стеклотары у Пятерочки вышел на IPO. Акции растут!",
    "🐕 Пес Шарик возглавил службу безопасности крипто-биржи Hobo Exchange.",
    "🚀 Аналитики из гаража прогнозируют памп $HOBO сразу после листинга.",
    "💳 Владельцы черных карт Mastercard получат приоритетный доступ к AirDrop."
];

function applySavedTheme() {
    if (typeof state === 'undefined') return;
    if (!state.ownedThemes) state.ownedThemes = ["default"];
    const activeId = state.activeTheme || "default";
    const theme = IPHONE_THEMES.find(t => t.id === activeId) || IPHONE_THEMES.at(0);
    const frame = document.querySelector('.iphone-frame');
    if (frame && theme) frame.style.background = theme.bg;
}

function selectOrBuyTheme(id) {
    const theme = IPHONE_THEMES.find(t => t.id === id);
    if (!theme) return;
    if (!state.ownedThemes) state.ownedThemes = ["default"];

    if (state.ownedThemes.includes(id)) {
        state.activeTheme = id;
        applySavedTheme();
        saveState();
        renderExtrasUI();
        return notifyDynamicIsland(`Установлены обои: ${theme.name}`, 2500);
    }

    if (state.balance < theme.cost) {
        return notifyDynamicIsland(`Не хватает монет! Нужно ${theme.cost.toLocaleString()}`, 2500);
    }

    state.balance -= theme.cost;
    state.ownedThemes.push(id);
    state.activeTheme = id;
    if (window.playSound) playSound('win');
    applySavedTheme();
    saveState();
    updateUI();
    renderExtrasUI();
    notifyDynamicIsland(`Куплены обои «${theme.name}»!`, 3500);
}
const ACHIEVEMENTS = [
    { id: "ach_1k", title: "Первая тысяча", desc: "Накопить 1 000 монет", check: () => state.totalEarned >= 1000, reward: 500 },
    { id: "ach_25k", title: "Уважаемый человек", desc: "Накопить 25 000 монет", check: () => state.totalEarned >= 25000, reward: 2500 },
    { id: "ach_100k", title: "Крипто-кит района", desc: "Накопить 100 000 монет", check: () => state.totalEarned >= 100000, reward: 10000 }
];

function claimAchievement(id) {
    const ach = ACHIEVEMENTS.find(a => a.id === id);
    if (!ach || !ach.check()) return;
    if (!state.claimedAchs) state.claimedAchs = [];
    if (state.claimedAchs.includes(id)) return;

    state.claimedAchs.push(id);
    state.balance += ach.reward;
    state.totalEarned += ach.reward;
    if (window.playSound) playSound('win');
    saveState(); updateUI(); renderExtrasUI();
    notifyDynamicIsland(`Достижение «${ach.title}»! +${ach.reward.toLocaleString()} монет!`, 4000);
}

function renderExtrasUI() {
    const boostsBody = document.querySelector('#app-boosts .app-body');
    if (boostsBody) {
        let shopBox = document.getElementById('theme-shop-box');
        if (!shopBox) {
            shopBox = document.createElement('div');
            shopBox.id = 'theme-shop-box';
            shopBox.className = 'game-box';
            boostsBody.appendChild(shopBox);
        }
        const owned = state.ownedThemes || ["default"];
        const active = state.activeTheme || "default";
        shopBox.innerHTML = `<h3>🎨 Обои для iPhone</h3><p>Меняй стиль своего рабочего стола!</p>` +
            IPHONE_THEMES.map(t => {
                const isOwned = owned.includes(t.id);
                const label = active === t.id ? "✅ Активно" : (isOwned ? "Выбрать" : `🪙 ${t.cost.toLocaleString()}`);
                return `<div style="display:flex;justify-content:space-between;align-items:center;margin-top:8px;padding-top:8px;border-top:1px solid rgba(255,255,255,.08);">
                    <span style="font-size:13px;font-weight:600;">${t.name}</span>
                    <button type="button" class="buy-btn" onclick="selectOrBuyTheme('${t.id}')">${label}</button>
                </div>`;
            }).join('');
    }

    const topBody = document.querySelector('#app-top .app-body');
    if (topBody) {
        let achBox = document.getElementById('ach-list-box');
        if (!achBox) {
            achBox = document.createElement('div');
            achBox.id = 'ach-list-box';
            achBox.className = 'game-box';
            achBox.style.marginTop = '12px';
            topBody.appendChild(achBox);
        }
        const claimed = state.claimedAchs || [];
        achBox.innerHTML = `<h3>🎖️ Достижения</h3>` + ACHIEVEMENTS.map(a => {
            const done = claimed.includes(a.id);
            const ready = !done && a.check();
            const btnHtml = done ? `<span class="neon-green" style="font-size:12px;">Получено</span>` :
                (ready ? `<button type="button" class="buy-btn" onclick="claimAchievement('${a.id}')">+${a.reward}</button>` :
                `<span style="font-size:11px;color:#8e92a4;">В процессе</span>`);
            return `<div style="display:flex;justify-content:space-between;align-items:center;margin-top:8px;padding-top:8px;border-top:1px solid rgba(255,255,255,.08);">
                <div><div style="font-size:13px;font-weight:700;">${a.title}</div><div style="font-size:11px;color:#9498ab;">${a.desc}</div></div>
                ${btnHtml}
            </div>`;
        }).join('');
    }
}

document.addEventListener('DOMContentLoaded', () => {
    applySavedTheme();
    renderExtrasUI();

    const bankBody = document.querySelector('#app-bank .app-body');
    if (bankBody) {
        const newsBox = document.createElement('div');
        newsBox.className = 'game-box';
        newsBox.innerHTML = `<h3>📡 Сводка биржи</h3><p id="bank-news-text" style="color:#fff;margin-top:4px;">${HOBO_NEWS.at(0)}</p>`;
        bankBody.appendChild(newsBox);
    }

    const prevOpen = window.openApp;
    window.openApp = function(id) {
        if (typeof prevOpen === 'function') prevOpen(id);
        renderExtrasUI();
        if (id === 'app-bank') {
            const nt = document.getElementById('bank-news-text');
            if (nt) nt.innerText = HOBO_NEWS.at(Math.floor(Math.random() * HOBO_NEWS.length));
        }
    };
});
