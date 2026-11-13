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

// Укажи юзернейм своего игрового бота без @
const BOT_USERNAME = 'aerotap_bot';
// Юзернейм твоего Telegram канала без @
const CHANNEL_USERNAME = 'aerotap';

let state = JSON.parse(localStorage.getItem('aerotap_save_v8')) || {
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
    localStorage.setItem('aerotap_save_v8', JSON.stringify(state));
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
    document.getElementById('my-world-rank').innerText = '#' + myPosition + ' из ' + allPlayers.length;
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

    let currentRank = ranks;
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
function handleTap(x, y) {
    const multiplier = isTurbo ? 5 : 1;
    let gain = state.tapPower * multiplier;

    if (isTurbo || state.fuel >= state.tapPower) {
        comboStreak++;
        let label = '+' + gain;
        if (comboStreak >= 50) {
            gain = gain * 10;
            label = '🔥 КРИТ +' + gain;
            comboStreak = 0;
        }

        state.balance += gain;
        state.totalTaps += 1;
        if (!isTurbo) { state.fuel -= state.tapPower; }
        if (tg && tg.HapticFeedback) {
            tg.HapticFeedback.impactOccurred(isTurbo ? 'heavy' : 'medium');
        }
        createFloatingText(x, y, label);
        updateUI();
    } else if (tg && tg.HapticFeedback) {
        tg.HapticFeedback.notificationOccurred('error');
    }
}

const planeBtn = document.getElementById('plane-btn');
planeBtn.addEventListener('touchstart', function(e) {
    e.preventDefault();
    for (let i = 0; i < e.changedTouches.length; i++) {
        handleTap(e.changedTouches[i].clientX, e.changedTouches[i].clientY);
    }
}, { passive: false });

planeBtn.addEventListener('mousedown', function(e) {
    handleTap(e.clientX, e.clientY);
});

function createFloatingText(x, y, text) {
    const el = document.createElement('div');
    el.className = 'floating-text';
    el.innerText = text;
    el.style.left = (x - 20) + 'px';
    el.style.top = (y - 30) + 'px';
    document.body.appendChild(el);
    setTimeout(function() { el.remove(); }, 800);
}

// Космический кекс (полный бак + бонус раз в 3 часа)
function eatCupcake() {
    const now = Date.now();
    const left = (state.lastCupcakeTime + 10800000) - now;
    if (left > 0) {
        showMsg('🧁 Печь еще греется! Новый космо-кекс будет готов через ' + formatTimeLeft(left));
        return;
    }
    state.lastCupcakeTime = now;
    state.fuel = state.maxFuel;
    const bonus = 1500 + Math.floor(Math.random() * 2500);
    state.balance += bonus;
    if (tg && tg.HapticFeedback) tg.HapticFeedback.notificationOccurred('success');
    showMsg('🧁 Вкуснятина! Топливо восстановлено на 100%, а внутри кекса найдено +' + bonus.toLocaleString() + ' $AERO!');
    updateUI();
}

// Анимированное открытие Авиа-кейса (раз в 6 часов)
function openCaseModal() {
    const now = Date.now();
    const left = (state.lastSpinTime + 21600000) - now;
    if (left > 0) {
        showMsg('🎁 Следующий кейс будет доступен через ' + formatTimeLeft(left));
        return;
    }

    state.lastSpinTime = now;
    saveState();

    const modal = document.getElementById('case-modal');
    const track = document.getElementById('roulette-track');
    const resultEl = document.getElementById('case-result');
    const closeBtn = document.getElementById('case-close-btn');

    modal.style.display = 'flex';
    closeBtn.style.display = 'none';
    resultEl.innerText = 'Раскручиваем барабан...';
    track.style.transition = 'none';
    track.style.transform = 'translateX(0px)';

    const pool =;
    const winIndex = 24;
    let wonAmount = 2500;
    let html = '';

    for (let i = 0; i < 30; i++) {
        const val = pool[Math.floor(Math.random() * pool.length)];
        if (i === winIndex) wonAmount = val;
        const isJackpot = val >= 15000 ? 'jackpot' : '';
        const icon = val >= 15000 ? '💎' : '🪙';
        html += '<div class="roulette-item ' + isJackpot + '">' + icon + '<br>+' + val.toLocaleString() + '</div>';
    }
    track.innerHTML = html;

    setTimeout(function() {
        track.style.transition = 'transform 3.8s cubic-bezier(0.12, 0.85, 0.2, 1)';
        const itemWidth = 92; // 84px ширина + 8px отступ
        const offset = (winIndex * itemWidth) + 42;
        track.style.transform = 'translateX(-' + offset + 'px)';
    }, 50);

    setTimeout(function() {
        state.balance += wonAmount;
        if (tg && tg.HapticFeedback) tg.HapticFeedback.notificationOccurred('success');
        resultEl.innerText = '🎉 Твой выигрыш: +' + wonAmount.toLocaleString() + ' $AERO!';
        closeBtn.style.display = 'block';
        updateUI();
    }, 4000);
}

function closeCaseModal() {
    document.getElementById('case-modal').style.display = 'none';
}

// Редкий перехват дрона (раз в 90 секунд, урезанная награда 400-850 монет)
function spawnDrone() {
    const drone = document.getElementById('bonus-drone');
    if (!drone) return;
    drone.style.display = 'flex';
    setTimeout(function() { drone.style.display = 'none'; }, 4000);
}

function catchDrone() {
    document.getElementById('bonus-drone').style.display = 'none';
    const reward = 400 + Math.floor(Math.random() * 450);
    state.balance += reward;
    if (tg && tg.HapticFeedback) tg.HapticFeedback.notificationOccurred('success');
    showMsg('🛸 Груз перехвачен! Награда: +' + reward.toLocaleString() + ' $AERO!');
    updateUI();
}

setInterval(spawnDrone, 90000);

function activateTurbo() {
    if (isTurbo || turboCooldown > 0) return;
    isTurbo = true;
    document.body.classList.add('turbo-active');
    const btn = document.getElementById('turbo-btn');
    btn.disabled = true;

    let timeLeft = 15;
    document.getElementById('turbo-status').innerText = timeLeft + 'с';

    const turboTimer = setInterval(function() {
        timeLeft--;
        if (timeLeft > 0) {
            document.getElementById('turbo-status').innerText = timeLeft + 'с';
        } else {
            clearInterval(turboTimer);
            isTurbo = false;
            document.body.classList.remove('turbo-active');
            startTurboCooldown();
        }
    }, 1000);
}

function startTurboCooldown() {
    turboCooldown = 45;
    const btn = document.getElementById('turbo-btn');
    const cdTimer = setInterval(function() {
        turboCooldown--;
        if (turboCooldown > 0) {
            document.getElementById('turbo-status').innerText = 'ЗАРЯДКА ' + turboCooldown + 'с';
        } else {
            clearInterval(cdTimer);
            btn.disabled = false;
            document.getElementById('turbo-status').innerText = 'ГОТОВ';
        }
    }, 1000);
}

function claimDaily() {
    const today = new Date().toDateString();
    if (state.lastDaily === today) {
        showMsg('Ты уже забрал сегодняшний бонус пилота! Возвращайся завтра.');
        return;
    }
    state.lastDaily = today;
    state.balance += 5000;
    if (tg && tg.HapticFeedback) tg.HapticFeedback.notificationOccurred('success');
    showMsg('🎁 Получен ежедневный бонус пилота: +5,000 $AERO!');
    updateUI();
}

function openCipher() {
    if (state.cipherClaimed) {
        showMsg('Секретный код этого рейса уже активирован!');
        return;
    }
    const code = prompt('Введи секретный код дня из канала @aerotap (подсказка: AERO):');
    if (code && code.trim().toUpperCase() === 'AERO') {
        state.cipherClaimed = true;
        state.balance += 25000;
        if (tg && tg.HapticFeedback) tg.HapticFeedback.notificationOccurred('success');
        showMsg('🔓 Код принят! На твой счет зачислено +25,000 $AERO!');
        updateUI();
    } else if (code !== null) {
        showMsg('❌ Неверный код! Ищи актуальный шифр в канале @aerotap.');
    }
}

// Нативное приглашение друга внутри приложения Telegram
function inviteFriend() {
    const now = Date.now();
    const refLink = 'https://t.me' + BOT_USERNAME + '?start=' + userId;
    const shareText = 'Залетай в AeroTap, качай самолеты и забирай бонус $AERO до листинга!';
    const nativeShare = 'tg://msg_url?url=' + encodeURIComponent(refLink) + '&text=' + encodeURIComponent(shareText);

    if (now - state.lastInviteTime >= 43200000) {
        state.lastInviteTime = now;
        state.refCount += 1;
        state.refEarned += 10000;
        state.balance += 10000;
        if (tg && tg.HapticFeedback) tg.HapticFeedback.notificationOccurred('success');
        updateUI();
    }

    window.location.href = nativeShare;
}

function copyRefLink() {
    const refLink = 'https://t.me' + BOT_USERNAME + '?start=' + userId;
    const tempInput = document.createElement('textarea');
    tempInput.value = refLink;
    tempInput.style.position = 'fixed';
    tempInput.style.left = '-9999px';
    document.body.appendChild(tempInput);
    tempInput.focus();
    tempInput.select();
    try {
        document.execCommand('copy');
        showMsg('📋 Ссылка скопирована:\n' + refLink);
    } catch (err) {
        showMsg('Твоя ссылка:\n' + refLink);
    }
    document.body.removeChild(tempInput);
}

// Гарантированное начисление награды и нативный переход в @aerotap или YouTube
function completeTask(taskId, reward, url) {
    if (!state.tasks) state.tasks = {};
    
    if (!state.tasks[taskId]) {
        state.tasks[taskId] = true;
        state.balance += reward;
        if (tg && tg.HapticFeedback) tg.HapticFeedback.notificationOccurred('success');
        updateUI();
    }

    setTimeout(function() {
        if (taskId === 'tg') {
            window.location.href = 'tg://resolve?domain=' + CHANNEL_USERNAME;
        } else if (tg && tg.openLink) {
            tg.openLink(url);
        } else {
            window.open(url, '_blank');
        }
    }, 300);
}

function buyUpgrade(type) {
    if (type === 'tap' && state.balance >= state.tapCost) {
        state.balance -= state.tapCost;
        state.tapLevel++;
        state.tapPower += 2;
        state.tapCost = Math.floor(state.tapCost * 1.85);
    } else if (type === 'fuel' && state.balance >= state.fuelCost) {
        state.balance -= state.fuelCost;
        state.fuelLevel++;
        state.maxFuel += 500;
        state.fuel = state.maxFuel;
        state.fuelCost = Math.floor(state.fuelCost * 1.85);
    }
    if (tg && tg.HapticFeedback) tg.HapticFeedback.notificationOccurred('success');
    updateUI();
}

function buyCard(id) {
    const card = state.cards[id];
    if (state.balance >= card.cost) {
        state.balance -= card.cost;
        card.level++;
        state.profitPerHour += card.profit;
card.cost = Math.floor(card.cost * 1.65);
card.profit = Math.floor(card.profit * 1.25);
if (tg && tg.HapticFeedback) tg.HapticFeedback.notificationOccurred('success');
updateUI();
}
}
function switchTab(tabName, btn) {
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
