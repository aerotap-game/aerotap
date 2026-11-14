const PROMO_CODES = {
    "HOBO1": 1500, "START777": 1500, "BOX2026": 1500, "BOMJVIP": 1500, "CASH1500": 1500,
    "METRO1": 1500, "BOTTLE1": 1500, "PITER99": 1500, "GARAGE1": 1500, "PETYA1": 1500,
    "CRYPTO2": 2000, "WIFI2000": 2000, "MINER2": 2000, "DOGE22": 2000, "TON2026": 2000,
    "SHARIK2": 2000, "ROLEX2": 2000, "DUBAI2": 2000, "MURINO2": 2000, "HYPE2000": 2000,
    "PUMP25": 2500, "MOON2500": 2500, "WHALE25": 2500, "GOLD777": 2500, "RICH25": 2500,
    "LAMBO25": 2500, "BOSS2500": 2500, "KING25": 2500, "ALPHA25": 2500, "BETA2500": 2500,
    "DROPHOBO": 3000, "TGE3000": 3000, "LISTING3": 3000, "MARKET3": 3000, "PROFIT3": 3000,
    "LUCKY33": 3000, "JACKPOT3": 3000, "MEGA3000": 3000, "ULTRA3": 3000, "SUPER3000": 3000,
    "FINAL5K": 5000, "LAST5000": 5000, "GOMARS5": 5000, "HOBOKING": 5000, "MILLION5": 5000,
    "TOP5000": 5000, "LEGEND5": 5000, "ELITE5K": 5000, "GIFT5000": 5000, "HOBO2026": 5000
};

function migrateAndProtectSave() {
    const oldV2 = JSON.parse(localStorage.getItem('hobo_os_v2'));
    const master = JSON.parse(localStorage.getItem('hobo_master_save'));
    const source = master || oldV2;

    if (source && typeof state !== 'undefined') {
        state.balance = Math.max(state.balance || 0, source.balance || 0);
        state.totalEarned = Math.max(state.totalEarned || 0, source.totalEarned || 0);
        state.maxEnergy = Math.max(state.maxEnergy || 1000, source.maxEnergy || 1000);
        state.cards = Object.assign({}, source.cards || {}, state.cards || {});
        state.usedPromos = source.usedPromos || [];
        state.dailyStreak = source.dailyStreak || 0;
        state.lastDailyDate = source.lastDailyDate || "";
        state.subDone = source.subDone || false;
        localStorage.setItem('hobo_master_save', JSON.stringify(state));
    }
}

const origSaveState = window.saveState;
window.saveState = function() {
    if (typeof origSaveState === 'function') origSaveState();
    if (typeof state !== 'undefined') {
        localStorage.setItem('hobo_master_save', JSON.stringify(state));
    }
};

function redeemPromoCode() {
    const input = document.getElementById('promo-code-input');
    if (!input) return;
    const code = input.value.trim().toUpperCase();
    if (!code) return notifyDynamicIsland("Введи промокод!", 2500);

    if (!state.usedPromos) state.usedPromos = [];
    if (state.usedPromos.includes(code)) {
        return notifyDynamicIsland("Ты уже активировал этот код!", 3000);
    }

    const reward = PROMO_CODES[code];
    if (!reward) {
        return notifyDynamicIsland("Неверный или просроченный код!", 3000);
    }

    state.usedPromos.push(code);
    state.balance += reward;
    state.totalEarned += reward;
    input.value = '';
    if (window.playSound) playSound('win');
    saveState();
    updateUI();
    notifyDynamicIsland(`Промокод ${code} активирован! +${reward.toLocaleString()} монет!`, 4000);
}

// Рекламный движок (Adsgram)
const ADSGRAM_BLOCK_ID = "int-1234"; // Вставь сюда свой ID из кабинета Adsgram.ai

function watchAdForBonus(rewardType) {
    const giveBonus = () => {
        if (rewardType === 'coins') {
            state.balance += 2500;
            state.totalEarned += 2500;
            notifyDynamicIsland("Реклама просмотрена! +2 500 монет!", 3500);
        } else if (rewardType === 'energy') {
            state.energy = state.maxEnergy;
            notifyDynamicIsland("Батарея заряжена на 100%!", 3000);
        } else if (rewardType === 'safe_try') {
            safeAttemptsLeft += 2;
            notifyDynamicIsland("Добавлено +2 попытки для взлома сейфа!", 3000);
        }
        if (window.playSound) playSound('win');
        saveState();
        updateUI();
    };

    if (window.Adsgram) {
        const AdController = window.Adsgram.init({ blockId: ADSGRAM_BLOCK_ID });
        AdController.show().then(() => {
            giveBonus();
        }).catch(() => {
            notifyDynamicIsland("Реклама пока не загрузилась, попробуй через 10 сек.", 3000);
        });
    } else {
        // Тестовый режим до подключения ID в Adsgram
        giveBonus();
    }
}
let safeSecret = String(Math.floor(100 + Math.random() * 900));
let safeAttemptsLeft = 5;

function switchLogicGame(gameId, btn) {
    document.querySelectorAll('.logic-panel').forEach(p => p.classList.remove('active'));
    document.querySelectorAll('#app-logic .c-tab').forEach(b => b.classList.remove('active'));
    document.getElementById(`logic-${gameId}`).classList.add('active');
    btn.classList.add('active');
    if (gameId === 'memory') initMemoryGame();
}

function uiGuessSafe() {
    const inp = document.getElementById('safe-guess-input');
    const hist = document.getElementById('safe-history');
    const guess = (inp.value || '').trim();
    if (!/^\d{3}$/.test(guess)) return notifyDynamicIsland("Введи ровно 3 цифры!", 2500);
    if (safeAttemptsLeft <= 0) return notifyDynamicIsland("Попытки кончились! Посмотри рекламу для +2 попыток.", 3500);

    safeAttemptsLeft--;
    inp.value = '';
    let bulls = 0, cows = 0;
    for (let i = 0; i < 3; i++) {
        if (guess.at(i) === safeSecret.at(i)) bulls++;
        else if (safeSecret.includes(guess.at(i))) cows++;
    }

    const row = document.createElement('div');
    row.className = 'safe-row';
    row.innerHTML = `<span>Код: <b>${guess}</b></span><span>🎯 Точно: ${bulls} | 🔄 Есть: ${cows} (ост: ${safeAttemptsLeft})</span>`;
    hist.prepend(row);

    if (bulls === 3) {
        state.balance += 1500;
        state.totalEarned += 1500;
        if (window.playSound) playSound('win');
        notifyDynamicIsland(`СЕЙФ ВЗЛОМАН (${safeSecret})! +1 500 монет!`, 4500);
        safeSecret = String(Math.floor(100 + Math.random() * 900));
        safeAttemptsLeft = 5;
        hist.innerHTML = '';
        saveState(); updateUI();
    } else if (safeAttemptsLeft === 0) {
        notifyDynamicIsland(`Блокировка! Код был ${safeSecret}. Сгенерирован новый.`, 4000);
        safeSecret = String(Math.floor(100 + Math.random() * 900));
        safeAttemptsLeft = 5;
        hist.innerHTML = '';
    }
}

let memCards = [], memFlipped = [], memMatched = 0;

function initMemoryGame() {
    const grid = document.getElementById('memory-grid');
    if (!grid) return;
    const icons = Array.of("🍾", "💎", "🚀", "🐀", "💵", "🐕");
    memCards = icons.concat(icons).sort(() => Math.random() - 0.5);
    memFlipped = [];
    memMatched = 0;
    grid.innerHTML = '';

    memCards.forEach((icon, idx) => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'mem-card';
        btn.innerText = '❓';
        btn.onclick = () => {
            if (btn.classList.contains('open') || memFlipped.length >= 2) return;
            btn.classList.add('open');
            btn.innerText = icon;
            memFlipped.push({ btn, icon, idx });

            if (memFlipped.length === 2) {
                const a = memFlipped.at(0), b = memFlipped.at(1);
                if (a.icon === b.icon) {
                    memMatched++;
                    memFlipped = [];
                    if (memMatched === 6) {
                        state.balance += 1000;
                        state.totalEarned += 1000;
                        if (window.playSound) playSound('win');
                        notifyDynamicIsland("Все пары найдены! +1 000 монет!", 4000);
                        saveState(); updateUI();
                    }
                } else {
                    setTimeout(() => {
                        a.btn.classList.remove('open'); a.btn.innerText = '❓';
                        b.btn.classList.remove('open'); b.btn.innerText = '❓';
                        memFlipped = [];
                    }, 600);
                }
            }
        };
        grid.appendChild(btn);
    });
}

function buyMaxEnergy() {
    const cost = Math.floor(2000 * Math.pow(1.5, ((state.maxEnergy - 1000) / 500)));
    if (state.balance < cost) return notifyDynamicIsland("Не хватает монет на батарею!", 2500);
    state.balance -= cost;
    state.maxEnergy += 500;
    state.energy = state.maxEnergy;
    document.getElementById('battery-cost').innerText = Math.floor(2000 * Math.pow(1.5, ((state.maxEnergy - 1000) / 500))).toLocaleString();
    saveState(); updateUI();
    notifyDynamicIsland(`Емкость батареи увеличена до ${state.maxEnergy}!`, 3000);
}

function claimDailyReward() {
    const today = new Date().toDateString();
    if (state.lastDailyDate === today) return notifyDynamicIsland("Ты уже забрал паек сегодня! Приходи завтра.", 3000);
    state.lastDailyDate = today;
    state.dailyStreak = (state.dailyStreak || 0) + 1;
    const reward = Math.min(10000, state.dailyStreak * 1000);
    state.balance += reward;
    state.totalEarned += reward;
    saveState(); updateUI();
    notifyDynamicIsland(`День ${state.dailyStreak}! Получено +${reward.toLocaleString()} монет!`, 4000);
}

function completeSubTask() {
    if (state.subDone) return notifyDynamicIsland("Награда за подписку уже получена!", 2500);
    if (window.Telegram?.WebApp?.openTelegramLink) {
        window.Telegram.WebApp.openTelegramLink("https://t.me");
    }
    state.subDone = true;
    state.balance += 5000;
    state.totalEarned += 5000;
    saveState(); updateUI();
    notifyDynamicIsland("Спасибо за подписку! +5 000 монет на базе!", 4000);
}

function renderLeaderboard() {
    const list = document.getElementById('leaderboard-list');
    if (!list) return;
    const rivals = Array.of(
        { name: "👑 Дуров на минималках", score: 15000000 },
        { name: "🎩 Олигарх с Рублевки", score: 4500000 },
        { name: "💻 Дядя Петя (Инсайдер)", score: 850000 },
        { name: "🐕 Шарик Крипто-Пес", score: 120000 },
        { name: "📦 Вася из Пятерочки", score: 15000 },
        { name: "😎 ТЫ (Бомж Инвестор)", score: Math.floor(state.totalEarned || 0), me: true }
    ).sort((a, b) => b.score - a.score);

    list.innerHTML = rivals.map((r, i) => `<div class="top-row ${r.me ? 'me' : ''}"><span><b>#${i + 1}</b> ${r.name}</span><b>🪙 ${r.score.toLocaleString()}</b></div>`).join('');
}

function inviteFriend() {
    const link = "https://t.me/share/url?url=https://t.me&text=" + encodeURIComponent("Залетай в Бомж Инвестор ($HOBO) и лутай монеты до листинга!");
    if (window.Telegram?.WebApp?.openTelegramLink) window.Telegram.WebApp.openTelegramLink(link);
    state.balance += 3000;
    state.totalEarned += 3000;
    saveState(); updateUI();
    notifyDynamicIsland("Бонус +3 000 монет за приглашение!", 3500);
}

document.addEventListener('DOMContentLoaded', () => {
    migrateAndProtectSave();
    if (typeof updateUI === 'function') updateUI();
    renderLeaderboard();
    const origOpen = window.openApp;
    window.openApp = function(appId) {
        if (typeof origOpen === 'function') origOpen(appId);
        if (appId === 'app-top') renderLeaderboard();
        if (appId === 'app-logic') {
            document.getElementById('logic-bal-mini').innerText = Math.floor(state.balance).toLocaleString();
            initMemoryGame();
        }
    };
});
