const tg = window.Telegram && window.Telegram.WebApp ? window.Telegram.WebApp : null;
let userId = 'pilot_' + Math.floor(Math.random() * 100000);
let myPilotName = 'Ты (Пилот)';

if (tg) {
    tg.expand();
    tg.ready();
    if (tg.initDataUnsafe && tg.initDataUnsafe.user) {
        const user = tg.initDataUnsafe.user;
        userId = user.id;
        myPilotName = user.first_name || 'Пилот';
        document.getElementById('pilot-name').innerText = myPilotName;
        document.getElementById('avatar').innerText = myPilotName.charAt(0).toUpperCase();
    }
}

const BOT_USERNAME = 'aerotap_bot';
const CHANNEL_USERNAME = 'aerotap';
const SAVE_KEY = 'aerotap_player_data';

const defaultState = {
    balance: 0,
    totalTaps: 0,
    fuel: 1000,
    maxFuel: 1000,
    tapPower: 1,
    tapLevel: 1,
    tapCost: 100,
    fuelLevel: 1,
    fuelCost: 150,
    profitPerHour: 0,
    lastDaily: '',
    lastCupcakeTime: 0,
    lastSpinTime: 0,
    lastInviteTime: 0,
    cipherClaimed: false,
    lastExitTime: Date.now(),
    refCount: 0,
    refEarned: 0,
    tasks: { tg: false, yt: false },
    cards: {
        hub: { level: 0, cost: 300, profit: 450 },
        vip: { level: 0, cost: 1200, profit: 1800 },
        cargo: { level: 0, cost: 5000, profit: 7500 },
        space: { level: 0, cost: 25000, profit: 40000 }
    }
};

function loadSavedState() {
    let raw = localStorage.getItem(SAVE_KEY);
    if (!raw) {
        const oldKeys = ['aerotap_save_v8', 'aerotap_save_v7', 'aerotap_save_v6', 'aerotap_save_v5', 'aerotap_save_v4', 'aerotap_save_v3', 'aerotap_save'];
        for (let i = 0; i < oldKeys.length; i++) {
            const oldData = localStorage.getItem(oldKeys[i]);
            if (oldData) {
                raw = oldData;
                break;
            }
        }
    }
    if (!raw) return JSON.parse(JSON.stringify(defaultState));
    try {
        const parsed = JSON.parse(raw);
        const merged = Object.assign({}, defaultState, parsed);
        merged.tasks = Object.assign({}, defaultState.tasks, parsed.tasks || {});
        merged.cards = Object.assign({}, defaultState.cards, parsed.cards || {});
        return merged;
    } catch (e) {
        return JSON.parse(JSON.stringify(defaultState));
    }
}

let state = loadSavedState();

const rivals = [
    { name: 'Captain_TON', rank: 'Космонавт $AERO', score: 850000 },
    { name: 'SkyWalker_99', rank: 'Ас Истребитель', score: 420000 },
    { name: 'AeroWhale 🐋', rank: 'Ас Истребитель', score: 195000 },
    { name: 'Maverick_Jet', rank: 'Капитан', score: 88000 },
    { name: 'CryptoPilot', rank: 'Капитан', score: 42000 },
    { name: 'Falcon_X', rank: 'Второй пилот', score: 18500 },
    { name: 'JetStream', rank: 'Второй пилот', score: 7400 },
    { name: 'CloudRunner', rank: 'Кадет', score: 2900 },
    { name: 'WingMan', rank: 'Кадет', score: 950 },
    { name: 'NoviceFlyer', rank: 'Кадет', score: 250 }
];

const cardMeta = [
    { id: 'hub', icon: '🛫', name: 'Взлетная полоса', desc: 'Региональные рейсы' },
    { id: 'vip', icon: '🥂', name: 'Бизнес-терминал', desc: 'Обслуживание джетов' },
    { id: 'cargo', icon: '📦', name: 'Грузовой хаб $AERO', desc: 'Мировая логистика' },
    { id: 'space', icon: '🛰️', name: 'Орбитальный космопорт', desc: 'Рейсы на Луну и Марс' }
];

const ranks = [
    { min: 0, title: 'Кадет', icon: '🛩️', model: 'Cessna 172', league: '🥉 Бронзовая лига' },
    { min: 2500, title: 'Второй пилот', icon: '🛫', model: 'Boeing 737', league: '🥈 Серебряная лига' },
    { min: 15000, title: 'Капитан', icon: '✈️', model: 'Airbus A380', league: '🥇 Золотая лига' },
    { min: 75000, title: 'Ас Истребитель', icon: '🚀', model: 'F-22 Raptor', league: '💎 Платиновая лига' },
    { min: 300000, title: 'Космонавт $AERO', icon: '🛸', model: 'Aero Starship', league: '👑 Бриллиантовая лига' }
];

let isTurbo = false;
let turboCooldown = 0;
let comboStreak = 0;

function saveState() {
    state.lastExitTime = Date.now();
    localStorage.setItem(SAVE_KEY, JSON.stringify(state));
}

function showMsg(text) {
    if (tg && tg.showAlert) {
        try { tg.showAlert(text); } catch (e) { alert(text); }
    } else {
        alert(text);
    }
}

function formatTimeLeft(ms) {
    const totalSec = Math.ceil(ms / 1000);
    const hrs = Math.floor(totalSec / 3600);
    const mins = Math.floor((totalSec % 3600) / 60);
    const secs = totalSec % 60;
    if (hrs > 0) return hrs + 'ч ' + mins + 'м';
    if (mins > 0) return mins + 'м ' + secs + 'с';
    return secs + 'с';
}
function checkOfflineEarnings() {
    if (state.profitPerHour > 0 && state.lastExitTime) {
        const now = Date.now();
        const secondsPassed = Math.min(10800, Math.floor((now - state.lastExitTime) / 1000));
        if (secondsPassed > 60) {
            const earned = Math.floor((state.profitPerHour / 3600) * secondsPassed);
            if (earned > 0) {
                state.balance += earned;
                saveState();
                setTimeout(function() {
                    showMsg('✈️ Автопилот работал, пока тебя не было! Получено: +' + earned.toLocaleString() + ' $AERO');
                }, 600);
            }
        }
    }
}

function renderCards() {
    const container = document.getElementById('cards-container');
    if (!container) return;
    let html = '';
    for (let i = 0; i < cardMeta.length; i++) {
        const meta = cardMeta[i];
        const data = state.cards[meta.id];
        const disabled = state.balance < data.cost ? 'disabled' : '';
        html += '<div class="upgrade-card">' +
            '<div class="upgrade-info">' +
            '<h4>' + meta.icon + ' ' + meta.name + ' (Ур. ' + data.level + ')</h4>' +
            '<p>+' + data.profit.toLocaleString() + '/час • ' + meta.desc + '</p>' +
            '</div>' +
            '<button class="buy-btn" ' + disabled + ' onclick="buyCard(\'' + meta.id + '\')">' +
            data.cost.toLocaleString() + ' 🪙</button>' +
            '</div>';
    }
    container.innerHTML = html;
}

function renderLeaderboard(currentRankTitle) {
    const listEl = document.getElementById('leaderboard-list');
    if (!listEl) return;

    const allPlayers = [];
    for (let i = 0; i < rivals.length; i++) {
        allPlayers.push({
            name: rivals[i].name,
            rank: rivals[i].rank,
            score: rivals[i].score,
            isMe: false
        });
    }

    allPlayers.push({
        name: myPilotName + ' (Вы)',
        rank: currentRankTitle,
        score: Math.floor(state.balance),
        isMe: true
    });

    allPlayers.sort(function(a, b) { return b.score - a.score; });

    let html = '';
    let myPosition = 1;

    for (let i = 0; i < allPlayers.length; i++) {
        const p = allPlayers[i];
        const pos = i + 1;
        if (p.isMe) myPosition = pos;

        let medal = '#' + pos;
        if (pos === 1) medal = '🥇';
        else if (pos === 2) medal = '🥈';
        else if (pos === 3) medal = '🥉';

        html += '<div class="leader-row ' + (p.isMe ? 'is-me' : '') + '">' +
            '<div class="leader-left">' +
            '<div class="leader-pos">' + medal + '</div>' +
            '<div>' +
            '<div class="leader-name">' + p.name + '</div>' +
            '<div class="leader-tag">' + p.rank + '</div>' +
            '</div>' +
            '</div>' +
            '<div class="leader-score">' + p.score.toLocaleString() + ' 🪙</div>' +
            '</div>';
    }

    listEl.innerHTML = html;
    const worldRankEl = document.getElementById('my-world-rank');
    if (worldRankEl) {
        worldRankEl.innerText = '#' + myPosition + ' из ' + allPlayers.length;
    }
}

function updateUI() {
    const now = Date.now();
    document.getElementById('balance').innerText = Math.floor(state.balance).toLocaleString();
    document.getElementById('fuel-current').innerText = Math.floor(state.fuel);
    document.getElementById('fuel-max').innerText = state.maxFuel;
    document.getElementById('profit-per-hour').innerText = state.profitPerHour.toLocaleString();
    document.getElementById('ref-count').innerText = state.refCount;
    document.getElementById('ref-earned').innerText = state.refEarned.toLocaleString() + ' $AERO';

    const fuelPercent = (state.fuel / state.maxFuel) * 100;
    document.getElementById('fuel-bar').style.width = fuelPercent + '%';

    document.getElementById('lvl-tap').innerText = state.tapLevel;
    document.getElementById('val-tap').innerText = state.tapPower;
    document.getElementById('cost-tap').innerText = state.tapCost.toLocaleString();
    document.getElementById('btn-buy-tap').disabled = state.balance < state.tapCost;

    document.getElementById('lvl-fuel').innerText = state.fuelLevel;
    document.getElementById('cost-fuel').innerText = state.fuelCost.toLocaleString();
    document.getElementById('btn-buy-fuel').disabled = state.balance < state.fuelCost;

    const inviteBtn = document.getElementById('invite-btn');
    const inviteLeft = (state.lastInviteTime + 43200000) - now;
    if (inviteLeft > 0) {
        inviteBtn.innerText = '⏳ Бонус через ' + formatTimeLeft(inviteLeft);
    } else {
        inviteBtn.innerText = '🚀 Пригласить друга (+10,000)';
    }

    const cupcakeBtn = document.getElementById('cupcake-btn');
    const cupcakeLeft = (state.lastCupcakeTime + 10800000) - now;
    if (cupcakeLeft > 0) {
        cupcakeBtn.innerText = '🧁 ' + formatTimeLeft(cupcakeLeft);
    } else {
        cupcakeBtn.innerText = '🧁 Кекс';
    }

    const spinBtn = document.getElementById('spin-btn');
    const spinLeft = (state.lastSpinTime + 21600000) - now;
    if (spinLeft > 0) {
        spinBtn.innerText = formatTimeLeft(spinLeft);
        spinBtn.disabled = true;
    } else {
        spinBtn.innerText = 'Открыть';
        spinBtn.disabled = false;
    }

    if (state.tasks && state.tasks.tg) {
        const btnTg = document.getElementById('task-tg');
        if (btnTg) { btnTg.innerText = 'Готово ✅'; btnTg.disabled = true; }
    }
    if (state.tasks && state.tasks.yt) {
        const btnYt = document.getElementById('task-yt');
        if (btnYt) { btnYt.innerText = 'Готово ✅'; btnYt.disabled = true; }
    }

    let currentRank = ranks[0];
    for (let i = 0; i < ranks.length; i++) {
        if (state.balance >= ranks[i].min) { currentRank = ranks[i]; }
    }
    document.getElementById('pilot-rank').innerText = 'Ранг: ' + currentRank.title;
    document.getElementById('league-badge').innerText = currentRank.league;
    document.getElementById('plane-icon').innerText = currentRank.icon;
    document.getElementById('plane-model').innerText = currentRank.model;

    renderCards();
    renderLeaderboard(currentRank.title);
    saveState();
}
document.querySelectorAll('.tab-content').forEach(function(t) { t.classList.remove('active'); });
document.querySelectorAll('.nav-item').forEach(function(n) { n.classList.remove('active'); });
document.getElementById('tab-' + tabName).classList.add('active');
btn.classList.add('active');
}
function connectWallet() {
showMsg('Модуль TON Connect будет активирован перед листингом токена $AERO!');
}
setInterval(function() {
if (state.fuel < state.maxFuel) { state.fuel = Math.min(state.maxFuel, state.fuel + 4); }
if (state.profitPerHour > 0) { state.balance += (state.profitPerHour / 3600); }
updateUI();
}, 1000);
checkOfflineEarnings();
updateUI();
