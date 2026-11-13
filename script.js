var tg = window.Telegram && window.Telegram.WebApp ? window.Telegram.WebApp : null;
var userId = 'u' + Math.floor(Math.random() * 999999);
var defaultNick = 'CryptoPilot';

if (tg) {
    try {
        tg.expand();
        tg.ready();
        if (tg.initDataUnsafe && tg.initDataUnsafe.user) {
            userId = tg.initDataUnsafe.user.id;
            if (tg.initDataUnsafe.user.first_name) {
                defaultNick = tg.initDataUnsafe.user.first_name;
            }
        }
    } catch (e) {}
}

var BOT_NAME = 'aerotap_bot';
var DB_KEY = 'aero_crash_v1';

var data = JSON.parse(localStorage.getItem(DB_KEY)) || {
    nick: '',
    balance: 1000,
    energy: 1000,
    maxEnergy: 1000,
    tapPower: 5,
    tapLvl: 1,
    tapCost: 250,
    nodeLvl: 0,
    nodeCost: 500,
    passive: 0,
    tasks: { tg: false, yt: false }
};

function save() {
    localStorage.setItem(DB_KEY, JSON.stringify(data));
}

function alertBox(msg) {
    if (tg && tg.showAlert) {
        try { tg.showAlert(msg); } catch (e) { alert(msg); }
    } else {
        alert(msg);
    }
}

function getNick() {
    return data.nick ? data.nick : defaultNick;
}

// Смена ника
function openNameModal() {
    document.getElementById('nick-input').value = getNick();
    document.getElementById('name-modal').style.display = 'flex';
}
function closeNameModal() {
    document.getElementById('name-modal').style.display = 'none';
}
function saveNick() {
    var val = document.getElementById('nick-input').value.trim();
    if (val.length >= 2) {
        data.nick = val;
        save();
        render();
        closeNameModal();
    }
}

// ЛОГИКА КРАШ-ИГРЫ (AVIATOR $AERO)
var isFlying = false;
var currentMult = 1.00;
var crashPoint = 1.00;
var currentBet = 0;
var flightLoop = null;

function setBet(val) { document.getElementById('bet-input').value = val; }
function halfBet() {
    var v = Math.floor(Number(document.getElementById('bet-input').value) / 2);
    document.getElementById('bet-input').value = Math.max(10, v);
}
function doubleBet() {
    var v = Math.floor(Number(document.getElementById('bet-input').value) * 2);
    document.getElementById('bet-input').value = Math.min(Math.floor(data.balance), v);
}
function maxBet() {
    document.getElementById('bet-input').value = Math.max(10, Math.floor(data.balance));
}

function generateCrashPoint() {
    var r = Math.random();
    if (r < 0.15) return 1.05 + Math.random() * 0.25;
    if (r < 0.65) return 1.30 + Math.random() * 1.70;
    if (r < 0.90) return 3.00 + Math.random() * 7.00;
    return 10.00 + Math.random() * 40.00;
}

function handleCrashAction() {
    var btn = document.getElementById('crash-btn');
    var radar = document.getElementById('radar-screen');
    var multEl = document.getElementById('mult-text');
    var statusEl = document.getElementById('flight-status');

    if (!isFlying) {
        var bet = Math.floor(Number(document.getElementById('bet-input').value));
        if (bet < 10 || bet > data.balance) {
            alertBox('Недостаточно $AERO для ставки! Нафарми во вкладке Майнинг.');
            return;
        }
        data.balance -= bet;
        currentBet = bet;
        currentMult = 1.00;
        crashPoint = generateCrashPoint();
        isFlying = true;
        save();
        render();

        radar.classList.add('flying');
        multEl.style.color = '#ffffff';
        statusEl.innerText = 'НАБОР ВЫСОТЫ...';
        btn.classList.add('cashout');

        flightLoop = setInterval(function() {
            currentMult += 0.02 + (currentMult * 0.015);
            multEl.innerText = 'x' + currentMult.toFixed(2);
            var winNow = Math.floor(currentBet * currentMult);
            btn.innerText = '💰 ЗАБРАТЬ ' + winNow.toLocaleString() + ' $AERO';

            if (currentMult >= crashPoint) {
                clearInterval(flightLoop);
                isFlying = false;
                radar.classList.remove('flying');
                multEl.style.color = '#ff0055';
                statusEl.innerText = '💥 УЛЕТЕЛ НА x' + crashPoint.toFixed(2);
                btn.classList.remove('cashout');
                btn.innerText = '🚀 ВЗЛЕТЕТЬ';
                addHistory(crashPoint);
                if (tg && tg.HapticFeedback) {
                    try { tg.HapticFeedback.notificationOccurred('error'); } catch (e) {}
                }
            }
        }, 70);
    } else {
        clearInterval(flightLoop);
        isFlying = false;
        radar.classList.remove('flying');
        var totalWin = Math.floor(currentBet * currentMult);
        data.balance += totalWin;
        multEl.style.color = '#c8ff00';
        statusEl.innerText = '✅ ЗАБРАНО: +' + totalWin.toLocaleString() + ' $AERO';
        btn.classList.remove('cashout');
        btn.innerText = '🚀 ВЗЛЕТЕТЬ';
        addHistory(currentMult);
        if (tg && tg.HapticFeedback) {
            try { tg.HapticFeedback.notificationOccurred('success'); } catch (e) {}
        }
        save();
        render();
    }
}

function addHistory(val) {
    var strip = document.getElementById('history-strip');
    var cls = val < 1.5 ? 'low' : (val < 5 ? 'mid' : 'high');
    var span = document.createElement('span');
    span.className = 'hist-item ' + cls;
    span.innerText = 'x' + val.toFixed(2);
    strip.insertBefore(span, strip.firstChild);
    if (strip.children.length > 8) strip.removeChild(strip.lastChild);
}

// ТАПАЛКА И МАЙНИНГ
var core = document.getElementById('tap-core');
core.addEventListener('pointerdown', function(e) {
    if (data.energy >= data.tapPower) {
        data.balance += data.tapPower;
        data.energy -= data.tapPower;
        if (tg && tg.HapticFeedback) {
            try { tg.HapticFeedback.impactOccurred('medium'); } catch (e) {}
        }
        var num = document.createElement('div');
        num.className = 'float-num';
        num.innerText = '+' + data.tapPower;
        num.style.left = e.clientX + 'px';
        num.style.top = (e.clientY - 20) + 'px';
        document.body.appendChild(num);
        setTimeout(function() { num.remove(); }, 700);
        save();
        render();
    }
});

function buyBoost(type) {
    if (type === 'tap' && data.balance >= data.tapCost) {
        data.balance -= data.tapCost;
        data.tapLvl++;
        data.tapPower += 5;
        data.tapCost = Math.floor(data.tapCost * 2);
    } else if (type === 'node' && data.balance >= data.nodeCost) {
        data.balance -= data.nodeCost;
        data.nodeLvl++;
        data.passive += 1200;
        data.nodeCost = Math.floor(data.nodeCost * 2.2);
    }
    save();
    render();
}

// РЕФЕРАЛКА И ЗАДАНИЯ
function inviteSquad() {
    var link = 'https://t.me' + BOT_NAME + '?start=' + userId;
    var text = '🔥 Залетай в $AERO Crash & Mine! Ставь на иксы как в Авиаторе и забирай дроп до листинга!';
    var url = 'https://t.meshare/url?url=' + encodeURIComponent(link) + '&text=' + encodeURIComponent(text);
    data.balance += 5000;
    save();
    render();
    if (tg && tg.openTelegramLink) {
        tg.openTelegramLink(url);
    } else {
        window.open(url, '_blank');
    }
}

function claimSocial(id, reward, url) {
    if (!data.tasks[id]) {
        data.tasks[id] = true;
        data.balance += reward;
        save();
        render();
    }
    if (tg && url.indexOf('https://t.me') === 0 && tg.openTelegramLink) {
        tg.openTelegramLink(url);
    } else {
        window.open(url, '_blank');
    }
}

function switchView(name, btn) {
    document.querySelectorAll('.view').forEach(function(v) { v.classList.remove('active'); });
    document.querySelectorAll('.nav-btn').forEach(function(b) { b.classList.remove('active'); });
    document.getElementById('view-' + name).classList.add('active');
    btn.classList.add('active');
}

function render() {
    document.getElementById('username').innerText = getNick();
    document.getElementById('ava').innerText = getNick().charAt(0).toUpperCase();
    document.getElementById('balance').innerText = Math.floor(data.balance).toLocaleString();
    document.getElementById('passive-rate').innerText = data.passive.toLocaleString();
    document.getElementById('tap-power').innerText = data.tapPower;
    document.getElementById('energy').innerText = Math.floor(data.energy);
    document.getElementById('max-energy').innerText = data.maxEnergy;
    document.getElementById('energy-bar').style.width = ((data.energy / data.maxEnergy) * 100) + '%';

    document.getElementById('lvl-tap').innerText = data.tapLvl;
    document.getElementById('cost-tap').innerText = data.tapCost.toLocaleString();
    document.getElementById('lvl-node').innerText = data.nodeLvl;
    document.getElementById('cost-node').innerText = data.nodeCost.toLocaleString();

    if (data.tasks.tg) document.getElementById('btn-tg').innerText = 'Готово ✅';
    if (data.tasks.yt) document.getElementById('btn-yt').innerText = 'Готово ✅';

    var leaders = Array.of(
        { n: 'Whale_TON 🐋', s: 420000 },
        { n: 'Blum_King', s: 185000 },
        { n: getNick() + ' (Вы)', s: Math.floor(data.balance) },
        { n: 'Aero_X100', s: 45000 }
    );
    leaders.sort(function(a, b) { return b.s - a.s; });
    var topHtml = '';
    leaders.forEach(function(l, i) {
        topHtml += '<div class="top-item"><span>#' + (i + 1) + ' ' + l.n + '</span><b style="color:#c8ff00">' + l.s.toLocaleString() + ' $AERO</b></div>';
    });
    document.getElementById('top-list').innerHTML = topHtml;
}

setInterval(function() {
    if (data.energy < data.maxEnergy) data.energy = Math.min(data.maxEnergy, data.energy + 5);
    if (data.passive > 0) data.balance += (data.passive / 3600);
    save();
    render();
}, 1000);

render();
