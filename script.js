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

function createDynamicModal(id, title, subtitle, placeholder, btnText, onConfirm) {
    var existing = document.getElementById(id);
    if (existing) existing.remove();

    var overlay = document.createElement('div');
    overlay.id = id;
    overlay.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(5,8,15,0.9);display:flex;align-items:center;justify-content:center;z-index:9999;padding:20px;';

    var box = document.createElement('div');
    box.style.cssText = 'width:100%;max-width:330px;background:#151c2c;border:2px solid #00d2ff;border-radius:20px;padding:20px;text-align:center;color:#fff;';

    var h3 = document.createElement('h3');
    h3.innerText = title;

    var p = document.createElement('p');
    p.innerText = subtitle;
    p.style.cssText = 'font-size:12px;color:#8a99ad;margin-top:6px;';

    var input = document.createElement('input');
    input.type = 'text';
    input.placeholder = placeholder;
    input.maxLength = 16;
    input.style.cssText = 'width:100%;margin-top:14px;padding:12px;border-radius:12px;border:1px solid #00d2ff;background:#0b0f19;color:#fff;font-size:16px;outline:none;text-align:center;';

    var okBtn = document.createElement('button');
    okBtn.innerText = btnText;
    okBtn.style.cssText = 'margin-top:12px;width:100%;padding:13px;border-radius:12px;border:none;background:linear-gradient(90deg,#ffcc00,#ff9900);color:#000;font-weight:800;font-size:15px;cursor:pointer;';
    okBtn.onclick = function() {
        onConfirm(input.value, overlay);
    };

    var cancelBtn = document.createElement('button');
    cancelBtn.innerText = 'Закрыть';
    cancelBtn.style.cssText = 'margin-top:8px;width:100%;padding:11px;border-radius:12px;border:1px solid rgba(0,210,255,0.4);background:rgba(0,210,255,0.1);color:#00d2ff;font-weight:700;font-size:14px;cursor:pointer;';
    cancelBtn.onclick = function() { overlay.remove(); };

    box.appendChild(h3);
    box.appendChild(p);
    box.appendChild(input);
    box.appendChild(okBtn);
    box.appendChild(cancelBtn);
    overlay.appendChild(box);
    document.body.appendChild(overlay);
    setTimeout(function() { input.focus(); }, 100);
}

function openNameModal() {
    createDynamicModal(
        'dyn-name-modal',
        '👨‍✈️ Позывной пилота',
        'Введи имя, которое увидят все игроки в Топе:',
        getPilotName(),
        'Сохранить имя',
        function(val, overlay) {
            var cleaned = val.trim().slice(0, 16);
            if (cleaned.length >= 2) {
                state.customName = cleaned;
                saveState();
                updateUI();
                overlay.remove();
                showMsg('✅ Позывной изменен на: ' + cleaned);
            } else {
                showMsg('❌ Введи хотя бы 2 символа!');
            }
        }
    );
}
var changePilotName = openNameModal;

function openCipherModal() {
    if (state.cipherClaimed) {
        showMsg('Секретный код этого рейса уже активирован!');
        return;
    }
    createDynamicModal(
        'dyn-cipher-modal',
        '🔐 Секретный код рейса',
        'Ищи код дня в канале @aerotap (подсказка: AERO)',
        'Введи код...',
        'Активировать (+25,000)',
        function(val, overlay) {
            var code = val.trim().toUpperCase();
            if (code === 'AERO') {
                state.cipherClaimed = true;
                state.balance += 25000;
                saveState();
                updateUI();
                overlay.remove();
                showMsg('🔓 Код принят! На твой счет зачислено +25,000 $AERO!');
            } else {
                showMsg('❌ Неверный код! Ищи актуальный шифр в канале @aerotap.');
            }
        }
    );
}
var openCipher = openCipherModal;
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
