var tg = window.Telegram && window.Telegram.WebApp ? window.Telegram.WebApp : null;
var userId = 'pilot_' + Math.floor(Math.random() * 100000);
var tgFirstName = 'Пилот #001';

if (tg) {
    try {
        tg.expand();
        tg.ready();
        if (tg.initDataUnsafe && tg.initDataUnsafe.user) {
            var user = tg.initDataUnsafe.user;
            userId = user.id;
            if (user.first_name) tgFirstName = user.first_name;
        }
    } catch (e) {}
}

var BOT_USERNAME = 'aerotap_bot';
var CHANNEL_USERNAME = 'aerotap';
var SAVE_KEY = 'aerotap_player_data';

var defaultState = {
    customName: '',
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
    isVip: false,
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
    var raw = null;
    try { raw = localStorage.getItem(SAVE_KEY); } catch (e) {}
    if (!raw) return JSON.parse(JSON.stringify(defaultState));
    try {
        var parsed = JSON.parse(raw);
        var merged = Object.assign({}, defaultState, parsed);
        merged.tasks = Object.assign({}, defaultState.tasks, parsed.tasks || {});
        merged.cards = Object.assign({}, defaultState.cards, parsed.cards || {});
        return merged;
    } catch (e) {
        return JSON.parse(JSON.stringify(defaultState));
    }
}

var state = loadSavedState();

function getPilotName() {
    return (state.customName && state.customName.trim().length > 0) ? state.customName.trim() : tgFirstName;
}

function openNameModal() {
    var modal = document.getElementById('name-modal');
    var input = document.getElementById('name-input');
    if (input) input.value = getPilotName();
    if (modal) modal.style.display = 'flex';
}

function closeNameModal() {
    var modal = document.getElementById('name-modal');
    if (modal) modal.style.display = 'none';
}

function saveNewName() {
    var input = document.getElementById('name-input');
    if (!input) return;
    var cleaned = input.value.trim().slice(0, 16);
    if (cleaned.length >= 2) {
        state.customName = cleaned;
        saveState();
        updateUI();
        closeNameModal();
        if (tg && tg.HapticFeedback) {
            try { tg.HapticFeedback.notificationOccurred('success'); } catch (e) {}
        }
        showMsg('✅ Позывной изменен на: ' + cleaned);
    } else {
        showMsg('❌ Введи хотя бы 2 символа!');
    }
}

var rivals = Array.of(
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
);

var cardMeta = Array.of(
    { id: 'hub', icon: '🛫', name: 'Взлетная полоса', desc: 'Региональные рейсы' },
    { id: 'vip', icon: '🥂', name: 'Бизнес-терминал', desc: 'Обслуживание джетов' },
    { id: 'cargo', icon: '📦', name: 'Грузовой хаб $AERO', desc: 'Мировая логистика' },
    { id: 'space', icon: '🛰️', name: 'Орбитальный космопорт', desc: 'Рейсы на Луну и Марс' }
);

var firstRank = { min: 0, title: 'Кадет', icon: '🛩️', model: 'Cessna 172', league: '🥉 Бронзовая лига' };
var ranks = Array.of(
    firstRank,
    { min: 2500, title: 'Второй пилот', icon: '🛫', model: 'Boeing 737', league: '🥈 Серебряная лига' },
    { min: 15000, title: 'Капитан', icon: '✈️', model: 'Airbus A380', league: '🥇 Золотая лига' },
    { min: 75000, title: 'Ас Истребитель', icon: '🚀', model: 'F-22 Raptor', league: '💎 Платиновая лига' },
    { min: 300000, title: 'Космонавт $AERO', icon: '🛸', model: 'Aero Starship', league: '👑 Бриллиантовая лига' }
);

var isTurbo = false;
var turboCooldown = 0;
var comboStreak = 0;

function saveState() {
    try {
        state.lastExitTime = Date.now();
        localStorage.setItem(SAVE_KEY, JSON.stringify(state));
    } catch (e) {}
}

function showMsg(text) {
    if (tg && tg.showAlert) {
        try { tg.showAlert(text); } catch (e) { alert(text); }
    } else {
        alert(text);
    }
}

function formatTimeLeft(ms) {
    var totalSec = Math.ceil(ms / 1000);
    var hrs = Math.floor(totalSec / 3600);
    var mins = Math.floor((totalSec % 3600) / 60);
    var secs = totalSec % 60;
    if (hrs > 0) return hrs + 'ч ' + mins + 'м';
    if (mins > 0) return mins + 'м ' + secs + 'с';
    return secs + 'с';
}
function checkOfflineEarnings() {
    if (state.profitPerHour > 0 && state.lastExitTime) {
        var now = Date.now();
        var secondsPassed = Math.min(10800, Math.floor((now - state.lastExitTime) / 1000));
        if (secondsPassed > 60) {
            var mult = state.isVip ? 2 : 1;
            var earned = Math.floor((state.profitPerHour / 3600) * secondsPassed * mult);
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
    var container = document.getElementById('cards-container');
    if (!container) return;
    var html = '';
    cardMeta.forEach(function(meta) {
        var data = state.cards[meta.id];
        var disabled = state.balance < data.cost ? 'disabled' : '';
        html += '<div class="upgrade-card">' +
            '<div class="upgrade-info">' +
            '<h4>' + meta.icon + ' ' + meta.name + ' (Ур. ' + data.level + ')</h4>' +
            '<p>+' + data.profit.toLocaleString() + '/час • ' + meta.desc + '</p>' +
            '</div>' +
            '<button class="buy-btn" ' + disabled + ' onclick="buyCard(\'' + meta.id + '\')">' +
            data.cost.toLocaleString() + ' 🪙</button>' +
            '</div>';
    });
    container.innerHTML = html;
}

function renderLeaderboard(currentRankTitle) {
    var listEl = document.getElementById('leaderboard-list');
    if (!listEl) return;

    var allPlayers = Array.of();
    rivals.forEach(function(r) {
        allPlayers.push({ name: r.name, rank: r.rank, score: r.score, isMe: false });
    });

    allPlayers.push({
        name: getPilotName() + ' (Вы)',
        rank: currentRankTitle,
        score: Math.floor(state.balance),
        isMe: true
    });

    allPlayers.sort(function(a, b) { return b.score - a.score; });

    var html = '';
    var myPosition = 1;

    allPlayers.forEach(function(p, idx) {
        var pos = idx + 1;
        if (p.isMe) myPosition = pos;

        var medal = '#' + pos;
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
    });

    listEl.innerHTML = html;
    var worldRankEl = document.getElementById('my-world-rank');
    if (worldRankEl) worldRankEl.innerText = '#' + myPosition + ' из ' + allPlayers.length;
}

function updateUI() {
    var now = Date.now();
    var vipMult = state.isVip ? 2 : 1;

    var activeName = getPilotName();
    document.getElementById('pilot-name').innerText = activeName;
    document.getElementById('avatar').innerText = activeName.charAt(0).toUpperCase();

    document.getElementById('balance').innerText = Math.floor(state.balance).toLocaleString();
    document.getElementById('fuel-current').innerText = Math.floor(state.fuel);
    document.getElementById('fuel-max').innerText = state.maxFuel;
    document.getElementById('profit-per-hour').innerText = (state.profitPerHour * vipMult).toLocaleString();
    document.getElementById('ref-count').innerText = state.refCount;
    document.getElementById('ref-earned').innerText = state.refEarned.toLocaleString() + ' $AERO';

    var fuelPercent = (state.fuel / state.maxFuel) * 100;
    document.getElementById('fuel-bar').style.width = fuelPercent + '%';

    document.getElementById('lvl-tap').innerText = state.tapLevel;
    document.getElementById('val-tap').innerText = state.tapPower * vipMult;
    document.getElementById('cost-tap').innerText = state.tapCost.toLocaleString();
    document.getElementById('btn-buy-tap').disabled = state.balance < state.tapCost;

    document.getElementById('lvl-fuel').innerText = state.fuelLevel;
    document.getElementById('cost-fuel').innerText = state.fuelCost.toLocaleString();
    document.getElementById('btn-buy-fuel').disabled = state.balance < state.fuelCost;

    var inviteBtn = document.getElementById('invite-btn');
    var inviteLeft = (state.lastInviteTime + 43200000) - now;
    inviteBtn.innerText = inviteLeft > 0 ? '⏳ Бонус через ' + formatTimeLeft(inviteLeft) : '🚀 Пригласить друга (+10,000)';

    var cupcakeBtn = document.getElementById('cupcake-btn');
    var cupcakeLeft = (state.lastCupcakeTime + 10800000) - now;
    cupcakeBtn.innerText = cupcakeLeft > 0 ? '🧁 ' + formatTimeLeft(cupcakeLeft) : '🧁 Кекс';

    var spinBtn = document.getElementById('spin-btn');
    var spinLeft = (state.lastSpinTime + 21600000) - now;
    if (spinLeft > 0) {
        spinBtn.innerText = formatTimeLeft(spinLeft);
        spinBtn.disabled = true;
    } else {
        spinBtn.innerText = 'Открыть';
        spinBtn.disabled = false;
    }

    if (state.tasks && state.tasks.tg) {
        var btnTg = document.getElementById('task-tg');
        if (btnTg) { btnTg.innerText = 'Готово ✅'; btnTg.disabled = true; }
    }
    if (state.tasks && state.tasks.yt) {
        var btnYt = document.getElementById('task-yt');
        if (btnYt) { btnYt.innerText = 'Готово ✅'; btnYt.disabled = true; }
    }

    var currentRank = firstRank;
    ranks.forEach(function(r) {
        if (state.balance >= r.min) currentRank = r;
    });

    document.getElementById('pilot-rank').innerText = (state.isVip ? '👑 VIP ' : 'Ранг: ') + currentRank.title;
    document.getElementById('league-badge').innerText = currentRank.league;
    document.getElementById('plane-icon').innerText = currentRank.icon;
    document.getElementById('plane-model').innerText = currentRank.model;

    renderCards();
    renderLeaderboard(currentRank.title);
    saveState();
}
function handleTap(x, y) {
    var turboMult = isTurbo ? 5 : 1;
    var vipMult = state.isVip ? 2 : 1;
    var gain = state.tapPower * turboMult * vipMult;

    if (isTurbo || state.fuel >= state.tapPower) {
        comboStreak++;
        var label = '+' + gain;
        if (comboStreak >= 50) {
            gain = gain * 10;
            label = '🔥 КРИТ +' + gain;
            comboStreak = 0;
        }
        state.balance += gain;
        state.totalTaps += 1;
        if (!isTurbo) state.fuel -= state.tapPower;
        if (tg && tg.HapticFeedback) {
            try { tg.HapticFeedback.impactOccurred(isTurbo ? 'heavy' : 'medium'); } catch (e) {}
        }
        createFloatingText(x, y, label);
        updateUI();
    } else if (tg && tg.HapticFeedback) {
        try { tg.HapticFeedback.notificationOccurred('error'); } catch (e) {}
    }
}

var planeBtn = document.getElementById('plane-btn');
if (planeBtn) {
    planeBtn.addEventListener('touchstart', function(e) {
        e.preventDefault();
        Array.from(e.changedTouches).forEach(function(t) {
            handleTap(t.clientX, t.clientY);
        });
    }, { passive: false });

    planeBtn.addEventListener('mousedown', function(e) {
        handleTap(e.clientX, e.clientY);
    });
}

function createFloatingText(x, y, text) {
    var el = document.createElement('div');
    el.className = 'floating-text';
    el.innerText = text;
    el.style.left = (x - 20) + 'px';
    el.style.top = (y - 30) + 'px';
    document.body.appendChild(el);
    setTimeout(function() { el.remove(); }, 800);
}

function eatCupcake() {
    var now = Date.now();
    var left = (state.lastCupcakeTime + 10800000) - now;
    if (left > 0) {
        showMsg('🧁 Печь еще греется! Новый космо-кекс будет готов через ' + formatTimeLeft(left));
        return;
    }
    state.lastCupcakeTime = now;
    state.fuel = state.maxFuel;
    var bonus = 1500 + Math.floor(Math.random() * 2500);
    state.balance += bonus;
    if (tg && tg.HapticFeedback) {
        try { tg.HapticFeedback.notificationOccurred('success'); } catch (e) {}
    }
    showMsg('🧁 Вкуснятина! Топливо восстановлено на 100%, а внутри кекса найдено +' + bonus.toLocaleString() + ' $AERO!');
    updateUI();
}

function getRandomPrize() {
    var roll = Math.random();
    if (roll < 0.25) return 1000;
    if (roll < 0.50) return 2000;
    if (roll < 0.72) return 3500;
    if (roll < 0.88) return 5000;
    if (roll < 0.96) return 10000;
    if (roll < 0.99) return 15000;
    return 25000;
}

function openCaseModal() {
    var now = Date.now();
    var left = (state.lastSpinTime + 21600000) - now;
    if (left > 0) {
        showMsg('🎁 Следующий кейс будет доступен через ' + formatTimeLeft(left));
        return;
    }

    state.lastSpinTime = now;
    saveState();

    var modal = document.getElementById('case-modal');
    var track = document.getElementById('roulette-track');
    var resultEl = document.getElementById('case-result');
    var closeBtn = document.getElementById('case-close-btn');

    modal.style.display = 'flex';
    closeBtn.style.display = 'none';
    resultEl.innerText = 'Раскручиваем барабан...';
    track.style.transition = 'none';
    track.style.transform = 'translateX(0px)';

    var winIndex = 24;
    var wonAmount = 3500;
    var html = '';

    for (var i = 0; i < 30; i++) {
        var val = getRandomPrize();
        if (i === winIndex) wonAmount = val;
        var isJackpot = val >= 15000 ? 'jackpot' : '';
        var icon = val >= 15000 ? '💎' : '🪙';
        html += '<div class="roulette-item ' + isJackpot + '">' + icon + '<br>+' + val.toLocaleString() + '</div>';
    }
    track.innerHTML = html;

    setTimeout(function() {
        track.style.transition = 'transform 3.8s cubic-bezier(0.12, 0.85, 0.2, 1)';
        var offset = (winIndex * 92) + 42;
        track.style.transform = 'translateX(-' + offset + 'px)';
    }, 50);

    setTimeout(function() {
        state.balance += wonAmount;
        if (tg && tg.HapticFeedback) {
            try { tg.HapticFeedback.notificationOccurred('success'); } catch (e) {}
        }
        resultEl.innerText = '🎉 Твой выигрыш: +' + wonAmount.toLocaleString() + ' $AERO!';
        closeBtn.style.display = 'block';
        updateUI();
    }, 4000);
}

function closeCaseModal() {
    document.getElementById('case-modal').style.display = 'none';
}

function spawnDrone() {
    var drone = document.getElementById('bonus-drone');
    if (!drone) return;
    drone.style.display = 'flex';
    setTimeout(function() { drone.style.display = 'none'; }, 4000);
}

function catchDrone() {
    document.getElementById('bonus-drone').style.display = 'none';
    var reward = 400 + Math.floor(Math.random() * 450);
    state.balance += reward;
    if (tg && tg.HapticFeedback) {
        try { tg.HapticFeedback.notificationOccurred('success'); } catch (e) {}
    }
    showMsg('🛸 Груз перехвачен! Награда: +' + reward.toLocaleString() + ' $AERO!');
    updateUI();
}

setInterval(spawnDrone, 90000);

function activateTurbo() {
    if (isTurbo || turboCooldown > 0) return;
    isTurbo = true;
    document.body.classList.add('turbo-active');
    var btn = document.getElementById('turbo-btn');
    btn.disabled = true;

    var timeLeft = 15;
    document.getElementById('turbo-status').innerText = timeLeft + 'с';

    var turboTimer = setInterval(function() {
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
    var btn = document.getElementById('turbo-btn');
    var cdTimer = setInterval(function() {
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
    var today = new Date().toDateString();
    if (state.lastDaily === today) {
        showMsg('Ты уже забрал сегодняшний бонус пилота! Возвращайся завтра.');
        return;
    }
    state.lastDaily = today;
    state.balance += 5000;
    if (tg && tg.HapticFeedback) {
        try { tg.HapticFeedback.notificationOccurred('success'); } catch (e) {}
    }
    showMsg('🎁 Получен ежедневный бонус пилота: +5,000 $AERO!');
    updateUI();
}

function openCipherModal() {
    if (state.cipherClaimed) {
        showMsg('Секретный код этого рейса уже активирован!');
        return;
    }
    var modal = document.getElementById('cipher-modal');
    if (modal) modal.style.display = 'flex';
}

function closeCipherModal() {
    var modal = document.getElementById('cipher-modal');
    if (modal) modal.style.display = 'none';
}

function submitCipher() {
    var input = document.getElementById('cipher-input');
    if (!input) return;
    var code = input.value.trim().toUpperCase();
    if (code === 'AERO') {
        state.cipherClaimed = true;
        state.balance += 25000;
        saveState();
        updateUI();
        closeCipherModal();
        if (tg && tg.HapticFeedback) {
            try { tg.HapticFeedback.notificationOccurred('success'); } catch (e) {}
        }
        showMsg('🔓 Код принят! На твой счет зачислено +25,000 $AERO!');
    } else {
        showMsg('❌ Неверный код! Ищи актуальный шифр в канале @aerotap.');
    }
}

function inviteFriend() {
    var now = Date.now();
    var refLink = 'https://t.me' + BOT_USERNAME + '?start=' + userId;
    var promoText = '🔥 Залетай в AeroTap по моей ссылке и забирай +250 $AERO бонусом до листинга токена!';
    var nativeShare = 'tg://msg_url?url=' + encodeURIComponent(refLink) + '&text=' + encodeURIComponent(promoText);

    if (now - state.lastInviteTime >= 43200000) {
        state.lastInviteTime = now;
        state.refCount += 1;
        state.refEarned += 10000;
        state.balance += 10000;
        if (tg && tg.HapticFeedback) {
            try { tg.HapticFeedback.notificationOccurred('success'); } catch (e) {}
        }
        updateUI();
    }

    window.location.href = nativeShare;
}

function copyRefLink() {
    var refLink = 'https://t.me' + BOT_USERNAME + '?start=' + userId;
    var fullMessage = '🔥 Залетай в AeroTap по моей ссылке и забирай +250 $AERO бонусом до листинга токена!\n👉 ' + refLink;
    var tempInput = document.createElement('textarea');
    tempInput.value = fullMessage;
    tempInput.style.position = 'fixed';
    tempInput.style.left = '-9999px';
    document.body.appendChild(tempInput);
    tempInput.focus();
    tempInput.select();
    try {
        document.execCommand('copy');
        showMsg('📋 Приглашение скопировано! Отправь его другу:\n\n' + fullMessage);
    } catch (err) {
        showMsg(fullMessage);
    }
    document.body.removeChild(tempInput);
}

function completeTask(taskId, reward, url) {
    if (!state.tasks) state.tasks = {};
    if (!state.tasks[taskId]) {
        state.tasks[taskId] = true;
        state.balance += reward;
        if (tg && tg.HapticFeedback) {
            try { tg.HapticFeedback.notificationOccurred('success'); } catch (e) {}
        }
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
if (tg && tg.HapticFeedback) {
try { tg.HapticFeedback.notificationOccurred('success'); } catch (e) {}
}
updateUI();
}
function buyCard(id) {
var card = state.cards[id];
if (state.balance >= card.cost) {
state.balance -= card.cost;
card.level++;
state.profitPerHour += card.profit;
card.cost = Math.floor(card.cost * 1.65);
card.profit = Math.floor(card.profit * 1.25);
if (tg && tg.HapticFeedback) {
try { tg.HapticFeedback.notificationOccurred('success'); } catch (e) {}
}
updateUI();
}
}
function switchTab(tabName, btn) {
document.querySelectorAll('.tab-content').forEach(function(t) { t.classList.remove('active'); });
document.querySelectorAll('.nav-item').forEach(function(n) { n.classList.remove('active'); });
var target = document.getElementById('tab-' + tabName);
if (target) target.classList.add('active');
if (btn) btn.classList.add('active');
}
function connectWallet() {
showMsg('💎 VIP-статус и привязка TON кошелька скоро откроются перед листингом $AERO!');
}
setInterval(function() {
var vipMult = state.isVip ? 2 : 1;
if (state.fuel < state.maxFuel) state.fuel = Math.min(state.maxFuel, state.fuel + 4);
if (state.profitPerHour > 0) state.balance += ((state.profitPerHour * vipMult) / 3600);
updateUI();
}, 1000);
checkOfflineEarnings();
updateUI();
